import React, { useState, useRef, useEffect } from "react";
import {
    SafeAreaView,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    TextInput,
    Alert,
    Animated,
    Dimensions,
    StatusBar,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Image,
    Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { db } from "../../../firebase/firebaseConfig";
import { doc, setDoc, collection, addDoc, getDoc, getDocs, updateDoc, increment } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get("window");

export default function AddToSupplierCart() {
    const {
        productId,
        productName = "Unknown Product",
        price = "0",
        unitType = "unit",
        image,
        categoryId,
        supplierId,
        supplierName = "Unknown Supplier",
        quantity: initialQuantity = "1",
    } = useLocalSearchParams();

    const router = useRouter();
    const navigation = useNavigation();
    const parsedPrice = parseFloat(price) || 0;
    const [quantity, setQuantity] = useState(parseInt(initialQuantity) || 1);
    const [loading, setLoading] = useState(false);
    const [note, setNote] = useState("");
    const [inputVisible, setInputVisible] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const [animation] = useState(new Animated.Value(0));
    const [addingToCart, setAddingToCart] = useState(false);
    const [productDetails, setProductDetails] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(true);
    const [successVisible, setSuccessVisible] = useState(false);

    const auth = getAuth();
    const currentUser = auth.currentUser;

    // Animation refs
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const buttonScaleAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Start animations when component mounts
        Animated.parallel([
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start();

        // Fetch additional product details
        fetchProductDetails();
    }, []);

    const fetchProductDetails = async () => {
        if (!productId || !categoryId) return;

        try {
            setLoadingDetails(true);
            const productRef = doc(db, 'supplier_category', categoryId, 'products', productId);
            const productSnap = await getDoc(productRef);

            if (productSnap.exists()) {
                setProductDetails({
                    ...productSnap.data(),
                    id: productSnap.id
                });
            }
        } catch (error) {
            console.error("Error fetching product details:", error);
        } finally {
            setLoadingDetails(false);
        }
    };

    const increaseAmount = () => {
        const newQuantity = quantity + 1;
        setQuantity(newQuantity);

        // Animate the quantity change
        Animated.sequence([
            Animated.timing(animation, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            }),
            Animated.timing(animation, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const decreaseAmount = () => {
        if (quantity > 1) {
            const newQuantity = quantity - 1;
            setQuantity(newQuantity);

            // Animate the quantity change
            Animated.sequence([
                Animated.timing(animation, {
                    toValue: -1,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(animation, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    };

    const handleDirectInput = () => {
        setInputValue(quantity.toString());
        setInputVisible(true);
    };

    const confirmQuantityInput = () => {
        const parsedInput = parseInt(inputValue);

        if (isNaN(parsedInput) || parsedInput < 1) {
            Alert.alert("Invalid Quantity", "Please enter a valid number greater than 0.");
            return;
        }

        setQuantity(parsedInput);
        setInputVisible(false);
    };

    const totalPrice = parsedPrice * quantity;

    const addToCart = async () => {
        if (!currentUser) {
            Alert.alert("Error", "You need to be logged in to add items to cart.");
            return;
        }

        // Animate button press
        Animated.sequence([
            Animated.timing(buttonScaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(buttonScaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();

        try {
            setLoading(true);
            setAddingToCart(true);

            // Create a timestamp for ordering
            const timestamp = new Date().getTime();

            // Create cart item with product details
            const cartItemData = {
                productId,
                productName,
                price: parsedPrice,
                quantity,
                totalPrice,
                image,
                unitType,
                note: note.trim() || null,
                addedAt: timestamp,
                supplierId,
                supplierName,
                categoryId,
                description: productDetails?.description || "",
                unit: productDetails?.unit || unitType
            };

            // Add to manager's supplier cart subcollection
            // stockManager/{userId}/supplierCart/{cartItemId}
            const userRef = doc(db, "stockManager", currentUser.uid);

            // Ensure the document exists
            try {
                const userDoc = await getDoc(userRef);
                if (!userDoc.exists()) {
                    await setDoc(userRef, {
                        createdAt: timestamp,
                        role: "stockManager"
                    });
                }
            } catch (error) {
                console.error("Error checking/creating user document:", error);
            }

            const userCartRef = collection(userRef, "supplierCart");

            // Check if the product is already in the cart
            const existingCartRef = collection(db, "stockManager", currentUser.uid, "supplierCart");
            const existingCartSnap = await getDocs(existingCartRef);

            let existingItem = null;
            existingCartSnap.forEach(doc => {
                const data = doc.data();
                if (data.productId === productId && data.supplierId === supplierId) {
                    existingItem = { id: doc.id, ...data };
                }
            });

            if (existingItem) {
                // Update existing cart item
                const existingCartItemRef = doc(db, "stockManager", currentUser.uid, "supplierCart", existingItem.id);
                await updateDoc(existingCartItemRef, {
                    quantity: increment(quantity),
                    totalPrice: (existingItem.quantity + quantity) * parsedPrice,
                    updatedAt: timestamp
                });
            } else {
                // Add new cart item
                await addDoc(userCartRef, cartItemData);
            }

            setLoading(false);
            setAddingToCart(false);
            setSuccessVisible(true);

        } catch (error) {
            console.error("Error adding to cart:", error);
            setLoading(false);
            setAddingToCart(false);
            Alert.alert("Error", "Failed to add item to cart. Please try again.");
        }
    };

    // Animation style for quantity
    const animatedStyle = {
        transform: [
            {
                translateY: animation.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [10, 0, -10],
                }),
            },
            {
                scale: animation.interpolate({
                    inputRange: [-1, 0, 1],
                    outputRange: [0.9, 1, 0.9],
                }),
            },
        ],
        opacity: animation.interpolate({
            inputRange: [-1, 0, 1],
            outputRange: [0.8, 1, 0.8],
        }),
    };

    // Add success modal
    const renderSuccessModal = () => (
        <Modal
            visible={successVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setSuccessVisible(false)}
        >
            <View style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 20,
            }}>
                <View style={{
                    backgroundColor: 'white',
                    borderRadius: 16,
                    padding: 24,
                    width: '90%',
                    alignItems: 'center',
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                }}>
                    <View style={{
                        width: 80,
                        height: 80,
                        borderRadius: 40,
                        backgroundColor: '#EBF5FF',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 16,
                    }}>
                        <Ionicons name="checkmark" size={40} color="#4F46E5" />
                    </View>

                    <Text style={{
                        fontSize: 20,
                        fontWeight: 'bold',
                        color: '#111827',
                        marginBottom: 8,
                        textAlign: 'center',
                    }}>
                        Added to Cart!
                    </Text>

                    <Text style={{
                        fontSize: 16,
                        color: '#6B7280',
                        marginBottom: 24,
                        textAlign: 'center',
                    }}>
                        {quantity} {quantity > 1 ? 'units' : 'unit'} of {productName} has been added to your cart.
                    </Text>

                    <View style={{
                        flexDirection: 'row',
                        width: '100%',
                    }}>
                        <TouchableOpacity
                            style={{
                                flex: 1,
                                padding: 14,
                                borderWidth: 1,
                                borderColor: '#E5E7EB',
                                borderRadius: 8,
                                alignItems: 'center',
                                marginRight: 8,
                            }}
                            onPress={() => {
                                setSuccessVisible(false);
                                router.push('/stockManager/SupplierCatalog');
                            }}
                        >
                            <Text style={{ color: '#4B5563', fontWeight: '600' }}>
                                Continue Shopping
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{
                                flex: 1,
                                padding: 14,
                                backgroundColor: '#4F46E5',
                                borderRadius: 8,
                                alignItems: 'center',
                                marginLeft: 8,
                            }}
                            onPress={() => {
                                setSuccessVisible(false);
                                router.push('/stockManager/SupplierCart');
                            }}
                        >
                            <Text style={{ color: 'white', fontWeight: '600' }}>
                                View Cart
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: '#E5E7EB',
                backgroundColor: 'white',
            }}>
                <TouchableOpacity
                    style={{ marginRight: 16 }}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#4B5563" />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>
                    Product Details
                </Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{
                        padding: 16,
                        paddingBottom: 40,
                    }}
                    showsVerticalScrollIndicator={false}
                >
                    {loadingDetails ? (
                        <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
                            <ActivityIndicator size="large" color="#4F46E5" />
                            <Text style={{ marginTop: 16, color: '#6B7280' }}>Loading product details...</Text>
                        </View>
                    ) : (
                        <Animated.View
                            style={{
                                opacity: fadeAnim,
                                transform: [{ scale: scaleAnim }],
                                backgroundColor: 'white',
                                borderRadius: 16,
                                padding: 16,
                                marginBottom: 16,
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 3.84,
                                elevation: 5,
                            }}
                        >
                            {/* Product Image */}
                            <View style={{
                                width: '100%',
                                height: 200,
                                backgroundColor: '#F9FAFB',
                                borderRadius: 12,
                                overflow: 'hidden',
                                marginBottom: 16
                            }}>
                                <Image
                                    source={{ uri: image || 'https://via.placeholder.com/300' }}
                                    style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                                />
                            </View>

                            {/* Product Info Section */}
                            <View style={{ marginBottom: 24 }}>
                                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 }}>
                                    {productName}
                                </Text>

                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                                    <Text style={{ color: '#10B981', fontWeight: 'bold', fontSize: 20 }}>
                                        {parsedPrice} Birr
                                    </Text>
                                    <Text style={{ color: '#6B7280', marginLeft: 8 }}>
                                        / {productDetails?.unit || unitType}
                                    </Text>
                                </View>

                                <View style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginTop: 4,
                                    backgroundColor: '#EEF2FF',
                                    paddingHorizontal: 10,
                                    paddingVertical: 6,
                                    borderRadius: 16,
                                    alignSelf: 'flex-start'
                                }}>
                                    <Ionicons name="business-outline" size={16} color="#4F46E5" />
                                    <Text style={{
                                        color: '#4F46E5',
                                        marginLeft: 4,
                                        fontWeight: '500'
                                    }}>
                                        {supplierName}
                                    </Text>
                                </View>
                            </View>

                            {/* Product Details Section */}
                            <View style={{
                                marginBottom: 20,
                                padding: 16,
                                backgroundColor: '#F9FAFB',
                                borderRadius: 12
                            }}>
                                <Text style={{ fontSize: 17, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 }}>
                                    Product Details
                                </Text>

                                <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 14, color: '#6B7280' }}>Category</Text>
                                        <Text style={{ fontSize: 16, fontWeight: '500', color: '#4B5563' }}>
                                            {supplierName || 'Uncategorized'}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 14, color: '#6B7280' }}>Unit Type</Text>
                                        <Text style={{ fontSize: 16, fontWeight: '500', color: '#4B5563' }}>
                                            {productDetails?.unit || unitType}
                                        </Text>
                                    </View>
                                </View>

                                {/* Stock Information */}
                                {productDetails?.stock !== undefined && (
                                    <View style={{ marginBottom: 12 }}>
                                        <Text style={{ fontSize: 14, color: '#6B7280' }}>Available Stock</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                            <View style={{
                                                backgroundColor: productDetails.stock > 10 ? '#D1FAE5' : productDetails.stock > 0 ? '#FEF3C7' : '#FEE2E2',
                                                paddingHorizontal: 8,
                                                paddingVertical: 4,
                                                borderRadius: 4
                                            }}>
                                                <Text style={{
                                                    color: productDetails.stock > 10 ? '#065F46' : productDetails.stock > 0 ? '#92400E' : '#B91C1C',
                                                    fontWeight: '600',
                                                    fontSize: 14
                                                }}>
                                                    {productDetails.stock > 10
                                                        ? 'In Stock'
                                                        : productDetails.stock > 0
                                                            ? `Low Stock: ${productDetails.stock} remaining`
                                                            : 'Out of Stock'}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                )}

                                {/* Supplier Information */}
                                {supplierId && (
                                    <View style={{ marginBottom: 12 }}>
                                        <Text style={{ fontSize: 14, color: '#6B7280' }}>Supplier</Text>
                                        <View style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            marginTop: 4,
                                        }}>
                                            <Ionicons name="business-outline" size={16} color="#4F46E5" style={{ marginRight: 4 }} />
                                            <Text style={{ fontSize: 16, fontWeight: '500', color: '#4B5563' }}>
                                                {supplierName}
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                {/* Product ID */}
                                <View style={{ marginBottom: 12 }}>
                                    <Text style={{ fontSize: 14, color: '#6B7280' }}>Product ID</Text>
                                    <Text style={{ fontSize: 15, color: '#4B5563', marginTop: 4 }}>
                                        {productId}
                                    </Text>
                                </View>

                                {/* Description */}
                                {(productDetails?.description || productDetails?.specification) && (
                                    <View style={{ marginTop: 8, padding: 12, backgroundColor: 'white', borderRadius: 8 }}>
                                        <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>Description</Text>
                                        <Text style={{ fontSize: 15, color: '#4B5563', lineHeight: 22 }}>
                                            {productDetails?.description || productDetails?.specification || 'No description available'}
                                        </Text>
                                    </View>
                                )}

                                {/* Shelf Life */}
                                {productDetails?.expiryPeriod && (
                                    <View style={{ marginTop: 12 }}>
                                        <Text style={{ fontSize: 14, color: '#6B7280' }}>Shelf Life</Text>
                                        <Text style={{ fontSize: 15, fontWeight: '500', color: '#4B5563', marginTop: 4 }}>
                                            {productDetails.expiryPeriod} days
                                        </Text>
                                    </View>
                                )}

                                {/* Manufacture Date */}
                                {productDetails?.manufactureDate && (
                                    <View style={{ marginTop: 12 }}>
                                        <Text style={{ fontSize: 14, color: '#6B7280' }}>Manufacture Date</Text>
                                        <Text style={{ fontSize: 15, fontWeight: '500', color: '#4B5563', marginTop: 4 }}>
                                            {new Date(productDetails.manufactureDate.seconds * 1000).toLocaleDateString()}
                                        </Text>
                                    </View>
                                )}

                                {/* Additional Specifications */}
                                {productDetails?.specifications && Object.keys(productDetails.specifications).length > 0 && (
                                    <View style={{ marginTop: 16, padding: 12, backgroundColor: 'white', borderRadius: 8 }}>
                                        <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#4B5563', marginBottom: 8 }}>Specifications</Text>
                                        {Object.entries(productDetails.specifications).map(([key, value]) => (
                                            <View key={key} style={{ flexDirection: 'row', marginBottom: 6 }}>
                                                <Text style={{ fontSize: 14, color: '#6B7280', width: '40%' }}>{key}:</Text>
                                                <Text style={{ fontSize: 14, color: '#4B5563', flex: 1 }}>{value}</Text>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>

                            <View style={{ marginBottom: 24 }}>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 }}>
                                    Quantity
                                </Text>

                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <TouchableOpacity
                                            onPress={decreaseAmount}
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 20,
                                                backgroundColor: '#F3F4F6',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Ionicons name="remove" size={24} color="#374151" />
                                        </TouchableOpacity>

                                        <Animated.Text
                                            style={[
                                                {
                                                    fontSize: 20,
                                                    fontWeight: 'bold',
                                                    color: '#1F2937',
                                                    width: 80,
                                                    textAlign: 'center',
                                                },
                                                animatedStyle
                                            ]}
                                        >
                                            {quantity}
                                        </Animated.Text>

                                        <TouchableOpacity
                                            onPress={increaseAmount}
                                            style={{
                                                width: 40,
                                                height: 40,
                                                borderRadius: 20,
                                                backgroundColor: '#F3F4F6',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                            }}
                                        >
                                            <Ionicons name="add" size={24} color="#374151" />
                                        </TouchableOpacity>
                                    </View>

                                    <TouchableOpacity
                                        onPress={handleDirectInput}
                                        style={{
                                            padding: 8,
                                            borderRadius: 8,
                                            backgroundColor: '#F3F4F6',
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Ionicons name="create-outline" size={16} color="#4B5563" />
                                        <Text style={{ marginLeft: 4, color: '#4B5563' }}>Edit</Text>
                                    </TouchableOpacity>
                                </View>

                                {inputVisible && (
                                    <View style={{
                                        marginTop: 16,
                                        padding: 16,
                                        backgroundColor: '#F3F4F6',
                                        borderRadius: 12
                                    }}>
                                        <TextInput
                                            value={inputValue}
                                            onChangeText={setInputValue}
                                            keyboardType="number-pad"
                                            placeholder="Enter quantity"
                                            style={{
                                                borderWidth: 1,
                                                borderColor: '#D1D5DB',
                                                borderRadius: 8,
                                                padding: 10,
                                                backgroundColor: 'white',
                                                marginBottom: 12
                                            }}
                                            autoFocus
                                        />
                                        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: '#EF4444',
                                                    padding: 8,
                                                    borderRadius: 6,
                                                    marginRight: 8
                                                }}
                                                onPress={() => setInputVisible(false)}
                                            >
                                                <Text style={{ color: 'white' }}>Cancel</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                style={{
                                                    backgroundColor: '#10B981',
                                                    padding: 8,
                                                    borderRadius: 6
                                                }}
                                                onPress={confirmQuantityInput}
                                            >
                                                <Text style={{ color: 'white' }}>Confirm</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </View>

                            {/* Notes Section */}
                            <View style={{ marginBottom: 24 }}>
                                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 }}>
                                    Notes (Optional)
                                </Text>
                                <TextInput
                                    placeholder="Add notes for this item..."
                                    multiline
                                    numberOfLines={3}
                                    value={note}
                                    onChangeText={setNote}
                                    style={{
                                        borderWidth: 1,
                                        borderColor: '#D1D5DB',
                                        borderRadius: 8,
                                        padding: 12,
                                        textAlignVertical: 'top',
                                        minHeight: 80
                                    }}
                                />
                            </View>

                            {/* Total Section */}
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                paddingVertical: 16,
                                borderTopWidth: 1,
                                borderTopColor: '#E5E7EB',
                                marginBottom: 16
                            }}>
                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>
                                    Total Price:
                                </Text>
                                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#10B981' }}>
                                    {totalPrice.toFixed(2)} Birr
                                </Text>
                            </View>

                            {/* Add to Cart Button */}
                            <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: '#4F46E5',
                                        borderRadius: 12,
                                        padding: 16,
                                        alignItems: 'center',
                                    }}
                                    onPress={addToCart}
                                    disabled={loading || addingToCart}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                                            Add to Cart
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </Animated.View>
                        </Animated.View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
            {renderSuccessModal()}
        </SafeAreaView>
    );
} 