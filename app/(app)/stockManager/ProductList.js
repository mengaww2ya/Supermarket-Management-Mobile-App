import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ScrollView, TextInput } from 'react-native';
import { db } from '../../../firebase/firebaseConfig'; // Adjust this path to your actual structure
import { collection, getDocs } from 'firebase/firestore';
import { useRouter } from 'expo-router';

const ProductList = () => {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "Products"));
        const productList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(productList);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product =>
    product.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Product List</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search products..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <ScrollView>
        {filteredProducts.length > 0 ? (
          filteredProducts.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => {
                console.log("Navigating to ProductManagement with ID:", item.id);
                router.push({ pathname: "/stockManager/ProductManagement", params: { productId: item.id } });
              }}
              style={styles.productCard}
            >
              <Image source={{ uri: item.image }} style={styles.productImage} />
              <Text style={styles.productName}>{item.productName}</Text>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noProducts}>No products available.</Text>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2c3e50",
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#3498db",
    borderRadius: 10,
    padding: 10,
    marginBottom: 20,
    backgroundColor: "#ffffff",
    fontSize: 16,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#fff",
    borderRadius: 10,
    elevation: 2,
    padding: 15,
    marginVertical: 10,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 15,
  },
  productName: {
    fontSize: 18,
    color: "#34495e",
  },
  noProducts: {
    textAlign: "center",
    fontSize: 16,
    color: "#aaa",
  },
});

export default ProductList;