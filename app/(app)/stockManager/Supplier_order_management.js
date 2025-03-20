import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const SupplierOrderManagement = () => {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView contentContainerClassName="p-5">
        <Text className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Supplier Order Management
        </Text>

        {/* Order Management Options */}
        <View className="space-y-4">
          {/* View Delivery Orders */}
          <TouchableOpacity 
            className="bg-white p-4 rounded-lg shadow-md flex-row items-center active:bg-gray-200"
            onPress={() => router.push("/stockManager/deliveryOrders")}
          >
            <MaterialIcons name="local-shipping" size={24} color="blue" />
            <Text className="text-lg font-semibold text-gray-700 ml-3">
              View Delivery Orders
            </Text>
          </TouchableOpacity>

          {/* View All Supplier Orders */}
          <TouchableOpacity 
            className="bg-white p-4 rounded-lg shadow-md flex-row items-center active:bg-gray-200"
            onPress={() => router.push("/stockManager/supplierOrders")}
          >
            <Ionicons name="file-tray-full-outline" size={24} color="green" />
            <Text className="text-lg font-semibold text-gray-700 ml-3">
              View All Supplier
            </Text>
          </TouchableOpacity>

          {/* Send New Order */}
          <TouchableOpacity 
            className="bg-white p-4 rounded-lg shadow-md flex-row items-center active:bg-gray-200"
            onPress={() => router.push("/stockManager/sendOrder")}
          >
            <FontAwesome5 name="plus-circle" size={22} color="purple" />
            <Text className="text-lg font-semibold text-gray-700 ml-3">
              Send New Order
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default SupplierOrderManagement;
