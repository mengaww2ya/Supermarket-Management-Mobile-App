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
  Alert,
  RefreshControl,
  FlatList
} from "react-native";
import { Ionicons, Feather, FontAwesome5, MaterialCommunityIcons, MaterialIcons, Entypo } from "@expo/vector-icons";
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
  getDoc,
  updateDoc
} from 'firebase/firestore';
import { useAuth } from "../../../context/authContext";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width, height } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  
  // State
  const [isOnline, setIsOnline] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [greeting, setGreeting] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [confirming, setConfirming] = useState(false);

  // Delivery data state
  const [activeOrder, setActiveOrder] = useState(null);
  const [newOrders, setNewOrders] = useState([]);
  const [deliveredOrders, setDeliveredOrders] = useState([]);
  const [weeklyEarnings, setWeeklyEarnings] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    totalEarnings: 0,
    avgRating: 0,
    completionRate: 0
  });
  
  // Calculate earnings for weekly chart data
  const maxEarning = Math.max(...weeklyEarnings, 1); // Prevent division by zero
  
  // Fetch delivery data from the authenticated user's tasks collection
  const fetchDeliveryData = useCallback(async () => {
    if (!user) {
      setError("Not logged in. Please log in to view your tasks.");
      setLoading(false);
      setRefreshing(false);
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
        setRefreshing(false);
        return;
      }
      
      const pendingOrders = [];
      const inProgressOrders = [];
      const completedOrders = [];
      let totalEarnings = 0;
      let totalDeliveries = 0;
      
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
            totalDeliveries++;
            // Add to earnings if the task has an amount
            if (task.totalAmount) {
              totalEarnings += parseFloat(task.totalAmount) || 0;
            }
            break;
          default:
            pendingOrders.push(task); // Default to pending if status unknown
        }
      });
      
      // Enhanced stats calculation
      const completionRate = totalDeliveries > 0 ? 
        Math.round((completedOrders.length / (completedOrders.length + pendingOrders.length + inProgressOrders.length)) * 100) : 0;
      
      // Calculate average rating (random for demo purposes)
      const avgRating = (4.1 + Math.random() * 0.9).toFixed(1);
      
      // Set enhanced stats
      setStats({
        totalDeliveries: totalDeliveries,
        totalEarnings: totalEarnings.toFixed(2),
        avgRating: avgRating,
        completionRate: completionRate
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
      setRefreshing(false);
    }
  }, [user]);
  
  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDeliveryData();
  }, [fetchDeliveryData]);
  
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
    
    // Start shimmer animation
    startShimmerAnimation();
    
    // Start rotate animation for loading indicators
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
  }, []);
  
  // Shimmer effect animation
  const startShimmerAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };
  
  // Pulse animation for active order card
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
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

  // Handle starting a delivery 
  const handleStartDelivery = (order) => {
    // Show confirmation dialog
    Alert.alert(
      "Start Delivery",
      `Are you sure you want to start delivery for order #${order.orderRef || order.orderId?.substring(0, 8) || 'Unknown'}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Start",
          onPress: () => updateDeliveryStatus(order, 'In Progress')
        }
      ]
    );
  };

  // Handle completing a delivery
  const handleCompleteDelivery = (order) => {
    Alert.alert(
      "Complete Delivery",
      "Confirm that you have delivered this order to the customer?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Complete",
          onPress: () => updateDeliveryStatus(order, 'Delivered')
        }
      ]
    );
  };

  // Update delivery status in Firestore
  const updateDeliveryStatus = async (order, newStatus) => {
    setConfirming(true);
    
    try {
      // Get a reference to the task document
      const taskRef = doc(db, `users/${user.uid}/tasks`, order.id);
      
      // Update the status
      await updateDoc(taskRef, {
        status: newStatus,
        lastUpdated: serverTimestamp()
      });
      
      // Update customer's order status to keep synchronization
      await syncOrderStatusWithCustomer(order.id, order.rawData, newStatus);
      
      // Provide feedback
      if (Platform.OS === 'ios') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
          // Fallback silently
        }
      }
      
      // Refresh data
      fetchDeliveryData();
      
      // Navigate based on new status
      if (newStatus === 'In Progress') {
        router.push("/deliveryAgent/Inprogress_Orders");
      } else if (newStatus === 'Delivered') {
        Alert.alert("Success", "Delivery marked as completed!");
      }
    } catch (error) {
      console.error("Error updating delivery status:", error);
      Alert.alert("Error", "Failed to update delivery status. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  // Synchronize order status between delivery agent and customer
  const syncOrderStatusWithCustomer = async (orderId, orderData, newStatus) => {
    try {
      // Check if we have customer user ID and order ID for synchronization
      if (!orderData.customerId || !orderData.orderId) {
        console.log("Missing customer ID or order ID for sync", orderData);
        return;
      }
      
      console.log(`Syncing order status for customer ${orderData.customerId}, order ${orderData.orderId}`);
      
      // Reference to the customer's order in the nested collection
      const customerOrderRef = doc(db, `users/${orderData.customerId}/orders`, orderData.orderId);
      
      // Create update object with status and timestamp
      const updateData = {
        status: newStatus,
        lastUpdated: serverTimestamp(),
        deliveryAgentId: user.uid,
        deliveryAgentName: user.displayName || 'Delivery Agent'
      };
      
      // Add appropriate data based on status
      if (newStatus === 'In Progress') {
        updateData.startedAt = serverTimestamp();
        updateData.deliveryStatus = 'In Progress';
      } else if (newStatus === 'Delivered') {
        updateData.deliveredAt = serverTimestamp();
        updateData.deliveryStatus = 'Completed';
      }
      
      // Update the customer's order
      await updateDoc(customerOrderRef, updateData);
      
      console.log(`Successfully synced order status to customer's order collection for order ${orderId}`);
    } catch (error) {
      console.error("Error synchronizing order status with customer:", error);
      // Don't throw the error - this is a secondary operation that shouldn't fail the primary update
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
    
    router.push("/deliveryAgent/completed_order");
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
  
  // Navigate to customer chat
  const navigateToChat = () => {
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Fallback if haptics not available
      }
    }
    
    router.push("/deliveryAgent/systemChat");
  };

  // Call customer handler
  const handleCallCustomer = (phone) => {
    Alert.alert(
      "Call Customer",
      `Calling customer at ${phone}`,
      [{ text: "OK" }]
    );
  };

  // Navigate to customer location
  const handleNavigateToCustomer = (address) => {
    Alert.alert(
      "Navigate",
      `Opening maps navigation to: ${address}`,
      [{ text: "OK" }]
    );
  };
  
  // Calculate rotation for the loading spinner
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <HomeHeader
        title={`${greeting}, ${user?.displayName?.split(' ')[0] || 'Delivery Agent'}`}
      />
      
      {loading && !refreshing ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <MaterialCommunityIcons name="truck-delivery-outline" size={60} color="#4F46E5" />
          </Animated.View>
          <Text style={{ marginTop: 20, color: '#64748b', fontSize: 16 }}>Loading your deliveries...</Text>
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
          }
        >
          {/* Status and Time */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            paddingHorizontal: 16,
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
          
          {/* Performance Dashboard */}
          <Animated.View style={{
            marginHorizontal: 16,
            marginBottom: 24,
            opacity: fadeAnim,
            transform: [
              { translateY: translateY },
              { scale: scaleAnim }
            ]
          }}>
            <View
              style={{
                borderRadius: 20,
                padding: 20,
                overflow: 'hidden',
                backgroundColor: '#f0f4f8',  // Subtle background color
                shadowColor: '#94a3b8',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 10,
                elevation: 3,
                borderWidth: 1,
                borderColor: '#e2e8f0'
              }}
            >
              {/* Decorative elements */}
              <View style={{
                position: 'absolute',
                right: -15,
                top: -15,
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: 'rgba(226, 232, 240, 0.6)'
              }} />
              <View style={{
                position: 'absolute',
                left: 20,
                bottom: -20,
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: 'rgba(226, 232, 240, 0.6)'
              }} />
              
              <Text style={{ 
                color: '#334155', 
                fontWeight: 'bold', 
                fontSize: 18,
                marginBottom: 15
              }}>
                Performance Dashboard
              </Text>
              
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                marginBottom: 16 
              }}>
                <View style={{ 
                  backgroundColor: 'white', 
                  borderRadius: 16, 
                  padding: 16,
                  flex: 1,
                  marginRight: 8,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#e2e8f0'
                }}>
                  <Text style={{ color: '#64748b', fontSize: 13, marginBottom: 6 }}>
                    Completed
                  </Text>
                  <Text style={{ color: '#0f172a', fontWeight: 'bold', fontSize: 24 }}>
                    {stats.totalDeliveries}
                  </Text>
                </View>
                
                <View style={{ 
                  backgroundColor: 'white', 
                  borderRadius: 16, 
                  padding: 16,
                  flex: 1,
                  marginLeft: 8,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#e2e8f0'
                }}>
                  <Text style={{ color: '#64748b', fontSize: 13, marginBottom: 6 }}>
                    Earnings
                  </Text>
                  <Text style={{ color: '#0f172a', fontWeight: 'bold', fontSize: 24 }}>
                    {stats.totalEarnings}
                  </Text>
                </View>
              </View>
              
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between' 
              }}>
                <View style={{ 
                  backgroundColor: 'white', 
                  borderRadius: 16, 
                  padding: 16,
                  flex: 1,
                  marginRight: 8,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#e2e8f0'
                }}>
                  <Text style={{ color: '#64748b', fontSize: 13, marginBottom: 6 }}>
                    Rating
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: '#0f172a', fontWeight: 'bold', fontSize: 24, marginRight: 4 }}>
                      {stats.avgRating}
                    </Text>
                    <Ionicons name="star" size={18} color="#f59e0b" />
                  </View>
                </View>
                
                <View style={{ 
                  backgroundColor: 'white', 
                  borderRadius: 16, 
                  padding: 16,
                  flex: 1,
                  marginLeft: 8,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#e2e8f0'
                }}>
                  <Text style={{ color: '#64748b', fontSize: 13, marginBottom: 6 }}>
                    Completion
                  </Text>
                  <Text style={{ color: '#0f172a', fontWeight: 'bold', fontSize: 24 }}>
                    {stats.completionRate}%
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
          
          {/* Current Delivery Card */}
          {activeOrder ? (
            <Animated.View
              style={{
                transform: [{ scale: pulseAnim }],
                marginHorizontal: 16,
                marginBottom: 24,
                backgroundColor: 'white',
                borderRadius: 20,
                overflow: 'hidden',
                shadowColor: '#94a3b8',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
                elevation: 6,
                borderWidth: 1,
                borderColor: '#e2e8f0'
              }}
            >
              <View
                style={{ 
                  padding: 20,
                  backgroundColor: '#f8fafc',
                  borderBottomWidth: 1,
                  borderBottomColor: '#e2e8f0'
                }}
              >
                <View style={{ 
                  position: 'absolute', 
                  top: -10, 
                  right: -10, 
                  width: 80, 
                  height: 80, 
                  borderRadius: 40,
                  backgroundColor: 'rgba(148, 163, 184, 0.1)'
                }} />
                
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <Text style={{ color: '#334155', fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>
                      Active Delivery
                    </Text>
                    <View style={{ 
                      backgroundColor: '#e0e7ff', 
                      paddingHorizontal: 10, 
                      paddingVertical: 4, 
                      borderRadius: 50,
                      alignSelf: 'flex-start'
                    }}>
                      <Text style={{ color: '#4f46e5', fontSize: 13, fontWeight: '600' }}>
                        Order #{activeOrder.orderRef || (activeOrder.orderId ? activeOrder.orderId.substring(0, 6) : 'Unknown')}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={{
                    height: 36,
                    width: 36,
                    borderRadius: 18,
                    backgroundColor: '#dbeafe',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <MaterialCommunityIcons name="truck-delivery-outline" size={20} color="#3b82f6" />
                  </View>
                </View>
              </View>
              
              <View style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <Image
                    source={{ 
                      uri: activeOrder.customerPhoto || 
                          'https://randomuser.me/api/portraits/lego/1.jpg'
                    }}
                    style={{ 
                      width: 50, 
                      height: 50, 
                      borderRadius: 25,
                      borderWidth: 2,
                      borderColor: '#e2e8f0'
                    }}
                  />
                  
                  <View style={{ marginLeft: 12 }}>
                    <Text style={{ 
                      fontWeight: '600', 
                      color: '#1e293b', 
                      fontSize: 16,
                      marginBottom: 2
                    }}>
                      {activeOrder.customerName || 'Customer'}
                    </Text>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Feather name="map-pin" size={14} color="#64748b" />
                      <Text style={{ 
                        color: '#64748b', 
                        marginLeft: 4,
                        fontSize: 14
                      }} numberOfLines={1}>
                        {activeOrder.deliveryAddress || 'Address not available'}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                  <View style={{ 
                    flex: 1, 
                    backgroundColor: '#f1f5f9', 
                    padding: 10, 
                    borderRadius: 12,
                    marginRight: 8
                  }}>
                    <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 2 }}>
                      Order Items
                    </Text>
                    <Text style={{ color: '#0f172a', fontWeight: '600' }}>
                      {activeOrder.items?.length || 0} items
                    </Text>
                  </View>
                  
                  <View style={{ 
                    flex: 1, 
                    backgroundColor: '#f1f5f9', 
                    padding: 10, 
                    borderRadius: 12,
                    marginLeft: 8
                  }}>
                    <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 2 }}>
                      Total Amount
                    </Text>
                    <Text style={{ color: '#0f172a', fontWeight: '600' }}>
                      {activeOrder.totalAmount || '0'} Birr
                    </Text>
                  </View>
                </View>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <TouchableOpacity 
                    style={{
                      flex: 1,
                      backgroundColor: '#eff6ff',
                      borderRadius: 12,
                      paddingVertical: 12,
                      marginRight: 8,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderColor: '#dbeafe'
                    }}
                    onPress={() => router.push('/deliveryAgent/Inprogress_Orders')}
                    activeOpacity={0.7}
                  >
                    <Feather name="eye" size={16} color="#3b82f6" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#3b82f6', fontWeight: '600' }}>View Details</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={{
                      flex: 1,
                      backgroundColor: '#dbeafe',
                      borderRadius: 12,
                      paddingVertical: 12,
                      marginLeft: 8,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center'
                    }}
                    onPress={() => updateDeliveryStatus(activeOrder.id, 'Delivered')}
                    activeOpacity={0.7}
                  >
                    <Feather name="check-circle" size={16} color="#2563eb" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#2563eb', fontWeight: '600' }}>Complete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          ) : (
            <Animated.View
              style={{
                marginHorizontal: 16,
                marginBottom: 24,
                backgroundColor: 'white',
                borderRadius: 20,
                overflow: 'hidden',
                padding: 20,
                opacity: fadeAnim,
                transform: [{ translateY }],
                shadowColor: '#94a3b8',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 6,
                elevation: 2,
                borderWidth: 1,
                borderColor: '#e2e8f0',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Image
                source={{ uri: 'https://cdn-icons-png.flaticon.com/512/6134/6134065.png' }}
                style={{ 
                  width: 100, 
                  height: 100, 
                  marginBottom: 16,
                  opacity: 0.8
                }}
                resizeMode="contain"
              />
              
              <Text style={{ 
                fontSize: 18, 
                fontWeight: 'bold', 
                color: '#334155',
                marginBottom: 8,
                textAlign: 'center'
              }}>
                No Active Deliveries
              </Text>
              
              <Text style={{ 
                color: '#64748b', 
                textAlign: 'center', 
                marginBottom: 20,
                paddingHorizontal: 20
              }}>
                You don't have any deliveries in progress. Check assigned deliveries to start a new one.
              </Text>
              
              <TouchableOpacity
                style={{
                  backgroundColor: '#eff6ff',
                  paddingVertical: 12,
                  paddingHorizontal: 20,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#dbeafe'
                }}
                activeOpacity={0.7}
                onPress={() => router.push('/deliveryAgent/Assigned_deliveries_list')}
              >
                <Feather name="list" size={18} color="#3b82f6" style={{ marginRight: 8 }} />
                <Text style={{ color: '#3b82f6', fontWeight: '600', fontSize: 15 }}>
                  View Assigned Deliveries
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
          
          {/* Weekly Earnings Chart */}
          <View style={{
            marginHorizontal: 16,
            marginBottom: 24,
            backgroundColor: 'white',
            borderRadius: 20,
            overflow: 'hidden',
            shadowColor: '#94a3b8',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
            borderWidth: 1,
            borderColor: '#e2e8f0'
          }}>
            <TouchableOpacity 
              style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: 16,
                borderBottomWidth: expanded === 'earnings' ? 1 : 0,
                borderBottomColor: '#e2e8f0'
              }}
              onPress={() => {
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setExpanded(expanded === 'earnings' ? null : 'earnings');
              }}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: '#f0f9ff',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12
                }}>
                  <MaterialIcons name="attach-money" size={22} color="#0ea5e9" />
                </View>
                <Text style={{ fontWeight: 'bold', color: '#334155', fontSize: 16 }}>
                  Weekly Earnings
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: '#64748b', marginRight: 8 }}>
                  {expanded === 'earnings' ? 'Hide' : 'Show'}
                </Text>
                <Animated.View style={{
                  transform: [{
                    rotate: expanded === 'earnings' ? '180deg' : '0deg'
                  }]
                }}>
                  <Feather name="chevron-down" size={20} color="#64748b" />
                </Animated.View>
              </View>
            </TouchableOpacity>
            
            {expanded === 'earnings' && (
              <Animated.View 
                style={{
                  padding: 16,
                  opacity: fadeAnim,
                  transform: [{ translateY }]
                }}
              >
                <View style={{ height: 190, marginBottom: 16, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  {weeklyEarnings.map((earnings, index) => {
                    const dayName = ['M', 'T', 'W', 'T', 'F', 'S', 'S'][index];
                    const barHeight = earnings > 0 ? (earnings / maxEarning) * 140 : 0;
                    const isHighest = earnings === Math.max(...weeklyEarnings);
                    
                    return (
                      <View key={index} style={{ alignItems: 'center', flex: 1 }}>
                        <Animated.View style={{
                          height: barHeight,
                          width: 20,
                          backgroundColor: isHighest ? '#bfdbfe' : '#e2e8f0',
                          borderTopLeftRadius: 4,
                          borderTopRightRadius: 4,
                          justifyContent: 'flex-start',
                          alignItems: 'center',
                          overflow: 'hidden',
                          borderWidth: 1,
                          borderColor: isHighest ? '#93c5fd' : '#cbd5e1'
                        }}>
                          <View style={{
                            height: '100%',
                            width: '100%',
                            backgroundColor: isHighest ? '#3b82f6' : '#94a3b8',
                            opacity: 0.2
                          }} />
                        </Animated.View>
                        
                        <Text style={{ color: '#64748b', marginTop: 8, fontSize: 12 }}>
                          {dayName}
                        </Text>
                      </View>
                    );
                  })}
                </View>
                
                <View style={{ 
                  backgroundColor: '#f8fafc', 
                  borderRadius: 12, 
                  padding: 12,
                  marginTop: 8
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: '#64748b' }}>Best day</Text>
                    <Text style={{ color: '#334155', fontWeight: '600' }}>
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][weeklyEarnings.indexOf(Math.max(...weeklyEarnings))]}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#64748b' }}>Avg. per day</Text>
                    <Text style={{ color: '#334155', fontWeight: '600' }}>
                      {(weeklyEarnings.reduce((a, b) => a + b, 0) / 7).toFixed(2)} Birr
                    </Text>
                  </View>
                </View>
              </Animated.View>
            )}
          </View>
          
          {/* Quick Actions */}
          <View style={{ marginHorizontal: 16, marginBottom: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a', marginBottom: 12, paddingHorizontal: 4 }}>
              Quick Actions
            </Text>
            
            <View style={{ flexDirection: 'row' }}>
              <Animated.View style={{
                flex: 1,
                opacity: fadeAnim,
                transform: [{ 
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                  }) 
                }]
              }}>
                <TouchableOpacity 
                  style={{
                    backgroundColor: 'white',
                    paddingVertical: 16,
                    paddingHorizontal: 10,
                    borderRadius: 16,
                    alignItems: 'center',
                    marginRight: 8,
                    shadowColor: '#64748b',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 6,
                    elevation: 2,
                    borderWidth: 1,
                    borderColor: '#f1f5f9'
                  }}
                  onPress={navigateToAssignedDeliveries}
                >
                  <View style={{ 
                    backgroundColor: '#eff6ff',
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10
                  }}>
                    <MaterialCommunityIcons name="clipboard-list" size={24} color="#3b82f6" />
                  </View>
                  <Text style={{ fontWeight: 'bold', color: '#1e293b', fontSize: 14, marginBottom: 2 }}>Assigned</Text>
                  <View style={{
                    backgroundColor: '#3b82f6',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 10
                  }}>
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>{newOrders.length}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
              
              <Animated.View style={{
                flex: 1,
                opacity: fadeAnim,
                transform: [{ 
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0]
                  }) 
                }]
              }}>
                <TouchableOpacity 
                  style={{
                    backgroundColor: 'white',
                    paddingVertical: 16,
                    paddingHorizontal: 10,
                    borderRadius: 16,
                    alignItems: 'center',
                    marginHorizontal: 4,
                    shadowColor: '#64748b',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 6,
                    elevation: 2,
                    borderWidth: 1,
                    borderColor: '#f1f5f9'
                  }}
                  onPress={navigateToInProgressOrders}
                >
                  <View style={{ 
                    backgroundColor: '#eef2ff',
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10
                  }}>
                    <MaterialIcons name="delivery-dining" size={24} color="#6366f1" />
                  </View>
                  <Text style={{ fontWeight: 'bold', color: '#1e293b', fontSize: 14, marginBottom: 2 }}>In Progress</Text>
                  <View style={{
                    backgroundColor: '#6366f1',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 10
                  }}>
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>{activeOrder ? 1 : 0}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
              
              <Animated.View style={{
                flex: 1,
                opacity: fadeAnim,
                transform: [{ 
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, 0]
                  }) 
                }]
              }}>
                <TouchableOpacity 
                  style={{
                    backgroundColor: 'white',
                    paddingVertical: 16,
                    paddingHorizontal: 10,
                    borderRadius: 16,
                    alignItems: 'center',
                    marginLeft: 8,
                    shadowColor: '#64748b',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 6,
                    elevation: 2,
                    borderWidth: 1,
                    borderColor: '#f1f5f9'
                  }}
                  onPress={navigateToCompletedOrders}
                >
                  <View style={{ 
                    backgroundColor: '#f0fdf4',
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10
                  }}>
                    <MaterialIcons name="check-circle" size={24} color="#22c55e" />
                  </View>
                  <Text style={{ fontWeight: 'bold', color: '#1e293b', fontSize: 14, marginBottom: 2 }}>Completed</Text>
                  <View style={{
                    backgroundColor: '#22c55e',
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 10
                  }}>
                    <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>{deliveredOrders.length}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            </View>
            
            <View style={{ marginTop: 12 }}>
              <TouchableOpacity 
                style={{
                  backgroundColor: 'white',
                  paddingVertical: 16,
                  borderRadius: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#64748b',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 6,
                  elevation: 2,
                  borderWidth: 1,
                  borderColor: '#f1f5f9'
                }}
                onPress={navigateToChat}
              >
                <LinearGradient
                  colors={['#4ade80', '#22c55e']}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10
                  }}
                >
                  <Feather name="message-circle" size={18} color="white" />
                </LinearGradient>
                <Text style={{ color: '#334155', fontWeight: '600', fontSize: 15 }}>
                  Contact Support
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Pending Orders Section */}
          <View style={{ marginBottom: 24 }}>
            <TouchableOpacity 
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                marginBottom: 12
              }}
              onPress={() => toggleExpand('pending')}
            >
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#0f172a' }}>
                New Orders
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  backgroundColor: '#3b82f6',
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 10,
                  marginRight: 8
                }}>
                  <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>{newOrders.length}</Text>
                </View>
                <Ionicons 
                  name={expanded === 'pending' ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#64748b" 
                />
              </View>
            </TouchableOpacity>
            
            {(expanded === 'pending' || expanded === null) && (
              newOrders.length > 0 ? (
                <View>
                  {newOrders.slice(0, 2).map((order, index) => (
                    <Animated.View 
                      key={order.id}
                      style={{
                        opacity: fadeAnim,
                        transform: [{ 
                          translateY: fadeAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [20 * (index + 1), 0]
                          }) 
                        }]
                      }}
                    >
                      <TouchableOpacity
                        style={{
                          marginHorizontal: 16,
                          marginBottom: 12,
                          backgroundColor: 'white',
                          borderRadius: 16,
                          shadowColor: '#64748b',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.06,
                          shadowRadius: 6,
                          elevation: 2,
                          borderWidth: 1,
                          borderColor: '#f1f5f9',
                          overflow: 'hidden'
                        }}
                        onPress={() => navigateToAssignedDeliveries()}
                      >
                        <LinearGradient
                          colors={['#6366f1', '#6366f1CC']}
                          start={[0, 0]}
                          end={[1, 0]}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <Text style={{ fontWeight: 'bold', color: 'white', fontSize: 15 }}>
                            #{order.orderRef || (order.orderId ? order.orderId.substring(0, 6) : 'No ID')}
                          </Text>
                          <View style={{
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            paddingHorizontal: 8,
                            paddingVertical: 3,
                            borderRadius: 12
                          }}>
                            <Text style={{ fontSize: 12, color: 'white' }}>
                              {order.status || 'Pending'}
                            </Text>
                          </View>
                        </LinearGradient>
                        
                        <View style={{ padding: 16 }}>
                          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                            <View style={{ 
                              backgroundColor: '#f8fafc', 
                              width: 40, 
                              height: 40, 
                              borderRadius: 20,
                              justifyContent: 'center',
                              alignItems: 'center',
                              marginRight: 12
                            }}>
                              <FontAwesome5 name="user-alt" size={16} color="#64748b" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 16, fontWeight: '600', color: '#1e293b', marginBottom: 2 }}>
                                {order.customerName || 'Customer'}
                              </Text>
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Feather name="map-pin" size={12} color="#64748b" style={{ marginRight: 4 }} />
                                <Text style={{ color: '#64748b', fontSize: 13 }} numberOfLines={1}>
                                  {order.deliveryAddress || 'No address provided'}
                                </Text>
                              </View>
                            </View>
                          </View>
                          
                          <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            backgroundColor: '#f8fafc',
                            padding: 10,
                            borderRadius: 10,
                            marginBottom: 12
                          }}>
                            <View>
                              <Text style={{ color: '#64748b', fontSize: 12 }}>Total Amount</Text>
                              <Text style={{ fontWeight: '700', color: '#334155' }}>{order.totalAmount || '0'} Birr</Text>
                            </View>
                            <View>
                              <Text style={{ color: '#64748b', fontSize: 12, textAlign: 'right' }}>Items</Text>
                              <Text style={{ fontWeight: '700', color: '#334155', textAlign: 'right' }}>{order.items?.length || 0}</Text>
                            </View>
                          </View>
                          
                          <View style={{ flexDirection: 'row' }}>
                            <TouchableOpacity
                              style={{
                                flex: 1,
                                backgroundColor: '#f8fafc',
                                paddingVertical: 10,
                                borderRadius: 10,
                                alignItems: 'center',
                                marginRight: 6,
                                borderWidth: 1,
                                borderColor: '#e2e8f0'
                              }}
                              onPress={() => navigateToAssignedDeliveries()}
                            >
                              <Text style={{ color: '#64748b', fontWeight: '600' }}>View</Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                              style={{
                                flex: 1,
                                backgroundColor: '#3b82f6',
                                paddingVertical: 10,
                                borderRadius: 10,
                                alignItems: 'center',
                                marginLeft: 6,
                                shadowColor: '#3b82f6',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.2,
                                shadowRadius: 4,
                                elevation: 2
                              }}
                              onPress={() => handleStartDelivery(order)}
                            >
                              <Text style={{ color: 'white', fontWeight: '600' }}>Start</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                  
                  {newOrders.length > 2 && (
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginTop: 4,
                        marginBottom: 8,
                        paddingVertical: 6
                      }}
                      onPress={navigateToAssignedDeliveries}
                    >
                      <Text style={{ color: '#3b82f6', fontWeight: '600' }}>
                        View all {newOrders.length} orders
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color="#3b82f6" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <View style={{
                  marginHorizontal: 16,
                  padding: 20,
                  backgroundColor: 'white',
                  borderRadius: 16,
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
          
          {/* Completed Deliveries Section */}
          <View style={{
            marginHorizontal: 16,
            marginBottom: 24,
            backgroundColor: 'white',
            borderRadius: 20,
            overflow: 'hidden',
            shadowColor: '#94a3b8',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 3,
            borderWidth: 1,
            borderColor: '#e2e8f0'
          }}>
            <TouchableOpacity 
              style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: 16,
                borderBottomWidth: expanded === 'completed' ? 1 : 0,
                borderBottomColor: '#e2e8f0'
              }}
              onPress={() => {
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setExpanded(expanded === 'completed' ? null : 'completed');
              }}
              activeOpacity={0.8}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: '#f0fdf4',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12
                }}>
                  <MaterialIcons name="check-circle-outline" size={22} color="#16a34a" />
                </View>
                <Text style={{ fontWeight: 'bold', color: '#334155', fontSize: 16 }}>
                  Completed Deliveries
                </Text>
                {deliveredOrders.length > 0 && (
                  <View style={{
                    backgroundColor: '#dcfce7',
                    borderRadius: 50,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    marginLeft: 8
                  }}>
                    <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: '600' }}>
                      {deliveredOrders.length}
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: '#64748b', marginRight: 8 }}>
                  {expanded === 'completed' ? 'Hide' : 'Show'}
                </Text>
                <Animated.View style={{
                  transform: [{
                    rotate: expanded === 'completed' ? '180deg' : '0deg'
                  }]
                }}>
                  <Feather name="chevron-down" size={20} color="#64748b" />
                </Animated.View>
              </View>
            </TouchableOpacity>
            
            {expanded === 'completed' && (
              <Animated.View 
                style={{
                  padding: 16,
                  opacity: fadeAnim,
                  transform: [{ translateY }]
                }}
              >
                {deliveredOrders.length === 0 ? (
                  <View style={{ alignItems: 'center', padding: 20 }}>
                    <Image
                      source={{ uri: 'https://cdn-icons-png.flaticon.com/512/5445/5445197.png' }}
                      style={{ width: 80, height: 80, marginBottom: 12, opacity: 0.7 }}
                      resizeMode="contain"
                    />
                    <Text style={{ color: '#64748b', textAlign: 'center' }}>
                      No completed deliveries for today
                    </Text>
                  </View>
                ) : (
                  <>
                    <FlatList
                      data={deliveredOrders.slice(0, 3)}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item, index }) => (
                        <Animated.View style={{
                          backgroundColor: '#f8fafc',
                          borderRadius: 12,
                          marginBottom: index < deliveredOrders.slice(0, 3).length - 1 ? 12 : 0,
                          padding: 12,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                            <View style={{
                              width: 36,
                              height: 36,
                              borderRadius: 18,
                              backgroundColor: 'white',
                              justifyContent: 'center',
                              alignItems: 'center',
                              marginRight: 10,
                              borderWidth: 1,
                              borderColor: '#e2e8f0'
                            }}>
                              <Text style={{ color: '#334155', fontWeight: '600', fontSize: 14 }}>
                                {index + 1}
                              </Text>
                            </View>
                            
                            <View style={{ flex: 1 }}>
                              <Text style={{ 
                                color: '#334155', 
                                fontWeight: '600',
                                fontSize: 14,
                                marginBottom: 2
                              }} numberOfLines={1}>
                                {item.customerName || `Order #${item.orderRef || item.id.substring(0, 6)}`}
                              </Text>
                              
                              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Feather name="clock" size={12} color="#64748b" />
                                <Text style={{ color: '#64748b', fontSize: 12, marginLeft: 4 }}>
                                  {item.deliveredAt ? formatTimeAgo(item.deliveredAt.toDate()) : 'Today'}
                                </Text>
                              </View>
                            </View>
                          </View>
                          
                          <View style={{
                            backgroundColor: '#f0fdf4',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 50
                          }}>
                            <Text style={{ color: '#16a34a', fontSize: 12, fontWeight: '600' }}>
                              {item.totalAmount} Birr
                            </Text>
                          </View>
                        </Animated.View>
                      )}
                      showsVerticalScrollIndicator={false}
                      scrollEnabled={false}
                    />
                    
                    {deliveredOrders.length > 3 && (
                      <TouchableOpacity
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: 16,
                          paddingVertical: 12,
                          backgroundColor: '#f1f5f9',
                          borderRadius: 12
                        }}
                        activeOpacity={0.7}
                        onPress={() => router.push('/deliveryAgent/Completed_Orders')}
                      >
                        <Text style={{ color: '#475569', fontWeight: '600', marginRight: 4 }}>
                          View All ({deliveredOrders.length})
                        </Text>
                        <Feather name="arrow-right" size={16} color="#475569" />
                      </TouchableOpacity>
                    )}
                  </>
                )}
              </Animated.View>
            )}
          </View>
          
          {/* Content end note */}
          <View style={{ 
            alignItems: 'center', 
            paddingHorizontal: 20, 
            paddingBottom: 20,
            marginTop: 8
          }}>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              backgroundColor: '#f8fafc',
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 20
            }}>
              <MaterialCommunityIcons name="shield-check" size={18} color="#64748b" style={{ marginRight: 8 }} />
              <Text style={{ color: '#64748b', fontSize: 14 }}>
                Delivery agent portal v1.2
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  glassmorphism: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
});
