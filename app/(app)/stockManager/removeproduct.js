import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  Image,
  Alert,
} from "react-native";
import { Pressable } from "react-native";

export default function UpdateProduct() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const product = params?.product ? JSON.parse(params.product) : {};

  const [image, setImage] = useState(product.image || null);
  const [productName, setProductName] = useState(product.name || "");
  const [productId, setProductId] = useState(product.id || "");
  const [category, setCategory] = useState(product.category || "");
  const [price, setPrice] = useState(product.price || "");
  const [discount, setDiscount] = useState(product.discount || "");
  const [description, setDescription] = useState(product.description || "");
  const [supplier, setSupplier] = useState(product.supplier || "");

  const selectImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow access to your media.");
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

  const handleUpdate = () => {
    Alert.alert("Success", "Product updated successfully!");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 p-4">
      <ScrollView>
        <View className="bg-white p-5 rounded-lg shadow-md">
          <Text className="text-2xl font-bold text-center mb-4">Update Product</Text>
          <TextInput className="border p-3 rounded-md mb-3" placeholder="Product Name" value={productName} onChangeText={setProductName} />
          <TextInput className="border p-3 rounded-md mb-3" placeholder="Product ID" value={productId} editable={false} />
          <TextInput className="border p-3 rounded-md mb-3" placeholder="Category" value={category} onChangeText={setCategory} />
          <TextInput className="border p-3 rounded-md mb-3" placeholder="Price" keyboardType="numeric" value={price} onChangeText={setPrice} />
          <TextInput className="border p-3 rounded-md mb-3" placeholder="Discount" keyboardType="numeric" value={discount} onChangeText={setDiscount} />
          <TextInput className="border p-3 rounded-md mb-3" placeholder="Description" value={description} onChangeText={setDescription} />
          <TextInput className="border p-3 rounded-md mb-3" placeholder="Supplier" value={supplier} onChangeText={setSupplier} />
          
          <Pressable className="bg-blue-500 p-3 rounded-md mb-3 active:bg-blue-600" onPress={selectImage}>
            <Text className="text-white text-center font-bold">Upload Image</Text>
          </Pressable>

          {image && <Image source={{ uri: image }} className="w-40 h-40 self-center mt-3" />}
          
          <View className="flex-row justify-between mt-4">
            <Pressable className="bg-green-500 p-3 rounded-md w-1/2 mr-2 active:bg-green-600" onPress={handleUpdate}>
              <Text className="text-white text-center font-bold">Update</Text>
            </Pressable>
            <Pressable className="bg-gray-400 p-3 rounded-md w-1/2 active:bg-gray-500" onPress={() => router.back()}>
              <Text className="text-white text-center font-bold">Back</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
