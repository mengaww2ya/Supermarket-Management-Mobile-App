import React, { useState, useEffect, useRef } from "react";
import { 
  ScrollView, 
  SafeAreaView, 
  View, 
  Text, 
  Pressable, 
  Image, 
  TouchableOpacity, 
  Dimensions, 
  StatusBar, 
  ActivityIndicator,
  Platform,
  Animated,
  Alert,
  Vibration,
  RefreshControl
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { db } from '../../../../firebase/firebaseConfig';
import { collection, getDocs, query, where, limit, orderBy } from 'firebase/firestore';
import { FadeIn } from "react-native-reanimated";
import * as Haptics from 'expo-haptics';
import HomeHeader from '../../../components/HomeHeader';

const { width, height } = Dimensions.get("window");

// Menu options with extended data for better UI
const menuOptions = [
  { 
    name: "Stock Management", 
    route: "/stockManager/Manage_stock_levels", 
    icon: "inventory", 
    iconType: "MaterialIcons",
    bgColor: ["#4F46E5", "#6366F1"],
    description: "Manage inventory levels, restock, and audit your stock"
  },
  { 
    name: "Product Management", 
    route: "/stockManager/ProductList", 
    icon: "cube-outline", 
    iconType: "Ionicons",
    bgColor: ["#4F46E5", "#6366F1"],
    description: "View and modify product details, pricing, and images"
  },
  { 
    name: "Categories", 
    route: "/stockManager/ViewCategory", 
    icon: "tag", 
    iconType: "FontAwesome5",
    bgColor: ["#4F46E5", "#6366F1"],
    description: "Manage product categories and classification"
  },
  { 
    name: "Add New Product", 
    route: "/stockManager/addProduct", 
    icon: "add-box", 
    iconType: "MaterialIcons",
    bgColor: ["#4F46E5", "#6366F1"],
    description: "Add new products to your inventory system"
  },
  { 
    name: "Low Stock Alerts", 
    route: "/stockManager/Low-stock alerts", 
    icon: "alert-circle-outline", 
    iconType: "Ionicons",
    bgColor: ["#4F46E5", "#6366F1"],
    description: "View products that need to be restocked soon"
  },
  { 
    name: "Supplier Orders", 
    route: "/stockManager/Supplier order management", 
    icon: "truck-delivery", 
    iconType: "MaterialCommunityIcons",
    bgColor: ["#4F46E5", "#6366F1"],
    description: "Manage orders from suppliers and deliveries"
  },
];

// Stock management options from Manage_stock_levels.js
const stockOptions = [
  { 
    title: "Add Product",
    description: "Create new products with images and inventory data",
    route: "/stockManager/addProduct", 
    icon: "add-circle", 
    iconType: "Ionicons",
    color: ["#f8fafc", "#e0e7ff"],
    textColor: "#4338ca"
  },
  { 
    title: "Product List",
    description: "View and manage all products in inventory",
    route: "/stockManager/ProductList", 
    icon: "view-list", 
    iconType: "MaterialIcons",
    color: ["#f8fafc", "#e0f2fe"],
    textColor: "#0369a1",
    badge: "Products"
  },
  { 
    title: "Add Category",
    description: "Create new categories for better organization",
    route: "/stockManager/addCategory", 
    icon: "pricetag", 
    iconType: "Ionicons",
    color: ["#f8fafc", "#ffedd5"],
    textColor: "#9a3412",
  },
  { 
    title: "Category List",
    description: "Manage all product categories and classification",
    route: "/stockManager/ViewCategory", 
    icon: "albums", 
    iconType: "Ionicons",
    color: ["#f8fafc", "#f3e8ff"],
    textColor: "#6b21a8",
    badge: "Categories"
  },
  { 
    title: "Low Stock Alerts",
    description: "View products that need to be restocked soon",
    route: "/stockManager/Low-stock alerts", 
    icon: "alert-circle", 
    iconType: "Ionicons",
    color: ["#f8fafc", "#fee2e2"],
    textColor: "#b91c1c",
    badge: "Alerts",
    alertType: true
  },
  { 
    title: "Supplier Orders",
    description: "Manage orders from suppliers and deliveries",
    route: "/stockManager/Supplier_order_management", 
    icon: "truck-delivery", 
    iconType: "MaterialCommunityIcons",
    color: ["#f8fafc", "#dcfce7"],
    textColor: "#15803d"
  },
];

// Quick action buttons from Manage_stock_levels.js
const quickActions = [
  {
    title: "Scan Barcode",
    icon: "barcode-scan",
    iconType: "MaterialCommunityIcons",
    color: "#e0e7ff",
    textColor: "#4338ca",
    action: () => Alert.alert("Scan Barcode", "Barcode scanner will open here")
  },
  {
    title: "Check Price",
    icon: "pricetag",
    iconType: "Ionicons",
    color: "#ffedd5",
    textColor: "#9a3412",
    action: () => Alert.alert("Price Check", "Price checker will open here")
  },
  {
    title: "Restock",
    icon: "archive",
    iconType: "Ionicons",
    color: "#dcfce7",
    textColor: "#15803d",
    action: () => Alert.alert("Restock", "Restock workflow will start here")
  },
  {
    title: "Export",
    icon: "share",
    iconType: "Ionicons",
    color: "#e0f2fe",
    textColor: "#0369a1",
    action: () => Alert.alert("Export Data", "Export inventory data options will appear here")
  },
];

// Remove quickActions array completely and add recentActivities array
const recentActivities = [
  {
    type: 'stock_added',
    title: 'Stock Added',
    description: 'New inventory received',
    icon: 'archive',
    iconType: 'Ionicons',
    color: '#dcfce7',
    textColor: '#15803d',
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    details: {
      productName: 'Organic Bananas',
      quantity: 50,
      supplier: 'FreshFarm Produce'
    }
  },
  {
    type: 'price_change',
    title: 'Price Changed',
    description: 'Product price updated',
    icon: 'attach-money',
    iconType: 'MaterialIcons',
    color: '#e0f2fe',
    textColor: '#0369a1',
    timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
    details: {
      productName: 'Whole Wheat Bread',
      oldPrice: 3.99,
      newPrice: 4.29,
      reason: 'Supplier cost increase'
    }
  },
  {
    type: 'low_stock',
    title: 'Low Stock Alert',
    description: 'Products need restocking',
    icon: 'warning',
    iconType: 'Ionicons',
    color: '#fee2e2',
    textColor: '#b91c1c',
    timestamp: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
    details: {
      productName: 'Fresh Milk 1L',
      currentStock: 5,
      minimumRequired: 10
    }
  },
  {
    type: 'category_added',
    title: 'Category Added',
    description: 'New product category created',
    icon: 'category',
    iconType: 'MaterialIcons',
    color: '#f3e8ff',
    textColor: '#6b21a8',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
    details: {
      categoryName: 'Gluten-Free Products',
      products: 12
    }
  },
  {
    type: 'order_placed',
    title: 'Order Placed',
    description: 'Supplier order submitted',
    icon: 'truck-delivery',
    iconType: 'MaterialCommunityIcons',
    color: '#ffedd5',
    textColor: '#9a3412',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8), // 8 hours ago
    details: {
      supplier: 'Metro Wholesalers',
      orderTotal: 1285.99,
      items: 28
    }
  }
];

