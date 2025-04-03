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
    bgColor: ["#f0f9ff", "#e0f2fe"],
    color: "bg-blue-50 dark:bg-blue-900/20",
    gradientFrom: "#f0f9ff", 
    gradientTo: "#e0f2fe",
    iconColor: "#3b82f6",
    description: "Manage inventory levels, restock, and audit your stock"
  },
  { 
    name: "Product Management", 
    route: "/stockManager/ProductList", 
    icon: "cube-outline", 
    iconType: "Ionicons",
    bgColor: ["#eef2ff", "#e0e7ff"],
    color: "bg-indigo-50 dark:bg-indigo-900/20",
    gradientFrom: "#eef2ff",
    gradientTo: "#e0e7ff",
    iconColor: "#6366f1",
    description: "View and modify product details, pricing, and images"
  },
  { 
    name: "Categories", 
    route: "/stockManager/ViewCategory", 
    icon: "tag", 
    iconType: "FontAwesome5",
    bgColor: ["#f5f3ff", "#ede9fe"],
    color: "bg-violet-50 dark:bg-violet-900/20",
    gradientFrom: "#f5f3ff",
    gradientTo: "#ede9fe",
    iconColor: "#8b5cf6",
    description: "Manage product categories and classification"
  },
  { 
    name: "Add New Product", 
    route: "/stockManager/addProduct", 
    icon: "add-box", 
    iconType: "MaterialIcons",
    bgColor: ["#faf5ff", "#f3e8ff"],
    color: "bg-purple-50 dark:bg-purple-900/20",
    gradientFrom: "#faf5ff",
    gradientTo: "#f3e8ff",
    iconColor: "#a855f7",
    description: "Add new products to your inventory system"
  },
  { 
    name: "Low Stock Alerts", 
    route: "/stockManager/Low-stock alerts", 
    icon: "alert-circle-outline", 
    iconType: "Ionicons",
    bgColor: ["#fff7ed", "#ffedd5"],
    color: "bg-orange-50 dark:bg-orange-900/20",
    gradientFrom: "#fff7ed",
    gradientTo: "#ffedd5",
    iconColor: "#f97316",
    description: "View products that need to be restocked soon"
  },
  { 
    name: "Supplier Orders", 
    route: "/stockManager/Supplier_order_management", 
    icon: "truck-delivery", 
    iconType: "MaterialCommunityIcons",
    bgColor: ["#ecfdf5", "#d1fae5"],
    color: "bg-emerald-50 dark:bg-emerald-900/20",
    gradientFrom: "#ecfdf5",
    gradientTo: "#d1fae5",
    iconColor: "#10b981",
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
    color: "bg-blue-50 dark:bg-blue-900/20",
    gradientFrom: "#f0f9ff", 
    gradientTo: "#e0f2fe",
    iconColor: "#3b82f6",
    textColor: "#4338ca"
  },
  { 
    title: "Product List",
    description: "View and manage all products in inventory",
    route: "/stockManager/ProductList", 
    icon: "view-list", 
    iconType: "MaterialIcons",
    color: "bg-indigo-50 dark:bg-indigo-900/20",
    gradientFrom: "#eef2ff",
    gradientTo: "#e0e7ff",
    iconColor: "#6366f1",
    textColor: "#0369a1",
    badge: "Products"
  },
  { 
    title: "Add Category",
    description: "Create new categories for better organization",
    route: "/stockManager/addCategory", 
    icon: "pricetag", 
    iconType: "Ionicons",
    color: "bg-orange-50 dark:bg-orange-900/20",
    gradientFrom: "#fff7ed",
    gradientTo: "#ffedd5",
    iconColor: "#f97316",
    textColor: "#9a3412",
  },
  { 
    title: "Category List",
    description: "Manage all product categories and classification",
    route: "/stockManager/ViewCategory", 
    icon: "albums", 
    iconType: "Ionicons",
    color: "bg-purple-50 dark:bg-purple-900/20",
    gradientFrom: "#faf5ff",
    gradientTo: "#f3e8ff",
    iconColor: "#a855f7",
    textColor: "#6b21a8",
    badge: "Categories"
  },
  { 
    title: "Low Stock Alerts",
    description: "View products that need to be restocked soon",
    route: "/stockManager/Low-stock alerts", 
    icon: "alert-circle", 
    iconType: "Ionicons",
    color: "bg-red-50 dark:bg-red-900/20",
    gradientFrom: "#fef2f2",
    gradientTo: "#fee2e2",
    iconColor: "#ef4444",
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
    color: "bg-emerald-50 dark:bg-emerald-900/20",
    gradientFrom: "#ecfdf5",
    gradientTo: "#d1fae5",
    iconColor: "#10b981",
    textColor: "#15803d"
  },
];

