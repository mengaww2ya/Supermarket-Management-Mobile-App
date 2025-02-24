import React, { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView, Text, View, FlatList, Image, Pressable } from "react-native";

export default function ViewProductList() {
  const router = useRouter();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchedProducts = [
      {
        id: "1",
        name: "Product 1",
        category: "Category A",
        price: "100",
        discount: "10%",
        description: "Description of Product 1",
        image: "https://via.placeholder.com/150",
      },
      {
        id: "2",
        name: "Product 2",
        category: "Category B",
        price: "150",
        discount: "15%",
        description: "Description of Product 2",
        image: "https://via.placeholder.com/150",
      },
    ];
    setProducts(fetchedProducts);
  }, []);

  const handleUpdateProduct = (product) => {
    router.push({ pathname: "addProduct", params: { product } });
  };

  const handleRemoveProduct = (product) => {
    setProducts(products.filter((p) => p.id !== product.id));
  };

  const renderItem = ({ item }) => (
    <View className="flex flex-row bg-white rounded-lg shadow-md p-4 mb-4 items-center">
      <Image source={{ uri: item.image }} className="w-24 h-24 rounded-lg" />
      <View className="ml-4 flex-1">
        <Text className="text-lg font-bold">{item.name}</Text>
        <Text className="text-gray-500">Category: {item.category}</Text>
        <Text className="text-blue-500 font-semibold">Price: ${item.price}</Text>
        <Text className="text-red-500">Discount: {item.discount}</Text>
        <Text className="text-gray-600 text-sm">{item.description}</Text>
      </View>
      <View className="ml-auto space-y-2">
        <Pressable className="bg-blue-500 px-4 py-2 rounded-lg" onPress={() => handleUpdateProduct(item)}>
          <Text className="text-white font-semibold">Update</Text>
        </Pressable>
        <Pressable className="bg-red-500 px-4 py-2 rounded-lg" onPress={() => handleRemoveProduct(item)}>
          <Text className="text-white font-semibold">Remove</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100 p-4">
      <Text className="text-2xl font-bold text-center my-4">Product List</Text>
      <FlatList data={products} renderItem={renderItem} keyExtractor={(item) => item.id} />
      <Pressable className="bg-green-500 p-4 rounded-lg mt-4" onPress={() => router.push("addProduct")}> 
        <Text className="text-white text-center font-bold">Add New Product</Text>
      </Pressable>
    </SafeAreaView>
  );
}
