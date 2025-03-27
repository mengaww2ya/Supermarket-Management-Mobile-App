import React, { useEffect, useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    Text,
    View,
    Modal,
    TouchableOpacity,
    Image,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from "react-native";
import { db } from "../../../../firebase/firebaseConfig";
import { collection, getDocs, updateDoc, doc, deleteDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter } from 'expo-router';
import HomeHeader from "../../../components/HomeHeader";
export default function Cart() {
    const [cartItems, setCartItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [customerId, setCustomerId] = useState(null);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [modalVisible, setModalVisible] = useState(false);
    const auth = getAuth();
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setCustomerId(user.uid);
            } else {
                setCustomerId(null);
                Alert.alert("Error", "User not logged in.");
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchCartItems = async () => {
            if (!customerId) return;

            try {
                const cartCollection = collection(db, `customers/${customerId}/cart`);
                const cartSnapshot = await getDocs(cartCollection);
                const items = cartSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setCartItems(items);
            } catch (error) {
                Alert.alert("Error", "Failed to load cart items.");
                console.error("Error fetching cart items: ", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCartItems();
    }, [customerId]);

    const increaseQuantity = async (item) => {
        const updatedQuantity = item.quantity + 1;
        const updatedTotalPrice = updatedQuantity * item.price;

        const cartDoc = doc(db, `customers/${customerId}/cart`, item.id);
        await updateDoc(cartDoc, { quantity: updatedQuantity, totalPrice: updatedTotalPrice });

        setCartItems(prevItems => prevItems.map(i => i.id === item.id ? { ...i, quantity: updatedQuantity, totalPrice: updatedTotalPrice } : i));
    };

    const decreaseQuantity = async (item) => {
        if (item.quantity > 1) {
            const updatedQuantity = item.quantity - 1;
            const updatedTotalPrice = updatedQuantity * item.price;

            const cartDoc = doc(db, `customers/${customerId}/cart`, item.id);
            await updateDoc(cartDoc, { quantity: updatedQuantity, totalPrice: updatedTotalPrice });

            setCartItems(prevItems => prevItems.map(i => i.id === item.id ? { ...i, quantity: updatedQuantity, totalPrice: updatedTotalPrice } : i));
        }
    };

    const removeItem = async (itemId) => {
        try {
            const cartDoc = doc(db, `customers/${customerId}/cart`, itemId);
            await deleteDoc(cartDoc);
            setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
        } catch (error) {
            Alert.alert("Error", "Failed to remove item.");
            console.error("Error removing item: ", error);
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

    const handleProceedToCheckout = () => {
        if (selectedItems.size === 0) {
            Alert.alert("No items selected", "Please select items to proceed.");
            return;
        }
        setModalVisible(true);
    };

    const handleDeliveryMethod = (method) => {
        if (method === "Delivery") {
            const totalPrice = Array.from(selectedItems).reduce((total, itemId) => {
                const item = cartItems.find(i => i.id === itemId);
                return total + (item ? item.totalPrice : 0);
            }, 0);


            if (totalPrice > 0) {
                router.push({
                    pathname: '/customer/DeliveryAddress',
                    params: { selectedItems: Array.from(selectedItems), totalPrice },
                });
            } else {
                Alert.alert("Error", "No items selected for delivery.");
            }
        }
        setModalVisible(false);
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.center}>
                <ActivityIndicator size="large" color="#0000ff" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <HomeHeader title={"Cart"}/>
            <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
                <Text style={styles.title}>Your Cart</Text>

                {cartItems.length === 0 ? (
                    <Text style={styles.emptyCart}>Your cart is empty.</Text>
                ) : (
                    cartItems.map(item => (
                        <View key={item.id} style={styles.cartItem}>
                            <Image source={{ uri: item.image }} style={styles.productImage} />
                            <View style={styles.itemDetails}>
                                <Text style={styles.productName}>{item.productName}</Text>
                                <Text>Quantity: {item.quantity}</Text>
                                <Text>Price: {item.price} Birr</Text>
                                <Text>Total: {item.totalPrice} Birr</Text>
                                <View style={styles.quantityControls}>
                                    <TouchableOpacity onPress={() => decreaseQuantity(item)} style={styles.controlButton}>
                                        <Text style={styles.controlText}>-</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => increaseQuantity(item)} style={styles.controlButton}>
                                        <Text style={styles.controlText}>+</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.removeButton}>
                                        <Text style={styles.removeText}>Remove</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => toggleSelectItem(item.id)} style={styles.checkbox}>
                                <View style={[styles.checkboxBorder, selectedItems.has(item.id) ? styles.checked : styles.unchecked]}>
                                    {selectedItems.has(item.id) && <Text style={styles.checkboxText}>✔</Text>}
                                </View>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
                <TouchableOpacity onPress={handleProceedToCheckout} style={styles.checkoutButton}>
                    <Text style={styles.checkoutText}>Proceed To Checkout</Text>
                </TouchableOpacity>
            </ScrollView>

            { }
            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="slide"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>Choose Delivery Method</Text>
                        <TouchableOpacity onPress={() => handleDeliveryMethod("Delivery")} style={styles.modalButton}>
                            <Text style={styles.modalButtonText}>Delivery</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeliveryMethod("Without Delivery")} style={styles.modalButton}>
                            <Text style={styles.modalButtonText}>Without Delivery</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalButton}>
                            <Text style={styles.modalButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "white",
        padding: 16,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    emptyCart: {
        textAlign: 'center',
        fontSize: 18,
    },
    cartItem: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        backgroundColor: '#f9f9f9',
        justifyContent: 'space-between',
    },
    productImage: {
        width: 80,
        height: 80,
        borderRadius: 8,
        marginRight: 16,
    },
    itemDetails: {
        flex: 1,
    },
    productName: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    controlButton: {
        backgroundColor: '#e0e0e0',
        borderRadius: 8,
        padding: 8,
        marginHorizontal: 4,
    },
    controlText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    removeButton: {
        backgroundColor: '#ff6347',
        borderRadius: 8,
        padding: 8,
        marginLeft: 16,
    },
    removeText: {
        color: 'white',
        fontWeight: 'bold',
    },
    checkbox: {
        marginLeft: 16,
    },
    checkboxBorder: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#FFDC2B',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
    },
    checked: {
        backgroundColor: '#FFDC2B',
    },
    unchecked: {
        backgroundColor: 'transparent',
    },
    checkboxText: {
        color: 'white',
    },
    checkoutButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    checkoutText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        alignItems: 'center',
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    modalButton: {
        backgroundColor: '#4CAF50',
        borderRadius: 8,
        padding: 15,
        width: '100%',
        alignItems: 'center',
        marginBottom: 10,
    },
    modalButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
});