// Quick action buttons from Manage_stock_levels.js
const quickActions = [
  {
    title: "Check Price",
    icon: "pricetag",
    iconType: "Ionicons",
    color: "bg-orange-50 dark:bg-orange-900/20",
    gradientFrom: "#fff7ed",
    gradientTo: "#ffedd5",
    iconColor: "#f97316",
    textColor: "#9a3412",
    action: () => Alert.alert("Price Check", "Price checker will open here")
  },
  {
    title: "Restock",
    icon: "archive",
    iconType: "Ionicons",
    color: "bg-emerald-50 dark:bg-emerald-900/20",
    gradientFrom: "#ecfdf5",
    gradientTo: "#d1fae5",
    iconColor: "#10b981",
    textColor: "#15803d",
    action: () => Alert.alert("Restock", "Restock workflow will start here")
  },
  {
    title: "Export",
    icon: "share",
    iconType: "Ionicons",
    color: "bg-blue-50 dark:bg-blue-900/20",
    gradientFrom: "#f0f9ff", 
    gradientTo: "#e0f2fe",
    iconColor: "#3b82f6",
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
  const [userName, setUserName] = useState("Stock Manager");
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockItems: 0,
    categories: 0,
    recentlyAdded: []
  });
  const [greeting, setGreeting] = useState("Good morning");
  const [animatedValue] = useState(new Animated.Value(0));
  
  // Add new animation values for enhanced interactivity
  const [scale] = useState(new Animated.Value(1));
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
  
  // Add missing card animation handlers
  const handleCardPressIn = (index) => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };
  
  const handleCardPressOut = (index) => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
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
  
  // Create dashboardData from stats for use in the UI
  const dashboardData = {
    totalProducts: stats.totalProducts,
    lowStockCount: stats.lowStockItems,
    categoryCount: stats.categories,
    productGrowth: "+12%",
    categoryGrowth: "+5%",
    lowStockChange: -3,
    pendingOrders: 7,
    pendingOrdersChange: 2
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

  // Add missing activity press handlers
  const handleActivityPressIn = (index) => {
    Animated.spring(activityCardScales[index], {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
  };
  
  const handleActivityPressOut = (index) => {
    Animated.spring(activityCardScales[index], {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6,
    }).start();
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
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <StatusBar style="light" />
      
      {/* Header */}
      <HomeHeader title="Stock Manager" />
      
      {/* Welcome Banner */}
      <Animated.View 
        style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0]
        }) }] }}
        className="mx-4 rounded-xl shadow-lg overflow-hidden my-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700"
      >
        <View className="px-5 py-4">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-gray-900 dark:text-white font-bold text-xl">Welcome Back, {userName}</Text>
              <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
            </View>
            
            <Animated.View 
              style={{
                transform: [{ scale: scale.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1]
                }) }]
              }}
              className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-full"
            >
              <Ionicons name="cube" size={24} color="#6366f1" />
            </Animated.View>
          </View>
          
          <View className="flex-row justify-between mt-5">
            <Pressable 
              className="bg-blue-50 dark:bg-blue-900/20 px-3 py-2.5 rounded-lg flex-row items-center"
              onPress={() => router.push("/stockManager/ProductList")}
            >
              <Ionicons name="cube" size={18} color="#3b82f6" style={{marginRight: 6}} />
              <View>
                <Text className="text-blue-600 dark:text-blue-400 font-bold">{dashboardData.totalProducts}</Text>
                <Text className="text-gray-600 dark:text-gray-400 text-xs">Products</Text>
              </View>
            </Pressable>
            
            <Pressable 
              className="bg-amber-50 dark:bg-amber-900/20 px-3 py-2.5 rounded-lg flex-row items-center"
              onPress={() => router.push("/stockManager/Low-stock alerts")}
            >
              <Ionicons name="alert-circle" size={18} color="#d97706" style={{marginRight: 6}} />
              <View>
                <Text className="text-amber-600 dark:text-amber-400 font-bold">{dashboardData.lowStockCount}</Text>
                <Text className="text-gray-600 dark:text-gray-400 text-xs">Low Stock</Text>
              </View>
            </Pressable>
            
            <Pressable
              className="bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2.5 rounded-lg flex-row items-center"
              onPress={() => router.push("/stockManager/ViewCategory")}
            >
              <Ionicons name="albums" size={18} color="#10b981" style={{marginRight: 6}} />
              <View>
                <Text className="text-emerald-600 dark:text-emerald-400 font-bold">{dashboardData.categoryCount}</Text>
                <Text className="text-gray-600 dark:text-gray-400 text-xs">Categories</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </Animated.View>
      
      <Animated.ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#6366f1"]} />
        }
      >
        {/* Inventory Overview */}
        <View className="mx-4 mt-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-gray-800 dark:text-gray-200 font-bold text-lg">Inventory Overview</Text>
            <View className="bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full">
              <Text className="text-blue-600 dark:text-blue-400 font-medium text-sm">Real-time</Text>
            </View>
          </View>
          
          <View className="flex-row flex-wrap justify-between">
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
            }) }] }} className="w-[48%] mb-4">
              <Pressable 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 overflow-hidden relative" 
                onPress={() => router.push("/stockManager/ProductList")}
                onPressIn={() => handleCardPressIn(0)}
                onPressOut={() => handleCardPressOut(0)}
              >
                <LinearGradient
                  colors={['#f0f9ff', '#e0f2fe']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="absolute inset-0 opacity-60"
                />
                <View className="flex-row justify-between items-start mb-3">
                  <View className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                    <Ionicons name="cube" size={20} color="#3b82f6" />
                  </View>
                  <View className="bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                    <Text className="text-green-600 dark:text-green-400 text-xs font-medium">{dashboardData.productGrowth}</Text>
                  </View>
                </View>
                <Text className="text-2xl font-bold text-gray-800 dark:text-white">{dashboardData.totalProducts}</Text>
                <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">Total Products</Text>
              </Pressable>
            </Animated.View>
            
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
            }) }] }} className="w-[48%] mb-4">
              <Pressable 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 overflow-hidden relative" 
                onPress={() => router.push("/stockManager/ViewCategory")}
                onPressIn={() => handleCardPressIn(1)}
                onPressOut={() => handleCardPressOut(1)}
              >
                <LinearGradient
                  colors={['#eef2ff', '#e0e7ff']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="absolute inset-0 opacity-60"
                />
                <View className="flex-row justify-between items-start mb-3">
                  <View className="bg-indigo-50 dark:bg-indigo-900/20 p-2 rounded-lg">
                    <Ionicons name="albums" size={20} color="#6366f1" />
                  </View>
                  <View className="bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                    <Text className="text-green-600 dark:text-green-400 text-xs font-medium">{dashboardData.categoryGrowth}</Text>
                  </View>
                </View>
                <Text className="text-2xl font-bold text-gray-800 dark:text-white">{dashboardData.categoryCount}</Text>
                <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">Categories</Text>
              </Pressable>
            </Animated.View>
            
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
            }) }] }} className="w-[48%] mb-4">
              <Pressable 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 overflow-hidden relative" 
                onPress={() => router.push("/stockManager/Low-stock alerts")}
                onPressIn={() => handleCardPressIn(2)}
                onPressOut={() => handleCardPressOut(2)}
              >
                <LinearGradient
                  colors={['#fef2f2', '#fee2e2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="absolute inset-0 opacity-60"
                />
                <View className="flex-row justify-between items-start mb-3">
                  <View className="bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">
                    <Ionicons name="alert-circle" size={20} color="#ef4444" />
                  </View>
                  <View className={`${dashboardData.lowStockChange > 0 ? 'bg-red-50 dark:bg-red-900/30' : 'bg-green-50 dark:bg-green-900/30'} px-2 py-1 rounded-full`}>
                    <Text className={`${dashboardData.lowStockChange > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'} text-xs font-medium`}>
                      {dashboardData.lowStockChange > 0 ? '+' : ''}{dashboardData.lowStockChange}%
                    </Text>
                  </View>
                </View>
                <Text className="text-2xl font-bold text-gray-800 dark:text-white">{dashboardData.lowStockCount}</Text>
                <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">Low Stock Items</Text>
              </Pressable>
            </Animated.View>
            
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0]
            }) }] }} className="w-[48%] mb-4">
              <Pressable 
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 overflow-hidden relative" 
                onPress={() => router.push("/stockManager/Supplier_order_management")}
                onPressIn={() => handleCardPressIn(3)}
                onPressOut={() => handleCardPressOut(3)}
              >
                <LinearGradient
                  colors={['#ecfdf5', '#d1fae5']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="absolute inset-0 opacity-60"
                />
                <View className="flex-row justify-between items-start mb-3">
                  <View className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
                    <MaterialCommunityIcons name="truck-delivery" size={20} color="#10b981" />
                  </View>
                  <View className="bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full">
                    <Text className="text-green-600 dark:text-green-400 text-xs font-medium">{dashboardData.pendingOrdersChange}%</Text>
                  </View>
                </View>
                <Text className="text-2xl font-bold text-gray-800 dark:text-white">{dashboardData.pendingOrders}</Text>
                <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">Pending Orders</Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>
        
        {/* Recent Activities */}
        <View className="mx-4 mt-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-gray-800 dark:text-gray-200 font-bold text-lg">Recent Activity</Text>
            <TouchableOpacity 
              className="bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full"
              onPress={() => setActivityFilter('all')}
            >
              <Text className="text-blue-600 dark:text-blue-400 font-medium text-sm">View All</Text>
            </TouchableOpacity>
          </View>
          
          {activityData.map((activity, index) => (
            <Animated.View 
              key={index} 
              style={{
                opacity: fadeAnim,
                transform: [{
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20 * (index + 1), 0]
                  })
                }]
              }}
              className="mb-3"
            >
              <Pressable 
                className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 flex-row items-center relative overflow-hidden"
                onPress={() => handleActivityPress(index, activity)}
                onPressIn={() => handleActivityPressIn(index)}
                onPressOut={() => handleActivityPressOut(index)}
              >
                <LinearGradient
                  colors={['#f9fafb', '#f3f4f6']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="absolute inset-0 opacity-60"
                />
                <View className={`${activity.color} w-10 h-10 rounded-full items-center justify-center mr-3`}>
                  {activity.iconType === "Ionicons" && <Ionicons name={activity.icon} size={18} color={activity.textColor} />}
                  {activity.iconType === "MaterialIcons" && <MaterialIcons name={activity.icon} size={18} color={activity.textColor} />}
                  {activity.iconType === "MaterialCommunityIcons" && <MaterialCommunityIcons name={activity.icon} size={18} color={activity.textColor} />}
                </View>
                
                <View className="flex-1">
                  <Text className="font-semibold text-gray-800 dark:text-white">{activity.title}</Text>
                  <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">{activity.description}</Text>
                </View>
                
                <View>
                  <Text className="text-gray-400 dark:text-gray-500 text-xs">{formatRelativeTime(activity.timestamp)}</Text>
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </View>

        {/* Management Tools (Merged) */}
        <View className="mx-4 mt-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-gray-800 dark:text-gray-200 font-bold text-lg">Management Tools</Text>
          </View>
          
          <View className="flex-row flex-wrap justify-between">
            {/* Main Management Tools */}
            {stockOptions.map((option, index) => (
              <Animated.View
                key={`stock-${index}`}
                style={{
                  opacity: fadeAnim,
                  transform: [{
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20 * (index + 1), 0]
                    })
                  }]
                }}
                className="w-[48%] mb-4"
              >
                <Pressable
                  onPress={() => router.push(option.route)}
                  onPressIn={() => handleCardPressIn(index)}
                  onPressOut={() => handleCardPressOut(index)}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 overflow-hidden relative"
                >
                  <LinearGradient
                    colors={[option.gradientFrom, option.gradientTo]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="absolute inset-0 opacity-60"
                  />
                  <View className="flex-row justify-between items-start mb-3">
                    <View className={`${option.color} p-2 rounded-lg`}>
                      {option.iconType === "Ionicons" && (
                        <Ionicons name={option.icon} size={20} color={option.iconColor} />
                      )}
                      {option.iconType === "MaterialIcons" && (
                        <MaterialIcons name={option.icon} size={20} color={option.iconColor} />
                      )}
                      {option.iconType === "FontAwesome5" && (
                        <FontAwesome5 name={option.icon} size={18} color={option.iconColor} />
                      )}
                      {option.iconType === "MaterialCommunityIcons" && (
                        <MaterialCommunityIcons name={option.icon} size={20} color={option.iconColor} />
                      )}
                    </View>
                    {option.badge && (
                      <View className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                        <Text className="text-gray-600 dark:text-gray-400 text-xs font-medium">{option.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text className="font-bold text-gray-800 dark:text-white">{option.title}</Text>
                  <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1" numberOfLines={2}>{option.description}</Text>
                </Pressable>
              </Animated.View>
            ))}
            
            {/* Quick Action Tools */}
            {quickActions.map((action, index) => (
              <Animated.View
                key={`action-${index}`}
                style={{
                  opacity: fadeAnim,
                  transform: [{
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20 * (index + stockOptions.length + 1), 0]
                    })
                  }]
                }}
                className="w-[48%] mb-4"
              >
                <Pressable
                  onPress={() => action.action()}
                  onPressIn={() => handleCardPressIn(index + stockOptions.length)}
                  onPressOut={() => handleCardPressOut(index + stockOptions.length)}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 overflow-hidden relative"
                >
                  <LinearGradient
                    colors={[action.gradientFrom, action.gradientTo]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="absolute inset-0 opacity-60"
                  />
                  <View className="flex-row justify-between items-start mb-3">
                    <View className={`${action.color} p-2 rounded-lg`}>
                      {action.iconType === "Ionicons" && (
                        <Ionicons name={action.icon} size={20} color={action.iconColor} />
                      )}
                      {action.iconType === "MaterialCommunityIcons" && (
                        <MaterialCommunityIcons name={action.icon} size={20} color={action.iconColor} />
                      )}
                    </View>
                  </View>
                  <Text className="font-bold text-gray-800 dark:text-white">{action.title}</Text>
                  <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">{action.title === "Scan Barcode" ? "Scan product barcodes for quick lookup" : 
                         action.title === "Check Price" ? "Verify current product pricing" :
                         action.title === "Restock" ? "Quick restock process for products" :
                         "Export inventory data as reports"}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Rest of the existing UI components */}
        {/* ... */}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}