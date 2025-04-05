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
  RefreshControl,
  TextInput,
  ScrollView
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
  const cardScale = useRef(new Animated.Value(1)).current;
  
  // Method to reset modal animations
  const resetModalAnimations = () => {
    modalScaleAnim.setValue(0.9);
    modalOpacityAnim.setValue(0);
  };
  
  // Method to animate modal opening
  const animateModalOpen = () => {
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
  const [deliveryNote, setDeliveryNote] = useState('');
  const [showDeliveryNoteInput, setShowDeliveryNoteInput] = useState(false);
  
  // Get authentication context
  const { user } = useAuth();

  // DEBUG: Log activeOrder changes
  useEffect(() => {
    if (activeOrder) {
      console.log("activeOrder updated:", activeOrder.id, "Status:", activeOrder.status);
    }
  }, [activeOrder]);

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
      
      // Create a query for tasks with 'In Progress' status for more efficient fetching
      const orderQuery = query(
        tasksRef, 
        where("status", "==", "In Progress")
      );
      
      const querySnapshot = await getDocs(orderQuery);
      
      if (querySnapshot.empty) {
        console.log("No in-progress tasks found");
        
        // Try a fallback query without status filter to check if there are any tasks
        const fallbackQuery = query(tasksRef);
        const fallbackSnapshot = await getDocs(fallbackQuery);
        
        if (fallbackSnapshot.empty) {
          console.log("No tasks found at all");
        } else {
          console.log(`Found ${fallbackSnapshot.size} total tasks, but none with 'In Progress' status`);
        }
        
        setInProgressOrders([]);
        setLoading(false);
        setIsRefreshing(false);
        return;
      }
      
      console.log(`Found ${querySnapshot.size} in-progress orders`);
      
      // Process the tasks into a usable format
      const progressOrders = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          
          // Calculate delivery progress steps
          const steps = [
            { 
              id: 'pickup', 
              title: 'Pickup from Store', 
              time: data.startedAt ? new Date(data.startedAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : '', 
              isCompleted: data.startedAt ? true : false 
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
        .sort((a, b) => {
          // Sort by startedAt timestamp if available, or most recent first by default
          const aStarted = a.rawData.startedAt?.seconds || 0;
          const bStarted = b.rawData.startedAt?.seconds || 0;
          return bStarted - aStarted; // Most recent first
        });
      
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
      setError(`Failed to load orders: ${error.message}`);
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

  // Update delivery step with improved error handling and feedback
  const updateDeliveryStep = async (orderId, stepId) => {
    if (!user || !user.uid) {
      Alert.alert("Error", "You must be logged in to update delivery status");
      return;
    }
    
    // Mark step as updating
    setUpdatingStep(stepId);
    
    try {
      console.log(`Updating step ${stepId} for order ${orderId}`);
      
      const order = inProgressOrders.find(o => o.id === orderId);
      if (!order) {
        throw new Error("Order not found");
      }
      
      // Find the current step and its index
      const stepIndex = order.steps.findIndex(step => step.id === stepId);
      if (stepIndex === -1) {
        throw new Error("Step not found");
      }
      
      // Check if we're updating the step's status (toggling completion)
      const isStepCompleted = order.steps[stepIndex].isCompleted;
      
      // Determine which fields to update based on step ID and current completion status
      const updateData = { lastUpdated: serverTimestamp() };
      
      // If we're completing the step
      if (!isStepCompleted) {
        // Set appropriate timestamp field based on step
        if (stepId === 'pickup') {
        updateData.startedAt = serverTimestamp();
        updateData.status = 'Picked up';
      }
      else if (stepId === 'enroute') {
        updateData.onTheWayAt = serverTimestamp();
        updateData.status = 'On the way';
      }
      else if (stepId === 'arrival') {
        updateData.arrivedAt = serverTimestamp();
        updateData.status = 'Arrived';
      }
      else if (stepId === 'delivered') {
        updateData.deliveredAt = serverTimestamp();
        updateData.status = 'Delivered';
        updateData.completedAt = serverTimestamp();
        
        // Additional data for completed deliveries
        updateData.deliveryCompletionDetails = {
          completedBy: user.displayName || user.email || 'Delivery Agent',
          deliveryAgentId: user.uid,
          location: {
            // In a real app, you would use geolocation here
            latitude: 'DELIVERY_LOCATION_LATITUDE',
            longitude: 'DELIVERY_LOCATION_LONGITUDE'
          },
          completionTime: serverTimestamp(),
          deliveryNotes: order.rawData.deliveryNotes || ''
        };
        }
      } 
      // If we're un-completing the step
      else {
        // Remove the timestamp for this step
        if (stepId === 'pickup') {
          updateData.startedAt = null;
          // Update status to previous status
          updateData.status = 'Preparing';
        }
        else if (stepId === 'enroute') {
          updateData.onTheWayAt = null;
          // Update status to previous status (Picked up)
          updateData.status = 'Picked up';
        }
        else if (stepId === 'arrival') {
          updateData.arrivedAt = null;
          // Update status to previous status (On the way)
          updateData.status = 'On the way';
        }
        else if (stepId === 'delivered') {
          updateData.deliveredAt = null;
          updateData.completedAt = null;
          // Update status to previous status (Arrived)
          updateData.status = 'Arrived';
          // Remove delivery completion details
          updateData.deliveryCompletionDetails = null;
        }
      }
      
      console.log("Updating with data:", JSON.stringify(updateData));
      
      // Update in Firestore
      const taskRef = doc(db, `users/${user.uid}/tasks`, orderId);
      await updateDoc(taskRef, updateData);
      
      console.log("Firestore update successful");
      
      // Synchronize with customer's order if the order has customer information
      if (order.rawData.customerId && order.rawData.orderId) {
        try {
          // Reference to the customer's order
          const customerOrderRef = doc(db, `users/${order.rawData.customerId}/orders`, order.rawData.orderId);
          
          // Create consistent update data for customer order
          const customerUpdateData = { 
            status: updateData.status,
            lastUpdated: serverTimestamp(),
            deliveryAgentInfo: {
              id: user.uid,
              name: user.displayName || 'Delivery Agent',
              phone: user.phoneNumber || 'Not provided'
            }
          };
          
          // Add appropriate data based on step and completion status
          if (!isStepCompleted) {
            // Completing the step
          if (stepId === 'pickup') {
            customerUpdateData.startedAt = updateData.startedAt;
            customerUpdateData.statusHistory = {
              pickupCompleted: serverTimestamp()
            };
            customerUpdateData.statusMessage = "Your order has been picked up and is being prepared for delivery";
          }
          else if (stepId === 'enroute') {
            customerUpdateData.onTheWayAt = updateData.onTheWayAt;
            customerUpdateData.statusHistory = {
              enrouteStarted: serverTimestamp()
            };
            customerUpdateData.statusMessage = "Your order is on the way to your location";
            
            // Calculate and update ETA if possible
            if (order.route && order.route.duration) {
              const etaMinutes = parseInt(order.route.duration) || 30;
              const etaDate = new Date();
              etaDate.setMinutes(etaDate.getMinutes() + etaMinutes);
              customerUpdateData.estimatedArrival = etaDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
            }
          }
          else if (stepId === 'arrival') {
            customerUpdateData.arrivedAt = updateData.arrivedAt;
            customerUpdateData.statusHistory = {
              arrivalCompleted: serverTimestamp()
            };
            customerUpdateData.statusMessage = "Your delivery agent has arrived at your location";
          }
          else if (stepId === 'delivered') {
            customerUpdateData.deliveredAt = updateData.deliveredAt;
            customerUpdateData.completedAt = updateData.completedAt;
            customerUpdateData.statusHistory = {
              deliveryCompleted: serverTimestamp()
            };
            customerUpdateData.statusMessage = "Your order has been delivered successfully";
            
            // Add delivery completion notifications
            customerUpdateData.notifications = [{
              type: 'order_delivered',
              message: 'Your order has been delivered successfully.',
              createdAt: serverTimestamp(),
              read: false
            }];
            
            // Include delivery completion details for the customer
            customerUpdateData.deliveryDetails = updateData.deliveryCompletionDetails;
            }
          } else {
            // Uncompleting the step - revert to previous status
            if (stepId === 'pickup') {
              customerUpdateData.startedAt = null;
              customerUpdateData.statusMessage = "Your order is being prepared";
            }
            else if (stepId === 'enroute') {
              customerUpdateData.onTheWayAt = null;
              customerUpdateData.statusMessage = "Your order has been picked up";
            }
            else if (stepId === 'arrival') {
              customerUpdateData.arrivedAt = null;
              customerUpdateData.statusMessage = "Your order is on the way";
            }
            else if (stepId === 'delivered') {
              customerUpdateData.deliveredAt = null;
              customerUpdateData.completedAt = null;
              customerUpdateData.statusMessage = "Your delivery agent has arrived at your location";
              
              // Remove delivery completion details
              customerUpdateData.deliveryDetails = null;
            }
          }
          
          // Update the customer's order
          await updateDoc(customerOrderRef, customerUpdateData);
          console.log("Successfully synchronized order status with customer");
          
          // If this is a store order, also update the store's order record
          if (order.rawData.storeId && order.rawData.storeOrderId) {
            const storeOrderRef = doc(db, `stores/${order.rawData.storeId}/orders`, order.rawData.storeOrderId);
            await updateDoc(storeOrderRef, {
              status: updateData.status,
              lastUpdated: serverTimestamp(),
              deliveryStatus: updateData.status,
              deliveryAgentId: user.uid,
              deliveryAgentName: user.displayName || 'Delivery Agent'
            });
            console.log("Successfully synchronized order status with store");
          }
        } catch (syncError) {
          console.error("Error synchronizing order status with customer:", syncError);
          // We continue with the function execution even if sync fails
        }
      }
      
      // Update local state - update steps
      const updatedOrders = inProgressOrders.map(order => {
        if (order.id === orderId) {
          // Find current step and all steps
          const updatedSteps = order.steps.map((step, index) => {
            if (step.id === stepId) {
              // Toggle completion for the current step
              return {
                ...step,
                isCompleted: !isStepCompleted,
                time: !isStepCompleted ? new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) : ''
              };
            } 
            else if (isStepCompleted) {
              // When going backwards, keep completed status for earlier steps
            return step;
            }
            else {
              // When going forward, all previous steps should be completed
              // and all later steps should be pending
              const stepIndexCurrent = order.steps.findIndex(s => s.id === stepId);
              if (index < stepIndexCurrent) {
                return { ...step, isCompleted: true };
              } else if (index > stepIndexCurrent) {
                return { ...step, isCompleted: false, time: '' };
              }
              return step;
            }
          });
          
          // Update status based on step and action
          let newStatus;
          if (!isStepCompleted) {
            // Moving forward - set status based on the current step being completed
          if (stepId === 'pickup') newStatus = 'Picked up';
            else if (stepId === 'enroute') newStatus = 'On the way';
            else if (stepId === 'arrival') newStatus = 'Arrived';
            else if (stepId === 'delivered') newStatus = 'Delivered';
            else newStatus = order.status;
          } else {
            // Moving backward - set status based on last completed step
            const completedSteps = updatedSteps.filter(step => step.isCompleted);
            if (completedSteps.length === 0) {
              newStatus = 'Preparing';
            } else {
              const lastCompletedStep = completedSteps[completedSteps.length - 1];
              if (lastCompletedStep.id === 'pickup') newStatus = 'Picked up';
              else if (lastCompletedStep.id === 'enroute') newStatus = 'On the way';
              else if (lastCompletedStep.id === 'arrival') newStatus = 'Arrived';
              else if (lastCompletedStep.id === 'delivered') newStatus = 'Delivered';
              else newStatus = 'Preparing';
            }
          }
          
          return { ...order, steps: updatedSteps, status: newStatus };
        }
        return order;
      });
      
      setInProgressOrders(updatedOrders);
      
      // Update active order if this is the currently active order
      if (activeOrder && activeOrder.id === orderId) {
        const updatedActiveOrder = updatedOrders.find(o => o.id === orderId);
        if (updatedActiveOrder) {
          setActiveOrder(updatedActiveOrder);
        }
      }
      
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
      if (stepId === 'delivered' && !isStepCompleted) {
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
      } else {
        // Show a success toast for other updates
        const action = isStepCompleted ? "reverted" : "updated";
        Alert.alert(
          "Status Updated",
          `Order status ${action} to "${newStatus}"`,
          [{ text: "OK" }]
        );
      }
      
    } catch (error) {
      console.error("Error updating delivery step:", error);
      Alert.alert("Error", `Failed to update delivery status: ${error.message}`);
    } finally {
      setUpdatingStep(null);
    }
  };
  
  // Function to render the timeline step item
  const renderTimelineStep = (step, index, steps) => {
    return (
      <View key={step.id} style={{
        flexDirection: 'row',
        marginBottom: index === steps.length - 1 ? 0 : 24,
        alignItems: 'flex-start'
      }}>
        {/* Step indicator */}
        <View style={{
          width: 26,
          alignItems: 'center'
        }}>
          <View style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: step.isCompleted ? '#10b981' : '#e2e8f0',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: step.isCompleted ? '#10b981' : 'transparent',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: step.isCompleted ? 0.3 : 0,
            shadowRadius: 5,
            elevation: step.isCompleted ? 3 : 0,
          }}>
            {step.isCompleted ? (
              <Feather name="check" size={16} color="white" />
            ) : (
              <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: 'bold' }}>
                {index + 1}
              </Text>
            )}
          </View>
          
          {index < steps.length - 1 && (
            <View style={{
              width: 2,
              height: 36,
              backgroundColor: step.isCompleted && steps[index+1].isCompleted 
                ? '#10b981' 
                : '#e2e8f0',
              marginVertical: 4
            }} />
          )}
        </View>
        
        {/* Step info */}
        <View style={{
          marginLeft: 16,
          flex: 1,
          paddingBottom: 8
        }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: step.isCompleted ? '#0f172a' : '#64748b',
            marginBottom: 4
          }}>
            {step.title}
          </Text>
          <Text style={{ 
            fontSize: 14, 
            color: step.isCompleted ? '#059669' : '#94a3b8',
            fontWeight: step.isCompleted ? '500' : 'normal'
          }}>
            {step.isCompleted ? `Completed at ${step.time}` : 'Pending'}
          </Text>
        </View>
      </View>
    );
  };
  
  // Handle update step status
  const handleUpdateStepStatus = (stepId) => {
    if (!activeOrder) return;
    
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Fallback if haptics not available
      }
    }
    
    // Call the real update function
    updateDeliveryStep(activeOrder.id, stepId);
  };
  
  // Mark order as delayed
  const markOrderAsDelayed = async (orderId) => {
    if (!user || !user.uid) {
      Alert.alert("Error", "You must be logged in to update delivery status");
      return;
    }
    
    try {
      const order = inProgressOrders.find(o => o.id === orderId);
      if (!order) {
        throw new Error("Order not found");
      }
      
      // Update in Firestore
      const taskRef = doc(db, `users/${user.uid}/tasks`, orderId);
      const updateData = {
        delayed: true,
        delayedAt: serverTimestamp(),
        status: 'Delayed',
        lastUpdated: serverTimestamp(),
        delayReason: 'Delivery delayed',
        estimatedDelay: 15 // Default 15 minutes delay
      };
      
      await updateDoc(taskRef, updateData);
      
      // Synchronize with customer's order if the order has customer information
      if (order.rawData.customerId && order.rawData.orderId) {
        try {
          // Reference to the customer's order
          const customerOrderRef = doc(db, `users/${order.rawData.customerId}/orders`, order.rawData.orderId);
          
          // Update customer order with delay information
          const customerUpdateData = {
            status: 'Delayed',
            deliveryStatus: 'Delayed',
            lastUpdated: serverTimestamp(),
            delayedAt: serverTimestamp(),
            statusMessage: "Your delivery has been delayed. We apologize for the inconvenience.",
            notifications: [{
              type: 'order_delayed',
              message: 'Your delivery has been delayed. The delivery agent will contact you shortly.',
              createdAt: serverTimestamp(),
              read: false
            }]
          };
          
          // Update estimated delivery time
          const currentTime = new Date();
          currentTime.setMinutes(currentTime.getMinutes() + 15); // Adding default 15 minutes
          const newEstimatedTime = currentTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
          customerUpdateData.estimatedDelivery = newEstimatedTime;
          
          await updateDoc(customerOrderRef, customerUpdateData);
          console.log("Successfully synchronized delay status with customer");
          
          // If this is a store order, also update the store's order record
          if (order.rawData.storeId && order.rawData.storeOrderId) {
            const storeOrderRef = doc(db, `stores/${order.rawData.storeId}/orders`, order.rawData.storeOrderId);
            await updateDoc(storeOrderRef, {
              status: 'Delayed',
              lastUpdated: serverTimestamp(),
              deliveryStatus: 'Delayed',
              delayReason: 'Delivery delayed',
              deliveryAgentId: user.uid,
              deliveryAgentName: user.displayName || 'Delivery Agent'
            });
            console.log("Successfully synchronized delay status with store");
          }
        } catch (syncError) {
          console.error("Error synchronizing delay status with customer:", syncError);
          // Continue with the function execution even if sync fails
        }
      }
      
      // Update local state
      const updatedOrders = inProgressOrders.map(order => {
        if (order.id === orderId) {
          return { 
            ...order, 
            status: 'Delayed',
            estimatedDeliveryTime: 'Delayed'
          };
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
      
      // Show input dialog for delay reason
      Alert.alert(
        "Order Delayed",
        "The order has been marked as delayed. Would you like to contact the customer?",
        [
          { 
            text: "Contact Customer", 
            onPress: () => {
              if (activeOrder) {
                handleCallCustomer();
              }
            } 
          },
          { text: "Not Now" }
        ]
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
    
    console.log("Proceeding to show order details");
    
    // Create a deep copy of the order to avoid reference issues
    const orderCopy = {...order};
    if (order.rawData) {
      orderCopy.rawData = {...order.rawData};
    }
    if (order.customer) {
      orderCopy.customer = {...order.customer};
    }
    if (order.steps) {
      orderCopy.steps = [...order.steps];
    }
    
    // Set the active order
    setActiveOrder(orderCopy);
    setDeliveryNote(orderCopy.rawData?.deliveryNotes || '');
    
    // Reset edit status to ensure clean state
    setEditingStatus(false);
    
    // Reset modal animations
    resetModalAnimations();
    
    // Show the modal with a small delay and animate entrance
    setTimeout(() => {
      setShowOrderDetails(true);
      
      // Animate modal entrance
      animateModalOpen();
    }, 150);
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
      setEditingStatus(false);
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

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Update order status
  const updateOrderStatus = async (status) => {
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Fallback if haptics not available
      }
    }
    
    if (!user || !user.uid || !activeOrder) {
      Alert.alert("Error", "Cannot update status at this time");
      return;
    }
    
    console.log("Updating order status:", activeOrder.id, "from", activeOrder.status, "to", status);
    
    // Show loading indicator
    setUpdatingStep('status-update');
    
    try {
      // Define status-specific update data
      const updateData = { 
        status: status,
        lastUpdated: serverTimestamp() 
      };
      
      // Additional fields based on status
      if (status === 'Picked up' && !activeOrder.rawData.startedAt) {
        updateData.startedAt = serverTimestamp();
      } else if (status === 'On the way' && !activeOrder.rawData.onTheWayAt) {
        updateData.onTheWayAt = serverTimestamp();
      } else if (status === 'Arrived' && !activeOrder.rawData.arrivedAt) {
        updateData.arrivedAt = serverTimestamp();
      } else if (status === 'Delivered' && !activeOrder.rawData.deliveredAt) {
        updateData.deliveredAt = serverTimestamp();
        updateData.completedAt = serverTimestamp();
      } else if (status === 'Delayed') {
        updateData.delayed = true;
      }
      
      console.log("Updating Firestore with data:", JSON.stringify(updateData));
      
      // Update in Firestore
      const taskRef = doc(db, `users/${user.uid}/tasks`, activeOrder.id);
      await updateDoc(taskRef, updateData);
      
      console.log("Firestore update successful");
      
      // Synchronize with customer's order if the order has customer information
      if (activeOrder.rawData.customerId && activeOrder.rawData.orderId) {
        try {
          // Reference to the customer's order
          const customerOrderRef = doc(db, `users/${activeOrder.rawData.customerId}/orders`, activeOrder.rawData.orderId);
          
          // Create consistent update data for customer order
          const customerUpdateData = { 
            status: status,
            lastUpdated: serverTimestamp(),
            deliveryAgentInfo: {
              id: user.uid,
              name: user.displayName || 'Delivery Agent',
              phone: user.phoneNumber || 'Not provided'
            }
          };
          
          // Add status specific updates to the customer order
          if (status === 'Picked up') {
            customerUpdateData.startedAt = updateData.startedAt;
            customerUpdateData.statusMessage = "Your order has been picked up and is being prepared for delivery";
          } else if (status === 'On the way') {
            customerUpdateData.onTheWayAt = updateData.onTheWayAt;
            customerUpdateData.statusMessage = "Your order is on the way to your location";
          } else if (status === 'Arrived') {
            customerUpdateData.arrivedAt = updateData.arrivedAt;
            customerUpdateData.statusMessage = "Your delivery agent has arrived at your location";
          } else if (status === 'Delivered') {
            customerUpdateData.deliveredAt = updateData.deliveredAt;
            customerUpdateData.completedAt = updateData.completedAt;
            customerUpdateData.statusMessage = "Your order has been delivered successfully";
          } else if (status === 'Delayed') {
            customerUpdateData.delayed = true;
            customerUpdateData.statusMessage = "Your delivery is delayed. The delivery agent will contact you shortly.";
          }
          
          // Update the customer's order
          await updateDoc(customerOrderRef, customerUpdateData);
          console.log("Successfully synchronized status with customer order");
        } catch (syncError) {
          console.error("Error synchronizing status with customer:", syncError);
          // Continue even if sync fails
        }
      }
      
      // Update active order UI state
      console.log("Updating UI with new status:", status);
      
      // Create a copy of the current activeOrder with updated status
        const updatedOrder = {
          ...activeOrder,
        status: status
      };
      
      // Update steps based on status
      const updatedSteps = [...activeOrder.steps];
      
      // Synchronize timeline with status
      if (status === 'Preparing') {
        // Reset all steps to incomplete
        updatedSteps.forEach(step => {
          step.isCompleted = false;
          step.time = '';
        });
      } else if (status === 'Picked up') {
        // Mark pickup as complete, reset others
        updatedSteps.forEach(step => {
          if (step.id === 'pickup') {
            step.isCompleted = true;
            step.time = new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
          } else {
            step.isCompleted = false;
            step.time = '';
          }
        });
      } else if (status === 'On the way') {
        // Mark pickup and enroute as complete, reset others
        updatedSteps.forEach(step => {
          if (step.id === 'pickup' || step.id === 'enroute') {
            step.isCompleted = true;
            if (step.id === 'enroute' || !step.time) {
              step.time = new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
            }
          } else {
            step.isCompleted = false;
            step.time = '';
          }
        });
      } else if (status === 'Arrived') {
        // Mark pickup, enroute, and arrival as complete, reset delivered
        updatedSteps.forEach(step => {
          if (step.id === 'pickup' || step.id === 'enroute' || step.id === 'arrival') {
            step.isCompleted = true;
            if (step.id === 'arrival' || !step.time) {
              step.time = new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
            }
          } else {
            step.isCompleted = false;
            step.time = '';
          }
        });
      } else if (status === 'Delivered') {
        // Mark all steps as complete
        updatedSteps.forEach(step => {
          step.isCompleted = true;
          if (step.id === 'delivered' || !step.time) {
            step.time = new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
          }
        });
      }
      
      // Store updated steps in the order object
      updatedOrder.steps = updatedSteps;
      
      // Calculate new progress
        const completedSteps = updatedSteps.filter(step => step.isCompleted).length;
        const totalSteps = updatedSteps.length;
        const newProgress = (completedSteps / totalSteps) * 100;
        
      // Update progress in state
        setDeliveryProgress(prev => ({
          ...prev,
          [activeOrder.id]: newProgress
        }));
        
      // Update activeOrder state with the fully updated object
      setActiveOrder(updatedOrder);
      
      // Update orders list with the new status
      setInProgressOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === activeOrder.id 
            ? { ...order, status: status, steps: updatedSteps }
            : order
        )
      );
      
      // Show success message
      Alert.alert("Success", `Order status updated to ${status}`);
      
      // If status is Delivered, close modal and refresh after a delay
      if (status === 'Delivered') {
          setTimeout(() => {
          console.log("Order delivered - closing modal and refreshing");
            closeOrderDetails();
          fetchInProgressOrders();
          }, 1500);
        }
    } catch (error) {
      console.error("Error updating order status:", error);
      Alert.alert("Error", "Failed to update status. Please try again.");
    } finally {
      setEditingStatus(false);
      setUpdatingStep(null);
    }
  };

  // Function to save delivery note
  const saveDeliveryNote = async (orderId) => {
    if (!user || !user.uid || !orderId) {
      Alert.alert("Error", "Cannot save delivery note at this time");
      return;
    }
    
    try {
      // Update in Firestore
      const taskRef = doc(db, `users/${user.uid}/tasks`, orderId);
      await updateDoc(taskRef, {
        deliveryNotes: deliveryNote,
        lastUpdated: serverTimestamp()
      });
      
      // Update local state
      const updatedOrders = inProgressOrders.map(order => {
        if (order.id === orderId) {
          const updatedOrder = {
            ...order,
            rawData: {
              ...order.rawData,
              deliveryNotes: deliveryNote
            }
          };
          
          // If we have an activeOrder, also update it
          if (activeOrder && activeOrder.id === orderId) {
            setActiveOrder(updatedOrder);
          }
          
          return updatedOrder;
        }
        return order;
      });
      
      setInProgressOrders(updatedOrders);
      setShowDeliveryNoteInput(false);
      
      // Show success message
      Alert.alert("Success", "Delivery note has been saved");
      
    } catch (error) {
      console.error("Error saving delivery note:", error);
      Alert.alert("Error", "Failed to save delivery note. Please try again.");
    }
  };

  // Render order card
  const renderOrderCard = ({ item }) => {
    // Calculate progress
    const progress = deliveryProgress[item.id] || 0;
    
    // Make sure we're getting all the necessary data
    console.log(`Rendering card for order ${item.id} with status ${item.status}`);
    
    const onPressIn = () => {
      Animated.spring(cardScale, {
        toValue: 0.98,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
      
      if (Platform.OS === 'ios') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (e) {
          // Fallback
        }
      }
    };
    
    const onPressOut = () => {
      Animated.spring(cardScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    };
    
    // Status colors based on order status
    const getStatusColor = () => {
      switch(item.status) {
        case 'Delayed': return '#ef4444';
        case 'Delivered': return '#10b981';
        case 'On the way': return '#3b82f6';
        case 'Arrived': return '#8b5cf6';
        case 'Picked up': return '#f97316';
        default: return '#10b981';
      }
    };
    
    const statusColor = getStatusColor();
    
    const handleOrderPress = () => {
      // Verify the data is complete before showing the modal
      if (!item || !item.id) {
        console.error('Order data missing or incomplete');
        Alert.alert('Error', 'Cannot load order details. Please try again.');
        return;
      }
      
      console.log('Order pressed:', item.id);
      handleSelectOrder(item);
    };
    
    return (
      <Animated.View 
        style={{
          opacity: fadeAnim,
          transform: [
            { translateY },
            { scale: cardScale }
          ],
          marginBottom: 16
        }}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={handleOrderPress}
          style={{
            backgroundColor: 'white',
            borderRadius: 16,
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.12,
            shadowRadius: 12,
            elevation: 4,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: '#f1f5f9'
          }}
        >
          {/* Status Bar */}
          <LinearGradient
            colors={[statusColor, statusColor + '99']}
            start={[0, 0]}
            end={[1, 0]}
            style={{
              paddingVertical: 10,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: 'white',
                marginRight: 8
              }} />
              <Text style={{ 
                fontWeight: '700', 
                color: 'white', 
                fontSize: 14,
                letterSpacing: 0.3
              }}>
                {item.status}
              </Text>
            </View>
            
            <Text style={{ color: 'white', fontSize: 13, fontWeight: '600' }}>
              #{item.orderNumber}
            </Text>
          </LinearGradient>
          
          {/* Content */}
          <View style={{ padding: 16 }}>
            {/* Customer Info */}
            <View style={{ flexDirection: 'row', marginBottom: 16, alignItems: 'center' }}>
              <Image 
                source={{ uri: item.customer.photo }}
                style={{ 
                  width: 56, 
                  height: 56, 
                  borderRadius: 28,
                  borderWidth: 2,
                  borderColor: statusColor + '40'
                }}
              />
              
              <View style={{ marginLeft: 14, flex: 1 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 17, color: '#1e293b', marginBottom: 3 }}>
                  {item.customer.name}
                </Text>
                
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="location-outline" size={14} color="#64748b" />
                  <Text style={{ color: '#64748b', fontSize: 14, marginLeft: 4 }} numberOfLines={1}>
                    {item.customer.address}
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Progress Tracking */}
            <View style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: '#475569', fontSize: 13, fontWeight: '500' }}>Delivery Progress</Text>
                <Text style={{ 
                  color: statusColor, 
                  fontSize: 13, 
                  fontWeight: '700' 
                }}>
                  {Math.round(progress)}%
                </Text>
              </View>
              
              <View style={{ height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
                <Animated.View 
                  style={{
                    height: '100%',
                    width: `${progress}%`,
                    backgroundColor: statusColor,
                    borderRadius: 3
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
              <View style={{
                backgroundColor: 'white',
                padding: 8,
                borderRadius: 8,
                minWidth: 100,
                shadowColor: '#0f172a',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1
              }}>
                <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}>Picked Up</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name="access-time" size={16} color={statusColor} />
                  <Text style={{ 
                    fontWeight: '700', 
                    color: '#334155', 
                    fontSize: 14,
                    marginLeft: 4
                  }}>
                    {item.pickupTime}
                  </Text>
                </View>
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
                  backgroundColor: statusColor + '80'
                }} />
                <View style={{ 
                  height: 2, 
                  backgroundColor: statusColor + '50', 
                  flex: 1, 
                  marginHorizontal: 4 
                }} />
                <FontAwesome5 name="location-arrow" size={12} color={statusColor} />
              </View>
              
              <View style={{
                backgroundColor: 'white',
                padding: 8,
                borderRadius: 8,
                minWidth: 100,
                alignItems: 'flex-end',
                shadowColor: '#0f172a',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1
              }}>
                <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}>Estimated</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons name="flag" size={16} color={statusColor} />
                  <Text style={{ 
                    fontWeight: '700', 
                    color: '#334155', 
                    fontSize: 14,
                    marginLeft: 4
                  }}>
                    {item.estimatedDeliveryTime}
                  </Text>
                </View>
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
                paddingVertical: 14, 
                alignItems: 'center', 
                flexDirection: 'row',
                justifyContent: 'center',
                backgroundColor: '#f8fafc'
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
              <MaterialIcons name="directions" size={19} color="#3b82f6" />
              <Text style={{ color: '#3b82f6', fontWeight: '600', marginLeft: 6 }}>Navigate</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{ 
                flex: 1, 
                paddingVertical: 14, 
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'center',
                borderLeftWidth: 1,
                borderLeftColor: '#f1f5f9',
                backgroundColor: '#f8fafc'
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
  const renderEmptyState = () => {
    // Animation for empty state
    const emptyAnimation = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      Animated.spring(emptyAnimation, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }, []);
    
    return (
      <Animated.View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        paddingTop: 40,
        paddingHorizontal: 24,
        opacity: emptyAnimation,
        transform: [{ 
          translateY: emptyAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0]
          })
        }]
      }}>
        <LinearGradient
          colors={['#bfdbfe', '#93c5fd', '#60a5fa']}
          style={{ 
            width: 140, 
            height: 140, 
            borderRadius: 70,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 24,
            shadowColor: '#3b82f6',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.2,
            shadowRadius: 20,
            elevation: 5
          }}
        >
          <View style={{
            width: 110,
            height: 110,
            borderRadius: 55,
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <Feather name="package" size={54} color="#3b82f6" />
          </View>
        </LinearGradient>
        
        <Text style={{ 
          fontSize: 22, 
          fontWeight: 'bold', 
          color: '#1e293b', 
          marginBottom: 12,
          textAlign: 'center'
        }}>
          No Active Deliveries
        </Text>
        
        <Text style={{ 
          fontSize: 16, 
          color: '#64748b', 
          textAlign: 'center', 
          marginBottom: 24,
          lineHeight: 22,
          maxWidth: 300
        }}>
          You don't have any orders in progress at the moment. Check back soon for new deliveries.
        </Text>
        
        {error ? (
          <TouchableOpacity
            style={{
              backgroundColor: '#3b82f6',
              paddingVertical: 14,
              paddingHorizontal: 24,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              shadowColor: '#3b82f6',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 3
            }}
            onPress={fetchInProgressOrders}
          >
            <Feather name="refresh-cw" size={18} color="white" style={{ marginRight: 8 }} />
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Refresh</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={{
              backgroundColor: '#f8fafc',
              paddingVertical: 14,
              paddingHorizontal: 24,
              borderRadius: 12,
              flexDirection: 'row',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: '#e2e8f0'
            }}
            onPress={() => router.push('/deliveryAgent/Assigned_deliveries_list')}
          >
            <Feather name="list" size={18} color="#64748b" style={{ marginRight: 8 }} />
            <Text style={{ color: '#64748b', fontWeight: '600', fontSize: 16 }}>View Assigned Deliveries</Text>
          </TouchableOpacity>
        )}
      </Animated.View>
    );
  };
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar style="dark" />
      
      <HomeHeader title="In-Progress Orders" showBackButton />
      
      {loading ? (
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          backgroundColor: '#f8fafc'
        }}>
          <View style={{
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: '#f1f5f9',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 20,
            shadowColor: '#94a3b8',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 2
          }}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
          
          <Text style={{ 
            fontSize: 18, 
            fontWeight: '600', 
            color: '#334155',
            marginBottom: 8 
          }}>
            Loading Orders
          </Text>
          
          <Text style={{ 
            color: '#64748b',
            textAlign: 'center',
            maxWidth: 250,
            fontSize: 15
          }}>
            Fetching your active deliveries...
          </Text>
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
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {/* Order Details Modal */}
      <Modal
        visible={showOrderDetails}
        transparent={false}
        animationType="slide"
        onRequestClose={closeOrderDetails}
        statusBarTranslucent={true}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
          {activeOrder ? (
                  <View style={{ flex: 1 }}>
                    {/* Modal Header - With gradient background */}
                    <LinearGradient
                      colors={[
                  activeOrder.status === 'Delayed' ? '#fef2f2' : 
                  activeOrder.status === 'Delivered' ? '#f0fdf4' :
                  activeOrder.status === 'On the way' ? '#eff6ff' :
                  activeOrder.status === 'Arrived' ? '#f5f3ff' : '#fff7ed',
                  '#f8fafc'
                      ]}
                      start={[0, 0]}
                      end={[1, 1]}
                      style={{
                        paddingHorizontal: 20,
                  paddingTop: Platform.OS === 'ios' ? 10 : 16,
                  paddingBottom: 40,
                        borderBottomLeftRadius: 30,
                        borderBottomRightRadius: 30,
                  elevation: 2,
                }}
              >
                <Animated.View style={{
                  transform: [{ 
                    translateY: modalOpacityAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0]
                    })
                  }],
                }}>
                      <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                    marginBottom: 10
                      }}>
                        <View>
                          <Text style={{ 
                            fontWeight: 'bold', 
                        fontSize: 20, 
                        color: activeOrder.status === 'Delayed' ? '#b91c1c' : 
                               activeOrder.status === 'Delivered' ? '#047857' :
                               activeOrder.status === 'On the way' ? '#1d4ed8' :
                               activeOrder.status === 'Arrived' ? '#6d28d9' : '#c2410c',
                            marginBottom: 4
                          }}>
                        Order #{activeOrder.orderNumber || activeOrder.id.substring(0, 6)}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: activeOrder.status === 'Delayed' ? '#ef4444' : 
                                         activeOrder.status === 'Delivered' ? '#10b981' :
                                         activeOrder.status === 'On the way' ? '#3b82f6' :
                                         activeOrder.status === 'Arrived' ? '#8b5cf6' : '#f97316',
                          marginRight: 6
                            }} />
                            <Text style={{ 
                          color: '#64748b', 
                              fontWeight: '600',
                          fontSize: 14
                            }}>
                          {activeOrder.status || 'Processing'}
                            </Text>
                        <TouchableOpacity
                          onPress={() => setEditingStatus(true)}
                          style={{
                            marginLeft: 10,
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: 'rgba(203, 213, 225, 0.3)',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 1,
                            borderColor: 'rgba(203, 213, 225, 0.5)'
                          }}
                        >
                          <Feather name="edit-2" size={14} color="#64748b" />
                        </TouchableOpacity>
                          </View>
                        </View>
                        
                        <TouchableOpacity 
                          onPress={closeOrderDetails}
                          style={{
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        backgroundColor: 'rgba(203, 213, 225, 0.2)',
                            justifyContent: 'center',
                            alignItems: 'center'
                          }}
                        >
                      <Feather name="x" size={18} color="#64748b" />
                        </TouchableOpacity>
                      </View>
                      
                      {/* Quick action buttons on header */}
                      <View style={{ 
                        flexDirection: 'row', 
                    marginTop: 8,
                        justifyContent: 'flex-start'
                      }}>
                        <TouchableOpacity
                          style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        paddingHorizontal: 14,
                            paddingVertical: 8,
                        borderRadius: 16,
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginRight: 10
                          }}
                          onPress={handleCallCustomer}
                      activeOpacity={0.7}
                        >
                      <Feather name="phone" size={14} color="#3b82f6" />
                          <Text style={{ 
                        color: '#3b82f6', 
                            marginLeft: 6, 
                        fontWeight: '600',
                        fontSize: 13
                          }}>
                            Call
                          </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={{
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        paddingHorizontal: 14,
                            paddingVertical: 8,
                        borderRadius: 16,
                            flexDirection: 'row',
                            alignItems: 'center'
                          }}
                          onPress={handleNavigate}
                      activeOpacity={0.7}
                        >
                      <MaterialIcons name="directions" size={14} color="#10b981" />
                          <Text style={{ 
                        color: '#10b981', 
                            marginLeft: 6, 
                        fontWeight: '600',
                        fontSize: 13
                          }}>
                            Navigate
                          </Text>
                        </TouchableOpacity>
                      </View>
                </Animated.View>
                    </LinearGradient>
                    
              <ScrollView 
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
                scrollEventThrottle={16}
              >
                    {/* Customer card - overlapping the gradient header */}
                <Animated.View style={{
                      margin: 16,
                  marginTop: -40,
                      backgroundColor: 'white',
                  borderRadius: 20,
                      padding: 16,
                      shadowColor: '#0f172a',
                  shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                  elevation: 4,
                  transform: [{ 
                    scale: modalOpacityAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.95, 1]
                    }) 
                  }],
                    }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Image
                      source={{ uri: (activeOrder.customer && activeOrder.customer.photo) ? activeOrder.customer.photo : 'https://randomuser.me/api/portraits/lego/1.jpg' }}
                          style={{ 
                        width: 70, 
                        height: 70, 
                        borderRadius: 35,
                        borderWidth: 4,
                            borderColor: '#f8fafc'
                          }}
                        />
                        
                    <View style={{ marginLeft: 16, flex: 1 }}>
                          <Text style={{ 
                            fontWeight: 'bold', 
                            color: '#1e293b', 
                            fontSize: 18 
                          }}>
                        {(activeOrder.customer && activeOrder.customer.name) ? activeOrder.customer.name : 'Customer'}
                          </Text>
                          
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 4
                          }}>
                            <Feather name="map-pin" size={14} color="#64748b" />
                            <Text style={{ 
                              color: '#64748b', 
                              marginLeft: 4, 
                              fontSize: 14 
                        }} numberOfLines={2}>
                          {(activeOrder.customer && activeOrder.customer.address) ? activeOrder.customer.address : 'Address not available'}
                            </Text>
                    </View>
                    
                            <View style={{ 
                              flexDirection: 'row', 
                              alignItems: 'center',
                        marginTop: 4
                      }}>
                        <Feather name="phone" size={14} color="#64748b" />
                                    <Text style={{ 
                                      color: '#64748b', 
                          marginLeft: 4, 
                                      fontSize: 14
                                    }}>
                          {activeOrder.rawData && activeOrder.rawData.customerPhone ? 
                            activeOrder.rawData.customerPhone : 
                            activeOrder.customer && activeOrder.customer.phone && activeOrder.customer.phone !== 'No phone provided' ? 
                              activeOrder.customer.phone : 
                              'No phone provided'}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                </Animated.View>
                
                <View style={{ padding: 20, paddingTop: 6 }}>
                  {/* Status Box */}
                  <Animated.View style={{
                            backgroundColor: 'white',
                            borderRadius: 16,
                    padding: 16,
                            marginBottom: 16,
                            shadowColor: '#0f172a',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.06,
                            shadowRadius: 4,
                            elevation: 2,
                            borderWidth: 1,
                    borderColor: '#f1f5f9',
                    transform: [{ 
                      translateY: modalOpacityAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [20, 0]
                      })
                    }],
                  }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>
                      Order Status
                              </Text>
                              
                              <TouchableOpacity
                      onPress={() => setEditingStatus(true)}
                      activeOpacity={0.9}
                                style={{
                                  flexDirection: 'row', 
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 
                          activeOrder.status === 'Delayed' ? '#fee2e2' : 
                          activeOrder.status === 'Delivered' ? '#d1fae5' :
                          activeOrder.status === 'On the way' ? '#dbeafe' :
                          activeOrder.status === 'Arrived' ? '#ede9fe' : '#fff7ed',
                        paddingVertical: 14,
                                      paddingHorizontal: 16,
                        borderRadius: 12,
                      }}
                    >
                                  <View style={{
                        width: 14,
                        height: 14,
                        borderRadius: 7,
                        backgroundColor: 
                          activeOrder.status === 'Delayed' ? '#ef4444' : 
                          activeOrder.status === 'Delivered' ? '#10b981' :
                          activeOrder.status === 'On the way' ? '#3b82f6' :
                          activeOrder.status === 'Arrived' ? '#8b5cf6' : '#f97316',
                        marginRight: 10
                      }} />
                                    <Text style={{ 
                        fontWeight: 'bold',
                        fontSize: 17,
                        color: 
                          activeOrder.status === 'Delayed' ? '#b91c1c' : 
                          activeOrder.status === 'Delivered' ? '#047857' :
                          activeOrder.status === 'On the way' ? '#1d4ed8' :
                          activeOrder.status === 'Arrived' ? '#6d28d9' : '#c2410c',
                      }}>
                        {activeOrder.status || 'Processing'}
                                    </Text>
                      
                      <Feather 
                        name="edit-2" 
                        size={16} 
                        color={
                          activeOrder.status === 'Delayed' ? '#ef4444' : 
                          activeOrder.status === 'Delivered' ? '#10b981' :
                          activeOrder.status === 'On the way' ? '#3b82f6' :
                          activeOrder.status === 'Arrived' ? '#8b5cf6' : '#f97316'
                        } 
                        style={{ marginLeft: 10 }}
                      />
                    </TouchableOpacity>
                  </Animated.View>
                  
                  {/* Order Details */}
                  <Animated.View style={{
                            backgroundColor: 'white',
                            borderRadius: 16,
                    padding: 16,
                            marginBottom: 16,
                            shadowColor: '#0f172a',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.06,
                            shadowRadius: 4,
                            elevation: 2,
                            borderWidth: 1,
                    borderColor: '#f1f5f9',
                    transform: [{ 
                      translateY: modalOpacityAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [30, 0]
                      })
                    }],
                  }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>
                      Pickup & Delivery
                            </Text>
                            
                    <View style={{ marginBottom: 14 }}>
                              <Text style={{ color: '#64748b', fontSize: 14, marginBottom: 4 }}>
                                Pickup from
                              </Text>
                      <Text style={{ fontWeight: '600', color: '#0f172a', fontSize: 16 }}>
                        {activeOrder.restaurant?.name || 'Supermarket'}
                              </Text>
                      <Text style={{ color: '#334155', fontSize: 14 }}>
                        {activeOrder.restaurant?.address || 'Store location'}
                              </Text>
                            </View>
                            
                    <View style={{ flexDirection: 'row', marginVertical: 12, alignItems: 'center' }}>
                      <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
                            <View style={{ 
                        paddingHorizontal: 12, 
                        paddingVertical: 5, 
                        backgroundColor: '#f1f5f9', 
                        borderRadius: 12 
                      }}>
                        <Text style={{ color: '#64748b', fontSize: 13, fontWeight: '500' }}>
                          {activeOrder.route?.distance || '~'} away
                                </Text>
                              </View>
                      <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
                            </View>
                            
                    <View style={{ marginTop: 10 }}>
                      <Text style={{ color: '#64748b', fontSize: 14, marginBottom: 4 }}>
                        Delivery to
                            </Text>
                      <Text style={{ fontWeight: '600', color: '#0f172a', fontSize: 16 }}>
                        {activeOrder.customer?.name || 'Customer'}
                                  </Text>
                      <Text style={{ color: '#334155', fontSize: 14 }}>
                        {activeOrder.customer?.address || 'Address not available'}
                                </Text>
                              </View>
                  </Animated.View>
                  
                  {/* Timeline Section */}
                  <Animated.View style={{
                    backgroundColor: 'white',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                    shadowColor: '#0f172a',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.06,
                    shadowRadius: 4,
                    elevation: 2,
                    borderWidth: 1,
                    borderColor: '#f1f5f9',
                    transform: [{ 
                      translateY: modalOpacityAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [40, 0]
                      })
                    }],
                  }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 16 }}>
                      Timeline
                              </Text>
                    
                    {activeOrder.steps && activeOrder.steps.map((step, index) => renderTimelineStep(step, index, activeOrder.steps))}
                  </Animated.View>
                  
                  {/* Action Button */}
                              <TouchableOpacity
                                style={{
                                  backgroundColor: '#3b82f6',
                                  paddingVertical: 16,
                      borderRadius: 16,
                                  alignItems: 'center',
                      marginTop: 8,
                      marginBottom: 16,
                                  shadowColor: '#3b82f6',
                                  shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                                  shadowRadius: 8,
                      elevation: 4
                    }}
                    onPress={() => setEditingStatus(true)}
                    activeOpacity={0.85}
                  >
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                      Update Order Status
                                </Text>
                              </TouchableOpacity>
                </View>
              </ScrollView>
              
              {/* Status Selection Dropdown */}
              {editingStatus && (
                <Animated.View style={{
                  position: 'absolute',
                  top: '20%',
                  left: 16,
                  right: 16,
                  backgroundColor: 'white',
                  borderRadius: 24,
                  padding: 16,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.35,
                  shadowRadius: 16,
                  elevation: 10,
                                    borderWidth: 1,
                  borderColor: '#f8fafc',
                  opacity: modalOpacityAnim,
                  transform: [{ scale: modalScaleAnim }],
                }}>
                  <View style={{
                                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: 8,
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: '#f1f5f9',
                    marginBottom: 10
                  }}>
                    <Text style={{ 
                      fontWeight: 'bold', 
                      color: '#1e293b', 
                      fontSize: 18
                    }}>
                      Update Order Status
                                  </Text>
                                <TouchableOpacity
                      onPress={() => setEditingStatus(false)}
                                  style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: '#f1f5f9',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                    >
                      <Feather name="x" size={20} color="#64748b" />
                                </TouchableOpacity>
                  </View>
                              
                  <View style={{ paddingVertical: 8 }}>
                    {statusOptions.map((option, index) => (
                              <TouchableOpacity
                        key={index}
                        onPress={() => updateOrderStatus(option)}
                                style={{
                                  flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 16,
                          paddingHorizontal: 16,
                          backgroundColor: activeOrder.status === option ? 
                            (option === 'Delayed' ? '#fef2f2' : 
                             option === 'Delivered' ? '#f0fdf4' :
                             option === 'On the way' ? '#eff6ff' :
                             option === 'Arrived' ? '#f5f3ff' : '#fff7ed') : 
                            'transparent',
                          borderRadius: 12,
                          marginVertical: 5,
                          borderWidth: activeOrder.status === option ? 1 : 0,
                          borderColor: option === 'Delayed' ? '#fca5a5' : 
                                      option === 'Delivered' ? '#86efac' :
                                      option === 'On the way' ? '#93c5fd' :
                                      option === 'Arrived' ? '#c4b5fd' : '#fdba74',
                        }}
                        disabled={updatingStep === 'status-update'}
                        activeOpacity={0.7}
                      >
                        <View style={{
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: option === 'Delayed' ? '#ef4444' : 
                                      option === 'Delivered' ? '#10b981' :
                                      option === 'On the way' ? '#3b82f6' :
                                      option === 'Arrived' ? '#8b5cf6' : '#f97316',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 16
                        }}>
                          {activeOrder.status === option && (
                            <View style={{
                              width: 12,
                              height: 12,
                              borderRadius: 6,
                              backgroundColor: option === 'Delayed' ? '#ef4444' : 
                                option === 'Delivered' ? '#10b981' :
                                option === 'On the way' ? '#3b82f6' :
                                option === 'Arrived' ? '#8b5cf6' : '#f97316'
                            }} />
                          )}
                        </View>
                        <Text style={{ 
                          color: '#1e293b',
                          fontWeight: activeOrder.status === option ? '700' : '500',
                          fontSize: 16
                        }}>
                          {option}
                                </Text>
                        
                        {updatingStep === 'status-update' && option === activeOrder.status && (
                          <ActivityIndicator 
                            size="small" 
                            color="#3b82f6" 
                            style={{ marginLeft: 'auto' }} 
                          />
                        )}
                              </TouchableOpacity>
                    ))}
                            </View>
                            
                              <TouchableOpacity
                                style={{
                      backgroundColor: '#3b82f6',
                                  paddingVertical: 14,
                      borderRadius: 16,
                                  alignItems: 'center',
                      marginTop: 10,
                      shadowColor: '#3b82f6',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 4,
                      marginHorizontal: 8
                    }}
                    onPress={() => setEditingStatus(false)}
                    activeOpacity={0.85}
                  >
                    <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                      Close
                                </Text>
                              </TouchableOpacity>
                </Animated.View>
                            )}
                          </View>
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 }}>
              <ActivityIndicator size="large" color="#3b82f6" style={{ marginBottom: 20 }} />
              <Text style={{ color: '#64748b', fontSize: 16, textAlign: 'center' }}>
                Loading order details...
              </Text>
                        </View>
                      )}
        </SafeAreaView>
      </Modal>
      
      {/* Floating Action Button for Quick Status Update (Fallback) */}
      {activeOrder && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: 20,
            right: 20,
            backgroundColor: '#3b82f6',
            width: 60,
            height: 60,
            borderRadius: 30,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 6,
          }}
          onPress={() => setEditingStatus(true)}
        >
          <Feather name="edit-2" size={24} color="white" />
        </TouchableOpacity>
      )}
      
    </SafeAreaView>
  );
}

