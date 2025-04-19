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

    const handleAddToCart = () => {
        if (supplier === 'true') {
            // Navigate to AddToSupplierCart for supplier products
            router.push({
                pathname: '/stockManager/AddToSupplierCart',
                params: {
                    productId: productId,
                    categoryId: categoryId,
                    supplierId: product.supplierId || '',
                    fromProductDetails: 'true'
                }
            });
        } else {
            // Implement regular add to cart functionality
            Alert.alert('Success', `${product.name} added to cart`);
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
                        {product.imageUrl ? (
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
                            <Text style={styles.productName}>{product.name}</Text>
                            <Text style={styles.productPrice}>{product.price ? `${product.price} Birr` : 'No price'}</Text>

                            {product.stock !== undefined && (
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

                            {product.unit && (
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

                            {product.description && (
                                <View style={styles.descriptionContainer}>
                                    <Text style={styles.descriptionTitle}>Description</Text>
                                    <Text style={styles.descriptionText}>{product.description}</Text>
                                </View>
                            )}

                            {supplier === 'true' ? (
                                <TouchableOpacity
                                    style={styles.orderButton}
                                    onPress={handleAddToCart}>
                                    <Text style={styles.orderButtonText}>Add To Order</Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={[styles.cartButton, product.stock <= 0 && styles.disabledButton]}
                                    onPress={handleAddToCart}
                                    disabled={product.stock <= 0}>
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
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    rightPlaceholder: {
        width: 40,
    },
    scrollContainer: {
        padding: 16,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        marginTop: 10,
        fontSize: 16,
        color: 'red',
        textAlign: 'center',
    },
    retryButton: {
        marginTop: 15,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: '#4F46E5',
        borderRadius: 5,
    },
    retryButtonText: {
        color: 'white',
        fontSize: 16,
    },
    productContainer: {
        backgroundColor: 'white',
        borderRadius: 10,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    productImage: {
        width: '100%',
        height: 250,
        backgroundColor: '#f9f9f9',
    },
    noImageContainer: {
        width: '100%',
        height: 250,
        backgroundColor: '#f9f9f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    noImageText: {
        marginTop: 10,
        color: '#999',
    },
    productInfo: {
        padding: 16,
    },
    productName: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    productPrice: {
        fontSize: 20,
        fontWeight: '600',
        color: '#10B981',
        marginBottom: 12,
    },
    stockContainer: {
        marginBottom: 15,
    },
    stockText: {
        fontSize: 14,
        fontWeight: '500',
    },
    detailRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    detailLabel: {
        width: 80,
        fontSize: 16,
        color: '#6B7280',
    },
    detailValue: {
        fontSize: 16,
        color: '#1F2937',
        fontWeight: '500',
    },
    inStock: {
        color: 'green',
    },
    lowStock: {
        color: 'orange',
    },
    outOfStock: {
        color: 'red',
    },
    supplierBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EEF2FF',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
        alignSelf: 'flex-start',
        marginVertical: 12,
    },
    supplierBadgeText: {
        color: '#4F46E5',
        fontWeight: '500',
        marginLeft: 4,
    },
    descriptionContainer: {
        marginVertical: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    descriptionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    descriptionText: {
        fontSize: 16,
        color: '#555',
        lineHeight: 24,
    },
    cartButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4F46E5',
        padding: 15,
        borderRadius: 8,
        marginTop: 20,
    },
    cartButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    orderButton: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4F46E5',
        padding: 15,
        borderRadius: 8,
        marginTop: 20,
    },
    orderButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    disabledButton: {
        backgroundColor: '#cccccc',
    },
}); 