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
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator
} from 'react-native';
import { Ionicons, Feather, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import HomeHeader from '../../components/HomeHeader';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

export default function InProgressOrdersScreen() {
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const modalScaleAnim = useRef(new Animated.Value(0.9)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  
  // State
  const [activeOrder, setActiveOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [deliveryProgress, setDeliveryProgress] = useState({});
  const [updatingStep, setUpdatingStep] = useState(null);
  const [expandedSections, setExpandedSections] = useState({ customer: true, timeline: true, items: true });
  const [editingStatus, setEditingStatus] = useState(false);
  const [statusOptions] = useState(['Preparing', 'Picked up', 'On the way', 'Arrived', 'Delivered', 'Delayed']);
  
  // Sample order data
  const inProgressOrders = [
    {
      id: 'IPO1001',
      orderNumber: 'ORD7896',
      status: 'On the way',
      pickupTime: '10:30 AM',
      estimatedDeliveryTime: '11:15 AM',
      customer: {
        name: 'Sarah Johnson',
        photo: 'https://randomuser.me/api/portraits/women/44.jpg',
        address: '456 Elm Road, Kirkos, Addis Ababa',
        phone: '+251 91 987 6543',
        note: 'Please call when you arrive.'
      },
      restaurant: {
        name: 'Supermarket Branch #2',
        address: 'Bole Road, Addis Ababa'
      },
      items: [
        { name: 'Fresh Vegetables Pack', quantity: 1, price: '$8.99' },
        { name: 'Organic Eggs (12)', quantity: 1, price: '$5.49' },
        { name: 'Whole Wheat Bread', quantity: 1, price: '$3.99' }
      ],
      payment: {
        method: 'Card',
        total: '$22.75',
        isPaid: true
      },
      route: {
        distance: '3.7 km',
        duration: '15 min'
      },
      steps: [
        { id: 'pickup', title: 'Pickup from Store', time: '10:30 AM', isCompleted: true },
        { id: 'enroute', title: 'On the way', time: '10:35 AM', isCompleted: true },
        { id: 'arrival', title: 'Arrival at Destination', time: '10:50 AM', isCompleted: false },
        { id: 'delivered', title: 'Delivered', time: '', isCompleted: false }
      ]
    },
    {
      id: 'IPO1002',
      orderNumber: 'ORD7901',
      status: 'On the way',
      pickupTime: '12:15 PM',
      estimatedDeliveryTime: '12:45 PM',
      customer: {
        name: 'Michael Davies',
        photo: 'https://randomuser.me/api/portraits/men/67.jpg',
        address: '789 Oak Ave, Arada, Addis Ababa',
        phone: '+251 91 345 6789',
        note: 'Leave at door if not answered.'
      },
      restaurant: {
        name: 'Supermarket Branch #1',
        address: 'Kazanchis, Addis Ababa'
      },
      items: [
        { name: 'Mineral Water (6 Pack)', quantity: 2, price: '$12.00' },
        { name: 'Fresh Chicken Breast', quantity: 1, price: '$15.30' },
        { name: 'Rice (5kg)', quantity: 1, price: '$20.50' },
        { name: 'Cooking Oil (2L)', quantity: 1, price: '$14.50' }
      ],
      payment: {
        method: 'Cash',
        total: '$62.30',
        isPaid: false
      },
      route: {
        distance: '5.2 km',
        duration: '20 min'
      },
      steps: [
        { id: 'pickup', title: 'Pickup from Store', time: '12:15 PM', isCompleted: true },
        { id: 'enroute', title: 'On the way', time: '12:23 PM', isCompleted: true },
        { id: 'arrival', title: 'Arrival at Destination', time: '12:40 PM', isCompleted: false },
        { id: 'delivered', title: 'Delivered', time: '', isCompleted: false }
      ]
    },
    {
      id: 'IPO1003',
      orderNumber: 'ORD7923',
      status: 'Preparing',
      pickupTime: '1:30 PM',
      estimatedDeliveryTime: '2:15 PM',
      customer: {
        name: 'Jennifer Lopez',
        photo: 'https://randomuser.me/api/portraits/women/22.jpg',
        address: '567 Maple Rd, Kirkos, Addis Ababa',
        phone: '+251 91 234 5678',
        note: 'Gate code: 1234'
      },
      restaurant: {
        name: 'Supermarket Branch #3',
        address: 'Meskel Square, Addis Ababa'
      },
      items: [
        { name: 'Frozen Pizza', quantity: 2, price: '$11.98' },
        { name: 'Ice Cream (1L)', quantity: 1, price: '$5.99' },
        { name: 'Potato Chips', quantity: 3, price: '$7.50' }
      ],
      payment: {
        method: 'Online',
        total: '$25.47',
        isPaid: true
      },
      route: {
        distance: '2.8 km',
        duration: '12 min'
      },
      steps: [
        { id: 'pickup', title: 'Pickup from Store', time: '', isCompleted: false },
        { id: 'enroute', title: 'On the way', time: '', isCompleted: false },
        { id: 'arrival', title: 'Arrival at Destination', time: '', isCompleted: false },
        { id: 'delivered', title: 'Delivered', time: '', isCompleted: false }
      ]
    }
  ];

  // Initialize delivery progress
  useEffect(() => {
    // Create initial progress state for each order
    const initialProgress = {};
    inProgressOrders.forEach(order => {
      // Calculate progress value based on completed steps
      const completedSteps = order.steps.filter(step => step.isCompleted).length;
      const totalSteps = order.steps.length;
      initialProgress[order.id] = (completedSteps / totalSteps) * 100;
    });
    
    setDeliveryProgress(initialProgress);
    
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
      })
    ]).start();
    
    // Simulate progress updates
    const interval = setInterval(() => {
      setDeliveryProgress(prev => {
        const updated = { ...prev };
        inProgressOrders.forEach(order => {
          // Randomly increment progress by 0-1%
          const increment = Math.random() * 1;
          if (updated[order.id] < 95) { // Cap at 95% until delivery is confirmed
            updated[order.id] = Math.min(95, updated[order.id] + increment);
          }
        });
        return updated;
      });
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Handle order selection
  const handleSelectOrder = (order) => {
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Fallback if haptics not available
      }
    }
    
    setActiveOrder(order);
    setShowOrderDetails(true);
    
    // Animate modal entrance
    Animated.parallel([
      Animated.spring(modalScaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };
  
  // Close modal
  const closeOrderDetails = () => {
    // Animate modal exit
    Animated.parallel([
      Animated.spring(modalScaleAnim, {
        toValue: 0.9,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowOrderDetails(false);
    });
  };

  // Handle call customer
  const handleCallCustomer = () => {
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Fallback if haptics not available
      }
    }
    
    alert(`Calling ${activeOrder.customer.name} at ${activeOrder.customer.phone}`);
  };

  // Handle navigation
  const handleNavigate = () => {
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Fallback if haptics not available
      }
    }
    
    alert('Opening navigation to customer address');
  };

  // Handle update step status
  const handleUpdateStepStatus = (stepId) => {
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Fallback if haptics not available
      }
    }
    
    // Set loading state for this step
    setUpdatingStep(stepId);
    
    // Simulate API call with a timeout
    setTimeout(() => {
      // Find the current order and step
      const updatedSteps = [...activeOrder.steps];
      
      // Find the index of the step we're updating
      const stepIndex = updatedSteps.findIndex(step => step.id === stepId);
      
      // Can only update a step if previous steps are completed
      if (stepIndex > 0) {
        const previousStepsCompleted = updatedSteps.slice(0, stepIndex).every(step => step.isCompleted);
        if (!previousStepsCompleted) {
          alert('Cannot complete this step until previous steps are completed');
          setUpdatingStep(null);
          return;
        }
      }
      
      // Find the step and update its status
      if (stepIndex !== -1) {
        // Toggle completion status
        updatedSteps[stepIndex].isCompleted = !updatedSteps[stepIndex].isCompleted;
        
        // If marking as completed, add timestamp
        if (updatedSteps[stepIndex].isCompleted) {
          const now = new Date();
          const hours = now.getHours() % 12 || 12;
          const minutes = now.getMinutes().toString().padStart(2, '0');
          const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
          updatedSteps[stepIndex].time = `${hours}:${minutes} ${ampm}`;
        }
        
        // Update the active order with new steps
        const updatedOrder = {
          ...activeOrder,
          steps: updatedSteps
        };
        
        // Update active order state
        setActiveOrder(updatedOrder);
        
        // Update progress based on completed steps
        const completedSteps = updatedSteps.filter(step => step.isCompleted).length;
        const totalSteps = updatedSteps.length;
        const newProgress = (completedSteps / totalSteps) * 100;
        
        setDeliveryProgress(prev => ({
          ...prev,
          [activeOrder.id]: newProgress
        }));
        
        // Update status based on latest step completed
        let newStatus = 'Preparing';
        if (completedSteps === totalSteps) {
          newStatus = 'Delivered';
        } else if (completedSteps === 3) {
          newStatus = 'Arrived';
        } else if (completedSteps === 2) {
          newStatus = 'On the way';
        } else if (completedSteps === 1) {
          newStatus = 'Picked up';
        }
        
        // If all steps completed, show success message
        if (completedSteps === totalSteps) {
          if (Platform.OS === 'ios') {
            try {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e) {
              // Fallback if haptics not available
            }
          }
          
          // Close modal after a delay
          setTimeout(() => {
            closeOrderDetails();
            
            // Navigate to completed orders
            router.push('/deliveryAgent/completed_order');
          }, 1500);
        }
      }
      
      // Clear loading state
      setUpdatingStep(null);
    }, 1000); // Simulate a network delay
  };

  // Toggle section expanded state
  const toggleSection = (section) => {
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Fallback if haptics not available
      }
    }
    
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Update order status
  const updateOrderStatus = (status) => {
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Fallback if haptics not available
      }
    }
    
    setActiveOrder(prev => ({
      ...prev,
      status
    }));
    
    setEditingStatus(false);
  };

  // Render order item
  const renderOrderItem = ({ item }) => {
    const progress = deliveryProgress[item.id] || 0;
    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY }],
        }}
        className="mb-3"
      >
        <TouchableOpacity
          onPress={() => handleSelectOrder(item)}
          className="bg-white rounded-xl shadow-sm border border-gray-100"
          style={({ pressed }) => [
            pressed ? { opacity: 0.95, transform: [{ scale: 0.995 }] } : {}
          ]}
        >
          <View className="p-4">
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-row items-center">
                <View className={`w-2.5 h-2.5 rounded-full mr-2 ${progress < 25 ? 'bg-blue-500' : progress < 50 ? 'bg-yellow-500' : progress < 75 ? 'bg-orange-500' : 'bg-green-500'}`} />
                <Text className="font-bold text-gray-900">{item.orderNumber}</Text>
              </View>
              <View className="bg-gray-100 px-2 py-0.5 rounded-full">
                <Text className="text-xs text-gray-600">{item.status}</Text>
              </View>
            </View>
            
            <View className="flex-row items-center mb-3">
              <Image 
                source={{ uri: item.customer.photo }} 
                className="w-10 h-10 rounded-full mr-3"
              />
              <View className="flex-1">
                <Text className="font-medium text-gray-900">{item.customer.name}</Text>
                <Text className="text-gray-500 text-xs">{item.customer.address}</Text>
              </View>
            </View>
            
            <View className="h-1.5 bg-gray-100 rounded-full mb-3">
              <View 
                className="h-full rounded-full" 
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: progress < 25 ? '#3B82F6' : progress < 50 ? '#F59E0B' : progress < 75 ? '#F97316' : '#10B981'
                }} 
              />
            </View>
            
            <View className="flex-row justify-between">
              <View className="flex-row items-center">
                <Feather name="clock" size={14} color="#6B7280" className="mr-1" />
                <Text className="text-gray-500 text-xs">ETA: {item.estimatedDeliveryTime}</Text>
              </View>
              
              <View className="flex-row items-center">
                <Feather name="map-pin" size={14} color="#6B7280" className="mr-1" />
                <Text className="text-gray-500 text-xs">{item.route.distance}</Text>
              </View>
              
              <View className="flex-row items-center">
                <FontAwesome5 name="money-bill-wave" size={14} color="#6B7280" className="mr-1" />
                <Text className="text-gray-500 text-xs">{item.payment.total}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      <StatusBar style="light" />
      
      <HomeHeader title="In-Progress Orders" showBackButton />
      
      {/* Order List */}
      <FlatList
        data={inProgressOrders}
        renderItem={renderOrderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      />
      
      {/* Order Details Modal */}
      <Modal
        transparent={true}
        visible={showOrderDetails}
        animationType="none"
        onRequestClose={closeOrderDetails}
      >
        <TouchableWithoutFeedback onPress={closeOrderDetails}>
          <View className="flex-1 bg-black/50 justify-center items-center">
            <TouchableWithoutFeedback>
              <Animated.View 
                style={{
                  opacity: modalOpacityAnim,
                  transform: [{ scale: modalScaleAnim }],
                  width: width * 0.9,
                  maxHeight: '80%',
                }}
                className="bg-white rounded-xl shadow-xl"
              >
                {activeOrder && (
                  <View>
                    {/* Modal Header */}
                    <LinearGradient
                      colors={['#4F46E5', '#7C3AED']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      className="rounded-t-xl p-4"
                    >
                      <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center">
                          <View className="bg-white/20 p-1.5 rounded-full mr-2">
                            <FontAwesome5 name="shipping-fast" size={14} color="white" />
                          </View>
                          <Text className="text-white font-bold">Order {activeOrder.orderNumber}</Text>
                        </View>
                        <TouchableOpacity onPress={closeOrderDetails}>
                          <Feather name="x" size={20} color="white" />
                        </TouchableOpacity>
                      </View>
                      
                      <View className="h-2 bg-white/20 rounded-full my-3 overflow-hidden">
                        <Animated.View 
                          className="h-full bg-white rounded-full" 
                          style={{ width: `${deliveryProgress[activeOrder.id]}%` }} 
                        />
                      </View>
                      
                      <View className="flex-row justify-between">
                        <View>
                          <Text className="text-white/70 text-xs">Status</Text>
                          <TouchableOpacity 
                            onPress={() => setEditingStatus(!editingStatus)}
                            className="flex-row items-center"
                          >
                            <Text className="text-white font-medium mr-1">{activeOrder.status}</Text>
                            <Feather name="edit-2" size={12} color="white" />
                          </TouchableOpacity>
                          
                          {/* Status Selection Dropdown */}
                          {editingStatus && (
                            <View className="absolute top-12 left-0 bg-white rounded-lg shadow-lg z-10 border border-gray-200">
                              {statusOptions.map(status => (
                                <TouchableOpacity
                                  key={status}
                                  className={`px-4 py-2 border-b border-gray-100 ${status === activeOrder.status ? 'bg-indigo-50' : ''}`}
                                  onPress={() => updateOrderStatus(status)}
                                >
                                  <Text className={`${status === activeOrder.status ? 'text-indigo-600 font-medium' : 'text-gray-700'}`}>{status}</Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}
                        </View>
                        
                        <View>
                          <Text className="text-white/70 text-xs">ETA</Text>
                          <Text className="text-white font-medium">{activeOrder.estimatedDeliveryTime}</Text>
                        </View>
                      </View>
                    </LinearGradient>
                    
                    {/* Modal Content */}
                    <View className="max-h-96 overflow-hidden">
                      <FlatList
                        scrollEnabled={true}
                        showsVerticalScrollIndicator={true}
                        contentContainerStyle={{ padding: 16 }}
                        ListHeaderComponent={
                          <>
                            {/* Customer Info */}
                            <View className="mb-4">
                              <TouchableOpacity
                                onPress={() => toggleSection('customer')}
                                className="flex-row justify-between items-center mb-2"
                              >
                                <Text className="text-gray-900 font-bold text-lg">Customer Information</Text>
                                <Feather name={expandedSections.customer ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
                              </TouchableOpacity>
                              
                              {expandedSections.customer && (
                                <>
                                  <View className="flex-row items-center mb-3">
                                    <Image 
                                      source={{ uri: activeOrder.customer.photo }} 
                                      className="w-14 h-14 rounded-full mr-3"
                                    />
                                    <View className="flex-1">
                                      <Text className="text-gray-900 font-bold text-lg">{activeOrder.customer.name}</Text>
                                      <Text className="text-gray-500 text-sm">{activeOrder.customer.address}</Text>
                                    </View>
                                  </View>
                                  
                                  {activeOrder.customer.note && (
                                    <View className="bg-yellow-50 border border-yellow-100 rounded-lg p-3 mb-3">
                                      <View className="flex-row items-start">
                                        <Feather name="info" size={16} color="#F59E0B" className="mr-2 mt-0.5" />
                                        <Text className="text-gray-700 flex-1">{activeOrder.customer.note}</Text>
                                      </View>
                                    </View>
                                  )}
                                
                                  <View className="flex-row">
                                    <TouchableOpacity 
                                      className="flex-1 flex-row justify-center items-center bg-gray-100 p-2 rounded-l-lg"
                                      onPress={handleCallCustomer}
                                    >
                                      <Feather name="phone" size={18} color="#10B981" className="mr-2" />
                                      <Text className="text-green-600 font-medium">Call</Text>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity 
                                      className="flex-1 flex-row justify-center items-center bg-gray-100 p-2 rounded-r-lg"
                                      onPress={handleNavigate}
                                    >
                                      <Feather name="map-pin" size={18} color="#4F46E5" className="mr-2" />
                                      <Text className="text-indigo-600 font-medium">Navigate</Text>
                                    </TouchableOpacity>
                                  </View>
                                </>
                              )}
                            </View>
                            
                            {/* Delivery Timeline */}
                            <View className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4">
                              <View className="p-4">
                                <TouchableOpacity
                                  onPress={() => toggleSection('timeline')}
                                  className="flex-row justify-between items-center mb-3"
                                >
                                  <Text className="text-gray-900 font-bold">Delivery Timeline</Text>
                                  <View className="flex-row items-center">
                                    <TouchableOpacity 
                                      className="bg-gray-100 px-2 py-1 rounded-lg mr-2"
                                      onPress={() => {
                                        alert('Tap each step to update its status. Steps must be completed in order.');
                                      }}
                                    >
                                      <Feather name="info" size={14} color="#4F46E5" />
                                    </TouchableOpacity>
                                    <Feather name={expandedSections.timeline ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
                                  </View>
                                </TouchableOpacity>
                                
                                {expandedSections.timeline && (
                                  <>
                                    {activeOrder.steps.map((step, index) => (
                                      <View key={step.id} className="flex-row mb-4 last:mb-0">
                                        {/* Timeline Connector */}
                                        <View className="items-center mr-4">
                                          <TouchableOpacity
                                            onPress={() => handleUpdateStepStatus(step.id)}
                                            disabled={updatingStep === step.id}
                                            className={`w-7 h-7 rounded-full items-center justify-center ${step.isCompleted ? 'bg-green-500' : index > 0 && !activeOrder.steps[index-1].isCompleted ? 'bg-gray-300' : 'bg-indigo-100'}`}
                                          >
                                            {updatingStep === step.id ? (
                                              <ActivityIndicator size="small" color="white" />
                                            ) : step.isCompleted ? (
                                              <Feather name="check" size={16} color="white" />
                                            ) : index > 0 && !activeOrder.steps[index-1].isCompleted ? (
                                              <Feather name="lock" size={14} color="#9CA3AF" />
                                            ) : (
                                              <Feather name="edit-2" size={14} color="#4F46E5" />
                                            )}
                                          </TouchableOpacity>
                                          
                                          {index < activeOrder.steps.length - 1 && (
                                            <View 
                                              className={`w-0.5 h-12 ${step.isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} 
                                            />
                                          )}
                                        </View>
                                        
                                        {/* Step Details */}
                                        <TouchableOpacity 
                                          className="flex-1 pt-1"
                                          onPress={() => handleUpdateStepStatus(step.id)}
                                          disabled={updatingStep !== null || (index > 0 && !activeOrder.steps[index-1].isCompleted)}
                                        >
                                          <View className="flex-row items-center">
                                            <Text className={`font-medium ${step.isCompleted ? 'text-gray-900' : index > 0 && !activeOrder.steps[index-1].isCompleted ? 'text-gray-400' : 'text-indigo-600'}`}>
                                              {step.title}
                                            </Text>
                                            {!step.isCompleted && index === 0 && (
                                              <View className="ml-2 px-1.5 py-0.5 bg-blue-100 rounded">
                                                <Text className="text-xs text-blue-700 font-medium">Next</Text>
                                              </View>
                                            )}
                                            {!step.isCompleted && index > 0 && activeOrder.steps[index-1].isCompleted && activeOrder.steps.slice(0, index).every(s => s.isCompleted) && (
                                              <View className="ml-2 px-1.5 py-0.5 bg-blue-100 rounded">
                                                <Text className="text-xs text-blue-700 font-medium">Next</Text>
                                              </View>
                                            )}
                                          </View>
                                          
                                          <View className="flex-row items-center">
                                            <Text className={`text-xs ${step.isCompleted ? 'text-gray-500' : index > 0 && !activeOrder.steps[index-1].isCompleted ? 'text-gray-400' : 'text-indigo-400'}`}>
                                              {step.isCompleted ? step.time : index > 0 && !activeOrder.steps[index-1].isCompleted ? 'Locked' : 'Tap to update'}
                                            </Text>
                                            
                                            {step.isCompleted && (
                                              <TouchableOpacity 
                                                className="ml-2"
                                                onPress={() => handleUpdateStepStatus(step.id)}
                                              >
                                                <Text className="text-xs text-indigo-500">Undo</Text>
                                              </TouchableOpacity>
                                            )}
                                          </View>
                                        </TouchableOpacity>
                                      </View>
                                    ))}
                                  </>
                                )}
                              </View>
                            </View>
                            
                            {/* Order Details */}
                            <View className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4">
                              <View className="p-4">
                                <TouchableOpacity
                                  onPress={() => toggleSection('items')}
                                  className="flex-row justify-between items-center mb-3"
                                >
                                  <Text className="text-gray-900 font-bold">Order Details</Text>
                                  <Feather name={expandedSections.items ? "chevron-up" : "chevron-down"} size={20} color="#6B7280" />
                                </TouchableOpacity>
                                
                                {expandedSections.items && (
                                  <>
                                    {/* Restaurant Info */}
                                    <View className="bg-gray-50 rounded-lg p-3 mb-3">
                                      <Text className="text-gray-900 font-medium">{activeOrder.restaurant.name}</Text>
                                      <Text className="text-gray-500 text-sm">{activeOrder.restaurant.address}</Text>
                                    </View>
                                    
                                    {/* Items */}
                                    <View className="mb-3">
                                      {activeOrder.items.map((item, index) => (
                                        <View 
                                          key={index} 
                                          className={`flex-row justify-between py-2 ${index < activeOrder.items.length - 1 ? 'border-b border-gray-100' : ''}`}
                                        >
                                          <View className="flex-row items-center">
                                            <View className="w-6 h-6 bg-gray-100 rounded-full items-center justify-center mr-2">
                                              <Text className="text-gray-500 text-xs font-bold">{item.quantity}</Text>
                                            </View>
                                            <Text className="text-gray-800">{item.name}</Text>
                                          </View>
                                          <Text className="text-gray-800 font-medium">{item.price}</Text>
                                        </View>
                                      ))}
                                    </View>
                                    
                                    {/* Payment Info */}
                                    <View className="bg-gray-50 rounded-lg p-3">
                                      <View className="flex-row justify-between mb-1">
                                        <Text className="text-gray-500">Payment Method</Text>
                                        <Text className="text-gray-800 font-medium">{activeOrder.payment.method}</Text>
                                      </View>
                                      <View className="flex-row justify-between mb-1">
                                        <Text className="text-gray-500">Payment Status</Text>
                                        <View className={`px-2 py-0.5 rounded ${activeOrder.payment.isPaid ? 'bg-green-100' : 'bg-yellow-100'}`}>
                                          <Text className={`text-xs font-medium ${activeOrder.payment.isPaid ? 'text-green-700' : 'text-yellow-700'}`}>
                                            {activeOrder.payment.isPaid ? 'Paid' : 'Cash on Delivery'}
                                          </Text>
                                        </View>
                                      </View>
                                      <View className="flex-row justify-between">
                                        <Text className="text-gray-900 font-bold">Total</Text>
                                        <Text className="text-gray-900 font-bold">{activeOrder.payment.total}</Text>
                                      </View>
                                    </View>
                                  </>
                                )}
                              </View>
                            </View>
                          </>
                        }
                        data={[]}
                        renderItem={() => null}
                      />
                    </View>
                    
                    {/* Modal Footer */}
                    <View className="p-4 border-t border-gray-100">
                      <TouchableOpacity
                        className="bg-green-600 py-3 rounded-xl items-center"
                        onPress={() => {
                          // Find the delivered step and update its status
                          const deliveredStepId = activeOrder.steps.find(step => step.id === 'delivered')?.id;
                          if (deliveredStepId) {
                            handleUpdateStepStatus(deliveredStepId);
                          }
                        }}
                      >
                        <Text className="text-white font-bold text-lg">Confirm Delivery</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}
