import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  FlatList,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, Feather, Entypo, AntDesign } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  Easing,
  FadeInDown,
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeHeader from "../../components/HomeHeader";
import * as Haptics from 'expo-haptics';
import { db } from '../../../firebase/firebaseConfig';
import { collection, query, where, getDocs, doc, updateDoc, Timestamp, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Filter category component for the modal
const FilterCategory = ({ title, active, count, onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.filterCategory, active && styles.activeFilterCategory]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.filterCategoryText, active && styles.activeFilterCategoryText]}>{title}</Text>
      {count > 0 && (
        <View style={styles.filterBadge}>
          <Text style={styles.filterBadgeText}>{count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Status color mapping
const getStatusColor = (status) => {
  switch (status) {
    case 'Pending': return { bg: '#FFF4DE', text: '#FFA940' };
    case 'Processing': return { bg: '#E6F7FF', text: '#1890FF' };
    case 'Shipped': return { bg: '#F6FFED', text: '#52C41A' };
    case 'Delivered': return { bg: '#F0F5FF', text: '#2F54EB' };
    case 'Cancelled': return { bg: '#FFF1F0', text: '#FF4D4F' };
    default: return { bg: '#F5F5F5', text: '#8C8C8C' };
  }
};

const OrderCard = ({ order, onPress }) => {
  // Animation values
  const animation = useSharedValue(0);

  useEffect(() => {
    animation.value = withTiming(1, {
      duration: 400,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, []);

  const animStyle = useAnimatedStyle(() => {
    return {
      opacity: animation.value,
      transform: [
        { translateY: interpolate(animation.value, [0, 1], [20, 0]) },
      ]
    };
  });

  const statusColor = getStatusColor(order.status);

  // Format date
  const formatDate = (dateObj) => {
    if (!dateObj) return 'Unknown date';
    return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Calculate total items
  const totalItems = order.items ? order.items.length : 0;

  return (
    <AnimatedTouchable
      style={[styles.orderCard, animStyle]}
      onPress={() => onPress(order)}
      activeOpacity={0.97}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>{order.orderNumber || `Order #${order.id.substring(0, 8)}`}</Text>
          <Text style={styles.orderDate}>{formatDate(order.orderDate)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
          <Text style={[styles.statusText, { color: statusColor.text }]}>
            {order.status}
          </Text>
        </View>
      </View>

      <View style={styles.orderDetailRow}>
        <View style={styles.orderDetailItem}>
          <Text style={styles.orderDetailLabel}>Items</Text>
          <Text style={styles.orderDetailValue}>{totalItems}</Text>
        </View>
        <View style={styles.orderDetailDivider} />
        <View style={styles.orderDetailItem}>
          <Text style={styles.orderDetailLabel}>Total Amount</Text>
          <Text style={styles.orderDetailValue}>{order.totalAmount?.toFixed(2) || "0.00"} Birr</Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.viewDetailsButton}
        onPress={() => onPress(order)}
      >
        <Text style={styles.viewDetailsText}>View Details</Text>
        <Ionicons name="chevron-forward" size={18} color="#5E7CE2" />
      </TouchableOpacity>
    </AnimatedTouchable>
  );
};

export default function ManageOrder() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { filter } = params;
  const auth = getAuth();
  const user = auth.currentUser;

  // States
  const [activeFilter, setActiveFilter] = useState('all');
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    // If a filter parameter is provided, set it as the active filter
    if (filter === 'lowStock') {
      setActiveFilter('Pending');
    }

    // Fetch orders on component mount
    fetchOrders();
  }, [filter]);

  // Fetch orders from Firestore
  const fetchOrders = async () => {
    if (!user) {
      console.error("User not logged in");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Get the supplier's ID from the current user
      const currentUserId = user.uid;
      console.log("Current user ID:", currentUserId);

      // Query orders for this supplier
      const ordersRef = collection(db, "SupplierOrders");

      // We need to get all orders initially
      const querySnapshot = await getDocs(ordersRef);

      const fetchedOrders = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          orderDate: data.orderDate?.toDate() || new Date(),
          expectedDeliveryDate: data.expectedDeliveryDate?.toDate() || null,
          deliveryDate: data.deliveryDate?.toDate() || null,
          payment: data.payment || null,
          orderHistory: data.orderHistory || [],
        };
      });

      console.log(`Found ${fetchedOrders.length} total orders`);

      // Log the first order as a sample to check data structure
      if (fetchedOrders.length > 0) {
        console.log('Sample order data structure:', JSON.stringify(fetchedOrders[0]));
      }

      // Validate that each order has the required fields
      const validOrders = fetchedOrders.filter(order => {
        if (!order.id) {
          console.warn('Found order without ID, skipping');
          return false;
        }
        return true;
      });

      // FOR DEVELOPMENT/TESTING: Show all orders instead of filtering
      // This is needed since user.uid doesn't match any supplierId in the database
      setOrders(validOrders);
      setFilteredOrders(validOrders);
      console.log("DEVELOPMENT MODE: Showing all orders for testing");

      // In case we have no orders after filtering, let's log available supplierIds for debugging
      const uniqueSupplierIds = [...new Set(validOrders.map(order => order.supplierId))];
      console.log("Available supplier IDs in orders:", uniqueSupplierIds);

      // NOTE: In production, uncomment the following code to filter orders by supplierId
      /*
      // Filter orders for the current supplier
      const supplierOrders = validOrders.filter(order =>
        order.supplierId === currentUserId
      );

      console.log(`Found ${supplierOrders.length} orders for supplier ID: ${currentUserId}`);
      
      setOrders(supplierOrders);
      setFilteredOrders(supplierOrders);
      */

    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate counts for each status
  const getOrderCountByStatus = (status) => {
    return orders.filter(order => status === 'all' || order.status === status).length;
  };

  // Filter orders when tab changes or search query changes
  useEffect(() => {
    if (!orders || orders.length === 0) return; // Guard against empty orders

    setIsLoading(true);

    // Apply filters immediately for better responsiveness
    let filtered = [...orders];

    // Apply status filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(order => order.status === activeFilter);
    }

    // Apply search filter if there's a query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber?.toLowerCase().includes(query) ||
        order.supplierName?.toLowerCase().includes(query) ||
        order.id.toLowerCase().includes(query) ||
        order.items?.some(item => item.name?.toLowerCase().includes(query))
      );
    }

    // Short timeout to allow the UI to update
    setTimeout(() => {
      setFilteredOrders(filtered);
      setIsLoading(false);
    }, 100);
  }, [activeFilter, orders, searchQuery]);

  const handleStatusChange = async (orderId, action) => {
    try {
      // Find the order
      const orderToUpdate = orders.find(order => order.id === orderId);
      if (!orderToUpdate) return;

      let newStatus = orderToUpdate.status;

      if (action === 'next') {
        // Move to next status
        if (orderToUpdate.status === 'Pending') newStatus = 'Processing';
        else if (orderToUpdate.status === 'Processing') newStatus = 'Shipped';
        else if (orderToUpdate.status === 'Shipped') newStatus = 'Delivered';
      } else if (action === 'cancel') {
        newStatus = 'Cancelled';
      }

      if (newStatus === orderToUpdate.status) return;

      // Create a history entry
      const historyEntry = {
        status: newStatus.toLowerCase(),
        timestamp: new Date().toISOString(),
        note: `Order status updated to ${newStatus}`
      };

      // Update in Firestore
      const orderRef = doc(db, "SupplierOrders", orderId);

      const updateData = {
        status: newStatus
      };

      // If status is Delivered, add delivery date
      if (newStatus === 'Delivered') {
        updateData.deliveryDate = Timestamp.fromDate(new Date());
      }

      // Add to order history if array exists
      if (orderToUpdate.orderHistory && Array.isArray(orderToUpdate.orderHistory)) {
        updateData.orderHistory = [...orderToUpdate.orderHistory, historyEntry];
      } else {
        updateData.orderHistory = [historyEntry];
      }

      await updateDoc(orderRef, updateData);

      // Update local state
      setOrders(prevOrders => {
        return prevOrders.map(order => {
          if (order.id === orderId) {
            const updatedOrder = {
              ...order,
              status: newStatus,
              deliveryDate: newStatus === 'Delivered' ? new Date() : order.deliveryDate
            };

            // Update the order history in local state
            if (order.orderHistory && Array.isArray(order.orderHistory)) {
              updatedOrder.orderHistory = [...order.orderHistory, historyEntry];
            } else {
              updatedOrder.orderHistory = [historyEntry];
            }

            return updatedOrder;
          }
          return order;
        });
      });

      // Give haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    } catch (error) {
      console.error("Error updating order status:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleOrderPress = (order) => {
    console.log('Order pressed:', order.id);

    if (!order) {
      console.error('Order data is undefined or null');
      return;
    }

    // Set the selected order and show the modal
    setSelectedOrder(order);
    setDetailsVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Handle filter selection
  const handleFilterSelect = (filter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filter);
    closeFilterModal();
  };

  // Show filter modal
  const openFilterModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilterModalVisible(true);
  };

  // Hide filter modal
  const closeFilterModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilterModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <HomeHeader
        title="Manage Orders"
        showBackButton={true}
        onBackPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
      />

      {/* Order Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#E6F7FF' }]}>
            <Ionicons name="receipt-outline" size={22} color="#1890FF" />
          </View>
          <View>
            <Text style={styles.statValue}>{orders.length}</Text>
            <Text style={styles.statLabel}>Total Orders</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#FFF4DE' }]}>
            <MaterialIcons name="pending-actions" size={22} color="#FFA940" />
          </View>
          <View>
            <Text style={styles.statValue}>{orders.filter(o => o.status === 'Pending').length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#F6FFED' }]}>
            <Feather name="truck" size={22} color="#52C41A" />
          </View>
          <View>
            <Text style={styles.statValue}>{orders.filter(o => o.status === 'Shipped').length}</Text>
            <Text style={styles.statLabel}>Shipped</Text>
          </View>
        </View>
      </View>

      {/* Search and Filter Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search orders..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSearchQuery('');
              }}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={openFilterModal}
          activeOpacity={0.7}
        >
          <Ionicons name="filter" size={22} color="#5E7CE2" />
          {activeFilter !== 'all' && (
            <View style={styles.filterActiveIndicator} />
          )}
        </TouchableOpacity>
      </View>

      {/* Active filter indicator */}
      {activeFilter !== 'all' && (
        <View style={styles.activeFilterContainer}>
          <Text style={styles.activeFilterLabel}>Active filter:</Text>
          <View style={styles.activeFilterChip}>
            <Text style={styles.activeFilterChipText}>
              {activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)}
            </Text>
            <TouchableOpacity
              onPress={() => setActiveFilter('all')}
              hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            >
              <Ionicons name="close-circle" size={16} color="#5E7CE2" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Order List */}
      <View style={styles.orderListContainer}>
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#5E7CE2" />
            <Text style={styles.loaderText}>Loading orders...</Text>
          </View>
        ) : filteredOrders.length > 0 ? (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <OrderCard
                order={item}
                onPress={handleOrderPress}
              />
            )}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.orderList}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={60} color="#ccc" />
            <Text style={styles.emptyTitle}>No Orders Found</Text>
            <Text style={styles.emptyMessage}>
              There are no orders matching the selected filter
            </Text>
          </View>
        )}
      </View>

      {/* Order Details Modal */}
      <Modal
        visible={detailsVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          console.log('Modal close requested');
          setDetailsVisible(false);
        }}
      >
        <BlurView
          intensity={20}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
          }}
          tint="dark"
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
            {/* Modal Header with Title */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#f0f0f0',
            }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1e293b' }}>Order Details</Text>
              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={() => {
                  console.log('Close button pressed');
                  setDetailsVisible(false);
                }}
              >
                <Ionicons name="close" size={24} color="#4B5563" />
              </TouchableOpacity>
            </View>

            {/* Order Info */}
            {selectedOrder ? (
              <ScrollView
                style={{ padding: 16 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Order Status Banner */}
                <View style={{
                  backgroundColor: getStatusColor(selectedOrder.status).bg,
                  padding: 12,
                  borderRadius: 12,
                  marginBottom: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {selectedOrder.status === 'Pending' && <Ionicons name="time-outline" size={24} color={getStatusColor(selectedOrder.status).text} />}
                    {selectedOrder.status === 'Processing' && <Ionicons name="construct-outline" size={24} color={getStatusColor(selectedOrder.status).text} />}
                    {selectedOrder.status === 'Shipped' && <Ionicons name="car-outline" size={24} color={getStatusColor(selectedOrder.status).text} />}
                    {selectedOrder.status === 'Delivered' && <Ionicons name="checkmark-circle-outline" size={24} color={getStatusColor(selectedOrder.status).text} />}
                    {selectedOrder.status === 'Cancelled' && <Ionicons name="close-circle-outline" size={24} color={getStatusColor(selectedOrder.status).text} />}
                    <Text style={{
                      fontSize: 16,
                      fontWeight: 'bold',
                      color: getStatusColor(selectedOrder.status).text,
                      marginLeft: 8
                    }}>
                      {selectedOrder.status}
                    </Text>
                  </View>

                  <Text style={{
                    color: getStatusColor(selectedOrder.status).text,
                    fontSize: 14
                  }}>
                    Order #{selectedOrder.orderNumber || selectedOrder.id.substring(0, 8)}
                  </Text>
                </View>

                {/* Order ID and Status */}
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Order Information</Text>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Order Date:</Text>
                    <Text style={styles.detailsValue}>
                      {selectedOrder.orderDate && selectedOrder.orderDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Text>
                  </View>

                  {selectedOrder.supplierName && (
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Supplier:</Text>
                      <Text style={styles.detailsValue}>{selectedOrder.supplierName}</Text>
                    </View>
                  )}
                  {selectedOrder.createdBy && (
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Created By:</Text>
                      <Text style={styles.detailsValue}>Stock Manager</Text>
                    </View>
                  )}
                  {selectedOrder.expectedDeliveryDate && (
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Expected Delivery:</Text>
                      <Text style={styles.detailsValue}>
                        {selectedOrder.expectedDeliveryDate.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Text>
                    </View>
                  )}
                  {selectedOrder.deliveryDate && (
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Delivered On:</Text>
                      <Text style={styles.detailsValue}>
                        {selectedOrder.deliveryDate.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </Text>
                    </View>
                  )}
                  {selectedOrder.notes && selectedOrder.notes.trim() !== "" && (
                    <View style={[styles.detailsRow, { alignItems: 'flex-start' }]}>
                      <Text style={styles.detailsLabel}>Notes:</Text>
                      <Text style={[styles.detailsValue, { flex: 1, textAlign: 'right' }]}>
                        {selectedOrder.notes}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Order Reference and other identifiers */}
                {selectedOrder.supplierOrderRef && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsSectionTitle}>References</Text>
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Order Reference:</Text>
                      <Text style={styles.detailsValue}>{selectedOrder.supplierOrderRef}</Text>
                    </View>
                    {selectedOrder.orderNumber && (
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Order #:</Text>
                        <Text style={styles.detailsValue}>{selectedOrder.orderNumber}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Payment Information */}
                {selectedOrder.payment && (
                  <View style={styles.detailsSection}>
                    <Text style={styles.detailsSectionTitle}>Payment Information</Text>
                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Method:</Text>
                      <Text style={styles.detailsValue}>
                        {selectedOrder.payment.method === 'chapa' ? 'Online Payment' : selectedOrder.payment.method}
                      </Text>
                    </View>

                    {selectedOrder.payment.provider && (
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Provider:</Text>
                        <Text style={styles.detailsValue}>{selectedOrder.payment.provider}</Text>
                      </View>
                    )}

                    <View style={styles.detailsRow}>
                      <Text style={styles.detailsLabel}>Status:</Text>
                      <View style={{
                        backgroundColor: selectedOrder.payment.status === 'completed' ? '#F0FDF4' : '#FEF2F2',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 6
                      }}>
                        <Text style={{
                          color: selectedOrder.payment.status === 'completed' ? '#16A34A' : '#DC2626',
                          fontWeight: '600'
                        }}>
                          {selectedOrder.payment.status === 'completed' ? 'Paid' : selectedOrder.payment.status}
                        </Text>
                      </View>
                    </View>

                    {selectedOrder.payment.tx_ref && (
                      <View style={styles.detailsRow}>
                        <Text style={styles.detailsLabel}>Transaction:</Text>
                        <Text style={styles.detailsValue}>{selectedOrder.payment.tx_ref}</Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Items */}
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Order Items</Text>
                  {selectedOrder.items && selectedOrder.items.map((item, index) => (
                    <View key={index} style={styles.detailsItemCard}>
                      <View style={styles.detailsItemHeader}>
                        <Text style={styles.detailsItemName}>{item.name}</Text>
                        <Text style={styles.detailsItemPrice}>{item.price?.toFixed(2) || "0.00"} Birr</Text>
                      </View>
                      <View style={styles.detailsItemDetails}>
                        <Text style={styles.detailsItemInfo}>
                          Quantity: {item.quantity} {item.unit || "units"}
                        </Text>
                        <Text style={styles.detailsItemInfo}>
                          Total: {item.totalPrice?.toFixed(2) || (item.price * item.quantity).toFixed(2)} Birr
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Total */}
                <View style={styles.detailsSection}>
                  <Text style={styles.detailsSectionTitle}>Order Summary</Text>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Total Items:</Text>
                    <Text style={styles.detailsValue}>{selectedOrder.items?.length || 0}</Text>
                  </View>
                  <View style={styles.detailsRow}>
                    <Text style={styles.detailsLabel}>Total Amount:</Text>
                    <Text style={styles.detailsTotalValue}>
                      {selectedOrder.totalAmount?.toFixed(2) || "0.00"} Birr
                    </Text>
                  </View>
                </View>

                {/* Actions */}
                <View style={styles.detailsActions}>
                  {selectedOrder.status !== 'Delivered' && selectedOrder.status !== 'Cancelled' && (
                    <TouchableOpacity
                      style={[styles.detailsActionButton, { backgroundColor: '#EBF8FF' }]}
                      onPress={() => {
                        handleStatusChange(selectedOrder.id, 'next');
                        setDetailsVisible(false);
                      }}
                    >
                      <View style={styles.actionButtonContent}>
                        <Feather name="arrow-right-circle" size={18} color="#3182CE" style={{ marginRight: 6 }} />
                        <Text style={{ color: '#3182CE', fontWeight: '600' }}>
                          {selectedOrder.status === 'Pending'
                            ? 'Start Processing'
                            : selectedOrder.status === 'Processing'
                              ? 'Mark as Shipped'
                              : 'Mark as Delivered'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {selectedOrder.status !== 'Cancelled' && selectedOrder.status !== 'Delivered' && (
                    <TouchableOpacity
                      style={[styles.detailsActionButton, { backgroundColor: '#FFF5F5', marginLeft: 8 }]}
                      onPress={() => {
                        handleStatusChange(selectedOrder.id, 'cancel');
                        setDetailsVisible(false);
                      }}
                    >
                      <View style={styles.actionButtonContent}>
                        <Feather name="x-circle" size={18} color="#E53E3E" style={{ marginRight: 6 }} />
                        <Text style={{ color: '#E53E3E', fontWeight: '600' }}>Cancel Order</Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {(selectedOrder.status === 'Cancelled' || selectedOrder.status === 'Delivered') && (
                    <TouchableOpacity
                      style={[styles.detailsActionButton, { backgroundColor: '#F7FAFC' }]}
                      onPress={() => setDetailsVisible(false)}
                    >
                      <View style={styles.actionButtonContent}>
                        <Feather name="check-circle" size={18} color="#4A5568" style={{ marginRight: 6 }} />
                        <Text style={{ color: '#4A5568', fontWeight: '600' }}>Close</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            ) : (
              <View style={[styles.detailsModalBody, { justifyContent: 'center', alignItems: 'center', minHeight: 200 }]}>
                <ActivityIndicator size="large" color="#5E7CE2" />
                <Text style={{ marginTop: 20, fontSize: 16, color: '#666' }}>Loading order details...</Text>
              </View>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeFilterModal}
      >
        <BlurView
          intensity={20}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
          }}
          tint="dark"
        />

        <TouchableOpacity
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center'
          }}
          activeOpacity={1}
          onPress={closeFilterModal}
        >
          <Animated.View
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              width: width * 0.85,
              maxHeight: height * 0.7,
              paddingBottom: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 10,
              elevation: 5,
            }}
            entering={FadeIn.springify().damping(15)}
          >
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#f0f0f0',
            }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>Filter Orders</Text>
              <TouchableOpacity
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onPress={closeFilterModal}
              >
                <Ionicons name="close" size={22} color="#4B5563" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ padding: 16, maxHeight: height * 0.5 }}
              showsVerticalScrollIndicator={false}
            >
              <FilterCategory
                title="All Orders"
                active={activeFilter === 'all'}
                count={getOrderCountByStatus('all')}
                onPress={() => handleFilterSelect('all')}
              />
              <FilterCategory
                title="Pending"
                active={activeFilter === 'Pending'}
                count={getOrderCountByStatus('Pending')}
                onPress={() => handleFilterSelect('Pending')}
              />
              <FilterCategory
                title="Processing"
                active={activeFilter === 'Processing'}
                count={getOrderCountByStatus('Processing')}
                onPress={() => handleFilterSelect('Processing')}
              />
              <FilterCategory
                title="Shipped"
                active={activeFilter === 'Shipped'}
                count={getOrderCountByStatus('Shipped')}
                onPress={() => handleFilterSelect('Shipped')}
              />
              <FilterCategory
                title="Delivered"
                active={activeFilter === 'Delivered'}
                count={getOrderCountByStatus('Delivered')}
                onPress={() => handleFilterSelect('Delivered')}
              />
              <FilterCategory
                title="Cancelled"
                active={activeFilter === 'Cancelled'}
                count={getOrderCountByStatus('Cancelled')}
                onPress={() => handleFilterSelect('Cancelled')}
              />
            </ScrollView>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 10,
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#4B5563',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  filterActiveIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5E7CE2',
  },
  activeFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
  },
  activeFilterLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  activeFilterChipText: {
    fontSize: 13,
    color: '#5E7CE2',
    marginRight: 6,
  },
  orderListContainer: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  orderList: {
    padding: 16,
    paddingBottom: 80,
  },
  orderCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  orderDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  orderDetailItem: {
    flex: 1,
  },
  orderDetailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  orderDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  orderDetailDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    backgroundColor: '#f9fafb',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5E7CE2',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loaderText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B5563',
    marginTop: 12,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  filterCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activeFilterCategory: {
    backgroundColor: '#F9FAFB',
  },
  filterCategoryText: {
    fontSize: 16,
    color: '#4B5563',
  },
  activeFilterCategoryText: {
    color: '#5E7CE2',
    fontWeight: '500',
  },
  filterBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  filterBadgeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  detailsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  detailsSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailsLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  detailsValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  detailsTotalValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: 'bold',
  },
  detailsStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  detailsItemCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  detailsItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailsItemName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  detailsItemPrice: {
    fontSize: 15,
    color: '#1F2937',
    fontWeight: '500',
  },
  detailsItemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailsItemInfo: {
    fontSize: 13,
    color: '#6B7280',
  },
  detailsActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  detailsActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 180,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsModalBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
});
