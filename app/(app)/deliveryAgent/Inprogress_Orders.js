import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ActivityIndicator,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons, Feather, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import HomeHeader from '../../components/HomeHeader';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { db } from "../../../firebase/firebaseConfig";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { useAuth } from "../../context/authContext";

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
  const [inProgressOrders, setInProgressOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Get authentication context
  const { user } = useAuth();

  // Fetch in-progress orders from user's tasks collection
  const fetchInProgressOrders = useCallback(async () => {
    if (!user || !user.uid) {
      setError("You must be logged in to view in-progress orders");
      setLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      setLoading(true);
      console.log("Fetching in-progress orders for:", user.uid);
      
      // Get tasks from user's collection that are in In Progress status
      const tasksRef = collection(db, `users/${user.uid}/tasks`);
      
      // Fetch all tasks then filter by status
      const basicQuery = query(tasksRef);
      const querySnapshot = await getDocs(basicQuery);
      
      if (querySnapshot.empty) {
        console.log("No tasks found at all");
        setInProgressOrders([]);
        setLoading(false);
        setIsRefreshing(false);
        return;
      }
      
      // Filter and process the tasks into a usable format
      const progressOrders = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          
          // Only include tasks with In Progress status
          if (!data.status || data.status !== 'In Progress') {
            return null;
          }
          
          // Calculate delivery progress steps
          const steps = [
            { 
              id: 'pickup', 
              title: 'Pickup from Store', 
              time: data.startedAt ? new Date(data.startedAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : '', 
              isCompleted: true 
            },
            { 
              id: 'enroute', 
              title: 'On the way', 
              time: data.onTheWayAt ? new Date(data.onTheWayAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : '', 
              isCompleted: data.onTheWayAt ? true : false 
            },
            { 
              id: 'arrival', 
              title: 'Arrival at Destination', 
              time: data.arrivedAt ? new Date(data.arrivedAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : '', 
              isCompleted: data.arrivedAt ? true : false 
            },
            { 
              id: 'delivered', 
              title: 'Delivered', 
              time: data.deliveredAt ? new Date(data.deliveredAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : '', 
              isCompleted: data.deliveredAt ? true : false 
            }
          ];
          
          // Calculate current status based on steps
          let currentStatus = 'Preparing';
          if (data.deliveredAt) {
            currentStatus = 'Delivered';
          } else if (data.arrivedAt) {
            currentStatus = 'Arrived';
          } else if (data.onTheWayAt) {
            currentStatus = 'On the way';
          } else if (data.startedAt) {
            currentStatus = 'Picked up';
          }
          
          if (data.delayed) {
            currentStatus = 'Delayed';
          }
          
          // Calculate pickup and estimated delivery times
          const pickupTime = data.startedAt ? 
            new Date(data.startedAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : 'Pending';
          
          // Estimate delivery time (30 minutes after pickup if not specified)
          let estimatedTime;
          if (data.estimatedDelivery) {
            estimatedTime = new Date(data.estimatedDelivery.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
          } else if (data.startedAt) {
            const estDate = new Date(data.startedAt.seconds * 1000);
            estDate.setMinutes(estDate.getMinutes() + 30);
            estimatedTime = estDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
          } else {
            estimatedTime = 'Pending';
          }
          
          return {
            id: doc.id,
            orderNumber: data.orderRef || data.orderId || doc.id.substring(0, 8),
            status: currentStatus,
            pickupTime: pickupTime,
            estimatedDeliveryTime: estimatedTime,
            customer: {
              name: data.customerName || 'Customer',
              photo: data.customerPhoto || 'https://randomuser.me/api/portraits/lego/1.jpg',
              address: data.deliveryAddress || 'No address provided',
              phone: data.customerPhone || 'No phone provided',
              note: data.customerNote || 'No special instructions'
            },
            restaurant: {
              name: data.pickup || 'Supermarket',
              address: data.pickupAddress || 'Store location'
            },
            items: data.items?.map(item => ({
              name: item.name || 'Product',
              quantity: item.quantity || 1,
              price: `${item.price || 0} Birr`
            })) || [],
            payment: {
              method: data.paymentMethod || 'Unknown',
              total: `${data.totalAmount || 0} Birr`,
              isPaid: data.isPaid || false
            },
            route: {
              distance: data.distance || 'Unknown',
              duration: data.estimatedDuration || 'Calculating...'
            },
            steps: steps,
            rawData: data // Keep original data for reference
          };
        })
        .filter(order => order !== null)
        .sort((a, b) => {
          // Sort by startedAt timestamp if available
          const aStarted = a.rawData.startedAt?.seconds || 0;
          const bStarted = b.rawData.startedAt?.seconds || 0;
          return bStarted - aStarted; // Most recent first
        });
      
      console.log(`Found ${progressOrders.length} in-progress orders`);
      setInProgressOrders(progressOrders);
      
      // Initialize delivery progress
      const initialProgress = {};
      progressOrders.forEach(order => {
        // Calculate progress value based on completed steps
        const completedSteps = order.steps.filter(step => step.isCompleted).length;
        const totalSteps = order.steps.length;
        initialProgress[order.id] = (completedSteps / totalSteps) * 100;
      });
      setDeliveryProgress(initialProgress);
      
    } catch (error) {
      console.error("Error fetching in-progress orders:", error);
      setError("Failed to load your in-progress orders. Please try again.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchInProgressOrders();
  }, [fetchInProgressOrders]);

  // Handle refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchInProgressOrders();
  };

  // Update delivery step
  const updateDeliveryStep = async (orderId, stepId) => {
    if (!user || !user.uid) {
      Alert.alert("Error", "You must be logged in to update delivery status");
      return;
    }
    
    // Mark step as updating
    setUpdatingStep(stepId);
    
    try {
      const order = inProgressOrders.find(o => o.id === orderId);
      if (!order) {
        throw new Error("Order not found");
      }
      
      // Determine which field to update based on step ID
      const updateData = { lastUpdated: serverTimestamp() };
      switch (stepId) {
        case 'enroute':
          updateData.onTheWayAt = serverTimestamp();
          updateData.status = 'On the way';
          break;
        case 'arrival':
          updateData.arrivedAt = serverTimestamp();
          updateData.status = 'Arrived';
          break;
        case 'delivered':
          updateData.deliveredAt = serverTimestamp();
          updateData.status = 'Delivered';
          updateData.completedAt = serverTimestamp();
          break;
        default:
          break;
      }
      
      // Update in Firestore
      const taskRef = doc(db, `users/${user.uid}/tasks`, orderId);
      await updateDoc(taskRef, updateData);
      
      // Update local state - update steps
      const updatedOrders = inProgressOrders.map(order => {
        if (order.id === orderId) {
          // Find current step and all previous steps
          const updatedSteps = order.steps.map(step => {
            // If this is the step we just completed or an earlier step, mark as completed
            if (step.id === stepId || step.isCompleted) {
              const time = step.id === stepId ? new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : step.time;
              return { ...step, isCompleted: true, time };
            }
            return step;
          });
          
          // Update status based on step
          let newStatus = order.status;
          if (stepId === 'enroute') newStatus = 'On the way';
          if (stepId === 'arrival') newStatus = 'Arrived';
          if (stepId === 'delivered') newStatus = 'Delivered';
          
          return { ...order, steps: updatedSteps, status: newStatus };
        }
        return order;
      });
      
      setInProgressOrders(updatedOrders);
      
      // Update progress
      setDeliveryProgress(prev => {
        const updated = { ...prev };
        const order = updatedOrders.find(o => o.id === orderId);
        if (order) {
          const completedSteps = order.steps.filter(step => step.isCompleted).length;
          const totalSteps = order.steps.length;
          updated[orderId] = (completedSteps / totalSteps) * 100;
        }
        return updated;
      });
      
      // If delivery is complete, show confirmation and navigate back after a delay
      if (stepId === 'delivered') {
        if (Platform.OS === 'ios') {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (e) {
            // Fallback
          }
        }
        
        Alert.alert(
          "Delivery Completed",
          "The order has been marked as delivered. Great job!",
          [{ text: "OK" }]
        );
        
        // Close modal and navigate after short delay
        setTimeout(() => {
          closeOrderDetails();
          
          // Navigate to completed orders after another delay
          setTimeout(() => {
            router.push("/deliveryAgent/completed_order");
          }, 500);
        }, 1500);
      }
      
    } catch (error) {
      console.error("Error updating delivery step:", error);
      Alert.alert("Error", "Failed to update delivery status. Please try again.");
    } finally {
      setUpdatingStep(null);
    }
  };
  
  // Mark order as delayed
  const markOrderAsDelayed = async (orderId) => {
    if (!user || !user.uid) {
      Alert.alert("Error", "You must be logged in to update delivery status");
      return;
    }
    
    try {
      // Update in Firestore
      const taskRef = doc(db, `users/${user.uid}/tasks`, orderId);
      await updateDoc(taskRef, {
        delayed: true,
        delayedAt: serverTimestamp(),
        status: 'Delayed',
        lastUpdated: serverTimestamp()
      });
      
      // Update local state
      const updatedOrders = inProgressOrders.map(order => {
        if (order.id === orderId) {
          return { ...order, status: 'Delayed' };
        }
        return order;
      });
      
      setInProgressOrders(updatedOrders);
      
      if (Platform.OS === 'ios') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch (e) {
          // Fallback
        }
      }
      
      Alert.alert(
        "Order Delayed",
        "The order has been marked as delayed. Please update the customer.",
        [{ text: "OK" }]
      );
      
    } catch (error) {
      console.error("Error marking order as delayed:", error);
      Alert.alert("Error", "Failed to mark order as delayed. Please try again.");
    }
  };
  
  // Start animations
  useEffect(() => {
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
      setActiveOrder(null);
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

  // Toggle section expansion
  const toggleSection = (section) => {
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

  // Render order card
  const renderOrderCard = ({ item }) => {
    // Calculate progress
    const progress = deliveryProgress[item.id] || 0;
    
    return (
      <Animated.View 
        style={{
          opacity: fadeAnim,
          transform: [{ translateY }],
          marginBottom: 16
        }}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleSelectOrder(item)}
          style={{
            backgroundColor: 'white',
            borderRadius: 16,
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 2,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: '#f1f5f9'
          }}
        >
          {/* Status Bar */}
          <View style={{
            flexDirection: 'row',
            padding: 12,
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottomWidth: 1,
            borderBottomColor: '#f1f5f9'
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: item.status === 'Delayed' ? '#ef4444' : '#10b981',
                marginRight: 6
              }} />
              <Text style={{ 
                fontWeight: '600', 
                color: item.status === 'Delayed' ? '#ef4444' : '#10b981', 
                fontSize: 14 
              }}>
                {item.status}
              </Text>
            </View>
            
            <Text style={{ color: '#64748b', fontSize: 13 }}>
              Order #{item.orderNumber}
            </Text>
          </View>
          
          {/* Content */}
          <View style={{ padding: 16 }}>
            {/* Customer Info */}
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              <Image 
                source={{ uri: item.customer.photo }}
                style={{ width: 50, height: 50, borderRadius: 25 }}
              />
              
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#1e293b', marginBottom: 2 }}>
                  {item.customer.name}
                </Text>
                
                <Text style={{ color: '#64748b', fontSize: 14 }} numberOfLines={2}>
                  {item.customer.address}
                </Text>
              </View>
            </View>
            
            {/* Progress Tracking */}
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ color: '#475569', fontSize: 13 }}>Delivery Progress</Text>
                <Text style={{ color: '#475569', fontSize: 13, fontWeight: '600' }}>
                  {Math.round(progress)}%
                </Text>
              </View>
              
              <View style={{ height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
                <Animated.View 
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    backgroundColor: item.status === 'Delayed' ? '#f97316' : '#3b82f6',
                    borderRadius: 2
                  }}
                />
              </View>
            </View>
            
            {/* Timing */}
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between',
              padding: 12,
              backgroundColor: '#f8fafc',
              borderRadius: 12
            }}>
              <View>
                <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 2 }}>Pickup</Text>
                <Text style={{ fontWeight: '600', color: '#334155', fontSize: 14 }}>{item.pickupTime}</Text>
              </View>
              
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                paddingHorizontal: 12 
              }}>
                <View style={{ 
                  width: 6, 
                  height: 6, 
                  borderRadius: 3, 
                  backgroundColor: '#94a3b8' 
                }} />
                <View style={{ 
                  height: 1, 
                  backgroundColor: '#94a3b8', 
                  flex: 1, 
                  marginHorizontal: 4 
                }} />
                <FontAwesome5 name="location-arrow" size={10} color="#94a3b8" />
              </View>
              
              <View>
                <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 2 }}>Estimated Arrival</Text>
                <Text style={{ fontWeight: '600', color: '#334155', fontSize: 14 }}>{item.estimatedDeliveryTime}</Text>
              </View>
            </View>
          </View>
          
          {/* Action Bar */}
          <View style={{ 
            flexDirection: 'row', 
            borderTopWidth: 1, 
            borderTopColor: '#f1f5f9' 
          }}>
            <TouchableOpacity
              style={{ 
                flex: 1, 
                paddingVertical: 12, 
                alignItems: 'center', 
                flexDirection: 'row',
                justifyContent: 'center'
              }}
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
              <MaterialIcons name="directions" size={18} color="#3b82f6" />
              <Text style={{ color: '#3b82f6', fontWeight: '600', marginLeft: 6 }}>Navigate</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{ 
                flex: 1, 
                paddingVertical: 12, 
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                borderLeftWidth: 1,
                borderLeftColor: '#f1f5f9'
              }}
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
              <Feather name="phone" size={18} color="#10b981" />
              <Text style={{ color: '#10b981', fontWeight: '600', marginLeft: 6 }}>Call</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  // Render empty state
  const renderEmptyState = () => (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      paddingTop: 60,
      paddingHorizontal: 20
    }}>
      <View style={{ 
        width: 120, 
        height: 120, 
        borderRadius: 60,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
      }}>
        <Feather name="truck" size={60} color="#94a3b8" />
      </View>
      
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#334155', marginBottom: 8 }}>
        No Active Deliveries
      </Text>
      <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 20 }}>
        You don't have any orders in progress at the moment.
      </Text>
      
      {error && (
        <TouchableOpacity
          style={{
            backgroundColor: '#3b82f6',
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 8
          }}
          onPress={fetchInProgressOrders}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Refresh</Text>
        </TouchableOpacity>
      )}
    </View>
  );
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar style="dark" />
      
      <HomeHeader title="In-Progress Orders" showBackButton />
      
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={{ marginTop: 12, color: '#64748b' }}>Loading orders...</Text>
        </View>
      ) : (
        <FlatList
          data={inProgressOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderCard}
          contentContainerStyle={{ 
            padding: 16,
            flexGrow: 1,
            paddingBottom: inProgressOrders.length ? 100 : 0
          }}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#3b82f6"
              colors={['#3b82f6']}
            />
          }
        />
      )}
      
      {/* Order Details Modal */}
      <Modal
        visible={showOrderDetails}
        transparent
        animationType="none"
        onRequestClose={closeOrderDetails}
      >
        <TouchableWithoutFeedback onPress={closeOrderDetails}>
          <View style={{ 
            flex: 1, 
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <TouchableWithoutFeedback>
              <Animated.View style={{
                width: width * 0.9,
                maxHeight: '85%',
                backgroundColor: 'white',
                borderRadius: 20,
                overflow: 'hidden',
                transform: [{ scale: modalScaleAnim }],
                opacity: modalOpacityAnim
              }}>
                {activeOrder && (
                  <View>
                    {/* Modal Header */}
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: '#f1f5f9'
                    }}>
                      <View>
                        <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#0f172a' }}>
                          Order #{activeOrder.orderNumber}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                          <View style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: activeOrder.status === 'Delayed' ? '#ef4444' : '#10b981',
                            marginRight: 6
                          }} />
                          <Text style={{ 
                            color: activeOrder.status === 'Delayed' ? '#ef4444' : '#10b981', 
                            fontWeight: '500',
                            fontSize: 14
                          }}>
                            {activeOrder.status}
                          </Text>
                        </View>
                      </View>
                      
                      <TouchableOpacity onPress={closeOrderDetails}>
                        <Feather name="x" size={24} color="#64748b" />
                      </TouchableOpacity>
                    </View>
                    
                    {/* Modal Content - Scrollable */}
                    <FlatList
                      data={[{ key: 'content' }]}
                      renderItem={() => (
                        <View style={{ padding: 16 }}>
                          {/* Customer Section */}
                          <TouchableOpacity
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 8
                            }}
                            onPress={() => toggleSection('customer')}
                          >
                            <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#0f172a' }}>
                              Customer Information
                            </Text>
                            <Ionicons 
                              name={expandedSections.customer ? "chevron-up" : "chevron-down"} 
                              size={20} 
                              color="#64748b" 
                            />
                          </TouchableOpacity>
                          
                          {expandedSections.customer && (
                            <View style={{
                              backgroundColor: '#f8fafc',
                              borderRadius: 12,
                              padding: 16,
                              marginBottom: 16
                            }}>
                              <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                                <Image
                                  source={{ uri: activeOrder.customer.photo }}
                                  style={{ width: 50, height: 50, borderRadius: 25 }}
                                />
                                
                                <View style={{ marginLeft: 12 }}>
                                  <Text style={{ fontWeight: 'bold', color: '#1e293b', fontSize: 16 }}>
                                    {activeOrder.customer.name}
                                  </Text>
                                  
                                  <TouchableOpacity 
                                    style={{ 
                                      flexDirection: 'row', 
                                      alignItems: 'center',
                                      marginTop: 6
                                    }}
                                  >
                                    <Feather name="phone" size={14} color="#3b82f6" />
                                    <Text style={{ color: '#3b82f6', marginLeft: 4, fontSize: 14 }}>
                                      {activeOrder.customer.phone}
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                              
                              <View style={{ marginBottom: 12 }}>
                                <Text style={{ color: '#64748b', fontSize: 13, marginBottom: 4 }}>
                                  Delivery Address
                                </Text>
                                <Text style={{ color: '#0f172a', fontSize: 15 }}>
                                  {activeOrder.customer.address}
                                </Text>
                              </View>
                              
                              <View>
                                <Text style={{ color: '#64748b', fontSize: 13, marginBottom: 4 }}>
                                  Customer Note
                                </Text>
                                <View style={{
                                  backgroundColor: 'white',
                                  borderRadius: 8,
                                  padding: 12,
                                  borderWidth: 1,
                                  borderColor: '#e2e8f0'
                                }}>
                                  <Text style={{ color: '#0f172a', fontSize: 14, fontStyle: 'italic' }}>
                                    "{activeOrder.customer.note}"
                                  </Text>
                                </View>
                              </View>
                            </View>
                          )}
                          
                          {/* Timeline Section */}
                          <TouchableOpacity
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 8
                            }}
                            onPress={() => toggleSection('timeline')}
                          >
                            <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#0f172a' }}>
                              Delivery Timeline
                            </Text>
                            <Ionicons 
                              name={expandedSections.timeline ? "chevron-up" : "chevron-down"} 
                              size={20} 
                              color="#64748b" 
                            />
                          </TouchableOpacity>
                          
                          {expandedSections.timeline && (
                            <View style={{
                              backgroundColor: '#f8fafc',
                              borderRadius: 12,
                              padding: 16,
                              marginBottom: 16
                            }}>
                              {activeOrder.steps.map((step, index) => (
                                <View key={step.id} style={{
                                  flexDirection: 'row',
                                  marginBottom: index < activeOrder.steps.length - 1 ? 16 : 0
                                }}>
                                  {/* Status indicator */}
                                  <View style={{
                                    width: 20,
                                    alignItems: 'center'
                                  }}>
                                    <View style={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: 10,
                                      backgroundColor: step.isCompleted ? '#10b981' : '#e2e8f0',
                                      justifyContent: 'center',
                                      alignItems: 'center'
                                    }}>
                                      {step.isCompleted ? (
                                        <Feather name="check" size={12} color="white" />
                                      ) : (
                                        <Text style={{ color: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}>
                                          {index + 1}
                                        </Text>
                                      )}
                                    </View>
                                    
                                    {index < activeOrder.steps.length - 1 && (
                                      <View style={{
                                        width: 1,
                                        height: 24,
                                        backgroundColor: step.isCompleted && activeOrder.steps[index+1].isCompleted ? 
                                          '#10b981' : '#e2e8f0',
                                        marginVertical: 4
                                      }} />
                                    )}
                                  </View>
                                  
                                  {/* Step details */}
                                  <View style={{ marginLeft: 12, flex: 1 }}>
                                    <Text style={{ 
                                      fontWeight: '600', 
                                      color: step.isCompleted ? '#0f172a' : '#64748b',
                                      fontSize: 15
                                    }}>
                                      {step.title}
                                    </Text>
                                    
                                    <Text style={{ 
                                      color: '#64748b', 
                                      fontSize: 13,
                                      marginTop: 2
                                    }}>
                                      {step.time || 'Pending'}
                                    </Text>
                                  </View>
                                  
                                  {/* Action button for next step */}
                                  {!step.isCompleted && activeOrder.steps[index-1]?.isCompleted && (
                                    <TouchableOpacity
                                      style={{
                                        backgroundColor: '#3b82f6',
                                        paddingHorizontal: 12,
                                        paddingVertical: 6,
                                        borderRadius: 6,
                                        justifyContent: 'center'
                                      }}
                                      onPress={() => updateDeliveryStep(activeOrder.id, step.id)}
                                      disabled={updatingStep === step.id}
                                    >
                                      {updatingStep === step.id ? (
                                        <ActivityIndicator size="small" color="white" />
                                      ) : (
                                        <Text style={{ color: 'white', fontWeight: '600', fontSize: 13 }}>
                                          Complete
                                        </Text>
                                      )}
                                    </TouchableOpacity>
                                  )}
                                </View>
                              ))}
                            </View>
                          )}
                          
                          {/* Order Items Section */}
                          <TouchableOpacity
                            style={{
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              marginBottom: 8
                            }}
                            onPress={() => toggleSection('items')}
                          >
                            <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#0f172a' }}>
                              Order Items
                            </Text>
                            <Ionicons 
                              name={expandedSections.items ? "chevron-up" : "chevron-down"} 
                              size={20} 
                              color="#64748b" 
                            />
                          </TouchableOpacity>
                          
                          {expandedSections.items && (
                            <View style={{
                              backgroundColor: '#f8fafc',
                              borderRadius: 12,
                              padding: 16,
                              marginBottom: 16
                            }}>
                              <View style={{ 
                                paddingBottom: 12, 
                                borderBottomWidth: 1, 
                                borderBottomColor: '#e2e8f0',
                                marginBottom: 12
                              }}>
                                <Text style={{ color: '#64748b', fontSize: 13, marginBottom: 4 }}>
                                  Pickup from
                                </Text>
                                <Text style={{ color: '#0f172a', fontWeight: '600', fontSize: 15 }}>
                                  {activeOrder.restaurant.name}
                                </Text>
                                <Text style={{ color: '#64748b', fontSize: 14, marginTop: 2 }}>
                                  {activeOrder.restaurant.address}
                                </Text>
                              </View>
                              
                              {/* Item list */}
                              <Text style={{ color: '#64748b', fontSize: 13, marginBottom: 8 }}>
                                Items ({activeOrder.items.length})
                              </Text>
                              
                              {activeOrder.items.map((item, index) => (
                                <View 
                                  key={index}
                                  style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    paddingVertical: 8,
                                    borderBottomWidth: index < activeOrder.items.length - 1 ? 1 : 0,
                                    borderBottomColor: '#e2e8f0'
                                  }}
                                >
                                  <View style={{ flex: 1 }}>
                                    <Text style={{ color: '#0f172a', fontSize: 15 }}>
                                      {item.name}
                                    </Text>
                                  </View>
                                  
                                  <Text style={{ color: '#64748b', fontSize: 14, marginHorizontal: 8 }}>
                                    x{item.quantity}
                                  </Text>
                                  
                                  <Text style={{ color: '#0f172a', fontWeight: '600', fontSize: 14 }}>
                                    {item.price}
                                  </Text>
                                </View>
                              ))}
                              
                              {/* Total */}
                              <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                marginTop: 12,
                                paddingTop: 12,
                                borderTopWidth: 1,
                                borderTopColor: '#e2e8f0'
                              }}>
                                <Text style={{ color: '#0f172a', fontWeight: 'bold', fontSize: 16 }}>
                                  Total
                                </Text>
                                <View style={{ alignItems: 'flex-end' }}>
                                  <Text style={{ color: '#0f172a', fontWeight: 'bold', fontSize: 16 }}>
                                    {activeOrder.payment.total}
                                  </Text>
                                  <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginTop: 4
                                  }}>
                                    <Text style={{ color: '#64748b', fontSize: 13, marginRight: 4 }}>
                                      {activeOrder.payment.method}
                                    </Text>
                                    <View style={{
                                      paddingHorizontal: 6,
                                      paddingVertical: 2,
                                      borderRadius: 4,
                                      backgroundColor: activeOrder.payment.isPaid ? '#dcfce7' : '#fff7ed'
                                    }}>
                                      <Text style={{ 
                                        fontSize: 11, 
                                        fontWeight: '600',
                                        color: activeOrder.payment.isPaid ? '#16a34a' : '#f97316'
                                      }}>
                                        {activeOrder.payment.isPaid ? 'PAID' : 'COD'}
                                      </Text>
                                    </View>
                                  </View>
                                </View>
                              </View>
                            </View>
                          )}
                          
                          {/* Action Buttons */}
                          <View style={{ 
                            flexDirection: 'row', 
                            justifyContent: 'space-between',
                            marginTop: 8
                          }}>
                            <TouchableOpacity
                              style={{
                                flex: 1,
                                backgroundColor: '#ef4444',
                                borderRadius: 8,
                                paddingVertical: 12,
                                alignItems: 'center',
                                marginRight: 8
                              }}
                              onPress={() => markOrderAsDelayed(activeOrder.id)}
                            >
                              <Text style={{ color: 'white', fontWeight: 'bold' }}>
                                Mark as Delayed
                              </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity
                              style={{
                                flex: 1,
                                backgroundColor: '#3b82f6',
                                borderRadius: 8,
                                paddingVertical: 12,
                                alignItems: 'center',
                                marginLeft: 8
                              }}
                              onPress={() => {
                                // Find the next uncompleted step
                                const nextStep = activeOrder.steps.find(s => !s.isCompleted);
                                if (nextStep) {
                                  updateDeliveryStep(activeOrder.id, nextStep.id);
                                }
                              }}
                            >
                              <Text style={{ color: 'white', fontWeight: 'bold' }}>
                                Update Status
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                      keyExtractor={item => item.key}
                    />
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

