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
  Easing,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons, MaterialIcons, FontAwesome5, Feather } from "@expo/vector-icons";
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

  // Format price to Birr
  const formatPrice = (price) => {
    return `$${parseFloat(price).toFixed(2)}`;
  };

  // Check if product is expiring soon (within 7 days)
  const isExpiringSoon = () => {
    if (!item || !item.expirationDate) return false;
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

  // Safely format brand and category display
  const getBrandCategoryText = () => {
    const brand = item.brand || "";
    const category = item.categoryName || "";
    
    if (brand && category) {
      return `${brand} • ${category}`;
    } else if (brand) {
      return brand;
    } else if (category) {
      return category;
    }
    return "";
  };

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
              {item.productName || "Unnamed Product"}
            </Text>
            <Text className="text-gray-500">
              {getBrandCategoryText()}
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
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStockLevel, setFilterStockLevel] = useState("all");
  const [sortBy, setSortBy] = useState("name-asc"); // Default sort by name ascending
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const filterModalAnim = useRef(new Animated.Value(0)).current;

  // Categories extracted from products for filtering
  const [categories, setCategories] = useState([]);

  // Format price function for displaying currency in Birr
  const formatPrice = (price) => {
    if (!price) return "0.00 Birr";
    return `${parseFloat(price).toFixed(2)} Birr`;
  };

  // Function to check if a product is expiring soon (within 7 days)
  const isExpiringSoon = (product) => {
    if (!product || !product.expirationDate) return false;
    const expirationDate = new Date(product.expirationDate);
    const today = new Date();
    const daysDifference = Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24));
    return daysDifference > 0 && daysDifference <= 7;
  };

  // Fetch categories from Categories collection
  const fetchCategories = async () => {
    try {
      // First try to fetch from AddCategory collection like in ProductList.js
      let categorySnapshot = await getDocs(collection(db, "AddCategory"));
      let categoryList = [];
      
      if (!categorySnapshot.empty) {
        categoryList = categorySnapshot.docs.map(doc => ({
          id: doc.id,
          categoryName: doc.data().categoryName
        }));
      } else {
        // Fallback to Categories collection if AddCategory is empty
        categorySnapshot = await getDocs(collection(db, "Categories"));
        categoryList = categorySnapshot.docs.map(doc => ({
          id: doc.id,
          categoryName: doc.data().categoryName
        }));
      }
      
      setCategories(categoryList);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  // Fetch products with categoryName lookup
  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Query products collection
      const q = query(collection(db, "Products"));
      const querySnapshot = await getDocs(q);
      
      const productList = [];
      
      querySnapshot.forEach((doc) => {
        const productData = { id: doc.id, ...doc.data() };
        productList.push(productData);
      });
      
      setProducts(productList);
      setFilteredProducts(productList);
      
      // Start animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Apply filters and sorting whenever products or filter criteria change
  useEffect(() => {
    if (products.length > 0) {
      let result = [...products];
      
      // Filter by search query
      if (searchQuery.trim() !== "") {
        result = result.filter((product) => 
          product.productName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.brand && product.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (product.categoryName && product.categoryName.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }
      
      // Filter by category
      if (filterCategory !== "all") {
        result = result.filter((product) => 
          product.categoryId === filterCategory || 
          (product.categoryName && product.categoryName === filterCategory)
        );
      }
      
      // Filter by stock level
      if (filterStockLevel !== "all") {
        switch (filterStockLevel) {
          case "low":
            result = result.filter((product) => product.stockQuantity <= 10);
            break;
          case "medium":
            result = result.filter((product) => product.stockQuantity > 10 && product.stockQuantity <= 50);
            break;
          case "high":
            result = result.filter((product) => product.stockQuantity > 50);
            break;
          case "expire-soon":
            result = result.filter((product) => isExpiringSoon(product));
            break;
        }
    }
    
    // Apply sorting
      switch (sortBy) {
        case "name-asc":
          result.sort((a, b) => a.productName?.localeCompare(b.productName || ""));
          break;
        case "name-desc":
          result.sort((a, b) => b.productName?.localeCompare(a.productName || ""));
          break;
        case "price-asc":
          result.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
          break;
        case "price-desc":
          result.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
          break;
        case "stock-asc":
          result.sort((a, b) => (a.stockQuantity || 0) - (b.stockQuantity || 0));
          break;
        case "stock-desc":
          result.sort((a, b) => (b.stockQuantity || 0) - (a.stockQuantity || 0));
          break;
        case "expiration":
          result.sort((a, b) => {
        // Products without expiration date go to the end
        if (!a.expirationDate) return 1;
        if (!b.expirationDate) return -1;
        return new Date(a.expirationDate) - new Date(b.expirationDate);
      });
          break;
    }
    
      setFilteredProducts(result);
    }
  }, [products, searchQuery, filterCategory, filterStockLevel, sortBy]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleProductPress = (product) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProduct(product);
    setModalVisible(true);
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
    
    const getStockLevelColor = (quantity) => {
      if (quantity <= 10) return "#EF4444"; // Low stock - red
      if (quantity <= 50) return "#F59E0B"; // Medium stock - amber
      return "#10B981"; // Good stock - green
    };
    
    const getStockLevelText = (quantity) => {
      if (quantity <= 10) return "Low Stock";
      if (quantity <= 50) return "Medium Stock";
      return "Good Stock";
    };
    
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="bg-white w-[90%] max-h-[80%] rounded-xl p-5 shadow-xl">
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Header with close button */}
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-gray-800">Product Details</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close-circle" size={24} color="#4B5563" />
              </TouchableOpacity>
            </View>
            
              {/* Product image */}
              <View className="items-center mb-4">
                {selectedProduct.image ? (
                  <Image 
                    source={{ uri: selectedProduct.image }} 
                    className="w-32 h-32 rounded-lg"
                    style={{ backgroundColor: "#F3F4F6" }}
                  />
                ) : (
                  <View 
                    className="w-32 h-32 rounded-lg justify-center items-center"
                    style={{ backgroundColor: "#F3F4F6" }}
                  >
                    <MaterialCommunityIcons 
                      name="package-variant-closed" 
                      size={48} 
                      color="#9CA3AF" 
                    />
                  </View>
                )}
              </View>
              
              {/* Product name, category, brand */}
              <View className="mb-4">
                <Text className="text-2xl font-bold text-gray-800 text-center">
                  {selectedProduct.productName || "Unnamed Product"}
                </Text>
                <Text className="text-gray-500 text-center">
                  {selectedProduct.brand ? selectedProduct.brand : ""} 
                  {selectedProduct.brand && selectedProduct.categoryName ? " • " : ""}
                  {selectedProduct.categoryName ? selectedProduct.categoryName : ""}
                  </Text>
                </View>
                
              {/* Price and discount */}
              <View className="mb-4">
                <Text className="text-lg font-semibold text-gray-700">Pricing</Text>
                <View className="bg-gray-50 rounded-lg p-3 mt-1">
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Selling Price:</Text>
                    <Text className="font-semibold text-gray-800">
                    {formatPrice(selectedProduct.price)}
                  </Text>
                  </View>
                  {selectedProduct.discountPrice && selectedProduct.discountPrice !== selectedProduct.price && (
                    <View className="flex-row justify-between mt-1">
                      <Text className="text-gray-600">Discount Price:</Text>
                      <Text className="font-semibold text-gray-800">
                      {formatPrice(selectedProduct.discountPrice)}
                    </Text>
                </View>
                  )}
                  {selectedProduct.cost && (
                    <View className="flex-row justify-between mt-1">
                      <Text className="text-gray-600">Cost Price:</Text>
                      <Text className="font-semibold text-gray-800">
                        {formatPrice(selectedProduct.cost)}
                    </Text>
                  </View>
                  )}
                </View>
              </View>
                        
              {/* Inventory information */}
              <View className="mb-4">
                <Text className="text-lg font-semibold text-gray-700">Inventory</Text>
                <View className="bg-gray-50 rounded-lg p-3 mt-1">
                  <View className="flex-row justify-between">
                    <Text className="text-gray-600">Stock Quantity:</Text>
                    <View className="flex-row items-center">
                      <View 
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: getStockLevelColor(selectedProduct.stockQuantity) }}
                      />
                      <Text 
                        className="font-semibold"
                        style={{ color: getStockLevelColor(selectedProduct.stockQuantity) }}
                      >
                        {selectedProduct.stockQuantity} ({getStockLevelText(selectedProduct.stockQuantity)})
                          </Text>
              </View>
            </View>
                  <View className="flex-row justify-between mt-1">
                    <Text className="text-gray-600">Unit Type:</Text>
                    <Text className="font-semibold text-gray-800">
                      {selectedProduct.unitType || "N/A"}
                </Text>
                        </View>
                  <View className="flex-row justify-between mt-1">
                    <Text className="text-gray-600">Status:</Text>
                    <Text className="font-semibold text-gray-800">
                      {selectedProduct.status || "Active"}
                          </Text>
                </View>
                </View>
                </View>
                    
              {/* Expiration information */}
              {selectedProduct.expirationDate && (
                <View className="mb-4">
                  <Text className="text-lg font-semibold text-gray-700">Expiration</Text>
                  <View className="bg-gray-50 rounded-lg p-3 mt-1">
                    <View className="flex-row justify-between">
                      <Text className="text-gray-600">Expiration Date:</Text>
                      <Text 
                        className={`font-semibold ${isExpiringSoon(selectedProduct) ? 'text-red-500' : 'text-gray-800'}`}
                      >
                        {formatDate(selectedProduct.expirationDate)}
                        {isExpiringSoon(selectedProduct) && ' ⚠️'}
                      </Text>
                </View>
                    {selectedProduct.productionDate && (
                      <View className="flex-row justify-between mt-1">
                        <Text className="text-gray-600">Production Date:</Text>
                        <Text className="font-semibold text-gray-800">
                            {formatDate(selectedProduct.productionDate)}
                          </Text>
                </View>
                    )}
                      </View>
                </View>
              )}
              
              {/* Additional details */}
              <View className="mb-4">
                <Text className="text-lg font-semibold text-gray-700">Additional Details</Text>
                <View className="bg-gray-50 rounded-lg p-3 mt-1">
                  {selectedProduct.description && (
                    <View className="mb-2">
                      <Text className="text-gray-600">Description:</Text>
                      <Text className="text-gray-800 mt-1">{selectedProduct.description}</Text>
                          </View>
                  )}
                  {selectedProduct.supplier && (
                    <View className="flex-row justify-between mt-1">
                      <Text className="text-gray-600">Supplier:</Text>
                      <Text className="font-semibold text-gray-800">{selectedProduct.supplier}</Text>
                        </View>
                  )}
                  {selectedProduct.dateAdded && (
                    <View className="flex-row justify-between mt-1">
                      <Text className="text-gray-600">Date Added:</Text>
                      <Text className="font-semibold text-gray-800">{formatDate(selectedProduct.dateAdded)}</Text>
                        </View>
                  )}
                  {selectedProduct.lastUpdated && (
                    <View className="flex-row justify-between mt-1">
                      <Text className="text-gray-600">Last Updated:</Text>
                      <Text className="font-semibold text-gray-800">{formatDate(selectedProduct.lastUpdated)}</Text>
                      </View>
                  )}
                </View>
              </View>
            </ScrollView>
                </View>
              </View>
      </Modal>
    );
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
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
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
            width: 230,
              shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5
          }}>
            <Text className="text-base font-bold text-gray-800 px-4 py-2 border-b border-gray-100">
              Filter & Sort Options
            </Text>
            
            <View className="border-b border-gray-100">
              <Text className="text-base font-bold text-gray-800 px-4 py-2 mt-2">
                Category
              </Text>
              
              <ScrollView style={{ maxHeight: 200 }}>
                <TouchableOpacity
                  className="flex-row items-center px-4 py-3"
                  onPress={() => {
                    setFilterCategory('all');
                    setFilterModalVisible(false);
                  }}
                >
                  <View className="w-6 h-6 rounded-full bg-indigo-100 items-center justify-center mr-3">
                    <MaterialCommunityIcons name="shape-outline" size={14} color="#6366F1" />
                  </View>
                  <Text className={`font-medium ${filterCategory === 'all' ? 'text-indigo-600' : 'text-gray-800'}`}>
                    All Categories
                </Text>
                  {filterCategory === 'all' && <MaterialIcons name="check" size={20} color="#6366F1" style={{ marginLeft: 8 }} />}
              </TouchableOpacity>
                
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id || category}
                    className="flex-row items-center px-4 py-3"
                    onPress={() => {
                      setFilterCategory(category.id || category);
                      setFilterModalVisible(false);
                    }}
                  >
                    <View className="w-6 h-6 rounded-full bg-indigo-100 items-center justify-center mr-3">
                      <MaterialCommunityIcons name="tag-outline" size={14} color="#6366F1" />
                    </View>
                    <Text className={`font-medium ${filterCategory === (category.id || category) ? 'text-indigo-600' : 'text-gray-800'}`}>
                      {category.categoryName || category}
                    </Text>
                    {filterCategory === (category.id || category) && <MaterialIcons name="check" size={20} color="#6366F1" style={{ marginLeft: 8 }} />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View>
              <Text className="text-base font-bold text-gray-800 px-4 py-2 mt-2">
                Stock Level
            </Text>
              
                <TouchableOpacity
                className="flex-row items-center px-4 py-3"
                onPress={() => {
                  setFilterStockLevel('all');
                  setFilterModalVisible(false);
                }}
              >
                <View className="w-6 h-6 rounded-full bg-gray-200 items-center justify-center mr-3">
                  <Feather name="layers" size={14} color="#6B7280" />
                </View>
                <Text className={`font-medium ${filterStockLevel === 'all' ? 'text-blue-600' : 'text-gray-800'}`}>
                  All Stock Levels
                </Text>
                {filterStockLevel === 'all' && <MaterialIcons name="check" size={20} color="#4F46E5" style={{ marginLeft: 8 }} />}
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-row items-center px-4 py-3"
                  onPress={() => {
                  setFilterStockLevel('low');
                  setFilterModalVisible(false);
                }}
              >
                <View className="w-6 h-6 rounded-full bg-red-100 items-center justify-center mr-3">
                  <Feather name="alert-circle" size={14} color="#EF4444" />
                </View>
                <Text className={`font-medium ${filterStockLevel === 'low' ? 'text-red-600' : 'text-gray-800'}`}>
                  Low Stock (≤ 10)
                </Text>
                {filterStockLevel === 'low' && <MaterialIcons name="check" size={20} color="#EF4444" style={{ marginLeft: 8 }} />}
                </TouchableOpacity>
                
                  <TouchableOpacity
                className="flex-row items-center px-4 py-3"
                onPress={() => {
                  setFilterStockLevel('medium');
                  setFilterModalVisible(false);
                }}
              >
                <View className="w-6 h-6 rounded-full bg-amber-100 items-center justify-center mr-3">
                  <Feather name="alert-triangle" size={14} color="#F59E0B" />
                </View>
                <Text className={`font-medium ${filterStockLevel === 'medium' ? 'text-amber-600' : 'text-gray-800'}`}>
                  Medium Stock (11-50)
                </Text>
                {filterStockLevel === 'medium' && <MaterialIcons name="check" size={20} color="#F59E0B" style={{ marginLeft: 8 }} />}
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-row items-center px-4 py-3"
                    onPress={() => {
                  setFilterStockLevel('high');
                  setFilterModalVisible(false);
                }}
              >
                <View className="w-6 h-6 rounded-full bg-green-100 items-center justify-center mr-3">
                  <Feather name="check-circle" size={14} color="#10B981" />
                </View>
                <Text className={`font-medium ${filterStockLevel === 'high' ? 'text-green-600' : 'text-gray-800'}`}>
                  Good Stock (&gt; 50)
                  </Text>
                {filterStockLevel === 'high' && <MaterialIcons name="check" size={20} color="#10B981" style={{ marginLeft: 8 }} />}
                  </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-row items-center px-4 py-3"
                onPress={() => {
                  setFilterStockLevel('expire-soon');
                  setFilterModalVisible(false);
                }}
              >
                <View className="w-6 h-6 rounded-full bg-red-100 items-center justify-center mr-3">
                  <Feather name="clock" size={14} color="#EF4444" />
                </View>
                <Text className={`font-medium ${filterStockLevel === 'expire-soon' ? 'text-red-600' : 'text-gray-800'}`}>
                  Expiring Soon
                </Text>
                {filterStockLevel === 'expire-soon' && <MaterialIcons name="check" size={20} color="#EF4444" style={{ marginLeft: 8 }} />}
              </TouchableOpacity>
                </View>
                
            <View className="border-t border-gray-100 mt-2">
              <Text className="text-base font-bold text-gray-800 px-4 py-2 mt-2">
                Sort By
            </Text>
              
                <TouchableOpacity
                className="flex-row items-center px-4 py-3"
                onPress={() => {
                  setSortBy('name-asc');
                  setFilterModalVisible(false);
                }}
              >
                <View className="w-6 h-6 rounded-full bg-indigo-100 items-center justify-center mr-3">
                  <MaterialCommunityIcons name="sort-alphabetical-ascending" size={14} color="#6366F1" />
                </View>
                <Text className={`font-medium ${sortBy === 'name-asc' ? 'text-indigo-600' : 'text-gray-800'}`}>
                  Name (A-Z)
                </Text>
                {sortBy === 'name-asc' && <MaterialIcons name="check" size={20} color="#6366F1" style={{ marginLeft: 8 }} />}
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-row items-center px-4 py-3"
                  onPress={() => {
                  setSortBy('name-desc');
                  setFilterModalVisible(false);
                }}
              >
                <View className="w-6 h-6 rounded-full bg-indigo-100 items-center justify-center mr-3">
                  <MaterialCommunityIcons name="sort-alphabetical-descending" size={14} color="#6366F1" />
                </View>
                <Text className={`font-medium ${sortBy === 'name-desc' ? 'text-indigo-600' : 'text-gray-800'}`}>
                  Name (Z-A)
                  </Text>
                {sortBy === 'name-desc' && <MaterialIcons name="check" size={20} color="#6366F1" style={{ marginLeft: 8 }} />}
                </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-row items-center px-4 py-3"
                onPress={() => {
                  setSortBy('price-asc');
                  setFilterModalVisible(false);
                }}
              >
                <View className="w-6 h-6 rounded-full bg-indigo-100 items-center justify-center mr-3">
                  <MaterialCommunityIcons name="sort-numeric-ascending" size={14} color="#6366F1" />
              </View>
                <Text className={`font-medium ${sortBy === 'price-asc' ? 'text-indigo-600' : 'text-gray-800'}`}>
                  Price (Low-High)
                </Text>
                {sortBy === 'price-asc' && <MaterialIcons name="check" size={20} color="#6366F1" style={{ marginLeft: 8 }} />}
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center px-4 py-3"
                onPress={() => {
                  setSortBy('price-desc');
                  setFilterModalVisible(false);
                }}
              >
                <View className="w-6 h-6 rounded-full bg-indigo-100 items-center justify-center mr-3">
                  <MaterialCommunityIcons name="sort-numeric-descending" size={14} color="#6366F1" />
                </View>
                <Text className={`font-medium ${sortBy === 'price-desc' ? 'text-indigo-600' : 'text-gray-800'}`}>
                  Price (High-Low)
                </Text>
                {sortBy === 'price-desc' && <MaterialIcons name="check" size={20} color="#6366F1" style={{ marginLeft: 8 }} />}
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-row items-center px-4 py-3"
                onPress={() => {
                  setSortBy('stock-asc');
                  setFilterModalVisible(false);
                }}
              >
                <View className="w-6 h-6 rounded-full bg-indigo-100 items-center justify-center mr-3">
                  <MaterialCommunityIcons name="sort-numeric-ascending" size={14} color="#6366F1" />
                </View>
                <Text className={`font-medium ${sortBy === 'stock-asc' ? 'text-indigo-600' : 'text-gray-800'}`}>
                  Stock (Low-High)
                </Text>
                {sortBy === 'stock-asc' && <MaterialIcons name="check" size={20} color="#6366F1" style={{ marginLeft: 8 }} />}
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center px-4 py-3"
                onPress={() => {
                  setSortBy('stock-desc');
                  setFilterModalVisible(false);
                }}
              >
                <View className="w-6 h-6 rounded-full bg-indigo-100 items-center justify-center mr-3">
                  <MaterialCommunityIcons name="sort-numeric-descending" size={14} color="#6366F1" />
                </View>
                <Text className={`font-medium ${sortBy === 'stock-desc' ? 'text-indigo-600' : 'text-gray-800'}`}>
                  Stock (High-Low)
                </Text>
                {sortBy === 'stock-desc' && <MaterialIcons name="check" size={20} color="#6366F1" style={{ marginLeft: 8 }} />}
              </TouchableOpacity>
              
              <TouchableOpacity
                className="flex-row items-center px-4 py-3"
                onPress={() => {
                  setSortBy('expiration');
                  setFilterModalVisible(false);
                }}
              >
                <View className="w-6 h-6 rounded-full bg-indigo-100 items-center justify-center mr-3">
                  <MaterialCommunityIcons name="calendar-clock" size={14} color="#6366F1" />
                </View>
                <Text className={`font-medium ${sortBy === 'expiration' ? 'text-indigo-600' : 'text-gray-800'}`}>
                  Expiration Date
                </Text>
                {sortBy === 'expiration' && <MaterialIcons name="check" size={20} color="#6366F1" style={{ marginLeft: 8 }} />}
              </TouchableOpacity>
            </View>
            
            {/* Reset button */}
            <View className="border-t border-gray-100 mt-2 pt-2 px-4">
              <TouchableOpacity
                className="py-2 px-4 bg-gray-200 rounded-lg items-center"
                onPress={() => {
                  setFilterCategory('all');
                  setFilterStockLevel('all');
                  setSortBy('name-asc');
                  setFilterModalVisible(false);
                }}
              >
                <Text className="text-gray-800 font-medium">Reset All Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // Show filter modal with animation
  const showFilterModal = () => {
    setFilterModalVisible(true);
    Animated.spring(filterModalAnim, {
      toValue: 1,
      friction: 6,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View className="flex-1 bg-gray-50">
      <HomeHeader title="Inventory Management" />
      
      {/* Search and filter section */}
      <View className="px-4 pt-2 pb-4">
        <View className="flex-row items-center mb-4">
          <View className="flex-1 flex-row items-center bg-white rounded-lg shadow-sm px-3">
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
          
          <TouchableOpacity 
            className="ml-2 bg-white rounded-lg p-2 shadow-sm"
            style={{
              borderWidth: (filterCategory !== 'all' || filterStockLevel !== 'all') ? 1 : 0,
              borderColor: '#3B82F6'
            }}
            onPress={showFilterModal}
          >
            <MaterialIcons 
              name="filter-list" 
              size={26} 
              color={(filterCategory !== 'all' || filterStockLevel !== 'all') ? '#3B82F6' : '#6B7280'} 
            />
            {(filterCategory !== 'all' || filterStockLevel !== 'all') && (
              <View style={{
                position: 'absolute',
                top: -5,
                right: -5,
                backgroundColor: '#3B82F6',
                borderRadius: 10,
                width: 18,
                height: 18,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
                <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                  {(filterCategory !== 'all' && filterStockLevel !== 'all') ? '2' : '1'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Applied filters indicators */}
        {(filterCategory !== 'all' || filterStockLevel !== 'all') && (
          <View className="flex-row flex-wrap mb-3">
            {filterCategory !== 'all' && (
              <View className="bg-blue-100 rounded-full px-3 py-1 flex-row items-center mr-2 mb-2">
                <Text className="text-blue-700 font-medium mr-1">
                  Category: {typeof filterCategory === 'string' && filterCategory !== 'all' ? 
                    (categories.find(c => c.id === filterCategory || c === filterCategory)?.categoryName || filterCategory) : 
                    filterCategory}
                </Text>
                <TouchableOpacity onPress={() => setFilterCategory('all')}>
                  <Ionicons name="close-circle" size={16} color="#3B82F6" />
            </TouchableOpacity>
        </View>
            )}
            
            {filterStockLevel !== 'all' && (
              <View 
                className="rounded-full px-3 py-1 flex-row items-center mr-2 mb-2"
                style={{
                  backgroundColor: filterStockLevel === 'low' || filterStockLevel === 'expire-soon' 
                    ? '#FEE2E2' 
                    : filterStockLevel === 'medium' 
                      ? '#FEF3C7'
                      : '#ECFDF5'
                }}
              >
                <Text
                  className="font-medium mr-1"
                  style={{ 
                    color: filterStockLevel === 'low' || filterStockLevel === 'expire-soon' 
                      ? '#EF4444' 
                      : filterStockLevel === 'medium' 
                        ? '#F59E0B'
                        : '#10B981'
                  }}
                >
                  {filterStockLevel === 'low' 
                    ? 'Low Stock' 
                    : filterStockLevel === 'medium' 
                      ? 'Medium Stock'
                      : filterStockLevel === 'high'
                        ? 'Well Stocked'
                        : 'Expiring Soon'}
                </Text>
                <TouchableOpacity onPress={() => setFilterStockLevel('all')}>
                  <Ionicons 
                    name="close-circle" 
                    size={16} 
                    color={
                      filterStockLevel === 'low' || filterStockLevel === 'expire-soon' 
                        ? '#EF4444' 
                        : filterStockLevel === 'medium' 
                          ? '#F59E0B'
                          : '#10B981'
                    } 
                  />
              </TouchableOpacity>
        </View>
            )}
          </View>
        )}
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
      {renderFilterModal()}
    </View>
  );
}
