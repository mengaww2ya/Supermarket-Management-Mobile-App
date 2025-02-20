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
import { categories } from "../global/data.js"; // Import your categories
import { products } from "../global/data.js"; // Import your products
import Footer from "../subscrean/foter.js";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.42;

export default function Homepage({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleCategoryPress = (item) => {
    // Filter products based on the selected category
    const filteredProducts = products.filter(
      (product) => product.categoryId === item.categoryId
    );

    // Navigate to the ProductDisplay page and pass the filtered products
    navigation.navigate("ProductDisplay", { categoryName: item.categoryName, products: filteredProducts });
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      className="bg-white border border-gray-200 rounded-lg shadow-md p-3 m-2 items-center justify-center transition-transform transform hover:scale-105"
      style={{ width: CARD_WIDTH, maxHeight: 200 }} // Set a max height for the card
      onPress={() => handleCategoryPress(item)}
    >
      <Text className="text-base color-blue-700 font-bold text-center">{item.categoryName}</Text>
      <View className="w-full h-24"> {/* Fixed height for the image container */}
        <Image
          className="rounded-md my-2"
          source={item.image}
          style={{ width: "100%", height: "100%", resizeMode: "contain" }}
        />
      </View>
      <Text className="text-sm font-medium text-center flex-wrap w-full py-2">
        {item.description}
      </Text>
    </TouchableOpacity>
  );

  // Filter categories based on discountAvailable
  const promotionCategories = categories.filter(category => category.discountAvailable);
  const standardCategories = categories.filter(category => !category.discountAvailable);

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      {/* Header Section */}
      <View className="flex-row items-center justify-between bg-yellow-400 px-4 py-3">
        <TouchableOpacity onPress={() => {}}>
          <Ionicons name="menu" size={30} color="black" />
        </TouchableOpacity>

        <Text className="text-lg font-bold">Home Page</Text>

        <TouchableOpacity onPress={() => navigation.navigate("CartPage")}>
          <Ionicons name="cart" size={30} color="black" />
        </TouchableOpacity>
      </View>

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
        <Text className="text-xl font-bold text-center text-green-600 my-3">
          Promotion Categories
        </Text>
        <FlatList
          numColumns={2}
          data={promotionCategories}
          keyExtractor={(item) => item.categoryId.toString()}
          renderItem={renderCategoryItem}
          contentContainerStyle={{ alignItems: "center" }}
        />

        <Text className="text-xl font-bold text-center text-blue-500 my-3 ">
          Standard Categories
        </Text>
        <FlatList
          numColumns={2}
          data={standardCategories}
          keyExtractor={(item) => item.categoryId.toString()}
          renderItem={renderCategoryItem}
          contentContainerStyle={{ alignItems: "center" }}
        />
      </ScrollView>

      {/* Footer */}
      <Footer navigation={navigation} />
    </SafeAreaView>
  );
}