import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  Text,
  View,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  TextInput,
} from "react-native";
import { colors } from "react-native-elements";

export default function ViewProductList({ navigation }) {
  const [products, setProducts] = useState([]);

  // Dummy data for testing, replace with API fetch in real use case
  useEffect(() => {
    // Simulate fetching data
    const fetchedProducts = [
      {
        id: "1",
        name: "Product 1",
        category: "Category A",
        price: "100",
        discount: "10%",
        description: "Description of Product 1",
        image: "https://via.placeholder.com/150",
      },
      {
        id: "2",
        name: "Product 2",
        category: "Category B",
        price: "150",
        discount: "15%",
        description: "Description of Product 2",
        image: "https://via.placeholder.com/150",
      },
    ];
    setProducts(fetchedProducts);
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.productCard}>
      <Image source={{ uri: item.image }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productCategory}>Category: {item.category}</Text>
        <Text style={styles.productPrice}>Price: ${item.price}</Text>
        <Text style={styles.productDiscount}>Discount: {item.discount}</Text>
        <Text style={styles.productDescription}>Description: {item.description}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable style={styles.button} onPress={() => handleUpdateProduct(item)}>
          <Text style={styles.buttonText}>Update Product</Text>
        </Pressable>
        <Pressable style={styles.button} onPress={() => handleRemoveProduct(item)}>
          <Text style={styles.buttonText}>Remove Product</Text>
        </Pressable>
      </View>
    </View>
  );

  const handleUpdateProduct = (product) => {
    // Logic for updating the product
    console.log("Update Product:", product);
    // You can navigate to the "AddProduct" screen and pass the selected product data to edit it.
    navigation.navigate("AddProduct", { product });
  };

  const handleRemoveProduct = (product) => {
    // Logic for removing the product
    console.log("Remove Product:", product);
    // You can filter the product out of the list
    setProducts(products.filter(p => p.id !== product.id));
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Product List</Text>

      {/* FlatList to render list of products */}
      <FlatList
        data={products}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
      
      <Pressable style={styles.button} onPress={() => navigation.navigate("AddProduct")}>
        <Text style={styles.buttonText}>Add New Product</Text>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },
  productCard: {
    flexDirection: "row",
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#fff",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 5,
  },
  productInfo: {
    marginLeft: 10,
    justifyContent: "center",
    flex: 1,
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  productCategory: {
    fontSize: 14,
    color: "#888",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#007BFF",
  },
  productDiscount: {
    fontSize: 14,
    color: "#ff6347",
  },
  productDescription: {
    fontSize: 12,
    color: "#555",
  },
  button: {
    backgroundColor: colors.grey3,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
