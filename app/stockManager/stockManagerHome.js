import React from "react";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";

export default function StockManagerHome() {
  const router = useRouter();

  const options = [
    { name: "Stock Management", route:"/stockManager/Manage_stock_levels"},
    { name: "Review Stock Status", route: "/stockManager/" },
    { name: "Supplier Order Management", route: "" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView contentContainerStyle={{ alignItems: "center", paddingVertical: 20 }}>
        <Text className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Welcome to Stock Management
        </Text>
        
        <View className="w-full flex items-center space-y-4">
          {options.map((item, index) => (
            <Pressable
              key={index}
              className="w-4/5 h-16 bg-gray-200 rounded-lg flex items-center justify-center shadow-md active:bg-gray-300"
              onPress={() => item.route ? router.push(item.route) : alert('Feature coming soon!')}
            >
              <Text className="text-lg font-semibold text-gray-800">{item.name}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
