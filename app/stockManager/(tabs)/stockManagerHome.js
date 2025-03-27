import React from "react";
import { ScrollView, SafeAreaView, View, Text, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "react-native-vector-icons"; // Importing Ionicons

export default function StockManagerHome() {
  const router = useRouter();

  const options = [
    { name: "Stock Management", route: "/stockManager/Manage_stock_levels", icon: "bar-chart-outline" },
    { name: "Review Stock Status", route: "/stockManager/", icon: "checkmark-circle-outline" },
    { name: "Supplier Order Management", route: "", icon: "cart-outline" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Yellow Header Box */}
      <View className="bg-[#FFDC2B] p-5 rounded-b-lg">
        <Text className="text-2xl font-bold text-gray-800 text-center">Welcome to Stock Management</Text>
      </View>

      <ScrollView contentContainerStyle={{ alignItems: "center", paddingVertical: 20 }}>
        <View className="flex flex-col items-center w-full">
          {options.map((item, index) => (
            <Pressable
              key={index}
              className="w-3/4 h-16 bg-green-600 rounded-lg flex items-center justify-center shadow-md active:bg-green-700 my-2" // Added vertical margins
              onPress={() => item.route ? router.push(item.route) : Alert.alert('Feature coming soon!')}
            >
              <Ionicons name={item.icon} size={30} color="#fff" />
              <Text className="text-lg font-semibold text-white ml-2">{item.name}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}