import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

const ReviewStock = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView contentContainerClassName="p-5">
        <Text className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Stock Review
        </Text>

        {/* Stock Overview Cards */}
        <View className="space-y-4">
          {/* Total Stock Items */}
          <TouchableOpacity className="bg-white p-4 rounded-lg shadow-md flex-row items-center active:bg-gray-200">
            <MaterialIcons name="inventory" size={24} color="blue" />
            <Text className="text-lg font-semibold text-gray-700 ml-3">
              Total Stock Items: <Text className="font-bold text-blue-600">250</Text>
            </Text>
          </TouchableOpacity>

          {/* Total Categories */}
          <TouchableOpacity className="bg-white p-4 rounded-lg shadow-md flex-row items-center active:bg-gray-200">
            <Ionicons name="layers-outline" size={24} color="green" />
            <Text className="text-lg font-semibold text-gray-700 ml-3">
              Total Categories: <Text className="font-bold text-green-600">12</Text>
            </Text>
          </TouchableOpacity>

          {/* Expired Products */}
          <TouchableOpacity className="bg-white p-4 rounded-lg shadow-md flex-row items-center active:bg-gray-200">
            <FontAwesome5 name="exclamation-triangle" size={22} color="red" />
            <Text className="text-lg font-semibold text-gray-700 ml-3">
              Expired Products: <Text className="font-bold text-red-500">5</Text>
            </Text>
          </TouchableOpacity>

          {/* Low Stock Alerts */}
          <TouchableOpacity className="bg-white p-4 rounded-lg shadow-md flex-row items-center active:bg-gray-200">
            <MaterialIcons name="warning" size={24} color="orange" />
            <Text className="text-lg font-semibold text-gray-700 ml-3">
              Low Stock Alerts: <Text className="font-bold text-orange-500">15</Text>
            </Text>
          </TouchableOpacity>

          {/* Pending Supplier Orders */}
          <TouchableOpacity className="bg-white p-4 rounded-lg shadow-md flex-row items-center active:bg-gray-200">
            <Ionicons name="cart-outline" size={24} color="purple" />
            <Text className="text-lg font-semibold text-gray-700 ml-3">
              Pending Supplier Orders: <Text className="font-bold text-purple-600">8</Text>
            </Text>
          </TouchableOpacity>

          {/* Expiring Soon Products */}
          <TouchableOpacity className="bg-white p-4 rounded-lg shadow-md flex-row items-center active:bg-gray-200">
            <MaterialIcons name="hourglass-empty" size={24} color="gray" />
            <Text className="text-lg font-semibold text-gray-700 ml-3">
              Expiring Soon Products: <Text className="font-bold text-gray-600">10</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReviewStock;
