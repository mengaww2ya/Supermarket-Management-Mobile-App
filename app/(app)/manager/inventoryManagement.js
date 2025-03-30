import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  Image,
  ActivityIndicator,
  Animated,
  TextInput,
  RefreshControl,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from 'expo-haptics';
import HomeHeader from "../../components/HomeHeader";
import { db } from "../../../firebase/firebaseConfig";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";

// Product card component
const ProductCard = ({ item, index, onPress, fadeAnim }) => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 80,
        useNativeDriver: true
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 80,
        useNativeDriver: true
      })
    ]).start();
  }, [index]);

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      friction: 5,
      tension: 100,
      useNativeDriver: true
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true
    }).start();
  };

  const getStockLevelColor = (quantity) => {
    if (quantity <= 10) return "#EF4444"; // Low stock - red
    if (quantity <= 50) return "#F59E0B"; // Medium stock - amber
    return "#10B981"; // Good stock - green
  };

  const getStockLevelBgColor = (quantity) => {
    if (quantity <= 10) return "#FEE2E2"; // Low stock - light red
    if (quantity <= 50) return "#FEF3C7"; // Medium stock - light amber
    return "#ECFDF5"; // Good stock - light green
  };

  const formatPrice = (price) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  // Check if product is expiring soon (within 7 days)
  const isExpiringSoon = () => {
    if (!item.expirationDate) return false;
    const expirationDate = new Date(item.expirationDate);
    const today = new Date();
    const daysDifference = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
    return daysDifference > 0 && daysDifference <= 7;
  };

  // Generate style for the shake animation when expiring soon
  const rotateInterpolation = rotateAnim.interpolate({
    inputRange: [0, 1, 2, 3, 4],
    outputRange: ['0deg', '-1deg', '0deg', '1deg', '0deg']
  });

  // Start shake animation for expiring products
  useEffect(() => {
    if (isExpiringSoon()) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 4,
            duration: 800,
            useNativeDriver: true,
            easing: Easing.linear
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true
          })
        ]),
        { iterations: 1 }
      ).start();
    }
  }, [item.expirationDate]);

  return (
    <Animated.View 
      className="mb-4"
      style={{
        opacity: fadeAnim,
        transform: [
          { scale: scaleAnim },
          { translateY: translateYAnim },
          { rotate: isExpiringSoon() ? rotateInterpolation : '0deg' }
        ]
      }}
    >
      <TouchableOpacity 
        className="bg-white rounded-xl shadow-sm overflow-hidden"
        style={{ 
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
          borderLeftWidth: isExpiringSoon() ? 3 : 0,
          borderLeftColor: isExpiringSoon() ? "#EF4444" : "transparent"
        }}
        onPress={() => onPress(item)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View className="flex-row p-4">
          <View className="mr-3">
            {item.image ? (
              <Image 
                source={{ uri: item.image }} 
                className="w-16 h-16 rounded-lg"
                style={{ backgroundColor: "#F3F4F6" }}
              />
            ) : (
              <View 
                className="w-16 h-16 rounded-lg justify-center items-center"
                style={{ backgroundColor: "#F3F4F6" }}
              >
                <MaterialCommunityIcons 
                  name="package-variant-closed" 
                  size={28} 
                  color="#9CA3AF" 
                />
              </View>
            )}
            
            {item.bestSeller && (
              <View className="absolute top-0 left-0 bg-yellow-500 rounded-tr-lg rounded-bl-lg px-1">
                <Text className="text-white text-xs font-bold">Best Seller</Text>
              </View>
            )}
          </View>
          
          <View className="flex-1 justify-center">
            <Text className="text-lg font-bold text-gray-800">
              {item.productName}
            </Text>
            <Text className="text-gray-500">
              {item.brand} • {item.categoryName}
            </Text>
            <View className="flex-row items-center mt-1">
              <Text className="font-medium text-gray-900">
                {formatPrice(item.price)}
              </Text>
              {item.discountPrice && item.discountPrice !== item.price && (
                <Text className="ml-2 text-gray-500 line-through">
                  {formatPrice(item.discountPrice)}
                </Text>
              )}
              
              {item.discountPrice && item.discountPrice !== item.price && (
                <View className="ml-2 bg-red-100 rounded-full px-2">
                  <Text className="text-red-600 text-xs font-medium">
                    {Math.round((1 - (item.discountPrice / item.price)) * 100)}% off
                  </Text>
                </View>
              )}
            </View>
          </View>
          
          <View>
            <View 
              className="px-3 py-1 rounded-full self-center mb-2"
              style={{ backgroundColor: getStockLevelBgColor(item.stockQuantity) }}
            >
              <Text 
                className="font-medium text-xs"
                style={{ color: getStockLevelColor(item.stockQuantity) }}
              >
                {item.stockQuantity} in stock
              </Text>
            </View>
            {item.expirationDate && (
              <Text className={`text-xs ${isExpiringSoon() ? 'text-red-500 font-bold' : 'text-gray-500'} text-right`}>
                Exp: {new Date(item.expirationDate).toLocaleDateString()}
                {isExpiringSoon() && ' ⚠️'}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function InventoryManagement() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStockLevel, setFilterStockLevel] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc"); // Default sort by name ascending
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Categories extracted from products for filtering
  const [categories, setCategories] = useState([]);

  // Fetch products from Firebase
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "Products"));
      const querySnapshot = await getDocs(q);
      const productList = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        productList.push({
          id: doc.id,
          productName: data.productName || "",
          description: data.description || "",
          price: data.price || 0,
          discountPrice: data.discountPrice || null,
          stockQuantity: data.stockQuantity || 0,
          unitType: data.unitType || "",
          brand: data.brand || "",
          supplier: data.supplier || "",
          categoryName: data.categoryName || "Other",
          categoryId: data.categoryId || 0,
          image: data.image || null,
          status: data.status || "Active",
          expirationDate: data.expirationDate || null,
          productionDate: data.productionDate || null,
          ratings: data.ratings || 0,
          numberOfReviews: data.numberOfReviews || 0,
          bestSeller: data.bestSeller || false,
        });
      });

      // Extract unique categories for filter, excluding "Uncategorized"
      const uniqueCategories = [...new Set(productList
        .map(product => product.categoryName)
        .filter(category => category !== "Uncategorized")
      )];
      
      setCategories(uniqueCategories);
      setProducts(productList);
      setFilteredProducts(productList);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Animation effect
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, []);

  // Function to check if a product is expiring soon (within 7 days)
  const isExpiringSoon = (product) => {
    if (!product.expirationDate) return false;
    const expirationDate = new Date(product.expirationDate);
    const today = new Date();
    const daysDifference = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
    return daysDifference > 0 && daysDifference <= 7;
  };

  // Handle search and filtering
  useEffect(() => {
    let results = products;
    
    // Apply category filter
    if (filterCategory !== "all") {
      results = results.filter(product => product.categoryName === filterCategory);
    }
    
    // Apply stock level filter
    if (filterStockLevel === "low") {
      results = results.filter(product => product.stockQuantity <= 10);
    } else if (filterStockLevel === "medium") {
      results = results.filter(product => product.stockQuantity > 10 && product.stockQuantity <= 50);
    } else if (filterStockLevel === "high") {
      results = results.filter(product => product.stockQuantity > 50);
    } else if (filterStockLevel === "expire-soon") {
      results = results.filter(product => isExpiringSoon(product));
    }
    
    // Apply search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        product => 
          product.productName.toLowerCase().includes(query) || 
          product.brand.toLowerCase().includes(query) ||
          product.categoryName.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    if (sortBy === "name-asc") {
      results = [...results].sort((a, b) => a.productName.localeCompare(b.productName));
    } else if (sortBy === "name-desc") {
      results = [...results].sort((a, b) => b.productName.localeCompare(a.productName));
    } else if (sortBy === "price-asc") {
      results = [...results].sort((a, b) => a.price - b.price);
    } else if (sortBy === "price-desc") {
      results = [...results].sort((a, b) => b.price - a.price);
    } else if (sortBy === "stock-asc") {
      results = [...results].sort((a, b) => a.stockQuantity - b.stockQuantity);
    } else if (sortBy === "stock-desc") {
      results = [...results].sort((a, b) => b.stockQuantity - a.stockQuantity);
    } else if (sortBy === "expiration") {
      results = [...results].sort((a, b) => {
        // Products without expiration date go to the end
        if (!a.expirationDate) return 1;
        if (!b.expirationDate) return -1;
        return new Date(a.expirationDate) - new Date(b.expirationDate);
      });
    }
    
    setFilteredProducts(results);
  }, [searchQuery, filterCategory, filterStockLevel, sortBy, products]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const updateProductStock = async (productId, newQuantity) => {
    try {
      await updateDoc(doc(db, "Products", productId), {
        stockQuantity: newQuantity,
        lastUpdated: new Date()
      });

      // Update local state
      setProducts(prev => 
        prev.map(product => 
          product.id === productId ? {...product, stockQuantity: newQuantity} : product
        )
      );

      // If the selected product is the one being updated, update the selected product
      if (selectedProduct && selectedProduct.id === productId) {
        setSelectedProduct(prev => ({...prev, stockQuantity: newQuantity}));
      }

      return true;
    } catch (error) {
      console.error("Error updating product stock:", error);
      return false;
    }
  };

  const handleProductPress = (product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProduct(product);
    setModalVisible(true);
  };

  const handleEditProduct = (product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Navigate to edit product page
    router.push({
      pathname: "/stockManager/editProduct",
      params: { productId: product.id }
    });
    setModalVisible(false);
  };

  const formatPrice = (price) => {
    if (!price) return "$0.00";
    return `$${parseFloat(price).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  const EmptyListComponent = () => (
    <View className="flex-1 justify-center items-center py-10">
      <MaterialCommunityIcons 
        name="package-variant-closed" 
        size={60} 
        color="#D1D5DB" 
      />
      <Text className="text-gray-400 text-lg mt-4 mb-1">No products found</Text>
      <Text className="text-gray-400 text-center px-10">
        {searchQuery.trim() !== "" || filterCategory !== "all" || filterStockLevel !== "all"
          ? "Try changing your search or filters" 
          : "Add products to get started"}
      </Text>
    </View>
  );

  const renderProductDetails = () => {
    if (!selectedProduct) return null;
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <LinearGradient
            colors={["#ffffff", "#f3f4f6"]}
            className="rounded-t-3xl p-5 pb-8"
            style={{ 
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: 0.1,
              shadowRadius: 5,
              elevation: 5
            }}
          >
            {/* Header with close button */}
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-xl font-bold text-gray-800">
                Product Details
              </Text>
              <TouchableOpacity 
                className="w-9 h-9 rounded-full bg-gray-100 justify-center items-center"
                onPress={() => setModalVisible(false)}
              >
                <MaterialIcons name="close" size={22} color="#4B5563" />
              </TouchableOpacity>
            </View>
            
            {/* Product info */}
            <View className="flex-row mb-6">
              <View className="mr-4">
                {selectedProduct.image ? (
                  <Image 
                    source={{ uri: selectedProduct.image }} 
                    className="w-24 h-24 rounded-xl"
                    style={{ backgroundColor: "#F3F4F6" }}
                  />
                ) : (
                  <View 
                    className="w-24 h-24 rounded-xl justify-center items-center"
                    style={{ backgroundColor: "#F3F4F6" }}
                  >
                    <MaterialCommunityIcons 
                      name="package-variant-closed" 
                      size={40} 
                      color="#9CA3AF" 
                    />
                  </View>
                )}
              </View>
              
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-800">
                  {selectedProduct.productName}
                </Text>
                
                <View className="flex-row items-center mt-1">
                  <Text className="text-gray-600">
                    {selectedProduct.brand} • {selectedProduct.categoryName}
                  </Text>
                </View>
                
                <View className="flex-row items-center mt-2">
                  <Text className="text-lg font-bold text-gray-900">
                    {formatPrice(selectedProduct.price)}
                  </Text>
                  {selectedProduct.discountPrice && selectedProduct.discountPrice !== selectedProduct.price && (
                    <Text className="ml-2 text-gray-500 line-through">
                      {formatPrice(selectedProduct.discountPrice)}
                    </Text>
                  )}
                </View>
                
                <View className="flex-row mt-2">
                  <View 
                    className="px-3 py-1 rounded-full"
                    style={{ 
                      backgroundColor: 
                        selectedProduct.stockQuantity <= 10 ? "#FEE2E2" : 
                        selectedProduct.stockQuantity <= 50 ? "#FEF3C7" : 
                        "#ECFDF5" 
                    }}
                  >
                    <Text 
                      className="font-medium text-xs"
                      style={{ 
                        color: 
                          selectedProduct.stockQuantity <= 10 ? "#EF4444" : 
                          selectedProduct.stockQuantity <= 50 ? "#F59E0B" : 
                          "#10B981" 
                      }}
                    >
                      {selectedProduct.stockQuantity} in stock
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            
            {/* Product details section */}
            <ScrollView className="max-h-[300px] mb-6">
              <View className="bg-white p-4 rounded-xl shadow-sm mb-4">
                <Text className="text-lg font-semibold text-gray-800 mb-2">
                  Description
                </Text>
                <Text className="text-gray-600">
                  {selectedProduct.description || "No description available."}
                </Text>
              </View>
              
              <View className="bg-white p-4 rounded-xl shadow-sm mb-4">
                <Text className="text-lg font-semibold text-gray-800 mb-2">
                  Details
                </Text>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-500">SKU/ID:</Text>
                  <Text className="text-gray-700 font-medium">{selectedProduct.id.substring(0, 8)}</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-500">Unit:</Text>
                  <Text className="text-gray-700 font-medium">{selectedProduct.unitType || "N/A"}</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-500">Supplier:</Text>
                  <Text className="text-gray-700 font-medium">{selectedProduct.supplier || "N/A"}</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-500">Status:</Text>
                  <Text className="text-gray-700 font-medium">{selectedProduct.status || "N/A"}</Text>
                </View>
              </View>
              
              <View className="bg-white p-4 rounded-xl shadow-sm">
                <Text className="text-lg font-semibold text-gray-800 mb-2">
                  Dates
                </Text>
                <View className="flex-row justify-between mb-2">
                  <Text className="text-gray-500">Production Date:</Text>
                  <Text className="text-gray-700 font-medium">{formatDate(selectedProduct.productionDate)}</Text>
                </View>
                <View className="flex-row justify-between">
                  <Text className="text-gray-500">Expiration Date:</Text>
                  <Text className={`font-medium ${new Date(selectedProduct.expirationDate) < new Date() ? 'text-red-500' : 'text-gray-700'}`}>
                    {formatDate(selectedProduct.expirationDate)}
                  </Text>
                </View>
              </View>
            </ScrollView>
            
            {/* Action buttons */}
            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 bg-indigo-600 py-3 rounded-xl flex-row justify-center items-center"
                onPress={() => handleEditProduct(selectedProduct)}
              >
                <MaterialIcons name="edit" size={20} color="white" />
                <Text className="text-white font-bold text-base ml-2">
                  Edit Product
                </Text>
              </TouchableOpacity>
              
              <View className="flex-row flex-1 bg-gray-100 rounded-xl overflow-hidden">
                <TouchableOpacity
                  className="flex-1 py-3 flex-row justify-center items-center bg-red-500"
                  onPress={() => {
                    if (selectedProduct.stockQuantity > 0) {
                      updateProductStock(selectedProduct.id, selectedProduct.stockQuantity - 1);
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    }
                  }}
                  disabled={selectedProduct.stockQuantity <= 0}
                >
                  <MaterialIcons name="remove" size={20} color="white" />
                </TouchableOpacity>
                
                <View className="flex-1 py-3 justify-center items-center">
                  <Text className="text-gray-800 font-bold">
                    {selectedProduct.stockQuantity}
                  </Text>
                </View>
                
                <TouchableOpacity
                  className="flex-1 py-3 flex-row justify-center items-center bg-green-500"
                  onPress={() => {
                    updateProductStock(selectedProduct.id, selectedProduct.stockQuantity + 1);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }}
                >
                  <MaterialIcons name="add" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <HomeHeader title="Inventory Management" />
      
      {/* Search and filter section */}
      <View className="px-4 pt-2 pb-4">
        <View className="flex-row items-center bg-white rounded-lg shadow-sm px-3 mb-4">
          <MaterialIcons name="search" size={22} color="#9CA3AF" />
          <TextInput
            className="flex-1 py-2 px-2 text-gray-800"
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialIcons name="clear" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Sort by options */}
        <View className="mb-3">
          <Text className="text-gray-700 font-medium mb-2 pl-1">Sort By</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            {[
              { id: "name-asc", label: "Name (A-Z)", icon: "sort-alphabetical-ascending" },
              { id: "name-desc", label: "Name (Z-A)", icon: "sort-alphabetical-descending" },
              { id: "price-asc", label: "Price (Low-High)", icon: "sort-numeric-ascending" },
              { id: "price-desc", label: "Price (High-Low)", icon: "sort-numeric-descending" },
              { id: "stock-asc", label: "Stock (Low-High)", icon: "sort-numeric-ascending" },
              { id: "stock-desc", label: "Stock (High-Low)", icon: "sort-numeric-descending" },
              { id: "expiration", label: "Expiration Date", icon: "calendar-clock" },
            ].map((option) => (
              <TouchableOpacity
                key={option.id}
                className={`px-4 py-2 rounded-full mr-2 flex-row items-center ${
                  sortBy === option.id 
                    ? "bg-indigo-600" 
                    : "bg-white border border-gray-200"
                }`}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSortBy(option.id);
                }}
              >
                <MaterialCommunityIcons 
                  name={option.icon} 
                  size={16} 
                  color={sortBy === option.id ? "white" : "#6B7280"} 
                />
                <Text
                  className={`font-medium ml-1 ${
                    sortBy === option.id ? "text-white" : "text-gray-700"
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Category filters */}
        <View className="mb-3">
          <Text className="text-gray-700 font-medium mb-2 pl-1">Categories</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            <TouchableOpacity
              key="all-categories"
              className={`px-4 py-2 rounded-full mr-2 ${
                filterCategory === "all" 
                  ? "bg-blue-500" 
                  : "bg-white border border-gray-200"
              }`}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilterCategory("all");
              }}
            >
              <Text
                className={`font-medium ${
                  filterCategory === "all" ? "text-white" : "text-gray-700"
                }`}
              >
                All Categories
              </Text>
            </TouchableOpacity>
            
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                className={`px-4 py-2 rounded-full mr-2 ${
                  filterCategory === category 
                    ? "bg-blue-500" 
                    : "bg-white border border-gray-200"
                }`}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFilterCategory(category);
                }}
              >
                <Text
                  className={`font-medium ${
                    filterCategory === category ? "text-white" : "text-gray-700"
                  }`}
                >
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Stock level filters */}
        <View className="mb-2">
          <Text className="text-gray-700 font-medium mb-2 pl-1">Stock Levels</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            {[
              { id: "all", label: "All Levels", color: "#4B5563" },
              { id: "low", label: "Low Stock (≤10)", color: "#EF4444" },
              { id: "medium", label: "Medium Stock (≤50)", color: "#F59E0B" },
              { id: "high", label: "Well Stocked (>50)", color: "#10B981" },
              { id: "expire-soon", label: "Expire Soon (7 days)", color: "#EF4444" }
            ].map((level) => (
              <TouchableOpacity
                key={level.id}
                className={`px-4 py-2 rounded-full mr-2 flex-row items-center ${
                  filterStockLevel === level.id 
                    ? level.id === "all" ? "bg-blue-500" : `bg-white border border-gray-200`
                    : "bg-white border border-gray-200"
                }`}
                style={{
                  borderColor: filterStockLevel === level.id && level.id !== "all" ? level.color : undefined,
                }}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFilterStockLevel(level.id);
                }}
              >
                {level.id === "expire-soon" && (
                  <MaterialIcons 
                    name="warning" 
                    size={16} 
                    color={filterStockLevel === level.id ? level.color : "#6B7280"} 
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text
                  className={`font-medium`}
                  style={{ 
                    color: filterStockLevel === level.id 
                      ? level.id === "all" ? "white" : level.color
                      : "#4B5563" 
                  }}
                >
                  {level.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
      
      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="mt-4 text-gray-500">Loading inventory...</Text>
        </View>
      ) : (
        <View className="flex-1">
          <View className="flex-row justify-between px-4 mb-2">
            <Text className="text-gray-500">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'} found
            </Text>
            <TouchableOpacity 
              className="flex-row items-center"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.push("/stockManager/addProduct");
              }}
            >
              <MaterialIcons name="add-circle" size={18} color="#3B82F6" />
              <Text className="ml-1 text-blue-500 font-medium">Add Product</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <ProductCard 
                item={item} 
                index={index} 
                onPress={handleProductPress}
                fadeAnim={fadeAnim}
              />
            )}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={["#4F46E5"]}
                tintColor="#4F46E5"
              />
            }
            ListEmptyComponent={EmptyListComponent}
          />
        </View>
      )}
      
      {renderProductDetails()}
    </View>
  );
}
