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
import HomeHeader from "../../components/HomeHeader";
export default function AddToCart() {
  // Ensure parameters exist, with proper defaults
  const {
    productName = "Unknown Product",
    price = "0",
    discountPrice = "0",
    unitType = "unit",
    image,
  } = useLocalSearchParams();

  // Ensure price and discountPrice are treated as numbers
  const parsedPrice = parseFloat(price) || 0;
  const parsedDiscount = parseFloat(discountPrice) || 0;

  const [quantity, setQuantity] = useState(1);

  const increaseAmount = () => setQuantity((prev) => prev + 1);
  const decreaseAmount = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const totalPrice = parsedPrice * quantity;
  const discount = parsedDiscount * quantity;
  const finalPrice = totalPrice - discount;

  return (
    <SafeAreaView className="flex-1 bg-white mx-4 my-2">
             <HomeHeader title={"Add to Cart"}/>
    
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        <Text className="text-2xl font-bold text-center my-4">Add {productName} to Cart</Text>

        <View className="items-center mb-4">
          {image ? (
            <Image
              style={{
                width: "100%",
                height: 220,
                borderRadius: 10,
                marginBottom: 10,
                resizeMode: "contain",
              }}
              source={{ uri: image }}  // Ensure the image is formatted correctly
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

        <Text className="text-lg text-center">
          Price per {unitType}: {parsedPrice.toFixed(2)} Birr
        </Text>

        {parsedDiscount > 0 && (
          <Text className="text-lg text-center text-red-600">
            Discount per {unitType}: {parsedDiscount.toFixed(2)} Birr
          </Text>
        )}

        <Text className="text-lg text-center mb-4">
          You added {quantity} {unitType}(s) of {productName}
        </Text>

        <View className="items-center mb-4">
          <Text className="text-lg font-bold">Total Price: {totalPrice.toFixed(2)} Birr</Text>
          {parsedDiscount > 0 && (
            <Text className="text-lg text-red-600">Discount: {discount.toFixed(2)} Birr</Text>
          )}
          <Text className="text-xl font-bold">Final Price: {finalPrice.toFixed(2)} Birr</Text>
        </View>

        <TouchableOpacity
          className="bg-green-500 py-3 rounded-lg mt-4"
          onPress={() => Alert.alert("Info", "This button is not functional yet.")}
        >
          <Text className="text-white text-lg font-bold text-center">Proceed to Checkout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
