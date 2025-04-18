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
  FadeIn
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeHeader from "../../components/HomeHeader";
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

// Sample order data - in a real app, this would come from the backend
const SAMPLE_ORDERS = [
  {
    id: 'ORD-0001',
    date: '2023-07-15',
    store: 'Main Street Supermarket',
    totalItems: 23,
    totalAmount: 1845.50,
    status: 'pending',
    items: [
      { name: 'Organic Milk', quantity: 10, price: 24.99 },
      { name: 'Whole Wheat Bread', quantity: 15, price: 18.50 },
      { name: 'Fresh Eggs (Dozen)', quantity: 8, price: 35.75 },
    ]
  },
  {
    id: 'ORD-0002',
    date: '2023-07-14',
    store: 'Central Market',
    totalItems: 15,
    totalAmount: 975.25,
    status: 'processing',
    items: [
      { name: 'Premium Coffee', quantity: 5, price: 45.99 },
      { name: 'Assorted Chocolates', quantity: 10, price: 32.50 },
    ]
  },
  {
    id: 'ORD-0003',
    date: '2023-07-13',
    store: 'Downtown Grocery',
    totalItems: 32,
    totalAmount: 2341.75,
    status: 'shipped',
    items: [
      { name: 'Fresh Apples', quantity: 20, price: 15.99 },
      { name: 'Cereal Variety Pack', quantity: 12, price: 68.50 },
    ]
  },
  {
    id: 'ORD-0004',
    date: '2023-07-12',
    store: 'Food Plus',
    totalItems: 18,
    totalAmount: 1245.00,
    status: 'delivered',
    items: [
      { name: 'Organic Vegetables', quantity: 15, price: 22.50 },
      { name: 'Natural Honey', quantity: 3, price: 85.75 },
    ]
  },
  {
    id: 'ORD-0005',
    date: '2023-07-11',
    store: 'Main Street Supermarket',
    totalItems: 27,
    totalAmount: 1950.25,
    status: 'pending',
    items: [
      { name: 'Fresh Juice Assortment', quantity: 18, price: 32.99 },
      { name: 'Premium Cheese Selection', quantity: 9, price: 120.50 },
    ]
  },
];

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

const OrderCard = ({ order, onPress, onStatusChange }) => {
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

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return { bg: '#FFF4DE', text: '#FFA940' };
      case 'processing': return { bg: '#E6F7FF', text: '#1890FF' };
      case 'shipped': return { bg: '#F6FFED', text: '#52C41A' };
      case 'delivered': return { bg: '#F0F5FF', text: '#2F54EB' };
      case 'cancelled': return { bg: '#FFF1F0', text: '#FF4D4F' };
      default: return { bg: '#F5F5F5', text: '#8C8C8C' };
    }
  };

  const statusColor = getStatusColor(order.status);

  // Format date
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <AnimatedTouchable
      style={[styles.orderCard, animStyle]}
      onPress={onPress}
      activeOpacity={0.97}
    >
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>{order.id}</Text>
          <Text style={styles.orderDate}>{formatDate(order.date)}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
          <Text style={[styles.statusText, { color: statusColor.text }]}>
            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.orderStoreRow}>
        <Ionicons name="storefront-outline" size={16} color="#666" />
        <Text style={styles.orderStore}>{order.store}</Text>
      </View>

      <View style={styles.orderDetailRow}>
        <View style={styles.orderDetailItem}>
          <Text style={styles.orderDetailLabel}>Items</Text>
          <Text style={styles.orderDetailValue}>{order.totalItems}</Text>
        </View>
        <View style={styles.orderDetailDivider} />
        <View style={styles.orderDetailItem}>
          <Text style={styles.orderDetailLabel}>Total Amount</Text>
          <Text style={styles.orderDetailValue}>${order.totalAmount.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.orderItemsPreview}>
        {order.items.slice(0, 2).map((item, index) => (
          <View key={index} style={styles.orderItemRow}>
            <Text style={styles.orderItemName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.orderItemQuantity}>x{item.quantity}</Text>
            <Text style={styles.orderItemPrice}>${item.price.toFixed(2)}</Text>
          </View>
        ))}
        {order.items.length > 2 && (
          <TouchableOpacity style={styles.viewMoreButton}>
            <Text style={styles.viewMoreText}>+{order.items.length - 2} more items</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.orderActions}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#EFF6FF' }]}
          onPress={() => onStatusChange(order.id, 'next')}
        >
          <Feather name="arrow-right-circle" size={16} color="#3B82F6" />
          <Text style={[styles.actionButtonText, { color: '#3B82F6' }]}>Next Stage</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#FEF2F2' }]}
          onPress={() => onStatusChange(order.id, 'cancel')}
        >
          <Feather name="x-circle" size={16} color="#EF4444" />
          <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </AnimatedTouchable>
  );
};

