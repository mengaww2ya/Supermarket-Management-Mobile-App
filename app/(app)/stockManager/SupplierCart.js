import React, { useEffect, useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    Text,
    View,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    StatusBar,
    TextInput,
    Modal,
    Dimensions,
} from "react-native";
import { db } from "../../../firebase/firebaseConfig";
import { collection, getDocs, updateDoc, doc, deleteDoc, query, where, serverTimestamp, addDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter } from 'expo-router';
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get("window");

export default function SupplierCart() {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [modalVisible, setModalVisible] = useState(false);
    const [supplierInfo, setSupplierInfo] = useState({});
    const [totalOrderCost, setTotalOrderCost] = useState(0);
    const [confirmOrderVisible, setConfirmOrderVisible] = useState(false);
    const [processingOrder, setProcessingOrder] = useState(false);
    const [notes, setNotes] = useState("");

    const auth = getAuth();
    const router = useRouter();
    const navigation = useNavigation();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUserId(user.uid);
            } else {
                setUserId(null);
                Alert.alert("Error", "User not logged in.");
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        fetchCartItems();
    }, [userId]);

    useEffect(() => {
        if (cartItems.length > 0) {
            // Group items by supplier and fetch supplier info
            const supplierIds = [...new Set(cartItems.map(item => item.supplierId))];
            fetchSupplierDetails(supplierIds);
        }
    }, [cartItems]);

    useEffect(() => {
        calculateTotal();
    }, [cartItems, selectedItems]);

    const fetchCartItems = async () => {
        if (!userId) return;

        try {
            setLoading(true);

            // Get from stockManager supplier cart collection
            const cartCollection = collection(db, `stockManager/${userId}/supplierCart`);
            const cartSnapshot = await getDocs(cartCollection);

            const items = cartSnapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                };
            });

            setCartItems(items);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching cart items:", error);
            Alert.alert("Error", "Failed to load cart items.");
            setCartItems([]);
            setLoading(false);
        }
    };

    const fetchSupplierDetails = async (supplierIds) => {
        try {
            const suppliers = {};

            for (const supplierId of supplierIds) {
                const supplierRef = doc(db, "supliers", supplierId);
                const supplierDoc = await getDocs(supplierRef);

                if (supplierDoc.exists()) {
                    suppliers[supplierId] = supplierDoc.data();
                }
            }

            setSupplierInfo(suppliers);
        } catch (error) {
            console.error("Error fetching supplier details:", error);
        }
    };

    const increaseQuantity = async (item) => {
        const updatedQuantity = item.quantity + 1;
        const updatedTotalPrice = updatedQuantity * item.price;

        const cartDoc = doc(db, `stockManager/${userId}/supplierCart`, item.id);
        await updateDoc(cartDoc, { quantity: updatedQuantity, totalPrice: updatedTotalPrice });

        setCartItems(prevItems => prevItems.map(i =>
            i.id === item.id ? { ...i, quantity: updatedQuantity, totalPrice: updatedTotalPrice } : i
        ));
    };

    const decreaseQuantity = async (item) => {
        if (item.quantity > 1) {
            const updatedQuantity = item.quantity - 1;
            const updatedTotalPrice = updatedQuantity * item.price;

            const cartDoc = doc(db, `stockManager/${userId}/supplierCart`, item.id);
            await updateDoc(cartDoc, { quantity: updatedQuantity, totalPrice: updatedTotalPrice });

            setCartItems(prevItems => prevItems.map(i =>
                i.id === item.id ? { ...i, quantity: updatedQuantity, totalPrice: updatedTotalPrice } : i
            ));
        }
    };

    const removeItem = async (itemId) => {
        try {
            const cartDoc = doc(db, `stockManager/${userId}/supplierCart`, itemId);
            await deleteDoc(cartDoc);

            setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));

            // Remove from selected items if it was selected
            if (selectedItems.has(itemId)) {
                setSelectedItems(prev => {
                    const newSelectedItems = new Set(prev);
                    newSelectedItems.delete(itemId);
                    return newSelectedItems;
                });
            }
        } catch (error) {
            Alert.alert("Error", "Failed to remove item.");
            console.error("Error removing item:", error);
        }
    };

    const toggleSelectItem = (itemId) => {
        setSelectedItems(prev => {
            const newSelectedItems = new Set(prev);
            if (newSelectedItems.has(itemId)) {
                newSelectedItems.delete(itemId);
            } else {
                newSelectedItems.add(itemId);
            }
            return newSelectedItems;
        });
    };

    const calculateTotal = () => {
        const total = Array.from(selectedItems).reduce((sum, itemId) => {
            const item = cartItems.find(i => i.id === itemId);
            return sum + (item ? item.totalPrice : 0);
        }, 0);

        setTotalOrderCost(total);
    };

    const selectAllItems = () => {
        if (selectedItems.size === cartItems.length) {
            // If all are selected, deselect all
            setSelectedItems(new Set());
        } else {
            // Otherwise, select all
            setSelectedItems(new Set(cartItems.map(item => item.id)));
        }
    };

    const handleProceedToCheckout = () => {
        if (selectedItems.size === 0) {
            Alert.alert(
                "No Items Selected",
                "Please select at least one item from your cart to proceed with checkout.",
                [{ text: "OK", style: 'default' }]
            );
            return;
        }

        // Calculate total amount for selected items
        const totalAmount = Array.from(selectedItems).reduce((sum, itemId) => {
            const item = cartItems.find(i => i.id === itemId);
            return sum + (item ? item.totalPrice : 0);
        }, 0);

        // Extract selected items data
        const selectedItemsData = cartItems.filter(item => selectedItems.has(item.id));

        // Perform additional validations
        if (totalAmount <= 0) {
            Alert.alert(
                "Invalid Order Total",
                "The total amount must be greater than zero. Please check your selected items or add more products to your cart.",
                [{ text: "OK", style: 'default' }]
            );
            return;
        }

        // Group items by supplier
        const itemsBySupplier = {};
        selectedItemsData.forEach(item => {
            if (!itemsBySupplier[item.supplierId]) {
                itemsBySupplier[item.supplierId] = {
                    items: [],
                    name: item.supplierName || "Unknown Supplier",
                    id: item.supplierId
                };
            }
            itemsBySupplier[item.supplierId].items.push(item);
        });

        // Check if multiple suppliers are selected
        if (Object.keys(itemsBySupplier).length > 1) {
            Alert.alert(
                "Multiple Suppliers Detected",
                "Your cart contains items from different suppliers. Orders must be placed separately for each supplier.",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Select Items From One Supplier",
                        onPress: () => {
                            // Deselect all items
                            setSelectedItems(new Set());

                            // Show helpful message to guide the user
                            setTimeout(() => {
                                Alert.alert(
                                    "Select Items From Same Supplier",
                                    "Please select items from a single supplier at a time for checkout. This ensures proper order processing and delivery from each supplier.",
                                    [{ text: "OK", style: "default" }]
                                );
                            }, 300);
                        }
                    }
                ]
            );
            return;
        }

        // Get the single supplier
        const supplierId = Object.keys(itemsBySupplier)[0];
        const supplierData = itemsBySupplier[supplierId];

        // Navigate to payment screen
        router.push({
            pathname: "/stockManager/SupplierPaymentScreen",
            params: {
                totalAmount: totalAmount.toString(),
                supplierId: supplierId,
                supplierName: supplierData.name,
                notes: notes,
                cartItems: JSON.stringify(selectedItemsData)
            }
        });
    };

    const createSupplierOrder = async () => {
        if (selectedItems.size === 0) return;

        try {
            setProcessingOrder(true);

            // Get selected items
            const selectedItemsData = cartItems.filter(item => selectedItems.has(item.id));

            // Group items by supplier
            const itemsBySupplier = {};

            selectedItemsData.forEach(item => {
                if (!itemsBySupplier[item.supplierId]) {
                    itemsBySupplier[item.supplierId] = [];
                }
                itemsBySupplier[item.supplierId].push(item);
            });

            // Create order for each supplier
            const createdOrderIds = [];
            for (const supplierId in itemsBySupplier) {
                const items = itemsBySupplier[supplierId];
                const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);
                const supplierName = items[0].supplierName || "Unnamed Supplier";

                // Create order document
                const orderData = {
                    supplierId,
                    supplierName,
                    items: items.map(item => ({
                        productId: item.productId,
                        categoryId: item.categoryId,
                        name: item.productName,
                        price: item.price,
                        quantity: item.quantity,
                        totalPrice: item.totalPrice,
                        imageUrl: item.image,
                        unit: item.unit || "unit",
                    })),
                    status: 'Pending',
                    orderDate: serverTimestamp(),
                    expectedDeliveryDate: null,
                    totalAmount,
                    notes: notes,
                    createdBy: userId,
                    createdAt: serverTimestamp(),
                    paymentStatus: 'Unpaid',
                    orderNumber: `SO-${Date.now().toString().substr(-6)}`,
                };

                // Add to SupplierOrders collection
                const docRef = await addDoc(collection(db, "SupplierOrders"), orderData);
                createdOrderIds.push(docRef.id);

                // Remove items from cart
                for (const item of items) {
                    await removeItem(item.id);
                }
            }

            // Show success message with more details
            if (Object.keys(itemsBySupplier).length > 1) {
                Alert.alert(
                    "Orders Placed Successfully",
                    `${Object.keys(itemsBySupplier).length} orders have been created and sent to the suppliers.`,
                    [
                        {
                            text: "View Orders",
                            onPress: () => {
                                // Navigate to the orders tab on the supplier order management screen
                                router.push('/stockManager/Supplier_order_management');
                            }
                        },
                        {
                            text: "OK",
                            style: "default"
                        }
                    ]
                );
            } else {
                Alert.alert(
                    "Order Placed Successfully",
                    `Your order has been sent to ${Object.values(itemsBySupplier)[0][0].supplierName || 'the supplier'}.`,
                    [
                        {
                            text: "View Orders",
                            onPress: () => {
                                // Navigate to the orders tab on the supplier order management screen
                                router.push('/stockManager/Supplier_order_management');
                            }
                        },
                        {
                            text: "OK",
                            style: "default"
                        }
                    ]
                );
            }

            // Clear selected items and close modal
            setSelectedItems(new Set());
            setConfirmOrderVisible(false);
            setNotes("");

            // Refresh cart items
            fetchCartItems();

        } catch (error) {
            console.error("Error creating order:", error);
            Alert.alert("Error", "Failed to create supplier order.");
        } finally {
            setProcessingOrder(false);
        }
    };

    const renderCartItem = (item) => {
        const isSelected = selectedItems.has(item.id);

        return (
            <View style={{
                backgroundColor: 'white',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
                elevation: 2,
                flexDirection: 'row',
            }}>
                {/* Selection Checkbox */}
                <TouchableOpacity
                    onPress={() => toggleSelectItem(item.id)}
                    style={{
                        width: 24,
                        height: 24,
                        borderRadius: 4,
                        borderWidth: 2,
                        borderColor: isSelected ? '#4F46E5' : '#D1D5DB',
                        backgroundColor: isSelected ? '#4F46E5' : 'transparent',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginRight: 12,
                        alignSelf: 'center',
                    }}
                >
                    {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                </TouchableOpacity>

                {/* Product Image */}
                <Image
                    source={{ uri: item.image || 'https://via.placeholder.com/100' }}
                    style={{
                        width: 80,
                        height: 80,
                        borderRadius: 8,
                        marginRight: 12,
                    }}
                    resizeMode="cover"
                />

                {/* Product Details */}
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 }}>{item.productName}</Text>

                    <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>
                        Unit Price: <Text style={{ fontWeight: 'bold', color: '#059669' }}>{item.price} Birr</Text>
                    </Text>

                    {/* Supplier info if available */}
                    {item.supplierName && (
                        <Text style={{ fontSize: 12, color: '#6B7280', marginBottom: 8 }}>
                            Supplier: {item.supplierName}
                        </Text>
                    )}

                    {/* Quantity Controls */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <TouchableOpacity
                                onPress={() => decreaseQuantity(item)}
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 14,
                                    backgroundColor: '#F3F4F6',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <Ionicons name="remove" size={16} color="#374151" />
                            </TouchableOpacity>

                            <Text style={{
                                fontSize: 16,
                                fontWeight: '500',
                                marginHorizontal: 12
                            }}>
                                {item.quantity}
                            </Text>

                            <TouchableOpacity
                                onPress={() => increaseQuantity(item)}
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 14,
                                    backgroundColor: '#F3F4F6',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}
                            >
                                <Ionicons name="add" size={16} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={() => removeItem(item.id)}
                            style={{
                                padding: 6,
                            }}
                        >
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                    </View>

                    {/* Total Price */}
                    <Text style={{
                        fontSize: 16,
                        fontWeight: 'bold',
                        color: '#4F46E5',
                        marginTop: 8,
                        alignSelf: 'flex-end'
                    }}>
                        Total: {item.totalPrice} Birr
                    </Text>
                </View>
            </View>
        );
    };

    const renderConfirmOrderModal = () => (
        <Modal
            visible={confirmOrderVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setConfirmOrderVisible(false)}
        >
            <View style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'flex-end',
            }}>
                <View style={{
                    backgroundColor: 'white',
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                    padding: 20,
                    maxHeight: height * 0.8,
                }}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 16,
                    }}>
                        <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Confirm Order</Text>
                        <TouchableOpacity onPress={() => setConfirmOrderVisible(false)}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ maxHeight: height * 0.3 }}>
                        {Array.from(selectedItems).map(itemId => {
                            const item = cartItems.find(i => i.id === itemId);
                            if (!item) return null;

                            return (
                                <View key={item.id} style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginBottom: 12,
                                    paddingBottom: 12,
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#E5E7EB',
                                }}>
                                    <Image
                                        source={{ uri: item.image || 'https://via.placeholder.com/50' }}
                                        style={{ width: 40, height: 40, borderRadius: 4, marginRight: 12 }}
                                    />
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontWeight: '500' }}>{item.productName}</Text>
                                        <Text style={{ color: '#6B7280' }}>
                                            {item.quantity} x {item.price} Birr
                                        </Text>
                                    </View>
                                    <Text style={{ fontWeight: 'bold' }}>{item.totalPrice} Birr</Text>
                                </View>
                            );
                        })}
                    </ScrollView>

                    <View style={{
                        marginVertical: 16,
                        padding: 12,
                        backgroundColor: '#F3F4F6',
                        borderRadius: 8,
                    }}>
                        <TextInput
                            placeholder="Add notes for this order (optional)"
                            multiline
                            numberOfLines={3}
                            value={notes}
                            onChangeText={setNotes}
                            style={{
                                textAlignVertical: 'top',
                                minHeight: 60,
                            }}
                        />
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginVertical: 12,
                        paddingVertical: 12,
                        borderTopWidth: 1,
                        borderTopColor: '#E5E7EB',
                    }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Total Amount:</Text>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#4F46E5' }}>
                            {totalOrderCost.toFixed(2)} Birr
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={{
                            backgroundColor: '#4F46E5',
                            padding: 16,
                            borderRadius: 12,
                            alignItems: 'center',
                            marginTop: 12,
                        }}
                        onPress={createSupplierOrder}
                        disabled={processingOrder}
                    >
                        {processingOrder ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                                Place Order
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    // Custom header component
    const renderHeader = () => (
        <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: 'white',
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
        }}>
            <TouchableOpacity
                style={{ padding: 8 }}
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="arrow-back" size={24} color="#4B5563" />
            </TouchableOpacity>

            <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#111827',
                flex: 1,
                textAlign: 'center',
                marginRight: 40, // To center properly given the back button and refresh button
            }}>
                Supplier Cart
            </Text>

            <TouchableOpacity
                style={{ padding: 8 }}
                onPress={() => fetchCartItems()}
            >
                <Ionicons name="refresh" size={24} color="#4F46E5" />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <StatusBar barStyle="dark-content" />

            {renderHeader()}

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                    <Text style={{ marginTop: 10, color: '#6B7280' }}>Loading cart items...</Text>
                </View>
            ) : cartItems.length === 0 ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <Ionicons name="cart-outline" size={80} color="#D1D5DB" />
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#4B5563', marginTop: 16 }}>Your cart is empty</Text>
                    <Text style={{ color: '#6B7280', textAlign: 'center', marginTop: 8 }}>
                        Add products from the supplier catalog to place orders.
                    </Text>
                    <TouchableOpacity
                        style={{
                            backgroundColor: '#4F46E5',
                            paddingHorizontal: 20,
                            paddingVertical: 12,
                            borderRadius: 8,
                            marginTop: 24
                        }}
                        onPress={() => router.push('/stockManager/SupplierCatalog')}
                    >
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Browse Supplier Catalog</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={{ flex: 1, padding: 16 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4B5563' }}>
                            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in cart
                        </Text>
                        <TouchableOpacity
                            onPress={selectAllItems}
                            style={{ flexDirection: 'row', alignItems: 'center' }}
                        >
                            <Text style={{ color: '#4F46E5', fontWeight: '500', marginRight: 4 }}>
                                {selectedItems.size === cartItems.length ? 'Deselect All' : 'Select All'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {cartItems.map(item => renderCartItem(item))}
                        <View style={{ height: 100 }} />
                    </ScrollView>

                    {selectedItems.size > 0 && (
                        <View style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            backgroundColor: 'white',
                            padding: 16,
                            borderTopWidth: 1,
                            borderTopColor: '#E5E7EB',
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: -2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 4,
                        }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                                <Text style={{ fontSize: 16, color: '#4B5563' }}>
                                    Selected: {selectedItems.size} {selectedItems.size === 1 ? 'item' : 'items'}
                                </Text>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4F46E5' }}>
                                    Total: {totalOrderCost.toFixed(2)} Birr
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={{
                                    backgroundColor: '#4F46E5',
                                    borderRadius: 8,
                                    paddingVertical: 14,
                                    alignItems: 'center',
                                }}
                                onPress={handleProceedToCheckout}
                            >
                                <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                                    Proceed to Checkout
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            {/* Confirmation Modal */}
            {renderConfirmOrderModal()}
        </SafeAreaView>
    );
} 