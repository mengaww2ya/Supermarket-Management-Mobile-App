import React, { useState, useEffect, useRef } from "react";
import { 
  ScrollView, 
  SafeAreaView, 
  View, 
  Text, 
  Pressable, 
  Alert, 
  StatusBar, 
  Image,
  TouchableOpacity,
  Animated,
  Platform,
  Vibration,
  ActivityIndicator
} from "react-native";
import { useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

export default function ManageStock() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pressedOptionIndex, setPressedOptionIndex] = useState(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const refreshIconAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  
  // Stock management options with enhanced data
  const options = [
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
      badge: "32 Products"
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
      badge: "8 Categories"
    },
    { 
      title: "Low Stock Alerts",
      description: "View products that need to be restocked soon",
      route: "/stockManager/Low-stock alerts", 
      icon: "alert-circle", 
      iconType: "Ionicons",
      color: ["#f8fafc", "#fee2e2"],
      textColor: "#b91c1c",
      badge: "3 Alerts",
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

  // Create animation values for each option - MOVED after options definition
  const optionAnimations = useRef(Array(options.length).fill().map(() => ({
    scale: new Animated.Value(1),
    rotate: new Animated.Value(0)
  }))).current;
  
  // Quick action buttons
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
  
  // Mock stats data (in a real app, fetch this from backend)
  const stats = {
    totalProducts: 284,
    lowStock: 8,
    outOfStock: 3,
    lastUpdated: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  };
  
  // Run animations when component mounts
  useEffect(() => {
    // Start fade-in and translation animations
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
    
    // Start pulse animation - with more subtle effect
    const startPulseAnimation = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ]).start(() => startPulseAnimation());
    };
    
    startPulseAnimation();
    
    return () => {
      // Clean up animations
      pulseAnim.stopAnimation();
    };
  }, []);
  
  // Function to handle refresh animation
  const handleRefresh = () => {
    Vibration.vibrate(20);
    setIsRefreshing(true);
    
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
    
    // In a real app, this would refresh data from backend
    setTimeout(() => {
      setIsRefreshing(false);
      shimmerAnim.stopAnimation();
      shimmerAnim.setValue(0);
    }, 1500);
  };
  
  // Function to handle option press with animation
  const handleOptionPress = (index, route) => {
    // Set the pressed index for visual feedback
    setPressedOptionIndex(index);
    
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
      Animated.parallel([
        Animated.spring(optionAnimations[index].scale, {
          toValue: 0.97,
          friction: 5,
          useNativeDriver: true
        }),
        Animated.timing(optionAnimations[index].rotate, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]),
      Animated.parallel([
        Animated.spring(optionAnimations[index].scale, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true
        }),
        Animated.timing(optionAnimations[index].rotate, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        })
      ])
    ]).start();
    
    // Navigate after a short delay to see the animation
    setTimeout(() => {
      setPressedOptionIndex(null);
      if (route) {
        router.push(route);
      } else {
        Alert.alert("Coming Soon", "This feature is under development and will be available soon.");
      }
    }, 200);
  };
  
  // Icon rotation interpolation
  const refreshRotate = refreshIconAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });
  
  // Create a shimmer effect interpolation
  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 200]
  });
  
  // Render different icons based on type
  const renderIcon = (icon, type, size = 24, color = "#FFF") => {
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

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      {/* Header Section */}
      <Animated.View 
        className="bg-white rounded-b-3xl shadow-lg"
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: translateAnim }],
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5,
        }}
      >
        <LinearGradient
          colors={["#4338CA", "#6366F1", "#7C3AED"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.8 }}
          className="rounded-b-3xl pt-6 pb-7 px-5"
        >
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-base text-indigo-100 mb-1 font-medium">
                Stock Management
              </Text>
              <View className="flex-row items-center">
                <Text className="text-3xl font-bold text-white tracking-tight">
                  Manage Stock
                </Text>
                <Animated.View 
                  className="ml-2 bg-white/20 px-2 py-1 rounded-xl border border-white/30"
                  style={{ 
                    transform: [{ scale: pulseAnim }],
                    shadowColor: "#ffffff",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.2,
                    shadowRadius: 10,
                  }}
                >
                  <Text className="text-xs text-white font-semibold">LIVE</Text>
                </Animated.View>
              </View>
            </View>
            <TouchableOpacity 
              className="w-[50px] h-[50px] rounded-full bg-white/20 justify-center items-center border-2 border-white/30"
              style={{
                shadowColor: "#ffffff",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
              }}
              onPress={handleRefresh}
            >
              <Animated.View style={{ 
                transform: [{ 
                  rotate: refreshIconAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg']
                  }) 
                }] 
              }}>
                <Ionicons name="refresh" size={26} color="#ffffff" />
              </Animated.View>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom }}
      >
        {/* Quick Actions */}
        <View className="px-4 py-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold text-gray-800">Quick Actions</Text>
            <TouchableOpacity className="flex-row items-center">
              <Text className="text-sm text-gray-500 mr-1">More</Text>
              <Ionicons name="chevron-forward" size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View className="flex-row flex-wrap justify-between">
            {quickActions.map((action, index) => (
              <Animated.View 
                key={index}
                style={{
                  width: (screenWidth - 48) / 2,
                  marginBottom: 16,
                  transform: [{ scale: optionAnimations[index].scale }]
                }}
              >
                <TouchableOpacity
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                  }}
                  onPressIn={() => {
                    Animated.spring(optionAnimations[index].scale, {
                      toValue: 0.95,
                      useNativeDriver: true,
                    }).start();
                  }}
                  onPressOut={() => {
                    Animated.spring(optionAnimations[index].scale, {
                      toValue: 1,
                      useNativeDriver: true,
                    }).start();
                  }}
                  onPress={action.action}
                >
                  <View className="flex-row items-center">
                    <View 
                      className="w-10 h-10 rounded-lg justify-center items-center mr-3"
                      style={{ backgroundColor: action.color }}
                    >
                      {renderIcon(action.icon, action.iconType, 20, action.textColor)}
                    </View>
                    <Text className="text-base font-medium" style={{ color: action.textColor }}>
                      {action.title}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* Stats Section */}
        <View className="px-4 mb-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold text-gray-800">Inventory Overview</Text>
            <Text className="text-sm text-gray-500">
              Last updated: {stats.lastUpdated}
            </Text>
          </View>
          
          <View className="flex-row flex-wrap justify-between">
            <View className="w-[48%] bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm text-gray-500">Total Products</Text>
                <View className="w-8 h-8 rounded-lg bg-indigo-50 justify-center items-center">
                  <Ionicons name="cube" size={16} color="#4F46E5" />
                </View>
              </View>
              <Text className="text-2xl font-bold text-gray-800">{stats.totalProducts}</Text>
            </View>
            
            <View className="w-[48%] bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm text-gray-500">Low Stock</Text>
                <View className="w-8 h-8 rounded-lg bg-red-50 justify-center items-center">
                  <Ionicons name="warning" size={16} color="#EF4444" />
                </View>
              </View>
              <Text className="text-2xl font-bold text-gray-800">{stats.lowStock}</Text>
            </View>
            
            <View className="w-[48%] bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm text-gray-500">Out of Stock</Text>
                <View className="w-8 h-8 rounded-lg bg-amber-50 justify-center items-center">
                  <Ionicons name="close-circle" size={16} color="#F59E0B" />
                </View>
              </View>
              <Text className="text-2xl font-bold text-gray-800">{stats.outOfStock}</Text>
            </View>
          </View>
        </View>

        {/* Main Options */}
        <View className="px-4">
          <Text className="text-lg font-semibold text-gray-800 mb-3">Stock Management</Text>
          
          <View className="flex-row flex-wrap justify-between">
            {options.map((option, index) => (
              <Animated.View 
                key={index}
                style={{
                  width: (screenWidth - 48) / 2,
                  marginBottom: 16,
                  transform: [{ scale: optionAnimations[index].scale }]
                }}
              >
                <TouchableOpacity
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                  }}
                  onPressIn={() => {
                    Animated.spring(optionAnimations[index].scale, {
                      toValue: 0.95,
                      useNativeDriver: true,
                    }).start();
                  }}
                  onPressOut={() => {
                    Animated.spring(optionAnimations[index].scale, {
                      toValue: 1,
                      useNativeDriver: true,
                    }).start();
                  }}
                  onPress={() => handleOptionPress(index, option.route)}
                >
                  <View className="flex-row items-start justify-between mb-3">
                    <View 
                      className="w-10 h-10 rounded-lg justify-center items-center"
                      style={{ backgroundColor: option.color[1] }}
                    >
                      {renderIcon(option.icon, option.iconType, 20, option.textColor)}
                    </View>
                    {option.badge && (
                      <View 
                        className="px-2 py-1 rounded-lg"
                        style={{ backgroundColor: option.color[1] }}
                      >
                        <Text className="text-xs font-medium" style={{ color: option.textColor }}>
                          {option.badge}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  <Text className="text-base font-semibold text-gray-800 mb-1">
                    {option.title}
                  </Text>
                  <Text className="text-sm text-gray-500">
                    {option.description}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ShimmerEffect component with NativeWind
const ShimmerEffect = ({ width, height, style }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View 
      className="overflow-hidden bg-gray-200"
      style={[{ width, height }, style]}
    >
      <Animated.View
        className="absolute w-full h-full"
        style={{
          transform: [{ translateX }],
          backgroundColor: 'rgba(255, 255, 255, 0.5)',
        }}
      />
    </View>
  );
};
