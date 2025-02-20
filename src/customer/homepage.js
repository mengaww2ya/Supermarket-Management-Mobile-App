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
import { categories } from "../global/data.js";
import Footer from "../subscrean/foter.js";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.42;
const IMAGE_SIZE = width * 0.3;

const categoryNavigationMap = {
  "Fruit & Vegetable": "FreshProducts",
  "Dairy & Eggs": "DairyProducts",
  "Meat & Seafood": "Meatproducts",
  Bakery: "Bakeryproducts",
  Beverages: "Beveragesproducts",
  "Pantry Essentials": "Pantryproducts",
  "Frozen Foods": "Frozenproducts",
  "Personal Care": "PersonalCareproducts",
};

export default function Homepage({ navigation }) {
  const [searchQuery, setSearchQuery] = useState("");

  const promoCategories = categories.filter(
    (item) => item.status === "Active" && item.discountAvailable === true
  );
  const standardCategories = categories.filter(
    (item) => item.status === "Active" && item.discountAvailable === false
  );

  const handleCategoryPress = (item) => {
    const screenName = categoryNavigationMap[item.categoryName];
    if (screenName) {
      navigation.navigate(screenName);
    }
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      className="bg-white border border-gray-200 rounded-lg shadow-md p-3 m-2 items-center"
      style={{ width: CARD_WIDTH }}
      onPress={() => handleCategoryPress(item)}
    >
      <Text className="text-base font-semibold text-center">{item.categoryName}</Text>
      <Image
        className="rounded-md my-2"
        source={item.image}
        style={{ width: IMAGE_SIZE, height: IMAGE_SIZE, resizeMode: "contain" }}
      />
      <Text className="text-xs text-gray-500 font-medium text-center">
        {item.description}
      </Text>
    </TouchableOpacity>
  );

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
        {promoCategories.length > 0 && (
          <View>
            <Text className="text-xl font-bold text-center text-black my-3">
              Promotion Categories
            </Text>
            <FlatList
              numColumns={2}
              data={promoCategories}
              keyExtractor={(item) => item.categoryId.toString()}
              renderItem={renderCategoryItem}
              contentContainerStyle={{ alignItems: "center" }}
            />
          </View>
        )}

        {standardCategories.length > 0 && (
          <View>
            <Text className="text-xl font-bold text-center text-black my-3">
              Standard Categories
            </Text>
            <FlatList
              numColumns={2}
              data={standardCategories}
              keyExtractor={(item) => item.categoryId.toString()}
              renderItem={renderCategoryItem}
              contentContainerStyle={{ alignItems: "center" }}
            />
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <Footer navigation={navigation} />
    </SafeAreaView>
  );
}
