import React from "react";
import { SafeAreaView, FlatList, View, Text, Pressable } from "react-native";
import Icon from "react-native-vector-icons/Feather";
import { useRouter } from "expo-router";
export default function CustomerManagement() {
const router =useRouter();
  const menuItems = [
    { title: "Customer List", subtitle: "View customers", icon: "users", onPress: () => router.push("/manager/customerList") },
    { title: "Customer Feedback", subtitle: "Handle feedback", icon: "message-square", onPress: () => alert("Feature coming soon!") },
    { title: "Loyalty Program", subtitle: "Manage rewards", icon: "gift", onPress: () => alert("Feature coming soon!") },
    { title: "Reports & Insights", subtitle: "Analyze trends", icon: "bar-chart", onPress: () => alert("Feature coming soon!") },
    { title: "Purchase History", subtitle: "Track purchases", icon: "clipboard", onPress: () => alert("Feature coming soon!") },
  ];

  return (
    <SafeAreaView className="flex-1  bg-grey1 px-4 py-6">
      <Text className="text-2xl font-bold text-gray-800 mb-6">Customer Management</Text>

      {/* 2-Column Grid Layout with Spacing */}
      <FlatList
        data={menuItems}
        keyExtractor={(item, index) => index.toString()}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: "space-between", gap: 10 }}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <Pressable
            className="bg-white p-6 rounded-2xl shadow-md w-[48%] items-center justify-center active:bg-gray-200 mx-1 my-2"
            onPress={item.onPress}
          >
            <Icon name={item.icon} size={30} color="#4A90E2" />
            <Text className="text-lg font-semibold text-gray-800 mt-2">{item.title}</Text>
            <Text className="text-gray-500 text-sm text-center mt-1">{item.subtitle}</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
