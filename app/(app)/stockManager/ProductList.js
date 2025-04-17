import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  RefreshControl,
  Animated,
  ActivityIndicator,
  Vibration,
  Platform,
  Dimensions,
  Alert,
  StyleSheet,
  FlatList
} from 'react-native';
import { db } from '../../../firebase/firebaseConfig';
import { collection, getDocs, query, where, orderBy, doc, deleteDoc, writeBatch, updateDoc, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');
const imageSize = 100; // Fixed size for the product image

const ProductList = () => {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortOption, setSortOption] = useState('name');
  const [pressedCardId, setPressedCardId] = useState(null);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productModalAnimation] = useState(new Animated.Value(0));
  const [productBackdropAnimation] = useState(new Animated.Value(0));
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [expiredProducts, setExpiredProducts] = useState([]);
  const [approachingExpiryProducts, setApproachingExpiryProducts] = useState([]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const searchInputAnim = useRef(new Animated.Value(0)).current;
  const sortOptionsAnim = useRef(new Animated.Value(0)).current;
  const selectModeAnim = useRef(new Animated.Value(0)).current;

  // Animated card scale values
  const scaleAnims = useRef({}).current;

  // Initialize scale animations for each product
  useEffect(() => {
    if (products.length > 0) {
      products.forEach(product => {
        if (!scaleAnims[product.id]) {
          scaleAnims[product.id] = new Animated.Value(1);
        }
      });
    }
  }, [products]);

  // Request notification permissions
  useEffect(() => {
    (async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
        });
      }

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
    })();
  }, []);

  // Function to check product expiration
  const checkProductExpiration = useCallback((product) => {
    try {
      const now = new Date();
      const expiryDate = new Date(product.expirationDate);
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

      // Check if the date is valid
      if (isNaN(expiryDate.getTime())) {
        console.warn(`Invalid expiration date for product ${product.id}: ${product.expirationDate}`);
        return { isExpired: false, isApproachingExpiry: false };
      }

      const isExpired = expiryDate <= now;
      const isApproachingExpiry = expiryDate <= threeMonthsFromNow && !isExpired;

      return { isExpired, isApproachingExpiry };
    } catch (error) {
      console.error(`Error checking expiration for product ${product.id}:`, error);
      return { isExpired: false, isApproachingExpiry: false };
    }
  }, []);

  // Function to send notification
  const sendNotification = async (title, body) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: null,
    });
  };

  // Function to update product status
  const updateProductStatus = async (productId, status) => {
    try {
      const productRef = doc(db, 'Products', productId);
      await updateDoc(productRef, {
        status,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating product status:', error);
    }
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchQuery, selectedCategory, sortOption]);

  useEffect(() => {
    if (isSelectMode) {
      setSelectAll(selectedProducts.length === filteredProducts.length && filteredProducts.length > 0);
    }
  }, [selectedProducts, filteredProducts, isSelectMode]);

  // Set up real-time listener for products
  useEffect(() => {
    const productsRef = collection(db, 'Products');
    const q = query(productsRef, where('status', '!=', 'Deleted'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = [];
      snapshot.forEach((doc) => {
        productsData.push({ id: doc.id, ...doc.data() });
      });
      setProducts(productsData);
      setFilteredProducts(productsData);
    });

    return () => unsubscribe();
  }, []);

  // Check products on focus
  useFocusEffect(
    useCallback(() => {
      fetchProducts();
    }, [checkProductExpiration])
  );

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const productsRef = collection(db, 'Products');
      const q = query(productsRef, where('status', '!=', 'Deleted'));
      const querySnapshot = await getDocs(q);

      const productsData = [];
      const expired = [];
      const approachingExpiry = [];

      querySnapshot.forEach((doc) => {
        const product = { id: doc.id, ...doc.data() };
        const { isExpired, isApproachingExpiry } = checkProductExpiration(product);

        if (isExpired && product.status !== 'Expired') {
          expired.push(product);
          updateProductStatus(product.id, 'Expired');
        } else if (isApproachingExpiry && product.status !== 'Approaching Expiry') {
          approachingExpiry.push(product);
          updateProductStatus(product.id, 'Approaching Expiry');
        }

        productsData.push(product);
      });

      setProducts(productsData);
      setFilteredProducts(productsData);
      setExpiredProducts(expired);
      setApproachingExpiryProducts(approachingExpiry);

      // Send notifications for new expired or approaching expiry products
      if (expired.length > 0) {
        sendNotification(
          'Expired Products Alert',
          `${expired.length} product(s) have expired and been removed from active inventory.`
        );
      }

      if (approachingExpiry.length > 0) {
        sendNotification(
          'Products Approaching Expiry',
          `${approachingExpiry.length} product(s) will expire within 3 months.`
        );
      }

    } catch (error) {
      console.error('Error fetching products:', error);
      Alert.alert('Error', 'Failed to fetch products');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "AddCategory"));
      const categoryList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCategories(categoryList);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProducts();
    setRefreshing(false);

    // Provide haptic feedback on refresh completion
    if (Platform.OS === 'ios') {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        Vibration.vibrate(30);
      }
    } else {
      Vibration.vibrate(30);
    }
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.categoryId === selectedCategory);
    }

    // Sort products
    switch (sortOption) {
      case 'name':
        filtered.sort((a, b) => a.productName.localeCompare(b.productName));
        break;
      case 'price_low':
        filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'price_high':
        filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
        break;
      case 'stock_low':
        filtered.sort((a, b) => parseInt(a.stockQuantity) - parseInt(b.stockQuantity));
        break;
      default:
        break;
    }

    setFilteredProducts(filtered);
  };

  const handlePressIn = (id) => {
    if (!scaleAnims[id]) {
      scaleAnims[id] = new Animated.Value(1);
    }

    setPressedCardId(id);

    // Scale down animation
    Animated.spring(scaleAnims[id], {
      toValue: 0.95,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Haptic feedback
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        Vibration.vibrate(20);
      }
    } else {
      Vibration.vibrate(20);
    }
  };

  const handlePressOut = (id) => {
    if (!scaleAnims[id]) {
      scaleAnims[id] = new Animated.Value(1);
    }

    // Scale up animation
    Animated.spring(scaleAnims[id], {
      toValue: 1,
      friction: 8,
      useNativeDriver: true,
    }).start(() => setPressedCardId(null));
  };

  const handleProductPress = (product) => {
    // Add haptic feedback
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        Vibration.vibrate(50);
      }
    } else {
      Vibration.vibrate(50);
    }

    // Set the selected product and show the modal
    setSelectedProduct(product);
    setShowProductModal(true);

    // Animate modal entrance
    Animated.parallel([
      Animated.timing(productBackdropAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(productModalAnimation, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
  };

  const closeProductModal = () => {
    // Animate modal exit
    Animated.parallel([
      Animated.timing(productBackdropAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(productModalAnimation, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowProductModal(false);
      setSelectedProduct(null);
    });
  };

  const handleUpdateProduct = (product) => {
    closeProductModal();

    // Navigate to add product with all product details for editing
    router.push({
      pathname: "/stockManager/addProduct",
      params: {
        editMode: "true",
        id: product.id,
        productName: product.productName,
        description: product.description || "",
        price: product.price.toString(),
        discountPrice: product.discountPrice?.toString() || "",
        hasDiscount: product.hasDiscount ? "true" : "false",
        discountStartDate: product.discountStartDate || "",
        discountEndDate: product.discountEndDate || "",
        stockQuantity: product.stockQuantity?.toString() || "0",
        unitType: product.unitType || "",
        brand: product.brand || "",
        supplier: product.supplier || "",
        categoryId: product.categoryId || "",
        status: product.status || "Active",
        hasSpecialOffer: product.hasSpecialOffer ? "true" : "false",
        specialOfferQuantity: product.specialOfferDetails?.quantity?.toString() || "",
        specialOfferDiscount: product.specialOfferDetails?.discountPercentage?.toString() || "",
        productionDate: product.productionDate || "",
        expirationDate: product.expirationDate || "",
        image: product.image || ""
      }
    });
  };

  const handleDeleteProduct = async (productId) => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product? This action cannot be undone.",
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
              // Delete from Firestore
              const productRef = doc(db, "Products", productId);
              await deleteDoc(productRef);

              // Update local state by removing the deleted product
              setProducts(products.filter(p => p.id !== productId));
              setFilteredProducts(filteredProducts.filter(p => p.id !== productId));

              // Close the modal
              closeProductModal();

              // Show success message
              Alert.alert("Success", "Product has been successfully deleted.");

              // Provide haptic feedback
              if (Platform.OS === 'ios') {
                try {
                  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } catch (e) {
                  Vibration.vibrate(50);
                }
              } else {
                Vibration.vibrate(50);
              }
            } catch (error) {
              console.error("Error deleting product:", error);
              Alert.alert("Error", "Failed to delete product. Please try again.");
            }
          }
        }
      ]
    );
  };

  const toggleSortOptions = () => {
    setShowSortOptions(!showSortOptions);

    Animated.timing(sortOptionsAnim, {
      toValue: showSortOptions ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Vibrate
    Vibration.vibrate(20);
  };

  const handleSearchFocus = () => {
    Animated.timing(searchInputAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleSearchBlur = () => {
    Animated.timing(searchInputAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.categoryName : 'Uncategorized';
  };

  const toggleSelectMode = () => {
    if (isSelectMode) {
      // Exit select mode
      setIsSelectMode(false);
      setSelectedProducts([]);
      setSelectAll(false);

      // Animate out
      Animated.timing(selectModeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      // Enter select mode
      setIsSelectMode(true);

      // Animate in
      Animated.timing(selectModeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }

    // Haptic feedback
    Vibration.vibrate(30);
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
    setSelectAll(!selectAll);

    // Haptic feedback
    Vibration.vibrate(20);
  };

  const toggleProductSelection = (productId) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }

    // Haptic feedback
    Vibration.vibrate(10);
  };

  const deleteSelectedProducts = async () => {
    if (selectedProducts.length === 0) {
      Alert.alert("No Products Selected", "Please select products to delete.");
      return;
    }

    Alert.alert(
      "Delete Selected Products",
      `Are you sure you want to delete ${selectedProducts.length} product${selectedProducts.length > 1 ? 's' : ''}? This action cannot be undone.`,
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
              // Create a batch for multiple deletions
              const batch = writeBatch(db);

              // Add all delete operations to the batch
              selectedProducts.forEach(productId => {
                const productRef = doc(db, "Products", productId);
                batch.delete(productRef);
              });

              // Commit the batch
              await batch.commit();

              // Update local state by removing the deleted products
              setProducts(products.filter(p => !selectedProducts.includes(p.id)));
              setFilteredProducts(filteredProducts.filter(p => !selectedProducts.includes(p.id)));

              // Exit select mode
              setIsSelectMode(false);
              setSelectedProducts([]);
              setSelectAll(false);

              // Animate out select mode
              Animated.timing(selectModeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }).start();

              // Show success message
              Alert.alert("Success", `${selectedProducts.length} product${selectedProducts.length > 1 ? 's' : ''} has been successfully deleted.`);

              // Provide haptic feedback
              if (Platform.OS === 'ios') {
                try {
                  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } catch (e) {
                  Vibration.vibrate(50);
                }
              } else {
                Vibration.vibrate(50);
              }
            } catch (error) {
              console.error("Error deleting products:", error);
              Alert.alert("Error", "Failed to delete products. Please try again.");
            }
          }
        }
      ]
    );
  };

  const renderProductCard = (product) => {
    const discountedPrice = product.hasDiscount ? product.discountPrice : null;
    const isLowStock = product.stockQuantity < 10;
    const isActive = product.status === 'Active';
    const hasSpecialOffer = product.hasSpecialOffer && product.specialOfferDetails;
    const isSelected = selectedProducts.includes(product.id);

    return (
      <Animated.View
        key={product.id}
        style={{
          width: '100%',
          transform: [{ scale: scaleAnims[product.id] }],
        }}
        className="mb-3"
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onPressIn={() => handlePressIn(product.id)}
          onPressOut={() => handlePressOut(product.id)}
          onPress={() => isSelectMode ? toggleProductSelection(product.id) : handleProductPress(product)}
          className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100"
        >
          <View className="flex-row p-3">
            {/* Selection Checkbox */}
            {isSelectMode && (
              <View className="justify-center mr-2">
                <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                  {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
                </View>
              </View>
            )}

            {/* Product Image - Left Side */}
            <View className="relative" style={{ width: imageSize, height: imageSize }}>
              <View className="w-full h-full rounded-lg overflow-hidden bg-gray-50">
                {product.image ? (
                  <Image
                    source={{ uri: product.image }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="w-full h-full items-center justify-center">
                    <Ionicons name="image-outline" size={40} color="#d1d5db" />
                  </View>
                )}
              </View>

              {/* Status Badge */}
              {!isActive && (
                <View className="absolute top-1 left-1 bg-gray-800/70 rounded-full px-2 py-0.5">
                  <Text className="text-white text-[10px] font-medium">Inactive</Text>
                </View>
              )}

              {/* Discount Badge */}
              {discountedPrice && (
                <View className="absolute top-1 right-1 bg-red-500 rounded-full px-2 py-0.5">
                  <Text className="text-white text-[10px] font-bold">
                    {Math.round((1 - parseFloat(discountedPrice) / parseFloat(product.price)) * 100)}% OFF
                  </Text>
                </View>
              )}
            </View>

            {/* Product Info - Right Side */}
            <View className="flex-1 pl-3 justify-between">
              <View>
                {/* Category & Date */}
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-xs text-indigo-600 font-medium">
                    {getCategoryName(product.categoryId)}
                  </Text>
                  {product.dateAdded && (
                    <Text className="text-xs text-gray-400">
                      {new Date(product.dateAdded).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </Text>
                  )}
                </View>

                {/* Product Name */}
                <Text className="font-semibold text-gray-800 mb-1" numberOfLines={1}>
                  {product.productName}
                </Text>

                {/* Description */}
                {product.description && (
                  <Text className="text-xs text-gray-500 mb-1" numberOfLines={1}>
                    {product.description}
                  </Text>
                )}

                {/* Price */}
                <View className="flex-row items-center mb-1">
                  {discountedPrice ? (
                    <>
                      <Text className="font-bold text-indigo-600 mr-2">
                        ETB {parseFloat(discountedPrice).toFixed(2)}
                      </Text>
                      <Text className="text-xs text-gray-500 line-through">
                        ETB {parseFloat(product.price).toFixed(2)}
                      </Text>
                    </>
                  ) : (
                    <Text className="font-bold text-indigo-600">
                      ETB {parseFloat(product.price).toFixed(2)}
                    </Text>
                  )}
                </View>
              </View>

              {/* Bottom Row: Stock Info & Special Offer */}
              <View className="flex-row justify-between items-center mt-1">
                <View className="flex-row flex-wrap">
                  <View className={`flex-row items-center ${isLowStock ? 'bg-red-50' : 'bg-gray-50'} px-2 py-1 rounded-full mr-1`}>
                    <Ionicons
                      name={isLowStock ? "alert-circle" : "cube-outline"}
                      size={12}
                      color={isLowStock ? "#ef4444" : "#6b7280"}
                      className="mr-1"
                    />
                    <Text className={`text-xs ${isLowStock ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      {product.stockQuantity} {product.unitType || 'units'}
                    </Text>
                  </View>

                  {hasSpecialOffer && (
                    <View className="flex-row items-center bg-indigo-50 px-2 py-1 rounded-full">
                      <Ionicons name="pricetag" size={12} color="#4f46e5" className="mr-1" />
                      <Text className="text-xs text-indigo-600">
                        Buy {product.specialOfferDetails.quantity}+: {product.specialOfferDetails.discountPercentage}% off
                      </Text>
                    </View>
                  )}
                </View>

                <View className="w-7 h-7 bg-gray-50 rounded-full justify-center items-center">
                  <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderSortOptions = () => {
    const options = [
      { value: 'name', label: 'Name (A-Z)', icon: 'text' },
      { value: 'price_low', label: 'Price (Low to High)', icon: 'trending-down' },
      { value: 'price_high', label: 'Price (High to Low)', icon: 'trending-up' },
      { value: 'newest', label: 'Newest First', icon: 'time' },
      { value: 'stock_low', label: 'Low Stock First', icon: 'alert-circle' }
    ];

    const sortOptionsHeight = sortOptionsAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 215]
    });

    return (
      <Animated.View
        className="bg-white rounded-xl shadow-md mt-2 overflow-hidden absolute right-4 top-14 z-50 border border-gray-100"
        style={{
          width: 220,
          height: sortOptionsHeight,
          opacity: sortOptionsAnim
        }}
      >
        {options.map((option, index) => (
          <TouchableOpacity
            key={option.value}
            className={`py-3 px-4 flex-row items-center ${index !== options.length - 1 ? 'border-b border-gray-100' : ''}`}
            onPress={() => {
              setSortOption(option.value);
              setShowSortOptions(false);
              sortOptionsAnim.setValue(0);
              Vibration.vibrate(20);
            }}
          >
            <Ionicons
              name={option.icon}
              size={16}
              color={sortOption === option.value ? "#4f46e5" : "#6b7280"}
              className="mr-2"
            />
            <Text
              className={`flex-1 ${sortOption === option.value ? 'text-indigo-600 font-medium' : 'text-gray-700'}`}
            >
              {option.label}
            </Text>
            {sortOption === option.value && (
              <Ionicons name="checkmark" size={16} color="#4f46e5" />
            )}
          </TouchableOpacity>
        ))}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />

      {/* Header */}
      <Animated.View
        className="px-4 py-4 bg-white border-b border-gray-200 shadow-sm"
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }]
        }}
      >
        <View className="flex-row justify-between items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-100 justify-center items-center"
          >
            <Ionicons name="arrow-back" size={20} color="#4b5563" />
          </TouchableOpacity>

          <Text className="text-xl font-bold text-gray-800">Product List</Text>

          <TouchableOpacity
            onPress={toggleSelectMode}
            className="w-10 h-10 rounded-full bg-indigo-100 justify-center items-center"
          >
            <Ionicons name={isSelectMode ? "close" : "checkmark-done"} size={20} color="#4f46e5" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Select Mode Header */}
      <Animated.View
        className="bg-indigo-600 px-4 py-3 flex-row justify-between items-center"
        style={{
          opacity: selectModeAnim,
          transform: [
            {
              translateY: selectModeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 0]
              })
            }
          ],
          display: isSelectMode ? 'flex' : 'none'
        }}
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={toggleSelectAll}
            className="flex-row items-center"
          >
            <View className={`w-5 h-5 rounded-full border-2 items-center justify-center mr-2 ${selectAll ? 'bg-white border-white' : 'border-white'}`}>
              {selectAll && <Ionicons name="checkmark" size={14} color="#4f46e5" />}
            </View>
            <Text className="text-white font-medium">Select All</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center">
          <Text className="text-white mr-4">
            {selectedProducts.length} selected
          </Text>
          <TouchableOpacity
            onPress={deleteSelectedProducts}
            className="bg-red-500 px-4 py-1.5 rounded-full flex-row items-center"
            disabled={selectedProducts.length === 0}
          >
            <Ionicons name="trash-outline" size={16} color="white" />
            <Text className="text-white font-medium ml-1">Delete</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Search & Filter Row */}
      <Animated.View
        className="px-4 pt-4 pb-2 flex-row justify-between items-center z-40"
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }]
        }}
      >
        <Animated.View
          className="flex-1 mr-4"
          style={{
            transform: [
              {
                scale: searchInputAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 1.02]
                })
              }
            ]
          }}
        >
          <View className="relative">
            <TextInput
              className="bg-white border border-gray-200 rounded-lg px-4 py-2 pl-10 text-gray-700 shadow-sm"
              placeholder="Search products..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
            />
            <Ionicons
              name="search"
              size={18}
              color="#9ca3af"
              style={{ position: 'absolute', left: 12, top: 12 }}
            />
          </View>
        </Animated.View>

        <View className="relative">
          <TouchableOpacity
            className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm"
            onPress={toggleSortOptions}
          >
            <FontAwesome5 name="sort" size={18} color="#4b5563" />
          </TouchableOpacity>

          {showSortOptions && renderSortOptions()}
        </View>
      </Animated.View>

      {/* Category Filters */}
      <Animated.View
        className="px-4 pt-1 pb-4"
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }]
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="flex-row"
        >
          <TouchableOpacity
            onPress={() => {
              setSelectedCategory('all');
              Vibration.vibrate(20);
            }}
            className={`mr-2 px-4 py-2 rounded-full border ${selectedCategory === 'all' ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-200'}`}
          >
            <Text className={`text-sm font-medium ${selectedCategory === 'all' ? 'text-white' : 'text-gray-600'}`}>
              All
            </Text>
          </TouchableOpacity>

          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              onPress={() => {
                setSelectedCategory(category.id);
                Vibration.vibrate(20);
              }}
              className={`mr-2 px-4 py-2 rounded-full border ${selectedCategory === category.id ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-200'}`}
            >
              <Text className={`text-sm font-medium ${selectedCategory === category.id ? 'text-white' : 'text-gray-600'}`}>
                {category.categoryName}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Product List */}
      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text className="text-gray-500 mt-4">Loading products...</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4f46e5', '#4338ca']}
              tintColor="#4f46e5"
            />
          }
        >
          {filteredProducts.length > 0 ? (
            <View className="mt-2 pb-6">
              {filteredProducts.map(product => renderProductCard(product))}
            </View>
          ) : (
            <View className="flex-1 justify-center items-center py-12">
              <Ionicons name="search-outline" size={48} color="#d1d5db" />
              <Text className="text-gray-400 mt-4 text-base font-medium">No products found</Text>
              <Text className="text-gray-400 text-sm text-center mt-2 mx-8">
                Try adjusting your search or filters to find what you're looking for.
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSortOption('name');
                }}
                className="mt-6 bg-indigo-100 px-4 py-2 rounded-lg"
              >
                <Text className="text-indigo-600 font-medium">Reset Filters</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Products Found Count */}
          {filteredProducts.length > 0 && (
            <View className="pb-6 pt-2">
              <Text className="text-center text-gray-500 text-xs">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} found
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* FAB - Add Product */}
      <TouchableOpacity
        onPress={() => router.push("/stockManager/addProduct")}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full shadow-lg z-50"
        style={{ elevation: 4 }}
      >
        <LinearGradient
          colors={['#4f46e5', '#4338ca']}
          className="w-full h-full rounded-full justify-center items-center"
        >
          <Ionicons name="add" size={30} color="#ffffff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Product Detail Modal */}
      {showProductModal && selectedProduct && (
        <View className="absolute inset-0 justify-center items-center z-50">
          <Animated.View
            className="absolute inset-0 bg-black/50"
            style={{ opacity: productBackdropAnimation }}
            onTouchStart={closeProductModal}
          />

          <Animated.View
            className="w-[90%] bg-white rounded-2xl overflow-hidden"
            style={{
              transform: [
                {
                  scale: productModalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1]
                  })
                },
                {
                  translateY: productModalAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0]
                  })
                }
              ],
              opacity: productModalAnimation,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 10,
              maxHeight: height * 0.85
            }}
          >
            <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
              {/* Modal Header with Product Image */}
              <View className="relative">
                {selectedProduct.image ? (
                  <Image
                    source={{ uri: selectedProduct.image }}
                    className="w-full h-60 bg-gray-100"
                    resizeMode="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={['#f3f4f6', '#e5e7eb']}
                    className="w-full h-60 items-center justify-center"
                  >
                    <Ionicons name="image-outline" size={60} color="#9ca3af" />
                    <Text className="text-gray-400 mt-2">No image available</Text>
                  </LinearGradient>
                )}

                {/* Close button */}
                <TouchableOpacity
                  className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/30 items-center justify-center"
                  style={{ backdropFilter: 'blur(2px)' }}
                  onPress={closeProductModal}
                >
                  <Ionicons name="close" size={22} color="#ffffff" />
                </TouchableOpacity>

                {/* Product status badge */}
                <View
                  className={`absolute top-4 left-4 px-3 py-1.5 rounded-full ${selectedProduct.status === 'Active' ? 'bg-green-500/90' : 'bg-gray-500/90'
                    }`}
                >
                  <Text className="text-white text-xs font-semibold">
                    {selectedProduct.status || 'Unknown'}
                  </Text>
                </View>

                {/* Discount Badge */}
                {selectedProduct.hasDiscount && selectedProduct.discountPrice && (
                  <View className="absolute bottom-4 right-4 bg-red-500/90 px-3 py-1.5 rounded-full flex-row items-center">
                    <FontAwesome5 name="tags" size={12} color="white" style={{ marginRight: 4 }} />
                    <Text className="text-white text-xs font-bold">
                      {Math.round((1 - parseFloat(selectedProduct.discountPrice) / parseFloat(selectedProduct.price)) * 100)}% OFF
                    </Text>
                  </View>
                )}
              </View>

              {/* Product Info Header */}
              <View className="p-5">
                <Text className="text-2xl font-bold text-gray-800 mb-1">
                  {selectedProduct.productName}
                </Text>

                <View className="flex-row items-center mb-3">
                  <View className="px-2.5 py-1 bg-indigo-100 rounded-full mr-2">
                    <Text className="text-xs font-medium text-indigo-700">
                      {getCategoryName(selectedProduct.categoryId) || "Uncategorized"}
                    </Text>
                  </View>

                  {selectedProduct.brand && (
                    <View className="px-2.5 py-1 bg-blue-50 rounded-full">
                      <Text className="text-xs font-medium text-blue-700">
                        {selectedProduct.brand}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Pricing Information */}
                <View className="flex-row items-center mb-4">
                  {selectedProduct.hasDiscount && selectedProduct.discountPrice ? (
                    <>
                      <Text className="text-2xl font-bold text-indigo-600">
                        ETB {parseFloat(selectedProduct.discountPrice).toFixed(2)}
                      </Text>
                      <Text className="text-base text-gray-400 line-through ml-2">
                        ETB {parseFloat(selectedProduct.price).toFixed(2)}
                      </Text>
                    </>
                  ) : (
                    <Text className="text-2xl font-bold text-indigo-600">
                      ETB {parseFloat(selectedProduct.price).toFixed(2)}
                    </Text>
                  )}

                  {selectedProduct.unitType && (
                    <Text className="text-gray-500 ml-2">/ {selectedProduct.unitType}</Text>
                  )}
                </View>

                {/* Discount Date Period */}
                {selectedProduct.hasDiscount && selectedProduct.discountStartDate && selectedProduct.discountEndDate && (
                  <View className="bg-red-50 p-3 rounded-lg mb-4 flex-row items-center">
                    <Ionicons name="calendar" size={16} color="#ef4444" className="mr-2" />
                    <Text className="text-red-600 text-xs">
                      Sale period: {selectedProduct.discountStartDate} to {selectedProduct.discountEndDate}
                    </Text>
                  </View>
                )}

                {/* Description Card */}
                <View className="bg-gray-50 rounded-xl p-4 mb-4">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="information-circle" size={18} color="#4b5563" />
                    <Text className="text-base font-semibold text-gray-700 ml-2">Description</Text>
                  </View>
                  <Text className="text-gray-600">
                    {selectedProduct.description || "No description available"}
                  </Text>
                </View>

                {/* Inventory Information */}
                <View className="bg-blue-50 rounded-xl p-4 mb-4">
                  <View className="flex-row items-center mb-3">
                    <Ionicons name="cube" size={18} color="#1e40af" />
                    <Text className="text-base font-semibold text-blue-700 ml-2">Inventory</Text>
                  </View>

                  <View className="flex-row flex-wrap">
                    <View className="w-1/2 mb-3 pr-2">
                      <Text className="text-xs text-blue-900 mb-1">Current Stock</Text>
                      <View className="flex-row items-center">
                        <Text className="text-base font-semibold text-gray-700">
                          {selectedProduct.stockQuantity || 0} {selectedProduct.unitType || 'units'}
                        </Text>
                        {parseInt(selectedProduct.stockQuantity) < 10 && (
                          <View className="ml-2 px-2 py-0.5 bg-red-100 rounded-full">
                            <Text className="text-xs font-medium text-red-600">Low</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {selectedProduct.supplier && (
                      <View className="w-1/2 mb-3 pl-2">
                        <Text className="text-xs text-blue-900 mb-1">Supplier</Text>
                        <Text className="text-base font-semibold text-gray-700">{selectedProduct.supplier}</Text>
                      </View>
                    )}

                    {selectedProduct.productionDate && (
                      <View className="w-1/2 pr-2">
                        <Text className="text-xs text-blue-900 mb-1">Production Date</Text>
                        <Text className="text-base font-semibold text-gray-700">{selectedProduct.productionDate}</Text>
                      </View>
                    )}

                    {selectedProduct.expirationDate && (
                      <View className="w-1/2 pl-2">
                        <Text className="text-xs text-blue-900 mb-1">Expiration Date</Text>
                        <Text className="text-base font-semibold text-gray-700">{selectedProduct.expirationDate}</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Special Offer */}
                {selectedProduct.hasSpecialOffer && selectedProduct.specialOfferDetails && (
                  <View className="bg-amber-50 rounded-xl p-4 mb-4">
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="pricetag" size={18} color="#b45309" />
                      <Text className="text-base font-semibold text-amber-700 ml-2">Special Offer</Text>
                    </View>

                    <View className="bg-amber-100 p-3 rounded-lg">
                      <Text className="text-amber-700 font-medium text-center">
                        Buy {selectedProduct.specialOfferDetails.quantity}+ units and get {selectedProduct.specialOfferDetails.discountPercentage}% off!
                      </Text>

                      {selectedProduct.price && (
                        <View className="flex-row justify-center items-center mt-1 pt-1 border-t border-amber-200">
                          <Text className="text-xs text-amber-600">Regular:</Text>
                          <Text className="text-xs font-medium text-amber-800 mx-1">
                            ETB {parseFloat(selectedProduct.price).toFixed(2)}
                          </Text>
                          <Text className="text-xs text-amber-600">→</Text>
                          <Text className="text-xs font-medium text-amber-800 mx-1">
                            ETB {(parseFloat(selectedProduct.price) * (1 - selectedProduct.specialOfferDetails.discountPercentage / 100)).toFixed(2)}
                          </Text>
                          <Text className="text-xs text-amber-600">per unit</Text>
                        </View>
                      )}
                    </View>
                  </View>
                )}

                {/* Meta Information */}
                <View className="bg-gray-50 rounded-xl p-4 mb-4">
                  <View className="flex-row items-center mb-3">
                    <Ionicons name="time-outline" size={18} color="#4b5563" />
                    <Text className="text-base font-semibold text-gray-700 ml-2">Product Information</Text>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <Text className="text-xs text-gray-500">Added:</Text>
                    <Text className="text-xs text-gray-700">
                      {selectedProduct.dateAdded ? new Date(selectedProduct.dateAdded).toLocaleString() : 'Unknown'}
                    </Text>
                  </View>

                  <View className="flex-row justify-between items-center mt-2">
                    <Text className="text-xs text-gray-500">Last Updated:</Text>
                    <Text className="text-xs text-gray-700">
                      {selectedProduct.lastUpdated ? new Date(selectedProduct.lastUpdated).toLocaleString() : 'Unknown'}
                    </Text>
                  </View>

                  <View className="flex-row justify-between items-center mt-2">
                    <Text className="text-xs text-gray-500">Product ID:</Text>
                    <Text className="text-xs text-gray-700">{selectedProduct.id || 'Unknown'}</Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row space-x-4 mt-2 mb-2">
                  <TouchableOpacity
                    onPress={() => handleDeleteProduct(selectedProduct.id)}
                    className="flex-1 py-3.5 rounded-xl border border-gray-300 flex-row justify-center items-center"
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    <Text className="text-red-500 font-medium ml-2">Delete</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleUpdateProduct(selectedProduct)}
                    className="flex-1 py-3.5 rounded-xl bg-indigo-600 flex-row justify-center items-center"
                  >
                    <Ionicons name="create-outline" size={18} color="white" />
                    <Text className="text-white font-medium ml-2">Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    overflow: 'hidden',
  },
  expiredCard: {
    opacity: 0.7,
    backgroundColor: '#ffebee',
  },
  approachingExpiryCard: {
    borderColor: '#ffa000',
    borderWidth: 2,
  },
  productList: {
    padding: 10,
  },
});

export default ProductList;