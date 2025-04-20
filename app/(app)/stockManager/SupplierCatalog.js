import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    TextInput,
    ScrollView,
    SafeAreaView,
    Dimensions,
    Animated,
    StatusBar,
    RefreshControl,
    ActivityIndicator,
    Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { db } from '../../../firebase/firebaseConfig';
import { collection, getDocs, query, orderBy, where, doc, getDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width * 0.42;

// Item component for categories
const CategoryItem = ({ item, index, onPress, isSelected }) => {
    return (
        <TouchableOpacity
            style={{
                backgroundColor: isSelected ? '#EEF2FF' : 'white',
                borderRadius: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3.84,
                elevation: 5,
                padding: 12,
                margin: 8,
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                width: CARD_WIDTH,
                maxHeight: 200,
                borderWidth: isSelected ? 2 : 0,
                borderColor: '#4F46E5',
            }}
            onPress={() => onPress(item)}
        >
            <LinearGradient
                colors={isSelected ? ['#EEF2FF', '#EEF2FF'] : ['#f0f9ff', '#fff']}
                style={{ position: 'absolute', width: '100%', height: '100%' }}
            />
            <Text style={{
                fontSize: 16,
                fontWeight: 'bold',
                textAlign: 'center',
                color: isSelected ? '#4F46E5' : '#4B5563'
            }}>
                {item.name}
            </Text>
            <View style={{ width: '100%', height: 96, marginVertical: 8 }}>
                <Image
                    style={{ width: "100%", height: "100%", resizeMode: "contain", borderRadius: 12 }}
                    source={{ uri: item.imageUrl || 'https://via.placeholder.com/100' }}
                />
            </View>
            <Text style={{
                fontSize: 14,
                fontWeight: '500',
                textAlign: 'center',
                width: '100%',
                paddingVertical: 4,
                color: isSelected ? '#4F46E5' : '#4B5563'
            }} numberOfLines={2}>
                {item.description || ''}
            </Text>
        </TouchableOpacity>
    );
};

// Item component for products
const ProductItem = ({ item, index, onPress }) => {
    return (
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
            onPress={() => onPress(item)}
        >
            <View style={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 1,
                backgroundColor: '#EEF2FF',
                borderRadius: 12,
                padding: 4,
            }}>
                <Ionicons name="information-circle-outline" size={18} color="#4F46E5" />
            </View>

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
};

export default function SupplierCatalog() {
    const [searchQuery, setSearchQuery] = useState("");
    const [categories, setCategories] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [productModalVisible, setProductModalVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [suppliers, setSuppliers] = useState([]);
    const [allCategories, setAllCategories] = useState([]);

    const router = useRouter();
    const navigation = useNavigation();
    const params = useLocalSearchParams();

    // Initial data fetch - only run once
    useEffect(() => {
        fetchData();
    }, []);

    // Handle changes in URL params for supplierId without triggering a full data refresh
    useEffect(() => {
        if (params.supplierId) {
            setSelectedSupplier(params.supplierId);
        }
    }, [params.supplierId]);

    // Filter products when category is selected
    useEffect(() => {
        if (selectedCategory) {
            let filtered = allProducts.filter(product => product.categoryId === selectedCategory.id);

            if (selectedSupplier) {
                filtered = filtered.filter(product => product.supplierId === selectedSupplier);
            }

            setFilteredProducts(filtered);
        } else if (selectedSupplier) {
            setFilteredProducts(allProducts.filter(product => product.supplierId === selectedSupplier));
        } else {
            setFilteredProducts(allProducts);
        }
    }, [selectedCategory, allProducts, selectedSupplier]);

    // Handle search
    useEffect(() => {
        if (searchQuery.trim().length > 0) {
            const query = searchQuery.toLowerCase().trim();

            let baseProducts = selectedSupplier ?
                allProducts.filter(product => product.supplierId === selectedSupplier) :
                allProducts;

            const searchFilteredProducts = baseProducts.filter(
                product => (product.name?.toLowerCase().includes(query) ||
                    product.description?.toLowerCase().includes(query))
            );

            setFilteredProducts(searchFilteredProducts);

            if (selectedCategory && searchFilteredProducts.filter(p => p.categoryId === selectedCategory.id).length === 0) {
                setSelectedCategory(null);
            }
        } else if (selectedCategory) {
            let filtered = allProducts.filter(product => product.categoryId === selectedCategory.id);

            if (selectedSupplier) {
                filtered = filtered.filter(product => product.supplierId === selectedSupplier);
            }

            setFilteredProducts(filtered);
        } else if (selectedSupplier) {
            setFilteredProducts(allProducts.filter(product => product.supplierId === selectedSupplier));
        } else {
            setFilteredProducts(allProducts);
        }
    }, [searchQuery, selectedCategory, allProducts, selectedSupplier]);

    // Filter categories based on the selected supplier
    useEffect(() => {
        if (selectedSupplier && allProducts.length > 0 && allCategories.length > 0) {
            // Find all categoryIds that have products from this supplier
            const supplierCategoryIds = allProducts
                .filter(product => product.supplierId === selectedSupplier)
                .map(product => product.categoryId);

            // Create a unique set of category IDs
            const uniqueCategoryIds = [...new Set(supplierCategoryIds)];

            // Filter the categories to only include those with products from this supplier
            const filteredCategories = allCategories.filter(category =>
                uniqueCategoryIds.includes(category.id)
            );

            setCategories(filteredCategories);
        } else if (allCategories.length > 0) {
            // If no supplier is selected, show all categories
            setCategories(allCategories);
        }
    }, [selectedSupplier, allProducts, allCategories]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch all supplier categories
            const categoryCollection = collection(db, 'supplier_category');
            const categorySnapshot = await getDocs(categoryCollection);
            const categoryList = categorySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));

            // Store all categories for later filtering
            setAllCategories(categoryList);
            setCategories(categoryList);

            // Fetch suppliers for the filter
            const suppliersCollection = collection(db, 'users');
            const suppliersQuery = query(suppliersCollection, where("role", "==", "supplier"));
            const suppliersSnapshot = await getDocs(suppliersQuery);
            const suppliersList = suppliersSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setSuppliers(suppliersList);

            // Fetch products from each category
            let products = [];

            // Process each category to fetch its products
            const productsPromises = categoryList.map(async (category) => {
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
            products = productsArrays.flat();

            setAllProducts(products);

            if (params.supplierId) {
                setFilteredProducts(products.filter(product => product.supplierId === params.supplierId));

                // Filter categories to only show those with products from this supplier
                const supplierCategoryIds = products
                    .filter(product => product.supplierId === params.supplierId)
                    .map(product => product.categoryId);

                // Create a unique set of category IDs
                const uniqueCategoryIds = [...new Set(supplierCategoryIds)];

                // Filter the categories
                const filteredCategories = categoryList.filter(category =>
                    uniqueCategoryIds.includes(category.id)
                );

                setCategories(filteredCategories);
            } else {
                setFilteredProducts(products);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const handleCategoryPress = (category) => {
        router.push({
            pathname: `/stockManager/SupplierCategoryProducts`,
            params: {
                categoryId: category.id,
                categoryName: category.name
            }
        });
    };

    const handleProductPress = (product) => {
        router.push({
            pathname: "/stockManager/AddToSupplierCart",
            params: {
                productId: product.id,
                productName: product.name,
                price: product.price,
                unitType: product.unit || "unit",
                image: product.imageUrl,
                categoryId: product.categoryId,
                supplierId: product.supplierId || "unknown",
                supplierName: product.categoryName || "Unknown Supplier"
            }
        });
    };

    const handleClearSearch = () => {
        setSearchQuery("");
    };

    const renderCategoryItem = ({ item, index }) => (
        <CategoryItem
            item={item}
            index={index}
            onPress={handleCategoryPress}
            isSelected={selectedCategory && selectedCategory.id === item.id}
        />
    );

    const renderProductItem = ({ item, index }) => (
        <ProductItem
            item={item}
            index={index}
            onPress={handleProductPress}
        />
    );

    const renderProductDetailModal = () => {
        if (!selectedProduct) return null;

        return (
            <Modal
                visible={productModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setProductModalVisible(false)}
            >
                <BlurView
                    intensity={20}
                    style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                    }}
                />
                <View style={{
                    flex: 1,
                    justifyContent: 'flex-end',
                }}>
                    <View style={{
                        backgroundColor: 'white',
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        paddingHorizontal: 20,
                        paddingTop: 20,
                        paddingBottom: 40,
                        maxHeight: height * 0.8,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: -5 },
                        shadowOpacity: 0.1,
                        shadowRadius: 6,
                        elevation: 5,
                    }}>
                        {/* Header */}
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 20
                        }}>
                            <Text style={{
                                fontSize: 20,
                                fontWeight: 'bold',
                                color: '#1F2937',
                                flex: 1
                            }} numberOfLines={1}>
                                {selectedProduct.name}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setProductModalVisible(false)}
                                style={{
                                    backgroundColor: '#F3F4F6',
                                    borderRadius: 20,
                                    width: 40,
                                    height: 40,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Ionicons name="close" size={24} color="#4B5563" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: height * 0.6 }}>
                            {/* Product Image */}
                            <View style={{
                                width: '100%',
                                height: 200,
                                backgroundColor: '#F9FAFB',
                                borderRadius: 16,
                                marginBottom: 20,
                                overflow: 'hidden',
                            }}>
                                <Image
                                    source={{ uri: selectedProduct.imageUrl || 'https://via.placeholder.com/400' }}
                                    style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                                />
                            </View>

                            {/* Product Details */}
                            <View style={{ marginBottom: 20 }}>
                                <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 14, color: '#6B7280' }}>Price</Text>
                                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#10B981' }}>
                                            {selectedProduct.price ? `${selectedProduct.price} Birr` : 'No price'}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 14, color: '#6B7280' }}>Category</Text>
                                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4B5563' }}>
                                            {selectedProduct.categoryName || 'Uncategorized'}
                                        </Text>
                                    </View>
                                </View>

                                {selectedProduct.unit && (
                                    <View style={{ marginBottom: 12 }}>
                                        <Text style={{ fontSize: 14, color: '#6B7280' }}>Unit</Text>
                                        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4B5563' }}>
                                            {selectedProduct.unit}
                                        </Text>
                                    </View>
                                )}

                                {selectedProduct.description && (
                                    <View style={{ marginBottom: 12 }}>
                                        <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 4 }}>Description</Text>
                                        <Text style={{ fontSize: 16, color: '#4B5563', lineHeight: 22 }}>
                                            {selectedProduct.description}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </ScrollView>

                        {/* Action Button */}
                        <TouchableOpacity
                            style={{
                                backgroundColor: '#4F46E5',
                                borderRadius: 12,
                                paddingVertical: 16,
                                alignItems: 'center',
                                marginTop: 16,
                            }}
                            onPress={() => {
                                setProductModalVisible(false);
                                router.push({
                                    pathname: "/stockManager/AddToSupplierCart",
                                    params: {
                                        productId: selectedProduct.id,
                                        productName: selectedProduct.name,
                                        price: selectedProduct.price,
                                        unitType: selectedProduct.unit || "unit",
                                        image: selectedProduct.imageUrl,
                                        categoryId: selectedProduct.categoryId,
                                        supplierId: selectedProduct.supplierId || "unknown",
                                        supplierName: selectedProduct.categoryName || "Unknown Supplier"
                                    }
                                });
                            }}
                        >
                            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
                                Add To Cart
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    };

    const toggleFilterModal = () => {
        setFilterModalVisible(!filterModalVisible);
    };

    const handleSupplierSelect = (supplierId) => {
        setSelectedSupplier(supplierId === selectedSupplier ? null : supplierId);
        setFilterModalVisible(false);
    };

    const renderFilterModal = () => (
        <Modal
            visible={filterModalVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setFilterModalVisible(false)}
        >
            <TouchableOpacity
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    justifyContent: 'center',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                }}
                activeOpacity={1}
                onPress={() => setFilterModalVisible(false)}
            >
                <View style={{
                    width: '80%',
                    backgroundColor: 'white',
                    borderRadius: 12,
                    overflow: 'hidden',
                    elevation: 5,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                }}>
                    <TouchableOpacity
                        activeOpacity={1}
                        style={{ width: '100%' }}
                        onPress={e => e.stopPropagation()}
                    >
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: 16,
                            borderBottomWidth: 1,
                            borderBottomColor: '#E5E7EB',
                        }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>
                                Filter by Supplier
                            </Text>
                            <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 300 }}>
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    paddingVertical: 12,
                                    paddingHorizontal: 16,
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#F3F4F6',
                                    backgroundColor: !selectedSupplier ? '#F9FAFB' : 'white',
                                }}
                                onPress={() => handleSupplierSelect(null)}
                            >
                                <Text style={{
                                    fontSize: 16,
                                    color: !selectedSupplier ? '#4F46E5' : '#4B5563',
                                    fontWeight: !selectedSupplier ? '500' : 'normal',
                                }}>
                                    All Suppliers
                                </Text>
                                {!selectedSupplier && (
                                    <Ionicons name="checkmark" size={18} color="#4F46E5" />
                                )}
                            </TouchableOpacity>

                            {suppliers.map(supplier => (
                                <TouchableOpacity
                                    key={supplier.id}
                                    style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        paddingVertical: 12,
                                        paddingHorizontal: 16,
                                        borderBottomWidth: 1,
                                        borderBottomColor: '#F3F4F6',
                                        backgroundColor: selectedSupplier === supplier.id ? '#F9FAFB' : 'white',
                                    }}
                                    onPress={() => handleSupplierSelect(supplier.id)}
                                >
                                    <Text style={{
                                        fontSize: 16,
                                        color: selectedSupplier === supplier.id ? '#4F46E5' : '#4B5563',
                                        fontWeight: selectedSupplier === supplier.id ? '500' : 'normal',
                                    }}>
                                        {supplier.companyName || 'Unnamed Supplier'}
                                    </Text>
                                    {selectedSupplier === supplier.id && (
                                        <Ionicons name="checkmark" size={18} color="#4F46E5" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );

    const renderNoProductsFound = () => {
        return (
            <View style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 20,
                marginTop: 40
            }}>
                <MaterialIcons name="inventory" size={70} color="#D1D5DB" />
                <Text style={{
                    fontSize: 18,
                    fontWeight: 'bold',
                    color: '#4B5563',
                    marginTop: 16,
                    textAlign: 'center'
                }}>
                    {searchQuery.trim().length > 0
                        ? "No products match your search"
                        : selectedCategory
                            ? "No products in this category"
                            : "No products available"}
                </Text>
                <Text style={{
                    color: '#6B7280',
                    textAlign: 'center',
                    marginTop: 8,
                    lineHeight: 20
                }}>
                    {searchQuery.trim().length > 0
                        ? `We couldn't find any products matching "${searchQuery}". Try a different search term or browse categories.`
                        : selectedCategory
                            ? "This category doesn't have any products yet. Try selecting a different category."
                            : "There are no products available at the moment. Check back later or contact your suppliers."}
                </Text>
                {searchQuery.trim().length > 0 && (
                    <TouchableOpacity
                        style={{
                            backgroundColor: '#4F46E5',
                            paddingHorizontal: 20,
                            paddingVertical: 12,
                            borderRadius: 8,
                            marginTop: 20
                        }}
                        onPress={handleClearSearch}
                    >
                        <Text style={{ color: 'white', fontWeight: 'bold' }}>Clear Search</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: '#E5E7EB',
                backgroundColor: 'white'
            }}>
                <TouchableOpacity
                    style={{ marginRight: 16 }}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#4B5563" />
                </TouchableOpacity>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>
                    Supplier Catalog {selectedSupplier ? '- Filtered' : ''}
                </Text>
            </View>

            {/* Search Bar */}
            <View style={{
                marginHorizontal: 16,
                marginTop: 16,
                marginBottom: 12,
                flexDirection: 'row',
                alignItems: 'center',
            }}>
                <View style={{
                    flex: 1,
                    backgroundColor: 'white',
                    borderRadius: 16,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                    elevation: 5,
                    marginRight: 8,
                }}>
                    <Ionicons name="search" size={22} color="#10B981" />
                    <TextInput
                        style={{
                            flex: 1,
                            marginLeft: 12,
                            fontSize: 16,
                            color: '#1F2937',
                            paddingVertical: 4,
                        }}
                        placeholder="Search products or categories..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#9CA3AF"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={handleClearSearch}>
                            <Ionicons name="close-circle" size={22} color="#9CA3AF" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Filter Button */}
                <TouchableOpacity
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        backgroundColor: selectedSupplier ? '#EEF2FF' : '#F3F4F6',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: selectedSupplier ? '#4F46E5' : '#E0E7FF',
                        position: 'relative',
                    }}
                    onPress={toggleFilterModal}
                >
                    <Ionicons name="filter" size={20} color={selectedSupplier ? '#4F46E5' : '#9CA3AF'} />
                    {selectedSupplier && (
                        <View style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#4F46E5',
                        }} />
                    )}
                </TouchableOpacity>
            </View>

            {/* Add supplier filter indicator if a supplier is selected */}
            {selectedSupplier && (
                <View style={{
                    marginHorizontal: 16,
                    marginBottom: 12,
                }}>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#EEF2FF',
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 16,
                        alignSelf: 'flex-start',
                        borderWidth: 1,
                        borderColor: '#E0E7FF',
                    }}>
                        <Text style={{
                            fontSize: 14,
                            color: '#4F46E5',
                            fontWeight: '500',
                        }}>
                            {suppliers.find(s => s.id === selectedSupplier)?.companyName || 'Filtered Supplier'}
                        </Text>
                        <TouchableOpacity
                            style={{ marginLeft: 6 }}
                            onPress={() => setSelectedSupplier(null)}
                        >
                            <Ionicons name="close-circle" size={16} color="#4F46E5" />
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Products Section - modified to use the new renderNoProductsFound function */}
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginVertical: 16, paddingHorizontal: 16 }}>
                    Products {selectedCategory ? `in ${selectedCategory.name}` : ''}
                </Text>

                {loading ? (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                        <ActivityIndicator size="large" color="#4F46E5" />
                        <Text style={{ marginTop: 10, color: '#6B7280' }}>Loading products...</Text>
                    </View>
                ) : filteredProducts.length === 0 ? (
                    renderNoProductsFound()
                ) : (
                    <FlatList
                        data={filteredProducts}
                        renderItem={renderProductItem}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 20 }}
                    />
                )}
            </View>

            {/* Filter Modal */}
            {renderFilterModal()}

            {/* Product Detail Modal */}
            {renderProductDetailModal()}
        </SafeAreaView>
    );
} 