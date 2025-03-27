import React, { useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { db } from "../../../firebase/firebaseConfig";
import { doc, setDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import HomeHeader from "../../components/HomeHeader";
export default function AddToCart() {
  const {
    productName = "Unknown Product",
    price = "0",
    unitType = "unit",
    image,
  } = useLocalSearchParams();

  const parsedPrice = parseFloat(price) || 0;
  const [quantity, setQuantity] = useState(1);
  const auth = getAuth();
  const customerId = auth.currentUser?.uid;

  const increaseAmount = () => setQuantity((prev) => prev + 1);
  const decreaseAmount = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  const totalPrice = parsedPrice * quantity;

  const addToCart = async () => {
    console.log("Add to Cart triggered");

    if (!customerId) {
      Alert.alert("Error", "User not logged in.");
      return;
    }

    try {
      console.log("Customer ID: ", customerId);


      const cartRef = doc(db, `customers/${customerId}/cart`, `${new Date().getTime()}`);
      await setDoc(cartRef, {
        productName,
        price: parsedPrice,
        quantity,
        totalPrice,
        image,
      });

      console.log("✅ Successfully added to Firestore");
      Alert.alert("Success", `${quantity} ${unitType}(s) of ${productName} added to cart!`);
    } catch (error) {
      console.error("❌ Error adding to cart: ", error); // Log the error
      Alert.alert("Error", `Could not add product to cart: ${error.message}`);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white mx-4 my-2">
      <HomeHeader title={"Add to Cart"}/>
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold text-center my-4">Add {productName} to Cart</Text>

        <View className="items-center mb-4">
          {image ? (
            <Image
              style={{ width: "100%", height: 220, borderRadius: 10, marginBottom: 10, resizeMode: "contain" }}
              source={{ uri: image }}
            />
          ) : (
            <Text className="text-gray-500">No Image Available</Text>
          )}
        </View>

        <Text className="text-xl font-bold text-center mb-2">{productName}</Text>

        <View className="flex-row justify-around items-center my-4">
          <TouchableOpacity className="bg-blue-500 py-2 px-4 rounded-lg h-10" onPress={decreaseAmount}>
            <Text className="text-white font-semibold">Decrease</Text>
          </TouchableOpacity>

          <TextInput
            className="text-center border border-gray-300 rounded-lg w-20 h-10"
            value={String(quantity)}
            onChangeText={(text) => setQuantity(Number(text) || 1)}
            keyboardType="numeric"
          />

          <TouchableOpacity className="bg-blue-500 py-2 px-4 rounded-lg h-10" onPress={increaseAmount}>
            <Text className="text-white font-semibold">Increase</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-lg text-center">Price per {unitType}: {parsedPrice.toFixed(2)} Birr</Text>

        <Text className="text-lg text-center mb-4">
          You added {quantity} {unitType}(s) of {productName}
        </Text>

        <View className="items-center mb-4">
          <Text className="text-lg font-bold">Total Price: {totalPrice.toFixed(2)} Birr</Text>
        </View>

        <TouchableOpacity className="bg-green-500 py-3 rounded-lg mt-4" onPress={addToCart}>
          <Text className="text-white text-lg font-bold text-center">Add to Cart</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
