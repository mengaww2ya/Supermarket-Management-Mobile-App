import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Pressable, SafeAreaView, Text, View, TextInput, Alert, Image } from "react-native";
import { useRouter } from "expo-router";
import { db } from "../../firebaseConfig"; // Adjust the path accordingly
import { collection, addDoc } from "firebase/firestore";

export default function AddCategory() {
  const router = useRouter();
  const [category, setCategory] = useState("");
  const [image, setImage] = useState(null);
  const [categoryAdded, setCategoryAdded] = useState(false);

  // Function to add a new category
  const addCategory = async () => {
    if (!category.trim()) {
      Alert.alert("Error", "Category name cannot be empty!");
      return;
    }

    if (!image) {
      Alert.alert("Error", "You must upload an image!");
      return;
    }

    try {
      const newCategory = {
        categoryName: category,
        description: 'Description for ${ category }', // Customize this if needed
        image, // This will be the URI of the selected image
        status: "Active",
        dateAdded: new Date(),
      };

      await addDoc(collection(db, "AddCategory"), newCategory);
      setCategory(""); // Reset category input
      setImage(null); // Reset the image after adding
      setCategoryAdded(true); // Show view categories button
      Alert.alert("Success", "Category added successfully!");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  // Function to select an image
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

  return (
    <SafeAreaView className="flex-1 bg-gray-100 flex justify-center items-center p-4">
      <View className="bg-white w-full max-w-md p-6 rounded-2xl shadow-lg">
        <Text className="text-2xl font-bold text-center mb-6 text-gray-800">Add New Category</Text>

        <TextInput
          className="border border-gray-300 rounded-xl p-3 mb-4 text-lg bg-gray-50 focus:border-blue-500 focus:ring focus:ring-blue-300"
          placeholder="Enter category name"
          value={category}
          onChangeText={setCategory}
        />

        <Pressable className="bg-green-500 p-4 rounded-xl mb-4 active:bg-green-700" onPress={selectImage}>
          <Text className="text-white text-center text-lg font-semibold">{image ? "Image Selected" : "Upload Image"}</Text>
        </Pressable>

        {image && (
          <Image source={{ uri: image }} className="w-40 h-40 self-center mt-4 rounded-2xl border-2 border-gray-300" />
        )}

        <Pressable className="bg-blue-500 p-4 rounded-xl mt-6 active:bg-blue-700" onPress={addCategory}>
          <Text className="text-white text-center text-lg font-semibold">Add Category</Text>
        </Pressable>

        {categoryAdded && (
          <Pressable
            className="bg-yellow-500 p-4 rounded-xl mt-4 active:bg-yellow-700"
            onPress={() => router.push("/stockManager/ViewCategory")}
          >
            <Text className="text-white text-center text-lg font-semibold">View Stock Categories</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}