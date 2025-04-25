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
import { Ionicons, MaterialCommunityIcons, FontAwesome5, AntDesign, MaterialIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  withSpring,
  withDelay,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeInRight,
  SlideInDown,
  Easing,
  Layout
} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeHeader from '../../components/HomeHeader';
import SupplierProductDisplay from './SupplierProductDisplay';
import SupplierDisplay from './SupplierDisplay';
import SupplierAnalytics from './SupplierAnalytics';

export default function SupplierOrderManagement() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = Dimensions.get('window');

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

  // Active tab state - updated to focus on suppliers and analytics
  const [activeTab, setActiveTab] = useState('suppliers'); // 'suppliers', 'analytics'

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

  // Animation values
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.95);
  const slideAnim = useSharedValue(50);
  const searchBarWidth = useSharedValue(Dimensions.get('window').width - 40);
  const searchInputRef = useRef(null);
  const [searchFocused, setSearchFocused] = useState(false);

  // Card animations - create a single shared value for animation
  const animationValue = useSharedValue(1);
  // Store the currently animated order ID
  const [animatedOrderId, setAnimatedOrderId] = useState(null);

  const [filterVisible, setFilterVisible] = useState(false);
  const [sortVisible, setSortVisible] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    pendingCount: 0,
    shippedCount: 0,
    deliveredCount: 0,
    totalAmount: 0
  });

  // Additional state for date picker
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [dateType, setDateType] = useState('');

  // TabBar animation
  const tabIndicatorPosition = useSharedValue(0);

  // State for cart badge
  const [cartItemCount, setCartItemCount] = useState(0);

  // Add new state for order method selection modal
  const [orderMethodModalVisible, setOrderMethodModalVisible] = useState(false);

  useEffect(() => {
    // Start entrance animations
    fadeAnim.value = withTiming(1, { duration: 500 });
    scaleAnim.value = withSpring(1, { damping: 8 });
    slideAnim.value = withTiming(0, { duration: 500 });

    // Fetch initial data
    fetchOrders();
    fetchSuppliers();
    fetchProducts();
    checkCartItems();

    // Animate tab indicator on tab change
    switch (activeTab) {
      case 'suppliers':
        tabIndicatorPosition.value = withTiming(0, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
        break;
      case 'analytics':
        tabIndicatorPosition.value = withTiming(width / 2, { duration: 300, easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
        break;
    }
  }, [activeTab]);

  // Apply filters when search, status, or sort criteria changes
  useEffect(() => {
    filterOrders();
  }, [searchQuery, statusFilter, sortCriteria, orders]);

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

    // Apply sort
    if (sortCriteria === 'dateDesc') {
      filtered.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
    } else if (sortCriteria === 'dateAsc') {
      filtered.sort((a, b) => new Date(a.orderDate) - new Date(b.orderDate));
    } else if (sortCriteria === 'amountDesc') {
      filtered.sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0));
    } else if (sortCriteria === 'amountAsc') {
      filtered.sort((a, b) => (a.totalAmount || 0) - (b.totalAmount || 0));
    }

    setFilteredOrders(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
    fetchSuppliers();
    fetchProducts();
  };

  // Provide haptic feedback
  const provideFeedback = (type) => {
    switch (type) {
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'error':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      default:
        break;
    }
  };

  // Modified animatePress function using a single animation value
  const animatePress = (id) => {
    // Set the currently animated order ID
    setAnimatedOrderId(id);

    // Provide haptic feedback immediately
    provideFeedback('light');

    // Use a more lightweight animation that won't cause UI freezes
    animationValue.value = withSequence(
      withTiming(0.97, { duration: 50 }),
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
      provideFeedback('medium');

      await deleteDoc(doc(db, "SupplierOrders", orderToDelete.id));

      // Update local state
      const updatedOrders = orders.filter(order => order.id !== orderToDelete.id);
      setOrders(updatedOrders);

      // Close modal
      setDeleteConfirmVisible(false);
      setOrderToDelete(null);

      // Success feedback
      provideFeedback('success');
      Alert.alert(
        "Order Deleted",
        "The order has been successfully deleted.",
        [{ text: "OK" }]
      );
    } catch (err) {
      console.error("Error deleting order:", err);
      Alert.alert(
        "Error",
        "Failed to delete the order. Please try again.",
        [{ text: "OK" }]
      );
      provideFeedback('error');
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
        transform: [{ scale: animationValue.value }]
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
            // Changed the press handling to be more efficient
            provideFeedback('light');
            animatePress(order.id);

            // Add a small delay to prevent UI freeze when showing the modal
            setTimeout(() => {
              setSelectedOrder(order);
              setOrderDetailsVisible(true);
            }, 50);
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

  // Render New Order Modal
  const renderNewOrderModal = () => {
    return (
      <Modal
        visible={newOrderVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setNewOrderVisible(false)}
      >
        <BlurView
          intensity={20}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
          }}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <Animated.View
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 16,
              paddingBottom: Math.max(20, insets.bottom),
              marginTop: 'auto',
              maxHeight: height * 0.9,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -5 },
              shadowOpacity: 0.1,
              shadowRadius: 6,
              elevation: 5,
            }}
            entering={SlideInDown.springify().damping(15)}
          >
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottomWidth: 1,
              borderBottomColor: '#E5E7EB',
              paddingHorizontal: 20,
              paddingBottom: 16,
            }}>
              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={() => {
                  provideFeedback('light');
                  setNewOrderVisible(false);
                }}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>

              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>
                Create New Order
              </Text>

              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={() => {
                  provideFeedback('medium');
                  createOrder();
                }}
                disabled={!newOrder.supplierId || newOrder.products.length === 0}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={28}
                  color={!newOrder.supplierId || newOrder.products.length === 0 ? '#D1D5DB' : '#4F46E5'}
                />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              <View style={{ padding: 20 }}>
                {/* Select Supplier Section */}
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
                  Supplier Information
                </Text>

                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#F9FAFB',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 12,
                    padding: 12,
                    marginBottom: 20,
                  }}
                  onPress={() => {
                    provideFeedback('light');
                    setSelectSupplierVisible(true);
                  }}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: '#EEF2FF',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}>
                    <MaterialCommunityIcons name="store" size={20} color="#4F46E5" />
                  </View>

                  <View style={{ flex: 1 }}>
                    {newOrder.supplierName ? (
                      <>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                          {newOrder.supplierName}
                        </Text>
                        <Text style={{ fontSize: 13, color: '#6B7280' }}>
                          Supplier ID: {newOrder.supplierId.substring(0, 8)}
                        </Text>
                      </>
                    ) : (
                      <Text style={{ fontSize: 15, color: '#9CA3AF' }}>
                        Select a supplier
                      </Text>
                    )}
                  </View>

                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>

                {/* Products Section */}
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
                  Order Products
                </Text>

                {newOrder.products.length > 0 ? (
                  <View style={{ marginBottom: 20 }}>
                    {newOrder.products.map((product, index) => (
                      <Animated.View
                        key={index}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: '#F9FAFB',
                          borderWidth: 1,
                          borderColor: '#E5E7EB',
                          borderRadius: 12,
                          padding: 12,
                          marginBottom: 8,
                        }}
                        entering={FadeInRight.delay(index * 100).springify()}
                      >
                        <View style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          backgroundColor: '#F3F4F6',
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 12,
                        }}>
                          <MaterialCommunityIcons name="package-variant-closed" size={20} color="#4B5563" />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
                            {product.name}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Text style={{ fontSize: 13, color: '#6B7280' }}>
                              {product.quantity} {product.unit} at ${product.price?.toFixed(2) || '0.00'}/unit
                            </Text>
                          </View>
                        </View>

                        <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#111827', marginRight: 12 }}>
                          ${(product.quantity * product.price).toFixed(2)}
                        </Text>

                        <TouchableOpacity
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: '#FEE2E2',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}
                          onPress={() => {
                            provideFeedback('light');
                            // Remove product from order
                            const updatedProducts = [...newOrder.products];
                            updatedProducts.splice(index, 1);

                            // Recalculate total
                            const totalAmount = updatedProducts.reduce(
                              (sum, p) => sum + (p.quantity * p.price), 0
                            );

                            setNewOrder({
                              ...newOrder,
                              products: updatedProducts,
                              totalAmount,
                            });
                          }}
                        >
                          <Ionicons name="trash-outline" size={16} color="#DC2626" />
                        </TouchableOpacity>
                      </Animated.View>
                    ))}

                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      backgroundColor: '#F3F4F6',
                      borderRadius: 8,
                      marginTop: 8,
                    }}>
                      <Text style={{ fontSize: 15, fontWeight: '600', color: '#374151' }}>
                        Total Amount:
                      </Text>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>
                        ${newOrder.totalAmount?.toFixed(2) || '0.00'}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={{
                    backgroundColor: '#F9FAFB',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 12,
                    padding: 20,
                    alignItems: 'center',
                    marginBottom: 20,
                  }}>
                    <MaterialCommunityIcons name="cart-outline" size={40} color="#9CA3AF" />
                    <Text style={{ fontSize: 16, color: '#4B5563', marginTop: 12, marginBottom: 8, textAlign: 'center' }}>
                      No products added yet
                    </Text>
                    <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 16 }}>
                      Add products to your order
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#EEF2FF',
                    borderWidth: 1,
                    borderColor: '#C7D2FE',
                    borderRadius: 10,
                    paddingVertical: 12,
                    marginBottom: 20,
                  }}
                  onPress={() => {
                    provideFeedback('light');
                    setSelectProductVisible(true);
                  }}
                >
                  <Ionicons name="add-circle" size={18} color="#4F46E5" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#4F46E5' }}>
                    Add Product
                  </Text>
                </TouchableOpacity>

                {/* Order Details Section */}
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
                  Order Details
                </Text>

                <View style={{ marginBottom: 20 }}>
                  {/* Order Date (Current date by default) */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#F9FAFB',
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 12,
                    }}
                    onPress={() => {
                      provideFeedback('light');
                      setDateType('orderDate');
                      setDatePickerVisible(true);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="calendar-outline" size={20} color="#6B7280" style={{ marginRight: 10 }} />
                      <Text style={{ fontSize: 15, color: '#4B5563' }}>
                        Order Date:
                      </Text>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '500', color: '#111827' }}>
                      {formatDate(newOrder.orderDate)}
                    </Text>
                  </TouchableOpacity>

                  {/* Expected Delivery Date */}
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#F9FAFB',
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 12,
                    }}
                    onPress={() => {
                      provideFeedback('light');
                      setDateType('expectedDeliveryDate');
                      setDatePickerVisible(true);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="time-outline" size={20} color="#6B7280" style={{ marginRight: 10 }} />
                      <Text style={{ fontSize: 15, color: '#4B5563' }}>
                        Expected Delivery:
                      </Text>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '500', color: '#111827' }}>
                      {newOrder.expectedDeliveryDate ? formatDate(newOrder.expectedDeliveryDate) : 'Select date'}
                    </Text>
                  </TouchableOpacity>

                  {/* Notes */}
                  <View style={{
                    backgroundColor: '#F9FAFB',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderRadius: 10,
                    padding: 12,
                  }}>
                    <Text style={{ fontSize: 15, color: '#4B5563', marginBottom: 8 }}>
                      Order Notes:
                    </Text>
                    <TextInput
                      style={{
                        minHeight: 80,
                        fontSize: 15,
                        color: '#111827',
                        textAlignVertical: 'top',
                      }}
                      placeholder="Add notes about this order (optional)"
                      placeholderTextColor="#9CA3AF"
                      multiline
                      value={newOrder.notes}
                      onChangeText={(text) => setNewOrder({ ...newOrder, notes: text })}
                    />
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Bottom Action Buttons */}
            <View style={{
              flexDirection: 'row',
              paddingHorizontal: 20,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
            }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#F9FAFB',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 10,
                  marginRight: 8,
                }}
                onPress={() => {
                  provideFeedback('light');
                  setNewOrderVisible(false);
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#4B5563' }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 2,
                  flexDirection: 'row',
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: !newOrder.supplierId || newOrder.products.length === 0 ? '#E5E7EB' : '#4F46E5',
                  borderRadius: 10,
                }}
                onPress={() => {
                  provideFeedback('medium');
                  createOrder();
                }}
                disabled={!newOrder.supplierId || newOrder.products.length === 0}
              >
                <MaterialCommunityIcons
                  name="send"
                  size={18}
                  color={!newOrder.supplierId || newOrder.products.length === 0 ? '#9CA3AF' : 'white'}
                  style={{ marginRight: 8 }}
                />
                <Text style={{
                  fontSize: 15,
                  fontWeight: '600',
                  color: !newOrder.supplierId || newOrder.products.length === 0 ? '#9CA3AF' : 'white'
                }}>
                  Submit Order
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  // Render Order Details Modal
  const renderOrderDetailsModal = () => {
    if (!selectedOrder) return null;

    return (
      <Modal
        visible={orderDetailsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setOrderDetailsVisible(false)}
      >
        <BlurView
          intensity={20}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
          }}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <Animated.View
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 16,
              paddingBottom: Math.max(20, insets.bottom),
              marginTop: 'auto',
              maxHeight: height * 0.9,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -5 },
              shadowOpacity: 0.1,
              shadowRadius: 6,
              elevation: 5,
            }}
            entering={SlideInDown.springify().damping(15)}
          >
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottomWidth: 1,
              borderBottomColor: '#E5E7EB',
              paddingHorizontal: 20,
              paddingBottom: 16,
            }}>
              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={() => {
                  provideFeedback('light');
                  setOrderDetailsVisible(false);
                  setSelectedOrder(null);
                }}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>

              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>
                Order Details
              </Text>

              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={() => {
                  provideFeedback('light');
                  // Print or export order
                  Alert.alert(
                    "Export Order",
                    "Generate an invoice for this order?",
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Export" }
                    ]
                  );
                }}
              >
                <Ionicons name="print-outline" size={22} color="#4F46E5" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              <View style={{ padding: 20 }}>
                {/* Order Status Banner */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: getStatusColor(selectedOrder.status).bgColor,
                  borderWidth: 1,
                  borderColor: getStatusColor(selectedOrder.status).borderColor,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                }}>
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: 'white',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}>
                    {getStatusIcon(selectedOrder.status)}
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: 'bold',
                      color: getStatusColor(selectedOrder.status).textColor,
                      marginBottom: 2,
                    }}>
                      {selectedOrder.status} Order
                    </Text>
                    <Text style={{
                      fontSize: 13,
                      color: getStatusColor(selectedOrder.status).textColor,
                      opacity: 0.8,
                    }}>
                      {getStatusMessage(selectedOrder.status)}
                    </Text>
                  </View>
                </View>

                {/* Order ID and Dates */}
                <View style={{
                  backgroundColor: '#F9FAFB',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>Order ID:</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                      #{selectedOrder.id.substring(0, 8)}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>Order Date:</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                      {formatDate(selectedOrder.orderDate)}
                    </Text>
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 14, color: '#6B7280' }}>Expected Delivery:</Text>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                      {selectedOrder.expectedDeliveryDate
                        ? formatDate(selectedOrder.expectedDeliveryDate)
                        : 'Not specified'}
                    </Text>
                  </View>

                  {selectedOrder.status === 'Delivered' && selectedOrder.deliveryDate && (
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginTop: 12,
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: '#E5E7EB',
                    }}>
                      <Text style={{ fontSize: 14, color: '#6B7280' }}>Delivery Date:</Text>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#059669' }}>
                        {formatDate(selectedOrder.deliveryDate)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Supplier Info */}
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
                  Supplier Information
                </Text>

                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#F9FAFB',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                }}>
                  <View style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: '#EEF2FF',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 12,
                  }}>
                    <MaterialCommunityIcons name="store" size={22} color="#4F46E5" />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                      {selectedOrder.supplierName}
                    </Text>
                    <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                      Supplier ID: {selectedOrder.supplierId.substring(0, 8)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      backgroundColor: '#F3F4F6',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                    onPress={() => {
                      provideFeedback('light');
                      // View supplier details
                      router.push('/stockManager/AllSuppliers');
                    }}
                  >
                    <Ionicons name="open-outline" size={18} color="#4B5563" />
                  </TouchableOpacity>
                </View>

                {/* Order Products */}
                <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
                  Order Products
                </Text>

                <View style={{
                  backgroundColor: '#F9FAFB',
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 12,
                  overflow: 'hidden',
                  marginBottom: 20,
                }}>
                  {selectedOrder.products.map((product, index) => (
                    <View
                      key={index}
                      style={{
                        flexDirection: 'row',
                        padding: 16,
                        borderBottomWidth: index < selectedOrder.products.length - 1 ? 1 : 0,
                        borderBottomColor: '#E5E7EB',
                      }}
                    >
                      <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        backgroundColor: '#F3F4F6',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                      }}>
                        <MaterialCommunityIcons name="package-variant-closed" size={20} color="#4B5563" />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>
                          {product.name}
                        </Text>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                          <Text style={{ fontSize: 13, color: '#6B7280' }}>
                            {product.quantity} {product.unit} x ${product.price?.toFixed(2) || '0.00'}
                          </Text>
                          <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                            ${(product.quantity * product.price).toFixed(2)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))}

                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#EEF2FF',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                  }}>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#4F46E5' }}>
                      Total Amount:
                    </Text>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4F46E5' }}>
                      ${selectedOrder.totalAmount?.toFixed(2) || '0.00'}
                    </Text>
                  </View>
                </View>

                {/* Notes */}
                {selectedOrder.notes && (
                  <>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
                      Order Notes
                    </Text>

                    <View style={{
                      backgroundColor: '#F9FAFB',
                      borderWidth: 1,
                      borderColor: '#E5E7EB',
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 20,
                    }}>
                      <Text style={{ fontSize: 14, color: '#4B5563', lineHeight: 20 }}>
                        {selectedOrder.notes}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </ScrollView>

            {/* Bottom Action Buttons */}
            <View style={{
              flexDirection: 'row',
              paddingHorizontal: 20,
              paddingTop: 12,
              borderTopWidth: 1,
              borderTopColor: '#E5E7EB',
            }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#FEE2E2',
                  borderRadius: 10,
                  marginRight: 8,
                }}
                onPress={() => {
                  provideFeedback('medium');
                  setOrderDetailsVisible(false);
                  setOrderToDelete(selectedOrder);
                  setDeleteConfirmVisible(true);
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#DC2626' }}>
                  Delete
                </Text>
              </TouchableOpacity>

              {/* Status-based action button */}
              {selectedOrder.status !== 'Delivered' && (
                <TouchableOpacity
                  style={{
                    flex: 2,
                    flexDirection: 'row',
                    paddingVertical: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#4F46E5',
                    borderRadius: 10,
                  }}
                  onPress={() => {
                    provideFeedback('medium');
                    // Determine next status
                    let newStatus;
                    switch (selectedOrder.status) {
                      case 'Pending':
                        newStatus = 'Shipped';
                        break;
                      case 'Shipped':
                        newStatus = 'Delivered';
                        break;
                      default:
                        newStatus = 'Pending';
                    }

                    // Update status
                    updateOrderStatus(selectedOrder, newStatus);

                    // Close modal
                    setOrderDetailsVisible(false);
                  }}
                >
                  <MaterialCommunityIcons
                    name={selectedOrder.status === 'Pending' ? 'truck-delivery' : 'check-circle'}
                    size={18}
                    color="white"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ fontSize: 15, fontWeight: '600', color: 'white' }}>
                    {selectedOrder.status === 'Pending' ? 'Mark as Shipped' : 'Mark as Delivered'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  // Render date picker modal
  const renderDatePickerModal = () => {
    const handleDateChange = (event, selectedDate) => {
      const currentDate = selectedDate || (dateType === 'orderDate' ? newOrder.orderDate : newOrder.expectedDeliveryDate);

      // On Android, we close the picker on select
      if (Platform.OS === 'android') {
        setDatePickerVisible(false);

        if (dateType === 'orderDate') {
          setNewOrder({ ...newOrder, orderDate: currentDate });
        } else if (dateType === 'expectedDeliveryDate') {
          setNewOrder({ ...newOrder, expectedDeliveryDate: currentDate });
        }
      } else {
        // On iOS, we update the date but keep the picker open
        if (dateType === 'orderDate') {
          setNewOrder({ ...newOrder, orderDate: currentDate });
        } else if (dateType === 'expectedDeliveryDate') {
          setNewOrder({ ...newOrder, expectedDeliveryDate: currentDate });
        }
      }
    };

    const confirmIOSDate = () => {
      setDatePickerVisible(false);
    };

    return (
      <Modal
        visible={datePickerVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDatePickerVisible(false)}
      >
        <BlurView
          intensity={20}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
          }}
        />

        <TouchableOpacity
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setDatePickerVisible(false)}
        >
          <Animated.View
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 20,
              width: '90%',
              maxWidth: 400,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 5,
            }}
            entering={FadeIn.springify()}
          >
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 20 }}>
              {dateType === 'orderDate' ? 'Select Order Date' : 'Select Expected Delivery Date'}
            </Text>

            <DateTimePicker
              value={dateType === 'orderDate' ? newOrder.orderDate || new Date() : newOrder.expectedDeliveryDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
              style={{ width: Platform.OS === 'ios' ? 300 : 'auto' }}
              minimumDate={dateType === 'expectedDeliveryDate' ? new Date() : undefined}
              themeVariant="light"
            />

            {Platform.OS === 'ios' && (
              <View style={{
                flexDirection: 'row',
                marginTop: 20,
                width: '100%',
              }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    alignItems: 'center',
                    backgroundColor: '#F3F4F6',
                    borderRadius: 8,
                    marginRight: 8,
                  }}
                  onPress={() => setDatePickerVisible(false)}
                >
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#4B5563' }}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    alignItems: 'center',
                    backgroundColor: '#4F46E5',
                    borderRadius: 8,
                  }}
                  onPress={confirmIOSDate}
                >
                  <Text style={{ fontSize: 15, fontWeight: '600', color: 'white' }}>
                    Confirm
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // Render Delete Confirmation Modal
  const renderDeleteConfirmationModal = () => {
    return (
      <Modal
        visible={deleteConfirmVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <BlurView
          intensity={20}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
          }}
        />

        <TouchableOpacity
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setDeleteConfirmVisible(false)}
        >
          <Animated.View
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 24,
              width: '90%',
              maxWidth: 400,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 5,
            }}
            entering={FadeIn.springify()}
          >
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: '#FEE2E2',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}>
              <MaterialCommunityIcons name="alert" size={28} color="#DC2626" />
            </View>

            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 8 }}>
              Delete Order
            </Text>

            <Text style={{ fontSize: 15, color: '#4B5563', textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
              Are you sure you want to delete this order? This action cannot be undone.
            </Text>

            <View style={{ flexDirection: 'row', width: '100%' }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  alignItems: 'center',
                  backgroundColor: '#F3F4F6',
                  borderRadius: 8,
                  marginRight: 8,
                }}
                onPress={() => {
                  provideFeedback('light');
                  setDeleteConfirmVisible(false);
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#4B5563' }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  alignItems: 'center',
                  backgroundColor: '#EF4444',
                  borderRadius: 8,
                }}
                onPress={() => {
                  provideFeedback('medium');
                  deleteOrder();
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: 'white' }}>
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // Add function to handle place order button click
  const handlePlaceOrderClick = () => {
    provideFeedback('light');
    setOrderMethodModalVisible(true);
  };

  // Add renderOrderMethodModal function
  const renderOrderMethodModal = () => {
    return (
      <Modal
        visible={orderMethodModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setOrderMethodModalVisible(false)}
      >
        <BlurView
          intensity={25}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
          }}
        />

        <Pressable
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}
          onPress={() => setOrderMethodModalVisible(false)}
        >
          <Animated.View
            entering={FadeInDown.springify().damping(12)}
            style={{
              width: '100%',
              maxWidth: 500,
              backgroundColor: 'white',
              borderRadius: 24,
              padding: 0,
              overflow: 'hidden',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.1,
              shadowRadius: 15,
              elevation: 10,
            }}
          >
            <Pressable onPress={(e) => e.stopPropagation()}>
              {/* Modal Header */}
              <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                start={[0, 0]}
                end={[1, 0]}
                style={{
                  paddingVertical: 24,
                  paddingHorizontal: 20,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: 'white', textAlign: 'center' }}>
                  Choose Order Method
                </Text>
                <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4, textAlign: 'center' }}>
                  Select how you want to place your supplier order
                </Text>
              </LinearGradient>

              {/* Modal Options */}
              <View style={{ padding: 20 }}>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#F3F4F6',
                    padding: 20,
                    borderRadius: 16,
                    marginBottom: 16,
                  }}
                  onPress={() => {
                    provideFeedback('medium');
                    setOrderMethodModalVisible(false);
                    router.push('/stockManager/PlaceOrderForm');
                  }}
                >
                  <View style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: '#EEF2FF',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 16,
                  }}>
                    <MaterialCommunityIcons name="form-select" size={28} color="#4F46E5" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>
                      Order by Form
                    </Text>
                    <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 20 }}>
                      Fill out a detailed order form with supplier and product selection
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#F3F4F6',
                    padding: 20,
                    borderRadius: 16,
                  }}
                  onPress={() => {
                    provideFeedback('medium');
                    setOrderMethodModalVisible(false);
                    router.push('/stockManager/SupplierCatalog');
                  }}
                >
                  <View style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: '#F0FDF4',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 16,
                  }}>
                    <MaterialCommunityIcons name="store-search" size={28} color="#10B981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>
                      Browse Supplier Catalog
                    </Text>
                    <Text style={{ fontSize: 14, color: '#6B7280', lineHeight: 20 }}>
                      View and browse available products in supplier catalogs
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Modal Footer */}
              <View style={{
                borderTopWidth: 1,
                borderTopColor: '#E5E7EB',
                padding: 16,
                flexDirection: 'row',
                justifyContent: 'flex-end',
                backgroundColor: '#F9FAFB'
              }}>
                <TouchableOpacity
                  style={{
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    borderRadius: 8,
                    backgroundColor: '#E5E7EB',
                  }}
                  onPress={() => {
                    provideFeedback('light');
                    setOrderMethodModalVisible(false);
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '600', color: '#4B5563' }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    );
  };

  // Render all modals
  const renderModals = () => {
    return (
      <>
        {renderNewOrderModal()}
        {orderDetailsVisible && renderOrderDetailsModal()}
        {selectProductVisible && (
          <SupplierProductDisplay
            visible={selectProductVisible}
            onClose={() => setSelectProductVisible(false)}
            products={products}
            onSelectProduct={addProductToOrder}
            provideFeedback={provideFeedback}
          />
        )}
        {selectSupplierVisible && (
          <SupplierDisplay
            visible={selectSupplierVisible}
            onClose={() => setSelectSupplierVisible(false)}
            suppliers={suppliers}
            onSelectSupplier={selectSupplier}
            provideFeedback={provideFeedback}
            navigation={router}
          />
        )}
        {datePickerVisible && renderDatePickerModal()}
        {deleteConfirmVisible && renderDeleteConfirmationModal()}
        {filterVisible && renderFilterModal()}
        {orderMethodModalVisible && renderOrderMethodModal()}
      </>
    );
  };

  // Add a render function for the filter modal
  const renderFilterModal = () => {
    if (!filterVisible) return null;

    const handleStatusSelect = (status) => {
      provideFeedback('light');
      setStatusFilter(status);
      // Automatically hide the filter panel after selection
      setFilterVisible(false);
    };

    return (
      <Modal
        visible={filterVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFilterVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setFilterVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={{
              width: '90%',
              backgroundColor: 'white',
              borderRadius: 15,
              padding: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 15,
            }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>
                Filter By Status
              </Text>
              <TouchableOpacity onPress={() => setFilterVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View>
              {['All', 'Pending', 'Shipped', 'Delivered'].map(status => (
                <TouchableOpacity
                  key={status}
                  onPress={() => handleStatusSelect(status)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingVertical: 12,
                    paddingHorizontal: 15,
                    backgroundColor: statusFilter === status ? '#EEF2FF' : 'white',
                    borderRadius: 8,
                    marginBottom: 8,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor:
                        status === 'All' ? '#9CA3AF' :
                          status === 'Pending' ? '#F59E0B' :
                            status === 'Shipped' ? '#3B82F6' :
                              '#10B981',
                      marginRight: 10,
                    }} />
                    <Text style={{
                      fontSize: 16,
                      fontWeight: statusFilter === status ? '600' : 'normal',
                      color: statusFilter === status ? '#4F46E5' : '#374151',
                    }}>
                      {status}
                    </Text>
                  </View>

                  {statusFilter === status && (
                    <Ionicons name="checkmark-circle" size={22} color="#4F46E5" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    );
  };

  // Update navigation function to redirect to SupplierCatalog instead of empty page
  const navigateToSupplierProducts = () => {
    router.push("/stockManager/SupplierCatalog");
  };

  // Check for items in the cart
  const checkCartItems = async () => {
    try {
      const auth = await import('firebase/auth').then(module => module.getAuth());
      const currentUser = auth.currentUser;

      if (!currentUser) return;

      const cartRef = collection(db, `stockManager/${currentUser.uid}/supplierCart`);
      const cartSnapshot = await getDocs(cartRef);
      setCartItemCount(cartSnapshot.size);
    } catch (error) {
      console.error('Error checking cart items:', error);
    }
  };

  // Navigate to the supplier cart
  const navigateToCart = () => {
    router.push('/stockManager/SupplierCart');
  };

  // Render the supplier management tools section
  const renderManagementTools = () => {
    return (
      <View style={{ padding: 16, backgroundColor: '#F9FAFB' }}>
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 16 }}>
          Supplier Management Tools
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          {/* All Suppliers */}
          <TouchableOpacity
            onPress={() => router.push('/stockManager/AllSuppliers')}
            style={{
              width: '48%',
              backgroundColor: 'white',
              padding: 16,
              borderRadius: 12,
              marginBottom: 16,
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
            }}
          >
            <View style={{
              backgroundColor: '#EEF2FF',
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12
            }}>
              <Ionicons name="people-outline" size={24} color="#4F46E5" />
            </View>
            <Text style={{ color: '#1F2937', fontWeight: '500', marginBottom: 4 }}>All Suppliers</Text>
            <Text style={{ color: '#6B7280', fontSize: 12 }}>View and manage your suppliers</Text>
          </TouchableOpacity>

          {/* Manage Orders */}
          <TouchableOpacity
            onPress={() => router.push('/stockManager/SupplierOrders')}
            style={{
              width: '48%',
              backgroundColor: 'white',
              padding: 16,
              borderRadius: 12,
              marginBottom: 16,
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
            }}
          >
            <View style={{
              backgroundColor: '#DBEAFE',
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12
            }}>
              <MaterialCommunityIcons name="clipboard-list" size={24} color="#2563EB" />
            </View>
            <Text style={{ color: '#1F2937', fontWeight: '500', marginBottom: 4 }}>Manage Orders</Text>
            <Text style={{ color: '#6B7280', fontSize: 12 }}>View, track, and manage all supplier orders</Text>
          </TouchableOpacity>

          {/* Place Orders */}
          <TouchableOpacity
            onPress={() => handlePlaceOrderClick()}
            style={{
              width: '48%',
              backgroundColor: 'white',
              padding: 16,
              borderRadius: 12,
              marginBottom: 16,
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
            }}
          >
            <View style={{
              backgroundColor: '#ECFDF5',
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12
            }}>
              <MaterialCommunityIcons name="cart-plus" size={24} color="#10B981" />
            </View>
            <Text style={{ color: '#1F2937', fontWeight: '500', marginBottom: 4 }}>Place Orders</Text>
            <Text style={{ color: '#6B7280', fontSize: 12 }}>Create new purchase orders</Text>
          </TouchableOpacity>

          {/* Supplier Products */}
          <TouchableOpacity
            onPress={() => navigateToSupplierProducts()}
            style={{
              width: '48%',
              backgroundColor: 'white',
              padding: 16,
              borderRadius: 12,
              marginBottom: 16,
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
            }}
          >
            <View style={{
              backgroundColor: '#E0F2FE',
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12
            }}>
              <MaterialCommunityIcons name="package-variant-closed" size={24} color="#0284C7" />
            </View>
            <Text style={{ color: '#1F2937', fontWeight: '500', marginBottom: 4 }}>Supplier Products</Text>
            <Text style={{ color: '#6B7280', fontSize: 12 }}>View and manage products from suppliers</Text>
          </TouchableOpacity>

          {/* Supplier Chat */}
          <TouchableOpacity
            onPress={() => router.push('/stockManager/systemChat')}
            style={{
              width: '48%',
              backgroundColor: 'white',
              padding: 16,
              borderRadius: 12,
              marginBottom: 16,
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
            }}
          >
            <View style={{
              backgroundColor: '#FCE7F3',
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12
            }}>
              <MaterialCommunityIcons name="chat-processing" size={24} color="#DB2777" />
            </View>
            <Text style={{ color: '#1F2937', fontWeight: '500', marginBottom: 4 }}>Supplier Communication</Text>
            <Text style={{ color: '#6B7280', fontSize: 12 }}>Chat and message with your suppliers</Text>
          </TouchableOpacity>

          {/* Delivery Management */}
          <TouchableOpacity
            onPress={() => router.push('/stockManager/manageDelivery')}
            style={{
              width: '48%',
              backgroundColor: 'white',
              padding: 16,
              borderRadius: 12,
              marginBottom: 16,
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
            }}
          >
            <View style={{
              backgroundColor: '#FEF3C7',
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12
            }}>
              <MaterialCommunityIcons name="truck-delivery" size={24} color="#D97706" />
            </View>
            <Text style={{ color: '#1F2937', fontWeight: '500', marginBottom: 4 }}>Delivery Management</Text>
            <Text style={{ color: '#6B7280', fontSize: 12 }}>Track and manage supplier deliveries</Text>
          </TouchableOpacity>

          {/* Performance Analytics */}
          <TouchableOpacity
            onPress={() => router.push('/stockManager/SPerformanceAnalytics')}
            style={{
              width: '48%',
              backgroundColor: 'white',
              padding: 16,
              borderRadius: 12,
              marginBottom: 16,
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
            }}
          >
            <View style={{
              backgroundColor: '#EDE9FE',
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12
            }}>
              <MaterialCommunityIcons name="chart-bar" size={24} color="#7C3AED" />
            </View>
            <Text style={{ color: '#1F2937', fontWeight: '500', marginBottom: 4 }}>Performance Analytics</Text>
            <Text style={{ color: '#6B7280', fontSize: 12 }}>View detailed supplier performance metrics</Text>
          </TouchableOpacity>

          {/* Cart */}
          <TouchableOpacity
            onPress={() => navigateToCart()}
            style={{
              width: '48%',
              backgroundColor: 'white',
              padding: 16,
              borderRadius: 12,
              marginBottom: 16,
              elevation: 2,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
            }}
          >
            <View style={{
              backgroundColor: '#F0FDF4',
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
              position: 'relative'
            }}>
              <Ionicons name="cart-outline" size={24} color="#22C55E" />
              {cartItemCount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  backgroundColor: '#EF4444',
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                    {cartItemCount > 9 ? '9+' : cartItemCount}
                  </Text>
                </View>
              )}
            </View>
            <Text style={{ color: '#1F2937', fontWeight: '500', marginBottom: 4 }}>Supplier Cart</Text>
            <Text style={{ color: '#6B7280', fontSize: 12 }}>View items in your supplier cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Updated render header to use HomeHeader component
  const renderHeader = () => (
    <View style={{ backgroundColor: '#F9FAFB' }}>
      <HomeHeader title="Supplier Management" />
    </View>
  );

  // Main render function
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <StatusBar style="dark" />
      {renderHeader()}
      <ScrollView showsVerticalScrollIndicator={false}>
        {renderManagementTools()}
      </ScrollView>
      {renderModals()}
    </SafeAreaView>
  );
}
