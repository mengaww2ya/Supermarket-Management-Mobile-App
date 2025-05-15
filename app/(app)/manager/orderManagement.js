import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import { db, auth } from '../../../firebase/firebaseConfig';
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
  addDoc,
  getDoc,
  arrayUnion
} from 'firebase/firestore';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, AntDesign, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';
import { BlurView } from 'expo-blur';
import HomeHeader from '../../components/HomeHeader';

// Add helper function to safely format address data - place outside of components
const getFormattedAddress = (order) => {
  const details = order.deliveryDetails || {};
  let address = details.address || 'No address provided';
  
  if (details.notes) {
    address += ` (${details.notes})`;
  }
  
  return address;
};

export default function OrderManagement() {
  const router = useRouter();
  const { width, height } = Dimensions.get('window');
  
  // Orders state
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
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
  
  // UI state
  const [searchFocused, setSearchFocused] = useState(false);
  const [filterVisible, setFilterVisible] = useState(false);
  
  // Refs
  const searchInputRef = useRef(null);
  
  const [orderStatuses, setOrderStatuses] = useState(['All']);
  
  useEffect(() => {
    fetchOrders();
  }, []);
  
  useEffect(() => {
    applyFilters();
  }, [orders, searchQuery, statusFilter, sortBy, sortOrder]);

  // Add a new useEffect to clean up modal state
  useEffect(() => {
    // Clear selected order when modal is closed
    if (!modalVisible && selectedOrder) {
      const timer = setTimeout(() => {
        setSelectedOrder(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [modalVisible]);

  const menuItems = [
    { title: "Customer Orders", subtitle: "Process and track customer orders" },
    { title: "Manage Orders", subtitle: "Manage pending, completed, and canceled orders" },
    { title: "Returns & Refunds", subtitle: "Handle order returns and refunds" },
    { title: "Assign Delivery", subtitle: "Assign delivery agents to orders" },
    { title: "Notify Customers", subtitle: "Notify customers about order updates" },
  ];

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const ordersRef = collection(db, 'customer_order');
      const ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'));
      const ordersSnapshot = await getDocs(ordersQuery);
      
      if (ordersSnapshot.empty) {
        setOrders([]);
        setFilteredOrders([]);
              return;
            }
            
      const ordersData = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get unique customer IDs
      const customerIds = [...new Set(ordersData.map(order => order.userId))];

      // Fetch customer details
      const usersRef = collection(db, 'users');
      const usersQuery = query(usersRef, where('uid', 'in', customerIds));
      const usersSnapshot = await getDocs(usersQuery);

      const userDataMap = {};
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        userDataMap[userData.uid] = userData;
      });

      const enrichedOrders = ordersData.map(order => ({
        ...order,
        customerDetails: userDataMap[order.userId] || null
      }));

      // Extract unique order statuses
      const statuses = [...new Set(enrichedOrders.map(order => order.orderStatus))];
      setOrderStatuses(['All', ...statuses]);

      setOrders(enrichedOrders);
      setFilteredOrders(enrichedOrders);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Error', 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };
  
  const applyFilters = useCallback(() => {
      let filtered = [...orders];
      
    // Apply search filter
      if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => {
        const customerName = order.customerDetails?.fullName || 
          order.customerDetails?.name ||
          order.customerInfo?.name || '';
        const orderRef = order.orderRef || order.id || '';
        const address = order.deliveryDetails?.address || '';
        
        return customerName.toLowerCase().includes(query) ||
          orderRef.toLowerCase().includes(query) ||
          address.toLowerCase().includes(query);
      });
      }
      
      // Apply status filter
      if (statusFilter !== 'All') {
      filtered = filtered.filter(order => order.orderStatus === statusFilter);
    }
      
      setFilteredOrders(filtered);
  }, [orders, searchQuery, statusFilter]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const orderRef = doc(db, 'customer_order', orderId);
      const orderDoc = await getDoc(orderRef);
      
      if (!orderDoc.exists()) {
        throw new Error('Order not found');
      }
      
      const currentTime = serverTimestamp();
      const updateData = {
        orderStatus: newStatus,
        updatedAt: currentTime,
        orderStatusHistory: arrayUnion({
              status: newStatus, 
          timestamp: currentTime,
              updatedBy: 'manager'
        }),
        actionHistory: arrayUnion({
          actionType: 'status_update',
            actionBy: {
            role: 'manager',
            userId: auth.currentUser.uid
          },
          details: `Order status updated to ${newStatus}`,
          timestamp: currentTime
        })
      };

      // Add manager approval if status is being changed to 'processing'
      if (newStatus === 'processing') {
        updateData.managerApproval = {
          approved: true,
          approvedAt: currentTime,
          approvedBy: auth.currentUser.uid,
          notes: 'Order approved for processing'
        };
      }

      await updateDoc(orderRef, updateData);
      
      // Refresh orders list
      fetchOrders();
      
    } catch (error) {
      console.error('Error updating order status:', error);
      Alert.alert('Error', 'Failed to update order status');
    }
  };
  
  const handleOrderPress = (order) => {
    setSelectedOrder(order);
    setModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const fetchDeliveryAgents = async () => {
    try {
      setLoadingAgents(true);
      const usersRef = collection(db, 'users');
      const agentsQuery = query(usersRef, where('role', '==', 'deliveryAgent'));
      const snapshot = await getDocs(agentsQuery);
      
      const agents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('Fetched agents:', agents);
      setDeliveryAgents(agents);
    } catch (error) {
      console.error('Error fetching delivery agents:', error);
      Alert.alert('Error', 'Failed to load delivery agents');
    } finally {
      setLoadingAgents(false);
    }
  };
  
  // Handle assigning order to delivery agent
  const handleAssignOrder = async () => {
    if (!selectedAgent || !selectedOrder) {
      Alert.alert('Error', 'Please select a delivery agent');
      return;
    }

    try {
      const orderRef = doc(db, 'customer_order', selectedOrder.id);
      const orderDoc = await getDoc(orderRef);

      if (!orderDoc.exists()) {
        Alert.alert('Error', 'Order not found');
        return;
      }
      
      // Basic assignment data
      const assignmentData = {
        orderStatus: 'processing',
        deliveryStatus: 'assigned',
        assignedDeliveryAgent: {
          agentId: selectedAgent.id,
          name: selectedAgent.fullName || selectedAgent.name,
          assignedAt: serverTimestamp()
        }
      };

      // Update order document
      await updateDoc(orderRef, assignmentData);

      // Create delivery task
      const taskRef = collection(db, 'delivery_tasks');
        const taskData = {
          orderId: selectedOrder.id,
        agentId: selectedAgent.id,
        status: 'assigned',
        createdAt: serverTimestamp(),
        customerInfo: selectedOrder.customerInfo,
        deliveryDetails: selectedOrder.deliveryDetails,
        items: selectedOrder.items,
        orderRef: selectedOrder.orderRef
      };

      await addDoc(taskRef, taskData);

      // Update local state
      const updatedOrders = orders.map(order => 
        order.id === selectedOrder.id 
          ? { ...order, ...assignmentData }
          : order
      );
        
        setOrders(updatedOrders);
      setFilteredOrders(updatedOrders);
      setSelectedAgent(null);
        setAssignModalVisible(false);
      setModalVisible(false);

        Alert.alert('Success', 'Order successfully assigned to delivery agent');
      
    } catch (error) {
      console.error('Error assigning order:', error);
      Alert.alert('Error', 'Failed to assign order. Please try again.');
    }
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
  
  // Order Detail Modal Component
  const OrderDetailModal = ({ visible, order, onClose }) => {
    const formatDate = (timestamp) => {
      if (!timestamp) return 'N/A';
      try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return format(date, 'MMM dd, yyyy HH:mm');
      } catch (error) {
        return 'Invalid Date';
      }
    };

    if (!order) return null;

    const customerName = order.customerDetails ? 
      (order.customerDetails.fullName || `${order.customerDetails.firstName} ${order.customerDetails.lastName}`) : 
      (order.customerInfo?.name || 'Unknown Customer');
    
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="fade"
        onRequestClose={onClose}
      >
          <View style={{ 
            flex: 1, 
          backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
          alignItems: 'center',
          }}>
            <View style={{
            backgroundColor: 'white',
            borderRadius: 20,
            width: '90%',
            maxHeight: '80%',
            padding: 20,
              elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
          }}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>
                Order Details
                </Text>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
              </View>
              
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Order Info */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                  Order Information
                  </Text>
                <View style={{ backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: '#6B7280' }}>Order Number:</Text>
                    <Text style={{ color: '#1F2937', fontWeight: '500' }}>#{order.orderRef}</Text>
                </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: '#6B7280' }}>Date:</Text>
                    <Text style={{ color: '#1F2937' }}>{formatDate(order.createdAt)}</Text>
              </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: '#6B7280' }}>Status:</Text>
                    <Text style={{ color: '#1F2937', fontWeight: '500', textTransform: 'capitalize' }}>
                      {order.orderStatus}
                  </Text>
                </View>
                </View>
                </View>
                
              {/* Customer Info */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                  Customer Details
          </Text>
                <View style={{ backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8 }}>
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ color: '#6B7280' }}>Name:</Text>
                    <Text style={{ color: '#1F2937', fontWeight: '500' }}>
                      {customerName}
                  </Text>
                </View>
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ color: '#6B7280' }}>Phone:</Text>
                    <Text style={{ color: '#1F2937' }}>
                      {order.customerDetails?.phone || order.customerInfo?.phoneNumber}
                  </Text>
                </View>
                  <View>
                    <Text style={{ color: '#6B7280' }}>Email:</Text>
                    <Text style={{ color: '#1F2937' }}>
                      {order.customerDetails?.email || order.customerInfo?.email}
                      </Text>
                    </View>
                  </View>
              </View>
              
              {/* Delivery Details */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                  Delivery Details
                  </Text>
                <View style={{ backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8 }}>
                  <View style={{ marginBottom: 8 }}>
                    <Text style={{ color: '#6B7280' }}>Address:</Text>
                    <Text style={{ color: '#1F2937' }}>{order.deliveryDetails.address}</Text>
                      </View>
                  {order.deliveryDetails.notes && (
                      <View>
                      <Text style={{ color: '#6B7280' }}>Notes:</Text>
                      <Text style={{ color: '#1F2937' }}>{order.deliveryDetails.notes}</Text>
                  </View>
                )}
              </View>
                </View>
                
              {/* Order Items */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                  Order Items
                  </Text>
                <View style={{ backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8 }}>
                  {order.items.map((item, index) => (
                  <View key={index} style={{ 
                    flexDirection: 'row',
                      justifyContent: 'space-between',
                      paddingVertical: 8,
                      borderBottomWidth: index < order.items.length - 1 ? 1 : 0,
                      borderBottomColor: '#E5E7EB'
                    }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#1F2937' }}>{item.productName}</Text>
                        <Text style={{ color: '#6B7280', fontSize: 12 }}>
                          {item.quantity} x {item.price} Birr
                        </Text>
                      </View>
                      <Text style={{ color: '#1F2937', fontWeight: '500' }}>
                        {item.totalPrice} Birr
                        </Text>
                  </View>
                ))}
                  </View>
              </View>
              
              {/* Payment Details */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 }}>
                    Payment Details
                  </Text>
                <View style={{ backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: '#6B7280' }}>Subtotal:</Text>
                    <Text style={{ color: '#1F2937' }}>{order.payment.subtotal} Birr</Text>
                </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: '#6B7280' }}>Delivery Fee:</Text>
                    <Text style={{ color: '#1F2937' }}>{order.payment.deliveryFee} Birr</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
                    <Text style={{ color: '#374151', fontWeight: '600' }}>Total:</Text>
                    <Text style={{ color: '#374151', fontWeight: '600' }}>{order.payment.amount} Birr</Text>
                  </View>
                  </View>
                </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#EFF6FF',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  marginRight: 8,
                }}
                onPress={onClose}
              >
                <Text style={{ color: '#3B82F6', fontWeight: '500' }}>Close</Text>
              </TouchableOpacity>

              {order.orderStatus === 'pending' && !order.assignedDeliveryAgent && (
                <TouchableOpacity
                  style={{
                    backgroundColor: '#3B82F6',
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    fetchDeliveryAgents();
                    setAssignModalVisible(true);
                  }}
                >
                  <Ionicons name="bicycle" size={20} color="white" style={{ marginRight: 4 }} />
                  <Text style={{ color: 'white', fontWeight: '500' }}>Assign Delivery</Text>
                </TouchableOpacity>
              )}
                    </View>
                </View>
              </View>
      </Modal>
    );
  };

  // Assignment Modal Component
  const AssignmentModal = () => {
    return (
      <Modal
        visible={assignModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAssignModalVisible(false)}
      >
                <View style={{ 
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: 'white',
            borderRadius: 20,
            width: '90%',
            maxHeight: '70%',
            padding: 20,
            elevation: 5,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>
                Assign Delivery Agent
                    </Text>
              <TouchableOpacity onPress={() => setAssignModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
                  </View>
                  
            {loadingAgents ? (
              <ActivityIndicator size="large" color="#3B82F6" />
            ) : deliveryAgents.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 20 }}>
                <MaterialIcons name="person-search" size={50} color="#D9D9D9" />
                <Text style={{ marginTop: 10, color: '#555', textAlign: 'center' }}>
                  No delivery agents available
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {deliveryAgents.map((agent) => (
                  <TouchableOpacity
                    key={agent.id}
                    style={{
                      flexDirection: 'row',
                      padding: 16,
                      backgroundColor: selectedAgent?.id === agent.id ? '#EFF6FF' : 'white',
                        borderRadius: 12,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: selectedAgent?.id === agent.id ? '#3B82F6' : '#E5E7EB',
                    }}
                    onPress={() => setSelectedAgent(agent)}
                  >
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: '#F3F4F6',
                        justifyContent: 'center',
                      alignItems: 'center',
                      marginRight: 12,
                      }}>
                      <Ionicons name="person" size={24} color="#6B7280" />
                      </View>
                      <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '500', color: '#1F2937' }}>
                        {agent.fullName || agent.name}
                        </Text>
                      {agent.phone && (
                        <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>
                          {agent.phone}
                        </Text>
                      )}
                      {agent.address && (
                        <Text style={{ fontSize: 12, color: '#6B7280' }}>
                          {agent.address}
                                </Text>
                        )}
                      </View>
                    {selectedAgent?.id === agent.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <View style={{ marginTop: 20, flexDirection: 'row', justifyContent: 'flex-end' }}>
                    <TouchableOpacity
                      style={{
                  backgroundColor: '#EFF6FF',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                        borderRadius: 8,
                  marginRight: 8,
                }}
                onPress={() => setAssignModalVisible(false)}
              >
                <Text style={{ color: '#3B82F6', fontWeight: '500' }}>Cancel</Text>
                    </TouchableOpacity>
              
                <TouchableOpacity
                  style={{
                  backgroundColor: '#3B82F6',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8,
                  opacity: selectedAgent ? 1 : 0.5,
                }}
                onPress={handleAssignOrder}
                disabled={!selectedAgent}
              >
                <Text style={{ color: 'white', fontWeight: '500' }}>Assign Order</Text>
                </TouchableOpacity>
          </View>
          </View>
        </View>
      </Modal>
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
  const FilterOptions = ({ visible, currentFilter, statuses, onSelect, onClose }) => {
    if (!visible) return null;
    
    const handleStatusSelect = (status) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelect(status);
      // Automatically hide the filter panel after selection
      onClose();
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
          {statuses.map(status => (
            <TouchableOpacity
              key={status}
              onPress={() => handleStatusSelect(status)}
              style={{ 
                backgroundColor: status === currentFilter ? 
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
                borderColor: status === currentFilter ? 
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
                  color: status === currentFilter ? 
                    (status === 'All' ? '#495057' : getStatusColor(status)) : 
                    '#6c757d',
                  fontWeight: status === currentFilter ? '600' : '400',
                  fontSize: 16
                }}>
                  {status}
                </Text>
              </View>
              
              {status === currentFilter && (
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
  
  // Order Item Component - Simplified List View
  const OrderItem = ({ order, onPress }) => {
    const customerName = order.customerDetails ? 
      (order.customerDetails.fullName || `${order.customerDetails.firstName} ${order.customerDetails.lastName}`) : 
      (order.customerInfo?.name || 'Unknown Customer');

    const formatDate = (timestamp) => {
      if (!timestamp) return 'N/A';
      try {
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return format(date, 'MMM dd, yyyy HH:mm');
      } catch (error) {
        return 'Invalid Date';
      }
    };

    return (
    <TouchableOpacity 
        onPress={() => onPress(order)}
      style={{ 
          backgroundColor: 'white',
        borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          elevation: 2,
          shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
        shadowRadius: 2,
      }}
    >
        {/* Order Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F2937' }}>
            #{order.orderRef || order.id.substring(0, 8)}
          </Text>
      <View style={{ 
            backgroundColor: `${getStatusColor(order.orderStatus)}15`,
            paddingHorizontal: 12,
            paddingVertical: 4,
            borderRadius: 20,
          }}>
            <Text style={{
              color: getStatusColor(order.orderStatus),
              fontSize: 12,
              fontWeight: '600',
              textTransform: 'capitalize'
            }}>
              {order.orderStatus}
        </Text>
          </View>
      </View>
      
        {/* Order Date */}
        <Text style={{ color: '#6B7280', fontSize: 12, marginBottom: 8 }}>
          {formatDate(order.createdAt)}
          </Text>
        
        {/* Customer Info */}
        <View style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="person-outline" size={16} color="#6B7280" />
            <Text style={{ marginLeft: 8, color: '#4B5563', flex: 1 }}>
              {customerName}
          </Text>
          </View>
        </View>
        
        {/* Address */}
        <View style={{ marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            <Ionicons name="location-outline" size={16} color="#6B7280" style={{ marginTop: 2 }} />
            <Text style={{ marginLeft: 8, color: '#6B7280', flex: 1 }} numberOfLines={2}>
              {order.deliveryDetails.address}
            </Text>
          </View>
          </View>
          
        {/* Order Meta */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
          <Text style={{ fontSize: 12, color: '#6B7280' }}>
            Items: {order.items.length}
          </Text>
          <Text style={{ fontSize: 12, color: '#6B7280' }}>
            Total: {order.payment.amount} Birr
            </Text>
      </View>
    </TouchableOpacity>
  );
  };

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
          <SearchBar />
          <FilterOptions
            visible={filterVisible}
            currentFilter={statusFilter}
            statuses={orderStatuses}
            onSelect={setStatusFilter}
            onClose={() => setFilterVisible(false)}
          />
          
          {filteredOrders.length === 0 ? (
            <EmptyState />
          ) : (
            <FlatList
              data={filteredOrders}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <OrderItem order={item} onPress={handleOrderPress} />}
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
      <OrderDetailModal
        visible={modalVisible}
        order={selectedOrder}
        onClose={() => {
          setModalVisible(false);
          setSelectedOrder(null);
        }}
      />
      
      {/* Assignment Modal */}
      <AssignmentModal />
    </SafeAreaView>
  );
}
