import React, { useState, useEffect } from "react";
import { Pressable, SafeAreaView, Text, View, TextInput, Alert, StyleSheet, Image, ScrollView } from "react-native";
import { db } from '../../../firebase/firebaseConfig'; // Adjust the path accordingly
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';

export default function AddProduct() {
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [discountPrice, setDiscountPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");
  const [unitType, setUnitType] = useState("");
  const [brand, setBrand] = useState("");
  const [supplier, setSupplier] = useState("");
  const [productionDate, setProductionDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [image, setImage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      const querySnapshot = await getDocs(collection(db, "AddCategory"));
      const fetchedCategories = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(fetchedCategories);
    };

    fetchCategories();
  }, []);

  const addProduct = async () => {
    if (!productName || !description || !price || !selectedCategory ||
      !stockQuantity || !unitType || !brand || !supplier ||
      !productionDate || !expirationDate || !image) {
      Alert.alert("Error", "Please fill in all fields!");
      return;
    }

    try {
      const newProduct = {
        productName,
        description,
        price: parseFloat(price),
        discountPrice: parseFloat(discountPrice) || 0,
        stockQuantity: parseInt(stockQuantity, 10) || 0,
        unitType,
        brand,
        supplier,
        categoryId: selectedCategory,
        image, // Ensure this is a string (URI)
        status: "Active", // Default status
        dateAdded: new Date().toISOString(), // Add current date
        productionDate,
        expirationDate,
      };

      console.log("New Product Data: ", newProduct); // Debugging line

      await addDoc(collection(db, 'Products'), newProduct);
      Alert.alert("Success", "Product added successfully!");
      // Reset fields or navigate as needed
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Error", "Permission to access camera roll is required!");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    console.log("Image Picker Result: ", result); // Debugging line

    if (!result.cancelled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setImage(uri);
      console.log("Selected Image URI: ", uri); // Debugging line
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>Add New Product</Text>

        <Pressable onPress={pickImage} style={styles.imagePicker}>
          {image ? (
            <Image source={{ uri: image }} style={styles.productImage} />
          ) : (
            <Text style={styles.imagePlaceholder}>Select Product Image</Text>
          )}
        </Pressable>

        <TextInput placeholder="Product Name" style={styles.input} onChangeText={setProductName} />
        <TextInput placeholder="Description" style={styles.input} onChangeText={setDescription} />
        <TextInput placeholder="Price" style={styles.input} keyboardType="numeric" onChangeText={setPrice} />
        <TextInput placeholder="Discount Price" style={styles.input} keyboardType="numeric" onChangeText={setDiscountPrice} />
        <TextInput placeholder="Stock Quantity" style={styles.input} keyboardType="numeric" onChangeText={setStockQuantity} />
        <TextInput placeholder="Unit Type" style={styles.input} onChangeText={setUnitType} />
        <TextInput placeholder="Brand" style={styles.input} onChangeText={setBrand} />
        <TextInput placeholder="Supplier" style={styles.input} onChangeText={setSupplier} />
        <TextInput placeholder="Production Date (YYYY-MM-DD)" style={styles.input} onChangeText={setProductionDate} />
        <TextInput placeholder="Expiration Date (YYYY-MM-DD)" style={styles.input} onChangeText={setExpirationDate} />

        <Picker
          selectedValue={selectedCategory}
          onValueChange={(itemValue) => setSelectedCategory(itemValue)}
          style={styles.picker}
        >
          {categories.map((category) => (
            <Picker.Item key={category.id} label={category.categoryName} value={category.id} />
          ))}
        </Picker>

        <Pressable onPress={addProduct} style={styles.addButton}>
          <Text style={styles.addButtonText}>Add Product</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    padding: 16,
    alignItems: "stretch",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  productImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  imagePlaceholder: {
    color: "#aaa",
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  picker: {
    marginBottom: 16,
  },
  addButton: {
    backgroundColor: "#3498db",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});