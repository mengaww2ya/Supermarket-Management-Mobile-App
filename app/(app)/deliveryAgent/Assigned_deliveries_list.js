import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  ScrollView,
  Alert,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons, Feather, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import HomeHeader from '../../components/HomeHeader';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { db } from "../../../firebase/firebaseConfig";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  doc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { useAuth } from "../../context/authContext";

const { width, height } = Dimensions.get('window');

export default function AssignedDeliveriesList() {
  // Animation refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  
  // Add headerOpacity animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });
  
  // State variables
  const [searchQuery, setSearchQuery] = useState('');
  const [deliveries, setDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugMode, setDebugMode] = useState(false);
  const [debugInfo, setDebugInfo] = useState({});
  const debugTapCount = useRef(0);
  
  // Get authentication context
  const { user } = useAuth();
  
  // Animation for search bar
  const searchBarAnim = useRef(new Animated.Value(0)).current;
  
  // Fetch assigned deliveries from user's tasks collection
  const fetchDeliveries = useCallback(async () => {
    if (!user || !user.uid) {
      setError("You must be logged in to view assigned deliveries");
      setLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      setLoading(true);
      
      // Get tasks from user's collection that are in Pending or Assigned status
      const tasksRef = collection(db, `users/${user.uid}/tasks`);
      
      // Create queries with expanded status matching to handle case variations
      const pendingQuery = query(
        tasksRef, 
        where("status", "in", ["Pending", "pending", "PENDING"])
      );
      
      const assignedQuery = query(
        tasksRef, 
        where("status", "in", ["Assigned", "assigned", "ASSIGNED"])
      );
      
      // Try an alternative collection path if the first one fails
      let combinedDocs = [];
      let useAlternativePath = false;
      
      try {
        // Add a query to get all tasks regardless of status
        const allTasksQuery = query(tasksRef, limit(20));
        const allTasksSnapshot = await getDocs(allTasksQuery);
        
        if (allTasksSnapshot.docs.length > 0) {
          // Log what statuses actually exist
          const existingStatuses = allTasksSnapshot.docs.map(doc => {
            const data = doc.data();
            return data.status || 'undefined';
          });
          
          combinedDocs = allTasksSnapshot.docs;
        } else {
          // Execute original queries if no tasks found with the general query
          const [pendingSnapshot, assignedSnapshot] = await Promise.all([
            getDocs(pendingQuery),
            getDocs(assignedQuery)
          ]);
          
          // Combine results
          combinedDocs = [
            ...pendingSnapshot.docs,
            ...assignedSnapshot.docs
          ];
        }
      } catch (err) {
        useAlternativePath = true;
      }
      
      // If no results or error with primary path, try alternative path
      if (combinedDocs.length === 0 || useAlternativePath) {
        try {
          // Try alternative collection path - deliveries or orders
          const altTasksRef = collection(db, `users/${user.uid}/deliveries`);
          
          // Query all orders regardless of status
          const allOrdersQuery = query(altTasksRef, limit(20));
          const allOrdersSnapshot = await getDocs(allOrdersQuery);
          
          if (allOrdersSnapshot.docs.length > 0) {
            // Log what statuses actually exist
            const existingStatuses = allOrdersSnapshot.docs.map(doc => {
              const data = doc.data();
              return data.status || 'undefined';
            });
            
            combinedDocs = [...combinedDocs, ...allOrdersSnapshot.docs];
          } else {
            // Fall back to original filters if needed
            const altPendingQuery = query(
              altTasksRef, 
              where("status", "in", ["Pending", "pending", "PENDING"])
            );
            
            const altAssignedQuery = query(
              altTasksRef, 
              where("status", "in", ["Assigned", "assigned", "ASSIGNED"])
            );
            
            const [altPendingSnapshot, altAssignedSnapshot] = await Promise.all([
              getDocs(altPendingQuery),
              getDocs(altAssignedQuery)
            ]);
            
            // Add these results to our combined docs
            combinedDocs = [
              ...combinedDocs,
              ...altPendingSnapshot.docs,
              ...altAssignedSnapshot.docs
            ];
          }
        } catch (altErr) {
        }
      }
      
      if (combinedDocs.length === 0) {
        // Last resort - try without status filter to see if any documents exist
        try {
          const allTasksQuery = query(tasksRef, limit(10));
          const allTasksSnapshot = await getDocs(allTasksQuery);
          
          if (allTasksSnapshot.docs.length > 0) {
            // Log what statuses actually exist
            const existingStatuses = allTasksSnapshot.docs.map(doc => {
              const data = doc.data();
              return data.status || 'undefined';
            });
          }
        } catch (e) {
        }
        
        setDeliveries([]);
        setFilteredDeliveries([]);
        setLoading(false);
        setIsRefreshing(false);
        return;
      }
      
      // Process the deliveries
      const assignedDeliveries = combinedDocs
        .map(doc => {
          const data = doc.data();
          
          // Format timestamp for better display
          let assignedTime = 'Unknown';
          let createdAtDate = null;
          
          if (data.createdAt) {
            const date = new Date(data.createdAt.seconds * 1000);
            assignedTime = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            createdAtDate = date;
          }
          
          // Calculate estimated delivery time if not provided
          let estimatedArrival = 'N/A';
          if (data.estimatedArrival) {
            estimatedArrival = data.estimatedArrival;
          } else if (createdAtDate) {
            // Default: estimate delivery 45 minutes after creation
            const estDate = new Date(createdAtDate);
            estDate.setMinutes(estDate.getMinutes() + 45);
            estimatedArrival = estDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          }
          
          // Get the priority level or set default
          const priority = data.priority || 
                          (data.status === 'Pending' ? 'high' : 'medium');
          
          // Format the payment status correctly
          const isPaid = Boolean(data.isPaid);
          
          // Format the task data to match the UI expectations
          return {
            id: doc.id,
            rawData: data, // Store the original data for reference
            customer: {
              name: data.customerName || 'Customer',
              photo: data.customerPhoto || 'https://randomuser.me/api/portraits/lego/1.jpg',
              phone: data.customerPhone || 'No phone provided',
              address: data.deliveryAddress || 'No address provided'
            },
            orderDetails: {
              orderNumber: data.orderRef || data.orderId || doc.id.substring(0, 8),
              items: data.items?.length || 0,
              total: `${data.totalAmount || '0'} Birr`,
              paymentMethod: data.paymentMethod || 'Cash on Delivery',
              isPaid: isPaid
            },
            delivery: {
              status: data.status || 'Assigned',
              assignedTime: assignedTime,
              estimatedArrival: estimatedArrival,
              distance: data.distance || 'Unknown',
              route: {
                startPoint: data.pickup || 'Supermarket',
                endPoint: data.deliveryAddress || 'Destination'
              }
            },
            priority: priority,
            createdAt: data.createdAt // Keep the timestamp for sorting
          };
        })
        .sort((a, b) => {
          // First sort by priority (high > medium > low)
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
          
          if (priorityDiff !== 0) return priorityDiff;
          
          // Then sort by createdAt timestamp, newest first
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.seconds - a.createdAt.seconds;
        });
      
      setDeliveries(assignedDeliveries);
      setFilteredDeliveries(assignedDeliveries);
      
    } catch (error) {
      setError("Failed to load your assigned deliveries. Please try again.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);
  
  // Initialize animations on mount
  useEffect(() => {
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
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchDeliveries();
  }, [fetchDeliveries]);

  // Apply filters
  const applyFilters = useCallback((items, filter, query) => {
    let filtered = items || [];
    
    // Apply search filter
    if (query) {
      filtered = filtered.filter(item => 
        item.customer.name.toLowerCase().includes(query.toLowerCase()) ||
        item.orderDetails.orderNumber.toLowerCase().includes(query.toLowerCase()) ||
        item.customer.address.toLowerCase().includes(query.toLowerCase())
      );
    }
    
    // Apply status filter
    if (filter !== 'all') {
      if (filter === 'in-progress') {
        filtered = filtered.filter(item => 
          item.delivery.status === 'In Progress' || 
          item.delivery.status === 'Picked up' || 
          item.delivery.status === 'On The Way'
        );
      } else if (filter === 'new-orders') {
        filtered = filtered.filter(item => 
          item.delivery.status === 'Pending' || 
          item.delivery.status === 'Assigned'
        );
      } else if (filter === 'completed') {
        filtered = filtered.filter(item => 
          item.delivery.status === 'Delivered' || 
          item.delivery.status === 'Completed'
        );
      }
    }
    
    return filtered;
  }, []);

  // Filter deliveries when search query or filter changes
  useEffect(() => {
    const filtered = applyFilters(deliveries, activeFilter, searchQuery);
    setFilteredDeliveries(filtered);
  }, [deliveries, searchQuery, activeFilter, applyFilters]);

  // Handle filter selection
  const handleFilterSelect = useCallback((filter) => {
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Fallback
      }
    }
    
    setActiveFilter(filter);
  }, []);

  // Handle delivery selection for detail view
  const handleDeliverySelect = useCallback((delivery) => {
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Fallback
      }
    }
    
    setSelectedDelivery(delivery);
  }, []);
  
  // Close detail view
  const closeDetail = useCallback(() => {
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Fallback
      }
    }
    
    setSelectedDelivery(null);
  }, []);

  // Handle calling customer
  const handleCallCustomer = useCallback((delivery) => {
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Fallback if haptics not available
      }
    }
    
    const phoneNumber = delivery.customer.phone;
    
    if (phoneNumber === 'No phone provided') {
      Alert.alert(
        "No Phone Number",
        "This customer doesn't have a phone number provided.",
        [{ text: "OK" }]
      );
      return;
    }
    
      Alert.alert(
      "Call Customer",
      `Call ${delivery.customer.name} at ${phoneNumber}?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Call", 
            onPress: () => {
            // In a real app, this would use Linking to open the phone app
            alert(`Calling ${delivery.customer.name} at ${phoneNumber}`);
          }
        }
      ]
    );
  }, []);
  
  // Synchronize order status between delivery agent and customer
  const syncOrderStatusWithCustomer = async (orderId, orderData, newStatus) => {
    try {
      // Check if we have customer user ID and order ID for synchronization
      if (!orderData || !orderData.customerId || !orderData.orderId) {
        return;
      }
      
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
      }
      
      // Update the customer's order
      await updateDoc(customerOrderRef, updateData);
      
    } catch (error) {
      // Don't throw the error - this is a secondary operation that shouldn't fail the primary update
    }
  };

  // Handle accepting a delivery
  const handleAcceptDelivery = useCallback(async (delivery) => {
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Fallback if haptics not available
      }
    }
    
    if (!user || !user.uid) {
      Alert.alert("Error", "You must be logged in to accept deliveries");
      return;
    }
    
    try {
      // Update the delivery status to In Progress
      const taskRef = doc(db, `users/${user.uid}/tasks`, delivery.id);
      
      // Show loading indicator
      setLoading(true);
      
      // Show toast or loading indicator for status
      Alert.alert(
        "Updating Status", 
        "Accepting delivery, please wait...",
        [{ text: "OK", style: "cancel" }]
      );
      
      // Update task in Firestore
      await updateDoc(taskRef, {
        status: "In Progress",
        lastUpdated: serverTimestamp(),
        acceptedAt: serverTimestamp()
      });
      
      // Sync update with customer if possible
      await syncOrderStatusWithCustomer(
        delivery.id, 
        delivery.rawData, 
        "In Progress"
      );
      
      // Show success message
      Alert.alert(
        "Delivery Accepted",
        "You have successfully accepted this delivery.",
        [
          { 
            text: "View Order",
            onPress: () => {
              // Navigate to the order details page
              router.push("/deliveryAgent/Inprogress_Orders");
            } 
          },
          {
            text: "OK"
          }
        ]
      );
      
      // Refresh the list
      fetchDeliveries();
      
    } catch (error) {
      Alert.alert("Error", "Failed to accept delivery. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user, fetchDeliveries, syncOrderStatusWithCustomer]);

  // Format priority indicator
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return '#f87171';
      case 'medium': return '#fbbf24';
      case 'low': return '#60a5fa';
      default: return '#9ca3af';
    }
  };

  // Format payment status
  const getPaymentStatusColor = (isPaid) => {
    return isPaid ? '#10b981' : '#f97316';
  };
  
  const getPaymentStatusText = (isPaid) => {
    return isPaid ? 'Paid' : 'COD';
  };

  // Format status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'Assigned': return '#6366f1';
      case 'Pending': return '#f97316';
      case 'In Progress': return '#0ea5e9';
      case 'On The Way': return '#0ea5e9';
      case 'Picked up': return '#0ea5e9';
      case 'Delayed': return '#ef4444';
      case 'Delivered': return '#10b981';
      case 'Completed': return '#10b981';
      default: return '#64748b';
    }
  };

  // Render delivery card
  const renderDeliveryCard = useCallback(({ item, index }) => {
    const statusColor = getStatusColor(item.delivery.status);
    const priorityColor = getPriorityColor(item.priority);
    const paymentStatusColor = getPaymentStatusColor(item.orderDetails.isPaid);
    const paymentStatusText = getPaymentStatusText(item.orderDetails.isPaid);
    
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
    
    // Determine card entrance delay based on index
    const entranceDelay = index * 100;

    return (
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            { 
              translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
              })
            },
            { scale: cardScale }
          ],
          marginBottom: 16,
          marginHorizontal: 16
        }}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => handleDeliverySelect(item)}
          style={{
            backgroundColor: 'white',
            borderRadius: 16,
            overflow: 'hidden',
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 10,
            elevation: 4,
            borderWidth: 1,
            borderColor: '#f1f5f9'
          }}
        >
          {/* Priority Indicator */}
          <View style={{ 
                position: 'absolute',
            top: 12, 
            right: 12, 
            zIndex: 2,
            backgroundColor: priorityColor + '20',
                  paddingHorizontal: 10,
                  paddingVertical: 4,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: priorityColor + '30'
          }}>
            <Text style={{ 
              color: priorityColor, 
              fontSize: 12, 
              fontWeight: '600' 
            }}>
              {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)} Priority
                </Text>
              </View>
            
          {/* Top Section with Status */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#f1f5f9'
          }}>
                <Image
                  source={{ uri: item.customer.photo }}
                  style={{
                width: 50, 
                height: 50, 
                borderRadius: 25,
                    borderWidth: 2,
                borderColor: statusColor + '20'
                  }}
                />
                
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ 
                fontSize: 17, 
                fontWeight: 'bold', 
                color: '#0f172a',
                marginBottom: 2 
              }}>
                    {item.customer.name}
                  </Text>
                  
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="location-outline" size={14} color="#64748b" />
                <Text style={{ 
                  color: '#64748b', 
                  fontSize: 14, 
                  marginLeft: 3,
                  flex: 1 
                }} numberOfLines={1}>
                      {item.customer.address}
                    </Text>
                  </View>
                  </View>
                  
                  <View style={{ 
              backgroundColor: statusColor + '15',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 8,
              marginLeft: 8,
              borderWidth: 1,
              borderColor: statusColor + '30',
            }}>
                    <Text style={{ 
                color: statusColor, 
                      fontSize: 12, 
                fontWeight: '600' 
                    }}>
                {item.delivery.status}
                    </Text>
                </View>
              </View>
              
          {/* Middle Section - Order Info */}
          <View style={{ padding: 16, paddingTop: 12, paddingBottom: 14 }}>
              <View style={{ 
                flexDirection: 'row', 
              justifyContent: 'space-between',
              marginBottom: 12,
              alignItems: 'center'
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ 
                  fontSize: 14, 
                  fontWeight: '600', 
                  color: '#334155'
                }}>
                  Order #{item.orderDetails.orderNumber}
                </Text>
                  <View style={{ 
                  width: 4, 
                  height: 4, 
                  borderRadius: 2, 
                  backgroundColor: '#cbd5e1',
                  marginHorizontal: 8
                }} />
                <Text style={{ 
                  fontSize: 13, 
                  color: '#64748b'
                }}>
                  {item.orderDetails.items} {item.orderDetails.items === 1 ? 'item' : 'items'}
                </Text>
              </View>
                  
                  <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                backgroundColor: paymentStatusColor + '15',
                    paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
              }}>
                <View style={{ 
                  width: 6, 
                  height: 6, 
                  borderRadius: 3, 
                  backgroundColor: paymentStatusColor,
                  marginRight: 5
                }} />
                    <Text style={{ 
                      fontSize: 12, 
                      fontWeight: '600', 
                  color: paymentStatusColor 
                    }}>
                  {paymentStatusText}
                    </Text>
                </View>
              </View>
              
              <View style={{ 
                flexDirection: 'row', 
              justifyContent: 'space-between',
                    alignItems: 'center',
                backgroundColor: '#f8fafc', 
                padding: 12,
              borderRadius: 12,
            }}>
              <View style={{ alignItems: 'flex-start' }}>
                <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 3 }}>
                  Assigned
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="clock" size={14} color="#0f172a" />
                  <Text style={{ 
                    marginLeft: 5, 
                    color: '#0f172a', 
                    fontWeight: '600',
                    fontSize: 14
                  }}>
                    {item.delivery.assignedTime}
                  </Text>
                  </View>
                </View>
                
                  <View style={{ 
                height: 1, 
                width: 40, 
                backgroundColor: '#cbd5e1' 
              }} />
              
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 3 }}>
                  Expected
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Feather name="check-circle" size={14} color="#0f172a" />
                  <Text style={{ 
                    marginLeft: 5, 
                    color: '#0f172a', 
                    fontWeight: '600',
                    fontSize: 14
                  }}>
                    {item.delivery.estimatedArrival}
                  </Text>
                  </View>
              </View>
                </View>
                </View>
                
          {/* Bottom Section - Actions */}
                  <View style={{ 
            flexDirection: 'row', 
            borderTopWidth: 1, 
            borderTopColor: '#f1f5f9' 
          }}>
                <TouchableOpacity
                  style={{
                flex: 1, 
                paddingVertical: 12, 
                    justifyContent: 'center',
                    alignItems: 'center',
                flexDirection: 'row',
                backgroundColor: '#f8fafc'
                  }}
                  onPress={() => {
                handleCallCustomer(item);
                  }}
                >
              <Feather name="phone" size={16} color="#3b82f6" />
              <Text style={{ 
                marginLeft: 6, 
                color: '#3b82f6', 
                fontWeight: '600', 
                fontSize: 14 
              }}>
                Call
              </Text>
                </TouchableOpacity>
            
            <View style={{ width: 1, backgroundColor: '#f1f5f9' }} />
                
                {item.delivery.status === 'Pending' || item.delivery.status === 'Assigned' ? (
                <TouchableOpacity
                  style={{
                  flex: 1, 
                  paddingVertical: 12, 
                  justifyContent: 'center',
                    alignItems: 'center',
                  flexDirection: 'row',
                  backgroundColor: '#f8fafc'
                  }}
                  onPress={() => {
                  handleAcceptDelivery(item);
                }}
                  >
                <Feather name="check-circle" size={16} color="#10b981" />
                <Text style={{ 
                  marginLeft: 6, 
                  color: '#10b981', 
                  fontWeight: '600', 
                  fontSize: 14 
                }}>
                  Accept
                </Text>
                </TouchableOpacity>
                ) : item.delivery.status === 'Delivered' || item.delivery.status === 'Completed' ? (
                <TouchableOpacity
                  style={{
                  flex: 1, 
                  paddingVertical: 12, 
                  justifyContent: 'center',
                    alignItems: 'center',
                  flexDirection: 'row',
                  backgroundColor: '#f8fafc'
                    }}
                onPress={() => {
                  handleDeliverySelect(item);
                }}
                  >
                <Feather name="clipboard" size={16} color="#6366f1" />
                <Text style={{ 
                  marginLeft: 6, 
                  color: '#6366f1', 
                  fontWeight: '600', 
                  fontSize: 14 
                }}>
                  View Details
                </Text>
                </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={{
                  flex: 1, 
                  paddingVertical: 12, 
                  justifyContent: 'center',
                      alignItems: 'center',
                  flexDirection: 'row',
                  backgroundColor: '#f8fafc'
                    }}
                onPress={() => {
                  handleDeliverySelect(item);
                }}
                  >
                <Feather name="edit-2" size={16} color="#0ea5e9" />
                <Text style={{ 
                  marginLeft: 6, 
                  color: '#0ea5e9', 
                  fontWeight: '600', 
                  fontSize: 14 
                }}>
                  Update
                </Text>
                  </TouchableOpacity>
                )}
              </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }, [fadeAnim, cardScale, handleDeliverySelect, handleCallCustomer, handleAcceptDelivery]);

  // Collect debug info
  const collectDebugInfo = useCallback(async () => {
    if (!user || !user.uid) return;
    
    const debugData = {
      userId: user.uid,
      userEmail: user.email,
      timestamp: new Date().toISOString(),
      collections: {}
    };
    
    try {
      // Try to get collections information
      const paths = [
        `users/${user.uid}/tasks`,
        `users/${user.uid}/deliveries`,
        `users/${user.uid}/orders`,
        'orders',
        'deliveries',
        'tasks'
      ];
      
      for (const path of paths) {
        try {
          const colRef = collection(db, path);
          const snapshot = await getDocs(query(colRef, limit(5)));
          
          debugData.collections[path] = {
            exists: true,
            count: snapshot.size,
            sample: snapshot.docs.map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
                status: data.status,
                createdAt: data.createdAt,
                // Other relevant fields
                hasCustomerId: !!data.customerId,
                hasOrderId: !!data.orderId
              };
            })
          };
        } catch (e) {
          debugData.collections[path] = {
            exists: false,
            error: e.message
          };
        }
      }
    } catch (e) {
      debugData.error = e.message;
    }
    
    setDebugInfo(debugData);
  }, [user]);
  
  // Handle debug tap
  const handleDebugTap = useCallback(() => {
    debugTapCount.current += 1;
    
    if (debugTapCount.current >= 7) {
      // Activate debug mode after 7 taps
      setDebugMode(true);
      collectDebugInfo();
      
      // Reset counter
      debugTapCount.current = 0;
      
      // Vibrate to indicate debug mode activated
      if (Platform.OS === 'ios') {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
          // Fallback
        }
      }
    }
  }, [collectDebugInfo]);

  // Render empty state
  const renderEmptyState = useCallback(() => {
    return (
      <Animated.View 
        style={{
        flex: 1, 
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 32,
          opacity: fadeAnim,
          transform: [{ 
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
            })
          }],
        }}
      >
        <TouchableWithoutFeedback onPress={handleDebugTap}>
          <View style={{
            width: 150,
            height: 150,
            borderRadius: 75,
            backgroundColor: '#f1f5f9',
        justifyContent: 'center', 
        alignItems: 'center', 
            marginBottom: 24,
      }}>
            <LinearGradient
              colors={['#bfdbfe', '#93c5fd']}
          style={{ 
                width: 120,
                height: 120,
                borderRadius: 60,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#3b82f6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <FontAwesome5 
                name="box-open" 
                size={50} 
                color={debugMode ? "#ef4444" : "#3b82f6"} 
              />
            </LinearGradient>
          </View>
        </TouchableWithoutFeedback>
        
        <Text style={{ 
          fontSize: 22,
          fontWeight: 'bold', 
          color: '#1e293b',
          textAlign: 'center',
          marginBottom: 12,
        }}>
          {debugMode ? "Debug Mode Active" : "No Delivery Orders"}
        </Text>
        
        {debugMode ? (
          <ScrollView style={{
            maxHeight: 300,
            width: '100%',
            backgroundColor: '#0f172a',
            borderRadius: 12,
            padding: 12,
            marginBottom: 16
          }}>
            <Text style={{ color: '#f8fafc', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
              {JSON.stringify(debugInfo, null, 2)}
            </Text>
          </ScrollView>
        ) : (
          <>
        <Text style={{ 
              fontSize: 16,
          color: '#64748b',
          textAlign: 'center',
              marginBottom: 24,
              lineHeight: 24,
        }}>
              {error ? error : "You don't have any delivery orders at the moment. Check back soon for new orders."}
        </Text>
        
        {error ? (
              <Text style={{ 
                fontSize: 14,
                color: '#94a3b8',
                textAlign: 'center',
                marginBottom: 32,
                lineHeight: 20,
              }}>
                Try checking your connection or contact an administrator if this issue persists.
              </Text>
            ) : (
              <Text style={{ 
                fontSize: 14,
                color: '#94a3b8',
                textAlign: 'center',
                marginBottom: 32,
                lineHeight: 20,
              }}>
                If you believe there should be assigned deliveries, try refreshing or signing out and back in.
              </Text>
            )}
          </>
        )}
        
          <TouchableOpacity
            style={{
            backgroundColor: debugMode ? '#f43f5e' : '#3b82f6',
            paddingVertical: 14,
            paddingHorizontal: 24,
              borderRadius: 12,
              flexDirection: 'row',
            alignItems: 'center',
            shadowColor: debugMode ? '#f43f5e' : '#3b82f6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 3,
          }}
          onPress={debugMode ? () => setDebugMode(false) : handleRefresh}
        >
          <Feather 
            name={debugMode ? "x" : "refresh-cw"} 
            size={18} 
            color="white" 
            style={{ marginRight: 8 }} 
          />
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
            {debugMode ? "Exit Debug Mode" : "Refresh"}
          </Text>
          </TouchableOpacity>
      </Animated.View>
    );
  }, [fadeAnim, handleRefresh, error, debugMode, debugInfo, handleDebugTap]);

  // Handle toggling search bar
  const toggleSearch = () => {
    if (showSearch) {
      // If hiding search, clear the query
      setSearchQuery('');
      Animated.timing(searchBarAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true
      }).start(() => setShowSearch(false));
    } else {
      setShowSearch(true);
      Animated.timing(searchBarAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true
      }).start();
    }
    
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Fallback
      }
    }
  };

  // Render filter tab
  const renderFilterTab = useCallback((title, value) => {
    const isActive = activeFilter === value;
    
  return (
      <TouchableOpacity
        onPress={() => handleFilterSelect(value)}
        style={{
          paddingHorizontal: 16,
          paddingVertical: 8,
          backgroundColor: isActive ? '#3b82f6' : 'transparent',
          borderRadius: 20,
          marginRight: 8,
          borderWidth: isActive ? 0 : 1,
          borderColor: '#e2e8f0',
        }}
      >
        <Text style={{
          color: isActive ? 'white' : '#64748b',
          fontSize: 14,
          fontWeight: isActive ? '600' : '500',
        }}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  }, [activeFilter, handleFilterSelect]);

  // Render search bar
  const renderSearchBar = () => {
    if (!showSearch) return null;
    
    return (
        <Animated.View
          style={{
          marginHorizontal: 16,
          marginBottom: 12,
            opacity: searchBarAnim,
            transform: [
              { 
                translateY: searchBarAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0]
                })
            },
          ],
        }}
      >
        <View style={{
          flexDirection: 'row',
            backgroundColor: 'white',
            borderRadius: 12,
          paddingHorizontal: 12,
          paddingVertical: 4,
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#e2e8f0',
          shadowColor: '#64748b',
            shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 4,
            elevation: 2,
        }}>
          <Feather name="search" size={18} color="#94a3b8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by customer or order#"
            placeholderTextColor="#94a3b8"
            style={{
              flex: 1,
              paddingVertical: 10,
              paddingHorizontal: 8,
              color: '#0f172a',
              fontSize: 15,
            }}
            autoFocus
          />
          {searchQuery ? (
          <TouchableOpacity
              onPress={() => setSearchQuery('')}
            style={{
                padding: 6,
              }}
            >
              <Feather name="x" size={18} color="#94a3b8" />
          </TouchableOpacity>
          ) : null}
        </View>
      </Animated.View>
    );
  };
      
  // Render filter bar
  const renderFilterBar = () => (
      <View style={{ 
      flexDirection: 'row',
      paddingHorizontal: 16,
      marginTop: 8,
      marginBottom: 16,
    }}>
      {renderFilterTab('All', 'all')}
      {renderFilterTab('New Orders', 'new-orders')}
      {renderFilterTab('In Progress', 'in-progress')}
      {renderFilterTab('Completed', 'completed')}
      </View>
  );

  // Render delivery detail modal
  const renderDeliveryDetailModal = () => {
    if (!selectedDelivery) return null;
    
    const statusColor = getStatusColor(selectedDelivery.delivery.status);
    const priorityColor = getPriorityColor(selectedDelivery.priority);
    
    return (
      <TouchableWithoutFeedback onPress={() => setSelectedDelivery(null)}>
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          zIndex: 1000,
          }}>
            <TouchableWithoutFeedback>
            <Animated.View 
              style={{
                width: width * 0.9,
                maxHeight: height * 0.85,
                backgroundColor: 'white',
                borderRadius: 20,
                padding: 0,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.25,
                shadowRadius: 20,
                elevation: 10,
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              }}
            >
              {/* Header with gradient background */}
                  <LinearGradient
                colors={[statusColor + '20', '#f8fafc']}
                    start={[0, 0]}
                end={[0, 1]}
                    style={{
                  padding: 20,
                  borderBottomLeftRadius: 20,
                  borderBottomRightRadius: 20,
                    }}
                  >
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}>
                  <View style={{ flex: 1 }}>
                        <Text style={{ 
                      fontSize: 20, 
                          fontWeight: 'bold', 
                      color: '#0f172a',
                      marginBottom: 4,
                        }}>
                          Order #{selectedDelivery.orderDetails.orderNumber}
                        </Text>
                    
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                        backgroundColor: statusColor,
                        marginRight: 6,
                          }} />
                      <Text style={{ color: statusColor, fontWeight: '600' }}>
                            {selectedDelivery.delivery.status}
                          </Text>
                        </View>
                      </View>
                      
                      <TouchableOpacity 
                    onPress={() => setSelectedDelivery(null)}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                      backgroundColor: 'rgba(203, 213, 225, 0.4)',
                          justifyContent: 'center',
                      alignItems: 'center',
                        }}
                      >
                    <Feather name="x" size={20} color="#64748b" />
                      </TouchableOpacity>
                    </View>
                    
                      <View style={{
                        flexDirection: 'row',
                  marginTop: 16, 
                        alignItems: 'center'
                      }}>
                      <Image
                        source={{ uri: selectedDelivery.customer.photo }}
                        style={{ 
                          width: 60, 
                          height: 60, 
                          borderRadius: 30,
                      borderWidth: 2,
                      borderColor: '#fff',
                        }}
                      />
                      
                  <View style={{ marginLeft: 16, flex: 1 }}>
                        <Text style={{ 
                      fontSize: 18, 
                          fontWeight: 'bold', 
                      color: '#0f172a',
                      marginBottom: 2,
                        }}>
                          {selectedDelivery.customer.name}
                        </Text>
                        
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Feather name="phone" size={14} color="#64748b" />
                      <Text style={{ 
                        color: '#64748b', 
                        marginLeft: 6, 
                        fontSize: 14,
                      }}>
                            {selectedDelivery.customer.phone}
                          </Text>
                      </View>
                    </View>
                  </View>
              </LinearGradient>
              
              <ScrollView 
                style={{ maxHeight: height * 0.5 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Delivery details */}
                <View style={{ padding: 20 }}>
                  {/* Location info */}
                  <View style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                  }}>
                    <Text style={{ 
                      fontSize: 16, 
                      fontWeight: 'bold', 
                      marginBottom: 16,
                      color: '#0f172a',
                    }}>
                      Delivery Route
                    </Text>
                    
                    <View style={{ flexDirection: 'row', marginBottom: 16 }}>
                        <View style={{
                        width: 36, 
                        alignItems: 'center',
                        marginRight: 8,
                      }}>
                        <View style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          backgroundColor: '#3b82f6',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                          <Feather name="shopping-bag" size={14} color="white" />
                        </View>
                        
                        <View style={{
                          width: 2,
                          height: 30,
                          backgroundColor: '#e2e8f0',
                          marginVertical: 6,
                        }} />
                        
                        <View style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          backgroundColor: '#f43f5e',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}>
                          <Feather name="map-pin" size={14} color="white" />
                      </View>
                    </View>
                    
                      <View style={{ flex: 1 }}>
                    <View style={{ marginBottom: 16 }}>
                          <Text style={{ 
                            fontSize: 13, 
                            color: '#64748b',
                            marginBottom: 2, 
                          }}>
                            Pickup
                      </Text>
                          <Text style={{ 
                            fontSize: 15, 
                            fontWeight: '600',
                            color: '#0f172a', 
                          }}>
                            {selectedDelivery.delivery.route.startPoint}
                          </Text>
                        </View>
                        
                        <View>
                          <Text style={{ 
                            fontSize: 13, 
                            color: '#64748b',
                            marginBottom: 2, 
                          }}>
                            Destination
                          </Text>
                          <Text style={{ 
                            fontSize: 15, 
                            fontWeight: '600',
                            color: '#0f172a', 
                          }}>
                          {selectedDelivery.customer.address}
                        </Text>
                        </View>
                      </View>
                    </View>
                    
                    <View style={{ 
                      flexDirection: 'row', 
                      justifyContent: 'space-between',
                      borderTopWidth: 1,
                      borderTopColor: '#e2e8f0',
                      paddingTop: 14,
                    }}>
                      <View>
                        <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 2 }}>
                          Distance
                        </Text>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#0f172a' }}>
                          {selectedDelivery.delivery.distance}
                        </Text>
                      </View>
                      
                      <View>
                        <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 2 }}>
                          Est. Arrival
                        </Text>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#0f172a' }}>
                          {selectedDelivery.delivery.estimatedArrival}
                        </Text>
                      </View>
                    </View>
                  </View>
                  
                  {/* Order information */}
                  <View style={{
                    backgroundColor: '#f8fafc',
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 16,
                  }}>
                    <Text style={{ 
                      fontSize: 16, 
                      fontWeight: 'bold', 
                      marginBottom: 16,
                      color: '#0f172a',
                    }}>
                      Order Information
                    </Text>
                    
                    <View style={{ 
                      flexDirection: 'row', 
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}>
                      <Text style={{ color: '#64748b' }}>Order Items</Text>
                      <Text style={{ fontWeight: '600', color: '#0f172a' }}>
                        {selectedDelivery.orderDetails.items} {selectedDelivery.orderDetails.items === 1 ? 'item' : 'items'}
                      </Text>
                    </View>
                    
                    <View style={{ 
                      flexDirection: 'row', 
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}>
                      <Text style={{ color: '#64748b' }}>Payment Method</Text>
                      <Text style={{ fontWeight: '600', color: '#0f172a' }}>
                        {selectedDelivery.orderDetails.paymentMethod}
                      </Text>
                    </View>
                    
                    <View style={{ 
                      flexDirection: 'row', 
                      justifyContent: 'space-between',
                      marginBottom: 12,
                    }}>
                      <Text style={{ color: '#64748b' }}>Payment Status</Text>
                      <View style={{ 
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: selectedDelivery.orderDetails.isPaid ? '#dcfce7' : '#fee2e2',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 4,
                      }}>
                        <View style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: selectedDelivery.orderDetails.isPaid ? '#10b981' : '#ef4444',
                          marginRight: 4,
                        }} />
                        <Text style={{ 
                          fontSize: 12, 
                          fontWeight: '600',
                          color: selectedDelivery.orderDetails.isPaid ? '#10b981' : '#ef4444', 
                        }}>
                          {getPaymentStatusText(selectedDelivery.orderDetails.isPaid)}
                        </Text>
                      </View>
                    </View>
                    
                    <View style={{ 
                      flexDirection: 'row', 
                      justifyContent: 'space-between',
                      borderTopWidth: 1,
                      borderTopColor: '#e2e8f0',
                      paddingTop: 12,
                      marginTop: 4,
                    }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: '#64748b' }}>Total</Text>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0f172a' }}>
                        {selectedDelivery.orderDetails.total}
                      </Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
                  
              {/* Action buttons */}
                  <View style={{ 
                flexDirection: 'row',
                borderTopWidth: 1,
                borderTopColor: '#f1f5f9',
                paddingHorizontal: 16,
                paddingVertical: 16,
                  }}>
                    <TouchableOpacity
                      style={{
                    flex: 1,
                    backgroundColor: '#f1f5f9',
                    paddingVertical: 12,
                    borderRadius: 12,
                    marginRight: 8,
                    justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'row',
                      }}
                    onPress={() => {
                      setSelectedDelivery(null);
                      handleCallCustomer(selectedDelivery);
                    }}
                  >
                    <Feather name="phone" size={18} color="#3b82f6" />
                    <Text style={{ 
                      marginLeft: 8, 
                      fontWeight: '600', 
                      color: '#3b82f6',
                      fontSize: 15,
                    }}>
                      Call Customer
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      backgroundColor: '#3b82f6',
                      paddingVertical: 12,
                      borderRadius: 12,
                        justifyContent: 'center',
                      alignItems: 'center',
                      flexDirection: 'row',
                        shadowColor: '#3b82f6',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                        elevation: 3,
                        }}
                    onPress={() => {
                      setSelectedDelivery(null);
                      handleAcceptDelivery(selectedDelivery);
                    }}
                      >
                    <Feather name="check-circle" size={18} color="white" />
                    <Text style={{ 
                      marginLeft: 8, 
                      fontWeight: '600', 
                      color: 'white',
                      fontSize: 15,
                    }}>
                      Accept Delivery
                      </Text>
                    </TouchableOpacity>
                </View>
              </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  // Begin component return
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <Animated.View
                        style={{
          opacity: headerOpacity,
                          backgroundColor: '#f8fafc',
          paddingBottom: 8,
          shadowColor: '#64748b',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: scrollY.interpolate({
            inputRange: [0, 50],
            outputRange: [0, 0.1],
            extrapolate: 'clamp',
          }),
          shadowRadius: 8,
          elevation: scrollY.interpolate({
            inputRange: [0, 50],
            outputRange: [0, 2],
            extrapolate: 'clamp',
          }),
          zIndex: 10,
        }}
      >
        <View style={{
                          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 10,
        }}>
          <TouchableOpacity
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'white',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#64748b',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 1,
            }}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={22} color="#0f172a" />
                      </TouchableOpacity>
          
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            color: '#0f172a',
          }}>
            Delivery Orders
          </Text>
                      
                      <TouchableOpacity
                        style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: 'white',
              justifyContent: 'center',
                          alignItems: 'center',
              shadowColor: '#64748b',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 4,
              elevation: 1,
                        }}
            onPress={toggleSearch}
                      >
            <Feather name={showSearch ? "x" : "search"} size={20} color="#0f172a" />
                      </TouchableOpacity>
                    </View>
        
        {/* Search bar */}
        {renderSearchBar()}
        
        {/* Filter tabs */}
        {renderFilterBar()}
              </Animated.View>
      
      {loading && !isRefreshing ? (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f8fafc',
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
            elevation: 2,
          }}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
          
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#334155',
            marginBottom: 8,
          }}>
            Loading Deliveries
          </Text>
          
          <Text style={{
            color: '#64748b',
            textAlign: 'center',
            maxWidth: 250,
            fontSize: 15,
          }}>
            Fetching your assigned deliveries...
          </Text>
        </View>
      ) : (
        <Animated.FlatList
          data={filteredDeliveries}
          keyExtractor={item => item.id}
          renderItem={renderDeliveryCard}
          contentContainerStyle={{
            paddingTop: 10,
            paddingBottom: 40,
            flexGrow: filteredDeliveries.length === 0 ? 1 : undefined,
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
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
      )}
      
      {/* Delivery Detail Modal */}
      {selectedDelivery && renderDeliveryDetailModal()}
    </SafeAreaView>
  );
}