export default function ManageOrder() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { filter } = params;

  // States
  const [activeFilter, setActiveFilter] = useState('all');
  const [orders, setOrders] = useState(SAMPLE_ORDERS);
  const [filteredOrders, setFilteredOrders] = useState(SAMPLE_ORDERS);
  const [isLoading, setIsLoading] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    // If a filter parameter is provided, set it as the active filter
    if (filter === 'lowStock') {
      setActiveFilter('pending');
    }
  }, [filter]);

  // Animation values for modal
  const modalAnimation = useSharedValue(0);

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
        order.id.toLowerCase().includes(query) ||
        order.store.toLowerCase().includes(query)
      );
    }

    // Short timeout to allow the UI to update
    setTimeout(() => {
      setFilteredOrders(filtered);
      setIsLoading(false);
    }, 100);
  }, [activeFilter, orders, searchQuery]);

  const handleStatusChange = (orderId, action) => {
    setOrders(prevOrders => {
      return prevOrders.map(order => {
        if (order.id === orderId) {
          let newStatus = order.status;

          if (action === 'next') {
            // Move to next status
            if (order.status === 'pending') newStatus = 'processing';
            else if (order.status === 'processing') newStatus = 'shipped';
            else if (order.status === 'shipped') newStatus = 'delivered';
          } else if (action === 'cancel') {
            newStatus = 'cancelled';
          }

          return { ...order, status: newStatus };
        }
        return order;
      });
    });
  };

  const handleOrderPress = (order) => {
    console.log('Order pressed:', order.id);
    // Navigate to order details
    // router.push(`/suplier/order-details?id=${order.id}`);
  };

  // Handle filter selection
  const handleFilterSelect = (filter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filter);
    // Close modal after selection - use the proper close function
    closeFilterModal();
  };

  // Show filter modal
  const openFilterModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilterModalVisible(true);
    modalAnimation.value = withTiming(1, { duration: 300 });
  };

  // Hide filter modal
  const closeFilterModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    modalAnimation.value = withTiming(0, { duration: 200 });
    setTimeout(() => {
      setFilterModalVisible(false);
    }, 200);
  };

  // Modal animation styles
  const modalContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: modalAnimation.value,
    };
  });

  const modalContentStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: interpolate(modalAnimation.value, [0, 1], [20, 0]) }
      ],
      opacity: modalAnimation.value,
    };
  });

  // Clear search handler
  const handleClearSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery('');
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
            <Text style={styles.statValue}>{orders.filter(o => o.status === 'pending').length}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconBg, { backgroundColor: '#F6FFED' }]}>
            <Feather name="truck" size={22} color="#52C41A" />
          </View>
          <View>
            <Text style={styles.statValue}>{orders.filter(o => o.status === 'shipped').length}</Text>
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
              onPress={handleClearSearch}
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
                onPress={() => handleOrderPress(item)}
                onStatusChange={handleStatusChange}
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

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
      >
        <AntDesign name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Filter Modal */}
      {filterModalVisible && (
        <Modal
          transparent={true}
          visible={filterModalVisible}
          animationType="none"
          onRequestClose={closeFilterModal}
        >
          <TouchableWithoutFeedback onPress={closeFilterModal}>
            <Animated.View style={[styles.modalOverlay, modalContainerStyle]}>
              <TouchableWithoutFeedback>
                <Animated.View
                  style={[styles.modalContent, modalContentStyle]}
                  entering={FadeIn.duration(300)}
                >
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Filter Orders</Text>
                    <TouchableOpacity
                      onPress={closeFilterModal}
                      hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                    >
                      <Ionicons name="close" size={24} color="#333" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView
                    style={styles.modalBody}
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
                      active={activeFilter === 'pending'}
                      count={getOrderCountByStatus('pending')}
                      onPress={() => handleFilterSelect('pending')}
                    />
                    <FilterCategory
                      title="Processing"
                      active={activeFilter === 'processing'}
                      count={getOrderCountByStatus('processing')}
                      onPress={() => handleFilterSelect('processing')}
                    />
                    <FilterCategory
                      title="Shipped"
                      active={activeFilter === 'shipped'}
                      count={getOrderCountByStatus('shipped')}
                      onPress={() => handleFilterSelect('shipped')}
                    />
                    <FilterCategory
                      title="Delivered"
                      active={activeFilter === 'delivered'}
                      count={getOrderCountByStatus('delivered')}
                      onPress={() => handleFilterSelect('delivered')}
                    />
                    <FilterCategory
                      title="Cancelled"
                      active={activeFilter === 'cancelled'}
                      count={getOrderCountByStatus('cancelled')}
                      onPress={() => handleFilterSelect('cancelled')}
                    />
                  </ScrollView>
                </Animated.View>
              </TouchableWithoutFeedback>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statIconBg: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  // Search and Filter
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginRight: 10,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 15,
    color: '#333',
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#f0f4fd',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterActiveIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5E7CE2',
  },
  // Active filter indicator
  activeFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  activeFilterLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  activeFilterChipText: {
    fontSize: 13,
    color: '#5E7CE2',
    marginRight: 8,
  },
  // Order List
  orderListContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  orderList: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  orderDate: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  orderStoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderStore: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  orderDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 12,
  },
  orderDetailItem: {
    flex: 1,
    alignItems: 'center',
  },
  orderDetailDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#f0f0f0',
  },
  orderDetailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  orderDetailValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  orderItemsPreview: {
    marginBottom: 12,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderItemName: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  orderItemQuantity: {
    fontSize: 14,
    color: '#666',
    width: 40,
    textAlign: 'center',
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    width: 70,
    textAlign: 'right',
  },
  viewMoreButton: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  viewMoreText: {
    fontSize: 13,
    color: '#5E7CE2',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#5E7CE2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.8,
    maxHeight: height * 0.7,
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalBody: {
    padding: 16,
    maxHeight: height * 0.5,
  },
  filterCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#f9f9fc',
  },
  activeFilterCategory: {
    backgroundColor: '#EBF2FF',
  },
  filterCategoryText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
    flex: 1,
  },
  activeFilterCategoryText: {
    color: '#5E7CE2',
    fontWeight: '600',
  },
  filterBadge: {
    backgroundColor: '#5E7CE2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
});
