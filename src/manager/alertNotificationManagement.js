import { SafeAreaView, ScrollView, View, Text, TouchableOpacity } from "react-native";

export default function AlertNotifManagement() {
  const alertItems = [
    { title: "Low Stock Alert", subtitle: "Get notified when stock is running low" },
    { title: "Expiry Date Alert", subtitle: "Receive alerts for soon-to-expire products" },
    { title: "Supplier Delay Alert", subtitle: "Track supplier delivery delays" },
    { title: "System Alert", subtitle: "Monitor system errors and updates" },
    { title: "Order Status Alert", subtitle: "Stay updated on new and pending orders" },
    { title: "Promotional Alert", subtitle: "Notify customers about discounts" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView className="px-4 py-6">
        {/* Header */}
        <View className="bg-blue-600 p-5 rounded-lg shadow-lg">
          <Text className="text-2xl font-bold text-white text-center">Alert & Notification Management</Text>
        </View>

        {/* Alert Categories - Two Column Layout */}
        <View className="mt-6 flex-row flex-wrap justify-between">
          {alertItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              className="bg-white w-[48%] p-5 rounded-xl shadow-lg mb-4 active:bg-gray-200"
              style={{
                minHeight: 100,
                justifyContent: "center",
                elevation: 5,
              }}
              onPress={() => alert(`🔔 ${item.title} feature coming soon!`)}
            >
              <Text className="text-lg font-semibold text-gray-800">{item.title}</Text>
              <Text className="text-gray-500 text-sm mt-1">{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
