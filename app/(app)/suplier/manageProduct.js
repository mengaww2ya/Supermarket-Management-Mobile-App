import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
  AntDesign,
  Feather,
  MaterialIcons,
  Octicons,
} from '@expo/vector-icons';
import Animated, {
  FadeInDown,
} from 'react-native-reanimated';
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from 'expo-haptics';
import HomeHeader from "../../components/HomeHeader";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  doc,
  getFirestore,
  collectionGroup
} from "firebase/firestore";
import { db, auth } from "../../../firebase/firebaseConfig";

// Management option card component
const ManagementCard = ({ title, description, icon, iconBgColor, onPress, index }) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(50 * index).duration(400)}
      className="w-[48%] p-4 rounded-xl mb-4"
      style={{
        backgroundColor: `${iconBgColor}15`, // 15% opacity
      }}
    >
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
      >
        <View style={{ backgroundColor: iconBgColor }} className="w-12 h-12 rounded-full items-center justify-center mb-3">
          {icon}
        </View>
        <Text className="text-gray-800 font-medium mb-1">{title}</Text>
        <Text className="text-gray-500 text-xs">{description}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Stat card component
const StatCard = ({ title, value, icon, color, index, isLoading }) => {
  return (
    <Animated.View
      entering={FadeInDown.delay(100 * index).duration(400)}
      className="w-[48%] bg-white p-4 rounded-xl mb-4 shadow-sm border border-gray-100"
    >
      <View style={{ backgroundColor: `${color}30` }} className="w-10 h-10 rounded-lg items-center justify-center mb-2">
        {icon}
      </View>
      {isLoading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        <Text className="text-xl font-bold text-gray-800">{value}</Text>
      )}
      <Text className="text-sm text-gray-500">{title}</Text>
    </Animated.View>
  );
};

export default function InventoryManagement() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inventoryStats, setInventoryStats] = useState({
    totalProducts: 0,
    categories: 0,
    lowStock: 0,
    outOfStock: 0
  });

  const currentUser = auth.currentUser;

  // Fetch inventory statistics from database
  const fetchInventoryStats = async () => {
    try {
      if (!currentUser) return;

      const supplierId = currentUser.uid;
      let totalProducts = 0;
      let categories = 0;
      let lowStock = 0;
      let outOfStock = 0;

      // Get categories count from supplier_category collection
      const supplierCategoriesRef = collection(db, 'supplier_category');
      const categoriesQuery = query(
        supplierCategoriesRef,
        where("supplierId", "==", supplierId)
      );
      const categoriesSnapshot = await getDocs(categoriesQuery);
      categories = categoriesSnapshot.size;

      // Loop through each category to count products
      for (const categoryDoc of categoriesSnapshot.docs) {
        const categoryId = categoryDoc.id;

        // Get products from the subcollection for each category
        const categoryProductsRef = collection(db, 'supplier_category', categoryId, 'products');
        const productsQuery = query(
          categoryProductsRef,
          where("supplierId", "==", supplierId)
        );

        const productsSnapshot = await getDocs(productsQuery);

        // Add to total products count
        totalProducts += productsSnapshot.size;

        // Count low stock and out of stock products
        productsSnapshot.forEach((doc) => {
          const product = doc.data();
          if (product.quantity === 0 || product.quantity === "0") {
            outOfStock++;
          } else if (product.lowStockThreshold &&
            product.quantity <= product.lowStockThreshold) {
            lowStock++;
          }
        });
      }

      setInventoryStats({
        totalProducts,
        categories,
        lowStock,
        outOfStock
      });
    } catch (error) {
      console.error("Error fetching inventory stats:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchInventoryStats();
  }, []);

  // Handle refresh
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    fetchInventoryStats();
  }, []);

  // Inventory stats data
  const stats = [
    {
      title: "Total Products",
      value: inventoryStats.totalProducts.toString(),
      icon: <MaterialCommunityIcons name="package-variant" size={22} color="#3b82f6" />,
      color: "#3b82f6"
    },
    {
      title: "Categories",
      value: inventoryStats.categories.toString(),
      icon: <Ionicons name="grid-outline" size={22} color="#8b5cf6" />,
      color: "#8b5cf6"
    },
    {
      title: "Low Stock",
      value: inventoryStats.lowStock.toString(),
      icon: <Feather name="alert-triangle" size={22} color="#f97316" />,
      color: "#f97316"
    },
    {
      title: "Out of Stock",
      value: inventoryStats.outOfStock.toString(),
      icon: <MaterialIcons name="inventory" size={22} color="#ef4444" />,
      color: "#ef4444"
    },
  ];

  // Management options data
  const managementOptions = [
    {
      title: "Add New Product",
      description: "Create and publish new product listings",
      icon: <AntDesign name="plus" size={22} color="#fff" />,
      iconBgColor: "#3b82f6",
      action: () => router.push("/suplier/addProduct")
    },
    {
      title: "View Products",
      description: "Browse and search your product catalog",
      icon: <MaterialCommunityIcons name="eye-outline" size={22} color="#fff" />,
      iconBgColor: "#8b5cf6",
      action: () => router.push("/suplier/viewProducts")
    },
    {
      title: "Add Category",
      description: "Create new product categories",
      icon: <AntDesign name="addfolder" size={22} color="#fff" />,
      iconBgColor: "#f97316",
      action: () => {
        router.push({
          pathname: "/(app)/suplier/addCategory",
          params: { openAddModal: "true" }
        });
      }
    },
    {
      title: "View Categories",
      description: "Browse and search product categories",
      icon: <MaterialIcons name="category" size={22} color="#fff" />,
      iconBgColor: "#f43f5e",
      action: () => router.push("/(app)/suplier/(tabs)/categories")
    },
    {
      title: "Inventory Alerts",
      description: "Configure stock level notifications",
      icon: <Octicons name="bell" size={22} color="#fff" />,
      iconBgColor: "#6366f1",
      action: () => router.push("/suplier/manageOrder")
    },
    {
      title: "Inventory Reports",
      description: "Generate stock and sales reports",
      icon: <Feather name="bar-chart-2" size={22} color="#fff" />,
      iconBgColor: "#14b8a6",
      action: () => router.push("/suplier/SPerformanceAnalytics")
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="light" />

      {/* Home Header */}
      <HomeHeader
        title="Inventory Management"
        showBackButton={true}
        onBackPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4F46E5"]}
            tintColor="#4F46E5"
          />
        }
      >
        <View className="p-4">
          {/* Stats Section */}
          <View className="mb-6">
            <View className="flex-row justify-center items-center mb-4">
              <Feather name="bar-chart-2" size={20} color="#4F46E5" className="mr-2" />
              <Text className="text-lg font-semibold text-gray-800">Inventory Statistics</Text>
            </View>

            <View className="flex-row flex-wrap justify-between">
              {stats.map((stat, index) => (
                <StatCard
                  key={stat.title}
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  color={stat.color}
                  index={index}
                  isLoading={loading}
                />
              ))}
            </View>
          </View>

          {/* Management Options */}
          <View className="mb-6">
            <View className="flex-row justify-center items-center mb-4">
              <Feather name="settings" size={20} color="#4F46E5" className="mr-2" />
              <Text className="text-lg font-semibold text-gray-800">Management Tools</Text>
            </View>

            <View className="flex-row flex-wrap justify-between">
              {managementOptions.map((option, index) => (
                <ManagementCard
                  key={option.title}
                  title={option.title}
                  description={option.description}
                  icon={option.icon}
                  iconBgColor={option.iconBgColor}
                  onPress={option.action}
                  index={index}
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
