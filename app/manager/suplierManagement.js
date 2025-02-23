import { SafeAreaView, ScrollView, View, Text, TouchableOpacity } from "react-native";
import { useState } from "react";

export default function SupplierManagement() {
  const [pressed, setPressed] = useState(null);

  const menuItems = [
    { title: "Add Supplier", subtitle: "Register a new supplier" },
    { title: "Update Supplier", subtitle: "Modify supplier details" },
    { title: "Remove Supplier", subtitle: "Delete a supplier" },
    { title: "Contracts & Pricing", subtitle: "Manage supplier agreements" },
    { title: "View Suppliers", subtitle: "See all registered suppliers" }, // Added this button
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView className="px-4 py-6">
        {/* Header */}
        <View className="bg-blue-600 p-5 rounded-lg shadow-lg">
          <Text className="text-2xl font-bold text-white text-center">Supplier Management</Text>
        </View>

        {/* Buttons Grid */}
        <View className="flex-row flex-wrap justify-between mt-6">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              className={`w-[48%] bg-white p-5 rounded-xl shadow-lg mb-4 ${
                pressed === index ? "bg-blue-100 scale-95" : "active:bg-gray-200"
              }`}
              style={{
                minHeight: 120,
                justifyContent: "center",
                alignItems: "center",
                elevation: 5,
              }}
              onPressIn={() => setPressed(index)}
              onPressOut={() => setPressed(null)}
              onPress={() => alert(`📋 ${item.title} feature coming soon!`)}
            >
              <Text className="text-lg font-semibold text-gray-800 text-center">{item.title}</Text>
              <Text className="text-gray-500 text-center text-sm mt-1">{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
