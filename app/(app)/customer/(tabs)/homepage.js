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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import { useRouter } from "expo-router";
import { db } from '../../../../firebase/firebaseConfig';
import { collection, getDocs, query, limit, orderBy, where } from 'firebase/firestore';
import HomeHeader from "../../../components/HomeHeader";
import { MenuProvider } from 'react-native-popup-menu';

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width * 0.42;

// Item animation component - extracted to avoid hooks inside render
const AnimatedCategoryItem = ({ item, index, onPress }) => {
  const itemFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(itemFadeAnim, {
      toValue: 1,
      duration: 500,
      delay: index * 100,
      useNativeDriver: true,
    }).start();
  }, [index, itemFadeAnim]);

  return (
    <Animated.View
      style={{
        opacity: itemFadeAnim,
        transform: [{
          translateY: itemFadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [50, 0],
          })
        }]
      }}
    >
      <TouchableOpacity
        style={{
          backgroundColor: 'white',
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
          maxHeight: 200
        }}
        onPress={() => onPress(item)}
      >
        <LinearGradient
          colors={['#f0f9ff', '#fff']}
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />
        <Text style={{ fontSize: 16, fontWeight: 'bold', textAlign: 'center', color: '#4B5563' }}>
          {item.categoryName}
        </Text>
        <View style={{ width: '100%', height: 96, marginVertical: 8 }}>
          <Image
            style={{ width: "100%", height: "100%", resizeMode: "contain", borderRadius: 12 }}
            source={{ uri: item.image }}
          />
        </View>
        <Text style={{ fontSize: 14, fontWeight: '500', textAlign: 'center', width: '100%', paddingVertical: 4, color: '#4B5563' }} numberOfLines={2}>
          {item.description || ''}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Item animation component - extracted to avoid hooks inside render
