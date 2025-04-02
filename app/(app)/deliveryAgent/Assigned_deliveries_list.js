import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Animated,
  Dimensions,
  Platform,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons, Feather, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import HomeHeader from '../../components/HomeHeader';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

export default function AssignedDeliveriesList() {
  // Animation refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // State variables
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Animation for search bar
  const searchBarAnim = useRef(new Animated.Value(0)).current;
  
  // Sample data for assigned deliveries
  const deliveries = [
    {
      id: 'DEL1001',
      customer: {
        name: 'John Smith',
        photo: 'https://randomuser.me/api/portraits/men/32.jpg',
        phone: '+251 91 234 5678',
        address: '123 Main St, Bole, Addis Ababa'
      },
      orderDetails: {
        orderNumber: 'ORD7892',
        items: 5,
        total: '$38.50',
        paymentMethod: 'Card',
        isPaid: true
      },
      delivery: {
        status: 'In Progress',
        assignedTime: '10:30 AM',
        estimatedArrival: '11:15 AM',
        distance: '2.4 km',
        route: {
          startPoint: 'Supermarket Branch #03',
          endPoint: 'Bole, Addis Ababa'
        }
      },
      priority: 'high'
    },
    {
      id: 'DEL1002',
      customer: {
        name: 'Sarah Johnson',
        photo: 'https://randomuser.me/api/portraits/women/44.jpg',
        phone: '+251 91 987 6543',
        address: '456 Elm Road, Kirkos, Addis Ababa'
      },
      orderDetails: {
        orderNumber: 'ORD7895',
        items: 3,
        total: '$22.75',
        paymentMethod: 'Cash',
        isPaid: false
      },
      delivery: {
        status: 'Assigned',
        assignedTime: '11:00 AM',
        estimatedArrival: '11:45 AM',
        distance: '3.7 km',
        route: {
          startPoint: 'Supermarket Branch #01',
          endPoint: 'Kirkos, Addis Ababa'
        }
      },
      priority: 'medium'
    },
    {
      id: 'DEL1003',
      customer: {
        name: 'Michael Davies',
        photo: 'https://randomuser.me/api/portraits/men/67.jpg',
        phone: '+251 91 345 6789',
        address: '789 Oak Ave, Arada, Addis Ababa'
      },
      orderDetails: {
        orderNumber: 'ORD7899',
        items: 8,
        total: '$62.30',
        paymentMethod: 'Card',
        isPaid: true
      },
      delivery: {
        status: 'Assigned',
        assignedTime: '11:45 AM',
        estimatedArrival: '12:30 PM',
        distance: '5.2 km',
        route: {
          startPoint: 'Supermarket Branch #02',
          endPoint: 'Arada, Addis Ababa'
        }
      },
      priority: 'medium'
    },
    {
      id: 'DEL1004',
      customer: {
        name: 'Emma Williams',
        photo: 'https://randomuser.me/api/portraits/women/23.jpg',
        phone: '+251 91 567 8901',
        address: '321 Pine Blvd, Nifas Silk, Addis Ababa'
      },
      orderDetails: {
        orderNumber: 'ORD7902',
        items: 12,
        total: '$85.99',
        paymentMethod: 'Card',
        isPaid: true
      },
      delivery: {
        status: 'In Progress',
        assignedTime: '12:15 PM',
        estimatedArrival: '1:00 PM',
        distance: '4.8 km',
        route: {
          startPoint: 'Supermarket Branch #01',
          endPoint: 'Nifas Silk, Addis Ababa'
        }
      },
      priority: 'high'
    },
    {
      id: 'DEL1005',
      customer: {
        name: 'Daniel Brown',
        photo: 'https://randomuser.me/api/portraits/men/94.jpg',
        phone: '+251 91 678 9012',
        address: '567 Cedar St, Lideta, Addis Ababa'
      },
      orderDetails: {
        orderNumber: 'ORD7906',
        items: 2,
        total: '$15.25',
        paymentMethod: 'Cash',
        isPaid: false
      },
      delivery: {
        status: 'Delayed',
        assignedTime: '9:30 AM',
        estimatedArrival: '10:45 AM',
        distance: '3.1 km',
        route: {
          startPoint: 'Supermarket Branch #03',
          endPoint: 'Lideta, Addis Ababa'
        }
      },
      priority: 'low'
    }
  ];

  // Initialize filtered deliveries and animations on mount
  useEffect(() => {
    setFilteredDeliveries(deliveries || []);
    
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
      
      // Start entrance animations
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Update filtered deliveries when search query or filter changes
  useEffect(() => {
    // Protect against undefined deliveries
    let results = deliveries || [];
    
    // Apply search filter
    if (searchQuery) {
      results = results.filter(item => 
        item.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.orderDetails.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customer.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply status filter
    if (activeFilter !== 'all') {
      results = results.filter(item => {
        if (activeFilter === 'in-progress') return item.delivery.status === 'In Progress';
        if (activeFilter === 'new-orders') return item.delivery.status === 'Assigned';
        return true;
      });
    }
    
    setFilteredDeliveries(results);
  }, [searchQuery, activeFilter]);

  // Show/hide search bar animation
  const toggleSearch = () => {
    if (showSearch) {
      // Hide search bar
      Animated.timing(searchBarAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowSearch(false));
      
      setSearchQuery('');
    } else {
      // Show search bar
      setShowSearch(true);
      Animated.timing(searchBarAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Fallback
      }
    }
  };

  // Pull to refresh functionality
  const onRefresh = () => {
    setIsRefreshing(true);
    
    // Simulate refresh
    setTimeout(() => {
      setIsRefreshing(false);
      
      // Haptic feedback on refresh complete
      if (Platform.OS === 'ios') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
          // Fallback
        }
      }
    }, 1500);
  };

  // Set active filter
  const handleFilterPress = (filter) => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Fallback
      }
    }
    
    setActiveFilter(filter);
  };

  // Open delivery details
  const handleDeliveryPress = (delivery) => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Fallback
      }
    }
    
    setSelectedDelivery(delivery);
    router.push(`/deliveryAgent/delivery-details?id=${delivery.id}`);
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'In Progress':
        return '#3B82F6';
      case 'Assigned':
        return '#8B5CF6';
      case 'Delayed':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'In Progress':
        return <FontAwesome5 name="shipping-fast" size={14} color="white" />;
      case 'Assigned':
        return <Feather name="clock" size={14} color="white" />;
      case 'Delayed':
        return <MaterialIcons name="timer-off" size={14} color="white" />;
      default:
        return <Feather name="package" size={14} color="white" />;
    }
  };

  // Header animation - reduce opacity as scroll increases
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });

  // Card animations
  const getItemAnimationStyle = (index) => {
    return {
      opacity: fadeAnim,
      transform: [
        {
          translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [50, 0],
          }),
        },
        {
          scale: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.9, 1],
          }),
        }
      ],
    };
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      <StatusBar style="light" />
      
      {/* Header */}
      <HomeHeader title="Assigned Deliveries" showBackButton />
      
      {/* Search and Filters */}
      <Animated.View 
        style={{ 
          opacity: headerOpacity,
          paddingHorizontal: 16,
          paddingBottom: 8,
          backgroundColor: '#f8fafc'
        }}
        className="z-10"
      >
        {/* Search Bar */}
        {showSearch ? (
          <Animated.View
            style={{
              transform: [
                {
                  translateY: searchBarAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
                {
                  scale: searchBarAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
              opacity: searchBarAnim,
              marginBottom: 12,
            }}
          >
            <View className="flex-row items-center bg-white rounded-xl px-4 py-2 border border-gray-100 shadow-sm">
              <Feather name="search" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-2 text-gray-800 text-base py-2"
                placeholder="Search by name, order #, address..."
                placeholderTextColor="#9CA3AF"
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
        ) : null}
        
        {/* Filter Pills */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          className="mb-2"
        >
          <TouchableOpacity
            className={`mr-2 px-4 py-2 rounded-full ${activeFilter === 'all' ? 'bg-indigo-600' : 'bg-white border border-gray-200'}`}
            onPress={() => handleFilterPress('all')}
          >
            <Text 
              className={`font-medium ${activeFilter === 'all' ? 'text-white' : 'text-gray-700'}`}
            >
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className={`mr-2 px-4 py-2 rounded-full ${activeFilter === 'in-progress' ? 'bg-blue-600' : 'bg-white border border-gray-200'}`}
            onPress={() => handleFilterPress('in-progress')}
          >
            <Text 
              className={`font-medium ${activeFilter === 'in-progress' ? 'text-white' : 'text-gray-700'}`}
            >
              In Progress
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className={`mr-2 px-4 py-2 rounded-full ${activeFilter === 'new-orders' ? 'bg-purple-600' : 'bg-white border border-gray-200'}`}
            onPress={() => handleFilterPress('new-orders')}
          >
            <Text 
              className={`font-medium ${activeFilter === 'new-orders' ? 'text-white' : 'text-gray-700'}`}
            >
              New Orders
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
      
      {/* Action Buttons Floating */}
      <View className="absolute right-4 z-20" style={{ top: 140 }}>
        <TouchableOpacity
          className="bg-indigo-600 p-3 rounded-full shadow-lg mb-2"
          onPress={toggleSearch}
          style={{
            elevation: 3,
            shadowColor: '#4F46E5',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
          }}
        >
          <Feather name={showSearch ? "x" : "search"} size={20} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity
          className="bg-indigo-600 p-3 rounded-full shadow-lg"
          onPress={() => {
            // Sort functionality
            if (Platform.OS === 'ios') {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              } catch (e) {
                // Fallback
              }
            }
          }}
          style={{
            elevation: 3,
            shadowColor: '#4F46E5',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
          }}
        >
          <Feather name="sliders" size={20} color="white" />
        </TouchableOpacity>
      </View>
      
      {/* Delivery List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="text-gray-500 mt-4 text-base">Loading deliveries...</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={filteredDeliveries || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={onRefresh}
              tintColor="#4F46E5"
              colors={['#4F46E5']}
            />
          }
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center py-20">
              <Feather name="inbox" size={50} color="#D1D5DB" />
              <Text className="text-gray-400 mt-4 text-base">No deliveries found</Text>
              <TouchableOpacity 
                className="bg-indigo-600 px-4 py-2 rounded-lg mt-3"
                onPress={() => {
                  setSearchQuery('');
                  setActiveFilter('all');
                }}
              >
                <Text className="text-white font-medium">Reset Filters</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item, index }) => (
            <Animated.View style={getItemAnimationStyle(index)}>
              <Pressable
                className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden"
                onPress={() => handleDeliveryPress(item)}
                style={({ pressed }) => [
                  pressed ? { opacity: 0.95, transform: [{ scale: 0.98 }] } : {}
                ]}
              >
                {/* Priority indicator */}
                <View 
                  className="absolute top-0 left-0 bottom-0 w-1.5"
                  style={{ backgroundColor: getPriorityColor(item.priority) }}
                />
                
                {/* Status badge */}
                <View className="absolute top-4 right-4 z-10">
                  <View 
                    className="flex-row items-center px-2 py-1 rounded-full"
                    style={{ backgroundColor: getStatusColor(item.delivery.status) }}
                  >
                    {getStatusIcon(item.delivery.status)}
                    <Text className="text-white text-xs font-medium ml-1">{item.delivery.status}</Text>
                  </View>
                </View>
                
                <View className="px-4 py-4">
                  {/* Customer info */}
                  <View className="flex-row mb-3 pl-2 items-center">
                    <Image 
                      source={{ uri: item.customer.photo }} 
                      className="w-12 h-12 rounded-full mr-3"
                    />
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-gray-800 font-bold text-lg">{item.customer.name}</Text>
                      </View>
                      <Text className="text-gray-500 text-xs">{item.customer.address}</Text>
                    </View>
                  </View>
                  
                  {/* Order info */}
                  <View className="flex-row justify-between px-2 pb-3">
                    <View className="flex-1">
                      <Text className="text-gray-500 text-xs">Order #</Text>
                      <Text className="text-gray-800 font-medium">{item.orderDetails.orderNumber}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-500 text-xs">Items</Text>
                      <Text className="text-gray-800 font-medium">{item.orderDetails.items}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-500 text-xs">Total</Text>
                      <Text className="text-gray-800 font-medium">{item.orderDetails.total}</Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-500 text-xs">Payment</Text>
                      <View className="flex-row items-center">
                        <Text className="text-gray-800 font-medium mr-1">{item.orderDetails.paymentMethod}</Text>
                        {item.orderDetails.isPaid ? (
                          <View className="bg-green-100 px-1.5 py-0.5 rounded">
                            <Text className="text-green-700 text-xs">Paid</Text>
                          </View>
                        ) : (
                          <View className="bg-amber-100 px-1.5 py-0.5 rounded">
                            <Text className="text-amber-700 text-xs">COD</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                  
                  {/* Delivery info */}
                  <View className="bg-gray-50 p-3 rounded-lg">
                    <View className="flex-row justify-between mb-2">
                      <View className="flex-row items-center">
                        <Feather name="clock" size={14} color="#6B7280" className="mr-1" />
                        <Text className="text-gray-500 text-xs">Assigned at {item.delivery.assignedTime}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <MaterialIcons name="access-time" size={14} color="#6B7280" className="mr-1" />
                        <Text className="text-gray-500 text-xs">ETA: {item.delivery.estimatedArrival}</Text>
                      </View>
                    </View>
                    
                    <View className="flex-row items-center">
                      <View className="bg-indigo-100 p-1 rounded mr-2">
                        <MaterialIcons name="directions" size={14} color="#4F46E5" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-800 text-xs font-medium">{item.delivery.route.startPoint}</Text>
                        <Feather name="arrow-down" size={12} color="#9CA3AF" style={{ marginLeft: 3 }} />
                        <Text className="text-gray-800 text-xs font-medium">{item.delivery.route.endPoint}</Text>
                      </View>
                      <View className="bg-blue-100 px-2 py-1 rounded">
                        <Text className="text-blue-700 text-xs font-medium">{item.delivery.distance}</Text>
                      </View>
                    </View>
                  </View>
                </View>
                
                {/* Action Bar */}
                <View className="flex-row border-t border-gray-100">
                  <TouchableOpacity 
                    className="flex-1 p-3 flex-row justify-center items-center"
                    onPress={() => {
                      // Navigate action
                      if (Platform.OS === 'ios') {
                        try {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        } catch (e) {
                          // Fallback
                        }
                      }
                    }}
                  >
                    <Feather name="map" size={16} color="#4F46E5" />
                    <Text className="text-indigo-600 font-medium ml-2">Navigate</Text>
                  </TouchableOpacity>
                  
                  <View className="w-px h-full bg-gray-100" />
                  
                  <TouchableOpacity 
                    className="flex-1 p-3 flex-row justify-center items-center"
                    onPress={() => {
                      // Call customer action
                      if (Platform.OS === 'ios') {
                        try {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        } catch (e) {
                          // Fallback
                        }
                      }
                    }}
                  >
                    <Feather name="phone" size={16} color="#10B981" />
                    <Text className="text-green-600 font-medium ml-2">Call</Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
