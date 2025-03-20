import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { Pressable, SafeAreaView, Text, View, TextInput, Alert, Image } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useRouter } from "expo-router";

export default function AddCategory() {
  const router = useRouter();
  const [categoryName, setCategoryName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active");
  const [numberOfProducts, setNumberOfProducts] = useState("");
  const [popularProducts, setPopularProducts] = useState("");
  const [specialOffers, setSpecialOffers] = useState("");
  const [image, setImage] = useState(null);
  const addedBy = "Manager"; // Static field

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

  const addCategory = () => {
    if (!categoryName.trim() || !description.trim() || !numberOfProducts.trim()) {
      Alert.alert("Error", "Please fill all required fields!");
      return;
    }

    const newCategory = {
      categoryId: Date.now(),
      categoryName,
      description,
      status,
      numberOfProducts: parseInt(numberOfProducts),
      popularProducts: popularProducts.split(",").map((item) => item.trim()),
      specialOffers,
      image,
      dateAdded: new Date().toISOString(),
      addedBy,
    };

    console.log("New Category:", newCategory);
    Alert.alert("Success", "Category added successfully!");

    // Reset form
    setCategoryName("");
    setDescription("");
    setStatus("Active");
    setNumberOfProducts("");
    setPopularProducts("");
    setSpecialOffers("");
    setImage(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 p-4">
      <View className="bg-white p-4 rounded-lg shadow-md">
        <Text className="text-xl font-bold text-center mb-4">Add New Category</Text>

        <TextInput
          className="border border-gray-300 rounded-lg p-2 mb-4 text-lg"
          placeholder="Category Name"
          value={categoryName}
          onChangeText={setCategoryName}
        />

        <TextInput
          className="border border-gray-300 rounded-lg p-2 mb-4 text-lg"
          placeholder="Description"
          value={description}
          onChangeText={setDescription}
        />

        <Picker
          selectedValue={status}
          onValueChange={(itemValue) => setStatus(itemValue)}
          className="border border-gray-300 rounded-lg mb-4"
        >
          <Picker.Item label="Active" value="Active" />
          <Picker.Item label="Inactive" value="Inactive" />
        </Picker>

        <TextInput
          className="border border-gray-300 rounded-lg p-2 mb-4 text-lg"
          placeholder="Number of Products"
          keyboardType="numeric"
          value={numberOfProducts}
          onChangeText={setNumberOfProducts}
        />

        <TextInput
          className="border border-gray-300 rounded-lg p-2 mb-4 text-lg"
          placeholder="Popular Products (comma-separated)"
          value={popularProducts}
          onChangeText={setPopularProducts}
        />

        <TextInput
          className="border border-gray-300 rounded-lg p-2 mb-4 text-lg"
          placeholder="Special Offers"
          value={specialOffers}
          onChangeText={setSpecialOffers}
        />

        <Pressable className="bg-green-500 p-3 rounded-lg mt-2" onPress={selectImage}>
          <Text className="text-white text-center text-lg">Upload Image</Text>
        </Pressable>

        {image && <Image source={{ uri: image }} className="w-40 h-40 self-center mt-4 rounded-lg" />}

        <Pressable className="bg-blue-500 p-3 rounded-lg mt-4" onPress={addCategory}>
          <Text className="text-white text-center text-lg">Add Category</Text>
        </Pressable>

        <View className="flex-row justify-between mt-4">
          <Pressable className="bg-gray-500 p-3 rounded-lg flex-1 mr-2" onPress={() => router.back()}>
            <Text className="text-white text-center text-lg">Back</Text>
          </Pressable>
          <Pressable className="bg-red-500 p-3 rounded-lg flex-1 ml-2" onPress={() => setCategoryName("")}>
            <Text className="text-white text-center text-lg">Clear</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
