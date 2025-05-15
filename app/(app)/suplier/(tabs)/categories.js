import React, { useState, useEffect } from "react";
import {
    Text,
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Modal,
    ActivityIndicator,
    FlatList,
    Alert,
    Dimensions,
    RefreshControl,
    Image
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
    Ionicons,
    MaterialCommunityIcons,
    AntDesign,
    FontAwesome,
    Feather
} from '@expo/vector-icons';
import Animated, {
    FadeInDown,
    FadeIn
} from 'react-native-reanimated';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from 'expo-haptics';
import { db, auth } from "../../../../firebase/firebaseConfig";
import {
    collection,
    addDoc,
    getDocs,
    deleteDoc,
    doc,
    query,
    where,
    serverTimestamp,
    updateDoc,
    orderBy,
    writeBatch
} from "firebase/firestore";
import HomeHeader from "../../../components/HomeHeader";
import { StatusBar } from "expo-status-bar";

const { width, height } = Dimensions.get("window");

export default function Categories() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const { mode } = params;

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [activeFilter, setActiveFilter] = useState("all");

    // Form fields for edit modal
    const [categoryName, setCategoryName] = useState("");
    const [categoryDescription, setCategoryDescription] = useState("");
    const [formError, setFormError] = useState("");

    // Reference to supplier_category collection
    const supplierCategoriesRef = collection(db, 'supplier_category');

    // Fetch categories on load
    useEffect(() => {
        fetchCategories();
    }, []);

    // If mode is addProduct, redirect to add product when categories are loaded
    useEffect(() => {
        if (mode === "addProduct" && categories.length > 0 && !loading) {
            // If there are categories, navigate to the first one
            goToAddProduct(categories[0]);
        }
    }, [mode, categories, loading]);

    // Update filtered categories when search query changes
    useEffect(() => {
        if (categories.length > 0) {
            const filtered = categories.filter(category =>
                category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
            );
            setFilteredCategories(filtered);
        }
    }, [searchQuery, categories]);

    // Fetch categories created by the current supplier
    const fetchCategories = async () => {
        try {
            setLoading(true);
            const userId = auth.currentUser?.uid;

            if (!userId) {
                console.error("No authenticated user found");
                setLoading(false);
                return;
            }

            // Try first with the compound query, which requires an index
            try {
                const q = query(
                    supplierCategoriesRef,
                    where("supplierId", "==", userId),
                    orderBy("createdAt", "desc")
                );

                const querySnapshot = await getDocs(q);
                const categoriesList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setCategories(categoriesList);
            } catch (indexError) {
                console.log("Index error, falling back to simpler query:", indexError.message);

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

                // Sort manually in memory
                categoriesList.sort((a, b) => {
                    // Handle missing createdAt fields
                    if (!a.createdAt) return 1;
                    if (!b.createdAt) return -1;

                    // Convert to milliseconds if it's a Firebase timestamp
                    const aTime = a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
                    const bTime = b.createdAt.toMillis ? b.createdAt.toMillis() : 0;

                    // Sort descending (newest first)
                    return bTime - aTime;
                });

                setCategories(categoriesList);
            }

            setLoading(false);
            setRefreshing(false);

            // Check if we need to automatically open add category page
            if (mode === "addProduct" && categories.length === 0) {
                router.push("/suplier/addCategory");
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Handle edit category (open modal with selected category data)
    const handleEditPress = (category) => {
        router.push({
            pathname: "/suplier/addCategory",
            params: {
                editMode: "true",
                categoryId: category.id,
                name: category.name,
                description: category.description,
                imageUrl: category.imageUrl,
                isActive: category.isActive ? "true" : "false",
                productCount: category.productCount
            }
        });
    };

    // Show category detail modal
    const showCategoryDetail = (category) => {
        setSelectedCategory(category);
        setDetailModalVisible(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    // Delete category
    const handleDeleteCategory = (categoryId) => {
        Alert.alert(
            "Delete Category",
            "Are you sure you want to delete this category? This will also delete all products in this category.",
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
                            // First get all products in this category subcollection
                            const productsRef = collection(db, 'supplier_category', categoryId, 'products');
                            const productsSnapshot = await getDocs(productsRef);

                            // Batch deletion for better performance and atomicity
                            const batch = writeBatch(db);

                            // Delete all products in the subcollection
                            productsSnapshot.docs.forEach(productDoc => {
                                batch.delete(doc(db, 'supplier_category', categoryId, 'products', productDoc.id));

                                // Also delete from main products collection if productId exists
                                if (productDoc.data().productId) {
                                    batch.delete(doc(db, 'supplier_products', productDoc.data().productId));
                                }
                            });

                            // Delete the category itself
                            batch.delete(doc(db, 'supplier_category', categoryId));

                            // Commit the batch
                            await batch.commit();

                            // Close the modal if it was open
                            if (detailModalVisible) {
                                setDetailModalVisible(false);
                            }

                            fetchCategories();
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        } catch (error) {
                            console.error("Error deleting category:", error);
                            Alert.alert("Error", "Failed to delete category. Please try again.");
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                        }
                    }
                }
            ]
        );
    };

    // Pull to refresh handler
    const onRefresh = () => {
        setRefreshing(true);
        fetchCategories();
    };

    // Go to products page for a specific category
    const goToProducts = (category) => {
        router.push({
            pathname: `/suplier/viewProducts`,
            params: { categoryId: category.id, categoryName: category.name }
        });
    };

    // Go to add product for a specific category
    const goToAddProduct = (category) => {
        router.push({
            pathname: `/suplier/addProduct`,
            params: { categoryId: category.id, categoryName: category.name }
        });
    };

    // Handle filter selection
    const handleFilterChange = (filter) => {
        setActiveFilter(filter);
        setFilterModalVisible(false);

        let filtered = [...categories];

        if (filter === "active") {
            filtered = filtered.filter(category => category.isActive);
        } else if (filter === "inactive") {
            filtered = filtered.filter(category => !category.isActive);
        } else if (filter === "withProducts") {
            filtered = filtered.filter(category => category.productCount > 0);
        } else if (filter === "noProducts") {
            filtered = filtered.filter(category => !category.productCount || category.productCount === 0);
        }

        // Apply search query filter too
        if (searchQuery) {
            filtered = filtered.filter(category =>
                category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (category.description && category.description.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        setFilteredCategories(filtered);
    };

    // Render category card
    const renderCategoryCard = ({ item, index }) => (
        <TouchableOpacity
            onPress={() => showCategoryDetail(item)}
            activeOpacity={0.7}
        >
            <Animated.View
                entering={FadeInDown.delay(index * 100).duration(400)}
                style={styles.categoryCard}
            >
                <View style={styles.categoryHeader}>
                    <View style={styles.categoryNameContainer}>
                        <Text style={styles.categoryName}>{item.name}</Text>
                        {item.productCount > 0 && (
                            <View style={styles.productCountBadge}>
                                <Text style={styles.productCountText}>{item.productCount}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.editButton]}
                            onPress={(e) => {
                                e.stopPropagation();
                                handleEditPress(item);
                            }}
                        >
                            <FontAwesome name="pencil" size={14} color="#4b5563" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionButton, styles.deleteButton]}
                            onPress={(e) => {
                                e.stopPropagation();
                                handleDeleteCategory(item.id);
                            }}
                        >
                            <FontAwesome name="trash" size={14} color="#4b5563" />
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={styles.categoryCardContent}>
                    {item.imageUrl && (
                        <Image
                            source={{ uri: item.imageUrl }}
                            style={styles.categoryImage}
                            resizeMode="cover"
                        />
                    )}

                    <View style={styles.categoryInfo}>
                        {item.description ? (
                            <Text style={styles.categoryDescription}>{item.description}</Text>
                        ) : null}

                        <View style={styles.statusBadge}>
                            <Text style={[
                                styles.statusText,
                                item.isActive ? styles.activeStatus : styles.inactiveStatus
                            ]}>
                                {item.isActive ? 'Active' : 'Inactive'}
                            </Text>
                        </View>

                        <View style={styles.categoryMetaData}>
                            <View style={styles.categoryMetaItem}>
                                <MaterialCommunityIcons name="database" size={14} color="#6b7280" />
                                <Text style={styles.categoryMetaText}>
                                    Products stored as subcollection
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.viewProductsButton}
                            onPress={(e) => {
                                e.stopPropagation();
                                goToProducts(item);
                            }}
                        >
                            <Text style={styles.viewProductsText}>View Products</Text>
                            <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
                        </TouchableOpacity>
                    </View>
                </View>
            </Animated.View>
        </TouchableOpacity>
    );

    // Category Detail Modal
    const CategoryDetailModal = () => {
        if (!selectedCategory) return null;

        return (
            <Modal
                visible={detailModalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setDetailModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Category Details</Text>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setDetailModalVisible(false)}
                            >
                                <AntDesign name="close" size={24} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            contentContainerStyle={styles.modalContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {selectedCategory.imageUrl && (
                                <Image
                                    source={{ uri: selectedCategory.imageUrl }}
                                    style={styles.modalImage}
                                    resizeMode="cover"
                                />
                            )}

                            <View style={styles.detailSection}>
                                <Text style={styles.detailLabel}>Name:</Text>
                                <Text style={styles.detailValue}>{selectedCategory.name}</Text>
                            </View>

                            {selectedCategory.description && (
                                <View style={styles.detailSectionColumn}>
                                    <Text style={styles.detailLabel}>Description:</Text>
                                    <Text style={styles.detailValueColumn}>{selectedCategory.description}</Text>
                                </View>
                            )}

                            <View style={styles.detailSection}>
                                <Text style={styles.detailLabel}>Status:</Text>
                                <View style={[
                                    styles.statusIndicator,
                                    selectedCategory.isActive ? styles.statusIndicatorActive : styles.statusIndicatorInactive
                                ]}>
                                    <Text style={[
                                        styles.statusIndicatorText,
                                        selectedCategory.isActive ? styles.statusTextActive : styles.statusTextInactive
                                    ]}>
                                        {selectedCategory.isActive ? 'Active' : 'Inactive'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.detailSection}>
                                <Text style={styles.detailLabel}>Product Count:</Text>
                                <Text style={styles.detailValue}>{selectedCategory.productCount || 0} products</Text>
                            </View>

                            <View style={styles.modalActionButtons}>
                                <TouchableOpacity
                                    style={styles.modalActionButton}
                                    onPress={() => {
                                        setDetailModalVisible(false);
                                        handleEditPress(selectedCategory);
                                    }}
                                >
                                    <FontAwesome name="pencil" size={16} color="white" style={styles.modalActionIcon} />
                                    <Text style={styles.modalActionText}>Edit Category</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.modalActionButton, styles.modalDeleteButton]}
                                    onPress={() => {
                                        handleDeleteCategory(selectedCategory.id);
                                    }}
                                >
                                    <FontAwesome name="trash" size={16} color="white" style={styles.modalActionIcon} />
                                    <Text style={styles.modalActionText}>Delete</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity
                                style={styles.viewProductsButtonModal}
                                onPress={() => {
                                    setDetailModalVisible(false);
                                    goToProducts(selectedCategory);
                                }}
                            >
                                <MaterialCommunityIcons name="package-variant" size={18} color="white" style={styles.modalActionIcon} />
                                <Text style={styles.viewProductsButtonText}>View Products</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        );
    };

    // Filter Modal Component
    const FilterModal = () => (
        <Modal
            visible={filterModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setFilterModalVisible(false)}
        >
            <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setFilterModalVisible(false)}
            >
                <View style={styles.filterModalContainer}>
                    <Text style={styles.filterModalTitle}>Filter Categories</Text>

                    <TouchableOpacity
                        style={[styles.filterOption, activeFilter === "all" && styles.activeFilterOption]}
                        onPress={() => handleFilterChange("all")}
                    >
                        <Text style={[styles.filterOptionText, activeFilter === "all" && styles.activeFilterText]}>All Categories</Text>
                        {activeFilter === "all" && <Ionicons name="checkmark" size={18} color="#4F46E5" />}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.filterOption, activeFilter === "active" && styles.activeFilterOption]}
                        onPress={() => handleFilterChange("active")}
                    >
                        <Text style={[styles.filterOptionText, activeFilter === "active" && styles.activeFilterText]}>Active Only</Text>
                        {activeFilter === "active" && <Ionicons name="checkmark" size={18} color="#4F46E5" />}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.filterOption, activeFilter === "inactive" && styles.activeFilterOption]}
                        onPress={() => handleFilterChange("inactive")}
                    >
                        <Text style={[styles.filterOptionText, activeFilter === "inactive" && styles.activeFilterText]}>Inactive Only</Text>
                        {activeFilter === "inactive" && <Ionicons name="checkmark" size={18} color="#4F46E5" />}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.filterOption, activeFilter === "withProducts" && styles.activeFilterOption]}
                        onPress={() => handleFilterChange("withProducts")}
                    >
                        <Text style={[styles.filterOptionText, activeFilter === "withProducts" && styles.activeFilterText]}>With Products</Text>
                        {activeFilter === "withProducts" && <Ionicons name="checkmark" size={18} color="#4F46E5" />}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.filterOption, activeFilter === "noProducts" && styles.activeFilterOption]}
                        onPress={() => handleFilterChange("noProducts")}
                    >
                        <Text style={[styles.filterOptionText, activeFilter === "noProducts" && styles.activeFilterText]}>No Products</Text>
                        {activeFilter === "noProducts" && <Ionicons name="checkmark" size={18} color="#4F46E5" />}
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );

    return (
        <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
            <StatusBar style="light" />

            {/* HomeHeader */}
            <HomeHeader title="Product Categories" />

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Feather name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search categories..."
                        placeholderTextColor="#9ca3af"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery ? (
                        <TouchableOpacity onPress={() => setSearchQuery("")}>
                            <Feather name="x" size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    ) : null}
                </View>

                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setFilterModalVisible(true)}
                >
                    <Feather
                        name="filter"
                        size={20}
                        color={activeFilter !== "all" ? "#4F46E5" : "#6b7280"}
                    />
                    {activeFilter !== "all" && (
                        <View style={styles.filterActiveDot} />
                    )}
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                    <Text style={styles.loadingText}>Loading categories...</Text>
                </View>
            ) : (
                <>
                    <FlatList
                        data={searchQuery.length > 0 || activeFilter !== "all" ? filteredCategories : categories}
                        renderItem={renderCategoryCard}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.categoriesList}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                {searchQuery.length > 0 ? (
                                    <>
                                        <Feather name="search" size={80} color="#d1d5db" />
                                        <Text style={styles.emptyText}>No matching categories</Text>
                                        <Text style={styles.emptySubText}>
                                            Try a different search term or clear filters
                                        </Text>
                                    </>
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="folder-open-outline" size={80} color="#d1d5db" />
                                        <Text style={styles.emptyText}>No categories yet</Text>
                                        <Text style={styles.emptySubText}>
                                            Tap the + button to add your first product category
                                        </Text>
                                    </>
                                )}
                            </View>
                        }
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                        }
                    />

                    {/* Floating Action Button */}
                    <TouchableOpacity
                        style={styles.floatingActionButton}
                        onPress={() => {
                            router.push("/suplier/addCategory");
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                    >
                        <AntDesign name="plus" size={24} color="#ffffff" />
                    </TouchableOpacity>
                </>
            )}

            {/* Category Detail Modal */}
            <CategoryDetailModal />

            {/* Filter Modal */}
            <FilterModal />
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
        zIndex: 10,
    },
    headerContent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "#111827",
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
    categoriesList: {
        padding: 16,
        paddingBottom: 100,
    },
    categoryCard: {
        backgroundColor: "white",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    categoryHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    categoryNameContainer: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    categoryName: {
        fontSize: 18,
        fontWeight: "600",
        color: "#111827",
    },
    productCountBadge: {
        backgroundColor: "#e0e7ff",
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 12,
        marginLeft: 8,
    },
    productCountText: {
        fontSize: 12,
        fontWeight: "500",
        color: "#4f46e5",
    },
    categoryCardContent: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    categoryImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
    },
    categoryInfo: {
        flex: 1,
    },
    categoryDescription: {
        fontSize: 14,
        color: "#4b5563",
        marginBottom: 12,
    },
    statusBadge: {
        alignSelf: "flex-start",
        marginBottom: 8,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "500",
    },
    activeStatus: {
        color: "#10b981",
    },
    inactiveStatus: {
        color: "#ef4444",
    },
    viewProductsButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 6,
        justifyContent: "flex-end",
    },
    viewProductsText: {
        fontSize: 14,
        fontWeight: "500",
        color: "#3b82f6",
        marginRight: 4,
    },
    actionButtons: {
        flexDirection: "row",
    },
    actionButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: "center",
        alignItems: "center",
        marginLeft: 8,
        backgroundColor: "#f3f4f6",
    },
    editButton: {
        backgroundColor: "#f3f4f6",
    },
    deleteButton: {
        backgroundColor: "#fee2e2",
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
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
        maxWidth: "80%",
    },
    categoryMetaData: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 8,
        marginTop: 4,
        backgroundColor: "#f3f4f6",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        alignSelf: "flex-start",
    },
    categoryMetaItem: {
        flexDirection: "row",
        alignItems: "center",
    },
    categoryMetaText: {
        fontSize: 11,
        color: "#6b7280",
        marginLeft: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        width: width * 0.85,
        maxHeight: height * 0.8,
        overflow: 'hidden',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    closeButton: {
        padding: 5,
    },
    modalContent: {
        padding: 20,
    },
    modalImage: {
        width: '100%',
        height: 180,
        borderRadius: 12,
        marginBottom: 20,
    },
    detailSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        width: '100%',
    },
    detailSectionColumn: {
        flexDirection: 'column',
        alignItems: 'flex-start',
        marginBottom: 16,
        width: '100%',
    },
    detailLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#374151',
    },
    detailValue: {
        fontSize: 15,
        color: '#111827',
    },
    detailValueColumn: {
        fontSize: 15,
        color: '#111827',
        marginTop: 6,
    },
    statusIndicator: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: '#e5e7eb',
    },
    statusIndicatorActive: {
        backgroundColor: '#d1fae5',
    },
    statusIndicatorInactive: {
        backgroundColor: '#fee2e2',
    },
    statusIndicatorText: {
        fontSize: 14,
        fontWeight: '500',
    },
    modalActionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        marginBottom: 20,
        width: '100%',
    },
    modalActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        backgroundColor: '#3b82f6',
        borderRadius: 8,
        flex: 1,
        marginRight: 10,
    },
    modalDeleteButton: {
        backgroundColor: '#ef4444',
        marginRight: 0,
        marginLeft: 10,
    },
    modalActionIcon: {
        marginRight: 8,
    },
    modalActionText: {
        fontSize: 14,
        fontWeight: '600',
        color: 'white',
    },
    viewProductsButtonModal: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        backgroundColor: '#10b981',
        borderRadius: 8,
        width: '100%',
    },
    viewProductsButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
        marginLeft: 8,
    },
    statusTextActive: {
        color: "#10b981",
    },
    statusTextInactive: {
        color: "#ef4444",
    },
    headerTitleContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    addButton: {
        backgroundColor: "#3b82f6",
        padding: 10,
        borderRadius: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#ffffff",
        marginLeft: 8,
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
    filterModalContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        width: '80%',
        alignSelf: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    filterModalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 16,
        textAlign: 'center',
    },
    filterOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    activeFilterOption: {
        backgroundColor: '#eff6ff',
    },
    filterOptionText: {
        fontSize: 16,
        color: '#374151',
    },
    activeFilterText: {
        color: '#4F46E5',
        fontWeight: '500',
    },
}); 