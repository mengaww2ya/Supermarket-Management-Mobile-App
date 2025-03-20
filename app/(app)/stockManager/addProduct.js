import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { 
  Pressable, SafeAreaView, ScrollView, Text, View, TextInput, Image, Alert
} from "react-native";
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
      Alert.alert("Permission Required", "Allow access to media library to upload an image.");
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
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="bg-white rounded-xl shadow p-5">
          <Text className="text-xl font-bold text-center mb-4">Fill Product Details</Text>

          <TextInput className="border border-gray-300 bg-gray-200 rounded-lg p-3 mb-3 text-base" placeholder="Product Name" value={productName} onChangeText={setProductName} />
          <TextInput className="border border-gray-300 bg-gray-200 rounded-lg p-3 mb-3 text-base" placeholder="Product ID" value={productId} onChangeText={setProductId} />
          <TextInput className="border border-gray-300 bg-gray-200 rounded-lg p-3 mb-3 text-base" placeholder="Category" value={category} onChangeText={setCategory} />
          <TextInput className="border border-gray-300 bg-gray-200 rounded-lg p-3 mb-3 text-base" placeholder="Price" value={price} onChangeText={setPrice} keyboardType="numeric" />
          <TextInput className="border border-gray-300 bg-gray-200 rounded-lg p-3 mb-3 text-base" placeholder="Discount" value={discount} onChangeText={setDiscount} keyboardType="numeric" />
          <TextInput className="border border-gray-300 bg-gray-200 rounded-lg p-3 mb-3 text-base" placeholder="Description" value={description} onChangeText={setDescription} multiline />
          <TextInput className="border border-gray-300 bg-gray-200 rounded-lg p-3 mb-3 text-base" placeholder="Ingredients" value={ingredients} onChangeText={setIngredients} />
          <TextInput className="border border-gray-300 bg-gray-200 rounded-lg p-3 mb-3 text-base" placeholder="Nutrition Info" value={nutrition} onChangeText={setNutrition} />
          <TextInput className="border border-gray-300 bg-gray-200 rounded-lg p-3 mb-3 text-base" placeholder="Package Type" value={packageType} onChangeText={setPackageType} />
          <TextInput className="border border-gray-300 bg-gray-200 rounded-lg p-3 mb-3 text-base" placeholder="Supplier" value={supplier} onChangeText={setSupplier} />
          <TextInput className="border border-gray-300 bg-gray-200 rounded-lg p-3 mb-3 text-base" placeholder="Origin" value={origin} onChangeText={setOrigin} />

          <Pressable className="bg-blue-500 py-3  rounded-lg items-center mb-3" onPress={selectImage}>
            <Text className="text-white text-lg font-semibold">Upload Image</Text>
          </Pressable>

          {image && <Image source={{ uri: image }} className="w-48 h-48 mx-auto my-3 rounded-lg" />}

          <View className="flex-row justify-center">
            <Pressable className="bg-green-500 py-2 px-3 rounded-lg" onPress={() => {}}>
              <Text className="text-white text-md font-semibold">Add Product</Text>
            </Pressable>
            <Pressable className="bg-gray-500 ml-3 py-2 px-5 rounded-lg" onPress={() => router.back()}>
              <Text className="text-white text-md font-semibold">Back</Text>
            </Pressable>
            <Pressable className="bg-red-500 py-2 ml-3 px-5 rounded-lg" onPress={clearInput}>
              <Text className="text-white text-md font-semibold">Clear</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}