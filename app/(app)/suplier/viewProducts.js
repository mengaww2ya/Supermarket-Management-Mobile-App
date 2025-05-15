import React, { useState, useEffect } from "react";
import {
    Text,
    View,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    Dimensions,
    RefreshControl,
    TextInput,
    Modal,
    ScrollView
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
    Ionicons,
    MaterialCommunityIcons,
    AntDesign,
    FontAwesome,
    Feather,
    MaterialIcons
} from '@expo/vector-icons';
import Animated, {
    FadeInDown,
    FadeIn
} from 'react-native-reanimated';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from 'expo-haptics';
import { db, auth } from "../../../firebase/firebaseConfig";
import {
    collection,
    getDocs,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    updateDoc,
    increment,
    serverTimestamp
} from "firebase/firestore";
import HomeHeader from "../../components/HomeHeader";
import { StatusBar } from "expo-status-bar";

const { width, height } = Dimensions.get("window");

export default function ViewProducts() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const { categoryId, categoryName } = params;

    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showCategoryFilter, setShowCategoryFilter] = useState(false);
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(categoryId || null);
    const [selectedCategoryName, setSelectedCategoryName] = useState(categoryName || "All Products");
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productDetailVisible, setProductDetailVisible] = useState(false);

    // Fetch products and categories on load
    useEffect(() => {
        fetchCategories();
        fetchProducts();
    }, [selectedCategory]);

    // Filter products when search query changes
    useEffect(() => {
        if (searchQuery) {
            const filtered = products.filter(product =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts(products);
        }
    }, [searchQuery, products]);

    // Fetch all supplier categories
    const fetchCategories = async () => {
        try {
            const userId = auth.currentUser?.uid;

            if (!userId) {
                console.error("No authenticated user found");
                return;
            }

            const supplierCategoriesRef = collection(db, 'supplier_category');

            // Try with compound query first (requires index)
            try {
                const q = query(
                    supplierCategoriesRef,
                    where("supplierId", "==", userId),
                    orderBy("name", "asc")
                );

                const querySnapshot = await getDocs(q);
                const categoriesList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setCategories(categoriesList);
            } catch (indexError) {
                // If index error occurs, fall back to simpler query
                console.log("Index error in categories, using fallback:", indexError.message);

                // Fallback to a simpler query without ordering
                const simpleQuery = query(
                    supplierCategoriesRef,
                    where("supplierId", "==", userId)
                );

                const querySnapshot = await getDocs(simpleQuery);
                let categoriesList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Sort in memory
                categoriesList.sort((a, b) => {
                    const nameA = (a.name || '').toLowerCase();
                    const nameB = (b.name || '').toLowerCase();
                    return nameA.localeCompare(nameB);
                });

                setCategories(categoriesList);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            // Set empty categories array to avoid undefined
            setCategories([]);
        }
    };

    // Fetch products for this category
    const fetchProducts = async () => {
        try {
            setLoading(true);
            const userId = auth.currentUser?.uid;

            if (!userId) {
                console.error("No authenticated user found");
                setLoading(false);
                return;
            }

            let productsList = [];

            if (selectedCategory) {
                // If category ID is provided, fetch products from the subcollection
                const categoryProductsRef = collection(db, 'supplier_category', selectedCategory, 'products');

                // Try with compound query first (which requires an index)
                try {
                    const q = query(
                        categoryProductsRef,
                        where("supplierId", "==", userId),
                        orderBy("createdAt", "desc")
                    );

                    const querySnapshot = await getDocs(q);
                    productsList = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                } catch (indexError) {
                    // If index error occurs, fall back to simpler query
                    console.log("Index error in subcollection products, using fallback:", indexError.message);

                    // Fallback to a simpler query without ordering
                    const simpleQuery = query(
                        categoryProductsRef,
                        where("supplierId", "==", userId)
                    );

                    const querySnapshot = await getDocs(simpleQuery);
                    productsList = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));

                    // Sort in memory - newest first based on createdAt
                    productsList.sort((a, b) => {
                        // Handle missing createdAt fields
                        if (!a.createdAt) return 1;
                        if (!b.createdAt) return -1;

                        // Convert to milliseconds if it's a Firebase timestamp
                        const aTime = a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
                        const bTime = b.createdAt.toMillis ? b.createdAt.toMillis() : 0;

                        // Sort descending (newest first)
                        return bTime - aTime;
                    });
                }
            } else {
                // If no category is selected, fetch products from all categories
                // First, get all categories for this supplier
                const categoriesRef = collection(db, 'supplier_category');
                const categoriesQuery = query(categoriesRef, where("supplierId", "==", userId));
                const categoriesSnapshot = await getDocs(categoriesQuery);

                // Fetch products from each category in parallel
                const productsPromises = categoriesSnapshot.docs.map(async (categoryDoc) => {
                    const categoryId = categoryDoc.id;
                    const categoryName = categoryDoc.data().name;
                    const categoryProductsRef = collection(db, 'supplier_category', categoryId, 'products');

                    const productsQuery = query(
                        categoryProductsRef,
                        where("supplierId", "==", userId)
                    );

                    const productsSnapshot = await getDocs(productsQuery);
                    return productsSnapshot.docs.map(doc => ({
                        id: doc.id,
                        categoryId: categoryId,
                        categoryName: categoryName,
                        ...doc.data()
                    }));
                });

                // Wait for all queries to complete and combine results
                const productsArrays = await Promise.all(productsPromises);
                productsList = productsArrays.flat();

                // Sort products by createdAt (newest first)
                productsList.sort((a, b) => {
                    // Handle missing createdAt fields
                    if (!a.createdAt) return 1;
                    if (!b.createdAt) return -1;

                    // Convert to milliseconds if it's a Firebase timestamp
                    const aTime = a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
                    const bTime = b.createdAt.toMillis ? b.createdAt.toMillis() : 0;

                    // Sort descending (newest first)
                    return bTime - aTime;
                });
            }

            // Ensure all products have valid data to prevent rendering errors
            productsList = productsList.map(product => ({
                ...product,
                name: product.name || "Unnamed Product",
                price: typeof product.price === 'number' ? product.price : 0,
                quantity: typeof product.quantity === 'number' ? product.quantity : 0,
                unit: product.unit || "unit",
                isActive: typeof product.isActive === 'boolean' ? product.isActive : true,
                description: product.description || "",
                createdAt: product.createdAt || { seconds: Date.now() / 1000 }
            }));

            setProducts(productsList);
            setFilteredProducts(productsList);
            setLoading(false);
            setRefreshing(false);
        } catch (error) {
            console.error("Error fetching products:", error);
            setProducts([]);
            setFilteredProducts([]);
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Toggle product active status
    const toggleProductStatus = async (product) => {
        try {
            // Update in subcollection if we have a selected category
            if (selectedCategory) {
                const subProductRef = doc(db, 'supplier_category', selectedCategory, 'products', product.id);
                await updateDoc(subProductRef, {
                    isActive: !product.isActive,
                    updatedAt: serverTimestamp()
                });
            } else if (product.categoryId) {
                // If no selected category but product has categoryId
                const subProductRef = doc(db, 'supplier_category', product.categoryId, 'products', product.id);
                await updateDoc(subProductRef, {
                    isActive: !product.isActive,
                    updatedAt: serverTimestamp()
                });
            } else {
                throw new Error("Cannot find product's category");
            }

            // Update local state
            const updatedProducts = products.map(p =>
                p.id === product.id ? { ...p, isActive: !p.isActive } : p
            );
            setProducts(updatedProducts);
            setFilteredProducts(updatedProducts.filter(product =>
                product.name.toLowerCase().includes(searchQuery.toLowerCase())
            ));

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            console.error("Error toggling product status:", error);
            Alert.alert("Error", "Failed to update product status. Please try again.");
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    // Delete product
    const handleDeleteProduct = (product) => {
        Alert.alert(
            "Delete Product",
            `Are you sure you want to delete ${product.name}?`,
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            // Delete from subcollection
                            if (selectedCategory) {
                                const subProductRef = doc(db, 'supplier_category', selectedCategory, 'products', product.id);
                                await deleteDoc(subProductRef);

                                // Update category product count
                                const categoryRef = doc(db, 'supplier_category', selectedCategory);
                                await updateDoc(categoryRef, {
                                    productCount: increment(-1)
                                });
                            }

                            // Remove product from state
                            const updatedProducts = products.filter(p => p.id !== product.id);
                            setProducts(updatedProducts);
                            setFilteredProducts(updatedProducts.filter(product =>
                                product.name.toLowerCase().includes(searchQuery.toLowerCase())
                            ));

                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (error) {
                            console.error("Error deleting product:", error);
                            Alert.alert("Error", "Failed to delete product. Please try again.");
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                        }
                    }
                }
            ]
        );
    };

    // Edit product
    const handleEditProduct = (product) => {
        const categoryId = selectedCategory || product.categoryId;
        const categoryName = selectedCategoryName || product.categoryName;

        if (!categoryId) {
            Alert.alert("Error", "Category information is missing for this product");
            return;
        }

        router.push({
            pathname: `/suplier/editProduct`,
            params: {
                productId: product.id,
                categoryId: categoryId,
                categoryName: categoryName
            }
        });
    };

    // Go to add product page
    const goToAddProduct = () => {
        router.push({
            pathname: `/suplier/addProduct`,
            params: { categoryId: selectedCategory, categoryName: selectedCategoryName }
        });
    };

    // Go back to categories
    const goBack = () => {
        router.back();
    };

    // Pull to refresh handler
    const onRefresh = () => {
        setRefreshing(true);
        fetchProducts();
    };

    // Handle category selection
    const handleCategorySelect = (category) => {
        // Show loading indicator immediately
        setLoading(true);

        if (category) {
            setSelectedCategory(category.id);
            setSelectedCategoryName(category.name);
        } else {
            setSelectedCategory(null);
            setSelectedCategoryName("All Products");
        }

        // Clear existing products while we wait for the new ones
        setProducts([]);
        setFilteredProducts([]);
        setShowCategoryFilter(false);
    };

    // Handle view product details
    const handleViewProductDetails = (product) => {
        // Ensure the product has valid data to prevent errors in the modal
        const validatedProduct = {
            ...product,
            name: product.name || "Unnamed Product",
            price: typeof product.price === 'number' ? product.price : 0,
            quantity: typeof product.quantity === 'number' ? product.quantity : 0,
            unit: product.unit || "unit",
            isActive: typeof product.isActive === 'boolean' ? product.isActive : true,
            description: product.description || "",
            createdAt: product.createdAt || { seconds: Date.now() / 1000 }
        };

        setSelectedProduct(validatedProduct);
        setProductDetailVisible(true);
    };

    // Render product card
    const renderProductCard = ({ item, index }) => (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => handleViewProductDetails(item)}
        >
            <Animated.View
                entering={FadeInDown.delay(index * 100).duration(400)}
                style={[styles.productCard, !item.isActive && styles.inactiveCard]}
            >
                <View style={styles.productCardInner}>
                    <View style={styles.productImageContainer}>
                        <View style={styles.productImageWrapper}>
                            {item.imageUrl ? (
                                <Image
                                    source={{ uri: item.imageUrl }}
                                    style={styles.productImage}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View style={styles.noImageContainer}>
                                    <MaterialCommunityIcons name="image-off" size={28} color="#d1d5db" />
                                </View>
                            )}
                            {!item.isActive && (
                                <View style={styles.inactiveOverlay}>
                                    <Text style={styles.inactiveText}>Inactive</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <View style={styles.productDetails}>
                        <View style={styles.productHeader}>
                            <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                        </View>

                        {item.description ? (
                            <Text style={styles.productDescription} numberOfLines={2}>
                                {item.description}
                            </Text>
                        ) : null}

                        <View style={styles.productInfoRow}>
                            <View style={styles.priceContainer}>
                                <Text style={styles.productPrice}>{item.price ? item.price.toFixed(2) : "0.00"} Birr</Text>
                                <Text style={styles.productQuantity}>
                                    per {item.unit || "unit"}
                                </Text>
                            </View>

                            <View style={styles.stockContainer}>
                                <View style={[styles.stockIndicator, (item.quantity && item.quantity > 10) ? styles.inStockIndicator : styles.lowStockIndicator]} />
                                <Text style={[styles.stockText, (item.quantity && item.quantity > 10) ? styles.inStockText : styles.lowStockText]}>
                                    {(item.quantity && item.quantity > 10) ? 'In Stock' : `Limited (${item.quantity || 0})`}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.actionsContainer}>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.toggleButton]}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    toggleProductStatus(item);
                                }}
                            >
                                <Feather
                                    name={item.isActive ? "eye-off" : "eye"}
                                    size={16}
                                    color="#4b5563"
                                />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, styles.editButton]}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    handleEditProduct(item);
                                }}
                            >
                                <FontAwesome name="pencil" size={16} color="#4b5563" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.actionButton, styles.deleteButton]}
                                onPress={(e) => {
                                    e.stopPropagation();
                                    handleDeleteProduct(item);
                                }}
                            >
                                <FontAwesome name="trash" size={16} color="#4b5563" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Animated.View>
        </TouchableOpacity>
    );

    // Render category item for dropdown
    const renderCategoryItem = ({ item }) => (
        <TouchableOpacity
            style={styles.categoryItem}
            onPress={() => handleCategorySelect(item)}
        >
            <Text style={styles.categoryItemText}>{item.name}</Text>
            {item.id === selectedCategory && (
                <AntDesign name="check" size={18} color="#3b82f6" />
            )}
        </TouchableOpacity>
    );

    return (
        <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
            <StatusBar style="light" />

            {/* HomeHeader */}
            <HomeHeader title={selectedCategoryName || "Products"} />

            {/* Search Bar and Filter */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Feather name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search products..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#9ca3af"
                    />
                    {searchQuery ? (
                        <TouchableOpacity onPress={() => setSearchQuery("")}>
                            <Feather name="x" size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    ) : null}
                </View>

                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setShowCategoryFilter(true)}
                >
                    <Feather
                        name="filter"
                        size={20}
                        color={selectedCategory ? "#4F46E5" : "#6b7280"}
                    />
                    {selectedCategory && (
                        <View style={styles.filterActiveDot} />
                    )}
                </TouchableOpacity>
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                    <Text style={styles.loadingText}>Loading products...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredProducts}
                    renderItem={renderProductCard}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.productsList}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="package-variant" size={80} color="#d1d5db" />
                            <Text style={styles.emptyText}>
                                {searchQuery ? "No products match your search" : "No products in this category"}
                            </Text>
                            <Text style={styles.emptySubText}>
                                {searchQuery ? "Try a different search term or filter" : "Tap the + button to add your first product"}
                            </Text>

                            {!searchQuery && (
                                <TouchableOpacity
                                    style={styles.addFirstButton}
                                    onPress={goToAddProduct}
                                >
                                    <Text style={styles.addFirstButtonText}>Add Product</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    }
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                />
            )}

            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.floatingActionButton}
                onPress={() => {
                    goToAddProduct();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
            >
                <AntDesign name="plus" size={24} color="#ffffff" />
            </TouchableOpacity>

            {/* Category Filter Modal */}
            <Modal
                visible={showCategoryFilter}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowCategoryFilter(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filter by Category</Text>
                            <TouchableOpacity
                                onPress={() => setShowCategoryFilter(false)}
                                style={styles.closeButton}
                            >
                                <AntDesign name="close" size={20} color="#4b5563" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.categoryItem, selectedCategory === null && styles.activeFilterOption]}
                            onPress={() => handleCategorySelect(null)}
                        >
                            <Text style={[styles.categoryItemText, selectedCategory === null && styles.activeFilterText]}>All Products</Text>
                            {selectedCategory === null && (
                                <AntDesign name="check" size={18} color="#4F46E5" />
                            )}
                        </TouchableOpacity>

                        <FlatList
                            data={categories}
                            renderItem={renderCategoryItem}
                            keyExtractor={(item) => item.id}
                            contentContainerStyle={styles.categoriesList}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <Text style={styles.emptyListText}>No categories found</Text>
                            }
                        />
                    </View>
                </View>
            </Modal>

            {/* Product Detail Modal */}
            {selectedProduct && (
                <Modal
                    visible={productDetailVisible}
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setProductDetailVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.productDetailModal}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Product Details</Text>
                                <TouchableOpacity
                                    onPress={() => setProductDetailVisible(false)}
                                    style={styles.closeButton}
                                >
                                    <AntDesign name="close" size={20} color="#4b5563" />
                                </TouchableOpacity>
                            </View>

                            <ScrollView style={styles.productDetailContent}>
                                {selectedProduct.imageUrl ? (
                                    <Image
                                        source={{ uri: selectedProduct.imageUrl }}
                                        style={styles.productDetailImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={styles.productDetailNoImage}>
                                        <MaterialCommunityIcons name="image-off" size={60} color="#d1d5db" />
                                    </View>
                                )}

                                <View style={styles.productDetailSection}>
                                    <Text style={styles.productDetailName}>{selectedProduct.name}</Text>

                                    <View style={styles.statusBadge}>
                                        <View style={[
                                            styles.statusIndicator,
                                            selectedProduct.isActive
                                                ? styles.activeIndicator
                                                : styles.inactiveIndicator
                                        ]} />
                                        <Text style={[
                                            styles.statusText,
                                            selectedProduct.isActive
                                                ? styles.activeText
                                                : styles.inactiveText2
                                        ]}>
                                            {selectedProduct.isActive ? 'Active' : 'Inactive'}
                                        </Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Price:</Text>
                                        <Text style={styles.detailValue}>{selectedProduct.price ? selectedProduct.price.toFixed(2) : "0.00"} Birr</Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Unit Type:</Text>
                                        <Text style={styles.detailValue}>{selectedProduct.unit || "unit"}</Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Quantity in Stock:</Text>
                                        <Text style={[
                                            styles.detailValue,
                                            (selectedProduct.quantity && selectedProduct.quantity <= 10) ? styles.lowStockValue : null
                                        ]}>
                                            {selectedProduct.quantity || 0} {selectedProduct.unit || "unit"}
                                        </Text>
                                    </View>

                                    {(selectedProduct.category || selectedProduct.categoryName) && (
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Category:</Text>
                                            <Text style={styles.detailValue}>{selectedProduct.category || selectedProduct.categoryName}</Text>
                                        </View>
                                    )}

                                    {selectedProduct.createdAt && (
                                        <View style={styles.detailRow}>
                                            <Text style={styles.detailLabel}>Added On:</Text>
                                            <Text style={styles.detailValue}>
                                                {new Date(
                                                    selectedProduct.createdAt.seconds * 1000
                                                ).toLocaleDateString()}
                                            </Text>
                                        </View>
                                    )}
                                </View>

                                {selectedProduct.description && (
                                    <View style={styles.productDetailSection}>
                                        <Text style={styles.sectionTitle}>Description</Text>
                                        <Text style={styles.productDetailDescription}>
                                            {selectedProduct.description}
                                        </Text>
                                    </View>
                                )}
                            </ScrollView>

                            <View style={styles.productDetailActions}>
                                <TouchableOpacity
                                    style={styles.detailActionButton}
                                    onPress={() => {
                                        setProductDetailVisible(false);
                                        handleEditProduct(selectedProduct);
                                    }}
                                >
                                    <FontAwesome name="pencil" size={18} color="white" style={{ marginRight: 8 }} />
                                    <Text style={styles.detailActionText}>Edit Product</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.detailActionButton, styles.deleteActionButton]}
                                    onPress={() => {
                                        setProductDetailVisible(false);
                                        handleDeleteProduct(selectedProduct);
                                    }}
                                >
                                    <FontAwesome name="trash" size={18} color="white" style={{ marginRight: 8 }} />
                                    <Text style={styles.detailActionText}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#f9fafb",
    },
    header: {
        backgroundColor: "white",
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 10,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
        flex: 1,
        textAlign: "center",
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
    },
    addButton: {
        backgroundColor: "#3b82f6",
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#3b82f6",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    searchInputContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 8,
        paddingHorizontal: 12,
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#374151',
        height: '100%',
    },
    filterButton: {
        marginLeft: 12,
        height: 44,
        width: 44,
        borderRadius: 8,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    filterActiveDot: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4F46E5',
    },
    activeFilterOption: {
        backgroundColor: '#eff6ff',
    },
    activeFilterText: {
        color: '#4F46E5',
        fontWeight: '500',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    productsList: {
        padding: 16,
        paddingBottom: 80,
    },
    productCard: {
        backgroundColor: "white",
        borderRadius: 16,
        marginBottom: 16,
        overflow: "hidden",
        paddingLeft: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    inactiveCard: {
        opacity: 0.7,
    },
    productCardInner: {
        flexDirection: "row",
        alignItems: "center",
    },
    productDetails: {
        flex: 1,
        padding: 14,
        justifyContent: "space-between",
    },
    productHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    productName: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        flex: 1,
        marginRight: 8,
    },
    productDescription: {
        fontSize: 14,
        color: "#6b7280",
        marginBottom: 6,
        lineHeight: 20,
    },
    productInfoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 8,
        marginBottom: 8,
    },
    priceContainer: {
        flexDirection: "column",
    },
    productPrice: {
        fontSize: 18,
        fontWeight: "700",
        color: "#3b82f6",
    },
    productQuantity: {
        fontSize: 12,
        color: "#6b7280",
        marginTop: 2,
    },
    stockContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f3f4f6",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    stockIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    inStockIndicator: {
        backgroundColor: "#10b981",
    },
    lowStockIndicator: {
        backgroundColor: "#f59e0b",
    },
    stockText: {
        fontSize: 12,
        fontWeight: "500",
    },
    inStockText: {
        color: "#10b981",
    },
    lowStockText: {
        color: "#f59e0b",
    },
    actionsContainer: {
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: "#f3f4f6",
    },
    actionButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 8,
    },
    toggleButton: {
        backgroundColor: "#f3f4f6",
    },
    editButton: {
        backgroundColor: "#f3f4f6",
    },
    deleteButton: {
        backgroundColor: "#fee2e2",
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: "500",
        color: "#6b7280",
        marginTop: 16,
    },
    emptySubText: {
        fontSize: 14,
        color: "#9ca3af",
        textAlign: "center",
        marginTop: 8,
        marginBottom: 24,
        maxWidth: "80%",
    },
    addFirstButton: {
        backgroundColor: "#3b82f6",
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    addFirstButtonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        backgroundColor: "white",
        borderRadius: 12,
        width: "80%",
        maxHeight: "70%",
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: "#f3f4f6",
        justifyContent: "center",
        alignItems: "center",
    },
    categoriesList: {
        paddingBottom: 16,
    },
    categoryItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    categoryItemText: {
        fontSize: 16,
        color: "#374151",
    },
    emptyListText: {
        textAlign: "center",
        color: "#9ca3af",
        paddingVertical: 16,
    },
    productDetailModal: {
        backgroundColor: "white",
        borderRadius: 16,
        width: "90%",
        maxHeight: "80%",
        overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    productDetailContent: {
        padding: 16,
    },
    productDetailImage: {
        width: "100%",
        height: 200,
        borderRadius: 8,
        marginBottom: 16,
    },
    productDetailNoImage: {
        width: "100%",
        height: 200,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f3f4f6",
    },
    productDetailSection: {
        marginBottom: 16,
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2.22,
        elevation: 1,
    },
    productDetailName: {
        fontSize: 20,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 12,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#f3f4f6",
        padding: 8,
        borderRadius: 8,
        marginBottom: 12,
        alignSelf: "flex-start",
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    activeIndicator: {
        backgroundColor: "#10b981",
    },
    inactiveIndicator: {
        backgroundColor: "#ef4444",
    },
    statusText: {
        fontSize: 12,
        fontWeight: "600",
    },
    activeText: {
        color: "#10b981",
    },
    inactiveText2: {
        color: "#ef4444",
    },
    detailRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: "500",
        color: "#6b7280",
    },
    detailValue: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
    },
    lowStockValue: {
        color: "#f59e0b",
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111827",
        marginBottom: 8,
    },
    productDetailDescription: {
        fontSize: 14,
        color: "#6b7280",
        lineHeight: 20,
    },
    productDetailActions: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: "#e5e7eb",
    },
    detailActionButton: {
        backgroundColor: "#3b82f6",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 12,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 4,
    },
    deleteActionButton: {
        backgroundColor: "#ef4444",
    },
    detailActionText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
    productImageContainer: {
        width: 110,
        height: 140,
        marginRight: 12,
        paddingLeft: 8,
        borderTopLeftRadius: 16,
        borderBottomLeftRadius: 16,
        overflow: "hidden",
        backgroundColor: "#f3f4f6",
    },
    productImageWrapper: {
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
    },
    productImage: {
        width: "100%",
        height: "100%",
    },
    noImageContainer: {
        width: "100%",
        height: "100%",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#f3f4f6",
    },
    inactiveOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    inactiveText: {
        color: "white",
        fontSize: 12,
        fontWeight: "600",
        backgroundColor: "#ef4444",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    loadingText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#6b7280",
        marginTop: 16,
    },
    floatingActionButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#4F46E5',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        zIndex: 999,
    },
}); 