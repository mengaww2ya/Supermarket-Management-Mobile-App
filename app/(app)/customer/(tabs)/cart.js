import React, { useEffect, useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    Text,
    View,
    Modal,
    TouchableOpacity,
    Image,
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
    const [userId, setUserId] = useState(null);
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [modalVisible, setModalVisible] = useState(false);
    const [detailItem, setDetailItem] = useState(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const auth = getAuth();
    const router = useRouter();

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
        const fetchCartItems = async () => {
            if (!userId) return;

            try {
                setLoading(true);
                console.log(`[CART DEBUG] Starting to fetch cart items for user: ${userId}`);
                
                // Create reference to the cart collection
                const cartCollection = collection(db, `users/${userId}/cart`);
                console.log(`[CART DEBUG] Cart collection reference created`);
                
                // Get all documents in the cart collection
                const cartSnapshot = await getDocs(cartCollection);
                console.log(`[CART DEBUG] Fetched cart snapshot, docs count: ${cartSnapshot.docs.length}`);
                
                // Process cart items
                let items = cartSnapshot.docs.map(doc => {
                    const data = doc.data();
                    console.log(`[CART DEBUG] Processing cart item: ${doc.id}, status: ${data.status || 'active'}`);
                    return {
                        id: doc.id,
                        ...data,
                        isSelected: false,
                    };
                });
                
                // Filter out items that have been ordered
                const activeItems = items.filter(item => item.status !== 'ordered');
                console.log(`[CART DEBUG] Active items count: ${activeItems.length} out of ${items.length} total`);
                
                // Set state with filtered items
                setCartItems(activeItems);
                
                // Calculate totals if you have this function
                if (typeof calculateTotals === 'function') {
                    calculateTotals(activeItems);
                }
                
                console.log(`[CART DEBUG] Cart items loaded successfully`);
                setLoading(false);
            } catch (error) {
                console.error(`[CART DEBUG] Error fetching cart items: ${error.message}`, error);
                
                // More detailed error reporting for diagnosing the issue
                if (error.code) {
                    console.error(`[CART DEBUG] Error code: ${error.code}`);
                }
                
                // Check if it's a permission error
                if (error.message.includes('permission') || error.code === 'permission-denied') {
                    Alert.alert(
                        "Permission Error", 
                        "You don't have permission to access this cart. Please try logging out and back in."
                    );
                } else {
                    // General error message
                    Alert.alert(
                        "Error Loading Cart", 
                        `Could not load your cart items. Error: ${error.message}`
                    );
                }
                
                // Set empty cart to prevent further errors
                setCartItems([]);
                setLoading(false);
            }
        };

        fetchCartItems();
    }, [userId]);

    const increaseQuantity = async (item) => {
        const updatedQuantity = item.quantity + 1;
        const updatedTotalPrice = updatedQuantity * (item.discountPrice || item.price);

        const cartDoc = doc(db, `users/${userId}/cart`, item.id);
        await updateDoc(cartDoc, { quantity: updatedQuantity, totalPrice: updatedTotalPrice });

        setCartItems(prevItems => prevItems.map(i => i.id === item.id ? { ...i, quantity: updatedQuantity, totalPrice: updatedTotalPrice } : i));
    };

    const decreaseQuantity = async (item) => {
        if (item.quantity > 1) {
            const updatedQuantity = item.quantity - 1;
            const updatedTotalPrice = updatedQuantity * (item.discountPrice || item.price);

            const cartDoc = doc(db, `users/${userId}/cart`, item.id);
            await updateDoc(cartDoc, { quantity: updatedQuantity, totalPrice: updatedTotalPrice });

            setCartItems(prevItems => prevItems.map(i => i.id === item.id ? { ...i, quantity: updatedQuantity, totalPrice: updatedTotalPrice } : i));
        }
    };

    const removeItem = async (itemId) => {
        try {
            const cartDoc = doc(db, `users/${userId}/cart`, itemId);
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
            <SafeAreaView className="flex-1 justify-center items-center bg-gray-50">
                <HomeHeader title="My Cart" />
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text className="mt-4 text-gray-500">Loading your cart...</Text>
            </SafeAreaView>
        );
    }

    const calculateTotal = () => {
        return Array.from(selectedItems).reduce((total, itemId) => {
            const item = cartItems.find(i => i.id === itemId);
            return total + (item ? item.totalPrice : 0);
        }, 0).toFixed(2);
    };

    const selectAllItems = () => {
        if (selectedItems.size === cartItems.length) {
            // If all items are selected, unselect all
            setSelectedItems(new Set());
        } else {
            // Otherwise select all items
            setSelectedItems(new Set(cartItems.map(item => item.id)));
        }
    };

    const openDetailModal = (item) => {
        setDetailItem(item);
        setDetailModalVisible(true);
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <HomeHeader title="My Cart" />

                {cartItems.length === 0 ? (
                <View className="flex-1 justify-center items-center p-5">
                    <Image 
                        source={require('../../../../assets/images/Pantry-Essentials.png')} 
                        className="w-40 h-40 mb-5"
                        resizeMode="contain"
                    />
                    <Text className="text-xl font-bold text-gray-800 mb-2">
                        Your cart is empty
                    </Text>
                    <Text className="text-base text-gray-500 text-center mb-6">
                        Looks like you haven't added any products to your cart yet.
                    </Text>
                    <TouchableOpacity 
                        className="bg-green-600 py-3.5 px-6 rounded-xl"
                        onPress={() => router.push('/customer/(tabs)')}
                    >
                        <Text className="text-white font-bold text-base">
                            Browse Products
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <>
                    <ScrollView 
                        contentContainerStyle={{ padding: 16 }}
                        className="flex-1"
                    >
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-xl font-bold text-gray-800">
                                Shopping Cart ({cartItems.length})
                            </Text>
                            <TouchableOpacity onPress={selectAllItems}>
                                <Text className="text-sm text-green-600 font-medium">
                                    {selectedItems.size === cartItems.length ? 'Unselect All' : 'Select All'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                        
                        {cartItems.map(item => (
                            <View 
                                key={item.id} 
                                className="bg-white rounded-2xl p-4 mb-4 flex-row items-center shadow-sm"
                            >
                                <TouchableOpacity 
                                    onPress={() => toggleSelectItem(item.id)} 
                                    className={`w-6 h-6 rounded-full border-2 justify-center items-center mr-3
                                        ${selectedItems.has(item.id) ? 'bg-green-600 border-green-600' : 'border-gray-300 bg-transparent'}`}
                                >
                                    {selectedItems.has(item.id) && (
                                        <Text className="text-white text-xs">✓</Text>
                                    )}
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden mr-3"
                                    onPress={() => openDetailModal(item)}
                                >
                                    <Image 
                                        source={{ uri: item.image }} 
                                        className="w-full h-full"
                                        resizeMode="contain" 
                                    />
                                </TouchableOpacity>
                                
                                <View className="flex-1">
                                    <TouchableOpacity onPress={() => openDetailModal(item)}>
                                        <Text 
                                            className="text-base font-bold text-gray-800 mb-1"
                                            numberOfLines={1}
                                        >
                                            {item.productName}
                                        </Text>
                                    </TouchableOpacity>
                                    
                                    <View className="flex-row items-center mb-2">
                                        {item.discountPrice ? (
                                            <>
                                                <Text className="text-sm font-bold text-red-500 mr-1.5">
                                                    {item.discountPrice.toFixed(2)} Birr
                                                </Text>
                                                <Text className="text-xs text-gray-400 line-through">
                                                    {item.price.toFixed(2)} Birr
                                                </Text>
                                            </>
                                        ) : (
                                            <Text className="text-sm font-bold text-gray-600">
                                                {item.price.toFixed(2)} Birr
                                            </Text>
                                        )}
                                        <Text className="text-xs text-gray-500 ml-1">
                                            / {item.unitType || 'unit'}
                                        </Text>
                                    </View>
                                    
                                    <View className="flex-row items-center justify-between">
                                        <View className="flex-row items-center bg-gray-100 rounded-lg overflow-hidden">
                                            <TouchableOpacity 
                                                className="w-8 h-8 justify-center items-center"
                                                onPress={() => decreaseQuantity(item)}
                                            >
                                                <Text className="text-lg text-gray-600">−</Text>
                                            </TouchableOpacity>
                                            
                                            <Text className="text-sm font-bold text-gray-800 w-8 text-center">
                                                {item.quantity}
                                            </Text>
                                            
                                            <TouchableOpacity 
                                                className="w-8 h-8 justify-center items-center"
                                                onPress={() => increaseQuantity(item)}
                                            >
                                                <Text className="text-lg text-gray-600">+</Text>
                                    </TouchableOpacity>
                                        </View>
                                        
                                        <TouchableOpacity onPress={() => removeItem(item.id)}>
                                            <Text className="text-sm text-red-500">Remove</Text>
                                    </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    <View className="bg-white p-4 border-t border-gray-200 shadow-sm">
                        <View className="flex-row justify-between mb-4">
                            <Text className="text-base text-gray-600">
                                Subtotal ({selectedItems.size} items)
                            </Text>
                            <Text className="text-base font-bold text-gray-800">
                                {calculateTotal()} Birr
                            </Text>
                        </View>
                        
                        <TouchableOpacity 
                            className={`py-4 rounded-xl items-center justify-center ${selectedItems.size > 0 ? 'bg-green-600' : 'bg-gray-400'}`}
                            disabled={selectedItems.size === 0}
                            onPress={handleProceedToCheckout}
                        >
                            <Text className="text-white font-bold text-base">
                                Proceed to Checkout
                            </Text>
                        </TouchableOpacity>
                    </View>
                </>
            )}

            {/* Checkout Method Modal */}
            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View className="flex-1 justify-center items-center bg-black/50">
                    <View className="bg-white rounded-2xl p-6 w-4/5 max-w-md shadow-lg">
                        <Text className="text-xl font-bold text-gray-800 mb-4 text-center">
                            Choose Delivery Method
                        </Text>
                        
                        <TouchableOpacity 
                            className="bg-green-600 p-4 rounded-xl items-center mb-3"
                            onPress={() => handleDeliveryMethod("Delivery")}
                        >
                            <Text className="text-white font-bold text-base">
                                Delivery to Address
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            className="bg-gray-100 p-4 rounded-xl items-center mb-3"
                            onPress={() => handleDeliveryMethod("Without Delivery")}
                        >
                            <Text className="text-gray-600 font-bold text-base">
                                Pickup in Store
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            className="p-4 items-center"
                            onPress={() => setModalVisible(false)}
                        >
                            <Text className="text-gray-500 text-base">
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            
            {/* Product Detail Modal */}
            <Modal
                transparent={true}
                visible={detailModalVisible}
                animationType="slide"
                onRequestClose={() => setDetailModalVisible(false)}
            >
                {detailItem && (
                    <View className="flex-1 bg-black/50">
                        <View className="bg-white rounded-t-3xl h-4/5 mt-auto pt-4 pb-6 px-5">
                            {/* Handle to drag modal */}
                            <View className="w-10 h-1 bg-gray-200 rounded self-center mb-4" />
                            
                            <TouchableOpacity 
                                className="absolute top-4 right-4 p-2 z-10"
                                onPress={() => setDetailModalVisible(false)}
                            >
                                <Text className="text-2xl text-gray-400">×</Text>
                            </TouchableOpacity>
                            
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View className="items-center mb-4">
                                    <Image 
                                        source={{ uri: detailItem.image }} 
                                        className="w-full h-48 rounded-xl mb-4"
                                        resizeMode="contain"
                                    />
                                    
                                    <Text className="text-2xl font-bold text-gray-800 text-center">
                                        {detailItem.productName}
                                    </Text>
                                </View>
                                
                                <View className="flex-row justify-center items-center mb-5">
                                    {detailItem.discountPrice ? (
                                        <>
                                            <Text className="text-xl font-bold text-red-500 mr-2">
                                                {detailItem.discountPrice.toFixed(2)} Birr
                                            </Text>
                                            <Text className="text-base text-gray-400 line-through">
                                                {detailItem.price.toFixed(2)} Birr
                                            </Text>
                                        </>
                                    ) : (
                                        <Text className="text-xl font-bold text-green-600">
                                            {detailItem.price.toFixed(2)} Birr
                                        </Text>
                                    )}
                                    <Text className="text-sm text-gray-500 ml-1">
                                        per {detailItem.unitType || 'unit'}
                                    </Text>
                                </View>
                                
                                <View className="bg-gray-100 rounded-xl p-4 mb-5">
                                    <Text className="text-base font-bold text-gray-600 mb-2">
                                        Product Details
                                    </Text>
                                    
                                    {detailItem.description && (
                                        <View className="mb-3">
                                            <Text className="text-sm text-gray-500 mb-1">Description:</Text>
                                            <Text className="text-sm text-gray-800 leading-5">
                                                {detailItem.description || "No description available"}
                                            </Text>
                                        </View>
                                    )}
                                    
                                    <View className="flex-row justify-between mb-2">
                                        <Text className="text-sm text-gray-500">Category:</Text>
                                        <Text className="text-sm text-gray-800 font-medium">
                                            {detailItem.categoryName || "Uncategorized"}
                                        </Text>
                                    </View>
                                    
                                    {detailItem.brand && (
                                        <View className="flex-row justify-between mb-2">
                                            <Text className="text-sm text-gray-500">Brand:</Text>
                                            <Text className="text-sm text-gray-800 font-medium">
                                                {detailItem.brand}
                                            </Text>
                                        </View>
                                    )}
                                    
                                    <View className="flex-row justify-between mb-2">
                                        <Text className="text-sm text-gray-500">Unit:</Text>
                                        <Text className="text-sm text-gray-800 font-medium">
                                            {detailItem.unitType || "Unit"}
                                        </Text>
                                    </View>
                                    
                                    <View className="flex-row justify-between border-t border-gray-200 pt-2 mt-2">
                                        <Text className="text-base font-bold text-gray-600">In Cart:</Text>
                                        <Text className="text-base font-bold text-gray-800">
                                            {detailItem.quantity} × {(detailItem.discountPrice || detailItem.price).toFixed(2)} Birr
                                        </Text>
                                    </View>
                                </View>
                                
                                <View className="flex-row mb-6">
                                    <TouchableOpacity 
                                        className="flex-1 bg-gray-100 p-4 rounded-xl items-center mr-2"
                                        onPress={() => {
                                            setDetailModalVisible(false);
                                            removeItem(detailItem.id);
                                        }}
                                    >
                                        <Text className="text-red-500 font-bold">Remove</Text>
                                    </TouchableOpacity>
                                    
                                    <View className="flex-2 flex-row items-center bg-gray-100 rounded-xl overflow-hidden ml-2">
                                        <TouchableOpacity 
                                            className="flex-1 h-12 justify-center items-center"
                                            onPress={() => {
                                                decreaseQuantity(detailItem);
                                                if (detailItem.quantity > 1) {
                                                    setDetailItem({
                                                        ...detailItem,
                                                        quantity: detailItem.quantity - 1,
                                                        totalPrice: (detailItem.quantity - 1) * (detailItem.discountPrice || detailItem.price)
                                                    });
                                                }
                                            }}
                                        >
                                            <Text className="text-2xl text-gray-600">−</Text>
                                        </TouchableOpacity>
                                        
                                        <Text className="text-base font-bold text-gray-800 w-10 text-center">
                                            {detailItem.quantity}
                                        </Text>
                                        
                                        <TouchableOpacity 
                                            className="flex-1 h-12 justify-center items-center"
                                            onPress={() => {
                                                increaseQuantity(detailItem);
                                                setDetailItem({
                                                    ...detailItem,
                                                    quantity: detailItem.quantity + 1,
                                                    totalPrice: (detailItem.quantity + 1) * (detailItem.discountPrice || detailItem.price)
                                                });
                                            }}
                                        >
                                            <Text className="text-2xl text-gray-600">+</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </ScrollView>
                            
                            <TouchableOpacity 
                                className="bg-green-600 py-4 rounded-xl items-center justify-center mt-2"
                                onPress={() => {
                                    setSelectedItems(new Set([detailItem.id]));
                                    setDetailModalVisible(false);
                                    handleProceedToCheckout();
                                }}
                            >
                                <Text className="text-white font-bold text-base">
                                    Checkout This Item
                                </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                                className="border border-gray-600 py-4 rounded-xl items-center justify-center mt-2.5"
                                onPress={() => {
                                    setDetailModalVisible(false);
                                    router.push({
                                        pathname: "/customer/Item",
                                        params: { productId: detailItem.productId || detailItem.id }
                                    });
                                }}
                            >
                                <Text className="text-gray-600 font-bold text-base">
                                    View Full Details
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </Modal>
        </SafeAreaView>
    );
}