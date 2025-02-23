import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  Pressable,
  SafeAreaView,
  Text,
  View,
  StyleSheet,
  TextInput,
  FlatList,
  Alert,
  Image,
} from "react-native";
import { colors } from "react-native-elements";

export default function AddCategory({ navigation }) {
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState([
    "Fruits",
    "Vegetables",
    "Cosmetics",
    "Dairy",
    "Beverages",
    "Bakery",
    "Frozen Foods",
    "Snacks",
    "Household Items",
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
    navigation.navigate("AddProduct", { category }); // Ensure "AddProduct" is the correct name
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Add New Category</Text>

        <TextInput
          style={styles.textInput}
          placeholder="Enter category name"
          value={category}
          onChangeText={setCategory}
        />

        <Pressable style={styles.button} onPress={addCategory}>
          <Text style={styles.buttonText}>Add Category</Text>
        </Pressable>

        <FlatList
          data={categories}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => navigateToAddProduct(item)}>
              <Text style={styles.categoryText}>{item}</Text>
            </Pressable>
          )}
          style={styles.list}
        />

        <Pressable style={styles.button} onPress={selectImage}>
          <Text style={styles.buttonText}>Upload Image</Text>
        </Pressable>

        {image && <Image source={{ uri: image }} style={styles.image} />}

        <View style={styles.buttonContainer}>
          <Pressable style={styles.button} onPress={() => navigation.goBack()}>
            <Text style={styles.buttonText}>Back</Text>
          </Pressable>

          <Pressable style={styles.buttonClear} onPress={() => setCategory("")}>
            <Text style={styles.buttonText}>Clear</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  container: {
    margin: 10,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  title: {
    marginBottom: 5,
    padding: 5,
    fontSize: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  textInput: {
    padding: 10,
    fontSize: 16,
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
  },
  button: {
    backgroundColor: colors.grey3,
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  card: {
    padding: 10,
    marginVertical: 5,
    backgroundColor: "#fff",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  categoryText: {
    fontSize: 16,
  },
  image: {
    width: 200,
    height: 200,
    alignSelf: "center",
    marginTop: 10,
  },
  buttonClear: {
    backgroundColor: colors.warning,
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
  },
  list: {
    maxHeight: 200,
  },
});