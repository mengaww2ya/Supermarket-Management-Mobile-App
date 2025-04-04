import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Modal,
  Pressable,
  Platform,
  FlatList,
} from "react-native";
import { useRouter } from 'expo-router';
import { db } from '../../../firebase/firebaseConfig';
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, AntDesign, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';
import { BlurView } from 'expo-blur';
import HomeHeader from '../../components/HomeHeader';

export default function OrderManagement() {
  const router = useRouter();
  const { width, height } = Dimensions.get('window');
  
  // Orders state
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Delivery agent assignment state
  const [deliveryAgents, setDeliveryAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(false);
  
  // Analytics state
  const [analytics, setAnalytics] = useState({
    pending: 0,
    processing: 0,
    inTransit: 0,
    delivered: 0,
    cancelled: 0,
    totalSales: 0,
    todaySales: 0
  });
  
  // UI state
  const [searchFocused, setSearchFocused] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  
  // Refs
  const searchInputRef = useRef(null);
  
  useEffect(() => {
    fetchOrders();
  }, []);
  
  useEffect(() => {
    applyFilters();
  }, [orders, searchQuery, statusFilter, sortBy, sortOrder]);

  const menuItems = [
    { title: "Customer Orders", subtitle: "Process and track customer orders" },
    { title: "Manage Orders", subtitle: "Manage pending, completed, and canceled orders" },
    { title: "Returns & Refunds", subtitle: "Handle order returns and refunds" },
    { title: "Assign Delivery", subtitle: "Assign delivery agents to orders" },
    { title: "Notify Customers", subtitle: "Notify customers about order updates" },
  ];

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Get all users first
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      const ordersData = [];
      let pendingCount = 0;
      let processingCount = 0;
      let inTransitCount = 0;
      let deliveredCount = 0;
      let cancelledCount = 0;
      let totalSalesAmount = 0;
      let todaySalesAmount = 0;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayTimestamp = Timestamp.fromDate(today);
      
      // Get orders from dedicated orders collection
      const ordersRef = collection(db, 'orders');
      const ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'));
      const ordersSnapshot = await getDocs(ordersQuery);
      
      // Process orders from the main orders collection
      ordersSnapshot.forEach(doc => {
        const orderData = { id: doc.id, ...doc.data() };
        
        // Ensure order has a valid timestamp
        if (!orderData.createdAt) {
          orderData.createdAt = Timestamp.now();
        }
        
        // Make sure status is properly capitalized for consistency
        if (orderData.status) {
          orderData.status = orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1).toLowerCase();
        } else if (orderData.orderStatus) {
          // Handle cases where status might be stored as orderStatus
          orderData.status = orderData.orderStatus.charAt(0).toUpperCase() + orderData.orderStatus.slice(1).toLowerCase();
        } else {
          orderData.status = 'Pending'; // Default status
        }
        
        // Process status counts
        switch(orderData.status) {
          case 'Pending':
            pendingCount++;
            break;
          case 'Processing':
            processingCount++;
            break;
          case 'In Transit':
          case 'In transit':
            inTransitCount++;
            orderData.status = 'In Transit'; // Normalize case
            break;
          case 'Delivered':
            deliveredCount++;
            break;
          case 'Cancelled':
          case 'Canceled':
            cancelledCount++;
            orderData.status = 'Cancelled'; // Normalize spelling
            break;
        }
        
        // Calculate total sales (only for non-cancelled orders)
        if (orderData.status !== 'Cancelled' && orderData.status !== 'Canceled') {
          // Try to get amount from payment object first
          let orderTotal = 0;
          
          if (orderData.payment && orderData.payment.amount) {
            orderTotal = parseFloat(orderData.payment.amount);
          } 
          // Otherwise calculate from items
          else if (orderData.cartItems && orderData.cartItems.length > 0) {
            orderTotal = orderData.cartItems.reduce((sum, item) => 
              sum + (parseFloat(item.price) * (item.quantity || 1)), 0);
          }
          // If amount is directly on the order
          else if (orderData.totalAmount) {
            orderTotal = parseFloat(orderData.totalAmount);
          }
          
          totalSalesAmount += orderTotal;
          
          // Calculate today's sales
          if (orderData.createdAt && orderData.createdAt.toDate() >= todayTimestamp.toDate()) {
            todaySalesAmount += orderTotal;
          }
          
          // Set the calculated amount on the order object
          orderData.totalAmount = orderTotal.toFixed(2);
        }
        
        ordersData.push({
          ...orderData,
          formattedDate: orderData.createdAt ? 
            format(orderData.createdAt.toDate(), 'MMM dd, yyyy - h:mm a') : 
            'Unknown date'
        });
      });
      
      // For each user, check if they have orders subcollection
      const userOrderPromises = usersSnapshot.docs.map(async userDoc => {
        const userId = userDoc.id;
        const userData = userDoc.data();
        const userOrdersRef = collection(db, 'users', userId, 'orders');
        const userOrdersQuery = query(userOrdersRef, orderBy('createdAt', 'desc'));
        
        try {
          const userOrdersSnapshot = await getDocs(userOrdersQuery);
          
          // If user has orders, process them
          userOrdersSnapshot.forEach(orderDoc => {
            const orderData = { 
              id: orderDoc.id, 
              userId,
              customerName: userData.fullName || userData.name || userData.email || 'Unknown User',
              email: userData.email || 'N/A',
              phoneNumber: userData.phoneNumber || 'N/A',
              ...orderDoc.data() 
            };
            
            // Ensure order has a valid timestamp
            if (!orderData.createdAt) {
              orderData.createdAt = Timestamp.now();
            }
            
            // Handle cases where status might be stored in different properties or formats
            if (orderData.status) {
              orderData.status = orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1).toLowerCase();
            } else if (orderData.orderStatus) {
              orderData.status = orderData.orderStatus.charAt(0).toUpperCase() + orderData.orderStatus.slice(1).toLowerCase();
            } else {
              orderData.status = 'Pending'; // Default status
            }
            
            // Process status counts
            switch(orderData.status) {
              case 'Pending':
                pendingCount++;
                break;
              case 'Processing':
                processingCount++;
                break;
              case 'In Transit':
              case 'In transit':
                inTransitCount++;
                orderData.status = 'In Transit'; // Normalize case
                break;
              case 'Delivered':
                deliveredCount++;
                break;
              case 'Cancelled':
              case 'Canceled':
                cancelledCount++;
                orderData.status = 'Cancelled'; // Normalize spelling
                break;
            }
            
            // Calculate total sales (only for non-cancelled orders)
            if (orderData.status !== 'Cancelled' && orderData.status !== 'Canceled') {
              // Try to get amount from payment object first
              let orderTotal = 0;
              
              if (orderData.payment && orderData.payment.amount) {
                orderTotal = parseFloat(orderData.payment.amount);
              } 
              // Otherwise calculate from items
              else if (orderData.cartItems && orderData.cartItems.length > 0) {
                orderTotal = orderData.cartItems.reduce((sum, item) => 
                  sum + (parseFloat(item.price) * (item.quantity || 1)), 0);
              }
              // If amount is directly on the order
              else if (orderData.totalAmount) {
                orderTotal = parseFloat(orderData.totalAmount);
              }
              
              totalSalesAmount += orderTotal;
              
              // Calculate today's sales
              if (orderData.createdAt && orderData.createdAt.toDate() >= todayTimestamp.toDate()) {
                todaySalesAmount += orderTotal;
              }
              
              // Set the calculated amount on the order object
              orderData.totalAmount = orderTotal.toFixed(2);
            }
            
            ordersData.push({
              ...orderData,
              formattedDate: orderData.createdAt ? 
                format(orderData.createdAt.toDate(), 'MMM dd, yyyy - h:mm a') : 
                'Unknown date'
            });
          });
        } catch (error) {
          console.error(`Error fetching orders for user ${userId}:`, error);
        }
      });
      
      // Wait for all user order queries to complete
      await Promise.all(userOrderPromises);
      
      // Sort all orders by date
      ordersData.sort((a, b) => {
        const dateA = a.createdAt ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt ? b.createdAt.toDate() : new Date(0);
        return dateB - dateA;
      });
      
      setOrders(ordersData);
      setAnalytics({
        pending: pendingCount,
        processing: processingCount,
        inTransit: inTransitCount,
        delivered: deliveredCount,
        cancelled: cancelledCount,
        totalSales: totalSalesAmount.toFixed(2),
        todaySales: todaySalesAmount.toFixed(2)
      });
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };
  
  const applyFilters = () => {
    let filtered = [...orders];
    
    // Apply search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(order => 
        order.orderNumber?.toLowerCase().includes(query) ||
        order.customerName?.toLowerCase().includes(query) ||
        order.email?.toLowerCase().includes(query) ||
        order.phoneNumber?.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = a.createdAt ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt ? b.createdAt.toDate() : new Date(0);
        return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortBy === 'amount') {
        const amountA = parseFloat(a.totalAmount);
        const amountB = parseFloat(b.totalAmount);
        return sortOrder === 'asc' ? amountA - amountB : amountB - amountA;
      }
      return 0;
    });
    
    setFilteredOrders(filtered);
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        lastUpdated: serverTimestamp()
      });
      
      // Update local state
      const updatedOrders = orders.map(order => {
        if (order.id === orderId) {
          return { ...order, status: newStatus };
        }
        return order;
      });
      
      setOrders(updatedOrders);
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      
      Alert.alert('Success', `Order status updated to ${newStatus}`);
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status. Please try again.');
    }
  };
  
  const viewOrderDetails = (order) => {
    setSelectedOrder(order);
    setDetailModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  // Function to get color based on order status
  const getStatusColor = (status) => {
    switch(status) {
      case 'Pending':
        return '#F5A623';
      case 'Processing':
        return '#4A90E2';
      case 'In Transit':
        return '#8E44AD';
      case 'Delivered':
        return '#2ECC71';
      case 'Cancelled':
        return '#E74C3C';
      default:
        return '#95A5A6';
    }
  };
  
  // Fetch delivery agents
  const fetchDeliveryAgents = async () => {
    setLoadingAgents(true);
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef, 
        where('role', 'in', ['deliveryAgent', 'delivery'])
      );
      
      const querySnapshot = await getDocs(q);
      const agents = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setDeliveryAgents(agents);
    } catch (error) {
      console.error('Error fetching delivery agents:', error);
      Alert.alert('Error', 'Failed to load delivery agents. Please try again.');
    } finally {
      setLoadingAgents(false);
    }
  };
  
  // Assign order to delivery agent
  const assignDeliveryAgent = async () => {
    if (!selectedAgent || !selectedOrder) {
      Alert.alert('Error', 'Please select a delivery agent');
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // Check if order ID exists
      if (!selectedOrder.id) {
        console.error('Order ID is missing:', selectedOrder);
        Alert.alert('Error', 'Unable to identify the order. Please try again.');
        return;
      }
      
      console.log('Assigning order:', selectedOrder.id, 'to agent:', selectedAgent.id);
      
      // Create the timestamp here to ensure it's a proper Firestore timestamp
      const assignmentTimestamp = serverTimestamp();
      
      // Create assignment data
      const assignmentData = {
        deliveryAgent: {
          id: selectedAgent.id,
          name: selectedAgent.fullName || selectedAgent.name || selectedAgent.email || 'Delivery Agent',
          email: selectedAgent.email || '',
          phoneNumber: selectedAgent.phoneNumber || 'N/A',
          assignedAt: assignmentTimestamp
        },
        status: 'Processing', // Update order status to Processing
        lastUpdated: serverTimestamp(),
        // Add to status history if it exists
        ...(selectedOrder.orderStatusHistory ? {
          orderStatusHistory: [
            ...selectedOrder.orderStatusHistory,
            { 
              status: 'Processing', 
              timestamp: new Date(),
              note: `Assigned to delivery agent: ${selectedAgent.fullName || selectedAgent.name || selectedAgent.email || 'Delivery Agent'}`
            }
          ]
        } : {
          orderStatusHistory: [
            { 
              status: 'Processing', 
              timestamp: new Date(),
              note: `Assigned to delivery agent: ${selectedAgent.fullName || selectedAgent.name || selectedAgent.email || 'Delivery Agent'}`
            }
          ]
        })
      };
      
      // Update the order with the assigned delivery agent in main orders collection
      try {
        const orderRef = doc(db, 'orders', selectedOrder.id);
        await updateDoc(orderRef, assignmentData);
        console.log('Successfully updated order in main collection');
      } catch (error) {
        console.error('Error updating order in main collection:', error);
        // Continue and try user collection even if this fails
      }
      
      // Also update in user's orders collection if it exists there
      let userCollectionUpdateSuccess = false;
      if (selectedOrder.userId) {
        try {
          const userOrderRef = doc(db, `users/${selectedOrder.userId}/orders`, selectedOrder.id);
          await updateDoc(userOrderRef, assignmentData);
          userCollectionUpdateSuccess = true;
          console.log('Successfully updated order in user collection');
        } catch (error) {
          console.log('Order might not exist in user collection:', error);
          // Not critical if this fails
        }
      }
      
      // If neither update succeeded, show an error
      if (!userCollectionUpdateSuccess && selectedOrder.userId) {
        console.error('Failed to update order in both collections');
      }
      
      // Create task for delivery agent
      try {
        // Also create a task in the delivery agent's tasks collection
        const agentTasksRef = collection(db, `users/${selectedAgent.id}/tasks`);
        const taskData = {
          orderId: selectedOrder.id,
          orderRef: selectedOrder.orderRef || selectedOrder.orderNumber || selectedOrder.id.substring(0, 8),
          customerName: selectedOrder.customerDetails ? 
            `${selectedOrder.customerDetails.firstName} ${selectedOrder.customerDetails.lastName}` : 
            (selectedOrder.customerName || 'Customer'),
          deliveryAddress: selectedOrder.deliveryDetails?.address || selectedOrder.deliveryAddress || 'Address not provided',
          status: 'Pending',
          createdAt: serverTimestamp(),
          items: selectedOrder.cartItems || [],
          totalAmount: selectedOrder.totalAmount || '0',
          paymentMethod: selectedOrder.payment?.method || 'Unknown'
        };
        
        await addDoc(agentTasksRef, taskData);
        console.log('Successfully created task for delivery agent');
      } catch (error) {
        console.error('Error creating task for delivery agent:', error);
        // Not critical if this fails
      }
      
      // Update local state
      const updatedOrder = {
        ...selectedOrder, 
        status: 'Processing',
        deliveryAgent: assignmentData.deliveryAgent,
        orderStatusHistory: assignmentData.orderStatusHistory
      };
      
      // Update orders list
      const updatedOrders = orders.map(order => 
        order.id === selectedOrder.id ? updatedOrder : order
      );
      
      setOrders(updatedOrders);
      setFilteredOrders(prevFiltered => 
        prevFiltered.map(order => 
          order.id === selectedOrder.id ? updatedOrder : order
        )
      );
      setSelectedOrder(updatedOrder);
      
      // Close the assign modal
      setAssignModalVisible(false);
      setSelectedAgent(null);
      
      Alert.alert(
        'Success', 
        `Order assigned to ${selectedAgent.fullName || selectedAgent.name || selectedAgent.email || 'delivery agent'}`
      );
    } catch (error) {
      console.error('Error assigning delivery agent:', error);
      Alert.alert('Error', 'Failed to assign delivery agent. Please try again.');
    }
  };

  // Delivery Agent Assignment Modal
  const DeliveryAgentAssignModal = () => {
    if (!assignModalVisible) return null;
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={assignModalVisible}
        onRequestClose={() => setAssignModalVisible(false)}
      >
        <BlurView intensity={90} style={{ flex: 1 }} tint="dark">
          <View style={{ 
            flex: 1, 
            justifyContent: 'center',
            padding: 20
          }}>
            <View style={{
              backgroundColor: '#FFF',
              borderRadius: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 5,
              overflow: 'hidden'
            }}>
              <View style={{
                backgroundColor: '#4A90E2',
                padding: 15,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#FFF' }}>
                  Assign Delivery Agent
                </Text>
                <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
                  <AntDesign name="close" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
              
              <View style={{ padding: 20 }}>
                <Text style={{ fontSize: 16, color: '#333', marginBottom: 15 }}>
                  Select a delivery agent to assign to order #{selectedOrder?.orderRef || selectedOrder?.orderNumber || selectedOrder?.id.substring(0, 8)}
                </Text>
                
                {loadingAgents ? (
                  <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <ActivityIndicator size="large" color="#4A90E2" />
                    <Text style={{ marginTop: 10, color: '#555' }}>Loading delivery agents...</Text>
                  </View>
                ) : deliveryAgents.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <MaterialIcons name="person-search" size={50} color="#D9D9D9" />
                    <Text style={{ marginTop: 10, color: '#555', textAlign: 'center' }}>
                      No delivery agents found. Please add delivery agents to your system.
                    </Text>
                  </View>
                ) : (
                  <ScrollView style={{ maxHeight: 300 }}>
                    {deliveryAgents.map(agent => (
                      <TouchableOpacity
                        key={agent.id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          padding: 15,
                          borderRadius: 10,
                          marginBottom: 10,
                          backgroundColor: selectedAgent?.id === agent.id ? '#E9F2FF' : '#F5F5F5',
                          borderWidth: 1,
                          borderColor: selectedAgent?.id === agent.id ? '#4A90E2' : '#e0e0e0',
                        }}
                        onPress={() => setSelectedAgent(agent)}
                      >
                        <View style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          backgroundColor: '#4A90E2',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 10
                        }}>
                          {agent.profileUrl ? (
                            <Image
                              source={{ uri: agent.profileUrl }}
                              style={{ width: 40, height: 40, borderRadius: 20 }}
                            />
                          ) : (
                            <MaterialIcons name="person" size={24} color="#FFF" />
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ 
                            fontSize: 16, 
                            fontWeight: 'bold', 
                            color: '#333' 
                          }}>
                            {agent.fullName || agent.name || agent.email}
                          </Text>
                          <Text style={{ color: '#666', fontSize: 14 }}>
                            {agent.phoneNumber || 'No phone number'}
                          </Text>
                        </View>
                        {selectedAgent?.id === agent.id && (
                          <MaterialIcons name="check-circle" size={24} color="#4A90E2" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      marginRight: 10,
                      padding: 15,
                      borderRadius: 10,
                      backgroundColor: '#f8f9fa',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#e0e0e0'
                    }}
                    onPress={() => setAssignModalVisible(false)}
                  >
                    <Text style={{ color: '#333', fontWeight: '500' }}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      marginLeft: 10,
                      padding: 15,
                      borderRadius: 10,
                      backgroundColor: selectedAgent ? '#4A90E2' : '#e0e0e0',
                      alignItems: 'center'
                    }}
                    disabled={!selectedAgent}
                    onPress={assignDeliveryAgent}
                  >
                    <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Assign</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </BlurView>
      </Modal>
    );
  };

  // Order Detail Modal
  const OrderDetailModal = () => {
    if (!selectedOrder) return null;
    
    // Helper function to format price
    const formatPrice = (price) => {
      return parseFloat(price).toFixed(2);
    };
    
    // Helper function to format assignment date
    const formatAssignmentDate = (timestamp) => {
      if (!timestamp) return 'N/A';
      
      try {
        // Handle Firestore timestamp
        if (timestamp && typeof timestamp.toDate === 'function') {
          return timestamp.toDate().toLocaleString();
        }
        
        // Handle JavaScript Date object
        if (timestamp instanceof Date) {
          return timestamp.toLocaleString();
        }
        
        // Handle timestamp as a number (seconds or milliseconds)
        if (typeof timestamp === 'number') {
          return new Date(timestamp * (timestamp < 10000000000 ? 1000 : 1)).toLocaleString();
        }
        
        // Handle string representation
        if (typeof timestamp === 'string' && !isNaN(Date.parse(timestamp))) {
          return new Date(timestamp).toLocaleString();
        }
        
        return 'Unknown date format';
      } catch (error) {
        console.log('Error formatting date:', error);
        return 'Error with date';
      }
    };
    
    // Calculate order summary
    const calculateOrderSummary = () => {
      if (!selectedOrder.cartItems || selectedOrder.cartItems.length === 0) {
        return {
          subtotal: '0.00',
          deliveryFee: '0.00',
          total: selectedOrder.totalAmount || '0.00'
        };
      }
      
      // If payment has detailed breakdown
      if (selectedOrder.payment) {
        return {
          subtotal: formatPrice(selectedOrder.payment.subtotal || 0),
          deliveryFee: formatPrice(selectedOrder.payment.deliveryFee || 0),
          total: formatPrice(selectedOrder.payment.amount || selectedOrder.totalAmount || 0)
        };
      }
      
      // Calculate from items if payment details aren't available
      const subtotal = selectedOrder.cartItems.reduce(
        (sum, item) => sum + (parseFloat(item.price) * item.quantity), 0
      );
      
      // Estimate delivery fee if it's not directly provided
      const deliveryFee = selectedOrder.deliveryFee || 
                         (selectedOrder.payment?.deliveryFee) || 
                         0;
      
      return {
        subtotal: formatPrice(subtotal),
        deliveryFee: formatPrice(deliveryFee),
        total: formatPrice(subtotal + parseFloat(deliveryFee))
      };
    };
    
    const summary = calculateOrderSummary();
    
    // Get payment method label
    const getPaymentMethodLabel = () => {
      if (!selectedOrder.payment || !selectedOrder.payment.method) {
        return 'Unknown';
      }
      
      const method = selectedOrder.payment.method;
      
      switch(method) {
        case 'cashOnDelivery':
          return 'Cash on Delivery';
        case 'chapa':
          return selectedOrder.payment.provider 
            ? `Chapa - ${selectedOrder.payment.provider}` 
            : 'Online Payment';
        default:
          return method.charAt(0).toUpperCase() + method.slice(1);
      }
    };
    
    const handleAssignDelivery = () => {
      fetchDeliveryAgents();
      setAssignModalVisible(true);
    };
    
    // Check if the order is already assigned to a delivery agent
    const isAssignedToDeliveryAgent = selectedOrder.deliveryAgent && selectedOrder.deliveryAgent.id;
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={detailModalVisible}
        onRequestClose={() => setDetailModalVisible(false)}
      >
        <BlurView intensity={90} style={{ flex: 1 }} tint="dark">
          <View style={{ 
            flex: 1, 
            marginTop: 40,
            marginBottom: 20,
            marginHorizontal: 15,
            backgroundColor: '#FFF',
            borderRadius: 20,
            overflow: 'hidden',
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3.84,
            elevation: 4,
            borderWidth: 1,
            borderColor: '#e0e0e0'
          }}>
            <View
              style={{
                height: 60,
                paddingHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#f8f9fa',
                borderBottomWidth: 1,
                borderBottomColor: '#e0e0e0'
              }}
            >
              <Text style={{ color: '#333', fontSize: 18, fontWeight: 'bold' }}>
                Order #{selectedOrder.orderRef || selectedOrder.orderNumber}
              </Text>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
                <AntDesign name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Order Info */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' }}>
                  Order Information
                </Text>
                <View style={{ 
                  backgroundColor: '#F5F5F5', 
                  padding: 15, 
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#e0e0e0' 
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={{ fontWeight: '500', color: '#757575' }}>Date</Text>
                    <Text style={{ color: '#333' }}>{selectedOrder.formattedDate}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={{ fontWeight: '500', color: '#757575' }}>Total Amount</Text>
                    <Text style={{ fontWeight: 'bold', color: '#333' }}>{selectedOrder.totalAmount} Birr</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={{ fontWeight: '500', color: '#757575' }}>Payment Method</Text>
                    <Text style={{ color: '#333' }}>{getPaymentMethodLabel()}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontWeight: '500', color: '#757575' }}>Status</Text>
                    <View style={{ 
                      backgroundColor: getStatusColor(selectedOrder.status) + '15',
                      paddingHorizontal: 10,
                      paddingVertical: 2,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: getStatusColor(selectedOrder.status) + '30'
                    }}>
                      <Text style={{ color: getStatusColor(selectedOrder.status), fontWeight: '500' }}>
                        {selectedOrder.status}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Customer Info */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' }}>
                  Customer Information
                </Text>
                <View style={{ 
                  backgroundColor: '#F5F5F5', 
                  padding: 15, 
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#e0e0e0' 
                }}>
                  <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                    <MaterialIcons name="person" size={20} color="#757575" style={{ marginRight: 10 }} />
                    {selectedOrder.customerDetails ? (
                      <Text style={{ color: '#333' }}>
                        {selectedOrder.customerDetails.firstName} {selectedOrder.customerDetails.lastName}
                      </Text>
                    ) : (
                      <Text style={{ color: '#333' }}>{selectedOrder.customerName || 'N/A'}</Text>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                    <MaterialIcons name="email" size={20} color="#757575" style={{ marginRight: 10 }} />
                    <Text style={{ color: '#333' }}>
                      {selectedOrder.customerDetails?.email || selectedOrder.email || 'N/A'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row' }}>
                    <MaterialIcons name="phone" size={20} color="#757575" style={{ marginRight: 10 }} />
                    <Text style={{ color: '#333' }}>
                      {selectedOrder.customerDetails?.phoneNumber || selectedOrder.phoneNumber || 'N/A'}
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Delivery Info */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' }}>
                  Delivery Information
                </Text>
                <View style={{ 
                  backgroundColor: '#F5F5F5', 
                  padding: 15, 
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#e0e0e0' 
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
                    <MaterialIcons name="location-on" size={20} color="#757575" style={{ marginRight: 10 }} />
                    {selectedOrder.deliveryDetails ? (
                      <Text style={{ color: '#333' }}>
                        {selectedOrder.deliveryDetails.address || 'No address provided'}
                      </Text>
                    ) : (
                      <Text style={{ color: '#333' }}>{selectedOrder.deliveryAddress || 'N/A'}</Text>
                    )}
                  </View>
                  
                  {(selectedOrder.deliveryDetails?.notes || selectedOrder.locationNote) && (
                    <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                      <MaterialIcons name="note" size={20} color="#757575" style={{ marginRight: 10 }} />
                      <Text style={{ color: '#333' }}>
                        {selectedOrder.deliveryDetails?.notes || selectedOrder.locationNote}
                      </Text>
                    </View>
                  )}
                  
                  <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                    <MaterialIcons name="delivery-dining" size={20} color="#757575" style={{ marginRight: 10 }} />
                    <Text style={{ color: '#333' }}>{selectedOrder.deliveryMethod || 'Standard Delivery'}</Text>
                  </View>
                </View>
              </View>
              
              {/* Order Items */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' }}>
                  Order Items
                </Text>
                {selectedOrder.cartItems?.map((item, index) => (
                  <View key={index} style={{ 
                    backgroundColor: '#F5F5F5', 
                    padding: 15, 
                    borderRadius: 12,
                    marginBottom: 10,
                    flexDirection: 'row',
                    borderWidth: 1,
                    borderColor: '#e0e0e0'
                  }}>
                    {item.imageUrl && (
                      <Image 
                        source={{ uri: item.imageUrl }} 
                        style={{ width: 50, height: 50, borderRadius: 8, marginRight: 15 }} 
                        resizeMode="cover"
                      />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: 'bold', color: '#333' }}>{item.name}</Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 }}>
                        <Text style={{ color: '#757575' }}>
                          {item.price} Birr × {item.quantity}
                        </Text>
                        <Text style={{ fontWeight: '500', color: '#333' }}>
                          {(parseFloat(item.price) * item.quantity).toFixed(2)} Birr
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
                
                {/* Order Summary */}
                <View style={{ 
                  backgroundColor: '#F5F5F5', 
                  padding: 15, 
                  borderRadius: 12,
                  marginTop: 10,
                  borderWidth: 1,
                  borderColor: '#e0e0e0'
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: '#757575' }}>Subtotal</Text>
                    <Text style={{ color: '#333' }}>{summary.subtotal} Birr</Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ color: '#757575' }}>Delivery Fee</Text>
                    <Text style={{ color: '#333' }}>{summary.deliveryFee} Birr</Text>
                  </View>
                  
                  <View style={{ 
                    flexDirection: 'row', 
                    justifyContent: 'space-between',
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: '#e0e0e0'
                  }}>
                    <Text style={{ fontWeight: 'bold', color: '#333' }}>Total</Text>
                    <Text style={{ fontWeight: 'bold', color: '#333' }}>{summary.total} Birr</Text>
                  </View>
                </View>
              </View>
              
              {/* Payment Status */}
              {selectedOrder.payment && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' }}>
                    Payment Information
                  </Text>
                  <View style={{ 
                    backgroundColor: '#F5F5F5', 
                    padding: 15, 
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#e0e0e0'
                  }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                      <Text style={{ fontWeight: '500', color: '#757575' }}>Payment Method</Text>
                      <Text style={{ color: '#333' }}>{getPaymentMethodLabel()}</Text>
                    </View>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                      <Text style={{ fontWeight: '500', color: '#757575' }}>Payment Status</Text>
                      <View style={{ 
                        backgroundColor: 
                          selectedOrder.payment.status === 'completed' ? 'rgba(46, 204, 113, 0.1)' :
                          selectedOrder.payment.status === 'pending' ? 'rgba(245, 166, 35, 0.1)' : 
                          'rgba(231, 76, 60, 0.1)',
                        paddingHorizontal: 10,
                        paddingVertical: 2,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: 
                          selectedOrder.payment.status === 'completed' ? 'rgba(46, 204, 113, 0.3)' :
                          selectedOrder.payment.status === 'pending' ? 'rgba(245, 166, 35, 0.3)' : 
                          'rgba(231, 76, 60, 0.3)',
                      }}>
                        <Text style={{ 
                          color: 
                            selectedOrder.payment.status === 'completed' ? '#2ECC71' :
                            selectedOrder.payment.status === 'pending' ? '#F5A623' : 
                            '#E74C3C',
                          fontWeight: '500'
                        }}>
                          {selectedOrder.payment.status.charAt(0).toUpperCase() + selectedOrder.payment.status.slice(1)}
                        </Text>
                      </View>
                    </View>
                    
                    {selectedOrder.payment.transactionId && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontWeight: '500', color: '#757575' }}>Transaction ID</Text>
                        <Text style={{ color: '#333', fontSize: 13 }}>{selectedOrder.payment.transactionId}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}
              
              {/* Delivery Agent Section (if assigned) */}
              {isAssignedToDeliveryAgent && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' }}>
                    Assigned Delivery Agent
                  </Text>
                  <View style={{ 
                    backgroundColor: '#F5F5F5', 
                    padding: 15, 
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#e0e0e0' 
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                      <MaterialIcons name="person" size={20} color="#4A90E2" style={{ marginRight: 10 }} />
                      <Text style={{ color: '#333', fontWeight: '500' }}>
                        {selectedOrder.deliveryAgent.name || 'Delivery Agent'}
                      </Text>
                    </View>
                    {selectedOrder.deliveryAgent.phoneNumber && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <MaterialIcons name="phone" size={20} color="#757575" style={{ marginRight: 10 }} />
                        <Text style={{ color: '#333' }}>{selectedOrder.deliveryAgent.phoneNumber}</Text>
                      </View>
                    )}
                    {selectedOrder.deliveryAgent.email && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                        <MaterialIcons name="email" size={20} color="#757575" style={{ marginRight: 10 }} />
                        <Text style={{ color: '#333' }}>{selectedOrder.deliveryAgent.email}</Text>
                      </View>
                    )}
                    <View style={{ 
                      marginTop: selectedOrder.deliveryAgent.email ? 0 : 10, 
                      paddingTop: selectedOrder.deliveryAgent.email ? 0 : 10, 
                      borderTopWidth: selectedOrder.deliveryAgent.email ? 0 : 1, 
                      borderTopColor: '#e0e0e0' 
                    }}>
                      <Text style={{ color: '#757575', fontSize: 12 }}>
                        Assigned on {formatAssignmentDate(selectedOrder.deliveryAgent.assignedAt)}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
              
              {/* Update Status */}
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' }}>
                  Update Order Status
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  {['Pending', 'Processing', 'In Transit', 'Delivered', 'Cancelled'].map(status => (
                    <TouchableOpacity
                      key={status}
                      onPress={() => updateOrderStatus(selectedOrder.id, status)}
                      style={{ 
                        backgroundColor: selectedOrder.status === status ? 
                          getStatusColor(status) + '15' : '#F5F5F5',
                        paddingVertical: 10,
                        paddingHorizontal: 12,
                        borderRadius: 8,
                        margin: 5,
                        minWidth: '45%',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: selectedOrder.status === status ? 
                          getStatusColor(status) + '30' : '#e0e0e0'
                      }}
                      disabled={selectedOrder.status === status}
                    >
                      <Text style={{ 
                        color: selectedOrder.status === status ? 
                          getStatusColor(status) : '#555',
                        fontWeight: '500'
                      }}>
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* Assign to Delivery Agent button */}
              {!isAssignedToDeliveryAgent && (
                <TouchableOpacity
                  onPress={handleAssignDelivery}
                  style={{
                    backgroundColor: '#4A90E2',
                    paddingVertical: 15,
                    borderRadius: 12,
                    alignItems: 'center',
                    marginBottom: 20,
                    flexDirection: 'row',
                    justifyContent: 'center'
                  }}
                >
                  <MaterialIcons name="delivery-dining" size={24} color="#FFF" style={{ marginRight: 10 }} />
                  <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>
                    Assign to Delivery Agent
                  </Text>
                </TouchableOpacity>
              )}
              
              {/* Order Status History */}
              {selectedOrder.orderStatusHistory && selectedOrder.orderStatusHistory.length > 0 && (
                <View style={{ marginBottom: 20 }}>
                  <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10, color: '#333' }}>
                    Order Status History
                  </Text>
                  <View style={{ 
                    backgroundColor: '#F5F5F5', 
                    padding: 15, 
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: '#e0e0e0'
                  }}>
                    {selectedOrder.orderStatusHistory.map((statusItem, index) => {
                      const statusDate = statusItem.timestamp instanceof Date ? 
                        statusItem.timestamp : 
                        (statusItem.timestamp?.toDate ? statusItem.timestamp.toDate() : new Date());
                      
                      return (
                        <View key={index} style={{ 
                          flexDirection: 'row', 
                          marginBottom: index === selectedOrder.orderStatusHistory.length - 1 ? 0 : 10,
                          alignItems: 'center' 
                        }}>
                          <View style={{
                            width: 10,
                            height: 10,
                            borderRadius: 5,
                            backgroundColor: getStatusColor(statusItem.status),
                            marginRight: 10
                          }} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: '500', color: '#333' }}>
                              {statusItem.status.charAt(0).toUpperCase() + statusItem.status.slice(1)}
                            </Text>
                            <Text style={{ fontSize: 12, color: '#757575' }}>
                              {statusDate.toLocaleString()}
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </BlurView>
      </Modal>
    );
  };

  // Analytics Component
  const AnalyticsSection = () => {
    // Calculate sales growth
    const calculateGrowth = () => {
      const todaySales = parseFloat(analytics.todaySales);
      const totalSales = parseFloat(analytics.totalSales);
      
      if (totalSales === 0 || todaySales === 0) return 0;
      
      // Simple percentage calculation (today's sales as percentage of total)
      return Math.round((todaySales / totalSales) * 100);
    };
    
    const growth = calculateGrowth();
    
    // Calculate completion rate based on order status counts
    const completionRate = () => {
      const total = analytics.pending + analytics.processing + analytics.inTransit + analytics.delivered + analytics.cancelled;
      if (total === 0) return 0;
      return Math.round((analytics.delivered / total) * 100);
    };
    
    return (
      <View style={{ marginHorizontal: 15, marginBottom: 20 }}>
        <Text style={{ color: '#333', fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
          Order Analytics
        </Text>
        
        <LinearGradient
          colors={['#f8f9fa', '#e9ecef']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            borderRadius: 15,
            padding: 15,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 3,
            borderWidth: 1,
            borderColor: '#e0e0e0',
            marginBottom: 15
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
            <View style={{ alignItems: 'flex-start' }}>
              <Text style={{ color: '#666', fontSize: 12, marginBottom: 2 }}>Today's Sales</Text>
              <Text style={{ color: '#333', fontSize: 20, fontWeight: 'bold' }}>
                {analytics.todaySales} Birr
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <MaterialIcons 
                  name={growth >= 0 ? "arrow-upward" : "arrow-downward"} 
                  size={12} 
                  color={growth >= 0 ? "#2ECC71" : "#E74C3C"} 
                />
                <Text style={{ 
                  fontSize: 11, 
                  color: growth >= 0 ? "#2ECC71" : "#E74C3C",
                  marginLeft: 2
                }}>
                  {growth}% {growth >= 0 ? "of total" : "decrease"}
                </Text>
              </View>
            </View>
            
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: '#666', fontSize: 12, marginBottom: 2 }}>Total Sales</Text>
              <Text style={{ color: '#333', fontSize: 20, fontWeight: 'bold' }}>
                {analytics.totalSales} Birr
              </Text>
              <Text style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                All time sales
              </Text>
            </View>
          </View>
          
          {/* Add completion rate bar */}
          <View style={{ marginBottom: 15 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
              <Text style={{ color: '#666', fontSize: 12 }}>Orders Completion Rate</Text>
              <Text style={{ color: '#333', fontSize: 12, fontWeight: '500' }}>{completionRate()}%</Text>
            </View>
            <View style={{ 
              height: 6, 
              backgroundColor: '#F5F5F5',
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <View style={{ 
                height: '100%', 
                width: `${completionRate()}%`, 
                backgroundColor: '#4A90E2',
                borderRadius: 3
              }} />
            </View>
          </View>
          
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ 
              flex: 1,
              backgroundColor: 'rgba(245, 166, 35, 0.1)', 
              borderRadius: 10, 
              paddingVertical: 8,
              paddingHorizontal: 12,
              marginRight: 5,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(245, 166, 35, 0.2)'
            }}>
              <Text style={{ color: '#F5A623', fontSize: 16, fontWeight: 'bold' }}>{analytics.pending}</Text>
              <Text style={{ color: '#666', fontSize: 12 }}>Pending</Text>
            </View>
            <View style={{ 
              flex: 1,
              backgroundColor: 'rgba(74, 144, 226, 0.1)', 
              borderRadius: 10, 
              paddingVertical: 8,
              paddingHorizontal: 12,
              marginHorizontal: 5,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(74, 144, 226, 0.2)'
            }}>
              <Text style={{ color: '#4A90E2', fontSize: 16, fontWeight: 'bold' }}>{analytics.processing}</Text>
              <Text style={{ color: '#666', fontSize: 12 }}>Processing</Text>
            </View>
            <View style={{ 
              flex: 1,
              backgroundColor: 'rgba(142, 68, 173, 0.1)', 
              borderRadius: 10, 
              paddingVertical: 8,
              paddingHorizontal: 12,
              marginHorizontal: 5,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(142, 68, 173, 0.2)'
            }}>
              <Text style={{ color: '#8E44AD', fontSize: 16, fontWeight: 'bold' }}>{analytics.inTransit}</Text>
              <Text style={{ color: '#666', fontSize: 12 }}>In Transit</Text>
            </View>
            <View style={{ 
              flex: 1,
              backgroundColor: 'rgba(46, 204, 113, 0.1)', 
              borderRadius: 10, 
              paddingVertical: 8,
              paddingHorizontal: 12,
              marginLeft: 5,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(46, 204, 113, 0.2)'
            }}>
              <Text style={{ color: '#2ECC71', fontSize: 16, fontWeight: 'bold' }}>{analytics.delivered}</Text>
              <Text style={{ color: '#666', fontSize: 12 }}>Delivered</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };
  
  // Search and Filter Bar
  const SearchBar = () => (
    <View style={{ 
      marginHorizontal: 15, 
      marginBottom: 15,
      borderRadius: 10,
      backgroundColor: '#F5F5F5',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 15,
      paddingVertical: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
      borderWidth: 1,
      borderColor: '#e0e0e0'
    }}>
      <AntDesign name="search1" size={20} color="#757575" style={{ marginRight: 10 }} />
      <TextInput
        ref={searchInputRef}
        style={{ 
          flex: 1, 
          height: 40,
          fontSize: 16,
          color: '#333'
        }}
        placeholder="Search orders..."
        placeholderTextColor="#999"
        value={searchQuery}
        onChangeText={setSearchQuery}
        onFocus={() => setSearchFocused(true)}
        onBlur={() => setSearchFocused(false)}
      />
      {searchQuery !== '' && (
        <TouchableOpacity onPress={() => setSearchQuery('')}>
          <AntDesign name="close" size={20} color="#757575" />
        </TouchableOpacity>
      )}
      <TouchableOpacity 
        style={{ marginLeft: 10 }}
        onPress={() => setFilterVisible(!filterVisible)}
      >
        <MaterialCommunityIcons 
          name="filter-variant" 
          size={24} 
          color={filterVisible ? '#4A90E2' : '#757575'} 
        />
      </TouchableOpacity>
    </View>
  );
  
  // Filter Options
  const FilterOptions = () => {
    if (!filterVisible) return null;
    
    const handleStatusSelect = (status) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStatusFilter(status);
      // Automatically hide the filter panel after selection
      setFilterVisible(false);
    };
    
    return (
      <View style={{ 
        marginHorizontal: 15, 
        marginBottom: 15,
        backgroundColor: '#FFF',
        borderRadius: 15,
        padding: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#eaeaea'
      }}>
        <Text style={{ 
          fontSize: 18, 
          fontWeight: 'bold', 
          marginBottom: 15, 
          color: '#333',
          textAlign: 'center' 
        }}>
          Filter By Status
        </Text>
        
        <View style={{ marginBottom: 10 }}>
          {['All', 'Pending', 'Processing', 'In Transit', 'Delivered', 'Cancelled'].map(status => (
            <TouchableOpacity
              key={status}
              onPress={() => handleStatusSelect(status)}
              style={{ 
                backgroundColor: statusFilter === status ? 
                  (status === 'All' ? '#f8f9fa' : getStatusColor(status) + '15') : 
                  '#ffffff',
                paddingVertical: 12,
                paddingHorizontal: 15,
                borderRadius: 10,
                marginBottom: 8,
                borderWidth: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderColor: statusFilter === status ? 
                  (status === 'All' ? '#dee2e6' : getStatusColor(status) + '50') : 
                  '#e9ecef'
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {status !== 'All' && (
                  <View style={{ 
                    width: 12, 
                    height: 12, 
                    borderRadius: 6, 
                    backgroundColor: getStatusColor(status),
                    marginRight: 10
                  }} />
                )}
                {status === 'All' && (
                  <MaterialIcons name="filter-list" size={16} color="#6c757d" style={{ marginRight: 10 }} />
                )}
                <Text style={{ 
                  color: statusFilter === status ? 
                    (status === 'All' ? '#495057' : getStatusColor(status)) : 
                    '#6c757d',
                  fontWeight: statusFilter === status ? '600' : '400',
                  fontSize: 16
                }}>
                  {status}
                </Text>
              </View>
              
              {statusFilter === status && (
                <MaterialIcons name="check-circle" size={20} color={
                  status === 'All' ? '#6c757d' : getStatusColor(status)
                } />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };
  
  // Order Item
  const OrderItem = ({ order }) => (
    <TouchableOpacity 
      onPress={() => viewOrderDetails(order)}
      style={{ 
        backgroundColor: '#FFF',
        marginHorizontal: 15,
        marginBottom: 15,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#eaeaea'
      }}
    >
      <View style={{ 
        backgroundColor: getStatusColor(order.status) + '10',
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#eaeaea'
      }}>
        <Text style={{ fontSize: 12, color: getStatusColor(order.status), fontWeight: 'bold' }}>
          {order.status}
        </Text>
        <Text style={{ fontSize: 12, color: '#757575' }}>
          {order.formattedDate}
        </Text>
      </View>
      
      <View style={{ padding: 15 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>
            Order #{order.orderRef || order.orderNumber || order.id.substring(0, 8)}
          </Text>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4A90E2' }}>
            {order.totalAmount} Birr
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', marginBottom: 10 }}>
          <MaterialIcons name="person" size={16} color="#757575" style={{ marginRight: 5 }} />
          <Text style={{ color: '#757575' }}>
            {order.customerDetails ? 
              `${order.customerDetails.firstName} ${order.customerDetails.lastName}` : 
              (order.customerName || 'N/A')}
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', flex: 1, marginRight: 8 }}>
            <MaterialIcons name="location-on" size={16} color="#757575" style={{ marginRight: 5 }} />
            <Text style={{ color: '#757575' }} numberOfLines={1} ellipsizeMode="tail">
              {order.deliveryDetails?.address ? 
                (order.deliveryDetails.address.length > 25 ? 
                  order.deliveryDetails.address.substring(0, 25) + '...' : 
                  order.deliveryDetails.address) : 
                (order.deliveryAddress ? 
                  (order.deliveryAddress.length > 25 ? 
                    order.deliveryAddress.substring(0, 25) + '...' : 
                    order.deliveryAddress) : 
                  'N/A')}
            </Text>
          </View>
          
          <View style={{ flexDirection: 'row' }}>
            <MaterialIcons name="shopping-cart" size={16} color="#757575" style={{ marginRight: 5 }} />
            <Text style={{ color: '#757575' }}>
              {order.cartItems?.length || 0} items
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Empty State
  const EmptyState = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
      <MaterialCommunityIcons name="clipboard-text-outline" size={80} color="#D9D9D9" />
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginTop: 20, color: '#555' }}>
        No Orders Found
      </Text>
      <Text style={{ textAlign: 'center', color: '#777', marginTop: 10 }}>
        {searchQuery || statusFilter !== 'All' ? 
          'Try adjusting your filters to see more results' : 
          'Orders will appear here when customers place them'}
      </Text>
      {(searchQuery || statusFilter !== 'All') && (
        <TouchableOpacity 
          onPress={() => {
            setSearchQuery('');
            setStatusFilter('All');
          }}
          style={{
            marginTop: 20,
            backgroundColor: '#f8f9fa',
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#CED4DA'
          }}
        >
          <Text style={{ color: '#4A90E2', fontWeight: 'bold' }}>Clear Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Main Render
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <StatusBar barStyle="light-content" backgroundColor="#4338CA" />
      
      {/* HomeHeader component */}
      <HomeHeader 
        title="Order Management" 
        showBackButton={true} 
        onBackPress={() => router.back()}
        rightIcon={{
          name: "refresh",
          onPress: onRefresh
        }}
      />
      
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={{ marginTop: 10, color: '#555' }}>Loading orders...</Text>
        </View>
      ) : (
        <>
          <AnalyticsSection />
          <SearchBar />
          <FilterOptions />
          
          {filteredOrders.length === 0 ? (
            <EmptyState />
          ) : (
            <FlatList
              data={filteredOrders}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <OrderItem order={item} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={['#4A90E2']}
                  tintColor="#4A90E2"
                />
              }
            />
          )}
        </>
      )}
      
      {/* Order Detail Modal */}
      <OrderDetailModal />
      
      {/* Delivery Agent Assignment Modal */}
      <DeliveryAgentAssignModal />
    </SafeAreaView>
  );
}
