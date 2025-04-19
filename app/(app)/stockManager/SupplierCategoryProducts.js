import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    FlatList,
    Image,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    SafeAreaView,
    StatusBar,
    Dimensions,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { db } from '../../../firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get("window");

// Item component for products
const ProductItem = ({ item, onPress }) => {
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

export default function SupplierCategoryProducts() {
    const { categoryId, categoryName } = useLocalSearchParams();
    const [searchQuery, setSearchQuery] = useState("");
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    const router = useRouter();
    const navigation = useNavigation();

    // Initial data fetch
    useEffect(() => {
        fetchProducts();
    }, [categoryId]);

    // Handle search
    useEffect(() => {
        if (searchQuery.trim().length > 0) {
            const query = searchQuery.toLowerCase().trim();

            // Filter products by search query
            const searchFilteredProducts = products.filter(
                product => (product.name?.toLowerCase().includes(query) ||
                    product.description?.toLowerCase().includes(query))
            );

            setFilteredProducts(searchFilteredProducts);
        } else {
            // If search is cleared, show all products
            setFilteredProducts(products);
        }
    }, [searchQuery, products]);

    const fetchProducts = async () => {
        if (!categoryId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const categoryProductsRef = collection(db, 'supplier_category', categoryId, 'products');
            const productsSnapshot = await getDocs(categoryProductsRef);

            const productsData = productsSnapshot.docs
                .filter(doc => !doc.data()._placeholder) // Filter out placeholder docs
                .map(doc => ({
                    id: doc.id,
                    categoryId: categoryId,
                    categoryName: categoryName,
                    ...doc.data()
                }));

            setProducts(productsData);
            setFilteredProducts(productsData);
        } catch (error) {
            console.error("Error fetching products:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleProductPress = (product) => {
        router.push({
            pathname: "/stockManager/ProductDetails",
            params: {
                productId: product.id,
                categoryId: product.categoryId,
                supplier: 'true'
            }
        });
    };

    const handleClearSearch = () => {
        setSearchQuery("");
    };

    const renderProductItem = ({ item }) => (
        <ProductItem
            item={item}
            onPress={handleProductPress}
        />
    );

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
                    {categoryName || 'Category Products'}
                </Text>
            </View>

            {/* Search Bar */}
            <View style={{
                marginHorizontal: 16,
                marginTop: 16,
                marginBottom: 12,
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
                zIndex: 10,
            }}>
                <Ionicons name="search" size={22} color="#4F46E5" />
                <TextInput
                    style={{
                        flex: 1,
                        marginLeft: 12,
                        fontSize: 16,
                        color: '#1F2937',
                        paddingVertical: 4,
                    }}
                    placeholder="Search products..."
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

            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                </View>
            ) : (
                <View style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 8 }}>
                    {filteredProducts.length === 0 ? (
                        <View style={{
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: 40,
                            marginTop: 20,
                            backgroundColor: '#F9FAFB',
                            borderRadius: 12,
                        }}>
                            <MaterialCommunityIcons name="package-variant" size={48} color="#D1D5DB" />
                            <Text style={{ marginTop: 16, color: '#6B7280', fontSize: 16, textAlign: 'center' }}>
                                {searchQuery.length > 0
                                    ? `No products found matching "${searchQuery}"`
                                    : "No products available in this category"}
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={filteredProducts}
                            renderItem={renderProductItem}
                            keyExtractor={(item) => item.id}
                            numColumns={2}
                            contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
            )}
        </SafeAreaView>
    );
} 