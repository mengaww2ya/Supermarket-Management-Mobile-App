import React, { useState, useEffect } from 'react';
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
    Modal,
    Pressable,
    ScrollView,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { db } from '../../../firebase/firebaseConfig';
import {
    collection,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    Timestamp,
    getDoc,
    query,
    where
} from 'firebase/firestore';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { format } from 'date-fns';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
    withSequence,
    FadeInRight,
    FadeInDown,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SupplierOrders() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { width, height } = Dimensions.get('window');

    // State for orders
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    // State for search and filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // State for modals
    const [orderDetailsVisible, setOrderDetailsVisible] = useState(false);
    const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
    const [filterVisible, setFilterVisible] = useState(false);

    // State for selected items
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderToDelete, setOrderToDelete] = useState(null);

    // Animation values
    const animationValue = useSharedValue(1);
    const [animatedOrderId, setAnimatedOrderId] = useState(null);

    // Define the animated style at component level
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: animationValue.value }]
        };
    });

    // Stats
    const [stats, setStats] = useState({
        pendingCount: 0,
        shippedCount: 0,
        deliveredCount: 0,
        totalAmount: 0
    });

    useEffect(() => {
        // Fetch initial data
        fetchOrders();
    }, []);

    // Apply filters when search or status filter changes
    useEffect(() => {
        filterOrders();
    }, [searchQuery, statusFilter, orders]);

    // Function to fetch orders with improved supplier information from users collection
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

            // Fetch supplier details for each order with a supplierId from users collection
            const ordersWithSupplierDetails = await Promise.all(
                fetchedOrders.map(async (order) => {
                    if (order.supplierId) {
                        try {
                            // Get supplier details from the users collection where role is 'supplier'
                            const usersRef = collection(db, 'users');
                            const q = query(usersRef, where('uid', '==', order.supplierId), where('role', '==', 'supplier'));
                            const supplierSnapshot = await getDocs(q);

                            if (!supplierSnapshot.empty) {
                                const supplierData = supplierSnapshot.docs[0].data();
                                // Create enriched order with supplier details
                                return {
                                    ...order,
                                    supplierName: supplierData.companyName || supplierData.fullName || 'Unknown Supplier',
                                    supplierDetails: {
                                        address: supplierData.address || '',
                                        email: supplierData.email || '',
                                        phone: supplierData.phone || '',
                                        website: supplierData.website || '',
                                        firstName: supplierData.firstName || '',
                                        lastName: supplierData.lastName || '',
                                        fullName: supplierData.fullName || '',
                                        yearEstablished: supplierData.yearEstablished || '',
                                        productType: supplierData.productType || '',
                                        status: supplierData.status || ''
                                    }
                                };
                            }
                        } catch (err) {
                            console.error(`Error fetching supplier details for order ${order.id}:`, err);
                        }
                    }
                    return order;
                })
            );

            setOrders(ordersWithSupplierDetails);
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

    // Filter orders based on search query and status filter
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

        setFilteredOrders(filtered);
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchOrders();
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
    };

    // Format currency with appropriate formatting - Changed from $ to Birr
    const formatCurrency = (amount) => {
        return amount ? `${parseFloat(amount).toFixed(2)} Birr` : '0.00 Birr';
    };

    // Format date with appropriate formatting
    const formatDate = (date) => {
        return date ? format(date, 'MMM dd, yyyy') : 'N/A';
    };

    // Function to update order status
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

    // Function to delete order
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

    // Render status badge
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

    // Render order card - Removed delete and status change buttons
    const renderOrderCard = (order) => {
        return (
            <Animated.View
                key={order.id}
                entering={FadeInRight.delay(200 * (orders.indexOf(order) % 8)).duration(300)}
                style={animatedStyle}
                className="mb-3 rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm"
            >
                <Pressable
                    onPress={() => {
                        // Optimized press handling
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
                                Order #{order.orderNumber || order.supplierOrderRef || order.id.substring(0, 8)}
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
                                {order.items?.length || order.products?.length || 0} {(order.items?.length || order.products?.length || 0) === 1 ? 'item' : 'items'}
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
                </Pressable>
            </Animated.View>
        );
    };

    // Search bar component with enhanced styling
    const renderSearchBar = () => (
        <Animated.View
            entering={FadeInDown.duration(300)}
            style={{
                flexDirection: 'row',
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: 'white',
                borderBottomWidth: 1,
                borderBottomColor: '#E5E7EB',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 1,
                zIndex: 1,
            }}
        >
            <View style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F3F4F6',
                borderRadius: 12,
                paddingHorizontal: 12,
                height: 48,
                borderWidth: 1,
                borderColor: '#E5E7EB',
            }}>
                <Ionicons name="search" size={20} color="#6B7280" />
                <TextInput
                    placeholder="Search orders..."
                    placeholderTextColor="#6B7280"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    style={{
                        flex: 1,
                        height: '100%',
                        fontSize: 16,
                        color: '#1F2937',
                        marginLeft: 8,
                        fontWeight: '400',
                    }}
                />
                {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Ionicons name="close-circle" size={20} color="#6B7280" />
                    </TouchableOpacity>
                ) : null}
            </View>

            {/* Filter icon next to search input */}
            <TouchableOpacity
                onPress={() => setFilterVisible(true)}
                style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#4F46E5',
                    marginLeft: 10,
                    shadowColor: '#4338CA',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 1,
                }}
            >
                <Ionicons name="filter" size={20} color="white" />
            </TouchableOpacity>
        </Animated.View>
    );

    // Render orders statistics with enhanced styling
    const renderOrderStats = () => {
        return (
            <Animated.View
                entering={FadeInDown.delay(100).duration(300)}
                style={{
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    marginBottom: 12,
                }}
            >
                <View style={{
                    flexDirection: 'row',
                    marginBottom: 4
                }}>
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '600',
                        color: '#1F2937',
                        marginLeft: 4
                    }}>
                        Order Statistics
                    </Text>
                </View>

                <View style={{ flexDirection: 'row' }}>
                    <View style={{
                        flex: 1,
                        backgroundColor: '#EFF6FF',
                        borderRadius: 16,
                        padding: 14,
                        marginRight: 8,
                        alignItems: 'center',
                        shadowColor: '#3B82F6',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                        borderWidth: 1,
                        borderColor: 'rgba(59, 130, 246, 0.1)',
                    }}>
                        <Text style={{ color: '#2563EB', fontSize: 13, fontWeight: '600', marginBottom: 4 }}>Pending</Text>
                        <Text style={{
                            color: '#1E40AF',
                            fontSize: 22,
                            fontWeight: 'bold',
                            textShadowColor: 'rgba(30, 64, 175, 0.1)',
                            textShadowOffset: { width: 0, height: 1 },
                            textShadowRadius: 2,
                        }}>
                            {stats.pendingCount}
                        </Text>
                    </View>

                    <View style={{
                        flex: 1,
                        backgroundColor: '#FEF3C7',
                        borderRadius: 16,
                        padding: 14,
                        marginHorizontal: 4,
                        alignItems: 'center',
                        shadowColor: '#D97706',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                        borderWidth: 1,
                        borderColor: 'rgba(217, 119, 6, 0.1)',
                    }}>
                        <Text style={{ color: '#D97706', fontSize: 13, fontWeight: '600', marginBottom: 4 }}>Shipped</Text>
                        <Text style={{
                            color: '#92400E',
                            fontSize: 22,
                            fontWeight: 'bold',
                            textShadowColor: 'rgba(146, 64, 14, 0.1)',
                            textShadowOffset: { width: 0, height: 1 },
                            textShadowRadius: 2,
                        }}>
                            {stats.shippedCount}
                        </Text>
                    </View>

                    <View style={{
                        flex: 1,
                        backgroundColor: '#ECFDF5',
                        borderRadius: 16,
                        padding: 14,
                        marginLeft: 8,
                        alignItems: 'center',
                        shadowColor: '#059669',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                        borderWidth: 1,
                        borderColor: 'rgba(5, 150, 105, 0.1)',
                    }}>
                        <Text style={{ color: '#059669', fontSize: 13, fontWeight: '600', marginBottom: 4 }}>Delivered</Text>
                        <Text style={{
                            color: '#065F46',
                            fontSize: 22,
                            fontWeight: 'bold',
                            textShadowColor: 'rgba(6, 95, 70, 0.1)',
                            textShadowOffset: { width: 0, height: 1 },
                            textShadowRadius: 2,
                        }}>
                            {stats.deliveredCount}
                        </Text>
                    </View>
                </View>
            </Animated.View>
        );
    };

    // Render filter modal
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

    // Render order details modal with enhanced styling and interactivity
    const renderOrderDetailsModal = () => {
        if (!selectedOrder) return null;

        // Get appropriate status colors and icons
        const getStatusColor = (status) => {
            switch (status) {
                case 'Pending':
                    return {
                        bgColor: '#FEF3C7',
                        borderColor: '#F59E0B',
                        textColor: '#92400E'
                    };
                case 'Shipped':
                    return {
                        bgColor: '#DBEAFE',
                        borderColor: '#3B82F6',
                        textColor: '#1E40AF'
                    };
                case 'Delivered':
                    return {
                        bgColor: '#D1FAE5',
                        borderColor: '#10B981',
                        textColor: '#065F46'
                    };
                default:
                    return {
                        bgColor: '#F3F4F6',
                        borderColor: '#9CA3AF',
                        textColor: '#374151'
                    };
            }
        };

        const getStatusIcon = (status) => {
            switch (status) {
                case 'Pending':
                    return <MaterialIcons name="hourglass-top" size={24} color="#92400E" />;
                case 'Shipped':
                    return <MaterialIcons name="local-shipping" size={24} color="#1E40AF" />;
                case 'Delivered':
                    return <MaterialIcons name="check-circle" size={24} color="#065F46" />;
                default:
                    return <MaterialIcons name="info" size={24} color="#374151" />;
            }
        };

        const getStatusMessage = (status) => {
            switch (status) {
                case 'Pending':
                    return 'This order is waiting to be shipped';
                case 'Shipped':
                    return 'This order is on its way';
                case 'Delivered':
                    return 'This order has been delivered';
                default:
                    return 'Order status unknown';
            }
        };

        // Get the items from either order.products or order.items, depending on what is available
        const orderItems = selectedOrder.items || selectedOrder.products || [];

        return (
            <Modal
                visible={orderDetailsVisible}
                animationType="slide"
                transparent={false}
                onRequestClose={() => {
                    provideFeedback('light');
                    setOrderDetailsVisible(false);
                    setSelectedOrder(null);
                }}
            >
                <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
                    {/* Header */}
                    <LinearGradient
                        colors={['#4F46E5', '#7C3AED']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingHorizontal: 20,
                            paddingVertical: 16,
                            borderBottomWidth: 1,
                            borderBottomColor: 'rgba(255,255,255,0.1)',
                        }}
                    >
                        <TouchableOpacity
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                justifyContent: 'center',
                                alignItems: 'center',
                            }}
                            onPress={() => {
                                provideFeedback('light');
                                setOrderDetailsVisible(false);
                                setSelectedOrder(null);
                            }}
                        >
                            <Ionicons name="close" size={22} color="white" />
                        </TouchableOpacity>

                        <Text style={{
                            fontSize: 18,
                            fontWeight: 'bold',
                            color: 'white',
                            textShadowColor: 'rgba(0,0,0,0.1)',
                            textShadowOffset: { width: 1, height: 1 },
                            textShadowRadius: 3,
                        }}>
                            Order Details
                        </Text>

                        <TouchableOpacity
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: 'rgba(255,255,255,0.2)',
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
                            <Ionicons name="print-outline" size={20} color="white" />
                        </TouchableOpacity>
                    </LinearGradient>

                    {/* Content */}
                    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
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
                            borderWidth: 1,
                            borderColor: '#E5E7EB',
                        }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                <Text style={{ fontSize: 14, color: '#6B7280' }}>Order ID:</Text>
                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                                    #{selectedOrder.orderNumber || selectedOrder.supplierOrderRef || selectedOrder.id.substring(0, 8)}
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
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: 12,
                        }}>
                            Supplier Information
                        </Text>

                        <View style={{
                            backgroundColor: '#F9FAFB',
                            borderWidth: 1,
                            borderColor: '#E5E7EB',
                            borderRadius: 16,
                            padding: 18,
                            marginBottom: 20,
                        }}>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginBottom: 12
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
                                        {selectedOrder.supplierName || 'Unknown Supplier'}
                                    </Text>
                                    {selectedOrder.supplierDetails?.address && (
                                        <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 2 }}>
                                            {selectedOrder.supplierDetails.address}
                                        </Text>
                                    )}
                                </View>
                            </View>

                            {/* Additional supplier details */}
                            <View style={{
                                flexDirection: 'row',
                                flexWrap: 'wrap',
                                borderTopWidth: 1,
                                borderTopColor: '#E5E7EB',
                                paddingTop: 12
                            }}>
                                {selectedOrder.supplierDetails?.phone && (
                                    <View style={{ width: '50%', marginBottom: 8 }}>
                                        <Text style={{ fontSize: 12, color: '#6B7280' }}>Phone</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Ionicons name="call-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
                                            <Text style={{ fontSize: 13, color: '#4B5563' }}>{selectedOrder.supplierDetails.phone}</Text>
                                        </View>
                                    </View>
                                )}

                                {selectedOrder.supplierDetails?.email && (
                                    <View style={{ width: '50%', marginBottom: 8 }}>
                                        <Text style={{ fontSize: 12, color: '#6B7280' }}>Email</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Ionicons name="mail-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
                                            <Text style={{ fontSize: 13, color: '#4B5563' }} numberOfLines={1}>{selectedOrder.supplierDetails.email}</Text>
                                        </View>
                                    </View>
                                )}

                                {selectedOrder.supplierDetails?.yearEstablished && (
                                    <View style={{ width: '50%', marginBottom: 8 }}>
                                        <Text style={{ fontSize: 12, color: '#6B7280' }}>Established</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Ionicons name="calendar-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
                                            <Text style={{ fontSize: 13, color: '#4B5563' }}>{selectedOrder.supplierDetails.yearEstablished}</Text>
                                        </View>
                                    </View>
                                )}

                                {selectedOrder.supplierDetails?.productType && (
                                    <View style={{ width: '50%', marginBottom: 8 }}>
                                        <Text style={{ fontSize: 12, color: '#6B7280' }}>Specialization</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Ionicons name="pricetag-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
                                            <Text style={{ fontSize: 13, color: '#4B5563', textTransform: 'capitalize' }}>
                                                {selectedOrder.supplierDetails.productType}
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                {selectedOrder.supplierDetails?.website && (
                                    <View style={{ width: '100%', marginBottom: 8 }}>
                                        <Text style={{ fontSize: 12, color: '#6B7280' }}>Website</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <Ionicons name="globe-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
                                            <Text style={{ fontSize: 13, color: '#4F46E5', textDecorationLine: 'underline' }}>
                                                {selectedOrder.supplierDetails.website}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </View>
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
                            {orderItems.length > 0 ? (
                                orderItems.map((item, index) => (
                                    <View
                                        key={index}
                                        style={{
                                            flexDirection: 'row',
                                            padding: 16,
                                            borderBottomWidth: index < orderItems.length - 1 ? 1 : 0,
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
                                                {item.name || 'Unnamed Product'}
                                            </Text>
                                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                                                <Text style={{ fontSize: 13, color: '#6B7280' }}>
                                                    {item.quantity || 0} {item.unit || 'unit'} x {(item.price || 0).toFixed(2)} Birr
                                                </Text>
                                                <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                                                    {((item.quantity || 0) * (item.price || 0) || item.totalPrice || 0).toFixed(2)} Birr
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                ))
                            ) : (
                                <View style={{ padding: 16, alignItems: 'center' }}>
                                    <Text style={{ color: '#6B7280', fontSize: 14 }}>No items in this order</Text>
                                </View>
                            )}

                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                backgroundColor: '#EEF2FF',
                                paddingVertical: 14,
                                paddingHorizontal: 16,
                                borderTopWidth: 1,
                                borderTopColor: 'rgba(79, 70, 229, 0.2)',
                            }}>
                                <Text style={{ fontSize: 15, fontWeight: '600', color: '#4F46E5' }}>
                                    Total Amount:
                                </Text>
                                <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#4F46E5' }}>
                                    {(selectedOrder.totalAmount || 0).toFixed(2)} Birr
                                </Text>
                            </View>
                        </View>

                        {/* Payment Information if available */}
                        {selectedOrder.payment && (
                            <>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 12 }}>
                                    Payment Information
                                </Text>
                                <View style={{
                                    backgroundColor: '#F9FAFB',
                                    borderWidth: 1,
                                    borderColor: '#E5E7EB',
                                    borderRadius: 12,
                                    padding: 16,
                                    marginBottom: 20,
                                }}>
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <Text style={{ fontSize: 14, color: '#6B7280' }}>Payment Method:</Text>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                                            {selectedOrder.payment.method || 'Not specified'}
                                            {selectedOrder.payment.provider ? ` (${selectedOrder.payment.provider})` : ''}
                                        </Text>
                                    </View>

                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <Text style={{ fontSize: 14, color: '#6B7280' }}>Amount:</Text>
                                        <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                                            {selectedOrder.payment.amount?.toFixed(2) || '0.00'} Birr
                                        </Text>
                                    </View>

                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <Text style={{ fontSize: 14, color: '#6B7280' }}>Status:</Text>
                                        <Text style={{
                                            fontSize: 14,
                                            fontWeight: '600',
                                            color: selectedOrder.payment.status === 'completed' ? '#059669' : '#DC2626'
                                        }}>
                                            {selectedOrder.payment.status || 'Unknown'}
                                        </Text>
                                    </View>

                                    {selectedOrder.payment.tx_ref && (
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                                            <Text style={{ fontSize: 14, color: '#6B7280' }}>Transaction Reference:</Text>
                                            <Text style={{ fontSize: 14, fontWeight: '600', color: '#111827' }}>
                                                {selectedOrder.payment.tx_ref}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </>
                        )}

                        {/* Notes */}
                        {selectedOrder.notes && selectedOrder.notes.trim() !== '' && (
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
                    </ScrollView>

                    {/* Bottom Action Buttons */}
                    <View style={{
                        flexDirection: 'row',
                        paddingHorizontal: 20,
                        paddingVertical: 16,
                        borderTopWidth: 1,
                        borderTopColor: '#E5E7EB',
                        backgroundColor: '#FFFFFF',
                    }}>
                        <TouchableOpacity
                            style={{
                                flex: 1,
                                paddingVertical: 14,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#FEE2E2',
                                borderRadius: 12,
                                marginRight: 8,
                                shadowColor: '#EF4444',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 3,
                                elevation: 2,
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
                                    borderRadius: 12,
                                    shadowColor: '#4338CA',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.15,
                                    shadowRadius: 3,
                                    elevation: 2,
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
                </SafeAreaView>
            </Modal>
        );
    };

    // Delete confirmation modal with enhanced styling
    const renderDeleteConfirmationModal = () => {
        return (
            <Modal
                visible={deleteConfirmVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setDeleteConfirmVisible(false)}
            >
                <BlurView
                    intensity={30}
                    tint="dark"
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
                        entering={FadeInDown.duration(300).springify()}
                        style={{
                            backgroundColor: 'white',
                            borderRadius: 20,
                            padding: 24,
                            width: '90%',
                            maxWidth: 400,
                            alignItems: 'center',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.15,
                            shadowRadius: 12,
                            elevation: 8,
                        }}
                    >
                        <View style={{
                            width: 70,
                            height: 70,
                            borderRadius: 35,
                            backgroundColor: '#FEE2E2',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 20,
                            shadowColor: '#DC2626',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 2,
                        }}>
                            <MaterialCommunityIcons name="alert" size={36} color="#DC2626" />
                        </View>

                        <Text style={{
                            fontSize: 20,
                            fontWeight: 'bold',
                            color: '#111827',
                            marginBottom: 10,
                            textAlign: 'center'
                        }}>
                            Delete Order
                        </Text>

                        <Text style={{
                            fontSize: 15,
                            color: '#4B5563',
                            textAlign: 'center',
                            marginBottom: 24,
                            lineHeight: 22,
                            paddingHorizontal: 12
                        }}>
                            Are you sure you want to delete this order? This action cannot be undone.
                        </Text>

                        <View style={{ flexDirection: 'row', width: '100%' }}>
                            <TouchableOpacity
                                style={{
                                    flex: 1,
                                    paddingVertical: 14,
                                    alignItems: 'center',
                                    backgroundColor: '#F3F4F6',
                                    borderRadius: 12,
                                    marginRight: 8,
                                    shadowColor: '#000',
                                    shadowOffset: { width: 0, height: 1 },
                                    shadowOpacity: 0.05,
                                    shadowRadius: 2,
                                    elevation: 1,
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
                                    paddingVertical: 14,
                                    alignItems: 'center',
                                    backgroundColor: '#EF4444',
                                    borderRadius: 12,
                                    shadowColor: '#DC2626',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.15,
                                    shadowRadius: 3,
                                    elevation: 2,
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

    // Render header with enhanced styling
    const renderHeader = () => (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: insets.top + 16,
            paddingBottom: 16,
            backgroundColor: 'white',
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2,
        }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity
                    onPress={() => {
                        provideFeedback('light');
                        router.back();
                    }}
                    style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: '#F3F4F6',
                        marginRight: 12,
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                    }}
                >
                    <Ionicons name="arrow-back" size={22} color="#1F2937" />
                </TouchableOpacity>
                <Text style={{
                    fontSize: 22,
                    fontWeight: 'bold',
                    color: '#1F2937',
                    letterSpacing: 0.3,
                }}>
                    Supplier Orders
                </Text>
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <Stack.Screen name="SupplierOrders" options={{ headerShown: false }} />
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent={true} />
            {renderHeader()}

            {loading && !refreshing ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                    <Text style={{ marginTop: 10, color: '#6B7280', fontSize: 16 }}>Loading orders...</Text>
                </View>
            ) : error ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <MaterialIcons name="error-outline" size={48} color="#EF4444" />
                    <Text style={{ marginTop: 10, color: '#1F2937', fontSize: 18, fontWeight: '600', textAlign: 'center' }}>
                        {error}
                    </Text>
                    <TouchableOpacity
                        style={{
                            marginTop: 20,
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            backgroundColor: '#4F46E5',
                            borderRadius: 10,
                            shadowColor: '#4338CA',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 2,
                            elevation: 2,
                        }}
                        onPress={fetchOrders}
                    >
                        <Text style={{ color: 'white', fontWeight: '600' }}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    {renderSearchBar()}
                    {renderOrderStats()}
                    <FlatList
                        data={filteredOrders}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => renderOrderCard(item)}
                        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={['#4F46E5']}
                                tintColor="#4F46E5"
                            />
                        }
                        ListEmptyComponent={
                            <View style={{
                                backgroundColor: 'white',
                                padding: 24,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 16,
                                marginTop: 8,
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.05,
                                shadowRadius: 2,
                                elevation: 1,
                                borderWidth: 1,
                                borderColor: '#E5E7EB',
                            }}>
                                <Image
                                    source={{ uri: 'https://cdn-icons-png.flaticon.com/512/5400/5400905.png' }}
                                    style={{ width: 80, height: 80, opacity: 0.7, marginBottom: 16 }}
                                />
                                <Text style={{ fontSize: 18, fontWeight: '600', color: '#4B5563', textAlign: 'center' }}>
                                    No orders found
                                </Text>
                                <Text style={{ fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
                                    {statusFilter !== 'All'
                                        ? `No ${statusFilter.toLowerCase()} orders found`
                                        : searchQuery
                                            ? 'Try adjusting your search criteria'
                                            : 'Create new orders to see them here'}
                                </Text>
                            </View>
                        }
                    />
                </View>
            )}

            {renderFilterModal()}
            {renderOrderDetailsModal()}
            {renderDeleteConfirmationModal()}
        </View>
    );
} 