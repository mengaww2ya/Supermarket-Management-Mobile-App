import React from "react";
import { ScrollView, SafeAreaView, View, Text, Pressable, Alert } from "react-native";
import { useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";

export default function ManageStock() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const router = useRouter();

  const options = [
    { title: "Add Product", route: "/stockManager/AddProduct" },
    { title: "Remove Product", route: "" },
    { title: "Update Product", route: "/stockManager/updateproduct" },
    { title: "View Product List", route: "/stockManager/viewProduct" },
    { title: "Add New Categories", route: "/stockManager/addCategory" },
    { title: "Update Categories", route: "" },
    { title: "Remove Categories", route: "" },
    { title: "View Categories List", route: "" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView contentContainerStyle={{ alignItems: "center", paddingVertical: 20 }}>
        <Text className="text-2xl font-bold text-gray-800 mb-6">Welcome</Text>

        <View className="flex-row flex-wrap justify-center w-11/12 gap-4">
          {options.map((item, index) => (
            <Pressable
              key={index}
              className="bg-gray-300 w-40 h-24 justify-center items-center rounded-lg border border-gray-400 shadow-md hover:bg-gray-400 active:bg-gray-500"
              style={{ width: screenWidth * 0.4, height: screenHeight * 0.1 }}
              onPress={() => {
                if (item.route) {
                  router.push(item.route);
                } else {
                  Alert.alert("Feature not implemented", "This feature is coming soon!");
                }
              }}
            >
              <Text className="text-lg font-semibold text-gray-800 text-center">{item.title}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
