import { SafeAreaView, ScrollView, View, Text, TouchableOpacity } from "react-native";

export default function PromotionManagement({ navigation }) {
  const menuItems = [
    {
      title: "Special Event Discounts",
      subtitle: "Integrate seasonal or special event discounts",
      onPress: () => alert("Hey! This button is not functional right now."),
    },
    {
      title: "Product Discounts",
      subtitle: "Set up product discounts and offers",
      onPress: () => alert("Hey! This button is not functional right now."),
    },
    {
      title: "Discount Based on Customer",
      subtitle: "Apply discount rules based on customer categories",
      onPress: () => alert("Hey! This button is not functional right now."),
    },
    {
      title: "Review Discounts",
      subtitle: "Display all applied discounts",
      onPress: () => alert("Hey! This button is not functional right now."),
    },
    {
      title: "Remove Discounts",
      subtitle: "Remove all applied discounts",
      onPress: () => alert("Hey! This button is not functional right now."),
    },
  ];

  return (
    <SafeAreaView className="flex-1  bg-grey1">
      <ScrollView className="px-4 py-6">
        {/* Title */}
        <View className="bg-gray-800 p-4 rounded-lg shadow-md">
          <Text className="text-2xl font-bold text-white text-center">Promotion Management</Text>
        </View>

        {/* Button Grid */}
        <View className="flex-row flex-wrap justify-between mt-6">
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              className="w-[48%] bg-white p-5 rounded-xl shadow-md mb-4 active:bg-gray-200"
              style={{
                minHeight: 110, // Ensures text wraps
                justifyContent: "center",
                alignItems: "center",
                elevation: 5, // For better shadow on Android
              }}
              onPress={item.onPress}
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
