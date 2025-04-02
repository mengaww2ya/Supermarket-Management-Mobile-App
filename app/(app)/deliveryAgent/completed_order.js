import React, { useState, useEffect, useRef } from 'react';
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
  RefreshControl
} from 'react-native';
import { Ionicons, Feather, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import HomeHeader from '../../components/HomeHeader';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

export default function CompletedOrdersScreen() {
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [selectedDateRange, setSelectedDateRange] = useState('week');
  const [showStats, setShowStats] = useState(true);
  
  // Sample completed order data
  const completedOrders = [
    {
      id: 'CO1001',
      orderNumber: 'ORD7896',
      date: '2023-11-18',
      time: '14:30',
      customer: {
        name: 'Sarah Johnson',
        photo: 'https://randomuser.me/api/portraits/women/44.jpg',
        address: '456 Elm Road, Kirkos, Addis Ababa',
        phone: '+251 91 987 6543'
      },
      delivery: {
        distance: '3.7 km',
        duration: '28 min',
        payment: {
          amount: '$22.75',
          method: 'Cash',
          tip: '$5.00'
        }
      },
      rating: 5,
      feedback: 'Very prompt service! Delivery was quick and food was still hot.',
      items: 3
    },
    {
      id: 'CO1002',
      orderNumber: 'ORD7901',
      date: '2023-11-18',
      time: '12:15',
      customer: {
        name: 'Michael Davies',
        photo: 'https://randomuser.me/api/portraits/men/67.jpg',
        address: '789 Oak Ave, Arada, Addis Ababa',
        phone: '+251 91 345 6789'
      },
      delivery: {
        distance: '5.2 km',
        duration: '35 min',
        payment: {
          amount: '$62.30',
          method: 'Card',
          tip: '$7.50'
        }
      },
      rating: 4,
      feedback: 'Good service, but took a bit longer than expected.',
      items: 8
    },
    {
      id: 'CO1003',
      orderNumber: 'ORD7912',
      date: '2023-11-17',
      time: '18:45',
      customer: {
        name: 'Emma Williams',
        photo: 'https://randomuser.me/api/portraits/women/23.jpg',
        address: '321 Pine Blvd, Nifas Silk, Addis Ababa',
        phone: '+251 91 567 8901'
      },
      delivery: {
        distance: '4.8 km',
        duration: '32 min',
        payment: {
          amount: '$85.99',
          method: 'Card',
          tip: '$10.00'
        }
      },
      rating: 5,
      feedback: 'Excellent service! Delivery person was very polite.',
      items: 12
    },
    {
      id: 'CO1004',
      orderNumber: 'ORD7915',
      date: '2023-11-16',
      time: '11:20',
      customer: {
        name: 'John Smith',
        photo: 'https://randomuser.me/api/portraits/men/32.jpg',
        address: '123 Main St, Bole, Addis Ababa',
        phone: '+251 91 234 5678'
      },
      delivery: {
        distance: '2.4 km',
        duration: '20 min',
        payment: {
          amount: '$38.50',
          method: 'Card',
          tip: '$6.00'
        }
      },
      rating: 3,
      feedback: 'Order was missing one item, but delivery was quick.',
      items: 5
    },
    {
      id: 'CO1005',
      orderNumber: 'ORD7918',
      date: '2023-11-16',
      time: '09:45',
      customer: {
        name: 'Daniel Brown',
        photo: 'https://randomuser.me/api/portraits/men/94.jpg',
        address: '567 Cedar St, Lideta, Addis Ababa',
        phone: '+251 91 678 9012'
      },
      delivery: {
        distance: '3.1 km',
        duration: '25 min',
        payment: {
          amount: '$15.25',
          method: 'Cash',
          tip: '$3.00'
        }
      },
      rating: 5,
      feedback: 'Perfect delivery, right on time.',
      items: 2
    }
  ];

  // Stats calculations
  const totalEarnings = completedOrders.reduce((sum, order) => {
    const amount = parseFloat(order.delivery.payment.amount.replace('$', ''));
    const tip = parseFloat(order.delivery.payment.tip.replace('$', ''));
    return sum + amount + tip;
  }, 0).toFixed(2);
  
  const averageRating = (completedOrders.reduce((sum, order) => sum + order.rating, 0) / completedOrders.length).toFixed(1);
  
  const totalDistance = completedOrders.reduce((sum, order) => {
    return sum + parseFloat(order.delivery.distance.replace(' km', ''));
  }, 0).toFixed(1);

  // Initialize and filter orders
  useEffect(() => {
    setFilteredOrders(completedOrders);
    
    // Start animations
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
    
    return () => {
      // Cleanup
    };
  }, []);

  // Apply filters when search query or filter changes
  useEffect(() => {
    let results = completedOrders;
    
    // Apply search filter
    if (searchQuery) {
      results = results.filter(order => 
        order.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply date range filter
    if (selectedDateRange !== 'all') {
      const today = new Date();
      const startDate = new Date();
      
      if (selectedDateRange === 'today') {
        startDate.setHours(0, 0, 0, 0);
      } else if (selectedDateRange === 'week') {
        startDate.setDate(today.getDate() - 7);
      } else if (selectedDateRange === 'month') {
        startDate.setMonth(today.getMonth() - 1);
      }
      
      results = results.filter(order => {
        const orderDate = new Date(order.date);
        return orderDate >= startDate && orderDate <= today;
      });
    }
    
    // Apply rating filter
    if (activeFilter !== 'all') {
      if (activeFilter === 'high-rated') {
        results = results.filter(order => order.rating >= 4);
      } else if (activeFilter === 'issues') {
        results = results.filter(order => order.rating < 4);
      }
    }
    
    setFilteredOrders(results);
  }, [searchQuery, activeFilter, selectedDateRange]);

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    
    // Simulate refresh
    setTimeout(() => {
      setIsRefreshing(false);
      
      // Haptic feedback
      if (Platform.OS === 'ios') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
          // Fallback if haptics not available
        }
      }
    }, 1500);
  };

  // Toggle search visibility
  const toggleSearch = () => {
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Fallback if haptics not available
      }
    }
    setIsSearchVisible(!isSearchVisible);
    if (isSearchVisible) {
      setSearchQuery('');
    }
  };

  // Handle filter selection
  const handleFilterSelect = (filter) => {
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Fallback if haptics not available
      }
    }
    setActiveFilter(filter);
  };

  // Handle date range selection
  const handleDateRangeSelect = (range) => {
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Fallback if haptics not available
      }
    }
    setSelectedDateRange(range);
  };

  // View order details
  const viewOrderDetails = (order) => {
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Fallback if haptics not available
      }
    }
    // Navigate to order details
    router.push(`/deliveryAgent/order-details?id=${order.id}`);
  };

  // Format date string to readable format
  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
  };

  // Header animation for parallax effect
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [showStats ? 190 : 0, 0],
    extrapolate: 'clamp',
  });

  // Item animation
  const getItemAnimation = (index) => {
    return {
      opacity: fadeAnim,
      transform: [
        {
          translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [50 + (index * 10), 0],
          }),
        },
      ],
    };
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      <StatusBar style="light" />
      
      <HomeHeader title="Completed Orders" showBackButton />
      
      {/* Stats Header - Collapsible */}
      <Animated.View style={{ height: headerHeight, overflow: 'hidden' }}>
        <LinearGradient
          colors={['#4338CA', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="px-4 pt-3 pb-4"
        >
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-white font-bold text-lg">Delivery Summary</Text>
            <TouchableOpacity 
              onPress={() => setShowStats(!showStats)}
              className="bg-white bg-opacity-20 p-1 rounded-full"
            >
              <Feather name={showStats ? "chevron-up" : "chevron-down"} size={20} color="white" />
            </TouchableOpacity>
          </View>
          
          <View className="flex-row justify-between">
            <View className="bg-white bg-opacity-20 p-3 rounded-xl flex-1 mr-2">
              <View className="flex-row items-center">
                <Feather name="dollar-sign" size={16} color="white" className="mr-1" />
                <Text className="text-white text-opacity-80 text-xs">Earnings</Text>
              </View>
              <Text className="text-white font-bold text-xl mt-1">${totalEarnings}</Text>
            </View>
            
            <View className="bg-white bg-opacity-20 p-3 rounded-xl flex-1 mr-2">
              <View className="flex-row items-center">
                <Feather name="star" size={16} color="white" className="mr-1" />
                <Text className="text-white text-opacity-80 text-xs">Avg Rating</Text>
              </View>
              <Text className="text-white font-bold text-xl mt-1">{averageRating}</Text>
            </View>
            
            <View className="bg-white bg-opacity-20 p-3 rounded-xl flex-1">
              <View className="flex-row items-center">
                <Feather name="map" size={16} color="white" className="mr-1" />
                <Text className="text-white text-opacity-80 text-xs">Distance</Text>
              </View>
              <Text className="text-white font-bold text-xl mt-1">{totalDistance} km</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
      
      {/* Filter/Search Controls */}
      <View className="px-4 pt-3 pb-2 bg-white border-b border-gray-100">
        {/* Search Bar */}
        {isSearchVisible && (
          <Animated.View 
            className="mb-3"
            entering={Animated.FadeInDown}
            exiting={Animated.FadeOutUp}
          >
            <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
              <Feather name="search" size={18} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-2 text-gray-800"
                placeholder="Search by customer or order #"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Feather name="x" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}
        
        {/* Date Range Selector */}
        <View className="flex-row mb-3">
          <TouchableOpacity 
            className={`mr-2 px-3 py-1.5 rounded-full ${selectedDateRange === 'today' ? 'bg-indigo-100' : 'bg-gray-100'}`}
            onPress={() => handleDateRangeSelect('today')}
          >
            <Text className={`${selectedDateRange === 'today' ? 'text-indigo-700' : 'text-gray-600'} font-medium text-sm`}>Today</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className={`mr-2 px-3 py-1.5 rounded-full ${selectedDateRange === 'week' ? 'bg-indigo-100' : 'bg-gray-100'}`}
            onPress={() => handleDateRangeSelect('week')}
          >
            <Text className={`${selectedDateRange === 'week' ? 'text-indigo-700' : 'text-gray-600'} font-medium text-sm`}>This Week</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className={`mr-2 px-3 py-1.5 rounded-full ${selectedDateRange === 'month' ? 'bg-indigo-100' : 'bg-gray-100'}`}
            onPress={() => handleDateRangeSelect('month')}
          >
            <Text className={`${selectedDateRange === 'month' ? 'text-indigo-700' : 'text-gray-600'} font-medium text-sm`}>This Month</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className={`px-3 py-1.5 rounded-full ${selectedDateRange === 'all' ? 'bg-indigo-100' : 'bg-gray-100'}`}
            onPress={() => handleDateRangeSelect('all')}
          >
            <Text className={`${selectedDateRange === 'all' ? 'text-indigo-700' : 'text-gray-600'} font-medium text-sm`}>All Time</Text>
          </TouchableOpacity>
        </View>
        
        {/* Filter Tabs */}
        <View className="flex-row justify-between items-center">
          <View className="flex-row">
            <TouchableOpacity 
              className={`mr-2 px-3 py-1.5 rounded-lg ${activeFilter === 'all' ? 'bg-indigo-600' : 'bg-gray-100'}`}
              onPress={() => handleFilterSelect('all')}
            >
              <Text className={`${activeFilter === 'all' ? 'text-white' : 'text-gray-600'} font-medium text-sm`}>All Orders</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`mr-2 px-3 py-1.5 rounded-lg ${activeFilter === 'high-rated' ? 'bg-green-600' : 'bg-gray-100'}`}
              onPress={() => handleFilterSelect('high-rated')}
            >
              <Text className={`${activeFilter === 'high-rated' ? 'text-white' : 'text-gray-600'} font-medium text-sm`}>High Rated</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`px-3 py-1.5 rounded-lg ${activeFilter === 'issues' ? 'bg-red-600' : 'bg-gray-100'}`}
              onPress={() => handleFilterSelect('issues')}
            >
              <Text className={`${activeFilter === 'issues' ? 'text-white' : 'text-gray-600'} font-medium text-sm`}>Issues</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            className="p-2"
            onPress={toggleSearch}
          >
            <Feather name={isSearchVisible ? "x" : "search"} size={22} color="#4F46E5" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Orders List */}
      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#4F46E5']}
            tintColor="#4F46E5"
          />
        }
        ListEmptyComponent={() => (
          <View className="flex-1 items-center justify-center py-10">
            <Feather name="inbox" size={50} color="#D1D5DB" />
            <Text className="text-gray-400 mt-4 font-medium">No completed orders found</Text>
            {(searchQuery || activeFilter !== 'all' || selectedDateRange !== 'week') && (
              <TouchableOpacity 
                className="mt-3 px-4 py-2 bg-indigo-600 rounded-lg"
                onPress={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                  setSelectedDateRange('week');
                }}
              >
                <Text className="text-white font-medium">Reset Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        renderItem={({ item, index }) => (
          <Animated.View 
            style={getItemAnimation(index)}
            className="mb-4"
          >
            <Pressable
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              onPress={() => viewOrderDetails(item)}
              style={({ pressed }) => [
                pressed ? { opacity: 0.9, transform: [{ scale: 0.98 }] } : {}
              ]}
            >
              <View className="p-4">
                {/* Order Header */}
                <View className="flex-row justify-between items-center mb-3">
                  <View className="flex-row items-center">
                    <View className="bg-indigo-100 p-1.5 rounded-md mr-2">
                      <Feather name="check-circle" size={16} color="#4F46E5" />
                    </View>
                    <Text className="font-semibold text-gray-900">{item.orderNumber}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Feather name="calendar" size={14} color="#9CA3AF" className="mr-1" />
                    <Text className="text-gray-500 text-xs">{formatDate(item.date)} • {item.time}</Text>
                  </View>
                </View>
                
                {/* Customer Info */}
                <View className="flex-row mb-3">
                  <Image 
                    source={{ uri: item.customer.photo }} 
                    className="w-10 h-10 rounded-full mr-3"
                  />
                  <View className="flex-1">
                    <Text className="text-gray-900 font-medium">{item.customer.name}</Text>
                    <Text className="text-gray-500 text-xs">{item.customer.address}</Text>
                  </View>
                </View>
                
                {/* Delivery Summary */}
                <View className="flex-row justify-between bg-gray-50 p-2 rounded-lg mb-3">
                  <View className="flex-row items-center">
                    <Feather name="map-pin" size={14} color="#6B7280" className="mr-1" />
                    <Text className="text-gray-600 text-xs">{item.delivery.distance}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Feather name="clock" size={14} color="#6B7280" className="mr-1" />
                    <Text className="text-gray-600 text-xs">{item.delivery.duration}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Feather name="package" size={14} color="#6B7280" className="mr-1" />
                    <Text className="text-gray-600 text-xs">{item.items} items</Text>
                  </View>
                </View>
                
                {/* Payment & Rating */}
                <View className="flex-row justify-between border-t border-gray-100 pt-3">
                  <View>
                    <Text className="text-gray-500 text-xs">Earnings</Text>
                    <View className="flex-row items-center">
                      <Text className="text-gray-900 font-semibold mr-1">{item.delivery.payment.amount}</Text>
                      <Text className="text-green-600 text-xs">(+{item.delivery.payment.tip} tip)</Text>
                    </View>
                  </View>
                  
                  <View className="items-end">
                    <Text className="text-gray-500 text-xs">Rating</Text>
                    <View className="flex-row">
                      {[...Array(5)].map((_, i) => (
                        <Ionicons 
                          key={i}
                          name={i < item.rating ? "star" : "star-outline"} 
                          size={16} 
                          color={i < item.rating ? "#FFD700" : "#D1D5DB"} 
                        />
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            </Pressable>
          </Animated.View>
        )}
      />
    </SafeAreaView>
  );
}
