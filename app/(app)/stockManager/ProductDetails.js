import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
    Dimensions,
    Alert,
    TextInput,
    Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

export default function ProductDetails() {
    const { productId, categoryId, supplier } = useLocalSearchParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();
    const navigation = useNavigation();

    // Quantity state
    const [quantity, setQuantity] = useState(1);
    const [inputVisible, setInputVisible] = useState(false);
    const [inputValue, setInputValue] = useState('1');

    // Animation
    const animation = useState(new Animated.Value(0))[0];

    useEffect(() => {
        if (productId && categoryId) {
            fetchProductDetails();
        } else {
            setLoading(false);
        }
    }, [productId, categoryId]);

    const fetchProductDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            // Path to the product document based on where it's stored
            let productRef;

            if (supplier === 'true') {
                // For supplier products
                productRef = doc(db, 'supplier_category', categoryId, 'products', productId);
            } else {
                // For regular inventory products
                productRef = doc(db, 'categories', categoryId, 'products', productId);
            }

            const productSnap = await getDoc(productRef);

            if (productSnap.exists()) {
                setProduct({
                    id: productSnap.id,
                    ...productSnap.data(),
                    categoryId,
                });
            } else {
                setError('Product not found');
            }
        } catch (err) {
            console.error('Error fetching product details:', err);
            setError('Failed to load product details');
        } finally {
            setLoading(false);
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

        if (isNaN(parsedInput)) {
            Alert.alert(
                "Invalid Quantity",
                "Please enter a valid number.",
                [{ text: "OK", onPress: () => setInputValue(quantity.toString()) }]
            );
            return;
        }

        if (parsedInput <= 0) {
            Alert.alert(
                "Invalid Quantity",
                "Quantity must be greater than zero.",
                [{ text: "OK", onPress: () => setInputValue(quantity.toString()) }]
            );
            return;
        }

        // Optional: Add a reasonable maximum limit to prevent accidental large orders
        if (parsedInput > 9999) {
            Alert.alert(
                "Quantity Too Large",
                "The maximum quantity allowed is 9,999. Please enter a smaller value.",
                [{ text: "OK", onPress: () => setInputValue(quantity.toString()) }]
            );
            return;
        }

        setQuantity(parsedInput);
        setInputVisible(false);

        // Provide feedback for large quantities
        if (parsedInput > 100) {
            Alert.alert(
                "Large Quantity Added",
                `You've added ${parsedInput} units of this product. Please confirm this is correct.`,
                [
                    {
                        text: "Change Quantity",
                        style: "cancel",
                        onPress: () => {
                            setInputValue(quantity.toString());
                            setInputVisible(true);
                        }
                    },
                    { text: "Confirm", style: "default" }
                ]
            );
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

    const handleAddToCart = () => {
        if (supplier === 'true') {
            // Navigate to AddToSupplierCart for supplier products
            router.push({
                pathname: '/stockManager/AddToSupplierCart',
                params: {
                    productId: productId,
                    categoryId: categoryId,
                    supplierId: product.supplierId || '',
                    fromProductDetails: 'true',
                    quantity: quantity.toString() // Pass the selected quantity
                }
            });
        } else {
            // Implement regular add to cart functionality
            Alert.alert('Success', `${quantity} × ${product.name} added to cart`);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <StatusBar barStyle="dark-content" />
                <ActivityIndicator size="large" color="#4F46E5" />
            </SafeAreaView>
        );
    }

    if (!product && error) {
        return (
            <SafeAreaView style={styles.errorContainer}>
                <StatusBar barStyle="dark-content" />
                <Text style={styles.errorText}>Product not found</Text>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#4B5563" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Product Details</Text>
                <View style={styles.rightPlaceholder} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContainer}>
                {error ? (
                    <View style={styles.centered}>
                        <Ionicons name="alert-circle-outline" size={50} color="red" />
                        <Text style={styles.errorText}>{error}</Text>
                        <TouchableOpacity
                            style={styles.retryButton}
                            onPress={fetchProductDetails}>
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.productContainer}>
                        {product?.imageUrl ? (
                            <Image
                                source={{ uri: product.imageUrl }}
                                style={styles.productImage}
                                resizeMode="contain"
                            />
                        ) : (
                            <View style={styles.noImageContainer}>
                                <Ionicons name="image-outline" size={80} color="#ccc" />
                                <Text style={styles.noImageText}>No image available</Text>
                            </View>
                        )}

                        <View style={styles.productInfo}>
                            <Text style={styles.productName}>{product?.name}</Text>
                            <Text style={styles.productPrice}>{product?.price ? `${product.price} Birr` : 'No price'}</Text>

                            {product?.stock !== undefined && (
                                <View style={styles.stockContainer}>
                                    <Text style={[
                                        styles.stockText,
                                        product.stock > 10
                                            ? styles.inStock
                                            : product.stock > 0
                                                ? styles.lowStock
                                                : styles.outOfStock
                                    ]}>
                                        {product.stock > 10
                                            ? 'In Stock'
                                            : product.stock > 0
                                                ? `Low Stock: ${product.stock} remaining`
                                                : 'Out of Stock'}
                                    </Text>
                                </View>
                            )}

                            {product?.unit && (
                                <View style={styles.detailRow}>
                                    <Text style={styles.detailLabel}>Unit:</Text>
                                    <Text style={styles.detailValue}>{product.unit}</Text>
                                </View>
                            )}

                            {supplier === 'true' && (
                                <View style={styles.supplierBadge}>
                                    <Ionicons name="business-outline" size={16} color="#4F46E5" />
                                    <Text style={styles.supplierBadgeText}>Supplier Product</Text>
                                </View>
                            )}

                            {product?.description && (
                                <View style={styles.descriptionContainer}>
                                    <Text style={styles.descriptionTitle}>Description</Text>
                                    <Text style={styles.descriptionText}>{product.description}</Text>
                                </View>
                            )}

                            {/* Quantity Control Section */}
                            <View style={styles.quantitySection}>
                                <Text style={styles.quantityTitle}>Quantity</Text>

                                <View style={styles.quantityControls}>
                                    <View style={styles.controlsRow}>
                                        <TouchableOpacity
                                            onPress={decreaseAmount}
                                            style={styles.quantityButton}
                                        >
                                            <Ionicons name="remove" size={20} color="#374151" />
                                        </TouchableOpacity>

                                        <Animated.Text
                                            style={[styles.quantityText, animatedStyle]}
                                        >
                                            {quantity}
                                        </Animated.Text>

                                        <TouchableOpacity
                                            onPress={increaseAmount}
                                            style={styles.quantityButton}
                                        >
                                            <Ionicons name="add" size={20} color="#374151" />
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            onPress={handleDirectInput}
                                            style={styles.editButton}
                                        >
                                            <Ionicons name="create-outline" size={16} color="#4B5563" />
                                            <Text style={styles.editButtonText}>Edit</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {inputVisible && (
                                        <View style={styles.inputContainer}>
                                            <TextInput
                                                value={inputValue}
                                                onChangeText={setInputValue}
                                                keyboardType="number-pad"
                                                placeholder="Enter quantity"
                                                style={styles.quantityInput}
                                                autoFocus
                                            />
                                            <View style={styles.inputButtons}>
                                                <TouchableOpacity
                                                    style={styles.cancelButton}
                                                    onPress={() => setInputVisible(false)}
                                                >
                                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                    style={styles.confirmButton}
                                                    onPress={confirmQuantityInput}
                                                >
                                                    <Text style={styles.confirmButtonText}>Confirm</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    )}
                                </View>
                            </View>

                            {supplier === 'true' ? (
                                <TouchableOpacity
                                    style={styles.orderButton}
                                    onPress={handleAddToCart}>
                                    <Text style={styles.orderButtonText}>Add To Order</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.cartButton, product?.stock <= 0 && styles.disabledButton]}
                                    onPress={handleAddToCart}
                                    disabled={product?.stock <= 0}>
                                    <Ionicons name="cart-outline" size={20} color="white" />
                                    <Text style={styles.cartButtonText}>Add to Cart</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        backgroundColor: 'white',
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    rightPlaceholder: {
        width: 40,
    },
    scrollContainer: {
        padding: 16,
    },
    centered: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    errorText: {
        fontSize: 16,
        color: 'grey',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    retryButton: {
        backgroundColor: '#4F46E5',
        padding: 12,
        borderRadius: 8,
    },
    retryButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    productContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        overflow: 'hidden',
    },
    productImage: {
        width: '100%',
        height: width * 0.8,
        backgroundColor: '#F9FAFB',
    },
    noImageContainer: {
        width: '100%',
        height: width * 0.8,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    noImageText: {
        color: '#9CA3AF',
        marginTop: 10,
    },
    productInfo: {
        padding: 16,
    },
    productName: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    productPrice: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#059669',
        marginBottom: 16,
    },
    stockContainer: {
        marginBottom: 16,
    },
    stockText: {
        fontSize: 14,
        fontWeight: '500',
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
        overflow: 'hidden',
        alignSelf: 'flex-start',
    },
    inStock: {
        backgroundColor: '#D1FAE5',
        color: '#065F46',
    },
    lowStock: {
        backgroundColor: '#FEF3C7',
        color: '#92400E',
    },
    outOfStock: {
        backgroundColor: '#FEE2E2',
        color: '#B91C1C',
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    detailLabel: {
        fontSize: 14,
        color: '#6B7280',
        width: 80,
    },
    detailValue: {
        fontSize: 14,
        color: '#1F2937',
        flex: 1,
    },
    supplierBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 16,
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    supplierBadgeText: {
        fontSize: 14,
        color: '#4F46E5',
        marginLeft: 4,
    },
    descriptionContainer: {
        marginBottom: 24,
    },
    descriptionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    descriptionText: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
    },
    orderButton: {
        backgroundColor: '#4F46E5',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    orderButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    cartButton: {
        backgroundColor: '#4F46E5',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        borderRadius: 8,
        marginTop: 16,
    },
    cartButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
    disabledButton: {
        backgroundColor: '#cccccc',
    },
    quantitySection: {
        marginTop: 16,
        marginBottom: 20,
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 12,
    },
    quantityTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 16,
    },
    quantityControls: {
        width: '100%',
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    quantityButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        width: 60,
        textAlign: 'center',
    },
    editButton: {
        padding: 10,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        flexDirection: 'row',
        alignItems: 'center',
    },
    editButtonText: {
        fontSize: 14,
        color: '#4B5563',
        marginLeft: 5,
    },
    inputContainer: {
        marginTop: 16,
        padding: 16,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
    },
    inputButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 12,
    },
    cancelButton: {
        backgroundColor: '#EF4444',
        padding: 8,
        borderRadius: 6,
        marginRight: 8,
    },
    cancelButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    confirmButton: {
        backgroundColor: '#10B981',
        padding: 8,
        borderRadius: 6,
    },
    confirmButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
    quantityInput: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 8,
        padding: 10,
        backgroundColor: 'white',
        marginBottom: 12,
        fontSize: 16,
    },
}); 