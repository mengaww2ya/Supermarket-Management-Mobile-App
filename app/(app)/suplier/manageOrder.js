import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    StatusBar,
    FlatList,
    Modal,
    TextInput,
    Dimensions,
    ScrollView,
    Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeHeader from "../../components/HomeHeader";
import * as Haptics from 'expo-haptics';
import { db } from '../../../firebase/firebaseConfig';
import { collection, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { Picker } from '@react-native-picker/picker';

const { width, height } = Dimensions.get('window');

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

// Format date helper
const formatDate = (dateObj) => {
    if (!dateObj) return 'Unknown date';
    return dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Order Card Component
const OrderCard = ({ order, onPress }) => {
    const statusColor = getStatusColor(order.status);
    const totalItems = order.items?.length || 0;

    return (
        <TouchableOpacity
            style={styles.orderCard}
            onPress={() => onPress(order)}
            activeOpacity={0.7}
        >
            <View style={styles.orderHeader}>
                <View>
                    <Text style={styles.orderId}>{order.orderNumber || `Order #${order.id.substring(0, 8)}`}</Text>
                    <Text style={styles.orderDate}>{formatDate(order.orderDate)}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                    <Text style={[styles.statusText, { color: statusColor.text }]}>{order.status}</Text>
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
        </TouchableOpacity>
    );
};

// Filter Item Component
const FilterItem = ({ title, active, count, onPress }) => (
    <TouchableOpacity
        style={[styles.filterItem, active && styles.activeFilterItem]}
        onPress={onPress}
    >
        <Text style={[styles.filterText, active && styles.activeFilterText]}>{title}</Text>
        {count > 0 && (
            <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{count}</Text>
            </View>
        )}
    </TouchableOpacity>
);

// Order Details Modal Component
const OrderDetailsModal = ({ visible, order, onClose, onStatusChange }) => {
    if (!visible || !order) return null;

    const statusColor = getStatusColor(order.status);
    const [selectedStatus, setSelectedStatus] = useState(order.status);
    const orderStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

    const handleStatusUpdate = () => {
        if (selectedStatus !== order.status) {
            onStatusChange(order.id, selectedStatus);
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Order Details</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Ionicons name="close" size={24} color="#000" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.modalBody}>
                        <View style={[styles.statusContainer, { backgroundColor: statusColor.bg }]}>
                            <Text style={[styles.statusText, { color: statusColor.text }]}>
                                Status: {order.status}
                            </Text>
                            <Text style={[styles.orderNumber, { color: statusColor.text }]}>
                                #{order.orderNumber || order.id.substring(0, 8)}
                            </Text>
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Update Status</Text>
                            <View style={styles.pickerContainer}>
                                <Picker
                                    selectedValue={selectedStatus}
                                    onValueChange={(itemValue) => setSelectedStatus(itemValue)}
                                    style={styles.picker}
                                >
                                    {orderStatuses.map((status) => (
                                        <Picker.Item key={status} label={status} value={status} />
                                    ))}
                                </Picker>
                            </View>
                            {selectedStatus !== order.status && (
                                <TouchableOpacity
                                    style={[styles.updateButton]}
                                    onPress={handleStatusUpdate}
                                >
                                    <Text style={styles.buttonText}>Update Status</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Order Information</Text>
                            <View style={styles.infoRow}>
                                <Text style={styles.infoLabel}>Order Date:</Text>
                                <Text style={styles.infoValue}>{formatDate(order.orderDate)}</Text>
                            </View>
                            {order.expectedDeliveryDate && (
                                <View style={styles.infoRow}>
                                    <Text style={styles.infoLabel}>Expected Delivery:</Text>
                                    <Text style={styles.infoValue}>{formatDate(order.expectedDeliveryDate)}</Text>
                                </View>
                            )}
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Order Items</Text>
                            {order.items?.map((item, index) => (
                                <View key={index} style={styles.itemCard}>
                                    <View style={styles.itemHeader}>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <Text style={styles.itemPrice}>{item.price?.toFixed(2) || "0.00"} Birr</Text>
                                    </View>
                                    <View style={styles.itemDetails}>
                                        <Text>Quantity: {item.quantity} {item.unit || ""}</Text>
                                        <Text>Total: {(item.price * item.quantity).toFixed(2)} Birr</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        <View style={styles.totalSection}>
                            <Text style={styles.totalLabel}>Total Amount:</Text>
                            <Text style={styles.totalValue}>{order.totalAmount?.toFixed(2) || "0.00"} Birr</Text>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

// Filter Modal Component
const FilterModal = ({ visible, onClose, activeFilter, onFilterSelect, orderCounts }) => (
    <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
    >
        <View style={styles.modalOverlay}>
            <View style={styles.filterModalContent}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Filter Orders</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close" size={24} color="#000" />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.filterList}>
                    <FilterItem
                        title="All Orders"
                        active={activeFilter === 'all'}
                        count={orderCounts.all}
                        onPress={() => {
                            onFilterSelect('all');
                            onClose();
                        }}
                    />
                    <FilterItem
                        title="Pending"
                        active={activeFilter === 'Pending'}
                        count={orderCounts.pending}
                        onPress={() => {
                            onFilterSelect('Pending');
                            onClose();
                        }}
                    />
                    <FilterItem
                        title="Processing"
                        active={activeFilter === 'Processing'}
                        count={orderCounts.processing}
                        onPress={() => {
                            onFilterSelect('Processing');
                            onClose();
                        }}
                    />
                    <FilterItem
                        title="Shipped"
                        active={activeFilter === 'Shipped'}
                        count={orderCounts.shipped}
                        onPress={() => {
                            onFilterSelect('Shipped');
                            onClose();
                        }}
                    />
                    <FilterItem
                        title="Delivered"
                        active={activeFilter === 'Delivered'}
                        count={orderCounts.delivered}
                        onPress={() => {
                            onFilterSelect('Delivered');
                            onClose();
                        }}
                    />
                    <FilterItem
                        title="Cancelled"
                        active={activeFilter === 'Cancelled'}
                        count={orderCounts.cancelled}
                        onPress={() => {
                            onFilterSelect('Cancelled');
                            onClose();
                        }}
                    />
                </ScrollView>
            </View>
        </View>
    </Modal>
);

export default function ManageOrder() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const auth = getAuth();
    const user = auth.currentUser;

    // States
    const [activeFilter, setActiveFilter] = useState('all');
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [detailsVisible, setDetailsVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [error, setError] = useState(null);

    // Fetch orders
    const fetchOrders = useCallback(async () => {
        if (!user) {
            setError("User not logged in");
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const ordersRef = collection(db, "SupplierOrders");
            const querySnapshot = await getDocs(ordersRef);

            if (querySnapshot.empty) {
                setOrders([]);
                setFilteredOrders([]);
                setIsLoading(false);
                return;
            }

            const fetchedOrders = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                orderDate: doc.data().orderDate?.toDate() || new Date(),
                expectedDeliveryDate: doc.data().expectedDeliveryDate?.toDate() || null,
                deliveryDate: doc.data().deliveryDate?.toDate() || null,
            }));

            setOrders(fetchedOrders);
            setFilteredOrders(fetchedOrders);
        } catch (error) {
            console.error("Error fetching orders:", error);
            setError("Failed to fetch orders. Please try again.");
            setOrders([]);
            setFilteredOrders([]);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    // Initial fetch
    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Filter orders
    const filterOrders = useCallback(() => {
        if (!orders.length) {
            setFilteredOrders([]);
            return;
        }

        let filtered = [...orders];

        if (activeFilter !== 'all') {
            filtered = filtered.filter(order => order.status === activeFilter);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(order =>
                order.orderNumber?.toLowerCase().includes(query) ||
                order.supplierName?.toLowerCase().includes(query) ||
                order.id.toLowerCase().includes(query) ||
                order.items?.some(item => item.name?.toLowerCase().includes(query))
            );
        }

        setFilteredOrders(filtered);
    }, [activeFilter, orders, searchQuery]);

    useEffect(() => {
        filterOrders();
    }, [filterOrders]);

    // Calculate order counts
    const orderCounts = useMemo(() => ({
        all: orders.length,
        pending: orders.filter(o => o.status === 'Pending').length,
        processing: orders.filter(o => o.status === 'Processing').length,
        shipped: orders.filter(o => o.status === 'Shipped').length,
        delivered: orders.filter(o => o.status === 'Delivered').length,
        cancelled: orders.filter(o => o.status === 'Cancelled').length,
    }), [orders]);

    // Handle status change
    const handleStatusChange = useCallback(async (orderId, newStatus) => {
        try {
            const orderToUpdate = orders.find(order => order.id === orderId);
            if (!orderToUpdate) return;

            const orderRef = doc(db, "SupplierOrders", orderId);
            const updateData = {
                status: newStatus,
                ...(newStatus === 'Delivered' ? { deliveryDate: Timestamp.fromDate(new Date()) } : {})
            };

            await updateDoc(orderRef, updateData);

            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order.id === orderId
                        ? { ...order, status: newStatus, deliveryDate: newStatus === 'Delivered' ? new Date() : order.deliveryDate }
                        : order
                )
            );

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error("Error updating order status:", error);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    }, [orders]);

    const handleOrderPress = useCallback((order) => {
        setSelectedOrder(order);
        setDetailsVisible(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, []);

    const handleCloseDetails = useCallback(() => {
        setDetailsVisible(false);
        setSelectedOrder(null);
    }, []);

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <StatusBar barStyle="dark-content" />

            <HomeHeader
                title="Manage Orders"
                showBackButton={true}
                onBackPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.back();
                }}
            />

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
                        >
                            <Ionicons name="close-circle" size={20} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setFilterModalVisible(true);
                    }}
                >
                    <Ionicons name="filter" size={22} color="#5E7CE2" />
                    {activeFilter !== 'all' && <View style={styles.filterActiveIndicator} />}
                </TouchableOpacity>
            </View>

            {activeFilter !== 'all' && (
                <View style={styles.activeFilterContainer}>
                    <Text style={styles.activeFilterLabel}>Active filter:</Text>
                    <View style={styles.activeFilterChip}>
                        <Text style={styles.activeFilterChipText}>
                            {activeFilter}
                        </Text>
                        <TouchableOpacity onPress={() => setActiveFilter('all')}>
                            <Ionicons name="close-circle" size={16} color="#5E7CE2" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {isLoading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#5E7CE2" />
                    <Text style={styles.loadingText}>Loading orders...</Text>
                </View>
            ) : error ? (
                <View style={styles.centerContainer}>
                    <Ionicons name="alert-circle-outline" size={60} color="#ff6b6b" />
                    <Text style={[styles.emptyTitle, { color: '#ff6b6b' }]}>Error</Text>
                    <Text style={styles.emptyMessage}>{error}</Text>
                    <TouchableOpacity
                        style={styles.retryButton}
                        onPress={fetchOrders}
                    >
                        <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
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
                    contentContainerStyle={styles.orderList}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={5}
                />
            ) : (
                <View style={styles.centerContainer}>
                    <Ionicons name="receipt-outline" size={60} color="#ccc" />
                    <Text style={styles.emptyTitle}>No Orders Found</Text>
                    <Text style={styles.emptyMessage}>
                        There are no orders matching your search or filter
                    </Text>
                </View>
            )}

            <OrderDetailsModal
                visible={detailsVisible}
                order={selectedOrder}
                onClose={handleCloseDetails}
                onStatusChange={handleStatusChange}
            />

            <FilterModal
                visible={filterModalVisible}
                onClose={() => setFilterModalVisible(false)}
                activeFilter={activeFilter}
                onFilterSelect={setActiveFilter}
                orderCounts={orderCounts}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
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
    orderList: {
        padding: 16,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    loadingText: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 12,
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
    },
    orderId: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    orderDate: {
        fontSize: 13,
        color: '#6B7280',
        marginTop: 4,
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
        padding: 16,
        paddingTop: 0,
    },
    orderDetailItem: {
        flex: 1,
    },
    orderDetailLabel: {
        fontSize: 12,
        color: '#6B7280',
    },
    orderDetailValue: {
        fontSize: 14,
        fontWeight: '500',
        color: '#1F2937',
        marginTop: 2,
    },
    orderDetailDivider: {
        width: 1,
        height: '100%',
        backgroundColor: '#E5E7EB',
        marginHorizontal: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        width: width * 0.9,
        maxHeight: height * 0.8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    filterModalContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: height * 0.7,
        paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    closeButton: {
        padding: 8,
    },
    modalBody: {
        padding: 16,
    },
    filterList: {
        padding: 16,
    },
    filterItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    activeFilterItem: {
        backgroundColor: '#F9FAFB',
    },
    filterText: {
        fontSize: 16,
        color: '#4B5563',
    },
    activeFilterText: {
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
    statusContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    orderNumber: {
        fontSize: 14,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 12,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    infoLabel: {
        color: '#6B7280',
    },
    infoValue: {
        color: '#1F2937',
        fontWeight: '500',
    },
    itemCard: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    itemName: {
        fontWeight: '500',
        color: '#1F2937',
        flex: 1,
    },
    itemPrice: {
        color: '#1F2937',
    },
    itemDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    totalSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        marginBottom: 24,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    totalValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 8,
        marginTop: 8,
        marginBottom: 16,
        backgroundColor: '#F9FAFB',
    },
    picker: {
        height: 50,
    },
    updateButton: {
        backgroundColor: '#5E7CE2',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
    retryButton: {
        backgroundColor: '#5E7CE2',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    retryButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
    },
});