import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    SafeAreaView,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Image,
    Alert,
    Modal,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { db } from '../../../firebase/firebaseConfig';
import {
    collection,
    getDocs,
    addDoc,
    serverTimestamp,
    query,
    where,
    doc,
    getDoc
} from 'firebase/firestore';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import HomeHeader from '../../components/HomeHeader';
import { useFocusEffect } from '@react-navigation/native';

export default function PlaceOrderForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);

    // Selected items
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedProducts, setSelectedProducts] = useState([]);

    // Modal states
    const [supplierModalVisible, setSupplierModalVisible] = useState(false);
    const [categoryModalVisible, setCategoryModalVisible] = useState(false);
    const [productModalVisible, setProductModalVisible] = useState(false);

    // Form data
    const [orderNotes, setOrderNotes] = useState('');
    const [deliveryDate, setDeliveryDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Default to 1 week from now

    // State to track if returning from payment screen
    const [isReturningFromPayment, setIsReturningFromPayment] = useState(false);

    // Use useFocusEffect instead of router.addEventListener
    useFocusEffect(
        useCallback(() => {
            // If we were previously in payment flow, this is a return
            if (isReturningFromPayment) {
                // Reset the form
                resetForm();
                setIsReturningFromPayment(false);
            }

            // No return needed for useFocusEffect
        }, [isReturningFromPayment])
    );

    useEffect(() => {
        fetchSuppliers();
    }, []);

    useEffect(() => {
        if (selectedSupplier) {
            fetchCategories();
            // Reset selected category when supplier changes
            setSelectedCategory(null);
        }
    }, [selectedSupplier]);

    useEffect(() => {
        if (selectedCategory && selectedSupplier) {
            fetchProducts();
        }
    }, [selectedCategory]);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            const suppliersRef = collection(db, 'users');
            const q = query(suppliersRef, where('role', '==', 'supplier'));
            const querySnapshot = await getDocs(q);

            const suppliersList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            setSuppliers(suppliersList);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            Alert.alert('Error', 'Failed to load suppliers. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        if (!selectedSupplier) return;

        try {
            setLoading(true);
            // Use supplier_category collection instead of categories
            const categoriesRef = collection(db, 'supplier_category');

            // Filter categories by the supplier's ID
            const q = query(categoriesRef, where('supplierId', '==', selectedSupplier.id));
            const querySnapshot = await getDocs(q);

            const categoriesList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            console.log(`Found ${categoriesList.length} categories for supplier ${selectedSupplier.id}`);

            if (categoriesList.length === 0) {
                console.log("No categories found in supplier_category, checking supplier productType");
                // If no categories found, we'll create a default category from the supplier's productType
                if (selectedSupplier.productType) {
                    const defaultCategory = {
                        id: 'default',
                        name: selectedSupplier.productType,
                        supplierId: selectedSupplier.id,
                        description: `Products in ${selectedSupplier.productType} category`
                    };
                    setCategories([defaultCategory]);
                }
            } else {
                setCategories(categoriesList);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            Alert.alert('Error', 'Failed to load categories. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = async () => {
        if (!selectedSupplier || !selectedCategory) return;

        try {
            setLoading(true);
            let productsList = [];

            // If using the default category (from productType)
            if (selectedCategory.id === 'default') {
                const productsRef = collection(db, 'products');
                const q = query(
                    productsRef,
                    where('supplierId', '==', selectedSupplier.id)
                );
                console.log("Using default category, querying all products for this supplier");
                const querySnapshot = await getDocs(q);
                productsList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    quantity: 1, // Default quantity for ordering
                }));
            } else {
                // Get products from the nested subcollection within supplier_category
                const productsRef = collection(db, 'supplier_category', selectedCategory.id, 'products');
                const querySnapshot = await getDocs(productsRef);

                productsList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    quantity: 1, // Default quantity for ordering
                }));

                console.log(`Fetching products from subcollection for category ${selectedCategory.id}`);
            }

            console.log(`Found ${productsList.length} products`);
            setProducts(productsList);
        } catch (error) {
            console.error('Error fetching products:', error);
            Alert.alert('Error', 'Failed to load products. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const addProductToOrder = (product) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const exists = selectedProducts.find(p => p.id === product.id);

        if (exists) {
            // Update quantity if product already in order
            setSelectedProducts(prevProducts =>
                prevProducts.map(p =>
                    p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
                )
            );
        } else {
            // Add new product with quantity 1
            setSelectedProducts(prevProducts => [...prevProducts, { ...product, quantity: 1 }]);
        }

        setProductModalVisible(false);
    };

    const removeProductFromOrder = (productId) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
    };

    const updateProductQuantity = (productId, quantity) => {
        // Convert to number if it's a string
        const newQuantity = parseInt(quantity);

        // Validate it's a valid number
        if (isNaN(newQuantity)) {
            return; // Do nothing if not a valid number
        }

        if (newQuantity <= 0) {
            // Remove product if quantity is 0 or negative
            removeProductFromOrder(productId);
            return;
        }

        setSelectedProducts(prevProducts =>
            prevProducts.map(p =>
                p.id === productId ? { ...p, quantity: newQuantity } : p
            )
        );
    };

    const calculateTotal = () => {
        return selectedProducts.reduce((total, product) => {
            return total + (product.price * product.quantity);
        }, 0);
    };

    const handleSubmitOrder = async () => {
        if (!selectedSupplier) {
            Alert.alert('Error', 'Please select a supplier');
            return;
        }

        if (selectedProducts.length === 0) {
            Alert.alert('Error', 'Please add at least one product to your order');
            return;
        }

        // Format products like cart items for the payment screen
        const formattedCartItems = selectedProducts.map(product => ({
            id: product.id,
            productId: product.id,
            productName: product.name,
            categoryId: selectedCategory.id,
            price: product.price,
            quantity: product.quantity,
            totalPrice: product.price * product.quantity,
            image: product.image || product.imageUrl,
            supplierId: selectedSupplier.id,
            supplierName: selectedSupplier.companyName || selectedSupplier.displayName,
            unit: product.unit || 'item'
        }));

        // Calculate total amount
        const totalAmount = calculateTotal();

        // Set flag to indicate we're going to payment screen
        setIsReturningFromPayment(true);

        // Navigate to payment screen with all required data
        router.push({
            pathname: "/stockManager/SupplierPaymentScreen",
            params: {
                totalAmount: totalAmount.toString(),
                supplierId: selectedSupplier.id,
                supplierName: selectedSupplier.companyName || selectedSupplier.displayName,
                notes: orderNotes,
                cartItems: JSON.stringify(formattedCartItems),
                isDirectOrder: "true" // Flag to indicate this is from direct order form, not cart
            }
        });
    };

    // Function to reset form after successful order
    const resetForm = () => {
        console.log('Resetting form after successful order');
        setSelectedSupplier(null);
        setSelectedCategory(null);
        setSelectedProducts([]);
        setOrderNotes('');
        setDeliveryDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
        setProducts([]);

        // Add haptic feedback to indicate form reset
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    // Basic rendering functions - we'll expand these later
    const renderHeader = () => (
        <View style={{ backgroundColor: '#F9FAFB' }}>
            <HomeHeader title="Place Order" />
        </View>
    );

    // Render the supplier selection modal
    const renderSupplierModal = () => (
        <Modal
            visible={supplierModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setSupplierModalVisible(false)}
        >
            <View style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 20
            }}>
                <View style={{
                    backgroundColor: 'white',
                    borderRadius: 16,
                    width: '100%',
                    maxHeight: '80%',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                }}>
                    <View style={{
                        paddingHorizontal: 20,
                        paddingVertical: 16,
                        borderBottomWidth: 1,
                        borderBottomColor: '#E5E7EB',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>
                            Select Supplier
                        </Text>
                        <TouchableOpacity onPress={() => setSupplierModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ maxHeight: '70%' }}>
                        {suppliers.length > 0 ? (
                            suppliers.map((supplier) => (
                                <TouchableOpacity
                                    key={supplier.id}
                                    style={{
                                        padding: 16,
                                        borderBottomWidth: 1,
                                        borderBottomColor: '#E5E7EB',
                                        flexDirection: 'row',
                                        alignItems: 'center'
                                    }}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setSelectedSupplier(supplier);
                                        setSupplierModalVisible(false);
                                    }}
                                >
                                    <View style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 22,
                                        backgroundColor: '#EEF2FF',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginRight: 12
                                    }}>
                                        {supplier.photoURL ? (
                                            <Image
                                                source={{ uri: supplier.photoURL }}
                                                style={{ width: 44, height: 44, borderRadius: 22 }}
                                            />
                                        ) : (
                                            <MaterialIcons name="business" size={22} color="#4F46E5" />
                                        )}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                                            {supplier.companyName || supplier.displayName || 'Unnamed Supplier'}
                                        </Text>
                                        {supplier.email && (
                                            <Text style={{ fontSize: 14, color: '#6B7280' }}>
                                                {supplier.email}
                                            </Text>
                                        )}
                                    </View>
                                    {selectedSupplier?.id === supplier.id && (
                                        <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
                                    )}
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <MaterialIcons name="search-off" size={48} color="#D1D5DB" />
                                <Text style={{ marginTop: 12, color: '#6B7280', textAlign: 'center' }}>
                                    No suppliers found
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    // Render the category selection modal
    const renderCategoryModal = () => (
        <Modal
            visible={categoryModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setCategoryModalVisible(false)}
        >
            <View style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 20
            }}>
                <View style={{
                    backgroundColor: 'white',
                    borderRadius: 16,
                    width: '100%',
                    maxHeight: '80%',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                }}>
                    <View style={{
                        paddingHorizontal: 20,
                        paddingVertical: 16,
                        borderBottomWidth: 1,
                        borderBottomColor: '#E5E7EB',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>
                            Select Category
                        </Text>
                        <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ maxHeight: '70%' }}>
                        {categories.length > 0 ? (
                            categories.map((category) => (
                                <TouchableOpacity
                                    key={category.id}
                                    style={{
                                        padding: 16,
                                        borderBottomWidth: 1,
                                        borderBottomColor: '#E5E7EB',
                                        flexDirection: 'row',
                                        alignItems: 'center'
                                    }}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setSelectedCategory(category);
                                        setCategoryModalVisible(false);
                                    }}
                                >
                                    <View style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 22,
                                        backgroundColor: '#F0F9FF',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginRight: 12
                                    }}>
                                        {category.imageUrl ? (
                                            <Image
                                                source={{ uri: category.imageUrl }}
                                                style={{ width: 44, height: 44, borderRadius: 22 }}
                                            />
                                        ) : (
                                            <MaterialIcons name="category" size={22} color="#0EA5E9" />
                                        )}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                                            {category.name}
                                        </Text>
                                        {category.description && (
                                            <Text style={{ fontSize: 14, color: '#6B7280' }} numberOfLines={1}>
                                                {category.description}
                                            </Text>
                                        )}
                                    </View>
                                    {selectedCategory?.id === category.id && (
                                        <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
                                    )}
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <MaterialIcons name="search-off" size={48} color="#D1D5DB" />
                                <Text style={{ marginTop: 12, color: '#6B7280', textAlign: 'center' }}>
                                    No categories found
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    // Render the product selection modal
    const renderProductModal = () => (
        <Modal
            visible={productModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setProductModalVisible(false)}
        >
            <View style={{
                flex: 1,
                backgroundColor: 'rgba(0,0,0,0.5)',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 20
            }}>
                <View style={{
                    backgroundColor: 'white',
                    borderRadius: 16,
                    width: '100%',
                    maxHeight: '80%',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                }}>
                    <View style={{
                        paddingHorizontal: 20,
                        paddingVertical: 16,
                        borderBottomWidth: 1,
                        borderBottomColor: '#E5E7EB',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>
                            Select Products
                        </Text>
                        <TouchableOpacity onPress={() => setProductModalVisible(false)}>
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={{ maxHeight: '70%' }}>
                        {products.length > 0 ? (
                            products.map((product) => (
                                <TouchableOpacity
                                    key={product.id}
                                    style={{
                                        padding: 16,
                                        borderBottomWidth: 1,
                                        borderBottomColor: '#E5E7EB',
                                        flexDirection: 'row',
                                        alignItems: 'center'
                                    }}
                                    onPress={() => addProductToOrder(product)}
                                >
                                    <View style={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: 8,
                                        backgroundColor: '#F3F4F6',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        marginRight: 12,
                                        overflow: 'hidden'
                                    }}>
                                        {product.image || product.imageUrl ? (
                                            <Image
                                                source={{ uri: product.image || product.imageUrl }}
                                                style={{ width: 56, height: 56 }}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <MaterialCommunityIcons name="package-variant" size={28} color="#6B7280" />
                                        )}
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                                            {product.name}
                                        </Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                            <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#4F46E5' }}>
                                                {formatCurrency(product.price || 0)}
                                            </Text>
                                            <Text style={{ fontSize: 14, color: '#6B7280', marginLeft: 6 }}>
                                                per {product.unit || 'item'}
                                            </Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={{
                                            padding: 8,
                                            backgroundColor: '#EEF2FF',
                                            borderRadius: 8,
                                        }}
                                        onPress={() => addProductToOrder(product)}
                                    >
                                        <Ionicons name="add" size={20} color="#4F46E5" />
                                    </TouchableOpacity>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={{ padding: 20, alignItems: 'center' }}>
                                <MaterialIcons name="inventory" size={48} color="#D1D5DB" />
                                <Text style={{ marginTop: 12, color: '#6B7280', textAlign: 'center' }}>
                                    No products found for the selected supplier and category
                                </Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    // Format currency - change to Birr
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            minimumFractionDigits: 2
        }).format(amount || 0);
    };

    // Render selected products
    const renderSelectedProducts = () => (
        <View style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 12 }}>
                Selected Products
            </Text>

            {selectedProducts.length === 0 ? (
                <View style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: 12,
                    padding: 20,
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    borderStyle: 'dashed'
                }}>
                    <MaterialCommunityIcons name="cart-outline" size={48} color="#9CA3AF" />
                    <Text style={{
                        marginTop: 12,
                        fontSize: 16,
                        fontWeight: '500',
                        color: '#4B5563',
                        textAlign: 'center'
                    }}>
                        No products added yet
                    </Text>
                    <Text style={{
                        marginTop: 4,
                        fontSize: 14,
                        color: '#6B7280',
                        textAlign: 'center',
                        paddingHorizontal: 20
                    }}>
                        Select a supplier and category, then add products to your order
                    </Text>
                </View>
            ) : (
                <View>
                    {selectedProducts.map(product => (
                        <View
                            key={product.id}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: 12,
                                padding: 16,
                                marginBottom: 12,
                                flexDirection: 'row',
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: '#E5E7EB',
                            }}
                        >
                            <View style={{
                                width: 48,
                                height: 48,
                                borderRadius: 8,
                                backgroundColor: '#F3F4F6',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 12,
                                overflow: 'hidden'
                            }}>
                                {product.image || product.imageUrl ? (
                                    <Image
                                        source={{ uri: product.image || product.imageUrl }}
                                        style={{ width: 48, height: 48 }}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <MaterialCommunityIcons name="package-variant" size={24} color="#6B7280" />
                                )}
                            </View>

                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                                    {product.name}
                                </Text>
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                    <Text style={{ fontSize: 14, color: '#6B7280' }}>
                                        {formatCurrency(product.price || 0)} per {product.unit || 'item'}
                                    </Text>
                                </View>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TouchableOpacity
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: 14,
                                        backgroundColor: '#F3F4F6',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                    onPress={() => updateProductQuantity(product.id, product.quantity - 1)}
                                >
                                    <Ionicons name="remove" size={18} color="#4B5563" />
                                </TouchableOpacity>

                                <TextInput
                                    style={{
                                        fontSize: 16,
                                        fontWeight: '600',
                                        color: '#111827',
                                        marginHorizontal: 8,
                                        minWidth: 40,
                                        textAlign: 'center',
                                        padding: 4,
                                        borderWidth: 1,
                                        borderColor: '#E5E7EB',
                                        borderRadius: 6,
                                    }}
                                    keyboardType="number-pad"
                                    value={String(product.quantity)}
                                    onChangeText={(text) => updateProductQuantity(product.id, text)}
                                />

                                <TouchableOpacity
                                    style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: 14,
                                        backgroundColor: '#EEF2FF',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                    onPress={() => updateProductQuantity(product.id, product.quantity + 1)}
                                >
                                    <Ionicons name="add" size={18} color="#4F46E5" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}

                    <View style={{
                        backgroundColor: '#EEF2FF',
                        borderRadius: 12,
                        padding: 16,
                        marginTop: 8,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <Text style={{ fontSize: 16, fontWeight: '600', color: '#4F46E5' }}>
                            Total Amount:
                        </Text>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#4F46E5' }}>
                            {formatCurrency(calculateTotal())}
                        </Text>
                    </View>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <StatusBar style="dark" />
            {renderHeader()}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
                    <View style={{
                        backgroundColor: 'white',
                        borderRadius: 16,
                        padding: 20,
                        marginBottom: 16,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 3,
                        elevation: 2,
                    }}>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 16 }}>
                            Order Information
                        </Text>

                        {/* Supplier Selection */}
                        <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 }}>
                            Supplier
                        </Text>
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: '#E5E7EB',
                                borderRadius: 8,
                                padding: 12,
                                marginBottom: 16,
                            }}
                            onPress={() => setSupplierModalVisible(true)}
                        >
                            <View style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: '#EEF2FF',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 12
                            }}>
                                <MaterialIcons name="business" size={20} color="#4F46E5" />
                            </View>
                            {selectedSupplier ? (
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827' }}>
                                        {selectedSupplier.companyName || selectedSupplier.displayName}
                                    </Text>
                                    {selectedSupplier.email && (
                                        <Text style={{ fontSize: 14, color: '#6B7280' }}>
                                            {selectedSupplier.email}
                                        </Text>
                                    )}
                                </View>
                            ) : (
                                <Text style={{ flex: 1, fontSize: 15, color: '#9CA3AF' }}>
                                    Select a supplier
                                </Text>
                            )}
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>

                        {/* Category Selection - Only enabled if supplier is selected */}
                        <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 }}>
                            Category
                        </Text>
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: '#E5E7EB',
                                borderRadius: 8,
                                padding: 12,
                                marginBottom: 16,
                                opacity: selectedSupplier ? 1 : 0.5
                            }}
                            onPress={() => {
                                if (selectedSupplier) {
                                    setCategoryModalVisible(true);
                                } else {
                                    Alert.alert('Error', 'Please select a supplier first');
                                }
                            }}
                            disabled={!selectedSupplier}
                        >
                            <View style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: '#F0F9FF',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginRight: 12
                            }}>
                                <MaterialIcons name="category" size={20} color="#0EA5E9" />
                            </View>
                            {selectedCategory ? (
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 16, fontWeight: '500', color: '#111827' }}>
                                        {selectedCategory.name}
                                    </Text>
                                </View>
                            ) : (
                                <Text style={{ flex: 1, fontSize: 15, color: '#9CA3AF' }}>
                                    Select a category
                                </Text>
                            )}
                            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                        </TouchableOpacity>

                        {/* Add Products Button - Only enabled if supplier and category are selected */}
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: selectedSupplier && selectedCategory ? '#EEF2FF' : '#F3F4F6',
                                borderRadius: 8,
                                padding: 12,
                                marginBottom: 8,
                            }}
                            onPress={() => {
                                if (!selectedSupplier) {
                                    Alert.alert('Error', 'Please select a supplier first');
                                    return;
                                }

                                if (!selectedCategory) {
                                    Alert.alert('Error', 'Please select a category first');
                                    return;
                                }

                                setProductModalVisible(true);
                            }}
                            disabled={!selectedSupplier || !selectedCategory}
                        >
                            <Ionicons
                                name="add-circle"
                                size={20}
                                color={selectedSupplier && selectedCategory ? '#4F46E5' : '#9CA3AF'}
                                style={{ marginRight: 8 }}
                            />
                            <Text style={{
                                fontSize: 15,
                                fontWeight: '600',
                                color: selectedSupplier && selectedCategory ? '#4F46E5' : '#9CA3AF'
                            }}>
                                Add Products
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Selected Products Section */}
                    {renderSelectedProducts()}

                    {/* Order Details Section */}
                    <View style={{
                        backgroundColor: 'white',
                        borderRadius: 16,
                        padding: 20,
                        marginTop: 16,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 3,
                        elevation: 2,
                    }}>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 16 }}>
                            Order Details
                        </Text>

                        {/* Order Notes */}
                        <Text style={{ fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 }}>
                            Order Notes (Optional)
                        </Text>
                        <TextInput
                            style={{
                                borderWidth: 1,
                                borderColor: '#E5E7EB',
                                borderRadius: 8,
                                padding: 12,
                                fontSize: 15,
                                color: '#111827',
                                marginBottom: 8,
                                minHeight: 100,
                                textAlignVertical: 'top',
                            }}
                            placeholder="Enter any special instructions or notes for this order"
                            value={orderNotes}
                            onChangeText={setOrderNotes}
                            multiline
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Submit Button */}
            <View style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: 16,
                backgroundColor: 'white',
                borderTopWidth: 1,
                borderTopColor: '#E5E7EB',
            }}>
                <TouchableOpacity
                    style={{
                        backgroundColor: selectedSupplier && selectedProducts.length > 0 ? '#4F46E5' : '#E5E7EB',
                        paddingVertical: 14,
                        borderRadius: 10,
                        alignItems: 'center',
                        shadowColor: '#4F46E5',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.2,
                        shadowRadius: 3,
                        elevation: 2,
                    }}
                    onPress={handleSubmitOrder}
                    disabled={!selectedSupplier || selectedProducts.length === 0}
                >
                    <Text style={{
                        color: selectedSupplier && selectedProducts.length > 0 ? 'white' : '#9CA3AF',
                        fontSize: 16,
                        fontWeight: '600'
                    }}>
                        Proceed to Checkout
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Modals */}
            {renderSupplierModal()}
            {renderCategoryModal()}
            {renderProductModal()}

            {/* Loading Overlay */}
            {loading && (
                <View style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0,0,0,0.3)'
                }}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            )}
        </SafeAreaView>
    );
} 