import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function StockManagerHome() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="px-4 py-4 bg-white border-b border-gray-200">
        <Text className="text-2xl font-bold text-gray-800">Stock Manager</Text>
      </View>

      {/* Management Tools */}
      <ScrollView className="p-4">
        <Text className="text-lg font-semibold text-gray-800 mb-4">Management Tools</Text>

        <View className="flex-row flex-wrap justify-between">
          <TouchableOpacity
            onPress={() => router.push("/stockManager/addProduct")}
            className="w-[48%] bg-white p-4 rounded-xl mb-4 shadow-sm"
          >
            <View className="bg-indigo-100 w-12 h-12 rounded-full items-center justify-center mb-3">
              <Ionicons name="add-circle-outline" size={24} color="#4f46e5" />
            </View>
            <Text className="text-gray-800 font-medium mb-1">Add Product</Text>
            <Text className="text-gray-500 text-xs">Add new products to inventory</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/stockManager/ProductList")}
            className="w-[48%] bg-white p-4 rounded-xl mb-4 shadow-sm"
          >
            <View className="bg-indigo-100 w-12 h-12 rounded-full items-center justify-center mb-3">
              <Ionicons name="list-outline" size={24} color="#4f46e5" />
            </View>
            <Text className="text-gray-800 font-medium mb-1">Product List</Text>
            <Text className="text-gray-500 text-xs">View and manage all products</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/stockManager/expire")}
            className="w-[48%] bg-white p-4 rounded-xl mb-4 shadow-sm"
          >
            <View className="bg-red-100 w-12 h-12 rounded-full items-center justify-center mb-3">
              <Ionicons name="alert-circle-outline" size={24} color="#ef4444" />
            </View>
            <Text className="text-gray-800 font-medium mb-1">Expiration Notifications</Text>
            <Text className="text-gray-500 text-xs">View products approaching expiration</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/stockManager/Supplier_order_management")}
            className="w-[48%] bg-white p-4 rounded-xl mb-4 shadow-sm"
          >
            <View className="bg-blue-100 w-12 h-12 rounded-full items-center justify-center mb-3">
              <Ionicons name="business-outline" size={24} color="#3b82f6" />
            </View>
            <Text className="text-gray-800 font-medium mb-1">Supplier Management</Text>
            <Text className="text-gray-500 text-xs">Manage suppliers and catalogs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push("/stockManager/SupplierOrders")}
            className="w-[48%] bg-white p-4 rounded-xl mb-4 shadow-sm"
          >
            <View className="bg-purple-100 w-12 h-12 rounded-full items-center justify-center mb-3">
              <MaterialCommunityIcons name="clipboard-list-outline" size={24} color="#8b5cf6" />
            </View>
            <Text className="text-gray-800 font-medium mb-1">Supplier Orders</Text>
            <Text className="text-gray-500 text-xs">Manage and track supplier orders</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 