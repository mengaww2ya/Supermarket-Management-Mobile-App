import React, { useState, useEffect, useRef } from "react";
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
  Pressable
} from "react-native";
import { Ionicons, Feather, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from 'expo-haptics';
import HomeHeader from "../../../components/HomeHeader";

const { width, height } = Dimensions.get("window");

export default function HomeScreen() {
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

  // Sample Data with enhanced details
  const activeOrder = {
    id: "ORD12345",
    customer: "John Doe",
    customerPhoto: "https://randomuser.me/api/portraits/men/32.jpg",
    address: "123 Main Street, Addis Ababa",
    items: [
      { name: "Organic Bananas", quantity: 2, price: "$4.99" },
      { name: "Fresh Milk", quantity: 1, price: "$3.50" },
      { name: "Whole Grain Bread", quantity: 1, price: "$2.99" }
    ],
    eta: "15 min",
    status: "Out for Delivery",
    distance: "2.4 km",
    coordinates: { lat: 9.0057, lng: 38.7634 },
    payment: { method: "Card", total: "$22.48", tip: "$5.00" }
  };

  const newOrders = [
    { 
      id: "ORD12346", 
      customer: "Alice Smith", 
      customerPhoto: "https://randomuser.me/api/portraits/women/44.jpg",
      address: "456 Elm St, Addis Ababa", 
      distance: "3.8 km",
      payment: "Paid",
      items: 5,
      total: "$32.75",
      estimatedTime: "25 min"
    },
    { 
      id: "ORD12347", 
      customer: "Bob Johnson", 
      customerPhoto: "https://randomuser.me/api/portraits/men/62.jpg",
      address: "789 Oak St, Addis Ababa", 
      distance: "1.2 km",
      payment: "COD",
      items: 3,
      total: "$18.50",
      estimatedTime: "15 min"
    }
  ];

  const deliveredOrders = [
    { 
      id: "ORD12341", 
      customer: "Chris Evans", 
      customerPhoto: "https://randomuser.me/api/portraits/men/91.jpg",
      time: "Today, 2:45 PM",
      earnings: "$10.00",
      address: "221 Pine St, Addis Ababa",
      rating: 5
    },
    { 
      id: "ORD12342", 
      customer: "Emma Watson", 
      customerPhoto: "https://randomuser.me/api/portraits/women/63.jpg",
      time: "Today, 12:30 PM",
      earnings: "$12.50",
      address: "87 Cedar Ave, Addis Ababa",
      rating: 4
    }
  ];

  // Calculate earnings for weekly chart data
  const weeklyEarnings = [35, 42, 58, 45, 62, 55, 78];
  const maxEarning = Math.max(...weeklyEarnings);
  
  // Animations setup
  useEffect(() => {
    // Set current time and greeting
    updateTimeAndGreeting();
    
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
  
  // Update time and greeting based on time of day
  const updateTimeAndGreeting = () => {
    const now = new Date();
    const hours = now.getHours();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setCurrentTime(timeString);
    
    if (hours < 12) {
      setGreeting('Good Morning');
    } else if (hours < 17) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }
  };
  
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

  const rightIcon = {
    name: isOnline ? "flash" : "flash-off",
    onPress: toggleOnlineStatus
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <HomeHeader title="Delivery Dashboard" />

      <ScrollView 
        className="px-4"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }}
      >
        {/* Active Order - Animated Card */}
        {activeOrder && (
          <Animated.View
            style={{
              transform: [
                { scale: pulseAnim },
                { translateY: translateY }
              ],
              opacity: fadeAnim,
            }}
            className="mb-4"
          >
            <Pressable
              onPress={navigateToInProgressOrders}
              style={({ pressed }) => [
                pressed ? { opacity: 0.95 } : {}
              ]}
            >
              <LinearGradient
                colors={['#0EA5E9', '#38BDF8']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-xl p-4 shadow-lg"
              >
                <View className="flex-row justify-between items-center mb-3">
                  <View className="flex-row items-center">
                    <View className="bg-white p-1 rounded-full mr-3">
                      <Feather name="package" size={18} color="#0EA5E9" />
                    </View>
                    <Text className="text-white font-bold text-lg">Ongoing Delivery</Text>
                  </View>
                  <Feather name="chevron-right" size={20} color="white" />
                </View>
                
                <View className="bg-white bg-opacity-20 rounded-lg p-3 mb-3">
                  <View className="flex-row items-center mb-2">
                    <Image 
                      source={{ uri: activeOrder.customerPhoto }} 
                      className="w-10 h-10 rounded-full mr-2"
                    />
                    <View className="flex-1">
                      <Text className="text-white font-semibold">{activeOrder.customer}</Text>
                      <Text className="text-white text-opacity-90 text-sm">{activeOrder.address}</Text>
                    </View>
                    <TouchableOpacity 
                      className="bg-white bg-opacity-30 p-2 rounded-full"
                      onPress={() => alert('Calling customer')}
                    >
                      <Feather name="phone" size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                  
                  <View className="flex-row justify-between mb-1">
                    <View className="flex-row items-center">
                      <Feather name="clock" size={14} color="white" className="mr-1" />
                      <Text className="text-white text-sm">ETA: {activeOrder.eta}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Feather name="map-pin" size={14} color="white" className="mr-1" />
                      <Text className="text-white text-sm">{activeOrder.distance}</Text>
                    </View>
                  </View>
                </View>
                
                <View className="flex-row">
                  <TouchableOpacity 
                    className="flex-1 bg-white p-3 rounded-lg items-center"
                    onPress={() => {
                      navigateToInProgressOrders();
                      alert('Opening navigation');
                    }}
                  >
                    <Text className="text-blue-500 font-bold">Navigate</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {/* Order sections */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: translateY }, { scale: scaleAnim }],
          }}
        >
          {/* New Orders */}
          <Pressable 
            className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden"
            onPress={navigateToAssignedDeliveries}
            style={({ pressed }) => [
              pressed ? { opacity: 0.95, transform: [{ scale: 0.995 }] } : {}
            ]}
          >
            <View className="flex-row justify-between items-center p-4">
              <View className="flex-row items-center">
                <View className="bg-green-100 p-2 rounded-lg mr-3">
                  <Feather name="list" size={18} color="#10B981" />
                </View>
                <Text className="font-bold text-gray-800 text-lg">New Orders</Text>
              </View>
              <View className="flex-row items-center">
                <View className="bg-green-100 px-2 py-1 rounded-full mr-2">
                  <Text className="text-green-600 font-semibold">{newOrders.length}</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#6B7280" />
              </View>
            </View>
          </Pressable>
          
          {/* Delivered Orders */}
          <Pressable 
            className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden"
            onPress={navigateToCompletedOrders}
            style={({ pressed }) => [
              pressed ? { opacity: 0.95, transform: [{ scale: 0.995 }] } : {}
            ]}
          >
            <View className="flex-row justify-between items-center p-4">
              <View className="flex-row items-center">
                <View className="bg-purple-100 p-2 rounded-lg mr-3">
                  <Feather name="check-circle" size={18} color="#8B5CF6" />
                </View>
                <Text className="font-bold text-gray-800 text-lg">Delivered Orders</Text>
              </View>
              <View className="flex-row items-center">
                <View className="bg-purple-100 px-2 py-1 rounded-full mr-2">
                  <Text className="text-purple-600 font-semibold">{deliveredOrders.length}</Text>
                </View>
                <Feather name="chevron-right" size={20} color="#6B7280" />
              </View>
            </View>
          </Pressable>

          {/* Delivery Insights */}
          <View className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 p-4">
            <View className="flex-row items-center mb-4">
              <View className="bg-yellow-100 p-2 rounded-lg mr-3">
                <Feather name="activity" size={18} color="#F59E0B" />
              </View>
              <Text className="font-bold text-gray-800 text-lg">Delivery Insights</Text>
            </View>
            
            <View className="flex-row flex-wrap">
              <View className="w-1/2 mb-3 pr-2">
                <View className="bg-gray-50 p-3 rounded-lg">
                  <Text className="text-gray-500 text-xs mb-1">Avg Delivery Time</Text>
                  <Text className="text-gray-800 font-bold text-lg">22 min</Text>
                </View>
              </View>
              
              <View className="w-1/2 mb-3 pl-2">
                <View className="bg-gray-50 p-3 rounded-lg">
                  <Text className="text-gray-500 text-xs mb-1">On-Time Rate</Text>
                  <Text className="text-gray-800 font-bold text-lg">92%</Text>
                </View>
              </View>
              
              <View className="w-1/2 pr-2">
                <View className="bg-gray-50 p-3 rounded-lg">
                  <Text className="text-gray-500 text-xs mb-1">Completed Orders</Text>
                  <Text className="text-gray-800 font-bold text-lg">47</Text>
                </View>
              </View>
              
              <View className="w-1/2 pl-2">
                <View className="bg-gray-50 p-3 rounded-lg">
                  <Text className="text-gray-500 text-xs mb-1">Canceled Orders</Text>
                  <Text className="text-gray-800 font-bold text-lg">1</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
