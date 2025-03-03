import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Pressable, SafeAreaView, Text, View, TextInput, FlatList, Alert, Image } from "react-native";
import { useRouter } from "expo-router";
const updateCategory = () => {
  const router = useRouter();
    const [category, setCategory] = useState("");
    const [categories, setCategories] = useState([
      "Fruits", "Vegetables", "Cosmetics", "Dairy", "Beverages", "Bakery", "Frozen Foods", "Snacks", "Household Items"
    ]);
    const [image, setImage] = useState(null);
  
    const addCategory = () => {
      if (!category.trim()) {
        Alert.alert("Error", "Category name cannot be empty!");
        return;
      }
      if (categories.includes(category)) {
        Alert.alert("Error", "Category already exists!");
        return;
      }
      setCategories([...categories, category]);
      setCategory("");
      Alert.alert("Success", "Category added successfully!");
    };
  
    const selectImage = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Please grant access to the media library.");
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
  
    const navigateToAddProduct = (category) => {
      router.push({ pathname: "/stockManager/AddProduct", params: { category } });
    };
  
    return (
      <SafeAreaView className="flex-1 bg-gray-100 p-4">
        <View className="bg-white p-4 rounded-lg shadow-md">
          <Text className="text-xl font-bold text-center mb-4">Add New Category</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-2 mb-4 text-lg"
            placeholder="Enter category name"
            value={category}
            onChangeText={setCategory}
          />
          <Pressable className="bg-blue-500 p-3 rounded-lg mb-4" onPress={addCategory}>
            <Text className="text-white text-center text-lg">Add Category</Text>
          </Pressable>
          <FlatList
            data={categories}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <Pressable className="bg-gray-200 p-3 rounded-lg mb-2" onPress={() => navigateToAddProduct(item)}>
                <Text className="text-lg text-center">{item}</Text>
              </Pressable>
            )}
            className="max-h-60"
          />
          <Pressable className="bg-green-500 p-3 rounded-lg mt-4" onPress={selectImage}>
            <Text className="text-white text-center text-lg">Upload Image</Text>
          </Pressable>
          {image && <Image source={{ uri: image }} className="w-40 h-40 self-center mt-4 rounded-lg" />}
          <View className="flex-row justify-between mt-4">
            <Pressable className="bg-gray-500 p-3 rounded-lg flex-1 mr-2" onPress={() => router.back()}>
              <Text className="text-white text-center text-lg">Back</Text>
            </Pressable>
            <Pressable className="bg-red-500 p-3 rounded-lg flex-1 ml-2" onPress={() => setCategory("")}> 
              <Text className="text-white text-center text-lg">Clear</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
  )
}

export default updateCategory