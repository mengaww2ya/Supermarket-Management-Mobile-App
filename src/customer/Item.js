import React, { useState } from "react";
import {
  Pressable,
  Dimensions,
  Image,
  Text,
  ScrollView,
  View,
  SafeAreaView,
  Modal,
  Alert,
} from "react-native";
import Footer from "../subscrean/foter.js";
 import Ionicons from "react-native-vector-icons/Ionicons"; // Make sure to import Ionicons

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
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <View className="bg-white m-4 p-4 rounded-lg shadow-lg">
          <Image style={{
    width: "100%",
    height: 220,
    borderRadius: 10,
    marginBottom: 10,
    resizeMode: "contain",
  }} source={image} />
          <Text className="text-xl font-bold text-center mb-1">{productName}</Text>
          <Text className="text-md text-center text-gray-600">{categoryName}</Text>
          <Text className="text-lg text-green-600 font-bold text-center mt-2">${price}</Text>
          {discountPrice && (
            <Text className="text-md text-red-600 text-center">
              Discount: ${discountPrice}
            </Text>
          )}

          <Text className="text-lg font-semibold mt-4">Description</Text>
          <Text className="text-md text-gray-700">{description}</Text>

          <Text className="text-lg font-semibold mt-4">Product Details</Text>
          <Text className="text-md text-gray-700">Stock: {stockQuantity}</Text>
          <Text className="text-md text-gray-700">Unit: {unitType}</Text>
          <Text className="text-md text-gray-700">Brand: {brand}</Text>
          <Text className="text-md text-gray-700">Status: {status}</Text>

          <Text className="text-lg font-semibold mt-4">Supplier</Text>
          <Text className="text-md text-gray-700">{supplier}</Text>

          <Text className="text-lg font-semibold mt-4">Ratings & Reviews</Text>
          <Text className="text-md text-gray-700">
            Average Rating: {ratings} ({numberOfReviews} Reviews)
          </Text>

          <View className="flex-row justify-around mt-6">
            <Pressable
              className="bg-blue-500 py-2 px-4 rounded-lg flex-1 mx-2"
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
              <Text className="text-white text-center font-semibold">Add to Cart</Text>
            </Pressable>
            <Pressable
              className="bg-yellow-400 py-2 px-4 rounded-lg flex-1 mx-2"
              onPress={() => setModalVisible(true)}
            >
              <Text className="text-white text-center font-semibold">Like</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>


<Modal animationType="slide" transparent={true} visible={modalVisible}>
  <View className="flex-1 justify-center items-center bg-black bg-opacity-70">
    <View className="bg-white p-6 rounded-lg shadow-lg w-80">
      <Text className="text-lg font-bold mb-4 text-center">
        How much do you like {productName}?
      </Text>
      <View className="flex-row justify-between mb-4">
        {[1, 2, 3, 4, 5].map((likeValue) => (
          <Pressable
            key={likeValue}
            className="bg-red-200 py-2 px-4 rounded-lg flex-1 mx-1"
            onPress={() => handleLikePress(likeValue)}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="star" size={20} color="red" />
              <Text className="text-center text-red-700 ml-1">
                {likeValue}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
      <Pressable
        className="bg-red-500 py-2 px-4 rounded-lg mt-4"
        onPress={() => setModalVisible(false)}
      >
        <Text className="text-white font-semibold text-center">Close</Text>
      </Pressable>
    </View>
  </View>
</Modal>

      <Footer navigation={navigation} />
    </SafeAreaView>
  );
}