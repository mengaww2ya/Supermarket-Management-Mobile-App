import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  StatusBar,
  Animated,
  Dimensions,
  Platform,
  StyleSheet,
  ImageBackground,
  SafeAreaView,
  Pressable,
  ActivityIndicator,
  Alert
} from "react-native";
import { Ionicons, Feather, FontAwesome5, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { router, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from 'expo-haptics';
import HomeHeader from "../../../components/HomeHeader";
import { db, auth } from "../../../../firebase/firebaseConfig";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit,
  serverTimestamp, 
  doc,
  getDoc
} from 'firebase/firestore';
import { useAuth } from "../../../context/authContext";

const { width, height } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // State
  const [isOnline, setIsOnline] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [greeting, setGreeting] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Delivery data state
  const [activeOrder, setActiveOrder] = useState(null);
  const [newOrders, setNewOrders] = useState([]);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [weeklyEarnings, setWeeklyEarnings] = useState([0, 0, 0, 0, 0, 0, 0]);
  
  // Calculate earnings for weekly chart data
  const maxEarning = Math.max(...weeklyEarnings, 1); // Prevent division by zero
  
  // Fetch delivery data from the authenticated user's tasks collection
  const fetchDeliveryData = useCallback(async () => {
    if (!user) {
      setError("Not logged in. Please log in to view your tasks.");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log("Fetching tasks for user:", user.uid);
      const tasksRef = collection(db, `users/${user.uid}/tasks`);
      const tasksSnapshot = await getDocs(tasksRef);
      
      if (tasksSnapshot.empty) {
        console.log("No tasks found for user");
        setNewOrders([]);
        setActiveOrder(null);
        setDeliveredOrders([]);
        setLoading(false);
        return;
      }
      
      const pendingOrders = [];
      const inProgressOrders = [];
      const completedOrders = [];
      
      tasksSnapshot.forEach(doc => {
        const task = {
          id: doc.id,
          ...doc.data(),
          // Format any timestamp fields
          formattedCreatedAt: doc.data().createdAt ? 
            new Date(doc.data().createdAt.seconds * 1000).toLocaleString() : 
            'Unknown date'
        };
        
        switch(task.status) {
          case 'Pending':
          case 'Assigned':
            pendingOrders.push(task);
            break;
          case 'In Progress':
            inProgressOrders.push(task);
            break;
          case 'Delivered':
          case 'Completed':
            completedOrders.push(task);
            break;
          default:
            pendingOrders.push(task); // Default to pending if status unknown
        }
      });
      
      // Calculate weekly earnings (simplified example)
      const today = new Date();
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(today.getDate() - 7);
      
      // Create an array to hold earnings by day of week
      const weeklyEarningsData = [0, 0, 0, 0, 0, 0, 0]; // Mon to Sun
      
      // Process completed orders for earnings
      completedOrders.forEach(order => {
        if (order.createdAt) {
          const orderDate = new Date(order.createdAt.seconds * 1000);
          if (orderDate >= oneWeekAgo) {
            // Get day of week (0 = Sunday, 1 = Monday, etc.)
            const dayOfWeek = orderDate.getDay();
            // Convert to our format (0 = Monday, ... 6 = Sunday)
            const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            // Add the order amount to that day
            const amount = parseFloat(order.totalAmount) || 0;
            weeklyEarningsData[dayIndex] += amount;
          }
        }
      });
      
      // Sort orders by date (newest first)
      const sortByDate = (a, b) => {
        if (!a.createdAt || !b.createdAt) return 0;
        return b.createdAt.seconds - a.createdAt.seconds;
      };
      
      // Set states with sorted arrays
      setNewOrders(pendingOrders.sort(sortByDate));
      setActiveOrder(inProgressOrders.length > 0 ? inProgressOrders[0] : null);
      setDeliveredOrders(completedOrders.sort(sortByDate));
      setWeeklyEarnings(weeklyEarningsData);
      
    } catch (err) {
      console.error("Error fetching delivery data:", err);
      setError("Could not load your deliveries. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);
  
  // Initial data fetch
  useEffect(() => {
    fetchDeliveryData();
  }, [fetchDeliveryData]);
  
  // Animations setup
  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
    
    // Start pulse animation for active orders
    startPulseAnimation();
  }, []);
  
  // Pulse animation for active order card
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };
  
  // Update time and greeting based on time of day
  useEffect(() => {
    const timeInterval = setInterval(() => {
      const now = new Date();
      const options = { hour: '2-digit', minute: '2-digit' };
      setCurrentTime(now.toLocaleTimeString([], options));
      
      const hour = now.getHours();
      let greetingText = "Good morning";
      if (hour >= 12 && hour < 18) {
        greetingText = "Good afternoon";
      } else if (hour >= 18) {
        greetingText = "Good evening";
      }
      setGreeting(greetingText);
    }, 1000);
    
    return () => clearInterval(timeInterval);
  }, []);
  
  // Toggle online status with haptic feedback
  const toggleOnlineStatus = () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Fallback if haptics not available
      }
    }
    setIsOnline(!isOnline);
  };
  
  // Expand/collapse sections
  const toggleExpand = (section) => {
    if (expanded === section) {
      setExpanded(null);
    } else {
      setExpanded(section);
      
      // Haptic feedback
      if (Platform.OS === 'ios') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (e) {
          // Fallback if haptics not available
        }
      }
    }
  };

  // Navigate to Assigned Deliveries List
  const navigateToAssignedDeliveries = () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Fallback if haptics not available
      }
    }
    
    router.push("/deliveryAgent/Assigned_deliveries_list");
  };

  // Navigate to Completed Orders
  const navigateToCompletedOrders = () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Fallback if haptics not available
      }
    }
    
    router.push("/deliveryAgent/Completed_Orders");
  };

  // Navigate to In-Progress Orders
  const navigateToInProgressOrders = () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Fallback if haptics not available
      }
    }
    
    router.push("/deliveryAgent/Inprogress_Orders");
  };

  const rightIcon = {
    name: isOnline ? "flash" : "flash-off",
    onPress: toggleOnlineStatus
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <HomeHeader
        title={`${greeting}, ${user?.displayName?.split(' ')[0] || 'Delivery Agent'}`}
        rightIcon={rightIcon}
      />
      
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={{ marginTop: 15, color: '#666' }}>Loading your deliveries...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <MaterialIcons name="error-outline" size={60} color="#f44336" />
          <Text style={{ marginTop: 15, color: '#333', fontSize: 16, textAlign: 'center' }}>{error}</Text>
          <TouchableOpacity 
            style={{ 
              marginTop: 20, 
              backgroundColor: '#4A90E2',
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 8
            }}
            onPress={fetchDeliveryData}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {/* Status and Time */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            paddingHorizontal: 15,
            marginBottom: 20,
            marginTop: 5
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ 
                width: 12, 
                height: 12, 
                borderRadius: 6, 
                backgroundColor: isOnline ? '#4CAF50' : '#F44336',
                marginRight: 6
              }} />
              <Text style={{ color: '#64748b', fontSize: 15 }}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
            <Text style={{ color: '#64748b', fontSize: 15 }}>
              {currentTime}
            </Text>
          </View>
          
          {/* Current Delivery Card */}
          {activeOrder ? (
            <Animated.View
              style={{
                transform: [{ scale: pulseAnim }],
                marginHorizontal: 15,
                marginBottom: 25,
                backgroundColor: 'white',
                borderRadius: 16,
                overflow: 'hidden',
                shadowColor: '#4338ca',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 10,
                elevation: 5,
                borderWidth: 1,
                borderColor: '#f1f5f9'
              }}
            >
              <LinearGradient
                colors={['#4338ca', '#3b82f6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ padding: 15 }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: 'white', fontSize: 17, fontWeight: 'bold' }}>
                    Current Delivery
                  </Text>
                  <View style={{ 
                    backgroundColor: 'rgba(255,255,255,0.2)', 
                    paddingHorizontal: 10, 
                    paddingVertical: 5, 
                    borderRadius: 50 
                  }}>
                    <Text style={{ color: 'white', fontSize:
                    13 }}>
                      {activeOrder.orderId ? `Order #${activeOrder.orderRef || activeOrder.orderId.substring(0, 8)}` : 'No Order ID'}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
              
              <View style={{ padding: 15 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                  <View 
                    style={{ 
                      width: 45, 
                      height: 45, 
                      borderRadius: 25, 
                      backgroundColor: '#f1f5f9',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12
                    }}
                  >
                    <FontAwesome5 name="user-alt" size={18} color="#64748b" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#334155' }}>
                      {activeOrder.customerName || 'Customer'}
                    </Text>
                    <Text style={{ color: '#64748b', fontSize: 14, marginTop: 2 }} numberOfLines={1}>
                      {activeOrder.deliveryAddress || 'No address provided'}
                    </Text>
                  </View>
                </View>
                
                <View style={{ 
                  flexDirection: 'row', 
                  backgroundColor: '#f8fafc', 
                  paddingVertical: 12, 
                  paddingHorizontal: 15, 
                  borderRadius: 10, 
                  marginBottom: 15 
                }}>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ color: '#64748b', fontSize: 13, marginBottom: 3 }}>Items</Text>
                    <Text style={{ fontWeight: 'bold', color: '#334155' }}>
                      {activeOrder.items?.length || 0}
                    </Text>
                  </View>
                  <View style={{ 
                    width: 1, 
                    backgroundColor: '#e2e8f0',
                    marginHorizontal: 10
                  }} />
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ color: '#64748b', fontSize: 13, marginBottom: 3 }}>Total</Text>
                    <Text style={{ fontWeight: 'bold', color: '#334155' }}>
                      {activeOrder.totalAmount || '0'} Birr
                    </Text>
                  </View>
                  <View style={{ 
                    width: 1, 
                    backgroundColor: '#e2e8f0',
                    marginHorizontal: 10
                  }} />
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ color: '#64748b', fontSize: 13, marginBottom: 3 }}>Payment</Text>
                    <Text style={{ fontWeight: 'bold', color: '#334155' }}>
                      {activeOrder.paymentMethod || 'Unknown'}
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity
                  onPress={navigateToInProgressOrders}
                  style={{
                    backgroundColor: '#3b82f6',
                    paddingVertical: 14,
                    borderRadius: 10,
                    alignItems: 'center',
                    marginBottom: 5
                  }}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                    View Details
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ) : (
            <View style={{
              marginHorizontal: 15,
              marginBottom: 25,
              backgroundColor: 'white',
              borderRadius: 16,
              overflow: 'hidden',
              shadowColor: '#64748b',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 5,
              elevation: 2,
              padding: 20,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#f1f5f9'
            }}>
              <MaterialIcons name="delivery-dining" size={48} color="#cbd5e1" />
              <Text style={{ marginTop: 10, fontSize: 17, fontWeight: 'bold', color: '#334155' }}>
                No Active Deliveries
              </Text>
              <Text style={{ marginTop: 5, color: '#64748b', textAlign: 'center' }}>
                You don't have any deliveries in progress. New orders will appear here.
              </Text>
            </View>
          )}
          
          {/* Quick Actions */}
          <View style={{ flexDirection: 'row', marginHorizontal: 15, marginBottom: 25 }}>
            <TouchableOpacity 
              style={{
                flex: 1,
                backgroundColor: 'white',
                paddingVertical: 15,
                paddingHorizontal: 10,
                borderRadius: 12,
                alignItems: 'center',
                marginRight: 8,
                shadowColor: '#64748b',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 5,
                elevation: 1,
                borderWidth: 1,
                borderColor: '#f1f5f9'
              }}
              onPress={navigateToAssignedDeliveries}
            >
              <View style={{ 
                backgroundColor: '#eff6ff',
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10
              }}>
                <MaterialCommunityIcons name="clipboard-list" size={22} color="#3b82f6" />
              </View>
              <Text style={{ fontWeight: 'bold', color: '#1e293b', fontSize: 13 }}>Assigned</Text>
              <Text style={{ color: '#64748b', fontSize: 12 }}>{newOrders.length}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={{
                flex: 1,
                backgroundColor: 'white',
                paddingVertical: 15,
                paddingHorizontal: 10,
                borderRadius: 12,
                alignItems: 'center',
                marginHorizontal: 4,
                shadowColor: '#64748b',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 5,
                elevation: 1,
                borderWidth: 1,
                borderColor: '#f1f5f9'
              }}
              onPress={navigateToInProgressOrders}
            >
              <View style={{ 
                backgroundColor: '#eef2ff',
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10
              }}>
                <MaterialIcons name="delivery-dining" size={22} color="#6366f1" />
              </View>
              <Text style={{ fontWeight: 'bold', color: '#1e293b', fontSize: 13 }}>In Progress</Text>
              <Text style={{ color: '#64748b', fontSize: 12 }}>{activeOrder ? 1 : 0}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={{
                flex: 1,
                backgroundColor: 'white',
                paddingVertical: 15,
                paddingHorizontal: 10,
                borderRadius: 12,
                alignItems: 'center',
                marginLeft: 8,
                shadowColor: '#64748b',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 5,
                elevation: 1,
                borderWidth: 1,
                borderColor: '#f1f5f9'
              }}
              onPress={navigateToCompletedOrders}
            >
              <View style={{ 
                backgroundColor: '#f0fdf4',
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10
              }}>
                <MaterialIcons name="check-circle" size={22} color="#22c55e" />
              </View>
              <Text style={{ fontWeight: 'bold', color: '#1e293b', fontSize: 13 }}>Completed</Text>
              <Text style={{ color: '#64748b', fontSize: 12 }}>{deliveredOrders.length}</Text>
            </TouchableOpacity>
          </View>
          
          {/* Pending Orders Section */}
          <View style={{ marginBottom: 25 }}>
            <TouchableOpacity 
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                paddingHorizontal: 15,
                marginBottom: 10
              }}
              onPress={() => toggleExpand('pending')}
            >
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a' }}>
                Pending Orders
              </Text>
              <Ionicons 
                name={expanded === 'pending' ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#64748b" 
              />
            </TouchableOpacity>
            
            {(expanded === 'pending' || expanded === null) && (
              newOrders.length > 0 ? (
                <View>
                  {newOrders.slice(0, 2).map((order, index) => (
                    <TouchableOpacity
                      key={order.id}
                      style={{
                        flexDirection: 'row',
                        marginHorizontal: 15,
                        marginBottom: 10,
                        padding: 15,
                        backgroundColor: 'white',
                        borderRadius: 12,
                        shadowColor: '#64748b',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 5,
                        elevation: 1,
                        borderWidth: 1,
                        borderColor: '#f1f5f9'
                      }}
                      onPress={navigateToAssignedDeliveries}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                          <Text style={{ fontWeight: 'bold', fontSize: 15, color: '#334155' }}>
                            {order.orderRef || (order.orderId ? order.orderId.substring(0, 8) : 'No ID')}
                          </Text>
                          <View style={{ 
                            backgroundColor: '#f1f5f9', 
                            paddingHorizontal: 8, 
                            paddingVertical: 2, 
                            borderRadius: 4,
                            marginLeft: 8
                          }}>
                            <Text style={{ fontSize: 12, color: '#64748b' }}>
                              {order.items?.length || 0} items
                            </Text>
                          </View>
                        </View>
                        
                        <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 5 }} numberOfLines={1}>
                          {order.customerName || 'Customer'}
                        </Text>
                        
                        <Text style={{ fontSize: 13, color: '#94a3b8' }} numberOfLines={1}>
                          {order.deliveryAddress || 'No address provided'}
                        </Text>
                      </View>
                      
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontWeight: 'bold', color: '#334155', marginBottom: 8 }}>
                          {order.totalAmount || '0'} Birr
                        </Text>
                        <View style={{ 
                          backgroundColor: order.status === 'Pending' ? '#fffbeb' : '#f8fafc',
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 4,
                          marginBottom: 5
                        }}>
                          <Text style={{ 
                            fontSize: 12, 
                            color: order.status === 'Pending' ? '#d97706' : '#64748b'
                          }}>
                            {order.status || 'Pending'}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                  
                  {newOrders.length > 2 && (
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginHorizontal: 15,
                        marginTop: 5
                      }}
                      onPress={navigateToAssignedDeliveries}
                    >
                      <Text style={{ color: '#3b82f6', fontWeight: '500' }}>
                        View all {newOrders.length} orders
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color="#3b82f6" style={{ marginLeft: 5 }} />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={{
                  marginHorizontal: 15,
                  padding: 20,
                  backgroundColor: 'white',
                  borderRadius: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#f1f5f9'
                }}>
                  <Text style={{ color: '#64748b', textAlign: 'center' }}>
                    No pending orders at the moment
                  </Text>
                </View>
              )
            )}
          </View>
          
          {/* Recent Deliveries Section */}
          <View style={{ marginBottom: 25 }}>
            <TouchableOpacity 
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                paddingHorizontal: 15,
                marginBottom: 10
              }}
              onPress={() => toggleExpand('recent')}
            >
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a' }}>
                Recent Deliveries
              </Text>
              <Ionicons 
                name={expanded === 'recent' ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#64748b" 
              />
            </TouchableOpacity>
            
            {(expanded === 'recent' || expanded === null) && (
              deliveredOrders.length > 0 ? (
                <View>
                  {deliveredOrders.slice(0, 2).map((order, index) => (
                    <TouchableOpacity
                      key={order.id}
                      style={{
                        flexDirection: 'row',
                        marginHorizontal: 15,
                        marginBottom: 10,
                        padding: 15,
                        backgroundColor: 'white',
                        borderRadius: 12,
                        shadowColor: '#64748b',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 5,
                        elevation: 1,
                        borderWidth: 1,
                        borderColor: '#f1f5f9'
                      }}
                      onPress={navigateToCompletedOrders}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                          <Text style={{ fontWeight: 'bold', fontSize: 15, color: '#334155' }}>
                            {order.orderRef || (order.orderId ? order.orderId.substring(0, 8) : 'No ID')}
                          </Text>
                          <View style={{ 
                            backgroundColor: '#f0fdf4', 
                            paddingHorizontal: 8, 
                            paddingVertical: 2, 
                            borderRadius: 4,
                            marginLeft: 8
                          }}>
                            <Text style={{ fontSize: 12, color: '#16a34a' }}>
                              Completed
                            </Text>
                          </View>
                        </View>
                        
                        <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 5 }} numberOfLines={1}>
                          {order.customerName || 'Customer'}
                        </Text>
                        
                        <Text style={{ fontSize: 12, color: '#94a3b8' }}>
                          {order.formattedCreatedAt || 'Unknown time'}
                        </Text>
                      </View>
                      
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontWeight: 'bold', color: '#334155', marginBottom: 8 }}>
                          {order.totalAmount || '0'} Birr
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  
                  {deliveredOrders.length > 2 && (
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginHorizontal: 15,
                        marginTop: 5
                      }}
                      onPress={navigateToCompletedOrders}
                    >
                      <Text style={{ color: '#3b82f6', fontWeight: '500' }}>
                        View all {deliveredOrders.length} completed deliveries
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color="#3b82f6" style={{ marginLeft: 5 }} />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={{
                  marginHorizontal: 15,
                  padding: 20,
                  backgroundColor: 'white',
                  borderRadius: 12,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#f1f5f9'
                }}>
                  <Text style={{ color: '#64748b', textAlign: 'center' }}>
                    No completed deliveries yet
                  </Text>
                </View>
              )
            )}
          </View>
          
          {/* Weekly Earnings Chart */}
          <View style={{ marginBottom: 20 }}>
            <TouchableOpacity 
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                paddingHorizontal: 15,
                marginBottom: 10
              }}
              onPress={() => toggleExpand('earnings')}
            >
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a' }}>
                Weekly Earnings
              </Text>
              <Ionicons 
                name={expanded === 'earnings' ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#64748b" 
              />
            </TouchableOpacity>
            
            {(expanded === 'earnings' || expanded === null) && (
              <View style={{
                marginHorizontal: 15,
                padding: 15,
                backgroundColor: 'white',
                borderRadius: 12,
                shadowColor: '#64748b',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 5,
                elevation: 1,
                borderWidth: 1,
                borderColor: '#f1f5f9'
              }}>
                <View style={{ 
                  flexDirection: 'row', 
                  justifyContent: 'space-between',
                  marginBottom: 15
                }}>
                  <Text style={{ color: '#64748b', fontSize: 13 }}>
                    Last 7 days
                  </Text>
                  <Text style={{ fontWeight: 'bold', color: '#334155' }}>
                    {weeklyEarnings.reduce((sum, value) => sum + value, 0).toFixed(2)} Birr
                  </Text>
                </View>
                
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'flex-end', 
                  justifyContent: 'space-between',
                  height: 100,
                  marginBottom: 10
                }}>
                  {weeklyEarnings.map((earning, index) => (
                    <View key={index} style={{ alignItems: 'center' }}>
                      <View style={{ 
                        width: 20, 
                        height: Math.max(earning / maxEarning * 80, 5),
                        backgroundColor: index === weeklyEarnings.length - 1 ? '#3b82f6' : '#e2e8f0',
                        borderRadius: 10,
                        marginBottom: 5
                      }} />
                      <Text style={{ fontSize: 11, color: '#64748b' }}>
                        {['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
