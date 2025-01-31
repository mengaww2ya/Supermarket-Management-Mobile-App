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

export default function AddProduct({ navigation }) {
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
    <SafeAreaView>
      <ScrollView>
        <View style={styles.container}>
          <Text style={styles.title}>Fill Product Details</Text>

          <TextInput
            style={styles.textInput}
            placeholder="Product Name"
            value={productName}
            onChangeText={setProductName}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Product Id"
            value={productId}
            onChangeText={setProductId}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Product Category"
            value={category}
            onChangeText={setCategory}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Product Price"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Product Discount"
            keyboardType="numeric"
            value={discount}
            onChangeText={setDiscount}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Product Description"
            value={description}
            onChangeText={setDescription}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Product Ingredients"
            value={ingredients}
            onChangeText={setIngredients}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Product Nutrition Info"
            value={nutrition}
            onChangeText={setNutrition}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Product Package Type"
            value={packageType}
            onChangeText={setPackageType}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Product Supplier Name"
            value={supplier}
            onChangeText={setSupplier}
          />
          <TextInput
            style={styles.textInput}
            placeholder="Product Origin"
            value={origin}
            onChangeText={setOrigin}
          />

          <Pressable style={styles.button} onPress={selectImage}>
            <Text style={styles.buttonText}>Upload Image</Text>
          </Pressable>

          {image && <Image source={{ uri: image }} style={styles.image} />}

          <View style={styles.buttonContainer}>
            <Pressable style={styles.button} onPress={() => {}}>
              <Text style={styles.buttonText}>Add Product</Text>
            </Pressable>
            <Pressable
              style={styles.button}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.buttonText}>Back</Text>
            </Pressable>
            <Pressable style={styles.buttonclear} onPress={clearInput}>
              <Text style={styles.buttonText}>Clear</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
});
