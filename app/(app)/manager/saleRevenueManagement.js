import { SafeAreaView, ScrollView, View, Text, TouchableOpacity } from "react-native";
import { useState } from "react";

export default function SaleRevenueManagement() {
  const [pressed, setPressed] = useState(null);

  const menuItems = [
    { title: "Sales Reports", subtitle: "View daily, weekly, and monthly sales reports" },
    { title: "Revenue & Profit", subtitle: "Track revenue trends and profitability" },
    { title: "Payment Transactions", subtitle: "Monitor payment transactions" },
  ];

  return (
    <SafeAreaView className="flex-1  bg-grey1">
      <ScrollView className="px-4 py-6">
        {/* Title Section */}
        <View className="bg-green-600 p-5 rounded-lg shadow-lg">
          <Text className="text-2xl font-bold text-white text-center">Sale and Revenue</Text>
        </View>

        {/* Buttons Grid */}
        <View className="flex-row flex-wrap justify-between mt-6">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              className={`w-[48%] bg-white p-5 rounded-xl shadow-lg mb-4 ${
                pressed === index ? "bg-green-100 scale-95" : "active:bg-gray-200"
              }`}
              style={{
                minHeight: 120,
                justifyContent: "center",
                alignItems: "center",
                elevation: 5,
              }}
              onPressIn={() => setPressed(index)}
              onPressOut={() => setPressed(null)}
              onPress={() => alert(`📊 ${item.title} feature coming soon!`)}
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
