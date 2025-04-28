import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  TextInput,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons, Feather, MaterialIcons, FontAwesome5, AntDesign } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { db } from "../../../../firebase/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  doc,
  updateDoc
} from 'firebase/firestore';
import { useAuth } from "../../../context/authContext";
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');
// Add bottom padding value for safe area insets
const bottom = Platform.OS === 'ios' ? 34 : 16;

// Create an animated FlatList component to fix the useNativeDriver error
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export default function CustomerOrdersScreen() {
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const orderModalAnim = useRef(new Animated.Value(0)).current;
  const filterModalAnim = useRef(new Animated.Value(0)).current;

  // States
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailVisible, setOrderDetailVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeRange, setActiveRange] = useState('all');
  const [showExpandedDetails, setShowExpandedDetails] = useState(false); // New state for expanded details

  // Get authentication context
  const { user } = useAuth();

  // Log current state for debugging
  useEffect(() => {
    // Remove console.log debug statements
  }, [user, orders, filteredOrders, loading, error, activeTab]);

  // Tab options for filtering orders
  const tabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'pending', label: 'Pending' },
    { id: 'processing', label: 'Processing' },
    { id: 'shipping', label: 'Shipping' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  // Fetch orders from Firestore
  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user?.uid) {
        setError("Please log in to view your orders");
        setLoading(false);
        return;
      }

      // Get orders from the customer_order collection, filtered by user ID
      const ordersCollectionRef = collection(db, "customer_order");
      
      // Create a query to get orders for the current user
      const ordersQuery = query(
        ordersCollectionRef,
        where("userId", "==", user.uid)
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);

      if (ordersSnapshot.empty) {
        setOrders([]);
        setFilteredOrders([]);
        setLoading(false);
        return;
      }

      // Transform the firestore documents into order objects
      const userOrders = [];
      
      ordersSnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Format date fields from Firestore timestamps
        const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
        const updatedAt = data.updatedAt?.toDate ? data.updatedAt.toDate() : null;
        const estimatedDelivery = data.estimatedDeliveryTime?.toDate ? data.estimatedDeliveryTime.toDate() : null;

        // Get order items
        const items = Array.isArray(data.items) ? data.items : [];

        // Get order status history for the latest updates
        const statusHistory = data.orderStatusHistory || [];
        
        const orderObject = {
          id: doc.id,
          orderRef: data.orderRef || `Order #${doc.id.slice(0, 6)}`,
          orderNumber: data.orderRef || `Order #${doc.id.slice(0, 6)}`,
          createdAt,
          date: createdAt,
          updatedAt,
          lastUpdated: updatedAt,
          status: data.orderStatus || 'pending',
          orderStatus: data.orderStatus || 'pending',
          deliveryStatus: data.deliveryStatus || 'not_assigned',
          stockStatus: data.stockStatus || 'pending_confirmation',
          items,
          customerInfo: data.customerInfo || {},
          deliveryDetails: data.deliveryDetails || {},
          payment: data.payment || {},
          totalAmount: data.payment?.amount || 0,
          subtotal: data.payment?.subtotal || 0,
          deliveryFee: data.payment?.deliveryFee || 0,
          estimatedDelivery,
          assignedDeliveryAgent: data.assignedDeliveryAgent || null,
          orderStatusHistory: statusHistory,
          managerApproval: data.managerApproval || { approved: false },
          warehouseLocation: data.warehouseLocation || null,
          actionBy: data.actionBy || null,
          actionType: data.actionType || null,
          details: data.details || null,
        };
        
        userOrders.push(orderObject);
      });

      // Sort orders by creation date (newest first)
      userOrders.sort((a, b) => b.createdAt - a.createdAt);
      
      setOrders(userOrders);

      // Apply initial filtering based on the active tab
      filterOrdersByTab(userOrders, activeTab);

    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to load orders. Please try again.");
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user, activeTab]);

  // Initialize filterOrdersByTab before it's used
  const filterOrdersByTab = useCallback((ordersToFilter, tab) => {
    if (!ordersToFilter) {
      setFilteredOrders([]);
      return;
    }

    let filtered = [...ordersToFilter];

    // Apply search filter if query exists
    if (searchQuery) {
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.deliveryDetails?.address && order.deliveryDetails.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
        order.items.some(item => (item.productName || '').toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply status filter
    if (tab !== 'all') {
      filtered = filtered.filter(order => order.status === tab);
    }

    setFilteredOrders(filtered);
  }, [searchQuery]);

  // Effect to handle initial fetch and refresh
  useEffect(() => {
    // Animate entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 700,
        useNativeDriver: true,
      }),
    ]).start();

    // Fetch orders
    fetchOrders();
  }, [fetchOrders]);

  // Watch for active tab changes
  useEffect(() => {
    // Apply filtering when active tab or orders change
    filterOrdersByTab(orders, activeTab);
  }, [orders, activeTab, filterOrdersByTab]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  // Effect to update filtered orders when active tab changes
  useEffect(() => {
    filterOrdersByTab(orders, activeTab);
  }, [activeTab, orders, filterOrdersByTab]);

  // Effect to filter orders when search query changes
  useEffect(() => {
    filterOrdersByTab(orders, activeTab);
  }, [searchQuery, filterOrdersByTab]);

  // Update the effect for opening the order detail modal
  useEffect(() => {
    if (orderDetailVisible) {
      Animated.timing(orderModalAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(orderModalAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
      // Reset expanded details state when closing modal
      setShowExpandedDetails(false);
    }
  }, [orderDetailVisible]);

  // Update the effect for the filter modal animation
  useEffect(() => {
    if (filterModalVisible) {
      Animated.timing(filterModalAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(filterModalAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [filterModalVisible]);

  // Render header with search and filter options
  const renderHeader = () => {
    const activeTabLabel = tabs.find(tab => tab.id === activeTab)?.label || 'All Orders';

    return (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Orders</Text>
        <Text style={styles.headerSubtitle}>Track and manage all your orders</Text>

        <View style={styles.searchAndFilterContainer}>
          {isSearchVisible ? (
            <View style={styles.searchBar}>
              <Feather name="search" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
              <TextInput
                style={{ flex: 1, color: '#1e293b', fontSize: 16 }}
                placeholder="Search orders..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Feather name="x" size={18} color="#94a3b8" />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : (
            <Pressable
              style={styles.searchBar}
              onPress={() => setIsSearchVisible(true)}
            >
              <Feather name="search" size={18} color="#94a3b8" style={{ marginRight: 8 }} />
              <Text style={{ color: '#94a3b8', flex: 1 }}>Search orders...</Text>
            </Pressable>
          )}

          <Pressable
            style={[
              styles.filterButton,
              activeTab !== 'all' && {
                backgroundColor: '#eff6ff',
                borderColor: '#3b82f6'
              }
            ]}
            onPress={() => setFilterModalVisible(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather
                name="filter"
                size={20}
                color={activeTab !== 'all' ? '#3b82f6' : '#64748b'}
              />
              {activeTab !== 'all' && (
                <View style={{
                  backgroundColor: '#3b82f6',
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  position: 'absolute',
                  top: -2,
                  right: -2,
                }} />
              )}
            </View>
          </Pressable>
        </View>

        {activeTab !== 'all' && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 12,
          }}>
            <View style={{
              backgroundColor: getStatusColor(activeTab).bg,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
              <Text style={{
                fontSize: 12,
                fontWeight: '600',
                color: getStatusColor(activeTab).text,
              }}>
                {activeTabLabel}
              </Text>
              <TouchableOpacity
                onPress={() => setActiveTab('all')}
                style={{ marginLeft: 4 }}
              >
                <Feather name="x" size={12} color={getStatusColor(activeTab).text} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  // Function to get status color based on order status
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return {
          bg: '#fef3c7',
          text: '#d97706',
          gradientColors: ['#f59e0b', '#d97706']
        };
      case 'processing':
        return {
          bg: '#e0f2fe',
          text: '#0284c7',
          gradientColors: ['#0ea5e9', '#0284c7']
        };
      case 'shipping':
        return {
          bg: '#dbeafe',
          text: '#3b82f6',
          gradientColors: ['#60a5fa', '#3b82f6']
        };
      case 'delivered':
        return {
          bg: '#dcfce7',
          text: '#16a34a',
          gradientColors: ['#4ade80', '#16a34a']
        };
      case 'cancelled':
        return {
          bg: '#fee2e2',
          text: '#dc2626',
          gradientColors: ['#f87171', '#dc2626']
        };
      default:
        return {
          bg: '#f1f5f9',
          text: '#64748b',
          gradientColors: ['#94a3b8', '#64748b']
        };
    }
  };

  // Format date to readable string
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Render tabs for filtering orders by status
  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScrollView}
      >
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tabButton,
              activeTab === tab.id && {
                backgroundColor: activeTab === 'cancelled'
                  ? '#fee2e2'
                  : activeTab === 'delivered'
                    ? '#dcfce7'
                    : '#eff6ff'
              }
            ]}
            onPress={() => {
              setActiveTab(tab.id);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab.id && {
                color: activeTab === 'cancelled'
                  ? '#dc2626'
                  : activeTab === 'delivered'
                    ? '#16a34a'
                    : '#2563eb',
                fontWeight: 'bold'
              },
              activeTab !== tab.id && { color: '#64748b' }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render a single order card
  const renderOrderCard = ({ item }) => {
    if (!item) return null;
    
    const statusColors = getStatusColor(item.status || 'pending');
    const statusText = (item.status || 'pending').charAt(0).toUpperCase() + (item.status || 'pending').slice(1);
    const formattedDate = item.date ? formatDate(item.date) : 'Unknown date';

    // Ensure items exists and is an array
    const itemsArray = Array.isArray(item.items) ? item.items : [];

    // Limit items to preview
    const itemsToShow = itemsArray.slice(0, 3);
    const extraItems = itemsArray.length > 3 ? itemsArray.length - 3 : 0;

    // Default image for items without images
    const defaultItemImage = 'https://via.placeholder.com/60?text=Item';

    return (
      <Animated.View
        style={[
          styles.orderCard,
          { opacity: fadeAnim }
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          style={{ flex: 1 }}
          onPress={() => {
            setSelectedOrder(item);
            setOrderDetailVisible(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <View style={styles.orderCardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.orderStatusDot, { backgroundColor: statusColors.text }]} />
              <View>
                <Text style={styles.orderNumber}>
                  {item.orderRef || `Order #${item.id.slice(0, 6)}`}
                </Text>
                <Text style={styles.orderDate}>{formattedDate}</Text>
              </View>
            </View>

            <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
              <Text style={[styles.statusText, { color: statusColors.text }]}>
                {statusText}
              </Text>
            </View>
          </View>

          <View style={styles.orderCardBody}>
            {/* Items preview */}
            <View style={styles.itemsPreviewContainer}>
              {itemsToShow.length > 0 ? (
                <>
                  {itemsToShow.map((item, index) => (
                    <Image
                      key={item.id || index}
                      source={{ uri: item.image || defaultItemImage }}
                      style={[styles.itemPreviewImage, index === 0 && { marginLeft: 0 }]}
                      defaultSource={{ uri: defaultItemImage }}
                    />
                  ))}

                  {extraItems > 0 && (
                    <View style={styles.moreItemsContainer}>
                      <Text style={styles.moreItemsText}>+{extraItems}</Text>
                    </View>
                  )}

                  <Text style={styles.itemCountText}>
                    {itemsArray.length} {itemsArray.length === 1 ? 'item' : 'items'}
                  </Text>
                </>
              ) : (
                <Text style={styles.itemCountText}>No items</Text>
              )}
            </View>

            {/* Order details */}
            <View style={styles.orderInfoContainer}>
              {item.deliveryDetails && item.deliveryDetails.address && (
              <View style={styles.orderInfoRow}>
                <FontAwesome5 name="map-marker-alt" size={16} color="#94a3b8" style={styles.orderInfoIcon} />
                  <Text style={styles.orderInfoText} numberOfLines={2}>
                    {item.deliveryDetails.address}
                </Text>
              </View>
              )}

              {item.payment && item.payment.method && (
              <View style={styles.orderInfoRow}>
                <Feather name="credit-card" size={16} color="#94a3b8" style={styles.orderInfoIcon} />
                <Text style={styles.orderInfoText}>
                    {item.payment.method} {item.payment.provider ? `(${item.payment.provider})` : ''}
                </Text>
              </View>
              )}

              {item.status === 'shipping' && item.estimatedDelivery && (
                <View style={styles.estimatedDeliveryContainer}>
                  <Feather name="clock" size={16} color="#0d9488" style={styles.orderInfoIcon} />
                  <Text style={styles.estimatedDeliveryText}>
                    Estimated delivery: {formatDate(item.estimatedDelivery)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.orderFooter}>
            <View style={styles.orderTotal}>
              <Text style={styles.orderTotalText}>Total</Text>
              <Text style={styles.orderTotalAmount}>
                {typeof item.totalAmount === 'number'
                  ? item.totalAmount.toFixed(2)
                  : parseFloat(item.totalAmount || '0').toFixed(2)} Birr
              </Text>
            </View>

            <View style={styles.orderActions}>
              <TouchableOpacity
                style={styles.viewDetailsButton}
                onPress={() => {
                  setSelectedOrder(item);
                  setOrderDetailVisible(true);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Feather name="eye" size={16} color="white" style={{ marginRight: 6 }} />
                <Text style={styles.viewDetailsButtonText}>
                  View Details
                </Text>
              </TouchableOpacity>

              {item.status === 'shipping' && (
                <TouchableOpacity
                  style={styles.trackOrderButton}
                  onPress={() => {
                    // Navigate to tracking page
                    router.push({
                      pathname: `/(app)/customer/trackOrder`,
                      params: { orderId: item.id, trackingCode: item.trackingCode || '' }
                    });
                  }}
                >
                  <Feather name="navigation" size={16} color="#334155" style={{ marginRight: 6 }} />
                  <Text style={styles.trackOrderButtonText}>
                    Track
                  </Text>
                </TouchableOpacity>
              )}

              {item.status === 'delivered' && (
                <TouchableOpacity
                  style={styles.reviewOrderButton}
                  onPress={() => {
                    // Navigate to review page
                    router.push({
                      pathname: `/(app)/customer/reviewOrder`,
                      params: { orderId: item.id }
                    });
                  }}
                >
                  <Feather name="star" size={16} color="#334155" style={{ marginRight: 6 }} />
                  <Text style={styles.reviewOrderButtonText}>
                    Review
                  </Text>
                </TouchableOpacity>
              )}

              {item.status === 'pending' && (
                <TouchableOpacity
                  style={styles.cancelOrderButton}
                  onPress={() => {
                    // Show cancel confirmation
                    Alert.alert(
                      'Cancel Order',
                      'Are you sure you want to cancel this order?',
                      [
                        { text: 'No', style: 'cancel' },
                        {
                          text: 'Yes, Cancel',
                          style: 'destructive',
                          onPress: async () => {
                            try {
                              // Get reference to the order document
                              const orderRef = doc(db, "customer_order", item.id);

                              // Update order status to cancelled
                              await updateDoc(orderRef, {
                                orderStatus: 'cancelled',
                                updatedAt: new Date(),
                                orderStatusHistory: [
                                  ...(item.orderStatusHistory || []),
                                  {
                                    status: 'cancelled',
                                    timestamp: new Date(),
                                    updatedBy: 'customer'
                                  }
                                ]
                              });

                              // Update local state
                              const updatedOrders = orders.map(order =>
                                order.id === item.id
                                  ? {
                                    ...order,
                                    status: 'cancelled',
                                    orderStatus: 'cancelled',
                                    orderStatusHistory: [
                                      ...(order.orderStatusHistory || []),
                                      {
                                        status: 'cancelled',
                                        timestamp: new Date(),
                                        updatedBy: 'customer'
                                      }
                                    ]
                                  }
                                  : order
                              );
                              setOrders(updatedOrders);
                              filterOrdersByTab(updatedOrders, activeTab);

                              // Show success message
                              Alert.alert(
                                'Order Cancelled',
                                'Your order has been cancelled successfully.'
                              );
                            } catch (error) {
                              console.error('Error cancelling order:', error);
                              Alert.alert(
                                'Error',
                                'Failed to cancel order. Please try again.'
                              );
                            }
                          },
                        },
                      ],
                    );
                  }}
                >
                  <Feather name="x" size={16} color="#dc2626" style={{ marginRight: 6 }} />
                  <Text style={styles.cancelOrderButtonText}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Render empty state when no orders are found
  const renderEmptyState = () => {
    // Debug function to investigate the issue - remove all log statements
    const debugOrdersFetching = async () => {
      try {
        if (!user?.uid) {
          return;
        }
        
        // Try a raw query to see what's in the collection
        const ordersCollectionRef = collection(db, "customer_order");
        const allOrdersQuery = query(ordersCollectionRef);
        const allOrdersSnapshot = await getDocs(allOrdersQuery);
        
        if (allOrdersSnapshot.empty) {
          // Do nothing, no logging
        } else {
          // Don't log any order data
        }
        
        // Now try exact query for this user
        const userOrdersQuery = query(
          ordersCollectionRef,
          where("userId", "==", user.uid)
        );
        
        const userOrdersSnapshot = await getDocs(userOrdersQuery);
        
        if (!userOrdersSnapshot.empty) {
          // Don't log user order data
        }
      } catch (error) {
        console.error("Error debugging orders:", error);
      }
    };
  
    return (
    <View style={styles.noOrdersContainer}>
        {error ? (
          // Error state
          <>
            <Feather name="alert-circle" size={64} color="#ef4444" />
            <Text style={[styles.noOrdersTitle, { color: '#ef4444' }]}>
              Error Loading Orders
            </Text>
            <Text style={styles.noOrdersText}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.shopNowButton, { backgroundColor: '#ef4444' }]}
              onPress={() => fetchOrders()}
            >
              <Feather name="refresh-cw" size={20} color="white" />
              <Text style={styles.shopNowButtonText}>Try Again</Text>
            </TouchableOpacity>
            
            {/* Debug button */}
            <TouchableOpacity
              style={{
                marginTop: 20,
                backgroundColor: '#334155',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
              onPress={debugOrdersFetching}
            >
              <Feather name="terminal" size={16} color="white" style={{ marginRight: 8 }} />
              <Text style={{ color: 'white', fontWeight: '500' }}>Debug Orders</Text>
            </TouchableOpacity>
          </>
        ) : searchQuery.trim() || activeTab !== 'all' ? (
          // No search results
          <>
            <Feather name="search" size={64} color="#64748b" />
            <Text style={styles.noOrdersTitle}>
              No orders found
            </Text>
            <Text style={styles.noOrdersText}>
              Try changing your filters or search query
            </Text>
            <TouchableOpacity
              style={[styles.shopNowButton, { backgroundColor: '#64748b' }]}
              onPress={() => {
                setSearchQuery('');
                setActiveTab('all');
              }}
            >
              <Feather name="x" size={20} color="white" />
              <Text style={styles.shopNowButtonText}>Clear Filters</Text>
            </TouchableOpacity>
          </>
        ) : (
          // No orders yet
          <>
      <Image
        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4076/4076432.png' }}
        style={styles.noOrdersImage}
        resizeMode="contain"
      />
      <Text style={styles.noOrdersTitle}>
              No orders yet
      </Text>
      <Text style={styles.noOrdersText}>
              Browse our products and place your first order
      </Text>
      <TouchableOpacity
        style={styles.shopNowButton}
        onPress={() => router.push("/(app)/customer/(tabs)/homepage")}
      >
        <Feather name="shopping-bag" size={20} color="white" />
        <Text style={styles.shopNowButtonText}>Shop Now</Text>
      </TouchableOpacity>
            
            {/* Debug button */}
            <TouchableOpacity
              style={{
                marginTop: 20,
                backgroundColor: '#334155',
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
              onPress={debugOrdersFetching}
            >
              <Feather name="terminal" size={16} color="white" style={{ marginRight: 8 }} />
              <Text style={{ color: 'white', fontWeight: '500' }}>Debug Orders</Text>
            </TouchableOpacity>
          </>
        )}
    </View>
  );
  };

  // Render order detail modal
  const renderOrderDetailModal = () => {
    if (!selectedOrder) return null;

    const orderStatusColors = getStatusColor(selectedOrder.status || 'pending');
    const statusText = (selectedOrder.status || 'pending').charAt(0).toUpperCase() + (selectedOrder.status || 'pending').slice(1);

    return (
      <View style={styles.modal}>
        {/* Background pressable for closing the modal */}
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            opacity: orderModalAnim,
          }}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={() => {
              setOrderDetailVisible(false);
            }}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [
                {
                  scale: orderModalAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1]
                  })
                }
              ],
              opacity: orderModalAnim
            }
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalHeaderTitle}>Order Details</Text>
                <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setOrderDetailVisible(false)}
            >
              <Feather name="x" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>

          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            {/* Order number, date, and status */}
            <View style={[
              styles.orderDetailSection, 
              { backgroundColor: orderStatusColors.bg }
            ]}>
              <View style={styles.orderNumberContainer}>
                <Text style={[styles.orderNumberText, { color: orderStatusColors.text }]}>
                  {selectedOrder.orderRef || `Order #${selectedOrder.id.slice(0, 6)}`}
              </Text>
                <View style={[
                  styles.orderStatusBadge, 
                  { backgroundColor: 'rgba(255, 255, 255, 0.85)' }
                ]}>
                  <Text style={{ color: orderStatusColors.text, fontWeight: '600', fontSize: 12 }}>
                    {statusText}
                  </Text>
                </View>
                </View>

              <View style={styles.orderDateContainer}>
                <Feather name="calendar" size={14} color={orderStatusColors.text} style={{ marginRight: 6, opacity: 0.8 }} />
                <Text style={[styles.orderDateText, { color: orderStatusColors.text }]}>
                    {selectedOrder.createdAt ? formatDate(selectedOrder.createdAt) :
                      selectedOrder.date ? formatDate(selectedOrder.date) : 'Unknown date'}
                  </Text>
              </View>

              {/* Order progress tracker */}
              {selectedOrder.status !== 'cancelled' && (
                <View style={styles.orderProgressTracker}>
                  <View style={styles.orderProgressLine}>
                    <View style={[
                      styles.orderProgressLineFill,
                      {
                        width: selectedOrder.status === 'pending' ? '0%' :
                          selectedOrder.status === 'processing' ? '33%' :
                            selectedOrder.status === 'shipping' ? '66%' : '100%',
                        backgroundColor: orderStatusColors.text
                      }
                    ]} />
                  </View>

                  <View style={styles.orderProgressSteps}>
                    <View style={styles.orderProgressStep}>
                      <View style={[
                        styles.orderProgressDot,
                        { backgroundColor: 'white', borderColor: orderStatusColors.text }
                      ]}>
                        <Feather name="check" size={12} color={orderStatusColors.text} />
                      </View>
                      <Text style={[styles.orderProgressText, { color: orderStatusColors.text }]}>Order Placed</Text>
                    </View>

                    <View style={styles.orderProgressStep}>
                      <View style={[
                        styles.orderProgressDot,
                        {
                          backgroundColor: selectedOrder.status === 'pending' ? 'transparent' : 'white',
                          borderColor: orderStatusColors.text
                        }
                      ]}>
                        {selectedOrder.status !== 'pending' && <Feather name="check" size={12} color={orderStatusColors.text} />}
                      </View>
                      <Text style={[
                        styles.orderProgressText,
                        { 
                          color: orderStatusColors.text,
                          opacity: selectedOrder.status === 'pending' ? 0.6 : 1 
                        }
                      ]}>Processing</Text>
                    </View>

                    <View style={styles.orderProgressStep}>
                      <View style={[
                        styles.orderProgressDot,
                        {
                          backgroundColor: (selectedOrder.status === 'pending' || selectedOrder.status === 'processing')
                            ? 'transparent' : 'white',
                          borderColor: orderStatusColors.text
                        }
                      ]}>
                        {(selectedOrder.status !== 'pending' && selectedOrder.status !== 'processing') &&
                          <Feather name="check" size={12} color={orderStatusColors.text} />
                        }
                      </View>
                      <Text style={[
                        styles.orderProgressText,
                        {
                          color: orderStatusColors.text,
                          opacity: (selectedOrder.status === 'pending' || selectedOrder.status === 'processing') ? 0.6 : 1
                        }
                      ]}>Shipping</Text>
                    </View>

                    <View style={styles.orderProgressStep}>
                      <View style={[
                        styles.orderProgressDot,
                        {
                          backgroundColor: selectedOrder.status === 'delivered' ? 'white' : 'transparent',
                          borderColor: orderStatusColors.text
                        }
                      ]}>
                        {selectedOrder.status === 'delivered' && <Feather name="check" size={12} color={orderStatusColors.text} />}
                      </View>
                      <Text style={[
                        styles.orderProgressText,
                        { 
                          color: orderStatusColors.text,
                          opacity: selectedOrder.status === 'delivered' ? 1 : 0.6 
                        }
                      ]}>Delivered</Text>
                    </View>
                  </View>
                </View>
              )}
            </View>

            <View style={styles.orderDetailContent}>
              {/* Essential Order Information - Always Visible */}
              
              {/* Order Items */}
              <View style={styles.orderDetailCard}>
                <View style={styles.orderDetailCardHeader}>
                  <FontAwesome5 name="shopping-bag" size={18} color="#0ea5e9" style={{ marginRight: 8 }} />
                  <Text style={styles.orderDetailCardTitle}>
                    Order Items ({Array.isArray(selectedOrder.items) ? selectedOrder.items.length : 0})
                  </Text>
                </View>

                {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                  // Show only first 2 items if not expanded
                  (showExpandedDetails ? selectedOrder.items : selectedOrder.items.slice(0, 2)).map((item, index) => (
                    <View
                      key={item.id || index}
                      style={styles.orderItemRow}
                    >
                      <Image
                        source={{ uri: item.image || 'https://via.placeholder.com/60?text=Item' }}
                        style={styles.orderItemImage}
                        resizeMode="cover"
                        defaultSource={{ uri: 'https://via.placeholder.com/60?text=Item' }}
                      />

                      <View style={styles.orderItemDetails}>
                        <Text style={styles.orderItemName}>
                          {item.productName || `Item ${index + 1}`}
                        </Text>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                          <View style={{ flexDirection: 'row' }}>
                            <View style={styles.orderItemQuantityBadge}>
                              <Text style={styles.orderItemQuantityText}>
                                x{item.quantity || 1}
                              </Text>
                            </View>
                            {item.unitType && (
                              <Text style={{
                                marginLeft: 8,
                                fontSize: 12,
                                color: '#6b7280',
                                alignSelf: 'center'
                              }}>
                                {item.unitType}
                              </Text>
                            )}
                          </View>
                          <Text style={styles.orderItemPrice}>
                            {typeof item.totalPrice === 'number'
                              ? item.totalPrice.toFixed(2)
                              : typeof item.price === 'number'
                                ? (item.price * (item.quantity || 1)).toFixed(2)
                                : parseFloat(item.price || '0').toFixed(2)} Birr
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.noItemsContainer}>
                    <Feather name="box" size={32} color="#94a3b8" />
                    <Text style={styles.noItemsText}>No item details available</Text>
                  </View>
                )}
                
                {/* Show remaining items count or "Show More" button */}
                {!showExpandedDetails && Array.isArray(selectedOrder.items) && selectedOrder.items.length > 2 && (
                  <TouchableOpacity 
                    style={{
                      padding: 10,
                      alignItems: 'center',
                      borderTopWidth: 1,
                      borderTopColor: '#f1f5f9',
                      marginTop: 8
                    }}
                    onPress={() => setShowExpandedDetails(true)}
                  >
                    <Text style={{ color: '#3b82f6', fontWeight: '600' }}>
                      Show {selectedOrder.items.length - 2} more items
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Payment Summary - Always visible */}
                {selectedOrder.payment && (
                  <View style={styles.orderSummary}>
                    <View style={styles.orderSummaryRow}>
                      <Text style={styles.orderSummaryLabel}>
                        Subtotal
                      </Text>
                      <Text style={styles.orderSummaryValue}>
                        {selectedOrder.payment.subtotal?.toFixed(2) || '0.00'} Birr
                      </Text>
                    </View>

                    <View style={styles.orderSummaryRow}>
                      <Text style={styles.orderSummaryLabel}>
                        Delivery Fee
                      </Text>
                      <Text style={styles.orderSummaryValue}>
                        {selectedOrder.payment.deliveryFee?.toFixed(2) || '0.00'} Birr
                      </Text>
                    </View>

                    <View style={styles.orderTotalRow}>
                      <Text style={styles.orderTotalLabel}>
                        Total
                      </Text>
                      <Text style={styles.orderTotalValue}>
                        {selectedOrder.payment.amount?.toFixed(2) || '0.00'} Birr
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Delivery Address - Always visible */}
              {selectedOrder.deliveryDetails && selectedOrder.deliveryDetails.address && (
                <View style={styles.orderDetailCard}>
                  <View style={styles.orderDetailCardHeader}>
                    <Feather name="map-pin" size={18} color="#16a34a" style={{ marginRight: 8 }} />
                    <Text style={styles.orderDetailCardTitle}>
                      Delivery Address
                    </Text>
                  </View>
                  
                  <Text style={{
                    fontSize: 15,
                    color: '#334155',
                    paddingVertical: 10,
                    lineHeight: 20
                  }}>
                    {selectedOrder.deliveryDetails.address}
                  </Text>
                </View>
              )}
              
              {/* Show More Details Button - Only when not expanded */}
              {!showExpandedDetails && (
                <TouchableOpacity
                  style={{
                    backgroundColor: '#f8fafc',
                    padding: 14,
                    borderRadius: 10,
                    alignItems: 'center',
                    marginVertical: 16,
                    borderWidth: 1,
                    borderColor: '#e2e8f0'
                  }}
                  onPress={() => setShowExpandedDetails(true)}
                >
                  <Text style={{ color: '#64748b', fontWeight: '600' }}>
                    Show More Details
                  </Text>
                </TouchableOpacity>
              )}

              {/* Extended Details - Only visible when expanded */}
              {showExpandedDetails && (
                <>
              {/* Customer Details */}
              {selectedOrder.customerInfo && (
                    <View style={styles.orderDetailCard}>
                      <View style={styles.orderDetailCardHeader}>
                        <FontAwesome5 name="user-circle" size={18} color="#0ea5e9" style={{ marginRight: 8 }} />
                        <Text style={styles.orderDetailCardTitle}>
                      Customer Information
                    </Text>
                  </View>

                  <View style={styles.orderDetailRow}>
                    <View style={[styles.orderDetailIcon, { backgroundColor: '#f0f9ff' }]}>
                      <Feather name="user" size={16} color="#0ea5e9" />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderDetailLabel}>
                        Name
                      </Text>
                      <Text style={styles.orderDetailValue}>
                        {selectedOrder.customerInfo.name || 'Not available'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.orderDetailRow}>
                    <View style={[styles.orderDetailIcon, { backgroundColor: '#f0f9ff' }]}>
                      <Feather name="mail" size={16} color="#0ea5e9" />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderDetailLabel}>
                        Email
                      </Text>
                      <Text style={styles.orderDetailValue}>
                        {selectedOrder.customerInfo.email || 'Not available'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.orderDetailRow}>
                    <View style={[styles.orderDetailIcon, { backgroundColor: '#f0f9ff' }]}>
                      <Feather name="phone" size={16} color="#0ea5e9" />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderDetailLabel}>
                        Phone
                      </Text>
                      <Text style={styles.orderDetailValue}>
                        {selectedOrder.customerInfo.phoneNumber ? `+${selectedOrder.customerInfo.countryCode || '251'} ${selectedOrder.customerInfo.phoneNumber}` : 'Not available'}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

                  {/* More Delivery Details */}
              <View style={styles.orderDetailCard}>
                    <View style={styles.orderDetailCardHeader}>
                      <Feather name="map-pin" size={18} color="#16a34a" style={{ marginRight: 8 }} />
                <Text style={styles.orderDetailCardTitle}>
                  Delivery Information
                </Text>
                    </View>

                    {(selectedOrder.deliveryDetails && selectedOrder.deliveryDetails.notes) && (
                  <View style={styles.orderDetailRow}>
                    <View style={[styles.orderDetailIcon, { backgroundColor: '#f0fdf4' }]}>
                          <Feather name="file-text" size={16} color="#16a34a" />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderDetailLabel}>
                            Delivery Notes
                      </Text>
                      <Text style={styles.orderDetailValue}>
                            {selectedOrder.deliveryDetails.notes || 'No notes provided'}
                      </Text>
                    </View>
                  </View>
                )}

                    {selectedOrder.payment && (
                  <View style={styles.orderDetailRow}>
                        <View style={[styles.orderDetailIcon, { backgroundColor: '#eff6ff' }]}>
                          <Feather name="credit-card" size={16} color="#3b82f6" />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderDetailLabel}>
                            Payment Method
                      </Text>
                      <Text style={styles.orderDetailValue}>
                            {selectedOrder.payment.method ? 
                              `${selectedOrder.payment.method} ${selectedOrder.payment.provider ? `(${selectedOrder.payment.provider})` : ''}` : 
                              'Not specified'}
                      </Text>
                    </View>
                  </View>
                )}

                    {/* Payment Transaction Details */}
                    {selectedOrder.payment && selectedOrder.payment.tx_ref && (
                  <View style={styles.orderDetailRow}>
                    <View style={[styles.orderDetailIcon, { backgroundColor: '#eff6ff' }]}>
                          <Feather name="hash" size={16} color="#3b82f6" />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderDetailLabel}>
                            Transaction ID
                      </Text>
                      <Text style={styles.orderDetailValue}>
                            {selectedOrder.payment.tx_ref}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Delivery Agent Information */}
                {selectedOrder.assignedDeliveryAgent && (
                  <View style={[styles.orderDetailHighlight, { backgroundColor: '#f0fdfa' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Feather name="user-check" size={16} color="#0d9488" style={{ marginRight: 8 }} />
                      <Text style={[styles.orderDetailHighlightTitle, { color: '#0d9488' }]}>
                        Delivery Agent
                      </Text>
                    </View>

                    <View style={styles.deliveryAgentCard}>
                      <View style={styles.deliveryAgentAvatar}>
                        <FontAwesome5 name="user-alt" size={14} color="#0d9488" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.deliveryAgentName}>
                          {selectedOrder.assignedDeliveryAgent.name || 'Not assigned yet'}
                        </Text>
                        <Text style={styles.orderDetailHighlightText}>
                          Phone: {selectedOrder.assignedDeliveryAgent.phoneNumber || 'N/A'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
                  </View>

                {/* Order Status History */}
                {(selectedOrder.orderStatusHistory && selectedOrder.orderStatusHistory.length > 0) ? (
                    <View style={styles.orderDetailCard}>
                      <View style={styles.orderDetailCardHeader}>
                        <Feather name="clock" size={18} color="#7c3aed" style={{ marginRight: 8 }} />
                        <Text style={styles.orderDetailCardTitle}>
                          Order Status History
                      </Text>
                    </View>

                    {selectedOrder.orderStatusHistory.map((statusItem, index) => (
                      <View key={index} style={{
                        flexDirection: 'row',
                          paddingVertical: 10,
                        borderBottomWidth: index === selectedOrder.orderStatusHistory.length - 1 ? 0 : 1,
                          borderBottomColor: '#f1f5f9'
                      }}>
                        <View style={{
                          width: 12,
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: '#7c3aed',
                          marginTop: 4,
                            marginRight: 12
                        }} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#4c1d95' }}>
                            {statusItem.status.charAt(0).toUpperCase() + statusItem.status.slice(1)}
                          </Text>
                          <Text style={{ fontSize: 12, color: '#6b7280' }}>
                            {statusItem.timestamp?.toDate ? formatDate(statusItem.timestamp.toDate()) : 'No timestamp'}
                          </Text>
                          {statusItem.updatedBy && (
                            <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2, fontStyle: 'italic' }}>
                              Updated by: {statusItem.updatedBy}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  // Fallback for orders without explicit history
                    <View style={styles.orderDetailCard}>
                      <View style={styles.orderDetailCardHeader}>
                        <Feather name="clock" size={18} color="#7c3aed" style={{ marginRight: 8 }} />
                        <Text style={styles.orderDetailCardTitle}>
                          Order Status History
                      </Text>
                    </View>

                    <View style={{
                      flexDirection: 'row',
                        paddingVertical: 10
                    }}>
                      <View style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: '#7c3aed',
                        marginTop: 4,
                          marginRight: 12
                      }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#4c1d95' }}>
                          {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#6b7280' }}>
                          {selectedOrder.createdAt ? formatDate(selectedOrder.createdAt) : 'Unknown date'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
                  
                  {/* Show Less Button */}
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#f8fafc',
                      padding: 14,
                      borderRadius: 10,
                      alignItems: 'center',
                      marginVertical: 16,
                      borderWidth: 1,
                      borderColor: '#e2e8f0'
                    }}
                    onPress={() => setShowExpandedDetails(false)}
                  >
                    <Text style={{ color: '#64748b', fontWeight: '600' }}>
                      Show Less Details
                        </Text>
                  </TouchableOpacity>
                    </>
                  )}

              {/* Action Buttons - Always visible */}
              <View style={styles.orderActionButtons}>
                {selectedOrder.status === 'pending' && (
                  <TouchableOpacity
                    style={styles.cancelOrderButton}
                    onPress={() => {
                      setOrderDetailVisible(false);
                      // Show cancel confirmation
                      Alert.alert(
                        'Cancel Order',
                        'Are you sure you want to cancel this order?',
                        [
                          {
                            text: 'No',
                            style: 'cancel',
                          },
                          {
                            text: 'Yes, Cancel',
                            style: 'destructive',
                            onPress: async () => {
                              try {
                                // Get reference to the order document
                                const orderRef = doc(db, "customer_order", selectedOrder.id);

                                // Update order status to cancelled
                                await updateDoc(orderRef, {
                                  orderStatus: 'cancelled',
                                  updatedAt: new Date(),
                                  orderStatusHistory: [
                                    ...(selectedOrder.orderStatusHistory || []),
                                    {
                                      status: 'cancelled',
                                      timestamp: new Date(),
                                      updatedBy: 'customer'
                                    }
                                  ]
                                });

                                // Update local state
                                const updatedOrders = orders.map(order =>
                                  order.id === selectedOrder.id
                                    ? {
                                      ...order,
                                      status: 'cancelled',
                                      orderStatus: 'cancelled',
                                      orderStatusHistory: [
                                        ...(order.orderStatusHistory || []),
                                        {
                                          status: 'cancelled',
                                          timestamp: new Date(),
                                          updatedBy: 'customer'
                                        }
                                      ]
                                    }
                                    : order
                                );
                                setOrders(updatedOrders);
                                filterOrdersByTab(updatedOrders, activeTab);

                                // Show success message
                                Alert.alert(
                                  'Order Cancelled',
                                  'Your order has been cancelled successfully.'
                                );
                              } catch (error) {
                                console.error('Error cancelling order:', error);
                                Alert.alert(
                                  'Error',
                                  'Failed to cancel order. Please try again.'
                                );
                              }
                            },
                          },
                        ],
                      );
                    }}
                  >
                    <Feather name="x-circle" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryActionButtonText}>
                      Cancel Order
                    </Text>
                  </TouchableOpacity>
                )}

                {selectedOrder.status === 'shipping' && (
                  <TouchableOpacity
                    style={styles.primaryActionButton}
                    onPress={() => {
                      setOrderDetailVisible(false);
                      router.push({
                        pathname: `/(app)/customer/trackOrder`,
                        params: { trackingCode: selectedOrder.trackingCode || '' }
                      });
                    }}
                  >
                    <Feather name="navigation" size={20} color="white" style={{ marginRight: 8 }} />
                    <Text style={styles.primaryActionButtonText}>
                      Track Shipment
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    );
  };

  // Render filter modal
  const renderFilterModal = () => (
    <View style={styles.filterModal}>
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.7)',
          opacity: filterModalAnim,
        }}
      >
        <Pressable
          style={{ flex: 1 }}
          onPress={() => setFilterModalVisible(false)}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.filterModalContent,
          {
            transform: [
              {
                translateY: filterModalAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [height * 0.5, 0]
                })
              }
            ]
          }
        ]}
      >
        <View style={styles.filterModalHandle} />

        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a' }}>
            Filter Orders
          </Text>

          <TouchableOpacity
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: '#f1f5f9',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilterModalVisible(false);
            }}
          >
            <Feather name="x" size={18} color="#64748b" />
          </TouchableOpacity>
        </View>

        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#334155',
          marginBottom: 12,
        }}>
          Order Status
        </Text>

        <View style={styles.filterOptionsContainer}>
          {tabs.map(tab => {
            const statusColors = getStatusColor(tab.id);
            return (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.filterOptionCard,
                  activeTab === tab.id && { 
                    backgroundColor: statusColors.bg,
                    borderRadius: 12,
                  }
              ]}
              onPress={() => {
                setActiveTab(tab.id);
                  setFilterModalVisible(false);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
                <LinearGradient
                  colors={activeTab === tab.id ? statusColors.gradientColors : ['transparent', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                styles.filterOptionIcon,
                    { backgroundColor: activeTab === tab.id ? 'transparent' : statusColors.bg }
                  ]}
                >
                  {tab.id === 'pending' && <Feather name="clock" size={16} color={statusColors.text} />}
                  {tab.id === 'processing' && <Feather name="refresh-cw" size={16} color={statusColors.text} />}
                  {tab.id === 'shipping' && <Feather name="truck" size={16} color={statusColors.text} />}
                  {tab.id === 'delivered' && <Feather name="check-circle" size={16} color={statusColors.text} />}
                  {tab.id === 'cancelled' && <Feather name="x-circle" size={16} color={statusColors.text} />}
                  {tab.id === 'all' && <Feather name="layers" size={16} color={statusColors.text} />}
                </LinearGradient>

              <Text style={[
                styles.filterOptionText,
                  activeTab === tab.id && { 
                    color: statusColors.text,
                    fontWeight: '700'
                  }
              ]}>
                {tab.label}
              </Text>

              {activeTab === tab.id && (
                  <Animated.View 
                    style={[
                      styles.filterOptionCheckmark,
                      { backgroundColor: statusColors.text }
                    ]}
                  >
                    <Feather name="check" size={14} color="#fff" />
                  </Animated.View>
              )}
            </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.filterSeparator} />

        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#334155',
          marginVertical: 12,
        }}>
          Date Range
        </Text>

        <View style={styles.dateRangeContainer}>
          <TouchableOpacity 
            style={[
              styles.dateRangeOption,
              activeRange === 'all' && styles.dateRangeOptionActive
            ]}
            onPress={() => {
              setActiveRange('all');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={[
              styles.dateRangeText,
              activeRange === 'all' && styles.dateRangeTextActive
            ]}>All Time</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.dateRangeOption,
              activeRange === 'month' && styles.dateRangeOptionActive
            ]}
            onPress={() => {
              setActiveRange('month');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={[
              styles.dateRangeText,
              activeRange === 'month' && styles.dateRangeTextActive
            ]}>This Month</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.dateRangeOption,
              activeRange === 'week' && styles.dateRangeOptionActive
            ]}
            onPress={() => {
              setActiveRange('week');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={[
              styles.dateRangeText,
              activeRange === 'week' && styles.dateRangeTextActive
            ]}>This Week</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterButtonsContainer}>
          <TouchableOpacity
            style={styles.resetFilterButton}
            onPress={() => {
              setActiveTab('all');
              setActiveRange('all');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            <Feather name="refresh-cw" size={16} color="#475569" style={{ marginRight: 6 }} />
            <Text style={styles.resetFilterButtonText}>Reset All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.applyFilterButton}
            onPress={() => {
              setFilterModalVisible(false);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            <Text style={styles.applyFilterButtonText}>Apply Filters</Text>
            <Feather name="check" size={16} color="white" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );

  // Loading state
  if (loading && !isRefreshing) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
          <Text style={{ marginTop: 12, fontSize: 16, color: '#64748b' }}>
            Loading your orders...
          </Text>
          <Text style={{ marginTop: 4, fontSize: 12, color: '#94a3b8' }}>
            This may take a moment
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />

      {renderHeader()}

      <AnimatedFlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderCard}
        contentContainerStyle={{
          paddingBottom: 24,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#0ea5e9"
            colors={['#0ea5e9']}
          />
        }
      />

      {orderDetailVisible && selectedOrder && renderOrderDetailModal()}
      {filterModalVisible && renderFilterModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4', // Light green background
  },
  header: {
    padding: 16,
    backgroundColor: '#22C55E', // Light green header
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 16,
  },
  searchAndFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1.41,
    elevation: 2,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1.41,
    elevation: 2,
  },
  tabsContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: 'white',
  },
  tabScrollView: {
    paddingHorizontal: 16,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 16,
    marginBottom: 0,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 12,
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  orderCardBody: {
    padding: 16,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  orderDate: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  orderStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    justifyContent: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderItemRow: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  orderItemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f1f5f9',
  },
  orderItemDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  orderItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f766e',
  },
  orderItemQuantityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
  },
  orderItemQuantityText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  orderFooter: {
    padding: 16,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  orderTotalText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  orderTotalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f766e',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  viewDetailsButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#0ea5e9',
    marginRight: 8,
  },
  viewDetailsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  trackOrderButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    marginLeft: 8,
  },
  trackOrderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  reviewOrderButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    marginLeft: 8,
  },
  reviewOrderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  cancelOrderButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    marginLeft: 8,
  },
  cancelOrderButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#dc2626',
  },
  noOrdersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 400,
  },
  noOrdersImage: {
    width: 150,
    height: 150,
    opacity: 0.8,
    marginBottom: 16,
  },
  noOrdersTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 8,
    textAlign: 'center',
  },
  noOrdersText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
  },
  shopNowButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  shopNowButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    elevation: 10,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    width: width * 0.9,
    maxHeight: height * 0.85,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderDetailSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  orderNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  orderStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderDateText: {
    fontSize: 14,
  },
  orderProgressTracker: {
    marginTop: 24,
    marginBottom: 8,
  },
  orderProgressLine: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  orderProgressLineFill: {
    height: 4,
    borderRadius: 2,
  },
  orderProgressSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  orderProgressStep: {
    alignItems: 'center',
    width: 70,
  },
  orderProgressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
  },
  orderProgressText: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  orderDetailContent: {
    padding: 16,
  },
  orderDetailCard: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  orderDetailCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  orderDetailCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  orderDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  orderDetailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderDetailLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  orderDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  orderDetailHighlight: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f0fdfa',
  },
  orderDetailHighlightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0d9488',
    marginBottom: 8,
  },
  orderDetailHighlightText: {
    fontSize: 14,
    color: '#0d9488',
    marginBottom: 4,
  },
  deliveryAgentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  deliveryAgentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deliveryAgentName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  deliveryAgentRating: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 4,
  },
  orderSummary: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  orderSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderSummaryLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  orderSummaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  orderTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  orderTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  orderTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f766e',
  },
  orderActionButtons: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 16,
  },
  cancelOrderButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  primaryActionButton: {
    flex: 1,
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  secondaryActionButton: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  secondaryActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  noItemsContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noItemsText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
  },
  filterModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  filterModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: bottom + 8,
    maxHeight: height * 0.7,
  },
  filterModalHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  filterOptionsContainer: {
    marginBottom: 12,
  },
  filterOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterOptionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  filterOptionText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  filterOptionCheckmark: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 8,
  },
  resetFilterButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  resetFilterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  applyFilterButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  applyFilterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  itemsPreviewContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    alignItems: 'center',
  },
  moreItemsContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  moreItemsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#475569',
  },
  itemPreviewImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginLeft: -8,
    borderWidth: 2,
    borderColor: 'white',
  },
  itemCountText: {
    marginLeft: 8,
    color: '#64748b',
    fontSize: 14,
  },
  orderInfoContainer: {
    marginTop: 16,
  },
  orderInfoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  orderInfoIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  orderInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#64748b',
  },
  estimatedDeliveryContainer: {
    flexDirection: 'row',
    marginTop: 8,
    backgroundColor: '#f0fdfa',
    padding: 8,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
  estimatedDeliveryText: {
    flex: 1,
    fontSize: 14,
    color: '#0d9488',
  },
  filterSeparator: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dateRangeOption: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 3,
    alignItems: 'center',
  },
  dateRangeOptionActive: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#3b82f6',
  },
  dateRangeText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  dateRangeTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
});
