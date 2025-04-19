import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TextInput,
    FlatList,
    Image,
    Dimensions,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../../firebase/firebaseConfig';
import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
} from 'firebase/firestore';

const { width, height } = Dimensions.get('window');

const SupplierProductDisplay = ({
    visible,
    onClose,
    onSelectProduct,
    provideFeedback
}) => {
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch categories when modal becomes visible
    useEffect(() => {
        if (visible) {
            fetchCategories();
            setSearchQuery('');
            setSelectedCategory(null);
        }
    }, [visible]);

    // Filter products when search query changes or products/selectedCategory changes
    useEffect(() => {
        filterProducts();
    }, [searchQuery, products, selectedCategory]);

    // Fetch all supplier categories
    const fetchCategories = async () => {
        try {
            setLoading(true);
            const supplierCategoriesRef = collection(db, 'supplier_category');

            try {
                const q = query(
                    supplierCategoriesRef,
                    orderBy("name", "asc")
                );

                const querySnapshot = await getDocs(q);
                const categoriesList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setCategories(categoriesList);

                // If categories exist, fetch all products initially
                if (categoriesList.length > 0) {
                    fetchAllProducts(categoriesList);
                } else {
                    setLoading(false);
                }
            } catch (error) {
                // Fallback to simple query if compound query fails (missing index)
                console.error("Compound query failed, trying simple query:", error);
                const simpleQuerySnapshot = await getDocs(supplierCategoriesRef);
                const simpleCategoriesList = simpleQuerySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setCategories(simpleCategoriesList);

                if (simpleCategoriesList.length > 0) {
                    fetchAllProducts(simpleCategoriesList);
                } else {
                    setLoading(false);
                }
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            setLoading(false);
        }
    };

    // Fetch products for all categories or a specific category
    const fetchAllProducts = async (categoriesList) => {
        try {
            setLoading(true);
            let allProducts = [];

            // Fetch products from each category in parallel
            const productsPromises = categoriesList.map(async (category) => {
                const categoryId = category.id;
                const categoryProductsRef = collection(db, 'supplier_category', categoryId, 'products');

                try {
                    const productsSnapshot = await getDocs(categoryProductsRef);
                    return productsSnapshot.docs
                        .filter(doc => !doc.data()._placeholder) // Filter out placeholder docs
                        .map(doc => ({
                            id: doc.id,
                            categoryId: categoryId,
                            categoryName: category.name,
                            ...doc.data()
                        }));
                } catch (error) {
                    console.error(`Error fetching products for category ${categoryId}:`, error);
                    return []; // Return empty array for this category
                }
            });

            // Wait for all queries to complete and combine results
            const productsArrays = await Promise.all(productsPromises);
            allProducts = productsArrays.flat();

            // Set products state
            setProducts(allProducts);
            setFilteredProducts(allProducts);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching products:", error);
            setProducts([]);
            setFilteredProducts([]);
            setLoading(false);
        }
    };

    // Filter products based on search query and selected category
    const filterProducts = () => {
        let filtered = products;

        // Filter by category if selected
        if (selectedCategory) {
            filtered = filtered.filter(product => product.categoryId === selectedCategory);
        }

        // Filter by search query if provided
        if (searchQuery) {
            filtered = filtered.filter(product =>
                product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredProducts(filtered);
    };

    const handleSelectProduct = (product) => {
        provideFeedback && provideFeedback('light');
        onSelectProduct(product);
    };

    const handleSelectCategory = (categoryId) => {
        provideFeedback && provideFeedback('light');
        setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    };

    // Render category item
    const renderCategoryItem = ({ item }) => (
        <Animated.View entering={FadeIn.delay(100).duration(300)}>
            <TouchableOpacity
                style={{
                    padding: 12,
                    marginHorizontal: 6,
                    backgroundColor: selectedCategory === item.id ? '#4F46E5' : '#F3F4F6',
                    borderRadius: 10,
                    alignItems: 'center',
                    minWidth: 100,
                }}
                onPress={() => handleSelectCategory(item.id)}
            >
                <Text
                    style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: selectedCategory === item.id ? 'white' : '#4B5563',
                    }}
                >
                    {item.name}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );

    // Render product item
    const renderProductItem = ({ item }) => (
        <TouchableOpacity
            style={{
                backgroundColor: 'white',
                borderRadius: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 2.84,
                elevation: 3,
                padding: 12,
                margin: 8,
                overflow: 'hidden',
                width: width * 0.42
            }}
            onPress={() => handleSelectProduct(item)}
        >
            <View style={{ width: '100%', height: 96, marginBottom: 8, backgroundColor: '#F9FAFB', borderRadius: 12, overflow: 'hidden' }}>
                <Image
                    source={{ uri: item.imageUrl || 'https://via.placeholder.com/100' }}
                    style={{ width: "100%", height: "100%", resizeMode: "contain" }}
                />
            </View>
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F2937' }} numberOfLines={1}>
                {item.name || ''}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={{ color: '#10B981', fontWeight: 'bold' }}>
                    {item.price ? `${item.price} Birr` : 'No price'}
                </Text>
            </View>
        </TouchableOpacity>
    );

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <BlurView
                intensity={10}
                style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                }}
            />
            <SafeAreaView
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    paddingTop: insets.top,
                    paddingBottom: insets.bottom,
                }}
            >
                {/* Header */}
                <View
                    style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 16,
                        borderBottomWidth: 1,
                        borderBottomColor: '#E5E7EB',
                    }}
                >
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>
                        Select Product
                    </Text>
                    <TouchableOpacity
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: '#F3F4F6',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        onPress={onClose}
                    >
                        <Ionicons name="close" size={24} color="#4B5563" />
                    </TouchableOpacity>
                </View>

                {/* Search Bar */}
                <View
                    style={{
                        margin: 16,
                        backgroundColor: 'white',
                        borderRadius: 16,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3,
                    }}
                >
                    <Ionicons name="search" size={22} color="#6B7280" />
                    <TextInput
                        style={{
                            flex: 1,
                            marginLeft: 10,
                            fontSize: 16,
                            color: '#1F2937',
                        }}
                        placeholder="Search products..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#9CA3AF"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={22} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Content */}
                <View style={{ flex: 1 }}>
                    {/* Categories Horizontal Scrolling */}
                    {categories.length > 0 && (
                        <View style={{
                            paddingVertical: 10,
                            borderBottomWidth: 1,
                            borderBottomColor: '#E5E7EB',
                        }}>
                            <FlatList
                                data={categories}
                                renderItem={renderCategoryItem}
                                keyExtractor={(item) => item.id}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={{ paddingHorizontal: 14 }}
                            />
                        </View>
                    )}

                    {/* Loading */}
                    {loading && (
                        <View style={{
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: 20
                        }}>
                            <ActivityIndicator size="large" color="#4F46E5" />
                            <Text style={{ marginTop: 12, color: '#6B7280', fontSize: 16 }}>
                                Loading products...
                            </Text>
                        </View>
                    )}

                    {/* Products List */}
                    {!loading && (
                        filteredProducts.length === 0 ? (
                            <View style={{
                                flex: 1,
                                justifyContent: 'center',
                                alignItems: 'center',
                                padding: 20
                            }}>
                                <MaterialCommunityIcons name="package-variant" size={64} color="#D1D5DB" />
                                <Text style={{ marginTop: 16, textAlign: 'center', fontSize: 16, color: '#6B7280' }}>
                                    {searchQuery
                                        ? `No products found matching "${searchQuery}"`
                                        : selectedCategory
                                            ? "No products available in selected category"
                                            : "No products available"}
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                data={filteredProducts}
                                renderItem={renderProductItem}
                                keyExtractor={(item) => item.id}
                                numColumns={2}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{
                                    paddingHorizontal: 8,
                                    paddingBottom: 20
                                }}
                            />
                        )
                    )}
                </View>
            </SafeAreaView>
        </Modal>
    );
};

export default SupplierProductDisplay; 