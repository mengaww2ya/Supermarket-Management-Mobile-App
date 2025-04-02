import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Vibration,
  Platform,
  Modal,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { db } from '../../../firebase/firebaseConfig';
import { 
  collection, 
  getDocs, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, AntDesign, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withSpring,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeInRight,
  SlideInDown
} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SupplierOrderManagement() {
  const router = useRouter();
  
  // State for orders
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  
  // State for suppliers
  const [suppliers, setSuppliers] = useState([]);
  
  // State for products
  const [products, setProducts] = useState([]);
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortCriteria, setSortCriteria] = useState('dateDesc');
  
  // State for modals
  const [newOrderVisible, setNewOrderVisible] = useState(false);
  const [orderDetailsVisible, setOrderDetailsVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [selectProductVisible, setSelectProductVisible] = useState(false);
  const [selectSupplierVisible, setSelectSupplierVisible] = useState(false);
  
  // State for selected items
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderToDelete, setOrderToDelete] = useState(null);
  
  // State for new order form
  const [newOrder, setNewOrder] = useState({
    supplierName: '',
    supplierId: '',
    products: [],
    status: 'Pending',
    orderDate: new Date(),
    expectedDeliveryDate: null,
    notes: '',
    totalAmount: 0,
  });
  
  // Animation values with Reanimated
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.95);
  const slideAnim = useSharedValue(50);
  const searchBarWidth = useSharedValue(Dimensions.get('window').width - 40);
  const searchInputRef = useRef(null);
  const [searchFocused, setSearchFocused] = useState(false);
  
  // Card animations
  const pressAnimations = {};
  const [filterVisible, setFilterVisible] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  
  // Stats
  const [stats, setStats] = useState({
    pendingCount: 0,
    shippedCount: 0,
    deliveredCount: 0,
    totalAmount: 0
  });
  
  // Additional state for date picker
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  
  useEffect(() => {
    // Start entrance animations
    fadeAnim.value = withTiming(1, { duration: 500 });
    scaleAnim.value = withSpring(1, { damping: 8 });
    slideAnim.value = withTiming(0, { duration: 500 });
    
    // Fetch initial data
    fetchOrders();
    fetchSuppliers();
    fetchProducts();
  }, []);
  
  // Apply filters when search, status, or sort criteria changes
  useEffect(() => {
    filterOrders();
  }, [searchQuery, statusFilter, sortCriteria, orders]);
  
  // Initialize animations for new orders
  useEffect(() => {
    orders.forEach(order => {
      if (!pressAnimations[order.id]) {
        pressAnimations[order.id] = useSharedValue(1);
      }
    });
  }, [orders]);
  
  // Function to fetch orders
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const ordersRef = collection(db, "SupplierOrders");
      const querySnapshot = await getDocs(ordersRef);
      
      const fetchedOrders = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        orderDate: doc.data().orderDate?.toDate() || new Date(),
        expectedDeliveryDate: doc.data().expectedDeliveryDate?.toDate() || null,
        deliveryDate: doc.data().deliveryDate?.toDate() || null,
      }));
      
      // Calculate statistics
      let pendingCount = 0;
      let shippedCount = 0;
      let deliveredCount = 0;
      let totalAmount = 0;
      
      fetchedOrders.forEach(order => {
        if (order.status === 'Pending') pendingCount++;
        else if (order.status === 'Shipped') shippedCount++;
        else if (order.status === 'Delivered') deliveredCount++;
        
        totalAmount += order.totalAmount || 0;
      });
      
      setStats({
        pendingCount,
        shippedCount,
        deliveredCount,
        totalAmount
      });
      
      setOrders(fetchedOrders);
      provideFeedback('success');
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Could not load orders. Please check your connection and try again.");
      provideFeedback('error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Function to fetch suppliers
  const fetchSuppliers = async () => {
    try {
      const suppliersRef = collection(db, "Suppliers");
      const querySnapshot = await getDocs(suppliersRef);
      
      const fetchedSuppliers = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setSuppliers(fetchedSuppliers);
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      Alert.alert("Error", "Failed to load suppliers data.");
    }
  };
  
  // Function to fetch products
  const fetchProducts = async () => {
    try {
      const productsRef = collection(db, "Products");
      const querySnapshot = await getDocs(productsRef);
      
      const fetchedProducts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setProducts(fetchedProducts);
    } catch (err) {
      console.error("Error fetching products:", err);
      Alert.alert("Error", "Failed to load products data.");
    }
  };
  
  // Filter orders based on search query, status filter, and sort criteria
  const filterOrders = () => {
    let filtered = [...orders];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(order => 
        order.supplierName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.products?.some(product => 
          product.name?.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    // Apply sorting
    switch (sortCriteria) {
      case 'dateDesc':
        filtered.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
        break;
      case 'dateAsc':
        filtered.sort((a, b) => new Date(a.orderDate) - new Date(b.orderDate));
        break;
      case 'amountDesc':
        filtered.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
        break;
      case 'amountAsc':
        filtered.sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0));
        break;
      case 'statusPriority':
        filtered.sort((a, b) => {
          const priority = { 'Pending': 0, 'Shipped': 1, 'Delivered': 2 };
          return priority[a.status] - priority[b.status];
        });
        break;
    }
    
    setFilteredOrders(filtered);
  };
  
  // Refresh orders data
  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };
  
  // Provide haptic feedback based on action type
  const provideFeedback = (type) => {
    if (Platform.OS === 'ios') {
      try {
        if (type === 'success') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (type === 'error') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } catch (e) {
        // Fallback to basic vibration
        Vibration.vibrate(type === 'error' ? 500 : 20);
      }
    } else {
      // Android vibration
      Vibration.vibrate(type === 'error' ? 500 : 20);
    }
  };
  
  // Card press animation using Reanimated
  const animatePress = (id) => {
    provideFeedback('light');
    pressAnimations[id].value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
  };
  
  // Toggle search focus with Reanimated
  const toggleSearch = () => {
    if (searchFocused) {
      // Reset search
      setSearchQuery("");
      setSearchFocused(false);
      searchInputRef.current?.blur();
      searchBarWidth.value = withSpring(Dimensions.get('window').width - 40, { damping: 8 });
    } else {
      // Focus search
      setSearchFocused(true);
      searchInputRef.current?.focus();
      searchBarWidth.value = withSpring(Dimensions.get('window').width - 100, { damping: 8 });
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2 
    }).format(amount || 0);
  };
  
  // Format date
  const formatDate = (date) => {
    if (!date) return 'Not specified';
    return format(new Date(date), 'MMM dd, yyyy');
  };
  
  // Create a new order
  const createOrder = async () => {
    if (!newOrder.supplierId || newOrder.products.length === 0) {
      Alert.alert('Validation Error', 'Please select a supplier and at least one product.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Calculate total amount
      let totalAmount = 0;
      newOrder.products.forEach(product => {
        totalAmount += (product.price * product.quantity);
      });
      
      const orderData = {
        ...newOrder,
        totalAmount,
        status: 'Pending',
        orderDate: Timestamp.fromDate(new Date()),
        expectedDeliveryDate: newOrder.expectedDeliveryDate 
          ? Timestamp.fromDate(newOrder.expectedDeliveryDate) 
          : null,
        createdAt: serverTimestamp(),
      };
      
      // Add the order to Firestore
      await addDoc(collection(db, "SupplierOrders"), orderData);
      
      // Reset form and close modal
      setNewOrder({
        supplierName: '',
        supplierId: '',
        products: [],
        status: 'Pending',
        orderDate: new Date(),
        expectedDeliveryDate: null,
        notes: '',
        totalAmount: 0,
      });
      
      setNewOrderVisible(false);
      fetchOrders();
      
      // Success feedback
      Alert.alert('Success', 'Order created successfully!');
      provideFeedback('success');
    } catch (error) {
      console.error("Error creating order:", error);
      Alert.alert('Error', 'Failed to create order: ' + error.message);
      provideFeedback('error');
    } finally {
      setLoading(false);
    }
  };
  
  // Update order status
  const updateOrderStatus = async (order, newStatus) => {
    try {
      setLoading(true);
      
      const orderRef = doc(db, "SupplierOrders", order.id);
      
      // If status is Delivered, add delivery date
      const updateData = { 
        status: newStatus 
      };
      
      if (newStatus === 'Delivered') {
        updateData.deliveryDate = Timestamp.fromDate(new Date());
      }
      
      await updateDoc(orderRef, updateData);
      
      // Update local state
      const updatedOrders = orders.map(o => {
        if (o.id === order.id) {
          return { 
            ...o, 
            status: newStatus,
            deliveryDate: newStatus === 'Delivered' ? new Date() : o.deliveryDate
          };
        }
        return o;
      });
      
      setOrders(updatedOrders);
      
      // If details modal is open, update selected order
      if (selectedOrder && selectedOrder.id === order.id) {
        setSelectedOrder({
          ...selectedOrder,
          status: newStatus,
          deliveryDate: newStatus === 'Delivered' ? new Date() : selectedOrder.deliveryDate
        });
      }
      
      // Success feedback
      Alert.alert('Success', `Order status updated to ${newStatus}`);
      provideFeedback('success');
    } catch (error) {
      console.error("Error updating order status:", error);
      Alert.alert('Error', 'Failed to update order status: ' + error.message);
      provideFeedback('error');
    } finally {
      setLoading(false);
    }
  };
  
  // Delete an order
  const deleteOrder = async () => {
    if (!orderToDelete) return;
    
    try {
      setLoading(true);
      
      const orderRef = doc(db, "SupplierOrders", orderToDelete.id);
      await deleteDoc(orderRef);
      
      // Update local state
      setOrders(orders.filter(o => o.id !== orderToDelete.id));
      
      // Reset state and close modal
      setOrderToDelete(null);
      setDeleteConfirmVisible(false);
      
      // Success feedback
      Alert.alert('Success', 'Order deleted successfully');
      provideFeedback('success');
    } catch (error) {
      console.error("Error deleting order:", error);
      Alert.alert('Error', 'Failed to delete order: ' + error.message);
      provideFeedback('error');
    } finally {
      setLoading(false);
    }
  };
  
  // Add product to new order
  const addProductToOrder = (product) => {
    // Check if product already exists in order
    const productIndex = newOrder.products.findIndex(p => p.id === product.id);
    
    if (productIndex >= 0) {
      // Update quantity if product already exists
      const updatedProducts = [...newOrder.products];
      updatedProducts[productIndex] = {
        ...updatedProducts[productIndex],
        quantity: updatedProducts[productIndex].quantity + 1
      };
      
      setNewOrder({
        ...newOrder,
        products: updatedProducts
      });
    } else {
      // Add new product to order
      setNewOrder({
        ...newOrder,
        products: [
          ...newOrder.products,
          {
            id: product.id,
            name: product.name,
            price: parseFloat(product.price) || 0,
            quantity: 1,
            image: product.image
          }
        ]
      });
    }
    
    setSelectProductVisible(false);
    provideFeedback('light');
  };
  
  // Select supplier for new order
  const selectSupplier = (supplier) => {
    setNewOrder({
      ...newOrder,
      supplierId: supplier.id,
      supplierName: supplier.name
    });
    
    setSelectSupplierVisible(false);
    provideFeedback('light');
  };
  
  // Render order status badge
  const renderStatusBadge = (status) => {
    let bgColor = '';
    let textColor = '';
    
    switch (status) {
      case 'Pending':
        bgColor = 'bg-amber-100';
        textColor = 'text-amber-800';
        break;
      case 'Shipped':
        bgColor = 'bg-blue-100';
        textColor = 'text-blue-800';
        break;
      case 'Delivered':
        bgColor = 'bg-green-100';
        textColor = 'text-green-800';
        break;
      default:
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-800';
    }
    
    return (
      <View className={`px-2 py-1 rounded-full ${bgColor} w-24 items-center`}>
        <Text className={`font-medium ${textColor} text-xs`}>{status}</Text>
      </View>
    );
  };
  
  // Render order card
  const renderOrderCard = (order) => {
    // Use animated style for scale animation
    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [{ scale: pressAnimations[order.id]?.value || 1 }]
      };
    });

    return (
      <Animated.View 
        key={order.id}
        entering={FadeInRight.delay(200 * (orders.indexOf(order) % 8)).duration(300)}
        style={animatedStyle}
        className="mb-3 rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm"
      >
        <Pressable
          onPress={() => {
            animatePress(order.id);
            setSelectedOrder(order);
            setOrderDetailsVisible(true);
          }}
          className="p-4"
        >
          <View className="flex-row items-center justify-between">
            <View className="max-w-[70%]">
              <Text className="text-base font-bold text-gray-900" numberOfLines={1}>
                {order.supplierName || 'Unknown Supplier'}
              </Text>
              <Text className="text-xs text-gray-500">
                Order #{order.id.substring(0, 8)}
              </Text>
            </View>
            {renderStatusBadge(order.status)}
          </View>
          
          <View className="border-t border-gray-100 my-3" />
          
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                className="h-9 w-9 rounded-full items-center justify-center mr-3"
              >
                <MaterialIcons name="shopping-bag" size={18} color="white" />
              </LinearGradient>
              <Text className="text-sm text-gray-700">
                {order.products?.length || 0} {order.products?.length === 1 ? 'item' : 'items'}
              </Text>
            </View>
            <Text className="text-base font-semibold text-indigo-700">
              {formatCurrency(order.totalAmount)}
            </Text>
          </View>
          
          <View className="mt-3 flex-row justify-between">
            <View className="flex-row items-center">
              <MaterialIcons name="event" size={16} color="#6B7280" className="mr-1" />
              <Text className="text-xs text-gray-600 ml-1">
                {formatDate(order.orderDate)}
              </Text>
            </View>
            
            {order.expectedDeliveryDate && (
              <View className="flex-row items-center">
                <MaterialIcons name="local-shipping" size={16} color="#6B7280" className="mr-1" />
                <Text className="text-xs text-gray-600 ml-1">
                  Due: {formatDate(order.expectedDeliveryDate)}
                </Text>
              </View>
            )}
          </View>
          
          {order.status !== 'Delivered' && (
            <View className="mt-3 flex-row space-x-2">
              {order.status === 'Pending' && (
                <TouchableOpacity
                  onPress={() => updateOrderStatus(order, 'Shipped')}
                  className="flex-1 bg-blue-100 py-2 rounded-lg items-center justify-center flex-row space-x-1"
                >
                  <MaterialIcons name="local-shipping" size={16} color="#1E40AF" />
                  <Text className="text-xs font-medium text-blue-800">Mark Shipped</Text>
                </TouchableOpacity>
              )}
              
              {order.status === 'Shipped' && (
                <TouchableOpacity
                  onPress={() => updateOrderStatus(order, 'Delivered')}
                  className="flex-1 bg-green-100 py-2 rounded-lg items-center justify-center flex-row space-x-1"
                >
                  <MaterialIcons name="check-circle" size={16} color="#166534" />
                  <Text className="text-xs font-medium text-green-800">Mark Delivered</Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity
                onPress={() => {
                  setOrderToDelete(order);
                  setDeleteConfirmVisible(true);
                }}
                className="bg-red-100 py-2 px-3 rounded-lg items-center justify-center"
              >
                <MaterialIcons name="delete" size={16} color="#B91C1C" />
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Animated.View>
    );
  };
  
  // Render new order form
  const renderNewOrderForm = () => {
    return (
      <Modal
        visible={newOrderVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNewOrderVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end"
        >
          <View className="bg-white rounded-t-3xl shadow-lg p-5 h-[95%]">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-xl font-bold text-gray-900">New Order</Text>
              <TouchableOpacity
                onPress={() => setNewOrderVisible(false)}
                className="h-8 w-8 items-center justify-center rounded-full bg-gray-100"
              >
                <MaterialIcons name="close" size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} className="mb-5">
              {/* Supplier Selection */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">Supplier</Text>
                <TouchableOpacity
                  onPress={() => setSelectSupplierVisible(true)}
                  className="border border-gray-300 rounded-lg p-3 flex-row justify-between items-center"
                >
                  <Text className={newOrder.supplierName ? "text-gray-900" : "text-gray-400"}>
                    {newOrder.supplierName || "Select a supplier"}
                  </Text>
                  <MaterialIcons name="keyboard-arrow-right" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              
              {/* Products */}
              <View className="mb-4">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-sm font-medium text-gray-700">Products</Text>
                  <TouchableOpacity
                    onPress={() => setSelectProductVisible(true)}
                    className="bg-indigo-100 py-1 px-3 rounded-full"
                  >
                    <Text className="text-xs font-medium text-indigo-800">Add Product</Text>
                  </TouchableOpacity>
                </View>
                
                {/* Selected Products List */}
                {newOrder.products.length > 0 ? (
                  <View className="border border-gray-200 rounded-lg overflow-hidden">
                    {newOrder.products.map((product, index) => (
                      <View key={index} className={`p-3 flex-row justify-between items-center ${
                        index !== newOrder.products.length - 1 ? "border-b border-gray-100" : ""
                      }`}>
                        <View className="flex-row items-center flex-1">
                          {product.image ? (
                            <Image 
                              source={{ uri: product.image }} 
                              className="h-10 w-10 rounded-md mr-3" 
                            />
                          ) : (
                            <View className="h-10 w-10 rounded-md bg-gray-200 items-center justify-center mr-3">
                              <MaterialIcons name="image" size={20} color="#9CA3AF" />
                            </View>
                          )}
                          <View className="flex-1">
                            <Text className="text-sm font-medium text-gray-800" numberOfLines={1}>
                              {product.name}
                            </Text>
                            <Text className="text-xs text-gray-500">
                              {formatCurrency(product.price)} × {product.quantity}
                            </Text>
                          </View>
                        </View>
                        
                        <View className="flex-row items-center">
                          <TouchableOpacity
                            onPress={() => {
                              const updatedProducts = [...newOrder.products];
                              if (product.quantity > 1) {
                                updatedProducts[index] = {
                                  ...product,
                                  quantity: product.quantity - 1
                                };
                              } else {
                                updatedProducts.splice(index, 1);
                              }
                              setNewOrder({...newOrder, products: updatedProducts});
                            }}
                            className="h-8 w-8 items-center justify-center rounded-full bg-gray-100"
                          >
                            <MaterialIcons name="remove" size={18} color="#4B5563" />
                          </TouchableOpacity>
                          
                          <Text className="mx-3 min-w-[20px] text-center">
                            {product.quantity}
                          </Text>
                          
                          <TouchableOpacity
                            onPress={() => {
                              const updatedProducts = [...newOrder.products];
                              updatedProducts[index] = {
                                ...product,
                                quantity: product.quantity + 1
                              };
                              setNewOrder({...newOrder, products: updatedProducts});
                            }}
                            className="h-8 w-8 items-center justify-center rounded-full bg-gray-100"
                          >
                            <MaterialIcons name="add" size={18} color="#4B5563" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                    
                    <View className="p-3 bg-gray-50">
                      <Text className="text-right font-semibold text-gray-900">
                        Total: {formatCurrency(
                          newOrder.products.reduce(
                            (sum, product) => sum + (product.price * product.quantity), 0
                          )
                        )}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View className="border border-gray-200 rounded-lg p-4 items-center justify-center">
                    <Text className="text-gray-400">No products added yet</Text>
                  </View>
                )}
              </View>
              
              {/* Expected Delivery Date */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">Expected Delivery Date</Text>
                <TouchableOpacity
                  onPress={() => setDatePickerVisible(true)}
                  className="border border-gray-300 rounded-lg p-3 flex-row justify-between items-center"
                >
                  <Text className={newOrder.expectedDeliveryDate ? "text-gray-900" : "text-gray-400"}>
                    {newOrder.expectedDeliveryDate ? formatDate(newOrder.expectedDeliveryDate) : "Select a date"}
                  </Text>
                  <MaterialIcons name="event" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
              
              {/* Notes */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-gray-700 mb-1">Notes</Text>
                <TextInput
                  placeholder="Add any special instructions or notes"
                  value={newOrder.notes}
                  onChangeText={(text) => setNewOrder({...newOrder, notes: text})}
                  className="border border-gray-300 rounded-lg p-3 text-gray-900 min-h-[100px]"
                  multiline
                  textAlignVertical="top"
                />
              </View>
            </ScrollView>
            
            <TouchableOpacity
              onPress={createOrder}
              disabled={loading}
              className={`py-3 rounded-lg items-center justify-center ${
                loading ? "bg-indigo-300" : "bg-indigo-600"
              }`}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text className="text-white font-semibold">Create Order</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };
  
  // Render order details modal
  const renderOrderDetailsModal = () => {
    if (!selectedOrder) return null;
    
    return (
      <Modal
        visible={orderDetailsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOrderDetailsVisible(false)}
      >
        <View className="flex-1 justify-end">
          <View className="bg-white rounded-t-3xl shadow-lg p-5 h-[85%]">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-xl font-bold text-gray-900">Order Details</Text>
              <TouchableOpacity
                onPress={() => setOrderDetailsVisible(false)}
                className="h-8 w-8 items-center justify-center rounded-full bg-gray-100"
              >
                <MaterialIcons name="close" size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false} className="mb-5">
              {/* Order Header */}
              <View className="bg-indigo-50 p-4 rounded-xl mb-4">
                <View className="flex-row justify-between items-center mb-2">
                  <View className="flex-row items-center">
                    <LinearGradient
                      colors={['#4F46E5', '#7C3AED']}
                      className="h-10 w-10 rounded-full items-center justify-center mr-3"
                    >
                      <MaterialIcons name="receipt" size={20} color="white" />
                    </LinearGradient>
                    <View>
                      <Text className="text-base font-bold text-gray-900">
                        Order #{selectedOrder.id.substring(0, 8)}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {formatDate(selectedOrder.orderDate)}
                      </Text>
                    </View>
                  </View>
                  {renderStatusBadge(selectedOrder.status)}
                </View>
                
                <View className="border-t border-indigo-100 my-2" />
                
                <View className="flex-row items-center">
                  <MaterialIcons name="business" size={16} color="#4F46E5" className="mr-1" />
                  <Text className="text-sm font-medium text-gray-800 ml-1">
                    {selectedOrder.supplierName || 'Unknown Supplier'}
                  </Text>
                </View>
                
                {selectedOrder.expectedDeliveryDate && (
                  <View className="flex-row items-center mt-1">
                    <MaterialIcons name="event" size={16} color="#4F46E5" className="mr-1" />
                    <Text className="text-sm text-gray-700 ml-1">
                      Expected: {formatDate(selectedOrder.expectedDeliveryDate)}
                    </Text>
                  </View>
                )}
                
                {selectedOrder.deliveryDate && (
                  <View className="flex-row items-center mt-1">
                    <MaterialIcons name="check-circle" size={16} color="#16A34A" className="mr-1" />
                    <Text className="text-sm text-gray-700 ml-1">
                      Delivered: {formatDate(selectedOrder.deliveryDate)}
                    </Text>
                  </View>
                )}
              </View>
              
              {/* Products */}
              <View className="mb-4">
                <Text className="text-sm font-semibold text-gray-700 mb-2">Products</Text>
                <View className="border border-gray-200 rounded-lg overflow-hidden">
                  {selectedOrder.products?.map((product, index) => (
                    <View key={index} className={`p-3 flex-row items-center ${
                      index !== selectedOrder.products.length - 1 ? "border-b border-gray-100" : ""
                    }`}>
                      {product.image ? (
                        <Image 
                          source={{ uri: product.image }} 
                          className="h-12 w-12 rounded-md mr-3" 
                        />
                      ) : (
                        <View className="h-12 w-12 rounded-md bg-gray-200 items-center justify-center mr-3">
                          <MaterialIcons name="image" size={20} color="#9CA3AF" />
                        </View>
                      )}
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-gray-800">
                          {product.name}
                        </Text>
                        <View className="flex-row justify-between mt-1">
                          <Text className="text-xs text-gray-500">
                            Qty: {product.quantity}
                          </Text>
                          <Text className="text-xs text-gray-500">
                            Unit: {formatCurrency(product.price)}
                          </Text>
                          <Text className="text-xs font-medium text-gray-800">
                            Total: {formatCurrency(product.price * product.quantity)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}
                  
                  <View className="p-3 bg-gray-50">
                    <Text className="text-right font-semibold text-gray-900">
                      Order Total: {formatCurrency(selectedOrder.totalAmount)}
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Notes */}
              {selectedOrder.notes && (
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Notes</Text>
                  <View className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <Text className="text-sm text-gray-700">
                      {selectedOrder.notes}
                    </Text>
                  </View>
                </View>
              )}
              
              {/* Actions */}
              {selectedOrder.status !== 'Delivered' && (
                <View className="flex-row space-x-3 mb-4">
                  {selectedOrder.status === 'Pending' && (
                    <TouchableOpacity
                      onPress={() => updateOrderStatus(selectedOrder, 'Shipped')}
                      className="flex-1 bg-blue-600 py-3 rounded-lg items-center justify-center"
                    >
                      <Text className="text-white font-medium">Mark as Shipped</Text>
                    </TouchableOpacity>
                  )}
                  
                  {selectedOrder.status === 'Shipped' && (
                    <TouchableOpacity
                      onPress={() => updateOrderStatus(selectedOrder, 'Delivered')}
                      className="flex-1 bg-green-600 py-3 rounded-lg items-center justify-center"
                    >
                      <Text className="text-white font-medium">Mark as Delivered</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity
                    onPress={() => {
                      setOrderDetailsVisible(false);
                      setTimeout(() => {
                        setOrderToDelete(selectedOrder);
                        setDeleteConfirmVisible(true);
                      }, 300);
                    }}
                    className="bg-red-600 py-3 px-4 rounded-lg items-center justify-center"
                  >
                    <MaterialIcons name="delete" size={20} color="white" />
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };
  
  // Render delete confirmation modal
  const renderDeleteConfirmationModal = () => {
    return (
      <Modal
        visible={deleteConfirmVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-5">
          <View className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <Text className="text-xl font-bold text-gray-900 mb-3">Delete Order</Text>
            <Text className="text-gray-600 mb-4">
              Are you sure you want to delete this order? This action cannot be undone.
            </Text>
            
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={() => setDeleteConfirmVisible(false)}
                className="flex-1 py-3 rounded-lg bg-gray-200 items-center justify-center"
              >
                <Text className="font-medium text-gray-800">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={deleteOrder}
                className="flex-1 py-3 rounded-lg bg-red-600 items-center justify-center"
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text className="font-medium text-white">Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  
  // Render select supplier modal
  const renderSelectSupplierModal = () => {
    return (
      <Modal
        visible={selectSupplierVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectSupplierVisible(false)}
      >
        <View className="flex-1 justify-end">
          <View className="bg-white rounded-t-3xl shadow-lg p-5 h-[70%]">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-xl font-bold text-gray-900">Select Supplier</Text>
              <TouchableOpacity
                onPress={() => setSelectSupplierVisible(false)}
                className="h-8 w-8 items-center justify-center rounded-full bg-gray-100"
              >
                <MaterialIcons name="close" size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={suppliers}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => selectSupplier(item)}
                  className="p-3 border-b border-gray-100 flex-row justify-between items-center"
                >
                  <View className="flex-row items-center">
                    <View className="bg-indigo-100 h-10 w-10 rounded-full items-center justify-center mr-3">
                      <Text className="text-indigo-800 font-semibold">
                        {item.name?.charAt(0).toUpperCase() || 'S'}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-base font-medium text-gray-800">
                        {item.name}
                      </Text>
                      {item.phone && (
                        <Text className="text-xs text-gray-500">
                          {item.phone}
                        </Text>
                      )}
                    </View>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View className="items-center justify-center py-8">
                  <Text className="text-gray-400">No suppliers found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    );
  };
  
  // Render select product modal
  const renderSelectProductModal = () => {
    return (
      <Modal
        visible={selectProductVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectProductVisible(false)}
      >
        <View className="flex-1 justify-end">
          <View className="bg-white rounded-t-3xl shadow-lg p-5 h-[80%]">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-xl font-bold text-gray-900">Select Product</Text>
              <TouchableOpacity
                onPress={() => setSelectProductVisible(false)}
                className="h-8 w-8 items-center justify-center rounded-full bg-gray-100"
              >
                <MaterialIcons name="close" size={20} color="#4B5563" />
              </TouchableOpacity>
            </View>
            
            <TextInput
              placeholder="Search products..."
              className="bg-gray-100 px-4 py-2 rounded-lg mb-3"
              onChangeText={(text) => setProductSearchQuery(text)}
              value={productSearchQuery}
            />
            
            <FlatList
              data={products.filter(product => 
                product.name?.toLowerCase().includes(productSearchQuery.toLowerCase())
              )}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => addProductToOrder(item)}
                  className="p-3 border-b border-gray-100 flex-row justify-between items-center"
                >
                  <View className="flex-row items-center flex-1">
                    {item.image ? (
                      <Image 
                        source={{ uri: item.image }} 
                        className="h-12 w-12 rounded-md mr-3" 
                      />
                    ) : (
                      <View className="h-12 w-12 rounded-md bg-gray-200 items-center justify-center mr-3">
                        <MaterialIcons name="image" size={20} color="#9CA3AF" />
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="text-base font-medium text-gray-800" numberOfLines={1}>
                        {item.name}
                      </Text>
                      <View className="flex-row justify-between mt-1">
                        <Text className="text-xs text-gray-500">
                          Stock: {item.stockQuantity || '0'}
                        </Text>
                        <Text className="text-xs font-medium text-gray-800">
                          {formatCurrency(item.price)}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <MaterialIcons name="add-circle" size={24} color="#4F46E5" />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View className="items-center justify-center py-8">
                  <Text className="text-gray-400">No products found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    );
  };
  
  // Render date picker modal
  const renderDatePickerModal = () => {
    return (
      <Modal
        visible={datePickerVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-5">
          <View className="bg-white rounded-2xl p-5 w-full">
            <Text className="text-lg font-bold text-gray-900 mb-3 text-center">
              Select Expected Delivery Date
            </Text>
            
            <DateTimePicker
              value={newOrder.expectedDeliveryDate || new Date()}
              mode="date"
              display="inline"
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setNewOrder({...newOrder, expectedDeliveryDate: selectedDate});
                }
              }}
              minimumDate={new Date()}
            />
            
            <View className="flex-row space-x-3 mt-3">
              <TouchableOpacity
                onPress={() => setDatePickerVisible(false)}
                className="flex-1 py-3 rounded-lg bg-gray-200 items-center justify-center"
              >
                <Text className="font-medium text-gray-800">Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setDatePickerVisible(false)}
                className="flex-1 py-3 rounded-lg bg-indigo-600 items-center justify-center"
              >
                <Text className="font-medium text-white">Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };
  
  // Main render
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white pt-2 pb-3 px-4 border-b border-gray-200">
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-2xl font-bold text-gray-900">
            Supplier Orders
          </Text>
          
          <TouchableOpacity 
            onPress={() => setNewOrderVisible(true)}
            className="h-10 w-10 items-center justify-center rounded-full bg-indigo-100"
          >
            <MaterialIcons name="add" size={24} color="#4F46E5" />
          </TouchableOpacity>
        </View>
        
        {/* Stats cards */}
        <Animated.ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 12 }}
          entering={FadeIn.delay(300).duration(500)}
        >
          <View className="bg-indigo-50 p-3 mr-3 rounded-xl w-36">
            <View className="flex-row items-center mb-1">
              <MaterialIcons name="pending-actions" size={16} color="#4F46E5" />
              <Text className="text-xs font-medium text-indigo-800 ml-1">Pending</Text>
            </View>
            <Text className="text-xl font-bold text-gray-900">{stats.pendingCount}</Text>
          </View>
          
          <View className="bg-blue-50 p-3 mr-3 rounded-xl w-36">
            <View className="flex-row items-center mb-1">
              <MaterialIcons name="local-shipping" size={16} color="#2563EB" />
              <Text className="text-xs font-medium text-blue-800 ml-1">Shipped</Text>
            </View>
            <Text className="text-xl font-bold text-gray-900">{stats.shippedCount}</Text>
          </View>
          
          <View className="bg-green-50 p-3 mr-3 rounded-xl w-36">
            <View className="flex-row items-center mb-1">
              <MaterialIcons name="check-circle" size={16} color="#16A34A" />
              <Text className="text-xs font-medium text-green-800 ml-1">Delivered</Text>
            </View>
            <Text className="text-xl font-bold text-gray-900">{stats.deliveredCount}</Text>
          </View>
          
          <View className="bg-purple-50 p-3 rounded-xl w-40">
            <View className="flex-row items-center mb-1">
              <MaterialIcons name="attach-money" size={16} color="#7E22CE" />
              <Text className="text-xs font-medium text-purple-800 ml-1">Total Value</Text>
            </View>
            <Text className="text-xl font-bold text-gray-900" numberOfLines={1}>
              {formatCurrency(stats.totalAmount)}
            </Text>
          </View>
        </Animated.ScrollView>
      </View>
      
      {/* Search and Filter Bar */}
      <Animated.View 
        entering={FadeInDown.delay(200).duration(400)}
        className="flex-row items-center mx-4 mt-3 mb-2"
      >
        <Animated.View
          style={useAnimatedStyle(() => ({
            width: searchBarWidth.value
          }))}
          className="flex-row items-center bg-white rounded-xl border border-gray-200 flex-1 h-12 px-3 mr-2"
        >
          <MaterialIcons name="search" size={20} color="#9CA3AF" />
          <TextInput
            ref={searchInputRef}
            placeholder="Search orders..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            className="flex-1 ml-2 text-gray-900"
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialIcons name="clear" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </Animated.View>
        
        {searchFocused && (
          <TouchableOpacity 
            onPress={toggleSearch}
            className="ml-1"
          >
            <Text className="text-indigo-600 font-medium">Cancel</Text>
          </TouchableOpacity>
        )}
        
        {!searchFocused && (
          <TouchableOpacity 
            onPress={() => setFilterVisible(!filterVisible)}
            className="h-12 w-12 items-center justify-center rounded-xl bg-white border border-gray-200"
          >
            <MaterialIcons name="filter-list" size={24} color="#4F46E5" />
          </TouchableOpacity>
        )}
      </Animated.View>
      
      {/* Filters */}
      {filterVisible && (
        <Animated.View 
          entering={SlideInDown.duration(300)}
          className="mx-4 mb-3"
        >
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm font-medium text-gray-700">Status</Text>
            <TouchableOpacity onPress={() => setSortVisible(!sortVisible)}>
              <Text className="text-indigo-600 text-sm">Sort by: {sortCriteria.replace(/([A-Z])/g, ' $1').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase()}</Text>
            </TouchableOpacity>
          </View>
          
          <View className="flex-row flex-wrap">
            {['All', 'Pending', 'Shipped', 'Delivered'].map((status) => (
              <TouchableOpacity
                key={status}
                onPress={() => setStatusFilter(status)}
                className={`mr-2 mb-2 py-1 px-3 rounded-full ${
                  statusFilter === status 
                    ? 'bg-indigo-100 border border-indigo-300' 
                    : 'bg-white border border-gray-300'
                }`}
              >
                <Text className={`text-xs ${
                  statusFilter === status 
                    ? 'text-indigo-800 font-medium' 
                    : 'text-gray-600'
                }`}>
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {sortVisible && (
            <Animated.View 
              entering={SlideInDown.duration(200)}
              className="mt-2 bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              {[
                { id: 'dateDesc', label: 'Newest first' },
                { id: 'dateAsc', label: 'Oldest first' },
                { id: 'amountDesc', label: 'Highest amount' },
                { id: 'amountAsc', label: 'Lowest amount' },
                { id: 'statusPriority', label: 'Status priority' },
              ].map((sort) => (
                <TouchableOpacity
                  key={sort.id}
                  onPress={() => {
                    setSortCriteria(sort.id);
                    setSortVisible(false);
                  }}
                  className={`py-3 px-4 ${
                    sortCriteria === sort.id 
                      ? 'bg-indigo-50' 
                      : 'bg-white'
                  } ${sort.id !== 'statusPriority' ? 'border-b border-gray-100' : ''}`}
                >
                  <Text className={`${
                    sortCriteria === sort.id 
                      ? 'text-indigo-700 font-medium' 
                      : 'text-gray-700'
                  }`}>
                    {sort.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}
        </Animated.View>
      )}
      
      {/* Orders List */}
      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="mt-3 text-gray-500">Loading orders...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={({ item }) => renderOrderCard(item)}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4F46E5', '#7C3AED']}
              tintColor="#4F46E5"
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-8">
              {error ? (
                <View className="items-center">
                  <MaterialIcons name="error-outline" size={48} color="#EF4444" />
                  <Text className="text-red-500 mt-2 mb-4">{error}</Text>
                  <TouchableOpacity
                    onPress={fetchOrders}
                    className="py-2 px-4 bg-indigo-600 rounded-lg"
                  >
                    <Text className="text-white font-medium">Try Again</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="items-center max-w-[70%]">
                  <MaterialIcons name="inbox" size={48} color="#9CA3AF" />
                  <Text className="text-gray-400 text-center mt-2">
                    {searchQuery || statusFilter !== 'All'
                      ? 'No orders match your filters'
                      : 'No orders found. Create a new order to get started!'}
                  </Text>
                  
                  {(searchQuery || statusFilter !== 'All') && (
                    <TouchableOpacity
                      onPress={() => {
                        setSearchQuery('');
                        setStatusFilter('All');
                      }}
                      className="mt-3 py-2 px-4 bg-gray-200 rounded-lg"
                    >
                      <Text className="text-gray-800">Clear Filters</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          }
        />
      )}
      
      {/* Modals */}
      {renderNewOrderForm()}
      {renderOrderDetailsModal()}
      {renderDeleteConfirmationModal()}
      {renderSelectSupplierModal()}
      {renderSelectProductModal()}
      {renderDatePickerModal()}
    </SafeAreaView>
  );
}
