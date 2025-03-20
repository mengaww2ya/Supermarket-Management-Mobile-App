import React from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

export default function StockManagerHome() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView contentContainerClassName="p-5">
        {/* Welcome Message */}
        <Text className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Welcome, Stock Manager
        </Text>

        {/* Stock Overview Section */}
        <View className="bg-white p-4 rounded-lg shadow-md mb-5">
          <Text className="text-lg font-semibold text-gray-700 mb-2">Stock Overview</Text>
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-xl font-bold text-blue-600">250</Text>
              <Text className="text-gray-600">Total Items</Text>
            </View>
            <View className="items-center">
              <Text className="text-xl font-bold text-red-500">15</Text>
              <Text className="text-gray-600">Low Stock</Text>
            </View>
            <View className="items-center">
              <Text className="text-xl font-bold text-green-500">8</Text>
              <Text className="text-gray-600">Pending Orders</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="w-full flex gap-5">
          {/* Stock Management */}
          <TouchableOpacity
            className="flex-row items-center bg-white p-4 rounded-lg shadow-md active:bg-gray-200"
            onPress={() => router.push("/stockManager/Manage_stock_levels")}
          >
            <MaterialIcons name="inventory" size={24} color="gray" />
            <Text className="text-lg font-semibold text-gray-800 ml-3">Stock Management</Text>
          </TouchableOpacity>

          {/* Review Stock Status */}
          <TouchableOpacity
            className="flex-row items-center bg-white p-4 rounded-lg shadow-md active:bg-gray-200"
            onPress={() => router.push("/stockManager/reviewStock")}
          >
            <FontAwesome5 name="clipboard-list" size={22} color="gray" />
            <Text className="text-lg font-semibold text-gray-800 ml-3">Review Stock Status</Text>
          </TouchableOpacity>

          {/* Supplier Order Management */}
          <TouchableOpacity
            className="flex-row items-center bg-white p-4 rounded-lg shadow-md active:bg-gray-200"
            onPress={() => router.push("/stockManager/Supplier_order_management")}
          >
            <Ionicons name="cart-outline" size={24} color="gray" />
            <Text className="text-lg font-semibold text-gray-800 ml-3">Supplier Order Management</Text>
          </TouchableOpacity>

          {/* Notifications & Alerts */}
          <TouchableOpacity
            className="flex-row items-center bg-white p-4 rounded-lg shadow-md active:bg-gray-200"
            onPress={() => router.push("/stockManager/notifications")}
          >
            <Ionicons name="notifications-outline" size={24} color="gray" />
            <Text className="text-lg font-semibold text-gray-800 ml-3">Notifications & Alerts</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
