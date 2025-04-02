import React, { useState, useEffect, useRef } from "react";
import { 
  SafeAreaView, 
  FlatList, 
  View, 
  Text, 
  TouchableOpacity, 
  Animated, 
  Dimensions, 
  StatusBar,
  ScrollView,
  Platform,
  Vibration,
  TextInput,
  Image
} from "react-native";
import { useRouter } from "expo-router";
import { Feather, Ionicons, MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import HomeHeader from "app/components/HomeHeader";
import * as Haptics from 'expo-haptics';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from "../../../firebase/firebaseConfig";

const { width, height } = Dimensions.get('window');

// Menu items with enhanced data - moved outside component to avoid recreation on render
const menuItemsData = [
  { 
    title: "Customer Profiles", 
    subtitle: "Manage customer profiles and preferences",
    description: "View detailed profiles, edit information, and track preferences",
    icon: "users", 
    iconType: "Feather",
    color: "#4F46E5",
    bgColor: "#EEF2FF",
    route: "/manager/customerList"
  },
  { 
    title: "Feedback & Reviews", 
    subtitle: "Monitor and respond to customer feedback",
    description: "View ratings, analyze sentiment, and respond to reviews",
    icon: "message-square", 
    iconType: "Feather",
    color: "#0EA5E9",
    bgColor: "#F0F9FF",
    route: "",
    badge: "4.7 Rating"
  },
  { 
    title: "Loyalty Program", 
    subtitle: "Manage customer rewards and points",
    description: "Configure rewards, track points, and manage loyalty tiers",
    icon: "gift", 
    iconType: "Feather",
    color: "#8B5CF6",
    bgColor: "#F5F3FF",
    route: "",
  },
  { 
    title: "Analytics", 
    subtitle: "Customer behavior and purchase patterns",
    description: "View purchase history, analyze behavior, and identify trends",
    icon: "bar-chart-2", 
    iconType: "Feather",
    color: "#10B981",
    bgColor: "#ECFDF5",
    route: "",
    badge: "Real-time"
  },
  { 
    title: "Segmentation", 
    subtitle: "Create and manage customer segments",
    description: "Group customers by behavior, preferences, and purchasing history",
    icon: "layers", 
    iconType: "Feather",
    color: "#F59E0B",
    bgColor: "#FFFBEB",
    route: "",
    badge: "6 Segments"
  },
  { 
    title: "Campaigns", 
    subtitle: "Create targeted marketing campaigns",
    description: "Design and launch customized campaigns for different segments",
    icon: "send", 
    iconType: "Feather",
    color: "#EF4444",
    bgColor: "#FEF2F2",
    route: "",
    badge: "New"
  },
];

// Featured customers - moved outside component
const featuredCustomersData = [
  {
    id: 1,
    name: 'Emma Johnson',
    avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
    totalSpent: 2876.45,
    lastPurchase: '2 days ago',
    loyaltyPoints: 876,
    status: 'loyal'
  },
  {
    id: 2,
    name: 'Michael Chen',
    avatar: 'https://randomuser.me/api/portraits/men/22.jpg',
    totalSpent: 1243.89,
    lastPurchase: 'Today',
    loyaltyPoints: 450,
    status: 'active'
  },
  {
    id: 3,
    name: 'Sophia Williams',
    avatar: 'https://randomuser.me/api/portraits/women/63.jpg',
    totalSpent: 987.65,
    lastPurchase: '1 week ago',
    loyaltyPoints: 320,
    status: 'at-risk'
  }
];

export default function CustomerManagement() {
  const router = useRouter();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const insightRotateAnim = useRef(new Animated.Value(0)).current;
  const searchBarAnim = useRef(new Animated.Value(0)).current;
  const featuredCustomerAnim = useRef(new Animated.Value(0)).current;
  
  // State
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [menuItems, setMenuItems] = useState([]);
  const [featuredCustomers, setFeaturedCustomers] = useState([]);
  const [menuItemScales, setMenuItemScales] = useState({});
  const [customerInsights, setCustomerInsights] = useState({
    totalCustomers: 0,
    activeToday: 0,
    newThisWeek: 0,
    atRiskCount: 0,
    loyalCustomers: 0,
    averageSpend: 0,
    totalRevenue: "0",
    satisfactionRate: 0
  });
  
  // Fetch customer data from Firestore
  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      
      // Query for customers (users with role 'customer')
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where("role", "==", "customer"));
      const querySnapshot = await getDocs(q);
      
      let customers = [];
      let totalSpent = 0;
      let today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let activeToday = 0;
      let newThisWeek = 0;
      let atRiskCount = 0;
      let loyalCount = 0;
      
      // One week ago for new customer calculation
      let oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      // One month ago for at-risk calculation
      let oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
      
      // Process customer data
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        customers.push({
          id: doc.id,
          ...userData
        });
        
        // Calculate total spent
        if (userData.totalSpent) {
          totalSpent += parseFloat(userData.totalSpent);
        }
        
        // Check if active today
        if (userData.lastActive) {
          const lastActiveDate = userData.lastActive.toDate ? userData.lastActive.toDate() : new Date(userData.lastActive);
          
          // Active today
          if (lastActiveDate >= today) {
            activeToday++;
          }
          
          // At risk (no activity in last 30 days)
          if (lastActiveDate <= oneMonthAgo) {
            atRiskCount++;
          }
        }
        
        // Check if new this week
        if (userData.createdAt) {
          const createdDate = userData.createdAt.toDate ? userData.createdAt.toDate() : new Date(userData.createdAt);
          if (createdDate >= oneWeekAgo) {
            newThisWeek++;
          }
        }
        
        // Check if loyal customer (based on orders or points)
        if (userData.loyaltyPoints && userData.loyaltyPoints > 500) {
          loyalCount++;
        } else if (userData.orderCount && userData.orderCount > 5) {
          loyalCount++;
        }
      });
      
      // Calculate average spend
      const avgSpend = customers.length > 0 ? totalSpent / customers.length : 0;
      
      // Calculate satisfaction rate (could be from reviews/feedback)
      let satisfactionRate = 0;
      try {
        // Try to get average rating from reviews collection
        const reviewsRef = collection(db, 'reviews');
        const reviewsQuery = query(reviewsRef, where("status", "==", "approved"));
        const reviewsSnapshot = await getDocs(reviewsQuery);
        
        let totalRating = 0;
        let ratingCount = 0;
        
        reviewsSnapshot.forEach(doc => {
          const reviewData = doc.data();
          if (reviewData.rating) {
            totalRating += reviewData.rating;
            ratingCount++;
          }
        });
        
        satisfactionRate = ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 4.5;
      } catch (error) {
        console.log("Error fetching reviews:", error);
        satisfactionRate = 4.5; // Fallback value
      }
      
      // Update insights
      setCustomerInsights({
        totalCustomers: customers.length,
        activeToday: activeToday,
        newThisWeek: newThisWeek,
        atRiskCount: atRiskCount,
        loyalCustomers: loyalCount,
        averageSpend: avgSpend,
        totalRevenue: totalSpent.toFixed(2),
        satisfactionRate: satisfactionRate
      });
      
      // Get featured customers (top 3 by spend)
      const topCustomers = [...customers]
        .sort((a, b) => (parseFloat(b.totalSpent || 0) - parseFloat(a.totalSpent || 0)))
        .slice(0, 3)
        .map(customer => ({
          id: customer.id,
          name: customer.name || customer.displayName || 'Unknown Customer',
          avatar: customer.photoURL || customer.profilePic || 'https://randomuser.me/api/portraits/lego/1.jpg',
          totalSpent: parseFloat(customer.totalSpent || 0),
          lastPurchase: customer.lastPurchaseDate ? formatLastPurchase(customer.lastPurchaseDate) : 'Never',
          loyaltyPoints: customer.loyaltyPoints || 0,
          status: determineCustomerStatus(customer, oneMonthAgo)
        }));
      
      setFeaturedCustomers(topCustomers.length > 0 ? topCustomers : featuredCustomersData);
      
      // Update menu items with the new data
      updateMenuItems(customers.length, loyalCount);
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching customer data:", error);
      // Fallback to sample data
      setCustomerInsights({
        totalCustomers: 5243,
        activeToday: 187,
        newThisWeek: 68,
        atRiskCount: 23,
        loyalCustomers: 843,
        averageSpend: 127.50,
        totalRevenue: '668,482.50',
        satisfactionRate: 4.7
      });
      setFeaturedCustomers(featuredCustomersData);
      updateMenuItems(5243, 843);
      setLoading(false);
    }
  };
  
  // Update menu items with real data
  const updateMenuItems = (totalCustomers, loyalCustomers) => {
    const processedMenuItems = menuItemsData.map(item => {
      if (item.title === "Customer Profiles") {
        return {
          ...item,
          badge: `${totalCustomers} Profiles`
        };
      } else if (item.title === "Loyalty Program") {
        return {
          ...item,
          badge: `${loyalCustomers} Members`
        };
      }
      return item;
    });
    
    setMenuItems(processedMenuItems);
    
    // Initialize animation scales for each menu item
    const scales = {};
    processedMenuItems.forEach((_, index) => {
      scales[index] = new Animated.Value(1);
    });
    setMenuItemScales(scales);
  };
  
  // Format last purchase date relative to today
  const formatLastPurchase = (timestamp) => {
    try {
      const purchaseDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffTime = Math.abs(now - purchaseDate);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else if (diffDays < 30) {
        return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
      } else {
        return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
      }
    } catch (error) {
      return 'Unknown';
    }
  };
  
  // Determine customer status based on data
  const determineCustomerStatus = (customer, oneMonthAgo) => {
    if (customer.loyaltyPoints && customer.loyaltyPoints > 500) {
      return 'loyal';
    }
    
    if (customer.orderCount && customer.orderCount > 5) {
      return 'loyal';
    }
    
    if (customer.lastActive) {
      const lastActiveDate = customer.lastActive.toDate ? customer.lastActive.toDate() : new Date(customer.lastActive);
      
      if (lastActiveDate <= oneMonthAgo) {
        return 'at-risk';
      }
    }
    
    return 'active';
  };
  
  // Initialize data and animations on mount
  useEffect(() => {
    // Fetch customer data from Firestore
    fetchCustomerData();
    
    // Start entrance animations
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
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
    
    // Start continuous insight rotation animation
    Animated.loop(
      Animated.timing(insightRotateAnim, {
        toValue: 1,
        duration: 8000,
        useNativeDriver: true,
      })
    ).start();
    
    // Animate featured customers entrance
    Animated.timing(featuredCustomerAnim, {
      toValue: 1,
      duration: 800,
      delay: 400,
      useNativeDriver: true,
    }).start();
  }, []);
  
  // Toggle search bar
  const toggleSearch = () => {
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        Vibration.vibrate(20);
      }
    } else {
      Vibration.vibrate(20);
    }
    
    setSearchVisible(!searchVisible);
    
    Animated.timing(searchBarAnim, {
      toValue: searchVisible ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };
  
  // Handle menu item press with animation and haptic feedback
  const handleMenuItemPress = (index, route) => {
    // Check if animation value exists to prevent errors
    if (!menuItemScales[index]) return;
    
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        Vibration.vibrate(40);
      }
    } else {
      Vibration.vibrate(40);
    }
    
    // Animate the card
    Animated.sequence([
      Animated.timing(menuItemScales[index], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(menuItemScales[index], {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(menuItemScales[index], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
    
    // Navigate if route is provided
    if (route) {
      setTimeout(() => {
        router.push(route);
      }, 200);
    } else {
      setTimeout(() => {
        alert("Feature coming soon!");
      }, 200);
    }
  };
  
  // Handle customer profile press
  const handleCustomerPress = (customer) => {
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        Vibration.vibrate(20);
      }
    } else {
      Vibration.vibrate(20);
    }
    
    alert(`View ${customer.name}'s profile`);
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };
  
  // Render icon based on type
  const renderIcon = (icon, type, size, color) => {
    switch (type) {
      case "Feather":
        return <Feather name={icon} size={size} color={color} />;
      case "Ionicons":
        return <Ionicons name={icon} size={size} color={color} />;
      case "MaterialIcons":
        return <MaterialIcons name={icon} size={size} color={color} />;
      case "MaterialCommunityIcons":
        return <MaterialCommunityIcons name={icon} size={size} color={color} />;
      default:
        return <Feather name={icon} size={size} color={color} />;
    }
  };
  
  // Calculate the rotation interpolation for the insight card
  const rotateInterpolation = insightRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  // Refresh customer data
  const refreshData = () => {
    setLoading(true);
    fetchCustomerData();
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <HomeHeader title="Customer Management" showBackButton={true} />
      
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Insight Summary Card */}
        <Animated.View 
          style={{
            opacity: fadeAnim,
            transform: [{ translateY }, { scale: scaleAnim }],
          }}
          className="mx-4 mb-6 overflow-hidden"
        >
          <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
            {loading ? (
              <View className="items-center justify-center py-8">
                <Animated.View 
                  style={{
                    transform: [{ rotate: rotateInterpolation }]
                  }}
                >
                  <Feather name="loader" size={24} color="#4B5563" />
                </Animated.View>
                <Text className="text-gray-500 mt-2">Loading customer data...</Text>
              </View>
            ) : (
              <>
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-gray-800 text-lg font-bold">Customer Insights</Text>
                  <View className="flex-row">
                    <TouchableOpacity 
                      className="bg-gray-100 rounded-full p-2 mr-2"
                      onPress={refreshData}
                    >
                      <Feather name="refresh-cw" size={16} color="#4B5563" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      className="bg-gray-100 rounded-full p-2"
                      onPress={() => alert("View detailed insights")}
                    >
                      <Feather name="bar-chart-2" size={16} color="#4B5563" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View className="flex-row flex-wrap justify-between">
                  <View className="w-[48%] mb-4">
                    <Text className="text-gray-500 text-xs mb-1">Total Customers</Text>
                    <Text className="text-gray-800 text-xl font-bold">{customerInsights.totalCustomers.toLocaleString()}</Text>
                  </View>
                  
                  <View className="w-[48%] mb-4">
                    <Text className="text-gray-500 text-xs mb-1">Active Today</Text>
                    <Text className="text-gray-800 text-xl font-bold">{customerInsights.activeToday}</Text>
                  </View>
                  
                  <View className="w-[48%]">
                    <Text className="text-gray-500 text-xs mb-1">New This Week</Text>
                    <Text className="text-gray-800 text-xl font-bold">{customerInsights.newThisWeek}</Text>
                  </View>
                  
                  <View className="w-[48%]">
                    <Text className="text-gray-500 text-xs mb-1">Satisfaction</Text>
                    <View className="flex-row items-center">
                      <Text className="text-gray-800 text-xl font-bold mr-1">{customerInsights.satisfactionRate}</Text>
                      <Ionicons name="star" size={16} color="#F59E0B" />
                    </View>
                  </View>
                </View>
                
                <View className="flex-row mt-4 justify-between">
                  <View className="flex-1">
                    <Text className="text-gray-500 text-xs mb-1">Loyal Customers</Text>
                    <Text className="text-gray-800 font-semibold">{customerInsights.loyalCustomers}</Text>
                  </View>
                  
                  <View className="flex-1">
                    <Text className="text-gray-500 text-xs mb-1">At Risk</Text>
                    <Text className="text-gray-800 font-semibold">{customerInsights.atRiskCount}</Text>
                  </View>
                  
                  <View className="flex-1">
                    <Text className="text-gray-500 text-xs mb-1">Avg. Spend</Text>
                    <Text className="text-gray-800 font-semibold">${parseFloat(customerInsights.averageSpend).toFixed(2)}</Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  className="mt-4 bg-gray-100 rounded-lg py-2 items-center"
                  onPress={() => alert("View all insights")}
                >
                  <Text className="text-gray-700 font-medium">View Detailed Insights</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Animated.View>
        
        {/* Search and Filter Bar */}
        <View className="mx-4 mb-6 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="w-1 h-6 bg-indigo-600 rounded-full mr-2" />
            <Text className="text-lg font-semibold text-gray-800">
              Management Tools
            </Text>
          </View>
          
          <TouchableOpacity
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
            onPress={toggleSearch}
          >
            <Feather name="search" size={20} color="#4B5563" />
          </TouchableOpacity>
        </View>
        
        {/* Animated Search Bar */}
        {searchVisible && (
          <Animated.View 
            className="mx-4 mb-4"
            style={{
              opacity: searchBarAnim,
              transform: [
                { 
                  translateY: searchBarAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0]
                  })
                }
              ]
            }}
          >
            <View className="flex-row bg-white rounded-lg border border-gray-200 px-3 py-2 items-center shadow-sm">
              <Feather name="search" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-2 text-gray-800"
                placeholder="Search customers or tools..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Feather name="x" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}
        
        {/* Management Tools/Cards */}
        <View className="px-4 mb-6">
          {menuItems.length > 0 && (
      <FlatList
        data={menuItems}
        keyExtractor={(item, index) => index.toString()}
        numColumns={2}
              scrollEnabled={false}
              columnWrapperStyle={{ justifyContent: "space-between" }}
              contentContainerStyle={{ gap: 12 }}
              renderItem={({ item, index }) => (
                <Animated.View 
                  style={{
                    width: (width - 48) / 2,
                    marginBottom: 12,
                    opacity: fadeAnim,
                    transform: [{ scale: menuItemScales[index] || 1 }],
                  }}
                >
                  <TouchableOpacity
                    className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100"
                    onPress={() => handleMenuItemPress(index, item.route)}
                    activeOpacity={0.9}
                  >
                    <View className="p-4">
                      <View 
                        className="w-12 h-12 rounded-full items-center justify-center mb-3"
                        style={{ backgroundColor: item.bgColor }}
                      >
                        {renderIcon(item.icon, item.iconType, 24, item.color)}
                      </View>
                      
                      <Text className="text-gray-800 font-semibold text-base mb-1" numberOfLines={1}>
                        {item.title}
                      </Text>
                      
                      <Text className="text-gray-500 text-xs mb-3" numberOfLines={2}>
                        {item.subtitle}
                      </Text>
                      
                      {item.badge && (
                        <View className="bg-gray-100 self-start rounded-full px-2 py-1">
                          <Text className="text-gray-600 text-xs font-medium">
                            {item.badge}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              )}
            />
          )}
        </View>
        
        {/* Featured Customers Section */}
        <View className="px-4 mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center">
              <View className="w-1 h-6 bg-blue-500 rounded-full mr-2" />
              <Text className="text-lg font-semibold text-gray-800">
                Featured Customers
              </Text>
            </View>
            
            <TouchableOpacity 
              className="flex-row items-center"
              onPress={() => router.push("/manager/customerList")}
            >
              <Text className="text-blue-600 text-sm font-medium mr-1">View All</Text>
              <Feather name="chevron-right" size={16} color="#2563EB" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Customer Cards */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 16, paddingRight: 16 }}
          className="mb-6"
        >
          {featuredCustomers.map((customer, index) => (
            <Animated.View
              key={customer.id}
              style={{
                opacity: featuredCustomerAnim,
                transform: [
                  { 
                    translateX: featuredCustomerAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0]
                    })
                  }
                ],
                marginRight: 12,
              }}
            >
              <TouchableOpacity
                className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 w-64"
                onPress={() => handleCustomerPress(customer)}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={
                    customer.status === 'loyal' ? ['#4F46E5', '#6366F1'] :
                    customer.status === 'active' ? ['#10B981', '#34D399'] : 
                    ['#F59E0B', '#FBBF24']
                  }
                  className="h-2"
                />
                
                <View className="p-4">
                  <View className="flex-row items-center mb-3">
                    <Image
                      source={{ uri: customer.avatar }}
                      className="w-12 h-12 rounded-full mr-3 border-2 border-white"
                      style={{ backgroundColor: '#E5E7EB' }}
                    />
                    
                    <View className="flex-1">
                      <Text className="text-gray-800 font-semibold">{customer.name}</Text>
                      <View className="flex-row items-center">
                        <Text className="text-gray-500 text-xs mr-2">Last purchase: {customer.lastPurchase}</Text>
                        <View 
                          className="h-2 w-2 rounded-full"
                          style={{ 
                            backgroundColor: 
                              customer.status === 'loyal' ? '#4F46E5' : 
                              customer.status === 'active' ? '#10B981' : 
                              '#F59E0B'
                          }}
                        />
                      </View>
                    </View>
                  </View>
                  
                  <View className="flex-row justify-between mb-2">
                    <View>
                      <Text className="text-xs text-gray-500">Total Spent</Text>
                      <Text className="font-semibold text-gray-800">{formatCurrency(customer.totalSpent)}</Text>
                    </View>
                    
                    <View className="items-end">
                      <Text className="text-xs text-gray-500">Loyalty Points</Text>
                      <Text className="font-semibold text-gray-800">{customer.loyaltyPoints}</Text>
                    </View>
                  </View>
                  
                  <View className="flex-row justify-between items-center pt-2 border-t border-gray-100">
                    <View 
                      className="py-1 px-2 rounded-full"
                      style={{ 
                        backgroundColor: 
                          customer.status === 'loyal' ? '#EEF2FF' : 
                          customer.status === 'active' ? '#ECFDF5' : 
                          '#FFFBEB'
                      }}
                    >
                      <Text 
                        className="text-xs font-medium"
                        style={{ 
                          color: 
                            customer.status === 'loyal' ? '#4F46E5' : 
                            customer.status === 'active' ? '#10B981' : 
                            '#F59E0B'
                        }}
                      >
                        {customer.status === 'loyal' ? 'Loyal Customer' : 
                         customer.status === 'active' ? 'Active Buyer' : 
                         'Needs Attention'}
                      </Text>
                    </View>
                    
                    <TouchableOpacity
                      className="h-8 w-8 rounded-full bg-gray-100 items-center justify-center"
                      onPress={() => alert(`Contact ${customer.name}`)}
                    >
                      <Feather name="message-circle" size={16} color="#4B5563" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
        
        {/* Quick Actions Section */}
        <View className="mx-4 mb-4">
          <View className="mb-3">
            <View className="flex-row items-center">
              <View className="w-1 h-6 bg-green-500 rounded-full mr-2" />
              <Text className="text-lg font-semibold text-gray-800">
                Quick Actions
              </Text>
            </View>
          </View>
          
          <View className="flex-row flex-wrap justify-between">
            {['Send Notification', 'Create Segment', 'Export Data', 'Schedule Campaign'].map((action, index) => (
              <TouchableOpacity
                key={index}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 mb-4"
                style={{ width: (width - 40) / 2 }}
                onPress={() => alert(`${action} action coming soon!`)}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center">
                  <View 
                    className="w-8 h-8 rounded-full items-center justify-center mr-2"
                    style={{ 
                      backgroundColor: 
                        index === 0 ? '#EEF2FF' : 
                        index === 1 ? '#ECFDF5' : 
                        index === 2 ? '#FEF3C7' :
                        '#FEF2F2'
                    }}
                  >
                    {index === 0 && <Feather name="bell" size={16} color="#4F46E5" />}
                    {index === 1 && <Feather name="users" size={16} color="#10B981" />}
                    {index === 2 && <Feather name="download" size={16} color="#F59E0B" />}
                    {index === 3 && <Feather name="calendar" size={16} color="#EF4444" />}
                  </View>
                  
                  <Text className="flex-1 text-sm text-gray-800 font-medium" numberOfLines={2}>
                    {action}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
