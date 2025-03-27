import React, { useState, useEffect } from "react";
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
import Ionicons from "react-native-vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const screenWidth = Dimensions.get("window").width;

export default function Item() {
  const router = useRouter();
  const { productId } = useLocalSearchParams();
  const [product, setProduct] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      const docRef = doc(db, "Products", productId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProduct({ id: docSnap.id, ...docSnap.data() });
      } else {
        console.log("No such document!");
      }
    };

    fetchProduct();
  }, [productId]);

  if (!product) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-100">
        <Text className="text-xl font-bold text-red-500">Product Not Found</Text>
      </SafeAreaView>
    );
  }

  const { productName, image, categoryName, price, discountPrice, description, stockQuantity, unitType, brand, status, supplier, ratings, numberOfReviews } = product;

  const handleLikePress = (likeValue) => {
    Alert.alert(
      "Confirm Rating",
      `Would you like to give ${likeValue} star${likeValue > 1 ? "s" : ""}?`,
      [
        { text: "Yes", onPress: () => { } },
        { text: "No", style: "cancel" },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView contentContainerStyle={{ paddingBottom: 5 }}>
        <View className="bg-white p-4 rounded-lg shadow-lg">
          {/* item image */}
          <Image
            style={{
              width: "100%",
              height: 220,
              borderRadius: 10,
              marginBottom: 10,
              resizeMode: "contain",
            }}
            source={{ uri: image }}
          />
          <Text className="text-xl font-bold text-center mb-1">{productName}</Text>
          <Text className="text-md text-center text-gray-600">{categoryName}</Text>
          <Text className="text-lg text-green-600 font-bold text-center mt-2">Price: ${price}</Text>


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
                router.push({
                  pathname: "/customer/addToCart",
                  params: {
                    productId,
                    productName,
                    price,
                    discountPrice,
                    unitType,
                    image: image,
                  },
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

      {/* Rating Modal */}
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
    </SafeAreaView>
  );
}