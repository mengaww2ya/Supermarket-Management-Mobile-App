import React, { useState } from "react";
import {
  Pressable,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  ScrollView,
  View,
  SafeAreaView,
  Modal,
  Alert,
} from "react-native";
import Footer from "../subscrean/foter.js";

const screenWidth = Dimensions.get("window").width;

export default function Item({ route, navigation }) {
  const {
    productId,
    productName,
    price,
    discountPrice,
    description,
    image,
    supplier,
    categoryName,
    stockQuantity,
    unitType,
    brand,
    status,
    ratings,
    numberOfReviews,
  } = route.params || {};

  const [modalVisible, setModalVisible] = useState(false);

  const handleLikePress = (likeValue) => {
    Alert.alert(
      "Confirm Rating",
      `Would you like to give ${likeValue} star${likeValue > 1 ? "s" : ""}?`,
      [
        { text: "Yes", onPress: () => {} },
        { text: "No", style: "cancel" },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f9f9f9" }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Image style={styles.productImage} source={image} />
          <Text style={styles.title}>{productName}</Text>
          <Text style={styles.category}>{categoryName}</Text>

          <Text style={styles.price}>${price}</Text>
          {discountPrice && (
            <Text style={styles.discount}>Discount: ${discountPrice}</Text>
          )}

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{description}</Text>

          <Text style={styles.sectionTitle}>Product Details</Text>
          <Text style={styles.detail}>Stock: {stockQuantity}</Text>
          <Text style={styles.detail}>Unit: {unitType}</Text>
          <Text style={styles.detail}>Brand: {brand}</Text>
          <Text style={styles.detail}>Status: {status}</Text>

          <Text style={styles.sectionTitle}>Supplier</Text>
          <Text style={styles.detail}>{supplier}</Text>

          <Text style={styles.sectionTitle}>Ratings & Reviews</Text>
          <Text style={styles.detail}>
            Average Rating: {ratings} ({numberOfReviews} Reviews)
          </Text>

          <View style={styles.buttonContainer}>
            <Pressable
              style={styles.button}
              onPress={() =>
                navigation.navigate("addToCart", {
                  image,
                  productName,
                  price,
                  discountPrice,
                  unitType,
                })
              }
            >
              <Text style={styles.buttonText}>Add to Cart</Text>
            </Pressable>
            <Pressable
              style={[styles.button, styles.likeButton]}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.buttonText}>Like</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              How much do you like {productName}?
            </Text>
            {[1, 2, 3, 4, 5].map((likeValue) => (
              <Pressable
                key={likeValue}
                style={styles.modalButton}
                onPress={() => handleLikePress(likeValue)}
              >
                <Text style={styles.modalText}>
                  {likeValue} Star{likeValue > 1 ? "s" : ""}
                </Text>
              </Pressable>
            ))}
            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Footer navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingBottom: 20 },
  card: {
    backgroundColor: "white",
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  productImage: {
    width: "100%",
    height: 220,
    borderRadius: 10,
    marginBottom: 10,
    resizeMode: "contain",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 5,
  },
  category: { fontSize: 16, textAlign: "center", color: "#555" },
  price: {
    fontSize: 20,
    color: "#28a745",
    fontWeight: "bold",
    textAlign: "center",
  },
  discount: { fontSize: 16, color: "#dc3545", textAlign: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginTop: 10 },
  description: { fontSize: 15, color: "#666" },
  detail: { fontSize: 15, marginVertical: 2 },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 15,
  },
  button: {
    backgroundColor: "#007bff",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    marginHorizontal: 5,
  },
  likeButton: { backgroundColor: "#ffc107" },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  modalButton: {
    padding: 10,
    backgroundColor: "#f8d7da",
    borderRadius: 5,
    marginVertical: 5,
  },
  modalText: { fontSize: 16, color: "#721c24" },
  modalCloseButton: {
    backgroundColor: "red",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  modalCloseText: { color: "white", fontWeight: "bold" },
});
