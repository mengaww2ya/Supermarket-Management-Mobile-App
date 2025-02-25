import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useRouter } from "expo-router"; // ✅ Use Expo Router
import { categories, products } from "../../global/data.js"; // Import categories and products

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.42;

export default function Homepage() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleCategoryPress = (item) => {
    // Navigate with category ID instead of passing the products array
    router.push({
      pathname: "/customer/ProductDisplay", // Ensure this matches the file structure
      params: { categoryId: item.categoryId, categoryName: item.categoryName },
    });
  };

   const  renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      className="bg-white border border-gray-200 rounded-lg shadow-md p-3 m-2 items-center justify-center"
      style={{ width: CARD_WIDTH, maxHeight: 200 }}
      onPress={() => handleCategoryPress(item)}
    >
      <Text className="text-base font-bold text-center text-blue-700">{item.categoryName}</Text>
      <View className="w-full h-24">
        <Image
          className="rounded-md my-2"
          source={item.image}
          style={{ width: "100%", height: "100%", resizeMode: "contain" }}
        />
      </View>
      <Text className="text-sm font-medium text-center w-full py-2">{item.description}</Text>
    </TouchableOpacity>
  );

  const promotionCategories = categories.filter(category => category.discountAvailable);
  const standardCategories = categories.filter(category => !category.discountAvailable);

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header Section */}
      {/* <View className="flex-row items-center justify-between bg-yellow-400 px-4 py-3">
        <TouchableOpacity onPress={handleCategoryPress}>
          <Ionicons name="menu" size={30} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-bold">Home Page</Text>
        <TouchableOpacity onPress={() => router.push("/cartPage")}>
          <Ionicons name="cart" size={30} color="black" />
        </TouchableOpacity>
      </View> */}

      {/* Search Bar */}
      <View className="flex-row items-center bg-white rounded-md px-3 py-2 mx-4 my-3 shadow-md">
        <Ionicons name="search" size={24} color="gray" />
        <TextInput
          className="flex-1 ml-2 text-lg"
          placeholder="Search categories..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView className="flex-1 px-4">
        <Text className="text-xl font-bold text-center text-green-600 my-3">Promotion Categories</Text>
        <FlatList
          numColumns={2}
          data={promotionCategories}
          keyExtractor={(item) => item.categoryId.toString()}
          renderItem={renderCategoryItem}
          contentContainerStyle={{ alignItems: "center" }}
        />

        <Text className="text-xl font-bold text-center text-blue-500 my-3">Standard Categories</Text>
        <FlatList
          numColumns={2}
          data={standardCategories}
          keyExtractor={(item) => item.categoryId.toString()}
          renderItem={renderCategoryItem}
          contentContainerStyle={{ alignItems: "center" }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
