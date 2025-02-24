import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Pressable, SafeAreaView, ScrollView, Text, View, TextInput, Image } from "react-native";
import { useRouter } from "expo-router";

export default function AddProduct() {
  const [image, setImage] = useState(null);
  const [productName, setProductName] = useState("");
  const [productId, setProductId] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState("");
  const [discount, setDiscount] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState("");
  const [nutrition, setNutrition] = useState("");
  const [packageType, setPackageType] = useState("");
  const [supplier, setSupplier] = useState("");
  const [origin, setOrigin] = useState("");
  const router = useRouter();

  const clearInput = () => {
    setProductName("");
    setProductId("");
    setCategory("");
    setPrice("");
    setDiscount("");
    setDescription("");
    setIngredients("");
    setNutrition("");
    setPackageType("");
    setSupplier("");
    setOrigin("");
    setImage(null);
  };

  const selectImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      alert("Permission required to access media library.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 p-4">
      <ScrollView>
        <View className="bg-white rounded-xl shadow p-5">
          <Text className="text-xl font-bold text-center mb-4">Fill Product Details</Text>
          {["Product Name", "Product Id", "Product Category", "Product Price", "Product Discount", "Product Description", "Product Ingredients", "Product Nutrition Info", "Product Package Type", "Product Supplier Name", "Product Origin"].map((placeholder, index) => (
            <TextInput
              key={index}
              className="border border-gray-300 rounded-lg p-3 mb-3 text-base"
              placeholder={placeholder}
              value={eval(placeholder.toLowerCase().replace(/ /g, ""))}
              onChangeText={(text) => eval(`set${placeholder.replace(/ /g, '')}(text)`)}/>
          ))}
          
          <Pressable className="bg-blue-500 py-3 rounded-lg items-center mb-3" onPress={selectImage}>
            <Text className="text-white text-lg font-semibold">Upload Image</Text>
          </Pressable>

          {image && <Image source={{ uri: image }} className="w-48 h-48 mx-auto my-3 rounded-lg" />}

          <View className="flex-row justify-between">
            <Pressable className="bg-green-500 py-3 px-5 rounded-lg" onPress={() => {}}>
              <Text className="text-white text-lg font-semibold">Add Product</Text>
            </Pressable>
            <Pressable className="bg-gray-500 py-3 px-5 rounded-lg" onPress={() => router.back()}>
              <Text className="text-white text-lg font-semibold">Back</Text>
            </Pressable>
            <Pressable className="bg-red-500 py-3 px-5 rounded-lg" onPress={clearInput}>
              <Text className="text-white text-lg font-semibold">Clear</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
