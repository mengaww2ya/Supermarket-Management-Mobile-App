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
      
      // Get only the current user's orders
      const ordersCollectionRef = collection(db, "users", user.uid, "orders");
      const ordersSnapshot = await getDocs(ordersCollectionRef);
      
      if (ordersSnapshot.empty) {
        console.log("No orders found for this user");
        setOrders([]);
        setFilteredOrders([]);
        setLoading(false);
        return;
      }
      
      const userOrders = ordersSnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Format date fields from Firestore timestamps
        const date = data.createdAt?.toDate ? data.createdAt.toDate() : 
                      data.date?.toDate ? data.date.toDate() : new Date();
        const deliveryDate = data.deliveryDate?.toDate ? data.deliveryDate.toDate() : null;
        const estimatedDelivery = data.estimatedDelivery?.toDate ? data.estimatedDelivery.toDate() : null;
        const lastUpdated = data.lastUpdated?.toDate ? data.lastUpdated.toDate() : 
                              data.updatedAt?.toDate ? data.updatedAt.toDate() : null;
        
        // Get payment info
        const payment = data.payment || {};
        const paymentMethod = payment.method || 'N/A';
        
        // Get customer details
        const customerDetails = data.customerDetails || {};
        
        // Get delivery details
        const deliveryDetails = data.deliveryDetails || {};
        const deliveryAddress = deliveryDetails.address || 'N/A';
        
        // Get delivery agent
        const deliveryAgent = data.deliveryAgent || {};
        
        // Get items
        const items = Array.isArray(data.items) ? data.items : [];
        
        return {
          id: doc.id,
          customerId: user.uid,
          customerName: `${customerDetails.firstName || ''} ${customerDetails.lastName || ''}`.trim() || customerDetails.email || 'Unknown Customer',
          customerEmail: customerDetails.email || 'N/A',
          customerPhone: customerDetails.phoneNumber || 'N/A',
          orderNumber: data.orderRef || `Order #${doc.id.slice(0, 6)}`,
          date,
          lastUpdated,
          status: data.orderStatus || data.status || 'pending',
          totalAmount: payment.amount || 0,
          subtotal: payment.subtotal || 0,
          deliveryFee: payment.deliveryFee || 0,
          items,
          deliveryAddress,
          paymentMethod,
          deliveryDate,
          estimatedDelivery,
          trackingCode: data.trackingCode || '',
          deliveryAgent: deliveryAgent.name ? {
            name: deliveryAgent.name || 'N/A',
            phone: deliveryAgent.phoneNumber || 'N/A',
            rating: 4.8, // Default rating if not provided
          } : null,
          cancellationReason: data.cancellationReason || '',
        };
      });
      
      // Sort orders by date (newest first)
      userOrders.sort((a, b) => b.date - a.date);
      
      console.log(`Found ${userOrders.length} orders for this user`);
      setOrders(userOrders);
      
      // Apply initial filtering based on the active tab
      filterOrdersByTab(userOrders, activeTab);
      
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
    switch(status) {
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
                  {item.orderNumber || `Order #${item.id.slice(0, 6)}`}
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
              <View style={styles.orderInfoRow}>
                <FontAwesome5 name="map-marker-alt" size={16} color="#94a3b8" style={styles.orderInfoIcon} />
                <Text style={styles.orderInfoText}>
                  {item.deliveryAddress || 'No address provided'}
                </Text>
              </View>
              
              <View style={styles.orderInfoRow}>
                <Feather name="credit-card" size={16} color="#94a3b8" style={styles.orderInfoIcon} />
                <Text style={styles.orderInfoText}>
                  {item.paymentMethod || 'Payment info not available'}
                </Text>
              </View>
              
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
                      params: { trackingCode: item.trackingCode || '' }
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
          <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
            <LinearGradient
              colors={orderStatusColors.gradientColors || ['#0ea5e9', '#0284c7']}
              style={{
                padding: 24,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
              }}
            >
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center' 
              }}>
                <View style={styles.orderNumberPill}>
                  <Text style={styles.orderNumberPillText}>
                    {selectedOrder.orderRef || `Order #${selectedOrder.id.slice(0, 6)}`}
                  </Text>
                </View>
                
                <TouchableOpacity
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    setOrderDetailVisible(false);
                  }}
                >
                  <Feather name="x" size={20} color="white" />
                </TouchableOpacity>
              </View>
              
              <Text style={{ 
                fontSize: 24, 
                fontWeight: 'bold', 
                color: 'white',
                marginTop: 12
              }}>
                Order Details
              </Text>
              
              <View style={styles.orderDetailStatusContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {selectedOrder.orderStatus === 'pending' && <Feather name="clock" size={18} color="white" style={{ marginRight: 8 }} />}
                  {selectedOrder.orderStatus === 'Processing' && <Feather name="refresh-cw" size={18} color="white" style={{ marginRight: 8 }} />}
                  {selectedOrder.orderStatus === 'shipping' && <Feather name="truck" size={18} color="white" style={{ marginRight: 8 }} />}
                  {selectedOrder.orderStatus === 'delivered' && <Feather name="check-circle" size={18} color="white" style={{ marginRight: 8 }} />}
                  {selectedOrder.orderStatus === 'cancelled' && <Feather name="x-circle" size={18} color="white" style={{ marginRight: 8 }} />}
                  
                  <Text style={{ fontSize: 16, fontWeight: '600', color: 'white' }}>
                    {selectedOrder.orderStatus || statusText}
                  </Text>
                </View>
                
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="calendar" size={14} color="rgba(255, 255, 255, 0.8)" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.8)' }}>
                    {selectedOrder.createdAt ? formatDate(selectedOrder.createdAt) : 
                     selectedOrder.date ? formatDate(selectedOrder.date) : 'Unknown date'}
                  </Text>
                </View>
              </View>
              
              {/* Add last updated information if available */}
              {(selectedOrder.lastUpdated || selectedOrder.updatedAt) && (
                <View style={{ 
                  marginTop: 8, 
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Feather name="refresh-cw" size={12} color="rgba(255, 255, 255, 0.9)" style={{ marginRight: 6 }} />
                    <Text style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.9)' }}>
                      Last updated: {selectedOrder.lastUpdated ? formatDate(selectedOrder.lastUpdated) : 
                                  selectedOrder.updatedAt ? formatDate(selectedOrder.updatedAt) : 'Unknown'}
                    </Text>
                  </View>
                </View>
              )}
              
              {/* Order progress tracker */}
              {selectedOrder.orderStatus !== 'cancelled' && (
                <View style={styles.orderProgressTracker}>
                  <View style={styles.orderProgressLine}>
                    <View style={[
                      styles.orderProgressLineFill,
                      { 
                        width: selectedOrder.orderStatus === 'pending' ? '0%' : 
                               selectedOrder.orderStatus === 'Processing' ? '33%' :
                               selectedOrder.orderStatus === 'shipping' ? '66%' : '100%'
                      }
                    ]} />
                  </View>
                  
                  <View style={styles.orderProgressSteps}>
                    <View style={styles.orderProgressStep}>
                      <View style={[
                        styles.orderProgressDot,
                        { backgroundColor: 'white' }
                      ]}>
                        <Feather name="check" size={12} color="#0ea5e9" />
                      </View>
                      <Text style={styles.orderProgressText}>Order Placed</Text>
                    </View>
                    
                    <View style={styles.orderProgressStep}>
                      <View style={[
                        styles.orderProgressDot,
                        { 
                          backgroundColor: selectedOrder.orderStatus === 'pending' ? 'rgba(255, 255, 255, 0.3)' : 'white'
                        }
                      ]}>
                        {selectedOrder.orderStatus !== 'pending' && <Feather name="check" size={12} color="#0ea5e9" />}
                      </View>
                      <Text style={[
                        styles.orderProgressText,
                        { opacity: selectedOrder.orderStatus === 'pending' ? 0.6 : 1 }
                      ]}>Processing</Text>
                    </View>
                    
                    <View style={styles.orderProgressStep}>
                      <View style={[
                        styles.orderProgressDot,
                        { 
                          backgroundColor: (selectedOrder.orderStatus === 'pending' || selectedOrder.orderStatus === 'Processing') 
                            ? 'rgba(255, 255, 255, 0.3)' : 'white'
                        }
                      ]}>
                        {(selectedOrder.orderStatus !== 'pending' && selectedOrder.orderStatus !== 'Processing') && 
                          <Feather name="check" size={12} color="#0ea5e9" />
                        }
                      </View>
                      <Text style={[
                        styles.orderProgressText,
                        { 
                          opacity: (selectedOrder.orderStatus === 'pending' || selectedOrder.orderStatus === 'Processing') ? 0.6 : 1
                        }
                      ]}>Shipping</Text>
                    </View>
                    
                    <View style={styles.orderProgressStep}>
                      <View style={[
                        styles.orderProgressDot,
                        { 
                          backgroundColor: selectedOrder.orderStatus === 'delivered' ? 'white' : 'rgba(255, 255, 255, 0.3)'
                        }
                      ]}>
                        {selectedOrder.orderStatus === 'delivered' && <Feather name="check" size={12} color="#0ea5e9" />}
                      </View>
                      <Text style={[
                        styles.orderProgressText,
                        { opacity: selectedOrder.orderStatus === 'delivered' ? 1 : 0.6 }
                      ]}>Delivered</Text>
                    </View>
                  </View>
                </View>
              )}
            </LinearGradient>
            
            <View style={styles.orderDetailContent}>
              {/* Customer Details */}
              {(selectedOrder.customerDetails || selectedOrder.customer) && (
                <View style={[styles.orderDetailCard, { borderLeftWidth: 4, borderLeftColor: '#0ea5e9' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                    <FontAwesome5 name="user-circle" size={20} color="#0ea5e9" style={{ marginRight: 8 }} />
                    <Text style={[styles.orderDetailCardTitle, { marginBottom: 0 }]}>
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
                        {selectedOrder.customerDetails ? 
                          `${selectedOrder.customerDetails.firstName || ''} ${selectedOrder.customerDetails.lastName || ''}` : 
                          selectedOrder.customer ? 
                          `${selectedOrder.customer.firstName || ''} ${selectedOrder.customer.lastName || ''}` : 
                          'Not available'}
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
                        {selectedOrder.customerDetails ? 
                          selectedOrder.customerDetails.email : 
                          selectedOrder.customer ? 
                          selectedOrder.customer.email : 
                          'Not available'}
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
                        {selectedOrder.customerDetails ? 
                          selectedOrder.customerDetails.phoneNumber : 
                          selectedOrder.customer ? 
                          selectedOrder.customer.phoneNumber : 
                          'Not available'}
                      </Text>
                    </View>
                  </View>

                  {/* Additional customer information if available */}
                  {((selectedOrder.customerDetails && selectedOrder.customerDetails.address) || 
                    (selectedOrder.customer && selectedOrder.customer.address)) && (
                    <View style={styles.orderDetailRow}>
                      <View style={[styles.orderDetailIcon, { backgroundColor: '#f0f9ff' }]}>
                        <Feather name="map" size={16} color="#0ea5e9" />
                      </View>
                      
                      <View style={{ flex: 1 }}>
                        <Text style={styles.orderDetailLabel}>
                          Address
                        </Text>
                        <Text style={styles.orderDetailValue}>
                          {selectedOrder.customerDetails && selectedOrder.customerDetails.address ? 
                            selectedOrder.customerDetails.address : 
                            selectedOrder.customer && selectedOrder.customer.address ? 
                            selectedOrder.customer.address : 'Not available'}
                        </Text>
                      </View>
                    </View>
                  )}
                </View>
              )}
              
              {/* Delivery Details */}
              <View style={styles.orderDetailCard}>
                <Text style={styles.orderDetailCardTitle}>
                  Delivery Information
                </Text>
                
                {(selectedOrder.deliveryDetails || selectedOrder.deliveryAddress) && (
                  <View style={styles.orderDetailRow}>
                    <View style={[styles.orderDetailIcon, { backgroundColor: '#f0fdf4' }]}>
                      <Feather name="map-pin" size={16} color="#16a34a" />
                    </View>
                    
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderDetailLabel}>
                        Delivery Address
                      </Text>
                      <Text style={styles.orderDetailValue}>
                        {selectedOrder.deliveryDetails ? 
                          selectedOrder.deliveryDetails.address : 
                          selectedOrder.deliveryAddress || 'Address not available'}
                      </Text>
                    </View>
                  </View>
                )}
                
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
                
                {(selectedOrder.payment || selectedOrder.paymentMethod) && (
                  <View style={styles.orderDetailRow}>
                    <View style={[styles.orderDetailIcon, { backgroundColor: '#eff6ff' }]}>
                      <Feather name="credit-card" size={16} color="#3b82f6" />
                    </View>
                    
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderDetailLabel}>
                        Payment Method
                      </Text>
                      <Text style={styles.orderDetailValue}>
                        {selectedOrder.payment ? 
                          `${selectedOrder.payment.method || 'Not specified'} ${selectedOrder.payment.provider ? `(${selectedOrder.payment.provider})` : ''}` : 
                          selectedOrder.paymentMethod || 'Not specified'}
                      </Text>
                    </View>
                  </View>
                )}
                
                {/* Add payment provider as separate item if available */}
                {selectedOrder.payment && selectedOrder.payment.provider && (
                  <View style={styles.orderDetailRow}>
                    <View style={[styles.orderDetailIcon, { backgroundColor: '#eef2ff' }]}>
                      <FontAwesome5 name="money-check" size={16} color="#4f46e5" />
                    </View>
                    
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderDetailLabel}>
                        Payment Provider
                      </Text>
                      <Text style={[styles.orderDetailValue, {color: '#4f46e5', fontWeight: '700'}]}>
                        {selectedOrder.payment.provider}
                      </Text>
                    </View>
                  </View>
                )}
                
                {/* Delivery Agent Information */}
                {selectedOrder.deliveryAgent && (
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
                          {selectedOrder.deliveryAgent.name}
                        </Text>
                        <Text style={styles.orderDetailHighlightText}>
                          Email: {selectedOrder.deliveryAgent.email || 'N/A'}
                        </Text>
                        <Text style={styles.orderDetailHighlightText}>
                          Phone: {selectedOrder.deliveryAgent.phoneNumber || 'N/A'}
                        </Text>
                        <Text style={styles.orderDetailHighlightText}>
                          Assigned: {selectedOrder.deliveryAgent.assignedAt ? formatDate(selectedOrder.deliveryAgent.assignedAt) : 'N/A'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
                
                {/* Order Status History */}
                {(selectedOrder.orderStatusHistory && selectedOrder.orderStatusHistory.length > 0) ? (
                  <View style={[styles.orderDetailHighlight, { backgroundColor: '#f5f3ff' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Feather name="clock" size={16} color="#7c3aed" style={{ marginRight: 8 }} />
                      <Text style={[styles.orderDetailHighlightTitle, { color: '#7c3aed' }]}>
                        Status History
                      </Text>
                    </View>
                    
                    {selectedOrder.orderStatusHistory.map((statusItem, index) => (
                      <View key={index} style={{
                        flexDirection: 'row',
                        paddingVertical: 6,
                        borderBottomWidth: index === selectedOrder.orderStatusHistory.length - 1 ? 0 : 1,
                        borderBottomColor: 'rgba(124, 58, 237, 0.2)'
                      }}>
                        <View style={{
                          width: 12,
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: '#7c3aed',
                          marginTop: 4,
                          marginRight: 8
                        }} />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#4c1d95' }}>
                            {statusItem.status}
                          </Text>
                          <Text style={{ fontSize: 12, color: '#6b7280' }}>
                            {statusItem.timestamp ? formatDate(statusItem.timestamp) : 'No timestamp'}
                          </Text>
                          {statusItem.note && (
                            <Text style={{ fontSize: 12, color: '#6b7280', marginTop: 2, fontStyle: 'italic' }}>
                              {statusItem.note}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                ) : (
                  // Fallback for orders without explicit history
                  <View style={[styles.orderDetailHighlight, { backgroundColor: '#f5f3ff' }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Feather name="clock" size={16} color="#7c3aed" style={{ marginRight: 8 }} />
                      <Text style={[styles.orderDetailHighlightTitle, { color: '#7c3aed' }]}>
                        Status History
                      </Text>
                    </View>
                    
                    <View style={{
                      flexDirection: 'row',
                      paddingVertical: 6
                    }}>
                      <View style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: '#7c3aed',
                        marginTop: 4,
                        marginRight: 8
                      }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#4c1d95' }}>
                          {selectedOrder.orderStatus || selectedOrder.status || 'Current Status'}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#6b7280' }}>
                          {selectedOrder.createdAt ? formatDate(selectedOrder.createdAt) : 
                           selectedOrder.date ? formatDate(selectedOrder.date) : 'Unknown date'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </View>
              
              {/* Order Items */}
              <View style={styles.orderDetailCard}>
                <Text style={styles.orderDetailCardTitle}>
                  Order Items ({Array.isArray(selectedOrder.items) ? selectedOrder.items.length : 0})
                </Text>
                
                {Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, index) => (
                    <Animated.View 
                      key={item.id || index}
                      style={[
                        styles.orderItemRow,
                        { 
                          opacity: fadeAnim,
                          transform: [{ 
                            translateY: fadeAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [20, 0]
                            })
                          }]
                        }
                      ]}
                    >
                      <Image 
                        source={{ uri: item.image || 'https://via.placeholder.com/60?text=Item' }}
                        style={styles.orderItemImage}
                        resizeMode="cover"
                        defaultSource={{ uri: 'https://via.placeholder.com/60?text=Item' }}
                      />
                      
                      <View style={styles.orderItemDetails}>
                        <Text style={styles.orderItemName}>
                          {item.productName || item.name || `Item ${index + 1}`}
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
                        
                        {item.status && (
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 4
                          }}>
                            <View style={{
                              width: 8,
                              height: 8,
                              borderRadius: 4,
                              backgroundColor: item.status === 'ordered' ? '#10b981' : 
                                              item.status === 'processing' ? '#f59e0b' : 
                                              item.status === 'cancelled' ? '#ef4444' : '#6b7280',
                              marginRight: 4
                            }} />
                            <Text style={{
                              fontSize: 12,
                              color: '#6b7280',
                              textTransform: 'capitalize'
                            }}>
                              {item.status}
                            </Text>
                          </View>
                        )}
                      </View>
                    </Animated.View>
                  ))
                ) : (
                  <View style={styles.noItemsContainer}>
                    <Feather name="box" size={32} color="#94a3b8" />
                    <Text style={styles.noItemsText}>No item details available</Text>
                  </View>
                )}
                
                <View style={styles.orderSummary}>
                  {selectedOrder.payment && (
                    <>
                      <View style={styles.orderSummaryRow}>
                        <Text style={styles.orderSummaryLabel}>
                          Subtotal
                        </Text>
                        <Text style={styles.orderSummaryValue}>
                          {selectedOrder.payment.subtotal?.toFixed(2) || 
                            (typeof selectedOrder.totalAmount === 'number' 
                              ? (selectedOrder.totalAmount * 0.85).toFixed(2) 
                              : (parseFloat(selectedOrder.totalAmount || '0') * 0.85).toFixed(2))} Birr
                        </Text>
                      </View>
                      
                      <View style={styles.orderSummaryRow}>
                        <Text style={styles.orderSummaryLabel}>
                          Delivery Fee
                        </Text>
                        <Text style={styles.orderSummaryValue}>
                          {selectedOrder.payment.deliveryFee?.toFixed(2) ||
                            (typeof selectedOrder.totalAmount === 'number' 
                              ? (selectedOrder.totalAmount * 0.1).toFixed(2) 
                              : (parseFloat(selectedOrder.totalAmount || '0') * 0.1).toFixed(2))} Birr
                        </Text>
                      </View>
                      
                      {selectedOrder.payment.tax && (
                        <View style={styles.orderSummaryRow}>
                          <Text style={styles.orderSummaryLabel}>
                            Tax
                          </Text>
                          <Text style={styles.orderSummaryValue}>
                            {selectedOrder.payment.tax.toFixed(2)} Birr
                          </Text>
                        </View>
                      )}
                      
                      <View style={styles.orderTotalRow}>
                        <Text style={styles.orderTotalLabel}>
                          Total
                        </Text>
                        <Text style={styles.orderTotalValue}>
                          {selectedOrder.payment.amount?.toFixed(2) || 
                            (typeof selectedOrder.totalAmount === 'number' 
                              ? selectedOrder.totalAmount.toFixed(2) 
                              : parseFloat(selectedOrder.totalAmount || '0').toFixed(2))} Birr
                        </Text>
                      </View>
                      
                      {selectedOrder.payment.provider && (
                        <View style={styles.orderSummaryRow}>
                          <Text style={styles.orderSummaryLabel}>
                            Payment Provider
                          </Text>
                          <Text style={[styles.orderSummaryValue, {color: '#3b82f6'}]}>
                            {selectedOrder.payment.provider}
                          </Text>
                        </View>
                      )}
                      
                      {selectedOrder.payment.transactionId && (
                        <View style={styles.orderSummaryRow}>
                          <Text style={styles.orderSummaryLabel}>
                            Transaction ID
                          </Text>
                          <Text style={styles.orderSummaryValue}>
                            {selectedOrder.payment.transactionId}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              </View>
              
              {/* Action Buttons */}
              <View style={styles.orderActionButtons}>
                {(selectedOrder.orderStatus === 'pending' || selectedOrder.orderStatus === 'Processing') && (
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
                                const userRef = doc(db, "users", user.uid);
                                const orderRef = doc(collection(userRef, "orders"), selectedOrder.id);
                                
                                // Update order status to cancelled
                                await updateDoc(orderRef, {
                                  status: 'cancelled',
                                  orderStatus: 'cancelled',
                                  cancellationReason: 'Customer requested cancellation',
                                  updatedAt: new Date(),
                                  orderStatusHistory: [
                                    ...(selectedOrder.orderStatusHistory || []),
                                    {
                                      status: 'cancelled',
                                      timestamp: new Date(),
                                      note: 'Customer requested cancellation'
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
                                        cancellationReason: 'Customer requested cancellation',
                                        orderStatusHistory: [
                                          ...(order.orderStatusHistory || []),
                                          {
                                            status: 'cancelled',
                                            timestamp: new Date(),
                                            note: 'Customer requested cancellation'
                                          }
                                        ]
                                      }
                                    : order
                                );
                                setOrders(updatedOrders);
                                setFilteredOrders(updatedOrders);
                                
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
                
                {selectedOrder.orderStatus === 'shipping' && (
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
              { translateY: filterModalAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [height * 0.5, 0]
              })}
            ]
          }
        ]}
      >
        <View style={styles.filterModalHandle} />
        
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: 20,
        }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0f172a' }}>
            Filter Orders
          </Text>
          
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#f1f5f9',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => setFilterModalVisible(false)}
          >
            <Feather name="x" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
        
        <Text style={{ 
          fontSize: 16, 
          fontWeight: '600', 
          color: '#334155',
          marginBottom: 16,
        }}>
          Order Status
        </Text>
        
        <View style={styles.filterOptionsContainer}>
          {tabs.map(tab => (
            <TouchableOpacity 
              key={tab.id}
              style={[
                styles.filterOptionCard,
                activeTab === tab.id && styles.filterOptionCardActive
              ]}
              onPress={() => {
                setActiveTab(tab.id);
                setFilterModalVisible(false); // Close filter modal when option is selected
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <View style={[
                styles.filterOptionIcon,
                { backgroundColor: getStatusColor(tab.id).bg }
              ]}>
                {tab.id === 'pending' && <Feather name="clock" size={18} color={getStatusColor(tab.id).text} />}
                {tab.id === 'processing' && <Feather name="refresh-cw" size={18} color={getStatusColor(tab.id).text} />}
                {tab.id === 'shipping' && <Feather name="truck" size={18} color={getStatusColor(tab.id).text} />}
                {tab.id === 'delivered' && <Feather name="check-circle" size={18} color={getStatusColor(tab.id).text} />}
                {tab.id === 'cancelled' && <Feather name="x-circle" size={18} color={getStatusColor(tab.id).text} />}
                {tab.id === 'all' && <Feather name="layers" size={18} color={getStatusColor(tab.id).text} />}
              </View>
              
              <Text style={[
                styles.filterOptionText,
                activeTab === tab.id && styles.filterOptionTextActive
              ]}>
                {tab.label}
              </Text>
              
              {activeTab === tab.id && (
                <View style={styles.filterOptionCheckmark}>
                  <Feather name="check" size={16} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.filterButtonsContainer}>
          <TouchableOpacity
            style={styles.resetFilterButton}
            onPress={() => {
              setActiveTab('all');
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            <Text style={styles.resetFilterButtonText}>Reset</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.applyFilterButton}
            onPress={() => {
              setFilterModalVisible(false);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            <Text style={styles.applyFilterButtonText}>Apply Filter</Text>
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
            onRefresh={onRefresh}
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
    maxHeight: height * 0.8,
  },
  filterModalHandle: {
    height: 4,
    width: 40,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginBottom: 16,
  },
  filterOptionsContainer: {
    marginBottom: 24,
  },
  filterOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  filterOptionCardActive: {
    backgroundColor: '#eff6ff',
  },
  filterOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  filterOptionText: {
    fontSize: 16,
    color: '#334155',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  filterOptionCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  resetFilterButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
  },
  resetFilterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  applyFilterButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#3b82f6',
  },
  applyFilterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
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
  orderNumberPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  orderNumberPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  orderDetailStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
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
    backgroundColor: 'white',
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
  },
  orderProgressText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
    textAlign: 'center',
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
  orderDetailCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
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
  orderDetailContent: {
    padding: 20,
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
});
