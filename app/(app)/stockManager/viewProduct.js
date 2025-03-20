import React, { useState } from "react";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  Text,
  View,
  FlatList,
  Image,
  Pressable,
  TextInput,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

const sampleProducts = [
  {
    productId: 101,
    productName: "Bananas",
    categoryName: "Fresh Produce",
    description: "Fresh and organic bananas sourced from local farms.",
    image: require("../../../assets/images/bananas.png"),
    price: 2.99,
    discountPrice: 2.49,
    stockQuantity: 200,
    status: "Active",
    bestSeller: true,
    ratings: 4.5,
  },
  {
    productId: 102,
    productName: "Tomatoes",
    categoryName: "Fresh Produce",
    description: "Ripe and juicy red tomatoes.",
    image: require("../../../assets/images/tomato.png"),
    price: 3.49,
    discountPrice: 3.19,
    stockQuantity: 150,
    status: "Active",
    bestSeller: true,
    ratings: 4.3,
  },
];

export default function ViewProductList() {
  const router = useRouter();
  const [products, setProducts] = useState(sampleProducts);
  const [search, setSearch] = useState("");

  const handleUpdateProduct = (product) => {
    router.push({ pathname: "addProduct", params: { product } });
  };

  const handleRemoveProduct = (productId) => {
    setProducts(products.filter((p) => p.productId !== productId));
  };

  const filteredProducts = products.filter((product) =>
    product.productName.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }) => (
    <View className="">
    <View className="flex flex-row bg-white rounded-lg shadow-md p-2 mb-4 items-center">
      <Image source={item.image} className="w-24 h-24 rounded-lg" />
      <View className="ml-4 flex-1">
        <Text className="text-lg font-bold">{item.productName}</Text>
        <Text className="text-gray-500">Category: {item.categoryName}</Text>
        <Text className="text-blue-500 font-semibold">${item.discountPrice} </Text>
        {item.bestSeller && <Text className="text-green-500 font-semibold">Best Seller</Text>}
        <Text className="text-gray-600 text-sm">Stock: {item.stockQuantity}</Text>
      </View>
      
      </View>
      <View className=" justify-evenly flex-row">
        <Pressable
          className="bg-blue-500 px-2 py-2 rounded-lg"
          onPress={() => handleUpdateProduct(item)}
        >
          <Text className="text-white font-semibold">Update</Text>
        </Pressable>
        <Pressable
          className="bg-red-500 px-2 py-2 rounded-lg"
          onPress={() => handleRemoveProduct(item.productId)}
        >
          <Text className="text-white font-semibold">Remove</Text>
        </Pressable>
      </View>
      </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100 p-4">
      <Text className="text-2xl font-bold text-center my-4">Product List</Text>
      <TextInput
        className="bg-gray-400 p-3 rounded-lg mb-4 shadow-md"
        placeholder="Search Products..."
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filteredProducts}
        renderItem={renderItem}
        keyExtractor={(item) => item.productId.toString()}
        showsVerticalScrollIndicator={false}
      />
      <Pressable
        className="bg-green-500 p-4 rounded-lg mt-4"
        onPress={() => router.push("addProduct")}
      >
        <Text className="text-white text-center font-bold">Add New Product</Text>
      </Pressable>
    </SafeAreaView>
  );
}
