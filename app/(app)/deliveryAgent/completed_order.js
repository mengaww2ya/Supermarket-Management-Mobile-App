import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
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
  Linking,
  Alert,
} from 'react-native';
import { Ionicons, Feather, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { db } from "../../../firebase/firebaseConfig";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  limit,
  doc
} from 'firebase/firestore';
import { useAuth } from "../../context/authContext";

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statsContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 16,
    padding: 16,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statBox: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 8,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyStateImage: {
    width: 120,
    height: 120,
    marginBottom: 16,
    opacity: 0.8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
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
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    width: width * 0.9,
    maxHeight: height * 0.8,
  },
  filterModalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioButtonDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  resetButton: {
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  }
});

export default function CompletedOrdersScreen() {
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;
  
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState('all');
  const [showStats, setShowStats] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetailVisible, setOrderDetailVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  
  // Card animations - pre-create refs for items
  const itemFades = useRef({});
  const itemTranslates = useRef({});
  const itemScales = useRef({});
  const [pressedItems, setPressedItems] = useState({});

  // Create or get animation values for an item
  const getItemAnimations = useCallback((id) => {
    // Create fade animation if it doesn't exist
    if (!itemFades.current[id]) {
      itemFades.current[id] = new Animated.Value(0);
    }
    
    // Create translate animation if it doesn't exist
    if (!itemTranslates.current[id]) {
      itemTranslates.current[id] = new Animated.Value(20);
    }
    
    // Create scale animation if it doesn't exist
    if (!itemScales.current[id]) {
      itemScales.current[id] = new Animated.Value(1);
    }
    
    return {
      fade: itemFades.current[id],
      translate: itemTranslates.current[id],
      scale: itemScales.current[id]
    };
  }, []);
  
  // Start item entrance animation
  const animateItemEntrance = useCallback((id, delay = 0) => {
    const { fade, translate } = getItemAnimations(id);
    
    Animated.parallel([
      Animated.timing(fade, {
        toValue: 1,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration: 400,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [getItemAnimations]);
  
  // Update item scale animation when pressed state changes
  useEffect(() => {
    Object.entries(pressedItems).forEach(([id, isPressed]) => {
      const { scale } = getItemAnimations(id);
      
      Animated.spring(scale, {
        toValue: isPressed ? 0.98 : 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start();
    });
  }, [pressedItems, getItemAnimations]);
  
  // Set item pressed state
  const setItemPressed = useCallback((id, isPressed) => {
    setPressedItems(prev => ({
      ...prev,
      [id]: isPressed
    }));
  }, []);

  // Get authentication context
  const { user } = useAuth();

  // Helper functions
  const getDateRange = useCallback(() => {
      const today = new Date();
    let startDate;
    
    switch(selectedDateRange) {
      case 'today':
        startDate = new Date(today.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(today.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      case 'all':
        // Set to a very old date to include all orders
        startDate = new Date(0);
        break;
      default:
        startDate = new Date();
        startDate.setDate(today.getDate() - 7);
    }
    
    return { startDate, endDate: today };
  }, [selectedDateRange]);

  // Create mock data for development purposes
  const createMockCompletedOrders = useCallback(() => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    return [
      {
        id: 'mock-order-1',
        orderNumber: 'ORD-5372',
        customerName: 'John Smith',
        customerPhone: '+251912345678',
        address: '123 Main St, Addis Ababa',
        totalAmount: 350.75,
        paymentMethod: 'Cash',
        items: [
          { name: 'Pasta', quantity: 2, price: 120.50 },
          { name: 'Salad', quantity: 1, price: 85.25 },
          { name: 'Beverage', quantity: 2, price: 45.00 }
        ],
        itemsCount: 3,
        status: 'Completed',
        completedAt: yesterday,
        deliveryTime: 45,
        rating: 4.5,
        feedback: 'Food was delivered hot and on time. Great service!',
        distance: 3.5,
        dateInRange: true
      },
      {
        id: 'mock-order-2',
        orderNumber: 'ORD-4291',
        customerName: 'Sarah Johnson',
        customerPhone: '+251911987654',
        address: '456 Oak Avenue, Addis Ababa',
        totalAmount: 425.00,
        paymentMethod: 'Card',
        items: [
          { name: 'Pizza', quantity: 1, price: 220.00 },
          { name: 'Wings', quantity: 1, price: 150.00 },
          { name: 'Soda', quantity: 2, price: 55.00 }
        ],
        itemsCount: 3,
        status: 'Completed',
        completedAt: new Date(now.setHours(now.getHours() - 5)),
        deliveryTime: 38,
        rating: 5,
        feedback: 'Excellent delivery service!',
        distance: 2.8,
        dateInRange: true
      }
    ];
  }, []);

  // Fetch completed orders from Firestore
  const fetchCompletedOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user?.uid) {
        setError("Please log in to view completed orders");
        setLoading(false);
        return;
      }
      
      // Define all possible paths where completed orders might be stored
      const possibleCollectionPaths = [
        `users/${user.uid}/tasks`,
        `users/${user.uid}/deliveries`,
        `deliveryAgent/${user.uid}/tasks`,
        `deliveryAgent/${user.uid}/orders`,
        `delivery/${user.uid}/tasks`,
        `orders`,
        `tasks`
      ];
      
      let combinedDocs = [];
      let successfulPath = null;
      
      // Try each path until we find orders
      for (const path of possibleCollectionPaths) {
        try {
          const collectionRef = collection(db, path);
          
          // First try: specific status query
          const completedQuery = query(
            collectionRef,
            where("status", "in", ["Completed", "completed", "COMPLETED", "Delivered", "delivered", "DELIVERED"])
          );
          
          const snapshot = await getDocs(completedQuery);
          
          if (snapshot.docs.length > 0) {
            combinedDocs = [...combinedDocs, ...snapshot.docs];
            successfulPath = path;
            continue; // Try next path also
          }
          
          // Second try: get all documents and filter client-side
          const allDocsQuery = query(collectionRef, limit(50));
          const allDocsSnapshot = await getDocs(allDocsQuery);
          
          // Filter for completed orders client-side
          const completed = allDocsSnapshot.docs.filter(doc => {
            const data = doc.data();
            const status = data.status || '';
            return status.toLowerCase() === 'completed' || status.toLowerCase() === 'delivered';
          });
          
          if (completed.length > 0) {
            combinedDocs = [...combinedDocs, ...completed];
            successfulPath = path;
          }
        } catch (err) {
          // Silent error handling to try next path
        }
      }
      
      // If no documents found, use mock data
      if (combinedDocs.length === 0) {
        const mockOrders = createMockCompletedOrders();
        setOrders(mockOrders);
        
        // Apply filters to mock data
        let filtered = [...mockOrders];
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          filtered = filtered.filter(order => 
            order.orderNumber.toLowerCase().includes(query) ||
            order.customerName.toLowerCase().includes(query) ||
            order.address.toLowerCase().includes(query)
          );
        }
        
        if (activeFilter !== 'all') {
          if (activeFilter === 'highRated') {
            filtered = filtered.filter(order => order.rating >= 4);
          } else if (activeFilter === 'lowRated') {
            filtered = filtered.filter(order => order.rating < 3 && order.rating > 0);
          } else if (activeFilter === 'cash') {
            filtered = filtered.filter(order => order.paymentMethod.toLowerCase() === 'cash');
          } else if (activeFilter === 'card') {
            filtered = filtered.filter(order => 
              order.paymentMethod.toLowerCase().includes('card') || 
              order.paymentMethod.toLowerCase().includes('online')
            );
          }
        }
        
        setFilteredOrders(filtered);
        setLoading(false);
        setIsRefreshing(false);
        return;
      }
      
      // Process the completed orders
      const completedOrdersData = combinedDocs.map(doc => {
        const data = doc.data();
        
        const completedDate = data.completedAt?.toDate ? 
                            data.completedAt.toDate() : 
                            data.deliveredAt?.toDate ? 
                              data.deliveredAt.toDate() : 
                              data.timestamp?.toDate ? 
                                data.timestamp.toDate() : 
                                new Date();
        
        // Apply client-side date filtering based on selectedDateRange
        const { startDate, endDate } = getDateRange();
        
        // Get items count, handling different possible structures
        let itemsCount = 0;
        let itemsArray = [];
        
        if (Array.isArray(data.items)) {
          itemsArray = data.items;
          itemsCount = data.items.length;
        } else if (Array.isArray(data.orderItems)) {
          itemsArray = data.orderItems;
          itemsCount = data.orderItems.length;
        } else if (typeof data.itemCount === 'number') {
          itemsCount = data.itemCount;
        }
        
        // Get appropriate address field
        const address = data.deliveryAddress || data.address || data.customerAddress || data.destination || "N/A";
        
        // Get customer name from various possible fields
        const customerName = data.customerName || data.customer?.name || data.receiver || "Customer";
        
        // Get order ID/number from various possible fields
        const orderNumber = data.orderNumber || data.orderRef || data.orderId || data.id || doc.id.substring(0, 8);
        
        // Get total amount, handling different formats
        let totalAmount = 0;
        if (typeof data.totalAmount === 'number') {
          totalAmount = data.totalAmount;
        } else if (typeof data.total === 'number') {
          totalAmount = data.total;
        } else if (typeof data.amount === 'number') {
          totalAmount = data.amount;
        } else if (typeof data.price === 'number') {
          totalAmount = data.price;
        }
        
        return {
          id: doc.id,
          orderNumber: orderNumber,
          customerName: customerName,
          customerPhone: data.customerPhone || data.customer?.phone || "N/A",
          address: address,
          totalAmount: totalAmount,
          paymentMethod: data.paymentMethod || data.payment?.method || "Cash",
          items: itemsArray,
          itemsCount: itemsCount,
          status: data.status || "Completed",
          completedAt: completedDate,
          deliveryTime: data.deliveryTime || data.duration || 0,
          rating: data.rating || data.customerRating || 0,
          feedback: data.feedback || data.customerFeedback || "",
          distance: data.distance || 0,
          dateInRange: completedDate >= startDate && completedDate <= endDate,
          rawData: data // Store raw data for debugging if needed
        };
      });
      
      // Filter by date range on client side to avoid Firestore composite index
      let filteredByDateRange = completedOrdersData;
      if (selectedDateRange !== 'all') {
        filteredByDateRange = completedOrdersData.filter(order => order.dateInRange);
      }
      
      // Sort by completion date (newest first)
      const sortedOrders = filteredByDateRange.sort((a, b) => 
        b.completedAt.getTime() - a.completedAt.getTime()
      );
      
      setOrders(sortedOrders);
      setFilteredOrders(sortedOrders);
      
    } catch (error) {
      setError("Failed to load completed orders. Please try again.");
      
      // Use mock data as fallback
      const mockOrders = createMockCompletedOrders();
      setOrders(mockOrders);
      setFilteredOrders(mockOrders);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user, getDateRange, selectedDateRange, createMockCompletedOrders, searchQuery, activeFilter]);

  // Filter orders based on search query
  const filterOrders = useCallback(() => {
    if (!orders.length) return;
    
    let filtered = [...orders];
    
    // Apply search filter if query exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.address.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter if not 'all'
    if (activeFilter !== 'all') {
      if (activeFilter === 'highRated') {
        filtered = filtered.filter(order => order.rating >= 4);
      } else if (activeFilter === 'lowRated') {
        filtered = filtered.filter(order => order.rating < 3 && order.rating > 0);
      } else if (activeFilter === 'cash') {
        filtered = filtered.filter(order => order.paymentMethod.toLowerCase() === 'cash');
      } else if (activeFilter === 'card') {
        filtered = filtered.filter(order => 
          order.paymentMethod.toLowerCase().includes('card') || 
          order.paymentMethod.toLowerCase().includes('online')
        );
      }
    }
    
    setFilteredOrders(filtered);
  }, [orders, searchQuery, activeFilter]);

  // Refresh control handler
  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchCompletedOrders();
  }, [fetchCompletedOrders]);

  // Toggle search bar visibility
  const toggleSearch = useCallback(() => {
    if (isSearchVisible) {
      setSearchQuery('');
    }
    setIsSearchVisible(!isSearchVisible);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [isSearchVisible]);

  // Calculate statistics from orders
  const calculateStats = useCallback(() => {
    if (!orders.length) {
      return {
        totalOrders: 0,
        avgRating: 0,
        totalEarnings: 0,
        avgDeliveryTime: 0
      };
    }
    
    const totalOrders = orders.length;
    const ordersWithRating = orders.filter(order => order.rating > 0);
    const avgRating = ordersWithRating.length 
      ? (ordersWithRating.reduce((sum, order) => sum + order.rating, 0) / ordersWithRating.length).toFixed(1)
      : 0;
    
    const totalEarnings = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    
    const ordersWithTime = orders.filter(order => order.deliveryTime > 0);
    const avgDeliveryTime = ordersWithTime.length
      ? Math.round(ordersWithTime.reduce((sum, order) => sum + order.deliveryTime, 0) / ordersWithTime.length)
      : 0;
    
    return {
      totalOrders,
      avgRating,
      totalEarnings,
      avgDeliveryTime
    };
  }, [orders]);

  // Effect to fetch orders on mount and when date range changes
  useEffect(() => {
    fetchCompletedOrders();
    
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
      Animated.timing(scale, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, [fetchCompletedOrders]);

  // Effect to filter orders when search query or filter changes
  useEffect(() => {
    filterOrders();
  }, [filterOrders, searchQuery, activeFilter]);

  // Render the statistics section
  const renderStats = () => {
    const stats = calculateStats();
    const { totalOrders, avgRating, totalEarnings, avgDeliveryTime } = stats;

    return (
      <Animated.View 
        style={[
          styles.statsContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: translateY }, { scale }],
          }
        ]}
      >
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#0f172a' }}>
          Delivery Performance
        </Text>
        
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          <View style={[styles.statBox, { backgroundColor: '#e0f2fe' }]}>
            <Text style={{ fontSize: 12, color: '#0284c7', fontWeight: '500' }}>Completed</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0c4a6e', marginTop: 4 }}>
              {totalOrders}
            </Text>
          </View>
          
          <View style={[styles.statBox, { backgroundColor: '#f0fdf4' }]}>
            <Text style={{ fontSize: 12, color: '#16a34a', fontWeight: '500' }}>Earnings</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#166534', marginTop: 4 }}>
              ${totalEarnings.toFixed(2)}
            </Text>
              </View>
            </View>
            
        <View style={{ flexDirection: 'row' }}>
          <View style={[styles.statBox, { backgroundColor: '#fff7ed' }]}>
            <Text style={{ fontSize: 12, color: '#ea580c', fontWeight: '500' }}>Avg Rating</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#9a3412', marginRight: 4 }}>
                {avgRating}
              </Text>
              <Ionicons name="star" size={14} color="#f59e0b" />
              </View>
            </View>
            
          <View style={[styles.statBox, { backgroundColor: '#fdf4ff' }]}>
            <Text style={{ fontSize: 12, color: '#c026d3', fontWeight: '500' }}>Avg Time</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#701a75', marginTop: 4 }}>
              {avgDeliveryTime} min
            </Text>
              </View>
            </View>
      </Animated.View>
    );
  };

  // Render header with back button, title and action buttons
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={22} color="#64748b" />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>Completed Orders</Text>
      
      <View style={{ flexDirection: 'row' }}>
        <TouchableOpacity 
          style={[styles.actionButton, { marginRight: 8 }]}
          onPress={toggleSearch}
          activeOpacity={0.7}
        >
          <Feather 
            name={isSearchVisible ? "x" : "search"} 
            size={20} 
            color="#64748b" 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.actionButton, 
            activeFilter !== 'all' || selectedDateRange !== 'all' 
              ? { backgroundColor: '#eff6ff', borderColor: '#3b82f6' } 
              : {}
          ]}
          onPress={() => {
            setFilterModalVisible(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          activeOpacity={0.7}
        >
          <Feather 
            name="filter" 
            size={20} 
            color={activeFilter !== 'all' || selectedDateRange !== 'all' ? '#3b82f6' : '#64748b'} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Render the search bar
  const renderSearchBar = () => {
    if (!isSearchVisible) return null;
    
    return (
          <Animated.View 
        style={[
          styles.searchBar,
          {
            marginHorizontal: 16,
            opacity: fadeAnim,
            transform: [{ translateY }]
          }
        ]}
      >
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
          </Animated.View>
    );
  };

  // Render a single order card
  const renderOrderItem = ({ item, index }) => {
    const delay = index * 100;
    return (
      <OrderItemCard 
        item={item} 
        delay={delay} 
        onSelectOrder={(order) => {
          // First set the selected order
          setSelectedOrder(order);
          // Then make modal visible
          setOrderDetailVisible(true);
        }}
        getItemAnimations={getItemAnimations}
        setItemPressed={setItemPressed}
        pressedItems={pressedItems}
        animateItemEntrance={animateItemEntrance}
      />
    );
  };

  // Render order detail modal
  const renderOrderDetailModal = () => {
    if (!selectedOrder) return null;
    
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
              colors={['#0891b2', '#0e7490']}
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
                  {selectedOrder?.orderNumber || 'N/A'}
                </Text>
              </View>
              
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                marginTop: 12 
              }}>
                <View>
                  <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.7)' }}>
                    Completed on
                  </Text>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: 'white' }}>
                    {selectedOrder?.completedAt?.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    }) || 'N/A'}
                  </Text>
                </View>
                
                <View>
                  <Text style={{ fontSize: 14, color: 'rgba(255, 255, 255, 0.7)' }}>
                    Total Amount
                  </Text>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: 'white' }}>
                    ${selectedOrder?.totalAmount?.toFixed(2) || '0.00'}
                  </Text>
                </View>
              </View>
            </LinearGradient>
            
            <View style={{ padding: 20 }}>
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
                  Customer Information
                </Text>
                
                <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                  <View style={{ 
                    width: 40, 
                    height: 40, 
                    borderRadius: 20, 
                    backgroundColor: '#e0f2fe',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12
                  }}>
                    <FontAwesome5 name="user-alt" size={16} color="#0284c7" />
                  </View>
                  
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 2 }}>Customer</Text>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#334155' }}>
                      {selectedOrder?.customerName || 'N/A'}
                    </Text>
                  </View>
                </View>
                
                <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity 
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#f1f5f9',
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      borderRadius: 8,
                      flex: 1,
                    }}
                    onPress={() => {
                      const phoneNumber = selectedOrder?.customerPhone;
                      if (phoneNumber && phoneNumber !== 'N/A') {
                        Linking.openURL(`tel:${phoneNumber}`);
                      } else {
                        Alert.alert('No Phone Number', 'No phone number available for this customer.');
                      }
                    }}
                  >
                    <Feather name="phone" size={16} color="#0f766e" style={{ marginRight: 8 }} />
                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#0f766e' }}>
                      Call Customer
                    </Text>
          </TouchableOpacity>
                </View>
              </View>
              
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
                  Delivery Details
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
                      {selectedOrder?.address || 'N/A'}
                    </Text>
                  </View>
                </View>
                
                <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                  <View style={{ marginRight: 24 }}>
                    <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 2 }}>
                      Delivery Time
                    </Text>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#334155' }}>
                      {selectedOrder?.deliveryTime || 'N/A'} min
                    </Text>
                  </View>
                  
                  <View>
                    <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 2 }}>
                      Payment Method
                    </Text>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#334155' }}>
                      {selectedOrder?.paymentMethod || 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>
              
              {selectedOrder?.items && selectedOrder.items.length > 0 && (
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
                    Order Items ({selectedOrder?.items?.length || 0})
                  </Text>
                  
                  {selectedOrder?.items?.map((item, index) => (
                    <View 
                      key={index}
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        paddingVertical: 8,
                        borderBottomWidth: index < selectedOrder.items.length - 1 ? 1 : 0,
                        borderBottomColor: '#f1f5f9',
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '500', color: '#334155' }}>
                          {item?.name || `Item ${index + 1}`}
                        </Text>
                        <Text style={{ fontSize: 13, color: '#64748b' }}>
                          Qty: {item?.quantity || 1}
                        </Text>
        </View>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: '#334155' }}>
                        ${(item?.price || 0).toFixed(2)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
              
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
                  Customer Rating
                </Text>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  {Array(5).fill(0).map((_, i) => (
                    <Ionicons
                      key={i}
                      name="star"
                      size={24}
                      color={i < Math.floor(selectedOrder?.rating || 0) ? '#f59e0b' : '#e2e8f0'}
                      style={{ marginRight: 4 }}
                    />
                  ))}
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#334155', marginLeft: 8 }}>
                    {(selectedOrder?.rating || 0).toFixed(1)}
                  </Text>
                </View>
                
                {selectedOrder?.feedback ? (
                  <View style={{ 
                    backgroundColor: '#f8fafc', 
                    padding: 12, 
                    borderRadius: 8 
                  }}>
                    <Text style={{ fontSize: 14, color: '#475569', fontStyle: 'italic' }}>
                      "{selectedOrder.feedback}"
                    </Text>
                  </View>
                ) : (
                  <Text style={{ fontSize: 14, color: '#94a3b8', fontStyle: 'italic' }}>
                    No feedback provided
                  </Text>
                )}
              </View>

              <View style={{ marginBottom: 16, paddingHorizontal: 16 }}>
            <TouchableOpacity 
                  style={{
                    backgroundColor: '#ef4444',
                    paddingVertical: 12,
                    borderRadius: 8,
                    alignItems: 'center',
                  }}
                  onPress={() => setOrderDetailVisible(false)}
                >
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'white' }}>
                    Close
                  </Text>
            </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  };

  // Render filter modal
  const renderFilterModal = () => (
    <Pressable
      style={styles.filterModal}
      onPress={() => setFilterModalVisible(false)}
    >
      <Pressable style={styles.filterModalContent} onPress={e => e.stopPropagation()}>
        <View style={styles.modalHeader}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a' }}>
            Filter Orders
          </Text>
            <TouchableOpacity 
            onPress={() => setFilterModalVisible(false)}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
            <Feather name="x" size={22} color="#64748b" />
            </TouchableOpacity>
        </View>
        
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#334155', marginBottom: 12 }}>
            Date Range
          </Text>
          
          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: 'week', label: 'Last 7 Days' },
            { id: 'month', label: 'Last 30 Days' },
            { id: 'year', label: 'Last Year' },
          ].map(item => (
            <TouchableOpacity 
              key={item.id}
              style={styles.filterOption}
              onPress={() => {
                setSelectedDateRange(item.id);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <View style={[
                styles.radioButton,
                {
                  borderColor: selectedDateRange === item.id ? '#3b82f6' : '#d1d5db',
                }
              ]}>
                {selectedDateRange === item.id && (
                  <View style={[
                    styles.radioButtonDot,
                    { backgroundColor: '#3b82f6' }
                  ]} />
                )}
              </View>
              <Text style={{ 
                fontSize: 16, 
                color: selectedDateRange === item.id ? '#1e293b' : '#475569',
                fontWeight: selectedDateRange === item.id ? '500' : 'normal'
              }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
          </View>
          
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#334155', marginBottom: 12 }}>
            Order Filters
          </Text>
          
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'highRated', label: 'Highly Rated (4-5 ★)' },
            { id: 'lowRated', label: 'Low Rated (1-3 ★)' },
            { id: 'cash', label: 'Cash Payments' },
            { id: 'card', label: 'Card/Online Payments' },
          ].map(item => (
          <TouchableOpacity 
              key={item.id}
              style={styles.filterOption}
              onPress={() => {
                setActiveFilter(item.id);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <View style={[
                styles.radioButton,
                {
                  borderColor: activeFilter === item.id ? '#3b82f6' : '#d1d5db',
                }
              ]}>
                {activeFilter === item.id && (
                  <View style={[
                    styles.radioButtonDot,
                    { backgroundColor: '#3b82f6' }
                  ]} />
                )}
              </View>
              <Text style={{ 
                fontSize: 16, 
                color: activeFilter === item.id ? '#1e293b' : '#475569',
                fontWeight: activeFilter === item.id ? '500' : 'normal'
              }}>
                {item.label}
              </Text>
          </TouchableOpacity>
          ))}
      </View>
      
              <TouchableOpacity 
          style={styles.resetButton}
                onPress={() => {
            setFilterModalVisible(false);
            fetchCompletedOrders();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'white' }}>
            Apply Filters
          </Text>
              </TouchableOpacity>
      </Pressable>
    </Pressable>
  );

  // Separate component for order item card to properly use hooks
  const OrderItemCard = memo(({ 
    item, 
    delay, 
    onSelectOrder,
    getItemAnimations,
    setItemPressed,
    pressedItems,
    animateItemEntrance
  }) => {
    const id = item.id;
    
    // Trigger animation on first render
    useEffect(() => {
      animateItemEntrance(id, delay);
    }, [id, delay, animateItemEntrance]);
    
    // Format the date for display
    const formattedDate = item.completedAt.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    // Get animations for this item
    const { fade, translate, scale } = getItemAnimations(id);
    const isPressed = pressedItems[id] || false;
    
    // Generate star rating display
    const renderRating = (rating) => {
      if (rating <= 0) {
        return <Text style={[styles.ratingText, { color: '#94a3b8' }]}>No rating</Text>;
      }
      
      // Show filled stars based on rating
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Ionicons 
              key={star} 
              name={star <= Math.floor(rating) ? "star" : star <= rating ? "star-half" : "star-outline"} 
              size={14} 
              color="#f59e0b" 
              style={{ marginRight: 2 }}
            />
          ))}
          <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          </View>
      );
    };
    
    return (
          <Animated.View 
        style={{
          opacity: fade,
          transform: [{ translateY: translate }, { scale }],
          marginHorizontal: 16,
        }}
          >
            <Pressable
          style={styles.card}
          onPress={() => {
            onSelectOrder(item);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          onPressIn={() => setItemPressed(id, true)}
          onPressOut={() => setItemPressed(id, false)}
          android_ripple={{ color: '#e2e8f0' }}
        >
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1e293b' }}>
                  {item.orderNumber}
                </Text>
                <Text style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>
                  {formattedDate}
                </Text>
                    </View>
              
              <View style={{ 
                backgroundColor: '#ecfdf5', 
                paddingHorizontal: 10, 
                paddingVertical: 4, 
                borderRadius: 12,
                justifyContent: 'center'
              }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#10b981' }}>
                  Completed
                </Text>
                  </View>
                  </View>

            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#64748b', marginBottom: 4 }}>
                  Customer
                </Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#334155' }}>
                  {item.customerName}
                </Text>
                </View>
                
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '500', color: '#64748b', marginBottom: 4 }}>
                  Items
                </Text>
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#334155' }}>
                  {item.itemsCount || item.items?.length || 0} items
                </Text>
                  </View>
                </View>
                
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={styles.ratingContainer}>
                  {renderRating(item.rating)}
                  </View>
                </View>
                
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0f766e' }}>
                ${item.totalAmount.toFixed(2)}
              </Text>
                    </View>
                  </View>
        </Pressable>
      </Animated.View>
    );
  });

  // Render empty state when no orders are found
  const renderEmptyState = () => (
    <View style={styles.noResultsContainer}>
      <Image
        source={{ uri: 'https://cdn-icons-png.flaticon.com/512/7486/7486754.png' }}
        style={styles.emptyStateImage}
        resizeMode="contain"
      />
      {error ? (
        <>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#ef4444', marginBottom: 8 }}>
            Error Loading Orders
          </Text>
          <Text style={{ fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 16 }}>
            {error}
          </Text>
          <TouchableOpacity
            style={{
              paddingHorizontal: 20,
              paddingVertical: 12,
              backgroundColor: '#f1f5f9',
              borderRadius: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={onRefresh}
          >
            <Feather name="refresh-cw" size={16} color="#475569" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 15, fontWeight: '500', color: '#475569' }}>Try Again</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#334155', marginBottom: 8 }}>
            {orders.length > 0 ? 'No Matching Orders Found' : 'No Real Completed Orders Found'}
          </Text>
          <Text style={{ fontSize: 15, color: '#64748b', textAlign: 'center', marginBottom: 16 }}>
            {searchQuery.trim() || activeFilter !== 'all' || selectedDateRange !== 'all'
              ? "Try changing your filters or search query"
              : orders.length > 0 
                ? "You'll now see sample orders for demonstration purposes."
                : "You haven't completed any deliveries yet. Completed deliveries will appear here after you've marked orders as 'Completed'."}
          </Text>
          
          <View style={{ flexDirection: 'column', alignItems: 'center' }}>
            {(searchQuery.trim() || activeFilter !== 'all' || selectedDateRange !== 'all') && (
              <TouchableOpacity
                style={{
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  backgroundColor: '#f1f5f9',
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 16,
                }}
                onPress={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                  setSelectedDateRange('all');
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  onRefresh();
                }}
              >
                <Feather name="refresh-cw" size={16} color="#475569" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 15, fontWeight: '500', color: '#475569' }}>Reset Filters</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={{
                paddingHorizontal: 20,
                paddingVertical: 12,
                backgroundColor: '#eff6ff',
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
              onPress={() => router.push("/(app)/deliveryAgent/Inprogress_Orders")}
            >
              <Feather name="truck" size={16} color="#3b82f6" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 15, fontWeight: '500', color: '#3b82f6' }}>
                Go to In-Progress Orders
              </Text>
            </TouchableOpacity>
                    </View>
        </>
      )}
                  </View>
  );

  // Loading state
  if (loading && !isRefreshing) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={{ marginTop: 12, fontSize: 16, color: '#64748b' }}>
            Loading completed orders...
          </Text>
                </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {renderHeader()}
      {renderSearchBar()}
      
      <Animated.FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        contentContainerStyle={{ 
          paddingTop: 16,
          paddingBottom: 24,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={null}
        ListEmptyComponent={renderEmptyState}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
            colors={['#3b82f6']}
          />
        }
      />
      
      {/* Show filter modal and order detail modal */}
      {filterModalVisible && renderFilterModal()}
      {orderDetailVisible && selectedOrder && renderOrderDetailModal()}
    </SafeAreaView>
  );
}