export default function StockManagerHome() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    categories: 0,
    recentlyAdded: []
  });
  const [greeting, setGreeting] = useState("Good morning");
  const [animatedValue] = useState(new Animated.Value(0));
  
  // Add new animation values for enhanced interactivity
  const [pulseAnim] = useState(new Animated.Value(1));
  const [headerHeight] = useState(new Animated.Value(140));
  const [scrollY] = useState(new Animated.Value(0));
  const [refreshRotate] = useState(new Animated.Value(0));
  
  // Add state for selected category filter
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showingFilters, setShowingFilters] = useState(false);
  const [pressedOptionIndex, setPressedOptionIndex] = useState(null);
  
  // Animation values from Manage_stock_levels.js
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const refreshIconAnim = useRef(new Animated.Value(0)).current;
  
  // Create state for menu options animations - fix for the hooks error
  const [menuCardScales] = useState(() => 
    menuOptions.map(() => new Animated.Value(1))
  );
  const [menuCardPressed, setMenuCardPressed] = useState(() => 
    menuOptions.map(() => false)
  );
  
  // Animation values for stock options - from Manage_stock_levels.js
  const [stockOptionScales] = useState(() => 
    stockOptions.map(() => new Animated.Value(1))
  );
  const [stockOptionPressed, setStockOptionPressed] = useState(() => 
    stockOptions.map(() => false)
  );
  
  // Animation values for quick actions
  const [quickActionScales] = useState(() => 
    quickActions.map(() => new Animated.Value(1))
  );
  
  // Create state for product card animations
  const [productCardScales, setProductCardScales] = useState([]);

  // Add state for recent activities
  const [activityData, setActivityData] = useState(recentActivities);
  const [activityFilter, setActivityFilter] = useState('all');
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [activityCardScales] = useState(() => 
    recentActivities.map(() => new Animated.Value(1))
  );
  
  // Add state for activity modal
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [modalAnimation] = useState(new Animated.Value(0));
  const [backdropAnimation] = useState(new Animated.Value(0));
  
  // Add selectedProduct state right after selectedActivity state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productModalAnimation] = useState(new Animated.Value(0));
  const [productBackdropAnimation] = useState(new Animated.Value(0));
  
  // Add pulse animation
  useEffect(() => {
    // Start entrance animations from Manage_stock_levels.js
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
    
    // Pulse animation
    const pulseTiming = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ]).start(() => {
        // Repeat the pulse animation
        setTimeout(pulseTiming, 3000);
      });
    };
    
    pulseTiming();
    
    return () => {
      // Clean up animations when unmounting
      pulseAnim.stopAnimation();
      fadeAnim.stopAnimation();
      translateAnim.stopAnimation();
      scaleAnim.stopAnimation();
    };
  }, []);

  // Set up product card animations when data changes
  useEffect(() => {
    if (stats.recentlyAdded.length > 0) {
      setProductCardScales(stats.recentlyAdded.map(() => new Animated.Value(1)));
    }
  }, [stats.recentlyAdded]);

  // Add these new functions to handle animations
  const handleMenuCardPressIn = (index) => {
    const newPressedState = [...menuCardPressed];
    newPressedState[index] = true;
    setMenuCardPressed(newPressedState);
    
    Animated.spring(menuCardScales[index], {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };
  
  const handleMenuCardPressOut = (index) => {
    const newPressedState = [...menuCardPressed];
    newPressedState[index] = false;
    setMenuCardPressed(newPressedState);
    
    Animated.spring(menuCardScales[index], {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };
  
  // Handle stock option press with animation - from Manage_stock_levels.js
  const handleStockOptionPress = (index, route) => {
    // Set the pressed index for visual feedback
    const newPressedState = [...stockOptionPressed];
    newPressedState[index] = true;
    setStockOptionPressed(newPressedState);
    
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      // Use Haptic feedback on iOS
      try {
        require('expo-haptics').impactAsync(require('expo-haptics').ImpactFeedbackStyle.Light);
      } catch (e) {
        // Fallback to basic vibration if haptics not available
        Vibration.vibrate(40);
      }
    } else {
      // Use vibration on Android
      Vibration.vibrate(40);
    }
    
    // Animate the pressed option
    Animated.sequence([
      Animated.spring(stockOptionScales[index], {
        toValue: 0.95,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(stockOptionScales[index], {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
    
    // Navigate to the route
    setTimeout(() => {
      const newPressedState = [...stockOptionPressed];
      newPressedState[index] = false;
      setStockOptionPressed(newPressedState);
      router.push(route);
    }, 300);
  };
  
  // Handle quick action press
  const handleQuickActionPress = (index, action) => {
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      try {
        require('expo-haptics').impactAsync(require('expo-haptics').ImpactFeedbackStyle.Light);
      } catch (e) {
        Vibration.vibrate(40);
      }
    } else {
      Vibration.vibrate(40);
    }
    
    // Animate the pressed action
    Animated.sequence([
      Animated.spring(quickActionScales[index], {
        toValue: 0.9,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(quickActionScales[index], {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
    
    // Execute the action
    action();
  };
  
  const handleProductCardPressIn = (index) => {
    if (productCardScales[index]) {
      Animated.spring(productCardScales[index], {
        toValue: 0.96,
        useNativeDriver: true,
        speed: 20,
        bounciness: 6,
      }).start();
    }
  };
  
  const handleProductCardPressOut = (index) => {
    if (productCardScales[index]) {
      Animated.spring(productCardScales[index], {
        toValue: 1,
        useNativeDriver: true,
        speed: 20,
        bounciness: 6,
      }).start();
    }
  };
  
  // Function to handle refresh animation from Manage_stock_levels.js
  const handleRefresh = () => {
    Vibration.vibrate(20);
    setRefreshing(true);
    
    Animated.sequence([
      Animated.timing(refreshIconAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.timing(refreshIconAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true
      })
    ]).start();
    
    // Start shimmer animation
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
    
    // Fetch fresh data
    fetchDashboardData(true);
  };

  // Get time-based greeting
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    // Start animation
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Fetch dashboard data
  const fetchDashboardData = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) {
        setLoading(true);
      }
      
      // Get total products
      const productsSnapshot = await getDocs(collection(db, "Products"));
      const totalProducts = productsSnapshot.size;
      
      // Get low stock items (less than 10 units)
      const lowStockQuery = query(
        collection(db, "Products"),
        where("stockQuantity", "<", 10)
      );
      const lowStockSnapshot = await getDocs(lowStockQuery);
      const lowStockItems = lowStockSnapshot.size;
      
      // Get categories
      const categoriesSnapshot = await getDocs(collection(db, "AddCategory"));
      const totalCategories = categoriesSnapshot.size;
      
      // Get recently added products
      const recentProductsQuery = query(
        collection(db, "Products"),
        orderBy("createdAt", "desc"),
        limit(5)
      );
      const recentProductsSnapshot = await getDocs(recentProductsQuery);
      const recentProducts = recentProductsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setStats({
        totalProducts,
        lowStockItems,
        categories: totalCategories,
        recentlyAdded: recentProducts
      });
      
      setLoading(false);
      if (isRefreshing) {
        setRefreshing(false);
        setLastRefreshed(new Date());
        
        // Add haptic feedback on successful refresh
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
          try {
            if (Platform.OS === 'ios') {
              const impactLight = require('expo-haptics').ImpactFeedbackStyle.Light;
              require('expo-haptics').impactAsync(impactLight);
            } else {
              // Android vibration
              Vibration.vibrate(10);
            }
          } catch (err) {
            console.log('Haptics not available');
          }
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setLoading(false);
      if (isRefreshing) {
        setRefreshing(false);
      }
    }
  };
  
  // Handle refresh action
  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData(true);
  };
  
  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Animation values
  const fadeIn = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  
  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  // Render icon based on type
  const renderIcon = (icon, type, size = 24, color = "#fff") => {
    switch (type) {
      case "Ionicons":
        return <Ionicons name={icon} size={size} color={color} />;
      case "MaterialCommunityIcons":
        return <MaterialCommunityIcons name={icon} size={size} color={color} />;
      case "FontAwesome5":
        return <FontAwesome5 name={icon} size={size} color={color} />;
      case "MaterialIcons":
        return <MaterialIcons name={icon} size={size} color={color} />;
      default:
        return <Ionicons name={icon} size={size} color={color} />;
    }
  };

  // Format relative time
  const formatRelativeTime = (timestamp) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    }
  };
  
  // Format currency
  const formatCurrency = (amount) => {
    return `$${parseFloat(amount).toFixed(2)}`;
  };
  
  // Handle activity card press - replace Alert with modal
  const handleActivityPress = (index, activity) => {
    // Add haptic feedback
    if (Platform.OS === 'ios') {
      try {
        require('expo-haptics').impactAsync(require('expo-haptics').ImpactFeedbackStyle.Light);
      } catch (e) {
        Vibration.vibrate(40);
      }
    } else {
      Vibration.vibrate(40);
    }
    
    // Animate the card
    Animated.sequence([
      Animated.spring(activityCardScales[index], {
        toValue: 0.95,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(activityCardScales[index], {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
    
    // Set the selected activity and show the modal
    setSelectedActivity(activity);
    setShowActivityModal(true);
    
    // Animate modal entrance
    Animated.parallel([
      Animated.timing(backdropAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(modalAnimation, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
  };
  
  // Close activity modal
  const closeActivityModal = () => {
    // Animate modal exit
    Animated.parallel([
      Animated.timing(backdropAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(modalAnimation, {
        toValue: 0,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowActivityModal(false);
      setSelectedActivity(null);
    });
  };
  
  // Fetch activities (would be from Firestore in a real app)
  const fetchActivities = () => {
    setLoadingActivities(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      setActivityData(recentActivities);
      setLoadingActivities(false);
    }, 800);
  };
  
  // Filter activities
  const filterActivities = (type) => {
    setActivityFilter(type);
    setLoadingActivities(true);
    
    setTimeout(() => {
      if (type === 'all') {
        setActivityData(recentActivities);
      } else {
        setActivityData(recentActivities.filter(activity => activity.type === type));
      }
      setLoadingActivities(false);
    }, 300);
  };
  
  // Add useEffect to fetch activities on mount
  useEffect(() => {
    fetchActivities();
  }, []);

  // Add this function right after closeActivityModal function
  const handleProductPress = (product) => {
    // Add haptic feedback
    if (Platform.OS === 'ios') {
      try {
        require('expo-haptics').impactAsync(require('expo-haptics').ImpactFeedbackStyle.Medium);
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

  // Add this function after handleProductPress
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

  // Add this function to handle product update
  const handleUpdateProduct = (productId) => {
    closeProductModal();
    
    // Navigate to add product with product ID parameter for editing
    router.push({
      pathname: "/stockManager/addProduct",
      params: { id: productId }
    });
  };

  // Add this function to handle product deletion
  const handleDeleteProduct = (productId) => {
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
          onPress: () => {
            // Here you would add code to delete from Firestore
            // For now we'll just close the modal
            closeProductModal();
            
            // Show confirmation toast/alert
            Alert.alert("Product Deleted", "The product has been successfully deleted.");
          }
        }
      ]
    );
  };

  if (loading) {
  return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <View className="bg-white p-6 rounded-2xl shadow-md items-center">
          <Animated.View 
            style={{ 
              transform: [{ 
                rotate: new Animated.Value(0).interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '360deg']
                }) 
              }],
              opacity: pulseAnim
            }}
          >
            <MaterialIcons name="inventory" size={40} color="#4F46E5" />
          </Animated.View>
          <Text className="mt-4 text-gray-900 text-lg font-bold">
            Stock Manager
          </Text>
          <ActivityIndicator size="large" color="#4F46E5" className="my-4" />
          <Text className="text-gray-500 text-sm text-center">
            Loading your dashboard data...
          </Text>
          <Text className="text-gray-400 text-xs mt-2 text-center">
            Please wait while we fetch the latest inventory updates
          </Text>
      </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <HomeHeader title="Stock Manager" />
      
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4F46E5"
            colors={["#4F46E5"]}
            title="Pull to refresh"
            titleColor="#9CA3AF"
          />
        }
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        {/* Dashboard Overview */}
        <Animated.View className="px-4 pt-4" style={{ 
          opacity: fadeAnim,
          transform: [{ translateY: translateAnim }]
        }}>
          <View className="flex-row justify-between items-center mb-4 pl-1">
            <View className="flex-row items-center">
              <View className="w-1 h-6 bg-indigo-600 rounded-full mr-2" />
              <Text className="text-xl font-bold text-gray-800">
                Dashboard Overview
              </Text>
            </View>
            <TouchableOpacity
              className="flex-row items-center bg-indigo-600/10 py-1.5 px-3 rounded-full border border-indigo-100 active:bg-indigo-600/20"
              onPress={() => {
                // Add haptic feedback
                if (Platform.OS === 'ios' || Platform.OS === 'android') {
                  try {
                    if (Platform.OS === 'ios') {
                      const impactLight = require('expo-haptics').ImpactFeedbackStyle.Medium;
                      require('expo-haptics').impactAsync(impactLight);
                    } else {
                      // Android vibration
                      Vibration.vibrate(15);
                    }
                  } catch (err) {
                    console.log('Haptics not available');
                  }
                }
                
                // Reload data animation
                pulseAnim.setValue(1);
                Animated.timing(pulseAnim, {
                  toValue: 1.3,
                  duration: 300,
                  useNativeDriver: true
                }).start(() => {
                  Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true
                  }).start();
                });
                
                // Refresh data
                setLoading(true);
                fetchDashboardData();
              }}
            >
              <Animated.View style={{ 
                transform: [{ 
                  rotate: refreshRotate.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  }) 
                }] 
              }}>
                <MaterialIcons name="refresh" size={16} color="#4F46E5" />
              </Animated.View>
              <View>
                <Text className="text-xs font-semibold text-indigo-600 ml-1.5">
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Text>
                {!refreshing && lastRefreshed && (
                  <Text className="text-[9px] text-gray-500 ml-1.5">
                    Updated: {lastRefreshed.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
          
          <View style={{ 
            flexDirection: "row", 
            justifyContent: "space-between", 
            flexWrap: "wrap" 
          }}>
            {/* Total Products - Enhanced with modern design and better interactivity */}
            <Animated.View 
              style={{
                width: width / 2 - 24,
                transform: [{ scale: pressedOptionIndex === 'totalProducts' ? 0.96 : 1 }],
              }}
            >
              <TouchableOpacity 
                className="bg-white rounded-xl p-4 mb-4 shadow-md border border-gray-100 overflow-hidden"
                style={{
                  shadowColor: pressedOptionIndex === 'totalProducts' ? "#4F46E5" : "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: pressedOptionIndex === 'totalProducts' ? 0.2 : 0.05,
                  shadowRadius: 8,
                  elevation: pressedOptionIndex === 'totalProducts' ? 3 : 2,
                }}
                activeOpacity={0.95}
                onPressIn={() => {
                  // Add haptic feedback
                  if (Platform.OS === 'ios' || Platform.OS === 'android') {
                    try {
                      if (Platform.OS === 'ios') {
                        const impactLight = require('expo-haptics').ImpactFeedbackStyle.Light;
                        require('expo-haptics').impactAsync(impactLight);
                      } else {
                        // Android vibration
                        Vibration.vibrate(5);
                      }
                    } catch (err) {
                      console.log('Haptics not available');
                    }
                  }
                  setPressedOptionIndex('totalProducts');
                }}
                onPressOut={() => setPressedOptionIndex(null)}
                onPress={() => router.push("/stockManager/ProductList")}
              >
                {/* Background decoration */}
                <View className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-indigo-500/5" />
                <View className="absolute right-12 bottom-2 w-6 h-6 rounded-full bg-indigo-500/10" />
                
                <View className="flex-row justify-between items-start">
                  <View className="w-[45px] h-[45px] rounded-xl bg-indigo-500/10 justify-center items-center mb-4 shadow"
                    style={{
                      shadowColor: "#4F46E5",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                    }}
                  >
                    <Ionicons name="cube" size={24} color="#4F46E5" />
                  </View>
                  <View className="w-6 h-6 rounded-full bg-gray-50 justify-center items-center">
                    <MaterialIcons 
                      name="arrow-forward" 
                      size={14} 
                      color="#4F46E5" 
                      style={{ 
                        opacity: pressedOptionIndex === 'totalProducts' ? 1 : 0.6,
                        transform: [{ translateX: pressedOptionIndex === 'totalProducts' ? 1 : 0 }] 
                      }} 
                    />
                  </View>
                </View>
                
                <Animated.Text className="text-3xl font-bold text-gray-800" 
                  style={{ 
                    transform: [{ scale: Animated.add(1, Animated.multiply(pulseAnim, 0.1)) }] 
                  }}
                >
                  {stats.totalProducts}
                </Animated.Text>
                
                <View className="flex-row items-center justify-between mt-1">
                  <Text className="text-sm text-gray-500">
                    Total Products
                  </Text>
                  <View className="bg-indigo-600/10 px-1.5 py-0.5 rounded-lg border border-indigo-100">
                    <Text className="text-[10px] font-semibold text-indigo-600">VIEW</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Low Stock - Enhanced with modern design and better interactivity */}
            <Animated.View 
              style={{
                width: width / 2 - 24,
                transform: [{ scale: pressedOptionIndex === 'lowStock' ? 0.96 : 1 }],
              }}
            >
              <TouchableOpacity 
                className="bg-white rounded-xl p-4 mb-4 shadow-md border border-gray-100 overflow-hidden"
                style={{
                  shadowColor: pressedOptionIndex === 'lowStock' ? "#EF4444" : "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: pressedOptionIndex === 'lowStock' ? 0.2 : 0.05,
                  shadowRadius: 8,
                  elevation: pressedOptionIndex === 'lowStock' ? 3 : 2,
                }}
                activeOpacity={0.95}
                onPressIn={() => {
                  // Add haptic feedback
                  if (Platform.OS === 'ios' || Platform.OS === 'android') {
                    try {
                      if (Platform.OS === 'ios') {
                        const impactLight = require('expo-haptics').ImpactFeedbackStyle.Light;
                        require('expo-haptics').impactAsync(impactLight);
                      } else {
                        // Android vibration
                        Vibration.vibrate(5);
                      }
                    } catch (err) {
                      console.log('Haptics not available');
                    }
                  }
                  setPressedOptionIndex('lowStock');
                }}
                onPressOut={() => setPressedOptionIndex(null)}
                onPress={() => router.push("/stockManager/Low-stock alerts")}
              >
                {/* Background decoration */}
                <View className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-red-500/5" />
                <View className="absolute right-12 bottom-2 w-6 h-6 rounded-full bg-red-500/10" />
                
                <View className="flex-row justify-between items-start">
                  <View className="w-[45px] h-[45px] rounded-xl bg-red-500/10 justify-center items-center mb-4 shadow"
                    style={{
                      shadowColor: "#EF4444",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                    }}
                  >
                    <Ionicons name="warning" size={24} color="#EF4444" />
                  </View>
                  <View className="w-6 h-6 rounded-full bg-gray-50 justify-center items-center">
                    <MaterialIcons 
                      name="arrow-forward" 
                      size={14} 
                      color="#EF4444" 
                      style={{ 
                        opacity: pressedOptionIndex === 'lowStock' ? 1 : 0.6,
                        transform: [{ translateX: pressedOptionIndex === 'lowStock' ? 1 : 0 }] 
                      }} 
                    />
                  </View>
                </View>
                
                <Animated.Text className="text-3xl font-bold text-gray-800" 
                  style={{ 
                    transform: [{ scale: stats.lowStockItems > 0 ? pulseAnim : 1 }] 
                  }}
                >
                  {stats.lowStockItems}
                </Animated.Text>
                
                <View className="flex-row items-center justify-between mt-1">
                  <Text className="text-sm text-gray-500">
                    Low Stock Items
                  </Text>
                  {stats.lowStockItems > 0 && (
                    <Animated.View 
                      className="bg-red-500/10 px-1.5 py-0.5 rounded-lg border border-red-100"
                      style={{ 
                        transform: [{ scale: pulseAnim }],
                        opacity: Animated.add(0.8, Animated.multiply(pulseAnim, 0.2))
                      }}
                    >
                      <Text className="text-[10px] font-semibold text-red-500">ACTION</Text>
                    </Animated.View>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Categories - Enhanced with modern design */}
            <Animated.View 
              style={{
                width: width / 2 - 24,
                transform: [{ scale: pressedOptionIndex === 'categories' ? 0.96 : 1 }],
              }}
            >
              <TouchableOpacity 
                className="bg-white rounded-xl p-4 mb-4 shadow-md border border-gray-100 overflow-hidden"
                style={{
                  shadowColor: pressedOptionIndex === 'categories' ? "#F59E0B" : "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: pressedOptionIndex === 'categories' ? 0.2 : 0.05,
                  shadowRadius: 8,
                  elevation: pressedOptionIndex === 'categories' ? 3 : 2,
                }}
                activeOpacity={0.95}
                onPressIn={() => {
                  // Add haptic feedback
                  if (Platform.OS === 'ios' || Platform.OS === 'android') {
                    try {
                      if (Platform.OS === 'ios') {
                        const impactLight = require('expo-haptics').ImpactFeedbackStyle.Light;
                        require('expo-haptics').impactAsync(impactLight);
                      } else {
                        // Android vibration
                        Vibration.vibrate(5);
                      }
                    } catch (err) {
                      console.log('Haptics not available');
                    }
                  }
                  setPressedOptionIndex('categories');
                }}
                onPressOut={() => setPressedOptionIndex(null)}
                onPress={() => router.push("/stockManager/ViewCategory")}
              >
                {/* Background decoration */}
                <View className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-amber-500/5" />
                <View className="absolute right-12 bottom-2 w-6 h-6 rounded-full bg-amber-500/10" />
                
                <View className="flex-row justify-between items-start">
                  <View className="w-[45px] h-[45px] rounded-xl bg-amber-500/10 justify-center items-center mb-4 shadow"
                    style={{
                      shadowColor: "#F59E0B",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                    }}
                  >
                    <FontAwesome5 name="tags" size={20} color="#F59E0B" />
                  </View>
                  <View className="w-6 h-6 rounded-full bg-gray-50 justify-center items-center">
                    <MaterialIcons 
                      name="arrow-forward" 
                      size={14} 
                      color="#F59E0B" 
                      style={{ 
                        opacity: pressedOptionIndex === 'categories' ? 1 : 0.6,
                        transform: [{ translateX: pressedOptionIndex === 'categories' ? 1 : 0 }] 
                      }} 
                    />
                  </View>
                </View>
                
                <Animated.Text className="text-3xl font-bold text-gray-800">
                  {stats.categories}
                </Animated.Text>
                
                <View className="flex-row items-center justify-between mt-1">
                  <Text className="text-sm text-gray-500">
                    Categories
                  </Text>
                  <View className="bg-amber-500/10 px-1.5 py-0.5 rounded-lg border border-amber-100">
                    <Text className="text-[10px] font-semibold text-amber-500">BROWSE</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>

            {/* Add Product - Modern, attractive design */}
            <Animated.View 
              style={{
                width: width / 2 - 24,
                transform: [{ scale: pressedOptionIndex === 'addProduct' ? 0.96 : 1 }],
              }}
            >
              <TouchableOpacity 
                className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 mb-4 shadow-md border border-emerald-200 overflow-hidden"
                style={{
                  shadowColor: pressedOptionIndex === 'addProduct' ? "#10B981" : "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: pressedOptionIndex === 'addProduct' ? 0.25 : 0.05,
                  shadowRadius: 8,
                  elevation: pressedOptionIndex === 'addProduct' ? 4 : 2,
                }}
                activeOpacity={0.92}
                onPressIn={() => {
                  // Add haptic feedback
                  if (Platform.OS === 'ios' || Platform.OS === 'android') {
                    try {
                      if (Platform.OS === 'ios') {
                        const impactLight = require('expo-haptics').ImpactFeedbackStyle.Medium;
                        require('expo-haptics').impactAsync(impactLight);
                      } else {
                        // Android vibration
                        Vibration.vibrate(15);
                      }
                    } catch (err) {
                      console.log('Haptics not available');
                    }
                  }
                  setPressedOptionIndex('addProduct');
                }}
                onPressOut={() => setPressedOptionIndex(null)}
                onPress={() => router.push("/stockManager/addProduct")}
              >
                {/* Background decoration */}
                <View className="absolute -right-4 -top-4 w-16 h-16 rounded-full bg-emerald-500/5" />
                <View className="absolute right-4 top-12 w-3 h-3 rounded-full bg-emerald-500/20" />
                <View className="absolute left-12 bottom-2 w-4 h-4 rounded-full bg-emerald-500/10" />
                
                <View className="flex-row justify-between items-start">
                  <Animated.View 
                    className="w-[45px] h-[45px] rounded-xl bg-emerald-500/20 justify-center items-center mb-4 shadow-sm"
                    style={{
                      shadowColor: "#10B981",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                      transform: [{ 
                        rotate: pressedOptionIndex === 'addProduct' ? '5deg' : '0deg' 
                      }]
                    }}
                  >
                    <Ionicons name="add-circle" size={26} color="#10B981" />
                  </Animated.View>
                  <View className="w-6 h-6 rounded-full bg-white justify-center items-center">
                    <MaterialIcons 
                      name="arrow-forward" 
                      size={14} 
                      color="#10B981" 
                      style={{ 
                        opacity: pressedOptionIndex === 'addProduct' ? 1 : 0.6,
                        transform: [{ translateX: pressedOptionIndex === 'addProduct' ? 1 : 0 }] 
                      }} 
                    />
                  </View>
                </View>
                
                <Text className="text-xl font-bold text-emerald-800">
                  Add Product
                </Text>
                
                <View className="flex-row items-center justify-between mt-1">
                  <Text className="text-sm text-emerald-700">
                    Quick Action
                  </Text>
                  <View className="bg-white px-1.5 py-0.5 rounded-lg border border-emerald-200">
                    <Text className="text-[10px] font-semibold text-emerald-600">NEW</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Replace Quick Actions section with Recent Activity section */}
        <Animated.View className="px-4 mb-6" style={{ 
          opacity: fadeAnim,
          transform: [{ translateY: translateAnim }]
        }}>
          <View className="flex-row justify-between items-center mb-3 pl-1">
            <View className="flex-row items-center">
              <View className="w-1 h-6 bg-indigo-600 rounded-full mr-2" />
              <Text className="text-lg font-semibold text-gray-800">
                Recent Activity
              </Text>
            </View>
            
            <TouchableOpacity
              className="flex-row items-center py-1.5 px-2.5 bg-indigo-50 rounded-lg"
              onPress={() => fetchActivities()}
            >
              <Text className="text-xs text-indigo-600 font-medium mr-1">
                Refresh
              </Text>
              <Ionicons name="refresh" size={14} color="#4F46E5" />
            </TouchableOpacity>
          </View>
          
          {/* Activity Type Filters */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            className="mb-3"
          >
            <TouchableOpacity 
              className={`mr-2 px-3 py-1.5 rounded-full border ${activityFilter === 'all' ? 'bg-indigo-100 border-indigo-200' : 'bg-gray-50 border-gray-200'}`}
              onPress={() => filterActivities('all')}
            >
              <Text className={`text-xs font-medium ${activityFilter === 'all' ? 'text-indigo-700' : 'text-gray-600'}`}>
                All Activities
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`mr-2 px-3 py-1.5 rounded-full border ${activityFilter === 'stock_added' ? 'bg-emerald-100 border-emerald-200' : 'bg-gray-50 border-gray-200'}`}
              onPress={() => filterActivities('stock_added')}
            >
              <Text className={`text-xs font-medium ${activityFilter === 'stock_added' ? 'text-emerald-700' : 'text-gray-600'}`}>
                Stock Changes
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`mr-2 px-3 py-1.5 rounded-full border ${activityFilter === 'price_change' ? 'bg-blue-100 border-blue-200' : 'bg-gray-50 border-gray-200'}`}
              onPress={() => filterActivities('price_change')}
            >
              <Text className={`text-xs font-medium ${activityFilter === 'price_change' ? 'text-blue-700' : 'text-gray-600'}`}>
                Price Updates
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`mr-2 px-3 py-1.5 rounded-full border ${activityFilter === 'low_stock' ? 'bg-red-100 border-red-200' : 'bg-gray-50 border-gray-200'}`}
              onPress={() => filterActivities('low_stock')}
            >
              <Text className={`text-xs font-medium ${activityFilter === 'low_stock' ? 'text-red-700' : 'text-gray-600'}`}>
                Alerts
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`mr-2 px-3 py-1.5 rounded-full border ${activityFilter === 'order_placed' ? 'bg-amber-100 border-amber-200' : 'bg-gray-50 border-gray-200'}`}
              onPress={() => filterActivities('order_placed')}
            >
              <Text className={`text-xs font-medium ${activityFilter === 'order_placed' ? 'text-amber-700' : 'text-gray-600'}`}>
                Orders
              </Text>
            </TouchableOpacity>
      </ScrollView>

          {/* Activity Cards */}
          {loadingActivities ? (
            <View className="bg-white rounded-xl p-4 shadow-sm items-center justify-center" style={{ height: 120 }}>
              <ActivityIndicator size="small" color="#4F46E5" />
              <Text className="text-sm text-gray-500 mt-2">Loading activities...</Text>
            </View>
          ) : activityData.length === 0 ? (
            <View className="bg-white rounded-xl p-4 shadow-sm items-center justify-center" style={{ height: 120 }}>
              <Ionicons name="document-text-outline" size={24} color="#9ca3af" />
              <Text className="text-sm text-gray-500 mt-2">No activities found</Text>
            </View>
          ) : (
            activityData.map((activity, index) => (
              <Animated.View 
                key={`activity-${index}`}
                style={{
                  marginBottom: 12,
                  transform: [{ scale: activityCardScales[index] }],
                  opacity: fadeAnim
                }}
              >
                <TouchableOpacity
                  activeOpacity={0.9}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                  onPress={() => handleActivityPress(index, activity)}
                  style={{
                    shadowColor: activity.textColor,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                  }}
                >
                  <View className="flex-row">
                    <View 
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: activity.color }}
                    >
                      {renderIcon(activity.icon, activity.iconType, 18, activity.textColor)}
                    </View>
                    
                    <View className="flex-1">
                      <View className="flex-row justify-between items-center">
                        <Text className="text-base font-semibold text-gray-800">
                          {activity.title}
                        </Text>
                        <Text className="text-xs text-gray-500">
                          {formatRelativeTime(activity.timestamp)}
                        </Text>
                      </View>
                      
                      <Text className="text-sm text-gray-600 mt-0.5">
                        {activity.description}
                      </Text>
                      
                      <View className="mt-2 pt-2 border-t border-gray-100">
                        {activity.type === 'stock_added' && (
                          <View className="flex-row justify-between">
                            <Text className="text-xs text-gray-500">Product: <Text className="font-medium">{activity.details.productName}</Text></Text>
                            <Text className="text-xs text-emerald-600 font-medium">+{activity.details.quantity} units</Text>
                          </View>
                        )}
                        
                        {activity.type === 'price_change' && (
                          <View className="flex-row justify-between">
                            <Text className="text-xs text-gray-500">Product: <Text className="font-medium">{activity.details.productName}</Text></Text>
                            <View className="flex-row">
                              <Text className="text-xs text-gray-500 line-through mr-2">${activity.details.oldPrice.toFixed(2)}</Text>
                              <Text className="text-xs text-blue-600 font-medium">${activity.details.newPrice.toFixed(2)}</Text>
                            </View>
                          </View>
                        )}
                        
                        {activity.type === 'low_stock' && (
                          <View className="flex-row justify-between">
                            <Text className="text-xs text-gray-500">Product: <Text className="font-medium">{activity.details.productName}</Text></Text>
                            <View className="px-2 py-0.5 bg-red-50 rounded-full border border-red-100">
                              <Text className="text-xs text-red-600 font-medium">{activity.details.currentStock}/{activity.details.minimumRequired} units</Text>
                            </View>
                          </View>
                        )}
                        
                        {activity.type === 'category_added' && (
                          <View className="flex-row justify-between">
                            <Text className="text-xs text-gray-500">Category: <Text className="font-medium">{activity.details.categoryName}</Text></Text>
                            <Text className="text-xs text-purple-600 font-medium">{activity.details.products} products</Text>
                          </View>
                        )}
                        
                        {activity.type === 'order_placed' && (
                          <View className="flex-row justify-between">
                            <Text className="text-xs text-gray-500">Supplier: <Text className="font-medium">{activity.details.supplier}</Text></Text>
                            <Text className="text-xs text-amber-600 font-medium">${activity.details.orderTotal.toFixed(2)}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
        </Animated.View>

        {/* Stock Management Options from Manage_stock_levels.js */}
        <Animated.View className="px-4 mb-6" style={{ 
          opacity: fadeAnim,
          transform: [{ translateY: translateAnim }]
        }}>
          <View className="flex-row justify-between items-center mb-3 pl-1">
            <View className="flex-row items-center">
              <View className="w-1 h-6 bg-indigo-600 rounded-full mr-2" />
              <Text className="text-lg font-semibold text-gray-800">
                Stock Management
              </Text>
            </View>
            
            <View className="flex-row items-center">
              <TouchableOpacity
                className="flex-row items-center py-1.5 px-2.5 mr-2"
                onPress={() => setShowingFilters(!showingFilters)}
              >
                <Text className="text-sm text-gray-500 mr-1">
                  Filter
                </Text>
                <Ionicons 
                  name={showingFilters ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color="#6B7280" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {stockOptions.map((option, index) => (
            <Animated.View 
              key={`stock-option-${index}`}
              style={{
                opacity: fadeAnim,
                transform: [
                  { translateY: translateAnim },
                  { scale: stockOptionScales[index] }
                ],
                marginBottom: 12
              }}
            >
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleStockOptionPress(index, option.route)}
                className="overflow-hidden rounded-xl shadow-sm"
                style={{
                  shadowColor: option.textColor,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: stockOptionPressed[index] ? 0.2 : 0.1,
                  shadowRadius: 4,
                  elevation: stockOptionPressed[index] ? 3 : 2,
                }}
              >
                <LinearGradient
                  colors={option.color}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="p-4 border border-gray-100"
                >
                  <View className="flex-row items-center">
                    <View 
                      className="w-12 h-12 rounded-lg mr-4 items-center justify-center"
                      style={{ backgroundColor: option.textColor + '20' }}
                    >
                      {renderIcon(option.icon, option.iconType, 24, option.textColor)}
                    </View>
                    
                    <View className="flex-1">
                      <View className="flex-row items-center justify-between">
                        <Text className="text-base font-semibold" style={{ color: option.textColor }}>
                          {option.title}
                        </Text>
                        
                        {option.badge && (
                          <View 
                            className="px-2 py-1 rounded-full"
                            style={{ backgroundColor: option.alertType ? '#FEE2E2' : option.textColor + '20' }}
                          >
                            <Text 
                              className="text-xs font-semibold" 
                              style={{ color: option.alertType ? '#B91C1C' : option.textColor }}
                            >
                              {option.badge === "Products" ? `${stats.totalProducts} Products` :
                               option.badge === "Categories" ? `${stats.categories} Categories` :
                               option.badge === "Alerts" ? `${stats.lowStockItems} Alerts` :
                               option.badge}
                            </Text>
                          </View>
                        )}
                      </View>
                      
                      <Text className="text-sm text-gray-600 mt-1" numberOfLines={1}>
                        {option.description}
                      </Text>
                    </View>
                    
                    <View className="justify-center">
                      <MaterialIcons name="chevron-right" size={24} color={option.textColor + '80'} />
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>
      </ScrollView>
      
      {/* Activity Detail Modal */}
      {showActivityModal && selectedActivity && (
        <View className="absolute inset-0 justify-center items-center z-50">
          <Animated.View 
            className="absolute inset-0 bg-black/50"
            style={{ opacity: backdropAnimation }}
            onTouchStart={closeActivityModal}
          />
          
          <Animated.View 
            className="w-[90%] bg-white rounded-2xl overflow-hidden"
            style={{
              transform: [
                { scale: modalAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1]
                }) },
                { translateY: modalAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                }) }
              ],
              opacity: modalAnimation,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 10,
            }}
          >
            {/* Modal Header */}
            <View 
              className="pt-6 pb-4 px-5 rounded-t-2xl border-b border-gray-100"
              style={{ backgroundColor: selectedActivity.color + '40' }}
            >
              <View className="flex-row items-center mb-2">
                <View 
                  className="w-12 h-12 rounded-full items-center justify-center mr-4"
                  style={{ backgroundColor: selectedActivity.color }}
                >
                  {renderIcon(selectedActivity.icon, selectedActivity.iconType, 24, selectedActivity.textColor)}
        </View>
                
                <View className="flex-1">
                  <Text className="text-lg font-bold text-gray-800">
                    {selectedActivity.title}
                  </Text>
                  <Text className="text-sm text-gray-600">
                    {formatRelativeTime(selectedActivity.timestamp)}
                  </Text>
                </View>
                
                <TouchableOpacity 
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                  onPress={closeActivityModal}
                >
                  <Ionicons name="close" size={18} color="#64748b" />
                </TouchableOpacity>
              </View>
              
              <Text className="text-sm text-gray-700 mb-1">
                {selectedActivity.description}
              </Text>
              
              <Text className="text-xs text-gray-500">
                {selectedActivity.timestamp.toLocaleString()}
              </Text>
            </View>
            
            {/* Modal Content */}
            <View className="p-5">
              <Text className="text-base font-semibold text-gray-800 mb-3">
                Activity Details
              </Text>
              
              {selectedActivity.type === 'stock_added' && (
                <>
                  <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
                    <Text className="text-gray-600">Product</Text>
                    <Text className="text-gray-800 font-medium">{selectedActivity.details.productName}</Text>
                  </View>
                  <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
                    <Text className="text-gray-600">Quantity Added</Text>
                    <View className="px-2 py-1 bg-emerald-100 rounded-full">
                      <Text className="text-emerald-700 font-medium">+{selectedActivity.details.quantity} units</Text>
                    </View>
                  </View>
                  <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
                    <Text className="text-gray-600">Supplier</Text>
                    <Text className="text-gray-800 font-medium">{selectedActivity.details.supplier}</Text>
                  </View>
                </>
              )}
              
              {selectedActivity.type === 'price_change' && (
                <>
                  <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
                    <Text className="text-gray-600">Product</Text>
                    <Text className="text-gray-800 font-medium">{selectedActivity.details.productName}</Text>
                  </View>
                  <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
                    <Text className="text-gray-600">Previous Price</Text>
                    <Text className="text-gray-500 line-through">{formatCurrency(selectedActivity.details.oldPrice)}</Text>
                  </View>
                  <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
                    <Text className="text-gray-600">New Price</Text>
                    <View className="px-2 py-1 bg-blue-100 rounded-full">
                      <Text className="text-blue-700 font-medium">{formatCurrency(selectedActivity.details.newPrice)}</Text>
                    </View>
                  </View>
                  <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
                    <Text className="text-gray-600">Change Reason</Text>
                    <Text className="text-gray-800 font-medium">{selectedActivity.details.reason}</Text>
                  </View>
                </>
              )}
              
              {selectedActivity.type === 'low_stock' && (
                <>
                  <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
                    <Text className="text-gray-600">Product</Text>
                    <Text className="text-gray-800 font-medium">{selectedActivity.details.productName}</Text>
                  </View>
                  <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
                    <Text className="text-gray-600">Current Stock</Text>
                    <View className="px-2 py-1 bg-red-100 rounded-full">
                      <Text className="text-red-700 font-medium">{selectedActivity.details.currentStock} units</Text>
                    </View>
                  </View>
                  <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
                    <Text className="text-gray-600">Minimum Required</Text>
                    <Text className="text-gray-800 font-medium">{selectedActivity.details.minimumRequired} units</Text>
                  </View>
                  <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
                    <Text className="text-gray-600">Deficit</Text>
                    <Text className="text-red-600 font-semibold">
                      {selectedActivity.details.minimumRequired - selectedActivity.details.currentStock} units
                    </Text>
                  </View>
                </>
              )}
              
              {selectedActivity.type === 'category_added' && (
                <>
                  <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
                    <Text className="text-gray-600">Category Name</Text>
                    <Text className="text-gray-800 font-medium">{selectedActivity.details.categoryName}</Text>
                  </View>
                  <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
                    <Text className="text-gray-600">Products</Text>
                    <View className="px-2 py-1 bg-purple-100 rounded-full">
                      <Text className="text-purple-700 font-medium">{selectedActivity.details.products} products</Text>
                    </View>
                  </View>
                </>
              )}
              
              {selectedActivity.type === 'order_placed' && (
                <>
                  <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
                    <Text className="text-gray-600">Supplier</Text>
                    <Text className="text-gray-800 font-medium">{selectedActivity.details.supplier}</Text>
                  </View>
                  <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
                    <Text className="text-gray-600">Order Total</Text>
                    <View className="px-2 py-1 bg-amber-100 rounded-full">
                      <Text className="text-amber-700 font-medium">{formatCurrency(selectedActivity.details.orderTotal)}</Text>
                    </View>
                  </View>
                  <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
                    <Text className="text-gray-600">Items Ordered</Text>
                    <Text className="text-gray-800 font-medium">{selectedActivity.details.items} items</Text>
                  </View>
                  <View className="flex-row justify-between items-center mb-3 pb-3 border-b border-gray-100">
                    <Text className="text-gray-600">Average Item Cost</Text>
                    <Text className="text-gray-800 font-medium">
                      {formatCurrency(selectedActivity.details.orderTotal / selectedActivity.details.items)}
                    </Text>
                  </View>
                </>
              )}
            </View>
            
            {/* Modal Footer with Action Buttons */}
            <View className="p-4 bg-gray-50 border-t border-gray-200 flex-row">
              <TouchableOpacity 
                className="flex-1 mr-2 py-3 bg-gray-200 rounded-lg items-center"
                onPress={closeActivityModal}
              >
                <Text className="text-gray-700 font-medium">Close</Text>
              </TouchableOpacity>
              
              {selectedActivity.type === 'low_stock' && (
                <TouchableOpacity 
                  className="flex-1 py-3 bg-blue-600 rounded-lg items-center"
                  onPress={() => {
                    closeActivityModal();
                    // Navigate to restock interface
                    router.push("/stockManager/addProduct");
                  }}
                >
                  <Text className="text-white font-medium">Restock Now</Text>
                </TouchableOpacity>
              )}
              
              {selectedActivity.type === 'price_change' && (
                <TouchableOpacity 
                  className="flex-1 py-3 bg-blue-600 rounded-lg items-center"
                  onPress={() => {
                    closeActivityModal();
                    // Navigate to product detail
                    router.push("/stockManager/ProductList");
                  }}
                >
                  <Text className="text-white font-medium">View Product</Text>
                </TouchableOpacity>
              )}
              
              {selectedActivity.type === 'stock_added' && (
                <TouchableOpacity 
                  className="flex-1 py-3 bg-blue-600 rounded-lg items-center"
                  onPress={() => {
                    closeActivityModal();
                    // Navigate to inventory
                    router.push("/stockManager/ProductList");
                  }}
                >
                  <Text className="text-white font-medium">View Inventory</Text>
                </TouchableOpacity>
              )}
              
              {selectedActivity.type === 'category_added' && (
                <TouchableOpacity 
                  className="flex-1 py-3 bg-blue-600 rounded-lg items-center"
                  onPress={() => {
                    closeActivityModal();
                    // Navigate to category list
                    router.push("/stockManager/ViewCategory");
                  }}
                >
                  <Text className="text-white font-medium">View Categories</Text>
                </TouchableOpacity>
              )}
              
              {selectedActivity.type === 'order_placed' && (
                <TouchableOpacity 
                  className="flex-1 py-3 bg-blue-600 rounded-lg items-center"
                  onPress={() => {
                    closeActivityModal();
                    // Navigate to orders
                    router.push("/stockManager/Supplier_order_management");
                  }}
                >
                  <Text className="text-white font-medium">View Orders</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </View>
      )}

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
                { scale: productModalAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1]
                }) },
                { translateY: productModalAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                }) }
              ],
              opacity: productModalAnimation,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 10,
              maxHeight: height * 0.8
            }}
          >
            {/* Modal Header with Product Image */}
            <View className="relative">
              {selectedProduct.productImage ? (
                <Image 
                  source={{ uri: selectedProduct.productImage }} 
                  className="w-full h-48 bg-gray-200"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-48 bg-gray-200 items-center justify-center">
                  <Ionicons name="image-outline" size={48} color="#9ca3af" />
                  <Text className="text-gray-500 mt-2">No image available</Text>
                </View>
              )}
              
              {/* Close button */}
              <TouchableOpacity 
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/30 items-center justify-center"
                onPress={closeProductModal}
              >
                <Ionicons name="close" size={18} color="#ffffff" />
              </TouchableOpacity>
              
              {/* Product status badge */}
              {selectedProduct.status && (
                <View className="absolute top-4 left-4 px-2 py-1 rounded-lg" 
                  style={{ 
                    backgroundColor: selectedProduct.status === 'Active' ? '#dcfce7' : '#fee2e2'
                  }}
                >
                  <Text 
                    className="text-xs font-semibold"
                    style={{ 
                      color: selectedProduct.status === 'Active' ? '#15803d' : '#b91c1c'
                    }}
                  >
                    {selectedProduct.status}
                  </Text>
                </View>
              )}
            </View>
            
            {/* Product Info Header */}
            <View className="p-4 border-b border-gray-100">
              <View className="flex-row justify-between items-start">
                <View className="flex-1 mr-2">
                  <Text className="text-xl font-bold text-gray-800">
                    {selectedProduct.productName}
                  </Text>
                  <Text className="text-sm text-gray-500 mt-1">
                    {selectedProduct.category || "Uncategorized"}
                  </Text>
                </View>
                
                <View>
                  {selectedProduct.hasDiscount ? (
                    <View>
                      <Text className="text-xs text-gray-500 line-through">
                        ${parseFloat(selectedProduct.price).toFixed(2)}
                      </Text>
                      <Text className="text-lg font-bold text-blue-600">
                        ${parseFloat(selectedProduct.discountPrice).toFixed(2)}
                      </Text>
                    </View>
                  ) : (
                    <Text className="text-lg font-bold text-blue-600">
                      ${parseFloat(selectedProduct.price).toFixed(2)}
                    </Text>
                  )}
                </View>
              </View>
            </View>
            
            {/* Product Details */}
            <ScrollView className="p-4" style={{ maxHeight: 280 }}>
              {/* Stock Information */}
              <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-gray-100">
                <Text className="text-gray-600">Stock Quantity</Text>
                <View 
                  className="px-2 py-1 rounded-lg"
                  style={{
                    backgroundColor: parseInt(selectedProduct.stockQuantity) < 10 ? '#fee2e2' : '#dcfce7'
                  }}
                >
                  <Text 
                    className="text-sm font-semibold"
                    style={{
                      color: parseInt(selectedProduct.stockQuantity) < 10 ? '#b91c1c' : '#15803d'
                    }}
                  >
                    {selectedProduct.stockQuantity} units
                  </Text>
                </View>
              </View>
              
              {/* SKU/Barcode */}
              {selectedProduct.barcode && (
                <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-gray-100">
                  <Text className="text-gray-600">Barcode/SKU</Text>
                  <Text className="text-gray-800 font-medium">{selectedProduct.barcode}</Text>
                </View>
              )}
              
              {/* Supplier */}
              {selectedProduct.supplier && (
                <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-gray-100">
                  <Text className="text-gray-600">Supplier</Text>
                  <Text className="text-gray-800 font-medium">{selectedProduct.supplier}</Text>
                </View>
              )}
              
              {/* Tax Information */}
              {selectedProduct.taxPercentage && (
                <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-gray-100">
                  <Text className="text-gray-600">Tax</Text>
                  <Text className="text-gray-800 font-medium">{selectedProduct.taxPercentage}%</Text>
                </View>
              )}
              
              {/* Description */}
              {selectedProduct.description && (
                <View className="mb-4 pb-4 border-b border-gray-100">
                  <Text className="text-gray-600 mb-2">Description</Text>
                  <Text className="text-gray-800">{selectedProduct.description}</Text>
                </View>
              )}
              
              {/* Date Added */}
              {selectedProduct.createdAt && (
                <View className="flex-row justify-between items-center mb-4 pb-4 border-b border-gray-100">
                  <Text className="text-gray-600">Added On</Text>
                  <Text className="text-gray-800 font-medium">
                    {new Date(selectedProduct.createdAt).toLocaleDateString()}
                  </Text>
                </View>
              )}
      </ScrollView>
            
            {/* Action Buttons */}
            <View className="p-4 bg-gray-50 border-t border-gray-200 flex-row">
              <TouchableOpacity 
                className="flex-1 mr-2 py-3 bg-white border border-gray-300 rounded-lg items-center"
                onPress={closeProductModal}
              >
                <Text className="text-gray-700 font-medium">Close</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="flex-1 mr-2 py-3 bg-red-50 border border-red-200 rounded-lg items-center"
                onPress={() => handleDeleteProduct(selectedProduct.id)}
              >
                <Text className="text-red-600 font-medium">Delete</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                className="flex-1 py-3 bg-blue-600 rounded-lg items-center"
                onPress={() => handleUpdateProduct(selectedProduct.id)}
              >
                <Text className="text-white font-medium">Update</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}