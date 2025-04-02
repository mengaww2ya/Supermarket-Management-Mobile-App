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
  StatusBar
} from "react-native";
import { deliveryOrders } from "../../global/data";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons, MaterialCommunityIcons, Feather, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HomeHeader from "app/components/HomeHeader";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const { width, height } = Dimensions.get('window');

export default function DeliveryOrders() {
  const { agentId, agentName } = useLocalSearchParams();
  const router = useRouter();
  
  // States
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const orderScaleAnims = useRef({}).current;
  const refreshAnim = useRef(new Animated.Value(0)).current;
  const modalScale = useRef(new Animated.Value(0)).current;
  const modalFade = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(-50)).current;
  
  // Setup initial animations and fetch data
  useEffect(() => {
    // Simulate fetching data
    setLoading(true);
    
    setTimeout(() => {
      setOrders(deliveryOrders);
      filterOrders('pending');
      setLoading(false);
      
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
        }),
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        })
      ]).start();
    }, 1000);
  }, []);
  
  // Create animations for each order item
  useEffect(() => {
    // Initialize animations for each order
    filteredOrders.forEach((order, index) => {
      if (!orderScaleAnims[order.id]) {
        orderScaleAnims[order.id] = new Animated.Value(1);
      }
    });
  }, [filteredOrders]);
  
  // Filter orders based on status
  const filterOrders = (status) => {
    setSelectedFilter(status);
    const filtered = status === 'all' 
      ? orders 
      : orders.filter(order => order.status === status);
    
    setFilteredOrders(filtered);
  };
  
  // Handle order assignment
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
    
    // Animate the order card
    Animated.sequence([
      Animated.timing(orderScaleAnims[orderId], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(orderScaleAnims[orderId], {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(orderScaleAnims[orderId], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
    
    // Find the order
    const orderToAssign = orders.find(order => order.id === orderId);
    setSelectedOrder(orderToAssign);
    
    // Show modal with animation
    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(modalFade, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };
  
  // Confirm order assignment
  const confirmAssignment = () => {
    if (!selectedOrder) return;
    
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
    
    // Update orders
    const updatedOrders = orders.map(order =>
      order.id === selectedOrder.id ? { ...order, status: 'assigned' } : order
    );
    
            setOrders(updatedOrders);
    closeModal();
    
    // Show success animation and re-filter
    setTimeout(() => {
      filterOrders(selectedFilter);
    }, 300);
  };
  
  // Close assignment modal
  const closeModal = () => {
    Animated.parallel([
      Animated.timing(modalScale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalFade, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setSelectedOrder(null);
    });
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
    
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
      
      // Provide haptic feedback when refresh completes
      if (Platform.OS === 'ios') {
        try {
          const Haptics = require('expo-haptics');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
          Vibration.vibrate(20);
        }
      } else {
        Vibration.vibrate(20);
      }
    }, 1500);
  };
  
  // Render filter tab
  const renderFilterTab = (status, label, icon) => (
    <TouchableOpacity
      onPress={() => filterOrders(status)}
      activeOpacity={0.7}
      className={`flex-row items-center py-2 px-3 rounded-full mr-2 ${
        selectedFilter === status 
          ? 'bg-blue-600' 
          : 'bg-white border border-gray-200'
      }`}
    >
      <MaterialCommunityIcons 
        name={icon} 
        size={16} 
        color={selectedFilter === status ? '#fff' : '#64748b'} 
      />
      <Text 
        className={`ml-1 font-medium ${
          selectedFilter === status ? 'text-white' : 'text-gray-700'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
  
  // Render order item
  const renderOrderItem = ({ item, index }) => {
    // Create animation if it doesn't exist
    if (!orderScaleAnims[item.id]) {
      orderScaleAnims[item.id] = new Animated.Value(1);
    }
    
    // Get status details
    const statusConfig = {
      pending: {
        color: 'blue',
        icon: 'clock-outline',
        label: 'Pending'
      },
      assigned: {
        color: 'green',
        icon: 'check-circle-outline',
        label: 'Assigned'
      },
      completed: {
        color: 'gray',
        icon: 'package-variant-closed',
        label: 'Completed'
      },
      cancelled: {
        color: 'red',
        icon: 'close-circle-outline',
        label: 'Cancelled'
      }
    };
    
    const status = statusConfig[item.status] || statusConfig.pending;
    
    const isAssignable = item.status === 'pending';
    
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            { translateY: Animated.multiply(translateY, new Animated.Value(index * 0.5 + 1)) },
            { scale: orderScaleAnims[item.id] }
          ],
        }}
        className="mb-4"
      >
        <TouchableOpacity
          onPress={() => isAssignable && assignOrder(item.id)}
          activeOpacity={0.8}
          className={`rounded-xl shadow-sm overflow-hidden ${!isAssignable ? 'opacity-80' : ''}`}
        >
          <LinearGradient
            colors={['#f8fafc', '#f1f5f9']}
            className="p-4 border border-gray-200"
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-row items-center">
                <View className={`w-10 h-10 rounded-full bg-${status.color}-100 items-center justify-center`}>
                  <MaterialCommunityIcons name={status.icon} size={20} color={status.color === 'blue' ? '#2563eb' : status.color === 'green' ? '#16a34a' : status.color === 'red' ? '#dc2626' : '#6b7280'} />
                </View>
                <View className="ml-3">
                  <Text className="font-bold text-gray-800 text-lg">Order #{item.id}</Text>
                  <View className="flex-row items-center">
                    <View className={`px-2 py-0.5 rounded-full bg-${status.color}-100 flex-row items-center`}>
                      <Text className={`text-xs font-medium text-${status.color}-700`}>
                        {status.label}
                      </Text>
                    </View>
                    <Text className="text-xs text-gray-500 ml-2">{item.date || 'Today'}</Text>
                  </View>
                </View>
              </View>
              
              {isAssignable && (
                <View className="bg-blue-50 p-2 rounded-full">
                  <MaterialIcons name="assignment" size={20} color="#2563eb" />
                </View>
              )}
            </View>
            
            <View className="mt-3 pt-3 border-t border-gray-100">
              <View className="flex-row items-center mb-2">
                <MaterialIcons name="person" size={16} color="#64748b" className="mr-2" />
                <Text className="text-gray-700 font-medium ml-1">{item.customer}</Text>
              </View>
              
              <View className="flex-row items-center mb-2">
                <Ionicons name="location-outline" size={16} color="#64748b" className="mr-2" />
                <Text className="text-gray-600 ml-1">{item.address}</Text>
              </View>
              
              <View className="flex-row justify-between items-center mt-1">
                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="package-variant" size={16} color="#64748b" />
                  <Text className="text-gray-600 ml-1">{item.items || '3'} items</Text>
                </View>
                
                <View className="flex-row items-center">
                  <FontAwesome5 name="dollar-sign" size={14} color="#64748b" />
                  <Text className="text-gray-700 font-medium ml-1">{item.total || '120.00'}</Text>
                </View>
              </View>
            </View>
            
            {isAssignable && (
              <View className="mt-3 flex-row">
                <TouchableOpacity
                  onPress={() => assignOrder(item.id)}
                  className="flex-1 bg-blue-500 rounded-lg py-2 flex-row items-center justify-center"
                >
                  <MaterialIcons name="person-add-alt" size={18} color="white" />
                  <Text className="text-white font-medium ml-1">Assign to Agent</Text>
                </TouchableOpacity>
              </View>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  // Render the assignment modal
  const renderAssignmentModal = () => {
    if (!selectedOrder) return null;
    
    return (
      <View
        className="absolute inset-0 bg-black/50 justify-center items-center z-10"
        style={{ elevation: 5 }}
      >
        <Animated.View
          style={{
            opacity: modalFade,
            transform: [{ scale: modalScale }],
            width: width * 0.85,
            maxWidth: 340,
          }}
          className="bg-white rounded-xl overflow-hidden"
        >
          <LinearGradient
            colors={['#3b82f6', '#2563eb']}
            className="px-5 py-4"
          >
            <Text className="text-xl font-bold text-white">Assign Order</Text>
            <Text className="text-white/80">Confirm order assignment</Text>
          </LinearGradient>
          
          <View className="p-5">
            <View className="bg-blue-50 rounded-lg p-4 mb-4">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="font-bold text-gray-800 text-lg">Order #{selectedOrder.id}</Text>
                <View className="px-2 py-0.5 rounded-full bg-blue-100">
                  <Text className="text-xs font-medium text-blue-700">Pending</Text>
                </View>
              </View>
              
              <View className="flex-row items-center mb-2">
                <MaterialIcons name="person" size={16} color="#64748b" />
                <Text className="text-gray-700 ml-2">{selectedOrder.customer}</Text>
              </View>
              
              <View className="flex-row items-center">
                <Ionicons name="location-outline" size={16} color="#64748b" />
                <Text className="text-gray-600 ml-2">{selectedOrder.address}</Text>
              </View>
            </View>
            
            <View className="bg-indigo-50 rounded-lg p-4 mb-5">
              <Text className="font-medium text-gray-700 mb-2">Assign to Agent:</Text>
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center">
                  <MaterialIcons name="person" size={20} color="#4f46e5" />
                </View>
                <Text className="ml-3 font-medium text-gray-800">{agentName || 'Selected Agent'}</Text>
              </View>
            </View>
            
            <View className="flex-row">
              <TouchableOpacity
                onPress={closeModal}
                className="flex-1 py-3 border border-gray-300 rounded-lg mr-2 items-center justify-center"
              >
                <Text className="font-medium text-gray-700">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={confirmAssignment}
                className="flex-1 py-3 bg-blue-600 rounded-lg ml-2 items-center justify-center"
              >
                <Text className="font-medium text-white">Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    );
  };
  
  // Render loading state
  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <HomeHeader title="Delivery Orders" showBackButton={true} />
        
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="mt-4 text-gray-500 font-medium">Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['right', 'left', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {selectedOrder && renderAssignmentModal()}
      
      <Animated.View
        style={{
          transform: [{ translateY: headerTranslateY }],
        }}
      >
        <HomeHeader title="Delivery Orders" showBackButton={true} />
      </Animated.View>
      
      <Animated.View 
        className="flex-1 px-4"
        style={{
          opacity: fadeAnim,
          transform: [{ translateY }, { scale: scaleAnim }],
        }}
      >
        {/* Header with Agent Info */}
        {agentName && (
          <View className="bg-white rounded-xl p-4 shadow-sm mb-4 border border-gray-100">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
                <MaterialCommunityIcons name="account-tie" size={20} color="#2563eb" />
              </View>
              <View className="ml-3">
                <Text className="text-sm text-gray-500">Assigning to Agent</Text>
                <Text className="font-bold text-gray-800">{agentName || 'Selected Agent'}</Text>
              </View>
            </View>
          </View>
        )}
        
        {/* Filters and Refresh */}
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-xl font-bold text-gray-800">Available Orders</Text>
          
          <TouchableOpacity 
            onPress={handleRefresh}
            disabled={refreshing}
            className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center"
          >
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: refreshAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              }}
            >
              {refreshing ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <Feather name="refresh-cw" size={18} color="#64748b" />
              )}
            </Animated.View>
          </TouchableOpacity>
        </View>
        
        {/* Filter tabs */}
        <View className="flex-row mb-4 overflow-x-auto">
          {renderFilterTab('pending', 'Pending', 'clock-outline')}
          {renderFilterTab('assigned', 'Assigned', 'check-circle-outline')}
          {renderFilterTab('completed', 'Completed', 'package-variant-closed')}
          {renderFilterTab('all', 'All Orders', 'view-list')}
        </View>
        
        {/* Order list */}
        {filteredOrders.length === 0 ? (
          <View className="flex-1 justify-center items-center">
            <MaterialCommunityIcons name="package-variant" size={60} color="#cbd5e1" />
            <Text className="text-gray-400 font-medium mt-4 text-center">
              No {selectedFilter !== 'all' ? selectedFilter : ''} orders found
        </Text>
            <TouchableOpacity
              onPress={handleRefresh}
              className="mt-3 flex-row items-center bg-blue-50 px-4 py-2 rounded-full"
            >
              <Feather name="refresh-cw" size={16} color="#3b82f6" />
              <Text className="text-blue-600 font-medium ml-1">Refresh</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.id}
            renderItem={renderOrderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />
        )}
      </Animated.View>
    </SafeAreaView>
  );
}
