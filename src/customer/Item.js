import React from "react";
import {
  Pressable,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  ScrollView,
  View,
} from "react-native";
import { Icon } from "react-native-elements";
import Footer from "../subscrean/foter.js";

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;

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
    bestSeller,
    ratings,
    numberOfReviews,
  } = route.params || {};

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.itemInfoContainer}>
        <View style={styles.imageView}>
          <Image
            style={[styles.productImage, { width: screenWidth * 0.7 }]}
            source={image}
          />
        </View>
        <Text style={styles.title}>Basic Information</Text>
        <Text style={styles.text}>
          Product Name: <Text style={styles.boldText}>{productName}</Text>
        </Text>
        <Text style={styles.text}>
          Product ID: <Text style={styles.boldText}>{productId}</Text>
        </Text>
        <Text style={styles.text}>
          Category: <Text style={styles.boldText}>{categoryName}</Text>
        </Text>
        <Text style={styles.title}>Pricing</Text>
        <Text style={styles.text}>
          Price: <Text style={styles.boldText}>{price}</Text>
        </Text>
        <Text style={styles.text}>
          Discount:{" "}
          <Text style={styles.boldText}>{discountPrice || "N/A"}</Text>
        </Text>
        <Text style={styles.title}>Product Details</Text>
        <Text style={styles.text}>
          Description: <Text style={styles.boldText}>{description}</Text>
        </Text>
        <Text style={styles.text}>
          Stock Quantity: <Text style={styles.boldText}>{stockQuantity}</Text>
        </Text>
        <Text style={styles.text}>
          Unit Type: <Text style={styles.boldText}>{unitType}</Text>
        </Text>
        <Text style={styles.text}>
          Brand: <Text style={styles.boldText}>{brand}</Text>
        </Text>
        <Text style={styles.text}>
          Status: <Text style={styles.boldText}>{status}</Text>
        </Text>
        <Text style={styles.text}>
          Best Seller:{" "}
          <Text style={styles.boldText}>{bestSeller ? "Yes" : "No"}</Text>
        </Text>
        <Text style={styles.title}>Supplier Information</Text>
        <Text style={styles.text}>
          Supplier: <Text style={styles.boldText}>{supplier}</Text>
        </Text>
        <Text style={styles.title}>Customer Reviews and Ratings</Text>
        <Text style={styles.text}>
          Average Rating: <Text style={styles.boldText}>{ratings}</Text>
        </Text>
        <Text style={styles.text}>
          Reviews: <Text style={styles.boldText}>{numberOfReviews}</Text>
        </Text>
        <View>
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
        </View>
      </View>
      <Footer navigation={navigation} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingBottom: 20 },
  itemInfoContainer: {
    backgroundColor: "white",
    padding: 15,
    margin: 10,
    borderWidth: 1,
    borderColor: "gray",
  },
  productImage: {
    height: 180,
    borderRadius: 10,
    marginBottom: 10,
  },
  title: { fontSize: 20, fontWeight: "bold" },
  text: { fontSize: 15 },
  boldText: { fontWeight: "bold" },
  button: {
    backgroundColor: "gray",
    padding: 10,
    alignItems: "center",
    borderRadius: 5,
    margin: 5,
  },
  buttonText: { fontWeight: "bold", fontSize: 16 },
});
