import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import HomeHeader from "../../../components/HomeHeader";

export default function SupplierHome() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  // Add dummy stats
  const [stats, setStats] = useState({
    products: 23,
    orders: 12,
    deliveries: 8,
    revenue: 12450,
    productGrowth: "+5%",
    orderGrowth: "+12%",
    deliveryGrowth: "+8%",
    revenueGrowth: "+16.2%"
  });

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="light" />

      {/* HomHeader */}
      <HomeHeader title="Supplier Dashboard" />

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
          {/* Business Overview Section */}
          <View className="mb-6">
            <View className="flex-row justify-center items-center mb-4">
              <View className="flex-row items-center">
                <Feather name="bar-chart-2" size={20} color="#4F46E5" className="mr-2" />
                <Text className="text-lg font-semibold text-gray-800">Business Overview</Text>
              </View>
              <View className="bg-indigo-100 px-3 py-1 rounded-full ml-3">
                <Text className="text-xs font-medium text-indigo-700">Real-time</Text>
              </View>
            </View>

            <View className="flex-row flex-wrap justify-between">
              {/* Products Stat */}
              <View className="w-[48%] bg-white p-4 rounded-xl mb-4 shadow-sm border border-gray-100">
                <View className="flex-row justify-between items-center mb-2">
                  <View className="bg-blue-100 w-10 h-10 rounded-lg items-center justify-center">
                    <MaterialCommunityIcons name="package-variant" size={20} color="#3b82f6" />
                  </View>
                  <View className="bg-green-50 px-2 py-1 rounded-md">
                    <Text className="text-xs font-medium text-green-600">{stats.productGrowth}</Text>
                  </View>
                </View>
                <Text className="text-xl font-bold text-gray-800">{stats.products}</Text>
                <Text className="text-sm text-gray-500">Total Products</Text>
              </View>

              {/* Orders Stat */}
              <View className="w-[48%] bg-white p-4 rounded-xl mb-4 shadow-sm border border-gray-100">
                <View className="flex-row justify-between items-center mb-2">
                  <View className="bg-red-100 w-10 h-10 rounded-lg items-center justify-center">
                    <Ionicons name="receipt-outline" size={20} color="#ef4444" />
                  </View>
                  <View className="bg-green-50 px-2 py-1 rounded-md">
                    <Text className="text-xs font-medium text-green-600">{stats.orderGrowth}</Text>
                  </View>
                </View>
                <Text className="text-xl font-bold text-gray-800">{stats.orders}</Text>
                <Text className="text-sm text-gray-500">Active Orders</Text>
              </View>

              {/* Deliveries Stat */}
              <View className="w-[48%] bg-white p-4 rounded-xl mb-4 shadow-sm border border-gray-100">
                <View className="flex-row justify-between items-center mb-2">
                  <View className="bg-purple-100 w-10 h-10 rounded-lg items-center justify-center">
                    <FontAwesome5 name="truck" size={18} color="#8b5cf6" />
                  </View>
                  <View className="bg-green-50 px-2 py-1 rounded-md">
                    <Text className="text-xs font-medium text-green-600">{stats.deliveryGrowth}</Text>
                  </View>
                </View>
                <Text className="text-xl font-bold text-gray-800">{stats.deliveries}</Text>
                <Text className="text-sm text-gray-500">Deliveries</Text>
              </View>

              {/* Revenue Stat */}
              <View className="w-[48%] bg-white p-4 rounded-xl mb-4 shadow-sm border border-gray-100">
                <View className="flex-row justify-between items-center mb-2">
                  <View className="bg-green-100 w-10 h-10 rounded-lg items-center justify-center">
                    <Ionicons name="cash-outline" size={20} color="#10b981" />
                  </View>
                  <View className="bg-green-50 px-2 py-1 rounded-md">
                    <Text className="text-xs font-medium text-green-600">{stats.revenueGrowth}</Text>
                  </View>
                </View>
                <Text className="text-xl font-bold text-gray-800">{stats.revenue} Birr</Text>
                <Text className="text-sm text-gray-500">Revenue</Text>
              </View>
            </View>
          </View>

          {/* Management Tools Section */}
          <View className="mb-6">
            <View className="flex-row justify-center items-center mb-4">
              <Feather name="settings" size={20} color="#4F46E5" className="mr-2" />
              <Text className="text-lg font-semibold text-gray-800">Management Tools</Text>
            </View>

            <View className="flex-row flex-wrap justify-between">
              <TouchableOpacity
                onPress={() => router.push("/suplier/manageProduct")}
                className="w-[48%] p-4 rounded-xl mb-4"
                style={{ backgroundColor: 'rgba(79, 70, 229, 0.15)' }}
              >
                <View className="bg-indigo-100 w-12 h-12 rounded-full items-center justify-center mb-3">
                  <MaterialCommunityIcons name="package-variant-closed" size={24} color="#4f46e5" />
                </View>
                <Text className="text-gray-800 font-medium mb-1">Product Management</Text>
                <Text className="text-gray-500 text-xs">Add and view your products</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/suplier/manageOrder")}
                className="w-[48%] p-4 rounded-xl mb-4"
                style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}
              >
                <View className="bg-red-100 w-12 h-12 rounded-full items-center justify-center mb-3">
                  <Ionicons name="receipt-outline" size={24} color="#ef4444" />
                </View>
                <Text className="text-gray-800 font-medium mb-1">Manage Orders</Text>
                <Text className="text-gray-500 text-xs">Process and track customer orders</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/suplier/manageDelivery")}
                className="w-[48%] p-4 rounded-xl mb-4"
                style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)' }}
              >
                <View className="bg-green-100 w-12 h-12 rounded-full items-center justify-center mb-3">
                  <FontAwesome5 name="truck" size={20} color="#10b981" />
                </View>
                <Text className="text-gray-800 font-medium mb-1">Deliveries</Text>
                <Text className="text-gray-500 text-xs">Schedule and track deliveries</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/suplier/SPerformanceAnalytics")}
                className="w-[48%] p-4 rounded-xl mb-4"
                style={{ backgroundColor: 'rgba(139, 92, 246, 0.15)' }}
              >
                <View className="bg-purple-100 w-12 h-12 rounded-full items-center justify-center mb-3">
                  <Ionicons name="analytics" size={24} color="#8b5cf6" />
                </View>
                <Text className="text-gray-800 font-medium mb-1">Analytics</Text>
                <Text className="text-gray-500 text-xs">View reports and insights</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/suplier/(tabs)/chat")}
                className="w-[48%] p-4 rounded-xl mb-4"
                style={{ backgroundColor: 'rgba(59, 130, 246, 0.15)' }}
              >
                <View className="bg-blue-100 w-12 h-12 rounded-full items-center justify-center mb-3">
                  <Ionicons name="chatbubble-outline" size={24} color="#3b82f6" />
                </View>
                <Text className="text-gray-800 font-medium mb-1">Chat</Text>
                <Text className="text-gray-500 text-xs">Communicate with customers</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/suplier/categories")}
                className="w-[48%] p-4 rounded-xl mb-4"
                style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }}
              >
                <View className="bg-amber-100 w-12 h-12 rounded-full items-center justify-center mb-3">
                  <Ionicons name="grid-outline" size={24} color="#f59e0b" />
                </View>
                <Text className="text-gray-800 font-medium mb-1">Categories</Text>
                <Text className="text-gray-500 text-xs">Manage product categories</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
