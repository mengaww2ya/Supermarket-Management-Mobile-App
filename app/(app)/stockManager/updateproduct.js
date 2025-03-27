import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, Text, View, TextInput, Image } from "react-native";

export default function UpdateProduct({ route }) {
  const router = useRouter();
  const product = route?.params?.product || {};

  const [image, setImage] = useState(product.image || null);
  const [productName, setProductName] = useState(product.name || "");
  const [productId, setProductId] = useState(product.id || "");
  const [category, setCategory] = useState(product.category || "");
  const [price, setPrice] = useState(product.price || "");
  const [discount, setDiscount] = useState(product.discount || "");
  const [description, setDescription] = useState(product.description || "");
  const [ingredients, setIngredients] = useState(product.ingredients || "");
  const [nutrition, setNutrition] = useState(product.nutrition || "");
  const [packageType, setPackageType] = useState(product.packageType || "");
  const [supplier, setSupplier] = useState(product.supplier || "");
  const [origin, setOrigin] = useState(product.origin || "");

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

  const handleUpdate = () => {
    alert("Product updated successfully!");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView className="px-4 py-6">
        <View className="bg-white p-4 rounded-xl shadow-md">
          <Text className="text-xl font-bold text-center mb-4">Update Product Details</Text>

          <TextInput className="border border-gray-300 p-3 rounded-md mb-3" placeholder="Product Name" value={productName} onChangeText={setProductName} />
          <TextInput className="border border-gray-300 p-3 rounded-md mb-3 bg-gray-200" placeholder="Product Id" value={productId} onChangeText={setProductId} editable={false} />
          <TextInput className="border border-gray-300 p-3 rounded-md mb-3" placeholder="Product Category" value={category} onChangeText={setCategory} />
          <TextInput className="border border-gray-300 p-3 rounded-md mb-3" placeholder="Product Price" keyboardType="numeric" value={price} onChangeText={setPrice} />
          <TextInput className="border border-gray-300 p-3 rounded-md mb-3" placeholder="Product Discount" keyboardType="numeric" value={discount} onChangeText={setDiscount} />
          <TextInput className="border border-gray-300 p-3 rounded-md mb-3" placeholder="Product Description" value={description} onChangeText={setDescription} />
          <TextInput className="border border-gray-300 p-3 rounded-md mb-3" placeholder="Product Ingredients" value={ingredients} onChangeText={setIngredients} />
          <TextInput className="border border-gray-300 p-3 rounded-md mb-3" placeholder="Product Nutrition Info" value={nutrition} onChangeText={setNutrition} />
          <TextInput className="border border-gray-300 p-3 rounded-md mb-3" placeholder="Product Package Type" value={packageType} onChangeText={setPackageType} />
          <TextInput className="border border-gray-300 p-3 rounded-md mb-3" placeholder="Product Supplier Name" value={supplier} onChangeText={setSupplier} />
          <TextInput className="border border-gray-300 p-3 rounded-md mb-3" placeholder="Product Origin" value={origin} onChangeText={setOrigin} />

          <Pressable className="bg-blue-500 p-3 rounded-md mb-3" onPress={selectImage}>
            <Text className="text-white text-center font-semibold">Upload Image</Text>
          </Pressable>

          {image && <Image source={{ uri: image }} className="w-40 h-40 self-center rounded-md mt-3" />}

          <View className="flex-row justify-between mt-4">
            <Pressable className="bg-green-500 p-3 flex-1 mr-2 rounded-md" onPress={handleUpdate}>
              <Text className="text-white text-center font-semibold">Update Product</Text>
            </Pressable>
            <Pressable className="bg-red-500 p-3 flex-1 ml-2 rounded-md" onPress={clearInput}>
              <Text className="text-white text-center font-semibold">Clear</Text>
            </Pressable>
          </View>
          <Pressable className="bg-gray-500 p-3 mt-4 rounded-md" onPress={() => router.back()}>
            <Text className="text-white text-center font-semibold">Back</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
