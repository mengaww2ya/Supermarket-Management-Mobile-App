import React from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router"; 
import { products } from "../../global/data.js"; // Import product data

export default function ProductDisplay() {
  const router = useRouter();
  const { categoryId, categoryName } = useLocalSearchParams(); // Get params from URL

  // Convert categoryId to number and filter products
  const filteredProducts = products.filter(
    (product) => product.categoryId === Number(categoryId)
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      className="bg-white rounded-xl p-4 mb-4 shadow-lg w-[95%] self-center flex flex-row items-center"
      onPress={() => router.push({ pathname: "/customer/Item", params: { productId: item.productId } })} 
    >
      <View className="w-20 h-20 bg-gray-200 rounded-lg flex justify-center items-center overflow-hidden">
        <Image
          style={{ width: "100%", height: "100%" }}
          source={item.image}
          resizeMode="contain"
        />
      </View>

      <View className="ml-4 flex-1">
        <Text className="text-lg font-bold text-gray-800">{item.productName}</Text>
        <Text className="text-green-600 font-semibold text-base mt-1">
          ${item.discountPrice ? item.discountPrice : item.price} / {item.unitType}
        </Text>
        <Text className="text-sm text-gray-500 mt-1">{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100 px-2">
      {/* <View className="flex-row items-center justify-between bg-yellow-300 px-4 py-3">
        <Text className="text-lg font-bold text-green-600">{categoryName} Products</Text>
        <TouchableOpacity onPress={() => router.push("/cartPage")} className="p-2">
          <Ionicons name="cart" size={30} color="blue" />
        </TouchableOpacity>
      </View> */}

      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item?.productId?.toString() || item.id.toString()} // Ensure safe access
        renderItem={renderItem}
        numColumns={1}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
