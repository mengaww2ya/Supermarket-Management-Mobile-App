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

// Create an animated FlatList component to fix the useNativeDriver error
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export default function CustomerOrdersScreen() {
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

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
  
  // Get authentication context
  const { user } = useAuth();

  // Tab options for filtering orders
  const tabs = [
    { id: 'all', label: 'All Orders' },
    { id: 'pending', label: 'Pending' },
    { id: 'processing', label: 'Processing' },
    { id: 'shipping', label: 'Shipping' },
    { id: 'delivered', label: 'Delivered' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  // Mock data for development and testing
  const createMockOrders = useCallback(() => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    return [
      {
        id: 'order-1',
        orderNumber: 'ORD-8392',
        date: now,
        status: 'pending',
        totalAmount: 234.50,
        items: [
          { id: 'item-1', name: 'Organic Apple', quantity: 3, price: 25.50, image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6' },
          { id: 'item-2', name: 'Fresh Milk', quantity: 2, price: 45.00, image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150' },
          { id: 'item-3', name: 'Whole Wheat Bread', quantity: 1, price: 68.00, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff' },
        ],
        deliveryAddress: '123 Main Street, Addis Ababa',
        paymentMethod: 'Cash on Delivery',
        deliveryDate: null,
        trackingCode: 'TRK293847',
      },
      {
        id: 'order-2',
        orderNumber: 'ORD-7291',
        date: yesterday,
        status: 'processing',
        totalAmount: 547.75,
        items: [
          { id: 'item-4', name: 'Chicken Breast', quantity: 1, price: 175.25, image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791' },
          { id: 'item-5', name: 'Pasta', quantity: 2, price: 125.00, image: 'https://images.unsplash.com/photo-1551462147-37885acc36f1' },
          { id: 'item-6', name: 'Tomato Sauce', quantity: 1, price: 85.50, image: 'https://images.unsplash.com/photo-1608949621330-a7f43c279142' },
          { id: 'item-7', name: 'Cheese', quantity: 1, price: 37.00, image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d' },
        ],
        deliveryAddress: '456 Oak Avenue, Bahir Dar',
        paymentMethod: 'Credit Card',
        deliveryDate: null,
        trackingCode: 'TRK748392',
      },
      {
        id: 'order-3',
        orderNumber: 'ORD-6182',
        date: lastWeek,
        status: 'delivered',
        totalAmount: 362.25,
        items: [
          { id: 'item-8', name: 'Rice', quantity: 1, price: 125.75, image: 'https://images.unsplash.com/photo-1586201375761-83865001e8d7' },
          { id: 'item-9', name: 'Vegetable Mix', quantity: 1, price: 95.50, image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999' },
          { id: 'item-10', name: 'Olive Oil', quantity: 1, price: 141.00, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5' },
        ],
        deliveryAddress: '789 Pine Road, Hawassa',
        paymentMethod: 'Mobile Payment',
        deliveryDate: new Date(lastWeek.getTime() + (2 * 24 * 60 * 60 * 1000)),
        trackingCode: 'TRK583921',
        deliveryAgent: {
          name: 'John Doe',
          phone: '+251987654321',
          rating: 4.8,
        },
      },
      {
        id: 'order-4',
        orderNumber: 'ORD-5429',
        date: new Date(lastWeek.getTime() - (5 * 24 * 60 * 60 * 1000)),
        status: 'cancelled',
        totalAmount: 187.50,
        items: [
          { id: 'item-11', name: 'Bottled Water (Pack)', quantity: 2, price: 75.00, image: 'https://images.unsplash.com/photo-1616118132534-381148898bb4' },
          { id: 'item-12', name: 'Cookies', quantity: 1, price: 37.50, image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e' },
        ],
        deliveryAddress: '101 Cedar Lane, Dire Dawa',
        paymentMethod: 'Cash on Delivery',
        deliveryDate: null,
        cancellationReason: 'Customer requested cancellation',
        trackingCode: 'TRK129384',
      },
      {
        id: 'order-5',
        orderNumber: 'ORD-4372',
        date: new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000)),
        status: 'delivered',
        totalAmount: 724.30,
        items: [
          { id: 'item-13', name: 'Coffee Beans', quantity: 1, price: 198.50, image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd' },
          { id: 'item-14', name: 'Tea Assortment', quantity: 1, price: 156.80, image: 'https://images.unsplash.com/photo-1523920290228-4f321a939b4c' },
          { id: 'item-15', name: 'Honey', quantity: 1, price: 124.00, image: 'https://images.unsplash.com/photo-1587049352851-8d4e89133924' },
          { id: 'item-16', name: 'Breakfast Cereal', quantity: 2, price: 122.50, image: 'https://images.unsplash.com/photo-1545082376-d3face9bc559' },
        ],
        deliveryAddress: '202 Maple Court, Gondar',
        paymentMethod: 'Credit Card',
        deliveryDate: new Date(now.getTime() - (12 * 24 * 60 * 60 * 1000)),
        trackingCode: 'TRK675821',
        deliveryAgent: {
          name: 'Jane Smith',
          phone: '+251912345678',
          rating: 4.9,
        },
      },
      {
        id: 'order-6',
        orderNumber: 'ORD-3291',
        date: new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000)),
        status: 'shipping',
        totalAmount: 412.75,
        items: [
          { id: 'item-17', name: 'Fresh Vegetables Mix', quantity: 1, price: 145.25, image: 'https://images.unsplash.com/photo-1466551359784-f9e121d4807e' },
          { id: 'item-18', name: 'Fruits Basket', quantity: 1, price: 267.50, image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf' },
        ],
        deliveryAddress: '303 Elm Boulevard, Mekelle',
        paymentMethod: 'Mobile Payment',
        deliveryDate: null,
        trackingCode: 'TRK429876',
        estimatedDelivery: new Date(now.getTime() + (1 * 24 * 60 * 60 * 1000)),
      },
    ];
  }, []);

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
      
      // Create reference to the user's orders collection
      const userRef = doc(db, "users", user.uid);
      const ordersCollectionRef = collection(userRef, "orders");
      
      // Get all orders
      const ordersSnapshot = await getDocs(ordersCollectionRef);
      
      if (ordersSnapshot.empty) {
        console.log("No orders found for this user");
        setOrders([]);
        setFilteredOrders([]);
      } else {
        const ordersData = ordersSnapshot.docs.map(doc => {
          const data = doc.data();
          
          // Format date fields from Firestore timestamps
          const date = data.date?.toDate ? data.date.toDate() : new Date();
          const deliveryDate = data.deliveryDate?.toDate ? data.deliveryDate.toDate() : null;
          const estimatedDelivery = data.estimatedDelivery?.toDate ? data.estimatedDelivery.toDate() : null;
          
          return {
            id: doc.id,
            ...data,
            date,
            deliveryDate,
            estimatedDelivery,
            // Ensure totalAmount is a number
            totalAmount: typeof data.totalAmount === 'number' ? data.totalAmount : parseFloat(data.totalAmount || '0'),
            // Ensure items is an array
            items: Array.isArray(data.items) ? data.items : [],
          };
        });
        
        console.log(`Found ${ordersData.length} orders for user ${user.uid}`);
        setOrders(ordersData);
        
        // Apply initial filtering based on the active tab
        filterOrdersByTab(ordersData, activeTab);
      }
      
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to load orders. Please try again.");
      
      // Use mock data as fallback ONLY in development
      if (__DEV__) {
        console.log("Using mock data as fallback in development");
        const mockOrders = createMockOrders();
        setOrders(mockOrders);
        filterOrdersByTab(mockOrders, activeTab);
      } else {
        setOrders([]);
        setFilteredOrders([]);
      }
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user, createMockOrders, activeTab, filterOrdersByTab]);

  // Filter orders based on active tab
  const filterOrdersByTab = useCallback((ordersList, tab) => {
    if (tab === 'all') {
      setFilteredOrders(ordersList);
      return;
    }
    
    const filtered = ordersList.filter(order => order.status === tab);
    setFilteredOrders(filtered);
  }, []);

  // Filter orders based on search query
  const filterOrdersBySearch = useCallback((query) => {
    if (!query.trim()) {
      filterOrdersByTab(orders, activeTab);
      return;
    }
    
    const searchLower = query.toLowerCase().trim();
    
    const filtered = orders.filter(order => {
      return (
        order.orderNumber.toLowerCase().includes(searchLower) ||
        order.deliveryAddress.toLowerCase().includes(searchLower) ||
        order.items.some(item => item.name.toLowerCase().includes(searchLower))
      );
    });
    
    setFilteredOrders(filtered);
  }, [orders, activeTab, filterOrdersByTab]);

  // Refresh control handler
  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  // Effect to fetch orders on mount and when tab changes
  useEffect(() => {
    fetchOrders();
    
    // Animate entrance
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fetchOrders]);

  // Effect to update filtered orders when active tab changes
  useEffect(() => {
    filterOrdersByTab(orders, activeTab);
  }, [activeTab, orders, filterOrdersByTab]);

  // Effect to filter orders when search query changes
  useEffect(() => {
    filterOrdersBySearch(searchQuery);
  }, [searchQuery, filterOrdersBySearch]);

  // Render header with search and filter options
  const renderHeader = () => (
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
          <Feather 
            name="filter" 
            size={20} 
            color={activeTab !== 'all' ? '#3b82f6' : '#64748b'} 
          />
        </Pressable>
      </View>
    </View>
  );

  // Function to get status color based on order status
  const getStatusColor = (status) => {
    switch(status) {
      case 'pending':
        return {
          bg: '#fef3c7',
          text: '#d97706'
        };
      case 'processing':
        return {
          bg: '#e0f2fe',
          text: '#0284c7'
        };
      case 'shipping':
        return {
          bg: '#dbeafe',
          text: '#3b82f6'
        };
      case 'delivered':
        return {
          bg: '#dcfce7',
          text: '#16a34a'
        };
      case 'cancelled':
        return {
          bg: '#fee2e2',
          text: '#dc2626'
        };
      default:
        return {
          bg: '#f1f5f9',
          text: '#64748b'
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
          { opacity: fadeAnim, transform: [{ translateY }] }
        ]}
      >
        <View style={styles.orderCardHeader}>
          <View>
            <Text style={styles.orderNumber}>{item.orderNumber || `Order #${item.id.slice(0, 6)}`}</Text>
            <Text style={styles.orderDate}>{formattedDate}</Text>
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
                
                <Text style={{ marginLeft: 8, color: '#64748b', fontSize: 14 }}>
                  {itemsArray.length} {itemsArray.length === 1 ? 'item' : 'items'}
                </Text>
              </>
            ) : (
              <Text style={{ color: '#64748b', fontSize: 14 }}>No items</Text>
            )}
          </View>
          
          {/* Order details */}
          <View style={{ marginTop: 16 }}>
            <View style={{ flexDirection: 'row', marginBottom: 8 }}>
              <FontAwesome5 name="map-marker-alt" size={16} color="#94a3b8" style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={{ flex: 1, fontSize: 14, color: '#64748b' }}>
                {item.deliveryAddress || 'No address provided'}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row' }}>
              <Feather name="credit-card" size={16} color="#94a3b8" style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={{ flex: 1, fontSize: 14, color: '#64748b' }}>
                {item.paymentMethod || 'Payment info not available'}
              </Text>
            </View>
            
            {item.status === 'shipping' && item.estimatedDelivery && (
              <View style={{ flexDirection: 'row', marginTop: 8, backgroundColor: '#f0fdfa', padding: 8, borderRadius: 8 }}>
                <Feather name="clock" size={16} color="#0d9488" style={{ marginRight: 8, marginTop: 2 }} />
                <Text style={{ flex: 1, fontSize: 14, color: '#0d9488' }}>
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
              ${typeof item.totalAmount === 'number' 
                ? item.totalAmount.toFixed(2) 
                : parseFloat(item.totalAmount || '0').toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.orderActions}>
            <TouchableOpacity 
              style={[styles.orderActionButton, styles.primaryButton]}
              onPress={() => {
                setSelectedOrder(item);
                setOrderDetailVisible(true);
              }}
            >
              <Feather name="eye" size={16} color="white" style={{ marginRight: 6 }} />
              <Text style={[styles.buttonText, styles.primaryButtonText]}>
                View Details
              </Text>
            </TouchableOpacity>
            
            {item.status === 'shipping' && (
              <TouchableOpacity 
                style={[styles.orderActionButton, styles.secondaryButton]}
                onPress={() => {
                  // Navigate to tracking page
                  router.push({
                    pathname: `/(app)/customer/trackOrder`,
                    params: { trackingCode: item.trackingCode || '' }
                  });
                }}
              >
                <Feather name="navigation" size={16} color="#334155" style={{ marginRight: 6 }} />
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  Track Order
                </Text>
              </TouchableOpacity>
            )}
            
            {item.status === 'delivered' && (
              <TouchableOpacity 
                style={[styles.orderActionButton, styles.secondaryButton]}
                onPress={() => {
                  // Navigate to review page
                  router.push({
                    pathname: `/(app)/customer/reviewOrder`,
                    params: { orderId: item.id }
                  });
                }}
              >
                <Feather name="star" size={16} color="#334155" style={{ marginRight: 6 }} />
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  Leave Review
                </Text>
              </TouchableOpacity>
            )}
            
            {item.status === 'pending' && (
              <TouchableOpacity 
                style={[styles.orderActionButton, styles.secondaryButton]}
                onPress={() => {
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
                            const userRef = doc(db, "users", user.uid);
                            const orderRef = doc(collection(userRef, "orders"), item.id);
                            
                            // Update order status to cancelled
                            await updateDoc(orderRef, {
                              status: 'cancelled',
                              cancellationReason: 'Customer requested cancellation',
                              updatedAt: new Date()
                            });
                            
                            // Update local state
                            const updatedOrders = orders.map(order => 
                              order.id === item.id 
                                ? { 
                                    ...order, 
                                    status: 'cancelled', 
                                    cancellationReason: 'Customer requested cancellation' 
                                  }
                                : order
                            );
                            setOrders(updatedOrders);
                            
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
                <Feather name="x" size={16} color="#334155" style={{ marginRight: 6 }} />
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  // Render empty state when no orders are found
  const renderEmptyState = () => (
    <View style={styles.noOrdersContainer}>
      <Image
        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/4076/4076432.png' }}
        style={styles.noOrdersImage}
        resizeMode="contain"
      />
      
      <Text style={styles.noOrdersTitle}>
        {searchQuery.trim() || activeTab !== 'all'
          ? 'No orders found'
          : 'No orders yet'}
      </Text>
      
      <Text style={styles.noOrdersText}>
        {searchQuery.trim() || activeTab !== 'all'
          ? 'Try changing your filters or search query'
          : 'Browse our products and place your first order'}
      </Text>
      
      <TouchableOpacity 
        style={styles.shopNowButton}
        onPress={() => router.push("/(app)/customer/(tabs)/homepage")}
      >
        <Feather name="shopping-bag" size={20} color="white" />
        <Text style={styles.shopNowButtonText}>Shop Now</Text>
      </TouchableOpacity>
    </View>
  );

  // Render order detail modal
  const renderOrderDetailModal = () => {
    if (!selectedOrder) return null;
    
    const orderStatusColors = getStatusColor(selectedOrder.status || 'pending');
    const statusText = (selectedOrder.status || 'pending').charAt(0).toUpperCase() + (selectedOrder.status || 'pending').slice(1);
    
    return (
      <View style={styles.modal}>
        {/* Background pressable for closing the modal */}
        <Pressable 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
          onPress={() => setOrderDetailVisible(false)}
        />
        
        <View style={styles.modalContent}>
          <ScrollView>
            <LinearGradient
              colors={['#0ea5e9', '#0284c7']}
              style={{
                padding: 20,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
              }}
            >
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: 'bold', 
                  color: 'white' 
                }}>
                  Order Details
                </Text>
                
                <TouchableOpacity
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={() => setOrderDetailVisible(false)}
                >
                  <Feather name="x" size={20} color="white" />
                </TouchableOpacity>
              </View>
              
              <View style={{ marginTop: 12 }}>
                <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.7)' }}>
                  Order Number
                </Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white' }}>
                  {selectedOrder.orderNumber || `Order #${selectedOrder.id.slice(0, 6)}`}
                </Text>
              </View>
              
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                marginTop: 12 
              }}>
                <View>
                  <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.7)' }}>
                    Ordered on
                  </Text>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: 'white' }}>
                    {selectedOrder.date ? formatDate(selectedOrder.date) : 'Unknown date'}
                  </Text>
                </View>
                
                <View style={{ 
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: 12
                }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: 'white' }}>
                    {statusText}
                  </Text>
                </View>
              </View>
            </LinearGradient>
            
            <View style={{ padding: 20 }}>
              {/* Delivery Details */}
              <View style={{
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                shadowColor: '#0f172a',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 2,
                borderWidth: 1,
                borderColor: '#f1f5f9',
              }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 12 }}>
                  Delivery Information
                </Text>
                
                <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                  <View style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 20, 
                    backgroundColor: '#f0fdf4',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12
                  }}>
                    <Feather name="map-pin" size={16} color="#16a34a" />
                  </View>
                  
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 2 }}>
                      Delivery Address
                    </Text>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#334155' }}>
                      {selectedOrder.deliveryAddress}
                    </Text>
                  </View>
                </View>
                
                <View style={{ flexDirection: 'row' }}>
                  <View style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 20, 
                    backgroundColor: '#eff6ff',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12
                  }}>
                    <Feather name="credit-card" size={16} color="#3b82f6" />
                  </View>
                  
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 2 }}>
                      Payment Method
                    </Text>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#334155' }}>
                      {selectedOrder.paymentMethod}
                    </Text>
                  </View>
                </View>
                
                {selectedOrder.status === 'shipping' && (
                  <View style={{ 
                    marginTop: 16,
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: '#f0fdfa',
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Feather name="truck" size={16} color="#0d9488" style={{ marginRight: 8 }} />
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#0d9488' }}>
                        Shipment Details
                      </Text>
                    </View>
                    
                    <Text style={{ fontSize: 14, color: '#0d9488', marginBottom: 4 }}>
                      Tracking Code: {selectedOrder.trackingCode}
                    </Text>
                    
                    {selectedOrder.estimatedDelivery && (
                      <Text style={{ fontSize: 14, color: '#0d9488' }}>
                        Estimated Delivery: {formatDate(selectedOrder.estimatedDelivery)}
                      </Text>
                    )}
                  </View>
                )}
                
                {selectedOrder.status === 'delivered' && selectedOrder.deliveryDate && (
                  <View style={{ 
                    marginTop: 16,
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: '#f0fdf4',
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Feather name="check-circle" size={16} color="#16a34a" style={{ marginRight: 8 }} />
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#16a34a' }}>
                        Delivery Completed
                      </Text>
                    </View>
                    
                    <Text style={{ fontSize: 14, color: '#16a34a' }}>
                      Delivered on: {formatDate(selectedOrder.deliveryDate)}
                    </Text>
                    
                    {selectedOrder.deliveryAgent && (
                      <View style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        marginTop: 8,
                        backgroundColor: 'white',
                        padding: 8,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: '#dcfce7',
                      }}>
                        <View style={{ 
                          width: 36, 
                          height: 36, 
                          borderRadius: 18,
                          backgroundColor: '#f0fdf4',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 8,
                        }}>
                          <FontAwesome5 name="user-alt" size={14} color="#16a34a" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '500', color: '#334155' }}>
                            {selectedOrder.deliveryAgent.name}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="star" size={12} color="#f59e0b" />
                            <Text style={{ fontSize: 12, color: '#64748b', marginLeft: 4 }}>
                              {selectedOrder.deliveryAgent.rating} Rating
                            </Text>
                          </View>
                        </View>
                      </View>
                    )}
                  </View>
                )}
                
                {selectedOrder.status === 'cancelled' && (
                  <View style={{ 
                    marginTop: 16,
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: '#fee2e2',
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Feather name="x-circle" size={16} color="#dc2626" style={{ marginRight: 8 }} />
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#dc2626' }}>
                        Order Cancelled
                      </Text>
                    </View>
                    
                    <Text style={{ fontSize: 14, color: '#dc2626' }}>
                      Reason: {selectedOrder.cancellationReason || 'Not specified'}
                    </Text>
                  </View>
                )}
              </View>
              
              {/* Order Items */}
              <View style={{
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
                shadowColor: '#0f172a',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
                elevation: 2,
                borderWidth: 1,
                borderColor: '#f1f5f9',
              }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', marginBottom: 12 }}>
                  Order Items ({Array.isArray(selectedOrder.items) ? selectedOrder.items.length : 0})
                </Text>
                
                {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, index) => (
                    <View 
                      key={item.id || index}
                      style={{
                        flexDirection: 'row',
                        marginBottom: index < selectedOrder.items.length - 1 ? 12 : 0,
                        paddingBottom: index < selectedOrder.items.length - 1 ? 12 : 0,
                        borderBottomWidth: index < selectedOrder.items.length - 1 ? 1 : 0,
                        borderBottomColor: '#f1f5f9',
                      }}
                    >
                      <Image 
                        source={{ uri: item.image || 'https://via.placeholder.com/60?text=Item' }}
                        style={styles.orderItemImage}
                        resizeMode="cover"
                        defaultSource={{ uri: 'https://via.placeholder.com/60?text=Item' }}
                      />
                      
                      <View style={styles.orderItemDetails}>
                        <Text style={styles.orderItemName}>
                          {item.name || `Item ${index + 1}`}
                        </Text>
                        
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Text style={styles.orderItemQuantity}>
                            Qty: {item.quantity || 1}
                          </Text>
                          <Text style={styles.orderItemPrice}>
                            ${typeof item.price === 'number' 
                              ? (item.price * (item.quantity || 1)).toFixed(2) 
                              : parseFloat(item.price || '0').toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={{ padding: 16, alignItems: 'center' }}>
                    <Text style={{ color: '#94a3b8' }}>No item details available</Text>
                  </View>
                )}
                
                <View style={{ 
                  marginTop: 16,
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: '#f1f5f9',
                }}>
                  <View style={{ 
                    flexDirection: 'row', 
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}>
                    <Text style={{ fontSize: 14, color: '#64748b' }}>
                      Subtotal
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#334155' }}>
                      ${typeof selectedOrder.totalAmount === 'number' 
                        ? (selectedOrder.totalAmount * 0.85).toFixed(2) 
                        : (parseFloat(selectedOrder.totalAmount || '0') * 0.85).toFixed(2)}
                    </Text>
                  </View>
                  
                  <View style={{ 
                    flexDirection: 'row', 
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}>
                    <Text style={{ fontSize: 14, color: '#64748b' }}>
                      Delivery Fee
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#334155' }}>
                      ${typeof selectedOrder.totalAmount === 'number' 
                        ? (selectedOrder.totalAmount * 0.1).toFixed(2) 
                        : (parseFloat(selectedOrder.totalAmount || '0') * 0.1).toFixed(2)}
                    </Text>
                  </View>
                  
                  <View style={{ 
                    flexDirection: 'row', 
                    justifyContent: 'space-between',
                    marginBottom: 8,
                  }}>
                    <Text style={{ fontSize: 14, color: '#64748b' }}>
                      Tax
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#334155' }}>
                      ${typeof selectedOrder.totalAmount === 'number' 
                        ? (selectedOrder.totalAmount * 0.05).toFixed(2) 
                        : (parseFloat(selectedOrder.totalAmount || '0') * 0.05).toFixed(2)}
                    </Text>
                  </View>
                  
                  <View style={{ 
                    flexDirection: 'row', 
                    justifyContent: 'space-between',
                    marginTop: 8,
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: '#f1f5f9',
                  }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0f172a' }}>
                      Total
                    </Text>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0f766e' }}>
                      ${typeof selectedOrder.totalAmount === 'number' 
                        ? selectedOrder.totalAmount.toFixed(2) 
                        : parseFloat(selectedOrder.totalAmount || '0').toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                {(selectedOrder.status === 'pending' || selectedOrder.status === 'processing') && (
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: selectedOrder.status === 'pending' ? '#ef4444' : '#f97316',
                      paddingVertical: 14,
                      borderRadius: 8,
                      alignItems: 'center',
                      marginRight: 8,
                    }}
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
                                const userRef = doc(db, "users", user.uid);
                                const orderRef = doc(collection(userRef, "orders"), selectedOrder.id);
                                
                                // Update order status to cancelled
                                await updateDoc(orderRef, {
                                  status: 'cancelled',
                                  cancellationReason: 'Customer requested cancellation',
                                  updatedAt: new Date()
                                });
                                
                                // Update local state
                                const updatedOrders = orders.map(order => 
                                  order.id === selectedOrder.id 
                                    ? { 
                                        ...order, 
                                        status: 'cancelled', 
                                        cancellationReason: 'Customer requested cancellation' 
                                      }
                                    : order
                                );
                                setOrders(updatedOrders);
                                
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
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'white' }}>
                      Cancel Order
                    </Text>
                  </TouchableOpacity>
                )}
                
                {selectedOrder.status === 'shipping' && (
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: '#3b82f6',
                      paddingVertical: 14,
                      borderRadius: 8,
                      alignItems: 'center',
                    }}
                    onPress={() => {
                      setOrderDetailVisible(false);
                      router.push({
                        pathname: `/(app)/customer/trackOrder`,
                        params: { trackingCode: selectedOrder.trackingCode || '' }
                      });
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'white' }}>
                      Track Shipment
                    </Text>
                  </TouchableOpacity>
                )}
                
                {selectedOrder.status === 'delivered' && (
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: '#0ea5e9',
                      paddingVertical: 14,
                      borderRadius: 8,
                      alignItems: 'center',
                      marginRight: 8,
                    }}
                    onPress={() => {
                      setOrderDetailVisible(false);
                      router.push({
                        pathname: `/(app)/customer/reviewOrder`,
                        params: { orderId: selectedOrder.id }
                      });
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'white' }}>
                      Leave Review
                    </Text>
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: '#f1f5f9',
                    paddingVertical: 14,
                    borderRadius: 8,
                    alignItems: 'center',
                    ...(selectedOrder.status === 'delivered' ? { marginLeft: 0 } : {}),
                  }}
                  onPress={() => {
                    setOrderDetailVisible(false);
                    // In a real app, this would navigate to customer support or reorder
                    router.push({
                      pathname: `/(app)/customer/(tabs)/supportChat`,
                    });
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#334155' }}>
                    Need Help
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

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
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {renderHeader()}
      {renderTabs()}
      
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
            onRefresh={onRefresh}
            tintColor="#0ea5e9"
            colors={['#0ea5e9']}
          />
        }
      />
      
      {orderDetailVisible && selectedOrder && renderOrderDetailModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  searchAndFilterContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginRight: 8,
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#64748b',
  },
  orderItemQuantity: {
    fontSize: 14,
    color: '#64748b',
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
  orderActionButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: '#0ea5e9',
    marginRight: 8,
  },
  secondaryButton: {
    backgroundColor: '#f1f5f9',
    marginLeft: 8,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButtonText: {
    color: 'white',
  },
  secondaryButtonText: {
    color: '#334155',
  },
  noOrdersContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  noOrdersImage: {
    width: 200,
    height: 200,
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
    zIndex: 10000,
    elevation: 10,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    width: width * 0.9,
    maxHeight: height * 0.8,
  },
  filterModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  filterModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  lottieContainer: {
    width: 150,
    height: 150,
    marginBottom: 20,
    alignSelf: 'center',
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
    width: 28,
    height: 28,
    borderRadius: 14,
    marginLeft: -8,
    borderWidth: 2,
    borderColor: 'white',
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 1,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
