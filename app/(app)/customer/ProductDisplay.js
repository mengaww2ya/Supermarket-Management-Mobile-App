import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { db } from '../../../firebase/firebaseConfig';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import HomeHeader from "../../components/HomeHeader";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function ProductDisplay() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { categoryId, categoryName, filterType, title } = params;
  
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Handle different filter types
        if (filterType) {
          switch (filterType) {
            case 'discount':
              // Fetch discount categories
              await fetchDiscountCategories();
              break;
            case 'standard':
              // Fetch standard categories
              await fetchStandardCategories();
              break;
            case 'discountProducts':
              // Fetch products with discount
              await fetchDiscountProducts();
              break;
            case 'featured':
              // Fetch featured products
              await fetchFeaturedProducts();
              break;
            default:
              setError("Unknown filter type");
          }
        } else if (categoryId) {
          // Fetch products by category
          await fetchProductsByCategory(categoryId);
        } else {
          setError("No valid filter criteria provided");
        }
      } catch (err) {
        console.error("Error fetching data: ", err);
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [categoryId, filterType]);

  // Basic fetch of all products (for fallback)
  const fetchAllProducts = async () => {
    try {
      const productsRef = collection(db, "Products");
      const snapshot = await getDocs(productsRef);
      
      // Get current date for expiration check
      const currentDate = new Date();
      
      // Filter out expired products and those marked as deleted
      return snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(product => {
          // Check if product is deleted
          if (product.isDeleted) return false;
          
          // Check if product has expiration date and is expired
          if (product.expirationDate && product.expirationDate.toDate) {
            const expiryDate = product.expirationDate.toDate();
            if (expiryDate < currentDate) return false;
          }
          
          return true;
        });
    } catch (error) {
      console.error("Error fetching all products:", error);
      return [];
    }
  };

  // Basic fetch of all categories (for fallback)
  const fetchAllCategories = async () => {
    try {
      const categoryRef = collection(db, "AddCategory");
      const snapshot = await getDocs(categoryRef);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error fetching all categories:", error);
      return [];
    }
  };

  // Fetch products by category ID
  const fetchProductsByCategory = async (catId) => {
      try {
        const productsRef = collection(db, "Products");

      // Try to use the compound query first
      try {
        const q = query(
          productsRef, 
          where("categoryId", "==", catId)
        );
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setFilteredProducts([]);
        } else {
          // Get current date for expiration check
          const currentDate = new Date();
          
          const products = querySnapshot.docs
            .map(doc => ({
              id: doc.id,
              ...doc.data(),
            }))
            .filter(product => {
              // Check if product is deleted
              if (product.isDeleted) return false;
              
              // Check if product has expiration date and is expired
              if (product.expirationDate && product.expirationDate.toDate) {
                const expiryDate = product.expirationDate.toDate();
                if (expiryDate < currentDate) return false;
              }
              
              return product.stockQuantity > 0;
            });
          
          setFilteredProducts(products);
        }
      } catch (queryError) {
        console.error("Error in primary query:", queryError);
        
        // If that fails, fetch all products and filter manually
        const allProducts = await fetchAllProducts();
        const filteredProducts = allProducts.filter(
          product => product.categoryId === catId && product.stockQuantity > 0
        );
        setFilteredProducts(filteredProducts);
      }
    } catch (error) {
      console.error("Error fetching products by category:", error);
      setError("Could not load products for this category");
    }
  };

  // Fetch discount categories
  const fetchDiscountCategories = async () => {
    try {
      // Try using where query
      try {
        const categoryRef = collection(db, "AddCategory");
        const q = query(categoryRef, where("hasDiscount", "==", true));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setCategories([]);
        } else {
          const categories = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setCategories(categories);
        }
      } catch (queryError) {
        console.error("Error in discount categories query:", queryError);
        
        // Fallback to getting all categories and filtering
        const allCategories = await fetchAllCategories();
        const discountCategories = allCategories.filter(cat => cat.hasDiscount === true);
        setCategories(discountCategories);
      }
    } catch (error) {
      console.error("Error fetching discount categories:", error);
      setError("Could not load discount categories");
    }
  };

  // Fetch standard categories
  const fetchStandardCategories = async () => {
    try {
      // Fetch all categories and filter
      const allCategories = await fetchAllCategories();
      
      if (allCategories.length === 0) {
        setCategories([]);
      } else {
        const standardCats = allCategories.filter(cat => !cat.hasDiscount);
        setCategories(standardCats);
      }
    } catch (error) {
      console.error("Error fetching standard categories:", error);
      setError("Could not load standard categories");
    }
  };

  // Fetch products with discount
  const fetchDiscountProducts = async () => {
    try {
      const productsRef = collection(db, "Products");
      
      // Fetch all products and filter for discounts
      const allProducts = await fetchAllProducts();
      const discountProducts = allProducts.filter(
        product => product.discountPrice > 0 && product.stockQuantity > 0
      );
      
      // Sort by discount price
      discountProducts.sort((a, b) => {
        // First by stock
        if (a.stockQuantity !== b.stockQuantity) {
          return b.stockQuantity - a.stockQuantity;
        }
        // Then by discount price
        return a.discountPrice - b.discountPrice;
      });
      
      setFilteredProducts(discountProducts);
    } catch (error) {
      console.error("Error fetching discount products:", error);
      setError("Could not load discounted products");
    }
  };

  // Fetch featured products
  const fetchFeaturedProducts = async () => {
    try {
      // Fetch all products and filter
      const allProducts = await fetchAllProducts();
      
      // Filter for non-discounted products with stock
      const featuredProducts = allProducts
        .filter(product => !product.discountPrice && product.stockQuantity > 0)
        .sort((a, b) => {
          // First by stock
          if (a.stockQuantity !== b.stockQuantity) {
            return b.stockQuantity - a.stockQuantity;
          }
          // Then by price (high to low)
          return b.price - a.price;
        })
        .slice(0, 20); // Limit to 20 results
      
      setFilteredProducts(featuredProducts);
    } catch (error) {
      console.error("Error fetching featured products:", error);
      setError("Could not load featured products");
    }
  };

  // Handle category press
  const handleCategoryPress = async (category) => {
    try {
      setLoading(true);
      setError(null);
      setCategories([]); // Clear categories to only show products
      await fetchProductsByCategory(category.id);
      } catch (err) {
        console.error("Error fetching products: ", err);
      setError(err.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    };

  // Filter products by search query
  const displayedProducts = filteredProducts.filter(product =>
    product.productName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const displayedCategories = categories.filter(category =>
    category.categoryName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render product item
  const renderProductItem = ({ item, index }) => (
    <TouchableOpacity
      style={{
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        marginHorizontal: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
        flexDirection: 'row',
        alignItems: 'center',
        width: '95%',
        alignSelf: 'center'
      }}
      onPress={() => router.push({ pathname: "/customer/Item", params: { productId: item.id } })}
    >
      <View style={{ 
        width: 80, 
        height: 80, 
        backgroundColor: '#F3F4F6', 
        borderRadius: 8, 
        justifyContent: 'center', 
        alignItems: 'center',
        overflow: 'hidden'
      }}>
        {item.image ? (
          <Image
            style={{ width: "100%", height: "100%" }}
            source={{ uri: item.image }}
            resizeMode="contain"
          />
        ) : (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="image-outline" size={24} color="#9CA3AF" />
          </View>
        )}
      </View>

      <View style={{ marginLeft: 16, flex: 1 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>
          {item.productName || ''}
        </Text>
        <Text style={{ 
          color: item.discountPrice ? '#EF4444' : '#10B981', 
          fontWeight: '600', 
          fontSize: 16, 
          marginTop: 4 
        }}>
          {item.discountPrice ? `${item.discountPrice} Birr` : `${item.price || 0} Birr`} / {item.unitType || 'unit'}
        </Text>
        {item.discountPrice && (
          <Text style={{ fontSize: 14, color: '#9CA3AF', textDecorationLine: 'line-through' }}>
            {`${item.price || 0} Birr`}
          </Text>
        )}
        
        {/* Stock indicator */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <View style={{ 
            width: 6, 
            height: 6, 
            borderRadius: 3, 
            backgroundColor: item.stockQuantity > 10 ? '#10B981' : '#F59E0B',
            marginRight: 6 
          }} />
          <Text style={{ 
            fontSize: 12, 
            color: item.stockQuantity > 10 ? '#10B981' : '#F59E0B',
          }}>
            {item.stockQuantity > 10 ? 'In Stock' : `Limited Stock (${item.stockQuantity})`}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render category item
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={{
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        marginHorizontal: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
        width: '95%',
        alignSelf: 'center'
      }}
      onPress={() => handleCategoryPress(item)}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ 
          width: 60, 
          height: 60, 
          backgroundColor: '#F3F4F6', 
          borderRadius: 8, 
          justifyContent: 'center', 
          alignItems: 'center',
          overflow: 'hidden'
        }}>
          {item.image ? (
            <Image
              style={{ width: "100%", height: "100%" }}
              source={{ uri: item.image }}
              resizeMode="contain"
            />
          ) : (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="image-outline" size={24} color="#9CA3AF" />
            </View>
          )}
        </View>
        
        <View style={{ marginLeft: 16, flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>
            {item.categoryName || ''}
          </Text>
          {item.hasDiscount && (
            <View style={{ 
              backgroundColor: '#FEE2E2', 
              paddingHorizontal: 8, 
              paddingVertical: 4, 
              borderRadius: 4,
              alignSelf: 'flex-start',
              marginTop: 4
            }}>
              <Text style={{ color: '#EF4444', fontWeight: '500', fontSize: 12 }}>
                Special Discount
              </Text>
            </View>
          )}
          {item.description ? (
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#EF4444' }}>{error}</Text>
        <TouchableOpacity 
          style={{ 
            backgroundColor: '#4CAF50', 
            paddingHorizontal: 20, 
            paddingVertical: 10, 
            borderRadius: 8, 
            marginTop: 16 
          }}
          onPress={() => router.back()}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <HomeHeader title={title || categoryName || "Products"} />
      
      {/* Search Bar */}
      <View style={{ 
        margin: 16,
        backgroundColor: 'white',
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2.84,
        elevation: 2,
      }}>
        <Ionicons name="search" size={20} color="#4CAF50" />
        <TextInput
          placeholder="Search..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={{ 
            flex: 1, 
            padding: 8,
            fontSize: 16,
            color: '#1F2937'
          }}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Empty State */}
      {(categories.length === 0 && filteredProducts.length === 0) && !loading && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Ionicons name="basket-outline" size={64} color="#D1D5DB" />
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#4B5563', marginTop: 16 }}>
            No Products Found
          </Text>
          <Text style={{ fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8 }}>
            There are no products available in this category at the moment.
          </Text>
          <TouchableOpacity 
            style={{ 
              backgroundColor: '#4CAF50', 
              paddingHorizontal: 20, 
              paddingVertical: 10, 
              borderRadius: 8, 
              marginTop: 16 
            }}
            onPress={() => router.back()}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Category List */}
      {categories.length > 0 && (
        <FlatList
          data={displayedCategories}
          keyExtractor={(item) => item.id}
          renderItem={renderCategoryItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Product List */}
      {filteredProducts.length > 0 && categories.length === 0 && (
      <FlatList
        data={displayedProducts}
        keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, color: '#6B7280' }}>No products match your search.</Text>
            </View>
          )}
      />
      )}
    </SafeAreaView>
  );
}