const AnimatedProductItem = ({ item, index, onPress, isDiscounted = false }) => {
  const itemScaleAnim = useRef(new Animated.Value(0.9)).current;
  const itemFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(itemFadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(itemScaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
  }, [index, itemFadeAnim, itemScaleAnim]);

  const discountPrice = item.discountPrice ? `${item.discountPrice} Birr` : '';
  const regularPrice = item.price ? `${item.price} Birr` : '0 Birr';
  const productName = item.productName || '';

  return (
    <Animated.View
      style={{
        opacity: itemFadeAnim,
        transform: [{ scale: itemScaleAnim }]
      }}
    >
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
        {isDiscounted && (
          <View style={{
            position: 'absolute',
            top: 0,
            right: 0,
            backgroundColor: '#EF4444',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderTopRightRadius: 16,
            borderBottomLeftRadius: 12,
            zIndex: 1,
          }}>
            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 10 }}>
              SALE
            </Text>
          </View>
        )}
        <View style={{ width: '100%', height: 96, marginBottom: 8, backgroundColor: '#F9FAFB', borderRadius: 12, overflow: 'hidden' }}>
          <Image
            source={{ uri: item.image }}
            style={{ width: "100%", height: "100%", resizeMode: "contain" }}
          />
        </View>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F2937' }} numberOfLines={1}>
          {productName}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
          <Text style={{ color: isDiscounted ? '#EF4444' : '#10B981', fontWeight: 'bold' }}>
            {isDiscounted ? discountPrice : regularPrice}
          </Text>
          {item.discountPrice && (
            <Text style={{ fontSize: 12, color: '#9CA3AF', textDecorationLine: 'line-through' }}>
              {regularPrice}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={{ position: 'absolute', top: 8, right: 8, backgroundColor: 'white', borderRadius: 999, padding: 4 }}
          onPress={(e) => {
            e.stopPropagation();
            console.log('Favorite', item.id);
          }}
        >
          <Ionicons name="heart-outline" size={16} color="#FF6B6B" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Section Header Component
const SectionHeader = ({ title, onSeeAll, color = '#22C55E' }) => {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#1F2937' }}>{title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={{ fontSize: 14, fontWeight: '500', color }}>{`See All`}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Hero Banner Component
const HeroBanner = ({ onPress }) => {
  return (
    <TouchableOpacity
      style={{
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 8,
        borderRadius: 16,
        overflow: 'hidden',
        height: 180,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
      }}
      onPress={onPress}
    >
      <LinearGradient
        colors={['#22C55E', '#4ADE80', '#86EFAC']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: '100%',
          height: '100%',
          padding: 20,
          justifyContent: 'center'
        }}
      >
        <View style={{ position: 'absolute', bottom: -20, right: -20, opacity: 0.1 }}>
          <Ionicons name="cart" size={150} color="white" />
        </View>
        <View style={{ width: '70%' }}>
          <Text style={{ fontSize: 14, color: '#D1FAE5', fontWeight: '600', marginBottom: 8 }}>
            LIMITED TIME OFFER
          </Text>
          <Text style={{ fontSize: 24, color: 'white', fontWeight: 'bold', marginBottom: 12 }}>
            Get 20% Off on Your First Order!
          </Text>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.2)',
            alignSelf: 'flex-start',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 20
          }}>
            <Text style={{ color: 'white', fontWeight: '600', marginRight: 4 }}>Shop Now</Text>
            <Ionicons name="arrow-forward" size={16} color="white" />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

export default function Homepage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [standardCategories, setStandardCategories] = useState([]);
  const [discountCategories, setDiscountCategories] = useState([]);
  const [standardProducts, setStandardProducts] = useState([]);
  const [discountProducts, setDiscountProducts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const router = useRouter();

  // Initial data fetch - only needs to run once on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Setup animations
  useEffect(() => {
    // Animate components on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();

    return () => {
      scrollY.removeAllListeners();
    };
  }, []);

  // Handle search
  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch();
        setIsSearching(true);
      } else {
        setSearchResults(null);
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  const performSearch = () => {
    const query = searchQuery.toLowerCase().trim();

    // Search in categories (only show categories with products in stock)
    const filteredCategories = [...standardCategories, ...discountCategories].filter(
      cat => (cat.categoryName?.toLowerCase().includes(query) ||
        cat.description?.toLowerCase().includes(query))
    );

    // Search in products (only show products with stock > 0)
    const filteredProducts = [...standardProducts, ...discountProducts].filter(
      product => (product.productName?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query)) &&
        product.stockQuantity > 0
    );

    setSearchResults({
      categories: filteredCategories,
      products: filteredProducts
    });
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all categories
      const categoryCollection = collection(db, 'AddCategory');
      const categorySnapshot = await getDocs(categoryCollection);
      const categoryList = categorySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Fetch products to check stock
      const productsCollection = collection(db, 'Products');
      const productsSnapshot = await getDocs(productsCollection);
      const allProducts = productsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Get current date for expiration check
      const currentDate = new Date();

      // Filter out expired products and those marked as deleted
      const validProducts = allProducts.filter(product => {
        // Check if product is deleted
        if (product.isDeleted) return false;

        // Check if product has expiration date and is expired
        if (product.expirationDate && product.expirationDate.toDate) {
          const expiryDate = product.expirationDate.toDate();
          if (expiryDate < currentDate) return false;
        }

        return true;
      });

      // Filter categories that have at least one product with stock > 0
      const categoriesWithStock = [];

      for (const category of categoryList) {
        const productsInCategory = validProducts.filter(
          product => product.categoryId === category.id && product.stockQuantity > 0
        );

        if (productsInCategory.length > 0) {
          categoriesWithStock.push(category);
        }
      }

      // Separate categories
      const discountCats = categoriesWithStock.filter(cat => cat.hasDiscount === true);
      const standardCats = categoriesWithStock.filter(cat => !cat.hasDiscount);

      setDiscountCategories(discountCats);
      setStandardCategories(standardCats);

      // For discount products - use simple query first
      try {
        // Try with a simpler query approach first
        const simpleDiscountQuery = query(
          productsCollection,
          where("discountPrice", ">", 0),
          limit(20)
        );
        const simpleDiscountSnapshot = await getDocs(simpleDiscountQuery);
        const filteredDiscountProducts = simpleDiscountSnapshot.docs
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
          })
          .sort((a, b) => b.stockQuantity - a.stockQuantity)
          .slice(0, 6);

        setDiscountProducts(filteredDiscountProducts);
      } catch (error) {
        console.error("Error fetching simple discount products:", error);

        // Fallback to memory filtering from all products
        const discountProductsWithStock = validProducts
          .filter(product => product.discountPrice > 0 && product.stockQuantity > 0)
          .sort((a, b) => b.stockQuantity - a.stockQuantity)
          .slice(0, 6);

        setDiscountProducts(discountProductsWithStock);
      }

      // For standard products - use simple query first
      try {
        // Try with a simpler query approach first
        const simpleStandardQuery = query(
          productsCollection,
          where("stockQuantity", ">", 0),
          limit(20)
        );
        const simpleStandardSnapshot = await getDocs(simpleStandardQuery);
        const filteredStandardProducts = simpleStandardSnapshot.docs
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

            return !product.discountPrice || product.discountPrice === 0;
          })
          .sort((a, b) => b.stockQuantity - a.stockQuantity)
          .slice(0, 6);

        setStandardProducts(filteredStandardProducts);
      } catch (error) {
        console.error("Error fetching simple standard products:", error);

        // Fallback to memory filtering from all products
        const standardProductsWithStock = validProducts
          .filter(product => (!product.discountPrice || product.discountPrice === 0) && product.stockQuantity > 0)
          .sort((a, b) => b.stockQuantity - a.stockQuantity)
          .slice(0, 6);

        setStandardProducts(standardProductsWithStock);
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

  const handleCategoryPress = useCallback((item) => {
    router.push({
      pathname: "/customer/ProductDisplay",
      params: { categoryId: item.id, categoryName: item.categoryName },
    });
  }, [router]);

  const handleProductPress = useCallback((item) => {
    router.push({
      pathname: "/customer/Item",
      params: { productId: item.id },
    });
  }, [router]);

  const handleSeeAllDiscountCategories = useCallback(() => {
    router.push({
      pathname: "/customer/ProductDisplay",
      params: { filterType: "discount", title: "Discount Categories" }
    });
  }, [router]);

  const handleSeeAllStandardCategories = useCallback(() => {
    router.push({
      pathname: "/customer/ProductDisplay",
      params: { filterType: "standard", title: "All Categories" }
    });
  }, [router]);

  const handleSeeAllDiscountProducts = useCallback(() => {
    router.push({
      pathname: "/customer/ProductDisplay",
      params: { filterType: "discountProducts", title: "Special Offers" }
    });
  }, [router]);

  const handleSeeAllFeaturedProducts = useCallback(() => {
    router.push({
      pathname: "/customer/ProductDisplay",
      params: { filterType: "featured", title: "Featured Products" }
    });
  }, [router]);

  const renderStandardCategoryItem = useCallback(({ item, index }) => (
    <AnimatedCategoryItem
      item={item}
      index={index}
      onPress={handleCategoryPress}
    />
  ), [handleCategoryPress]);

  const renderDiscountCategoryItem = useCallback(({ item, index }) => (
    <AnimatedCategoryItem
      item={item}
      index={index}
      onPress={handleCategoryPress}
    />
  ), [handleCategoryPress]);

  const renderStandardProductItem = useCallback(({ item, index }) => (
    <AnimatedProductItem
      item={item}
      index={index}
      onPress={handleProductPress}
      isDiscounted={false}
    />
  ), [handleProductPress]);

  const renderDiscountProductItem = useCallback(({ item, index }) => (
    <AnimatedProductItem
      item={item}
      index={index}
      onPress={handleProductPress}
      isDiscounted={true}
    />
  ), [handleProductPress]);

  // Search opacity animation
  const searchOpacity = scrollY.interpolate({
    inputRange: [0, 50, 100],
    outputRange: [0, 0.5, 1],
    extrapolate: 'clamp'
  });

  const searchTranslateY = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [30, 0],
    extrapolate: 'clamp'
  });

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
    setIsSearching(false);
  };

  // Render search results
  const renderSearchResults = () => {
    if (!searchResults) return null;

    const { categories, products } = searchResults;
    const hasResults = categories.length > 0 || products.length > 0;

    if (!hasResults) {
      return (
        <View style={{ flex: 1, padding: 20, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 16, color: '#6B7280', textAlign: 'center' }}>
            No results found for "{searchQuery}"
          </Text>
        </View>
      );
    }

    return (
      <View style={{ flex: 1, padding: 16 }}>
        {categories.length > 0 && (
          <>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 12 }}>
              Categories ({categories.length})
            </Text>
            <FlatList
              data={categories}
              keyExtractor={(item) => `category-${item.id}`}
              renderItem={({ item, index }) => (
                <AnimatedCategoryItem
                  item={item}
                  index={index}
                  onPress={handleCategoryPress}
                />
              )}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            />
          </>
        )}

        {products.length > 0 && (
          <>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginTop: 16, marginBottom: 12 }}>
              Products ({products.length})
            </Text>
            <FlatList
              data={products}
              keyExtractor={(item) => `product-${item.id}`}
              renderItem={({ item, index }) => (
                <AnimatedProductItem
                  item={item}
                  index={index}
                  onPress={handleProductPress}
                  isDiscounted={!!item.discountPrice}
                />
              )}
              numColumns={2}
              contentContainerStyle={{ paddingBottom: 16 }}
            />
          </>
        )}
      </View>
    );
  };

  return (
    <MenuProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <StatusBar barStyle="dark-content" />
        <HomeHeader title={"Supermarket"} />

        {/* Enhanced Search Bar */}
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

        {isSearching ? (
          // Search Results View
          <>
            {loading ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#F59E0B" />
              </View>
            ) : (
              renderSearchResults()
            )}
          </>
        ) : (
          // Enhanced Home View
          <Animated.ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F59E0B" />
            }
          >
            {/* Hero Banner */}
            <HeroBanner onPress={() => console.log('Banner pressed')} />

            {/* Category Chips */}
            {!loading && standardCategories.length > 0 && (
              <View style={{ marginTop: 16, marginBottom: 8 }}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                >
                  {standardCategories.slice(0, 8).map((category, index) => (
                    <TouchableOpacity
                      key={category.id}
                      style={{
                        backgroundColor: index === 0 ? '#10B981' : 'white',
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        marginRight: 8,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 3,
                        elevation: 2,
                      }}
                      onPress={() => handleCategoryPress(category)}
                    >
                      <Text
                        style={{
                          color: index === 0 ? 'white' : '#4B5563',
                          fontWeight: index === 0 ? 'bold' : '500'
                        }}
                      >
                        {category.categoryName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Deals & Discounts Section */}
            {(discountCategories.length > 0 || discountProducts.length > 0) && (
              <View style={{ marginTop: 24, marginHorizontal: 16 }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 12
                }}>
                  <View style={{
                    backgroundColor: '#D1FAE5',
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10
                  }}>
                    <MaterialIcons name="local-offer" size={18} color="#059669" />
                  </View>
                  <Text style={{
                    fontSize: 20,
                    fontWeight: 'bold',
                    color: '#059669'
                  }}>
                    Deals & Discounts
                  </Text>
                </View>

                {loading ? (
                  <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#F59E0B" />
                  </View>
                ) : (
                  <>
                    {/* Discount Categories */}
                    {discountCategories.length > 0 && (
                      <>
                        <View style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: 8,
                          marginBottom: 8
                        }}>
                          <Text style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: '#4B5563'
                          }}>
                            Special Categories
                          </Text>
                          <TouchableOpacity onPress={handleSeeAllDiscountCategories}>
                            <Text style={{
                              fontSize: 14,
                              fontWeight: '500',
                              color: '#EF4444'
                            }}>
                              See All
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <FlatList
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          data={discountCategories}
                          keyExtractor={(item) => item.id}
                          renderItem={renderDiscountCategoryItem}
                          contentContainerStyle={{ paddingVertical: 10 }}
                        />
                      </>
                    )}

                    {/* Discount Products */}
                    {discountProducts.length > 0 && (
                      <>
                        <View style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: 16,
                          marginBottom: 8
                        }}>
                          <Text style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: '#4B5563'
                          }}>
                            Special Offers
                          </Text>
                          <TouchableOpacity onPress={handleSeeAllDiscountProducts}>
                            <Text style={{
                              fontSize: 14,
                              fontWeight: '500',
                              color: '#EF4444'
                            }}>
                              See All
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <FlatList
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          data={discountProducts}
                          keyExtractor={(item) => item.id}
                          renderItem={renderDiscountProductItem}
                          contentContainerStyle={{ paddingVertical: 10 }}
                        />
                      </>
                    )}
                  </>
                )}
              </View>
            )}

            {/* Standard Categories Section */}
            <View style={{ marginTop: 24, marginHorizontal: 16 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12
              }}>
                <View style={{
                  backgroundColor: '#D1FAE5',
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10
                }}>
                  <MaterialIcons name="category" size={18} color="#059669" />
                </View>
                <Text style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: '#48BB78'
                }}>
                  Categories
                </Text>
                <TouchableOpacity
                  style={{ marginLeft: 'auto' }}
                  onPress={handleSeeAllStandardCategories}
                >
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#059669' }}>
                    See All
                  </Text>
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#F59E0B" />
                </View>
              ) : (
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={standardCategories}
                  keyExtractor={(item) => item.id}
                  renderItem={renderStandardCategoryItem}
                  contentContainerStyle={{ paddingVertical: 10 }}
                />
              )}
            </View>

            {/* Featured Products */}
            <View style={{ marginHorizontal: 16, marginTop: 24, marginBottom: 24 }}>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 12
              }}>
                <View style={{
                  backgroundColor: '#D1FAE5',
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10
                }}>
                  <Ionicons name="star" size={18} color="#48BB78" />
                </View>
                <Text style={{
                  fontSize: 20,
                  fontWeight: 'bold',
                  color: '#48BB78'
                }}>
                  Featured Products
                </Text>
                <TouchableOpacity
                  style={{ marginLeft: 'auto' }}
                  onPress={handleSeeAllFeaturedProducts}
                >
                  <Text style={{ fontSize: 14, fontWeight: '500', color: '#48BB78' }}>
                    See All
                  </Text>
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#F59E0B" />
                </View>
              ) : (
                <FlatList
                  data={standardProducts}
                  renderItem={renderStandardProductItem}
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  scrollEnabled={false}
                  contentContainerStyle={{ paddingTop: 10, paddingBottom: 20 }}
                />
              )}
            </View>
          </Animated.ScrollView>
        )}
      </SafeAreaView>
    </MenuProvider>
  );
}