import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Alert, 
  Animated, 
  Dimensions, 
  ActivityIndicator,
  Image,
  Platform,
  Vibration,
  StatusBar,
  Modal,
  TextInput,
  ScrollView
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons, MaterialCommunityIcons, Feather, FontAwesome5, AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HomeHeader from "app/components/HomeHeader";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { collection, getDocs, query, where, orderBy, updateDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from "../../../firebase/firebaseConfig";

const { width, height } = Dimensions.get('window');

export default function DeliveryOrders() {
  const { agentId, agentName } = useLocalSearchParams();
  const router = useRouter();
  
  // States
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [orderDetailModalVisible, setOrderDetailModalVisible] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [statusCategories, setStatusCategories] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    assignedOrders: 0,
    completedOrders: 0,
  });
  
  // Animation refs with optimized initial values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const orderScaleAnims = useRef({}).current;
  const refreshAnim = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0)).current;
  const modalFade = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-30)).current;
  const detailModalScale = useRef(new Animated.Value(0)).current;
  const detailModalFade = useRef(new Animated.Value(0)).current;
  
  // Fetch orders from Firestore
  const fetchOrders = async () => {
    try {
    setLoading(true);
    
      // Query the orders collection
      const ordersRef = collection(db, "orders");
      const ordersQuery = query(
        ordersRef, 
        orderBy("createdAt", "desc")
      );
      
      const querySnapshot = await getDocs(ordersQuery);
      
      if (querySnapshot.empty) {
        console.log("No orders found");
        setOrders([]);
        setFilteredOrders([]);
      setLoading(false);
        return;
      }
      
      // Process orders data
      const fetchedOrders = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        // Format the order data
        return {
          id: doc.id,
          orderRef: data.orderRef || `OD-${doc.id.substring(0, 6)}`,
          customer: data.customerInfo?.name || "Unknown Customer",
          customerPhone: data.customerInfo?.phoneNumber || "N/A",
          customerEmail: data.customerInfo?.email || "N/A",
          address: data.deliveryDetails?.address || "N/A",
          location: data.deliveryDetails?.location,
          notes: data.deliveryDetails?.notes || "",
          status: data.orderStatus || "pending",
          totalItems: data.items?.length || 0,
          items: data.items || [],
          date: data.createdAt?.toDate() || new Date(),
          paymentMethod: data.payment?.method || "Cash",
          paymentStatus: data.payment?.status || "pending",
          amount: data.payment?.amount || 0,
          subtotal: data.payment?.subtotal || 0,
          deliveryFee: data.payment?.deliveryFee || 0,
          userId: data.userId || "",
        };
      });
      
      // Set the orders
      setOrders(fetchedOrders);
      
      // Extract unique status categories from orders
      const uniqueStatuses = [...new Set(fetchedOrders.map(order => order.status))];
      const formattedStatuses = uniqueStatuses.map(status => ({
        id: status,
        label: status.charAt(0).toUpperCase() + status.slice(1),
        icon: getStatusIcon(status)
      }));
      
      // Add 'all' category at the beginning
      setStatusCategories([
        { id: 'all', label: 'All Orders', icon: 'list-outline' },
        ...formattedStatuses
      ]);
      
      // Compute stats
      const stats = {
        totalOrders: fetchedOrders.length,
        pendingOrders: fetchedOrders.filter(order => order.status === 'pending').length,
        assignedOrders: fetchedOrders.filter(order => order.status === 'assigned').length,
        completedOrders: fetchedOrders.filter(order => order.status === 'completed').length,
      };
      
      setStats(stats);
      
      // Apply initial filter - by default show all orders
      applyFilters(fetchedOrders, selectedFilter, searchQuery);
      
      // Start animations
      startEntranceAnimations();
      
    } catch (error) {
      console.error("Error fetching orders:", error);
      Alert.alert("Error", "Failed to load delivery orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Get icon name for status
  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'time-outline';
      case 'assigned':
        return 'bicycle-outline';
      case 'in progress':
        return 'reload-outline';
      case 'completed':
        return 'checkmark-circle-outline';
      case 'cancelled':
        return 'close-circle-outline';
      case 'delivered':
        return 'checkmark-done-outline';
      default:
        return 'ellipsis-horizontal-outline';
    }
  };
  
  // Setup initial animations and fetch data
  useEffect(() => {
    fetchOrders();
  }, []);
  
  // Apply search and filter together
  const applyFilters = (ordersData, statusFilter, query) => {
    let results = [...ordersData];
    
    // Apply status filter
    if (statusFilter !== 'all') {
      results = results.filter(order => order.status === statusFilter);
    }
    
    // Apply search filter
    if (query && query.trim() !== "") {
      const searchText = query.toLowerCase();
      results = results.filter(order => 
        (order.orderRef && order.orderRef.toString().toLowerCase().includes(searchText)) ||
        (order.customer && order.customer.toLowerCase().includes(searchText)) || 
        (order.address && order.address.toLowerCase().includes(searchText))
      );
    }
    
    setFilteredOrders(results);
  };
  
  useEffect(() => {
    if (orders.length > 0) {
      applyFilters(orders, selectedFilter, searchQuery);
    }
  }, [orders, selectedFilter, searchQuery]);
  
  // Start entrance animations with optimized timing
  const startEntranceAnimations = () => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
        duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
        duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
        friction: 7,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(headerTranslateY, {
          toValue: 0,
        duration: 400,
          useNativeDriver: true,
        })
      ]).start();
  };
  
  // Create animations for each order item - optimized to reduce memory usage
  useEffect(() => {
    // Clear unused animations to prevent memory leaks
    const currentOrderIds = new Set(filteredOrders.map(order => order.id));
    
    // Remove animations for orders that are no longer in the list
    Object.keys(orderScaleAnims).forEach(id => {
      if (!currentOrderIds.has(id)) {
        delete orderScaleAnims[id];
      }
    });
    
    // Initialize animations for new orders
    filteredOrders.forEach((order) => {
      if (!orderScaleAnims[order.id]) {
        orderScaleAnims[order.id] = new Animated.Value(1);
      }
    });
  }, [filteredOrders]);
  
  // Filter orders based on status
  const filterOrders = (status) => {
    setSelectedFilter(status);
    setFilterModalVisible(false);
  };
  
  // Handle order assignment with faster animations
  const assignOrder = (orderId) => {
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      try {
        const Haptics = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        Vibration.vibrate(40);
      }
    } else {
      Vibration.vibrate(40);
    }
    
    // Animate the order card with faster timing
    Animated.sequence([
      Animated.timing(orderScaleAnims[orderId], {
        toValue: 0.95,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.timing(orderScaleAnims[orderId], {
        toValue: 1.03,
        duration: 70,
        useNativeDriver: true,
      }),
      Animated.timing(orderScaleAnims[orderId], {
        toValue: 1,
        duration: 70,
        useNativeDriver: true,
      })
    ]).start();
    
    // Find the order
    const orderToAssign = orders.find(order => order.id === orderId);
    setSelectedOrder(orderToAssign);
    
    // Show modal with faster animation
    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(modalFade, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
  };
  
  // Close assignment modal
  const closeModal = () => {
    Animated.parallel([
      Animated.timing(modalScale, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(modalFade, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start(() => {
      setSelectedOrder(null);
    });
  };
  
  // Confirm order assignment - fixed implementation
  const confirmAssignment = async (orderId) => {
    if (!orderId || !agentId) return;
    
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      try {
        const Haptics = require('expo-haptics');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        Vibration.vibrate(100);
      }
    } else {
      Vibration.vibrate([0, 100, 50, 100]);
    }
    
    try {
      // First close the order detail modal
      closeOrderDetailModal();
      
      // Update the order status in Firestore
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        orderStatus: 'assigned',
        deliveryAgent: {
          id: agentId,
          name: agentName || 'Delivery Agent',
          assignedAt: serverTimestamp()
        },
        orderStatusHistory: [
          ...((selectedOrder.orderStatusHistory || []).map(item => ({
            status: item.status,
            timestamp: item.timestamp
          }))),
          {
            status: 'assigned',
            timestamp: new Date()
          }
        ]
      });
      
      // Update orders in state
    const updatedOrders = orders.map(order =>
        order.id === orderId ? { ...order, status: 'assigned' } : order
    );
    
            setOrders(updatedOrders);
    
      // Re-apply filters to update the UI
    setTimeout(() => {
        applyFilters(updatedOrders, selectedFilter, searchQuery);
    }, 300);
      
      // Show success alert
      Alert.alert(
        "Success", 
        "Order has been successfully assigned to the delivery agent.",
        [{ text: "OK" }]
      );
      
    } catch (error) {
      console.error("Error assigning order:", error);
      Alert.alert("Error", "Failed to assign order. Please try again.");
    }
  };
  
  // Handle refresh animation and data reload
  const handleRefresh = () => {
    setRefreshing(true);
    
    // Animate refresh icon
    Animated.timing(refreshAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      refreshAnim.setValue(0);
    });
    
    fetchOrders();
  };
  
  // Get status color for UI display
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#F59E0B';
      case 'assigned':
        return '#3B82F6';
      case 'in progress':
        return '#8B5CF6';
      case 'completed':
        return '#10B981';
      case 'cancelled':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  // Get status background color for UI display
  const getStatusBgColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'rgba(245, 158, 11, 0.1)';
      case 'assigned':
        return 'rgba(59, 130, 246, 0.1)';
      case 'in progress':
        return 'rgba(139, 92, 246, 0.1)';
      case 'completed':
        return 'rgba(16, 185, 129, 0.1)';
      case 'cancelled':
        return 'rgba(239, 68, 68, 0.1)';
      default:
        return 'rgba(107, 114, 128, 0.1)';
    }
  };
  
  // Render filter modal
  const renderFilterModal = () => {
    return (
      <Modal
        transparent={true}
        visible={filterModalVisible}
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity 
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
        >
          <View
            style={{
              width: wp('80%'),
            backgroundColor: 'white',
              borderRadius: 15,
              padding: 20,
              elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>
                Filter Orders
              </Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
              </View>
            
            {statusCategories.length > 0 ? (
              statusCategories.map((filter) => (
            <TouchableOpacity
                  key={filter.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 10,
                    borderRadius: 8,
                    backgroundColor: selectedFilter === filter.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    marginBottom: 8,
                  }}
                  onPress={() => filterOrders(filter.id)}
                >
                  <Ionicons
                    name={filter.icon}
                    size={22}
                    color={selectedFilter === filter.id ? '#3B82F6' : '#6B7280'}
                  />
                  <Text
                    style={{
                      marginLeft: 12,
                      fontSize: 16,
                      color: selectedFilter === filter.id ? '#3B82F6' : '#1F2937',
                      fontWeight: selectedFilter === filter.id ? '600' : 'normal',
                    }}
                  >
                    {filter.label} 
                    {filter.id !== 'all' && (
                      <Text style={{ fontSize: 14, color: '#6B7280' }}>
                        {' '}({orders.filter(order => order.status === filter.id).length})
                      </Text>
                    )}
                  </Text>
                  {selectedFilter === filter.id && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color="#3B82F6"
                      style={{ marginLeft: 'auto' }}
                    />
                  )}
            </TouchableOpacity>
              ))
            ) : (
              <View style={{ alignItems: 'center', padding: 20 }}>
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text style={{ marginTop: 10, color: '#6B7280' }}>Loading filters...</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };
  
  // Render assignment modal
  const renderAssignmentModal = () => {
    if (!selectedOrder) return null;
    
    // Helper function to estimate delivery time based on order items and distance
    const getEstimatedDeliveryTime = () => {
      const itemCount = selectedOrder.items?.length || 0;
      
      // For demo purposes - would use actual distance calculation in production
      const distance = 5; // km
      const baseTime = 15; // minutes
      const timePerItem = 2; // minutes per item
      const timePerKm = 3; // minutes per km
      
      const estimatedTime = baseTime + (itemCount * timePerItem) + (distance * timePerKm);
      return `${estimatedTime} minutes`;
    };
    
    return (
      <Modal
        transparent={true}
        visible={!!selectedOrder}
        animationType="none"
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={closeModal}
      >
        <Animated.View
          style={{
              width: wp('85%'),
              backgroundColor: 'white',
              borderRadius: 20,
              overflow: 'hidden',
            transform: [{ scale: modalScale }],
              opacity: modalFade,
              elevation: 5,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 4.65,
            }}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <LinearGradient
                colors={['#3B82F6', '#1D4ED8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  padding: 16,
                  paddingBottom: 20,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'white' }}>
                    Assign Delivery
                  </Text>
                  <TouchableOpacity onPress={closeModal}>
                    <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
              </View>
                <Text style={{ color: 'rgba(255,255,255,0.8)', marginTop: 5 }}>
                  Order #{selectedOrder.orderRef}
                </Text>
            </LinearGradient>
            
              <View style={{ padding: 16 }}>
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 8 }}>
                    Customer Details
                      </Text>
                  <View style={{ backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Ionicons name="person" size={18} color="#6B7280" style={{ marginRight: 8 }} />
                      <Text style={{ color: '#1F2937', flex: 1 }}>{selectedOrder.customer}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <Ionicons name="call" size={18} color="#6B7280" style={{ marginRight: 8 }} />
                      <Text style={{ color: '#1F2937', flex: 1 }}>{selectedOrder.customerPhone}</Text>
                  </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="mail" size={18} color="#6B7280" style={{ marginRight: 8 }} />
                      <Text style={{ color: '#1F2937', flex: 1 }}>{selectedOrder.customerEmail}</Text>
                    </View>
                  </View>
                </View>
                
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 8 }}>
                    Delivery Address
                    </Text>
                  <View style={{ backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                      <Ionicons name="location" size={18} color="#6B7280" style={{ marginRight: 8, marginTop: 2 }} />
                      <Text style={{ color: '#1F2937', flex: 1 }}>{selectedOrder.address}</Text>
                    </View>
                    {selectedOrder.notes && (
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 8 }}>
                        <Ionicons name="information-circle" size={18} color="#6B7280" style={{ marginRight: 8, marginTop: 2 }} />
                        <Text style={{ color: '#1F2937', flex: 1 }}>{selectedOrder.notes}</Text>
                  </View>
                )}
                  </View>
                </View>
                
                <View style={{ marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 8 }}>
                    Order Details
                  </Text>
                  <View style={{ backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <MaterialCommunityIcons name="shopping-outline" size={18} color="#6B7280" style={{ marginRight: 8 }} />
                      <Text style={{ color: '#1F2937', flex: 1 }}>
                        {selectedOrder.totalItems} {selectedOrder.totalItems === 1 ? 'item' : 'items'}
                      </Text>
                  </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <MaterialIcons name="payment" size={18} color="#6B7280" style={{ marginRight: 8 }} />
                      <Text style={{ color: '#1F2937', flex: 1 }}>
                        {selectedOrder.paymentMethod} - {selectedOrder.paymentStatus.toUpperCase()}
                      </Text>
                  </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <FontAwesome5 name="clock" size={16} color="#6B7280" style={{ marginRight: 10 }} />
                      <Text style={{ color: '#1F2937', flex: 1 }}>
                        Est. Delivery Time: {getEstimatedDeliveryTime()}
                      </Text>
                </View>
                </View>
              </View>
              
                <View style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#1F2937' }}>
                      Order Items
                    </Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#3B82F6' }}>
                      Total: ${selectedOrder.amount.toFixed(2)}
                            </Text>
                          </View>
                  <View style={{ backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8, maxHeight: 150 }}>
                    <ScrollView style={{ maxHeight: 150 }}>
                      {selectedOrder.items.map((item, index) => (
                        <View key={item.id || index} style={{ 
                          flexDirection: 'row', 
                          justifyContent: 'space-between', 
                          marginBottom: index < selectedOrder.items.length - 1 ? 8 : 0,
                          paddingBottom: index < selectedOrder.items.length - 1 ? 8 : 0,
                          borderBottomWidth: index < selectedOrder.items.length - 1 ? 1 : 0,
                          borderBottomColor: 'rgba(0,0,0,0.05)'
                        }}>
                          <Text style={{ color: '#1F2937', flex: 1 }}>{item.productName}</Text>
                          <View style={{ flexDirection: 'row', width: 100, justifyContent: 'space-between' }}>
                            <Text style={{ color: '#6B7280' }}>x{item.quantity}</Text>
                            <Text style={{ color: '#1F2937', fontWeight: '500' }}>${item.totalPrice.toFixed(2)}</Text>
                        </View>
                      </View>
                      ))}
                    </ScrollView>
                    </View>
                  </View>
                
                <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                  <TouchableOpacity 
                    style={{
                      flex: 1,
                      backgroundColor: '#EFF6FF',
                      paddingVertical: 12,
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 10,
                    }}
                    onPress={closeModal}
                  >
                    <Text style={{ color: '#3B82F6', fontWeight: '600' }}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={{
                      flex: 1,
                      backgroundColor: '#3B82F6',
                      paddingVertical: 12,
                      borderRadius: 8,
                      justifyContent: 'center',
                      alignItems: 'center',
                      flexDirection: 'row',
                    }}
                    onPress={() => confirmAssignment(selectedOrder.id)}
                  >
                    <Ionicons name="bicycle" size={18} color="white" style={{ marginRight: 8 }} />
                    <Text style={{ color: 'white', fontWeight: '600' }}>Assign Order</Text>
                  </TouchableOpacity>
                  </View>
                    </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    );
  };
  
  // Render individual order items
  const renderOrderItem = ({ item, index }) => {
    // Create item animation if it doesn't exist
    if (!orderScaleAnims[item.id]) {
      orderScaleAnims[item.id] = new Animated.Value(1);
    }
    
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            { translateY: translateY },
            { scale: orderScaleAnims[item.id] }
          ],
          key: item.id,
        }}
      >
        <TouchableOpacity
          style={{
            backgroundColor: 'white',
            marginBottom: 10,
            borderRadius: 12,
            padding: 16,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 1.41,
          }}
          onPress={() => showOrderDetails(item)}
          activeOpacity={0.7}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F2937' }}>
              #{item.orderRef}
            </Text>
            <View style={{ 
              backgroundColor: getStatusBgColor(item.status),
              paddingVertical: 4,
              paddingHorizontal: 8,
              borderRadius: 6,
            }}>
              <Text style={{ 
                color: getStatusColor(item.status),
                fontWeight: '600',
                fontSize: 12,
                textTransform: 'capitalize'
              }}>
                {item.status}
              </Text>
                  </View>
                </View>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="location-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 14, color: '#4B5563', flex: 1 }} numberOfLines={1}>
              {item.address}
            </Text>
              </View>
              
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="shopping-outline" size={16} color="#6B7280" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 14, color: '#4B5563' }}>
                {item.totalItems} {item.totalItems === 1 ? 'item' : 'items'}
              </Text>
                  </View>
                  
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialIcons name="payment" size={16} color="#6B7280" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 14, color: '#4B5563', fontWeight: '500' }}>
                {item.amount.toFixed(2)} Birr
      </Text>
                </View>
              </View>
              
          <View style={{ 
            marginTop: 10,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: '#F3F4F6'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="time-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 12, color: '#6B7280' }}>
                {new Date(item.date).toLocaleDateString()}
              </Text>
                      </View>
              
                  <TouchableOpacity
              style={{
                backgroundColor: '#EFF6FF',
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 6,
                flexDirection: 'row',
                alignItems: 'center',
              }}
              onPress={() => showOrderDetails(item)}
            >
              <MaterialIcons name="visibility" size={16} color="#3B82F6" style={{ marginRight: 4 }} />
              <Text style={{ color: '#3B82F6', fontWeight: '500', fontSize: 13 }}>
                View Details
              </Text>
    </TouchableOpacity>
                </View>
        </TouchableOpacity>
        </Animated.View>
    );
  };
  
  // Get customer details and show order details modal - optimized for faster loading
  const showOrderDetails = async (order) => {
    try {
      // Provide haptic feedback
      if (Platform.OS === 'ios') {
        try {
          const Haptics = require('expo-haptics');
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (e) {
          Vibration.vibrate(30);
        }
      } else {
        Vibration.vibrate(30);
      }
  
      // Set order data first to improve perceived performance
      setSelectedOrder(order);
      setOrderDetailModalVisible(true);
      
      // Start modal animations immediately for better perceived performance
      Animated.parallel([
        Animated.spring(detailModalScale, {
          toValue: 1,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(detailModalFade, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
      
      // Fetch customer details in background if we have a userId
      if (order.userId) {
        const userDocRef = doc(db, "users", order.userId);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          setCustomerData(userDoc.data());
        } else {
          console.log("No customer data found");
          setCustomerData(null);
        }
      } else {
        setCustomerData(null);
      }
    } catch (error) {
      console.error("Error fetching customer data:", error);
      // Modal is already showing, so we can just log the error
    }
  };
  
  // Close order detail modal
  const closeOrderDetailModal = () => {
    Animated.parallel([
      Animated.timing(detailModalScale, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(detailModalFade, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      })
    ]).start(() => {
      setOrderDetailModalVisible(false);
      setSelectedOrder(null);
      setCustomerData(null);
    });
  };
  
  // Render order detail modal
  const renderOrderDetailModal = () => {
    if (!selectedOrder) return null;
    
    const formatDate = (date) => {
      if (!date) return "N/A";
      return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };
    
    const statusColor = getStatusColor(selectedOrder.status);
    
    return (
      <Modal
        transparent={true}
        visible={orderDetailModalVisible}
        animationType="none"
        onRequestClose={closeOrderDetailModal}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={closeOrderDetailModal}
        >
      <Animated.View
        style={{
              width: wp('90%'),
              maxHeight: hp('85%'),
              backgroundColor: 'white',
              borderRadius: 20,
              overflow: 'hidden',
              transform: [{ scale: detailModalScale }],
              opacity: detailModalFade,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <View style={{ maxHeight: hp('85%'), display: 'flex', flexDirection: 'column' }}>
                <LinearGradient
                  colors={[statusColor + '20', '#f8fafc']}
                  start={[0, 0]}
                  end={[0, 1]}
                  style={{
                    padding: 20,
                    borderBottomLeftRadius: 20,
                    borderBottomRightRadius: 20,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ 
                        fontSize: 20, 
                        fontWeight: 'bold', 
                        color: '#0f172a',
                        marginBottom: 4,
                      }}>
                        Order #{selectedOrder.orderRef}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: statusColor,
                          marginRight: 6,
                        }} />
                        <Text style={{ color: statusColor, fontWeight: '600', textTransform: 'capitalize' }}>
                          {selectedOrder.status}
                        </Text>
                      </View>
                    </View>
                    
        <TouchableOpacity
                      onPress={closeOrderDetailModal}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: 'rgba(203, 213, 225, 0.4)',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <Feather name="x" size={20} color="#64748b" />
                    </TouchableOpacity>
                </View>
                  
                  <View style={{
                    flexDirection: 'row',
                    marginTop: 16, 
                    alignItems: 'center'
                  }}>
                    <View style={{ 
                      width: 60, 
                      height: 60, 
                      borderRadius: 30,
                      backgroundColor: '#e2e8f0',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 2,
                      borderColor: '#fff',
                    }}>
                      <Ionicons name="person" size={30} color="#94a3b8" />
                  </View>
                    
                    <View style={{ marginLeft: 16, flex: 1 }}>
                      <Text style={{ 
                        fontSize: 18, 
                        fontWeight: 'bold', 
                        color: '#0f172a',
                        marginBottom: 2,
                      }}>
                        {customerData?.fullName || customerData?.name || selectedOrder.customer}
                      </Text>
                      
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                        <Feather name="phone" size={14} color="#64748b" />
                        <Text style={{ 
                          color: '#64748b', 
                          marginLeft: 6, 
                          fontSize: 14,
                        }}>
                          {customerData?.phoneNumber || customerData?.phone || selectedOrder.customerPhone}
                        </Text>
                </View>
                      
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Feather name="mail" size={14} color="#64748b" />
                        <Text style={{ 
                          color: '#64748b', 
                          marginLeft: 6, 
                          fontSize: 14,
                        }}>
                          {customerData?.email || selectedOrder.customerEmail || "No email provided"}
                        </Text>
              </View>
                    </View>
                  </View>
                </LinearGradient>
                
                <ScrollView 
                  style={{ maxHeight: hp('55%') }}
                  showsVerticalScrollIndicator={false}
                >
                  <View style={{ padding: 20 }}>
                    {/* Delivery Address */}
                    <View style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 16,
                    }}>
                      <Text style={{ 
                        fontSize: 16, 
                        fontWeight: 'bold', 
                        marginBottom: 16,
                        color: '#0f172a',
                      }}>
                        Delivery Address
                </Text>
                      
                      <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                        <View style={{
                          width: 36, 
                          alignItems: 'center',
                          marginRight: 8,
                        }}>
                          <View style={{
                            width: 26,
                            height: 26,
                            borderRadius: 13,
                            backgroundColor: '#f43f5e',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}>
                            <Feather name="map-pin" size={14} color="white" />
                </View>
            </View>
            
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#0f172a', fontWeight: '500', marginBottom: 2 }}>
                            Shipping Address
                          </Text>
                          <Text style={{ color: '#64748b', fontSize: 14 }}>
                            {selectedOrder.address}
                          </Text>
                        </View>
              </View>
              
                      {selectedOrder.notes && (
                        <View style={{ flexDirection: 'row', marginTop: 8 }}>
                          <View style={{
                            width: 36, 
                            alignItems: 'center',
                            marginRight: 8,
                          }}>
                            <View style={{
                              width: 26,
                              height: 26,
                              borderRadius: 13,
                              backgroundColor: '#3b82f6',
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}>
                              <Feather name="info" size={14} color="white" />
                            </View>
              </View>
              
                          <View style={{ flex: 1 }}>
                            <Text style={{ color: '#0f172a', fontWeight: '500', marginBottom: 2 }}>
                              Delivery Notes
                            </Text>
                            <Text style={{ color: '#64748b', fontSize: 14 }}>
                              {selectedOrder.notes}
                            </Text>
                          </View>
                        </View>
                      )}
                </View>
                
                    {/* Order Summary */}
                    <View style={{
                      backgroundColor: '#f8fafc',
                      borderRadius: 16,
                      padding: 16,
                      marginBottom: 16,
                    }}>
                      <Text style={{ 
                        fontSize: 16, 
                        fontWeight: 'bold', 
                        marginBottom: 16,
                        color: '#0f172a',
                      }}>
                        Order Summary
                      </Text>
                      
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#64748b', fontSize: 13, marginBottom: 4 }}>Order Date</Text>
                          <Text style={{ color: '#0f172a', fontWeight: '500' }}>
                            {formatDate(selectedOrder.date)}
                          </Text>
                </View>
                        
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                          <Text style={{ color: '#64748b', fontSize: 13, marginBottom: 4 }}>Payment Method</Text>
                          <Text style={{ color: '#0f172a', fontWeight: '500', textTransform: 'capitalize' }}>
                            {selectedOrder.paymentMethod}
                          </Text>
              </View>
            </View>
            
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: '#64748b', fontSize: 13, marginBottom: 4 }}>Payment Status</Text>
                          <View style={{ 
                            flexDirection: 'row', 
                            alignItems: 'center',
                            backgroundColor: selectedOrder.paymentStatus === 'completed' ? '#dcfce7' : '#fef9c3',
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 12,
                            alignSelf: 'flex-start'
                          }}>
                            <View style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: selectedOrder.paymentStatus === 'completed' ? '#10b981' : '#f59e0b',
                              marginRight: 4
                            }} />
                            <Text style={{ 
                              color: selectedOrder.paymentStatus === 'completed' ? '#10b981' : '#f59e0b',
                              fontSize: 13,
                              fontWeight: '600',
                              textTransform: 'capitalize'
                            }}>
                              {selectedOrder.paymentStatus}
                            </Text>
                          </View>
                        </View>
                        
                        <View style={{ flex: 1, alignItems: 'flex-end' }}>
                          <Text style={{ color: '#64748b', fontSize: 13, marginBottom: 4 }}>Total Items</Text>
                          <Text style={{ color: '#0f172a', fontWeight: '500' }}>
                            {selectedOrder.totalItems}
                          </Text>
                        </View>
                      </View>
                    </View>
                    
                    {/* Order Items */}
                    <View style={{ marginBottom: 16 }}>
                      <View style={{ 
                        flexDirection: 'row', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: 12
                      }}>
                        <Text style={{ 
                          fontSize: 16, 
                          fontWeight: 'bold',
                          color: '#0f172a',
                        }}>
                          Order Items
                        </Text>
                        <Text style={{ fontWeight: '700', color: '#0f172a' }}>
                          {selectedOrder.amount.toFixed(2)} Birr
                        </Text>
                      </View>
                      
                      <View style={{
                        backgroundColor: '#f8fafc',
                        borderRadius: 16,
                        padding: 16,
                      }}>
                        {selectedOrder.items.map((item, index) => (
                          <View 
                            key={item.id || index}
                            style={{
                              flexDirection: 'row',
                              padding: 10,
                              backgroundColor: 'white',
                              borderRadius: 12,
                              marginBottom: index < selectedOrder.items.length - 1 ? 8 : 0,
                              elevation: 1,
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.1,
                              shadowRadius: 1,
                            }}
                          >
                            <View style={{ 
                              marginRight: 12, 
                              width: 40, 
                              height: 40, 
                              backgroundColor: '#f1f5f9', 
                              borderRadius: 8, 
                              justifyContent: 'center', 
                              alignItems: 'center',
                            }}>
                              <MaterialCommunityIcons name="food" size={20} color="#64748b" />
                            </View>
                            
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontWeight: '500', color: '#0f172a', marginBottom: 2 }}>
                                {item.productName}
                              </Text>
                              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                <Text style={{ color: '#64748b', fontSize: 13 }}>
                                  {item.quantity} x {item.price.toFixed(2)} Birr
                                </Text>
                                <Text style={{ fontWeight: '600', color: '#0f172a' }}>
                                  {item.totalPrice.toFixed(2)} Birr
                                </Text>
                              </View>
                            </View>
                          </View>
                        ))}
                        
                        {/* Price Summary */}
                        <View style={{ marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0' }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                            <Text style={{ color: '#64748b' }}>Subtotal:</Text>
                            <Text style={{ color: '#0f172a' }}>{selectedOrder.subtotal.toFixed(2)} Birr</Text>
                          </View>
                          
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                            <Text style={{ color: '#64748b' }}>Delivery Fee:</Text>
                            <Text style={{ color: '#0f172a' }}>{selectedOrder.deliveryFee.toFixed(2)} Birr</Text>
                          </View>
                          
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0' }}>
                            <Text style={{ fontWeight: '600', color: '#0f172a' }}>Total:</Text>
                            <Text style={{ fontWeight: '700', color: '#0f172a', fontSize: 16 }}>
                              {selectedOrder.amount.toFixed(2)} Birr
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </ScrollView>
                
                {/* Action Buttons */}
                <View style={{ 
                  flexDirection: 'row', 
                  padding: 16, 
                  borderTopWidth: 1, 
                  borderTopColor: '#f1f5f9',
                  backgroundColor: '#f8fafc',
                }}>
                <TouchableOpacity
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      borderRadius: 12,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: '#eff6ff',
                      marginRight: 8,
                    }}
                    onPress={closeOrderDetailModal}
                  >
                    <Text style={{ color: '#3b82f6', fontWeight: '600' }}>Close</Text>
                </TouchableOpacity>
                  
                  {selectedOrder.status === 'pending' && (
                    <TouchableOpacity 
                      style={{
                        flex: 1,
                        backgroundColor: '#3b82f6',
                        paddingVertical: 12,
                        borderRadius: 12,
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'row',
                      }}
                      onPress={() => confirmAssignment(selectedOrder.id)}
                    >
                      <Feather name="truck" size={16} color="white" style={{ marginRight: 8 }} />
                      <Text style={{ color: 'white', fontWeight: '600' }}>Assign Delivery</Text>
                    </TouchableOpacity>
                  )}
                </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
        </TouchableOpacity>
      </Modal>
    );
  };
  
  // Main render
    return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F3F4F6' }}>
      <HomeHeader title="Delivery Orders" iconName="bicycle" />
      {/* Header */}
      <Animated.View
        style={{
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: 10,
          transform: [{ translateY: headerTranslateY }],
        }}
      >
        
        
       
      </Animated.View>
      
      {/* Order Stats */}
      <Animated.View 
        style={{
          flexDirection: 'row',
          padding: 12,
          transform: [{ scale: scaleAnim }],
          opacity: fadeAnim,
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 12,
            marginRight: 8,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 1.41,
          }}
        >
          <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 2 }}>Pending</Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#F59E0B' }}>
            {stats.pendingOrders}
          </Text>
              </View>
        
        <View
          style={{
            flex: 1,
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 12,
            marginRight: 8,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 1.41,
          }}
        >
          <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 2 }}>Assigned</Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#3B82F6' }}>
            {stats.assignedOrders}
          </Text>
              </View>
        
        <View
          style={{
            flex: 1,
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 12,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 1.41,
          }}
        >
          <Text style={{ fontSize: 13, color: '#6B7280', marginBottom: 2 }}>Completed</Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#10B981' }}>
            {stats.completedOrders}
          </Text>
        </View>
      </Animated.View>
       {/* Search Bar with Filter icon */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 12,
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              backgroundColor: 'white',
              borderRadius: 10,
              paddingHorizontal: 12,
              alignItems: 'center',
              height: 44,
              borderWidth: 1,
              borderColor: '#E5E7EB',
            }}
          >
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              style={{
                height: 44,
                flex: 1,
                marginLeft: 8,
                fontSize: 15,
                color: '#1F2937',
              }}
              placeholder="Search orders by ID or address"
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== "" && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            style={{
              backgroundColor: 'white',
              padding: 10,
              borderRadius: 10,
              marginLeft: 10,
              borderWidth: 1,
              borderColor: selectedFilter !== 'all' ? '#3B82F6' : '#E5E7EB',
              height: 44,
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
            }}
            onPress={() => setFilterModalVisible(true)}
          >
            <Ionicons 
              name="filter" 
              size={20} 
              color={selectedFilter !== 'all' ? '#3B82F6' : '#6B7280'} 
            />
          
          {selectedFilter !== 'all' && (
            <View 
                style={{
                  backgroundColor: '#3B82F6',
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                  position: 'absolute',
                  top: -5,
                  right: -5,
                }}
              >
                <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                {filteredOrders.length}
              </Text>
            </View>
          )}
          </TouchableOpacity>
        </View>
        
      {/* Active Filter Indicator */}
      {selectedFilter !== 'all' && (
        <View
          style={{
            marginTop: 12,
            marginHorizontal: 16,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#6B7280', fontSize: 14 }}>
            Filtered by:
          </Text>
          <View
            style={{
              backgroundColor: '#EFF6FF',
              paddingVertical: 4,
              paddingHorizontal: 10,
              borderRadius: 20,
              marginLeft: 8,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Text 
              style={{ 
                color: '#3B82F6',
                fontSize: 14, 
                textTransform: 'capitalize',
                fontWeight: '500'
              }}
            >
              {selectedFilter}
        </Text>
            <TouchableOpacity
              style={{ marginLeft: 6 }}
              onPress={() => filterOrders('all')}
            >
              <Ionicons name="close-circle" size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>
          <Text style={{ marginLeft: 8, color: '#6B7280', fontSize: 14 }}>
            ({filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'})
          </Text>
        </View>
      )}
      
      {/* Orders List */}
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={{ marginTop: 10, color: '#6B7280' }}>Loading orders...</Text>
        </View>
      ) : filteredOrders.length > 0 ? (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.id}
            renderItem={renderOrderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 100, paddingTop: 4 }}
            showsVerticalScrollIndicator={false}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={8}
          updateCellsBatchingPeriod={50}
        />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
          <Ionicons name="cart-outline" size={50} color="#D1D5DB" />
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#4B5563', marginTop: 16 }}>
            No orders found
          </Text>
          <Text style={{ textAlign: 'center', color: '#6B7280', marginTop: 8 }}>
            {searchQuery ? 
              "Try using different search terms" : 
              `There are no ${selectedFilter !== 'all' ? selectedFilter : ''} orders to display`}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#3B82F6',
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 8,
              marginTop: 20,
              flexDirection: 'row',
              alignItems: 'center',
            }}
            onPress={handleRefresh}
          >
            <Ionicons name="refresh" size={18} color="white" style={{ marginRight: 8 }} />
            <Text style={{ color: 'white', fontWeight: '600' }}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Render Modals */}
      {renderFilterModal()}
      {renderAssignmentModal()}
      {renderOrderDetailModal()}
    </SafeAreaView>
  );
}
