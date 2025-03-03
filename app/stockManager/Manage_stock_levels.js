import React from "react";
import { ScrollView, SafeAreaView, View, Text, TouchableOpacity } from "react-native";
import { useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";

const options = [
  { title: "Add Product", icon: "plus-circle", route: "/stockManager/addProduct" },
  { title: "Remove Product", icon: "trash-alt", route: "/stockManager/removeproduct" },
  { title: "Update Product", icon: "edit", route: "/stockManager/updateproduct" },
  { title: "View Product List", icon: "list-alt", route: "/stockManager/viewProduct" },
  { title: "Add New Category", icon: "tags", route: "/stockManager/addCategory" },
  { title: "Update Category", icon: "pencil-alt", route: "/stockManager/updateCategory" },
  { title: "Remove Category", icon: "minus-circle", route: "/stockManager/removeCategory" },
  { title: "View Categories List", icon: "th-list", route: "/stockManager/viewCategories" },
];

export default function ManageStock() {
  const { width } = useWindowDimensions();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerClassName="pb-3" showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold text-gray-800 text-center mb-6">Manage Stock</Text>

        <View className="flex-row flex-wrap justify-center px-4 gap-4">
          {options.map(({ title, icon, route }, index) => (
            <TouchableOpacity
              key={index}
              className="bg-white w-40 h-24 justify-center items-center rounded-lg border border-gray-300 shadow-md active:bg-gray-200"
              style={{ width: width * 0.42 }}
              onPress={() => router.push(route)}
            >
              <FontAwesome5 name={icon} size={24} color="black" />
              <Text className="text-lg font-semibold text-gray-800 text-center mt-2">{title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
