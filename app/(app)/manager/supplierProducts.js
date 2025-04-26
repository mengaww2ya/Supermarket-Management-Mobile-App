import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  StatusBar,
  ScrollView,
  Dimensions,
  RefreshControl,
  Modal
} from "react-native";
import { Feather, Ionicons, MaterialIcons, AntDesign } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { db } from "../../../firebase/firebaseConfig";
import { collection, getDocs, getDoc, doc, query, where, orderBy } from "firebase/firestore";
import Animated, { FadeIn } from "react-native-reanimated";
import HomeHeader from "../../components/HomeHeader";

const { width, height } = Dimensions.get("window");

export default function SupplierProducts() {
  const params = useLocalSearchParams();
  const supplierId = params.id;
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // State variables
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [supplier, setSupplier] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [error, setError] = useState(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedCategoryName, setSelectedCategoryName] = useState(null);

  // Initial data loading
  useEffect(() => {
    fetchData();
  }, [supplierId]);

  // Handle search and category filtering
  useEffect(() => {
    if (products.length > 0) {
      filterProducts();
    }
  }, [searchQuery, selectedCategory, products]);

  // Main data fetching function
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!supplierId) {
        setError("Supplier ID is missing");
        setLoading(false);
        return;
      }

      // Fetch supplier details
      await fetchSupplier();
      
      // Fetch categories
      const categoriesData = await fetchCategories();
      
      // Fetch products from all categories
      if (categoriesData.length > 0) {
        await fetchAllProducts(categoriesData);
      }
      
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch supplier details
  const fetchSupplier = async () => {
    try {
      const supplierDoc = await getDoc(doc(db, "users", supplierId));
      
      if (supplierDoc.exists()) {
        setSupplier({
          id: supplierDoc.id,
          ...supplierDoc.data()
        });
      } else {
        setError("Supplier not found");
      }
    } catch (err) {
      console.error("Error fetching supplier:", err);
      throw err;
    }
  };

  // Fetch supplier categories
  const fetchCategories = async () => {
    try {
      const supplierCategoriesRef = collection(db, "supplier_category");
      let q;
      
      try {
        q = query(supplierCategoriesRef, orderBy("name", "asc"));
        const querySnapshot = await getDocs(q);
        const categoriesList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setCategories(categoriesList);
        return categoriesList;
      } catch (error) {
        // Fallback to simple query if ordering fails (missing index)
        console.log("Ordered query failed, using simple query");
        const simpleSnapshot = await getDocs(supplierCategoriesRef);
        const categoriesList = simpleSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setCategories(categoriesList);
        return categoriesList;
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
      throw err;
    }
  };

  // Fetch products from all categories
  const fetchAllProducts = async (categoriesList) => {
    try {
      let allProducts = [];

      // Fetch products from each category in parallel
      const productsPromises = categoriesList.map(async (category) => {
        const categoryId = category.id;
        const categoryProductsRef = collection(db, "supplier_category", categoryId, "products");

        try {
          const productsSnapshot = await getDocs(categoryProductsRef);
          
          // Filter products by supplier ID
          return productsSnapshot.docs
            .filter(doc => {
              const data = doc.data();
              return data.supplierId === supplierId && !data._placeholder;
            })
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
    } catch (err) {
      console.error("Error fetching products:", err);
      throw err;
    }
  };

  // Filter products based on search query and selected category
  const filterProducts = () => {
    let filtered = [...products];

    // Filter by category if selected
    if (selectedCategory) {
      filtered = filtered.filter(product => product.categoryId === selectedCategory);
    }

    // Filter by search query if provided
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(product =>
        (product.name?.toLowerCase() || "").includes(query) ||
        (product.description?.toLowerCase() || "").includes(query)
      );
    }

    setFilteredProducts(filtered);
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  // Toggle category selection
  const handleCategoryPress = (categoryId, categoryName) => {
    if (categoryId === selectedCategory) {
      setSelectedCategory(null);
      setSelectedCategoryName(null);
    } else {
      setSelectedCategory(categoryId);
      setSelectedCategoryName(categoryName);
    }
    setFilterModalVisible(false);
  };

  // Clear search query
  const handleClearSearch = () => {
    setSearchQuery("");
  };

  // Clear filters
  const handleClearFilters = () => {
    setSelectedCategory(null);
    setSelectedCategoryName(null);
    setSearchQuery("");
  };

  // Render product item
  const renderProductItem = ({ item }) => (
    <TouchableOpacity
      style={{
        backgroundColor: "white",
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2.84,
        elevation: 2,
        padding: 12,
        margin: 8,
        overflow: "hidden",
        width: width * 0.42,
      }}
      onPress={() => {
        // Navigate to product details if needed
        // router.push(`/stockManager/ProductDetails?id=${item.id}`);
      }}
    >
      <View 
        style={{ 
          width: "100%", 
          height: 120, 
          marginBottom: 8, 
          backgroundColor: "#F9FAFB", 
          borderRadius: 12, 
          overflow: "hidden" 
        }}
      >
        <Image
          source={{ uri: item.imageUrl || "https://via.placeholder.com/100" }}
          style={{ width: "100%", height: "100%", resizeMode: "contain" }}
        />
      </View>
      
      <Text 
        style={{ 
          fontSize: 16, 
          fontWeight: "bold", 
          color: "#1F2937",
          marginBottom: 4
        }} 
        numberOfLines={1}
      >
        {item.name || "Unnamed Product"}
      </Text>
      
      <Text 
        style={{ 
          fontSize: 12, 
          color: "#6B7280",
          marginBottom: 4
        }} 
        numberOfLines={1}
      >
        {item.categoryName || "Uncategorized"}
      </Text>
      
      <View 
        style={{ 
          flexDirection: "row", 
          alignItems: "center", 
          justifyContent: "space-between", 
          marginTop: 4 
        }}
      >
        <Text style={{ color: "#10B981", fontWeight: "bold" }}>
          {item.price ? `${item.price} Birr` : "No price"}
        </Text>
        
        <Text style={{ fontSize: 12, color: "#6B7280" }}>
          {`${item.unit || "unit"}`}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Get supplier name or fallback
  const getSupplierName = () => {
    if (!supplier) return "Supplier";
    
    return supplier.companyName || 
           `${supplier.firstName || ""} ${supplier.lastName || ""}`.trim() || 
           "Supplier";
  };

  // Render filter modal
  const renderFilterModal = () => {
    return (
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity 
          style={{ 
            flex: 1, 
            backgroundColor: 'rgba(0,0,0,0.5)'
          }}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
        >
          <View style={{ 
            position: 'absolute', 
            top: 120, 
            right: 20,
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
            maxWidth: width * 0.7,
            maxHeight: height * 0.7
          }}>
            <View style={{
              borderBottomWidth: 1,
              borderBottomColor: "#E5E7EB",
              paddingBottom: 6,
              marginBottom: 6
            }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '700', 
                color: '#1F2937',
                paddingHorizontal: 4
              }}>
                Filter Products
              </Text>
            </View>
            
            <ScrollView style={{ maxHeight: height * 0.5 }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 12
                }}
                onPress={() => handleCategoryPress(null, null)}
              >
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#F3F4F6',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12
                }}>
                  <Feather 
                    name="grid" 
                    size={14} 
                    color="#6B7280" 
                  />
                </View>
                <Text style={{ 
                  fontWeight: '500',
                  fontSize: 15,
                  color: selectedCategory === null ? '#4F46E5' : '#1F2937' 
                }}>
                  All Categories
                </Text>
                {selectedCategory === null && (
                  <MaterialIcons 
                    name="check" 
                    size={20} 
                    color="#4F46E5" 
                    style={{ marginLeft: 'auto' }} 
                  />
                )}
              </TouchableOpacity>
              
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 12
                  }}
                  onPress={() => handleCategoryPress(category.id, category.name)}
                >
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: '#EEF2FF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12
                  }}>
                    <Feather 
                      name="tag" 
                      size={14} 
                      color="#4F46E5" 
                    />
                  </View>
                  <Text style={{ 
                    fontWeight: '500',
                    fontSize: 15,
                    color: selectedCategory === category.id ? '#4F46E5' : '#1F2937'
                  }}>
                    {category.name}
                  </Text>
                  {selectedCategory === category.id && (
                    <MaterialIcons 
                      name="check" 
                      size={20} 
                      color="#4F46E5" 
                      style={{ marginLeft: 'auto' }} 
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <SafeAreaView 
      style={{ 
        flex: 1, 
        backgroundColor: "#F9FAFB",
        paddingTop: insets.top
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      {/* Replace header with HomeHeader */}
      <HomeHeader 
        title={`${getSupplierName()} Products`} 
        showBackButton 
      />
      
      {/* Search Bar and Filter Button */}
      <View style={{ padding: 16, paddingTop: 8, paddingBottom: 8 }}>
        <View 
          style={{ 
            flexDirection: "row", 
            alignItems: "center",
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "white",
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 1,
              marginRight: 8
            }}
          >
            <Feather name="search" size={20} color="#9CA3AF" />
            
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search products..."
              placeholderTextColor="#9CA3AF"
              style={{ 
                flex: 1, 
                marginLeft: 8, 
                fontSize: 16,
                color: "#1F2937"
              }}
            />
            
            {searchQuery ? (
              <TouchableOpacity onPress={handleClearSearch}>
                <Feather name="x" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View>
          
          {/* Filter Button */}
          <TouchableOpacity
            style={{
              width: 44,
              height: 44,
              backgroundColor: selectedCategory ? "#4F46E5" : "white",
              borderRadius: 12,
              justifyContent: "center",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
              elevation: 1,
            }}
            onPress={() => setFilterModalVisible(true)}
          >
            <Feather 
              name="filter" 
              size={20} 
              color={selectedCategory ? "white" : "#6B7280"} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Active Filters */}
        {selectedCategory && (
          <View 
            style={{ 
              flexDirection: "row", 
              alignItems: "center", 
              marginTop: 8,
              flexWrap: "wrap"
            }}
          >
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#EEF2FF",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 16,
                marginRight: 8,
                marginBottom: 4
              }}
              onPress={() => handleCategoryPress(null, null)}
            >
              <Text style={{ color: "#4F46E5", fontSize: 13, marginRight: 4 }}>
                {selectedCategoryName || "Category"}
              </Text>
              <Feather name="x" size={14} color="#4F46E5" />
            </TouchableOpacity>
            
            {(selectedCategory || searchQuery) && (
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 8,
                  paddingVertical: 4
                }}
                onPress={handleClearFilters}
              >
                <Text style={{ color: "#6B7280", fontSize: 13 }}>
                  Clear all
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
      
      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={{ marginTop: 12, color: "#6B7280" }}>Loading products...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 16 }}>
          <MaterialIcons name="error-outline" size={64} color="#EF4444" />
          <Text style={{ marginTop: 16, fontSize: 18, fontWeight: "600", color: "#EF4444" }}>
            Error
          </Text>
          <Text style={{ marginTop: 8, color: "#6B7280", textAlign: "center" }}>
            {error}
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 24,
              backgroundColor: "#4F46E5",
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 8,
            }}
            onPress={fetchData}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Products Grid */}
          {filteredProducts.length > 0 ? (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => `${item.categoryId}-${item.id}`}
              renderItem={renderProductItem}
              numColumns={2}
              columnWrapperStyle={{ justifyContent: "space-between", paddingHorizontal: 8 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={["#4F46E5"]}
                  tintColor="#4F46E5"
                />
              }
            />
          ) : (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 16 }}>
              <Feather name="box" size={64} color="#D1D5DB" />
              <Text style={{ marginTop: 16, fontSize: 18, fontWeight: "600", color: "#4B5563" }}>
                No products found
              </Text>
              <Text style={{ marginTop: 8, color: "#6B7280", textAlign: "center" }}>
                {searchQuery || selectedCategory 
                  ? "Try adjusting your search or category filter" 
                  : "This supplier has no products available"}
              </Text>
              {(searchQuery || selectedCategory) && (
                <TouchableOpacity
                  style={{
                    marginTop: 24,
                    backgroundColor: "#4F46E5",
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 8,
                  }}
                  onPress={handleClearFilters}
                >
                  <Text style={{ color: "white", fontWeight: "600" }}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}
      
      {/* Filter Categories Modal */}
      {renderFilterModal()}
    </SafeAreaView>
  );
} 