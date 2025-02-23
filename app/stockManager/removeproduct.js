import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
  StyleSheet,
  TextInput,
  Image,
} from "react-native";
import { colors } from "react-native-elements";
export default function UpdateProduct({ navigation, route }) {
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

  // Handle product removal
  const handleRemove = async () => {
    try {
      const productRef = doc(db, 'products', productId);  // Use the product ID from route params
      await deleteDoc(productRef);
      alert("Product removed successfully!");
      navigation.goBack();  // Navigate back after removal
    } catch (error) {
      console.error("Error removing product: ", error);
      alert("Failed to remove product.");
    }
  };

  const handleUpdate = () => {
    // Add update logic here
    alert("Product updated successfully!");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <View style={styles.container}>
          <Text style={styles.title}>Update Product Details</Text>

          <TextInput style={styles.textInput} placeholder="Product Name" value={productName} onChangeText={setProductName} />
          <TextInput style={styles.textInput} placeholder="Product Id" value={productId} onChangeText={setProductId} editable={false} />
          <TextInput style={styles.textInput} placeholder="Product Category" value={category} onChangeText={setCategory} />
          <TextInput style={styles.textInput} placeholder="Product Price" keyboardType="numeric" value={price} onChangeText={setPrice} />
          <TextInput style={styles.textInput} placeholder="Product Discount" keyboardType="numeric" value={discount} onChangeText={setDiscount} />
          <TextInput style={styles.textInput} placeholder="Product Description" value={description} onChangeText={setDescription} />
          <TextInput style={styles.textInput} placeholder="Product Ingredients" value={ingredients} onChangeText={setIngredients} />
          <TextInput style={styles.textInput} placeholder="Product Nutrition Info" value={nutrition} onChangeText={setNutrition} />
          <TextInput style={styles.textInput} placeholder="Product Package Type" value={packageType} onChangeText={setPackageType} />
          <TextInput style={styles.textInput} placeholder="Product Supplier Name" value={supplier} onChangeText={setSupplier} />
          <TextInput style={styles.textInput} placeholder="Product Origin" value={origin} onChangeText={setOrigin} />

          <Pressable style={styles.button} onPress={selectImage}>
            <Text style={styles.buttonText}>Upload Image</Text>
          </Pressable>

          {image && <Image source={{ uri: image }} style={styles.image} />}

          <View style={styles.buttonContainer}>
            <Pressable style={styles.button} onPress={handleUpdate}>
              <Text style={styles.buttonText}>Update Product</Text>
            </Pressable>
            <Pressable style={styles.button} onPress={() => navigation.goBack()}>
              <Text style={styles.buttonText}>Back</Text>
            </Pressable>
            <Pressable style={styles.buttonclear} onPress={clearInput}>
              <Text style={styles.buttonText}>Clear</Text>
            </Pressable>
            <Pressable style={styles.buttonRemove} onPress={handleRemove}>
              <Text style={styles.buttonText}>Remove Product</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
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
  image: {
    width: 200,
    height: 200,
    alignSelf: "center",
    marginTop: 10,
  },
  buttonclear: {
    backgroundColor: colors.warning,
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
  },
  buttonRemove: {
    backgroundColor: colors.error,
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
  },
});
