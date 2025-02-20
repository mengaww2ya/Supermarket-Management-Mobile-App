import React, { useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  TextInput,
} from "react-native";

export default function AddToCart({ route }) {
  const {
    image,
    productName,
    price = 0,
    discountPrice = 0,
    unitType,
  } = route.params || {};
  
  const [quantity, setQuantity] = useState(1);

  const increaseAmount = () => setQuantity((prev) => prev + 1);
  const decreaseAmount = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const totalPrice = price * quantity;
  const discount = discountPrice * quantity;
  const finalPrice = totalPrice - discount;

  return (
    <SafeAreaView className="flex-1 bg-white mx-4 my-2">
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={true}>
        <Text className="text-2xl font-bold text-center my-4">Add {productName} to Cart</Text>
        
        <View className="items-center mb-4">
          <Image source={image} style={{
    width: "100%",
    height: 220,
    borderRadius: 10,
    marginBottom: 10,
    resizeMode: "contain",
  }} />
        </View>

        <Text className="text-xl font-bold text-center mb-2">{productName}</Text>
        
        <View className="flex-row justify-around items-center my-4">
          <TouchableOpacity className="bg-blue-500 py-2 px-4 rounded-lg h-10" onPress={decreaseAmount}>
            <Text className="text-white font-semibold">Decrease</Text>
          </TouchableOpacity>

          <TextInput
            className="text-center border border-gray rounded-lg w-20 h-10 "
            value={String(quantity)}
            onChangeText={(text) => setQuantity(Number(text) || 1)}
            keyboardType="numeric"
          />
          
          <TouchableOpacity className="bg-blue-500 py-2 px-4 rounded-lg h-10" onPress={increaseAmount}>
            <Text className="text-white font-semibold">Increase</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-lg text-center">
          Price for one {unitType} {productName}: {price.toFixed(2)} Birr
        </Text>
        {discountPrice > 0 && (
          <Text className="text-lg text-center text-red-600">
            Discount for one {unitType} {productName}: {discountPrice.toFixed(2)} Birr
          </Text>
        )}
        <Text className="text-lg text-center mb-4">
          You add {quantity} {unitType} {productName}
        </Text>

        <View className="items-center mb-4">
          <Text className="text-lg font-bold">
            Total Price: {totalPrice.toFixed(2)} Birr
          </Text>
          {discountPrice > 0 && (
            <Text className="text-lg text-red-600">
              Discount: {discount.toFixed(2)} Birr
            </Text>
          )}
          <Text className="text-xl font-bold">
            Final Price: {finalPrice.toFixed(2)} Birr
          </Text>
        </View>

        <TouchableOpacity
          className="bg-green-500 py-3 rounded-lg mt-4 w-70"
          onPress={() => {
            alert("Hey! This button is not functional right now.", "ok");
          }}
        >
          <Text className="text-white text-lg font-bold text-center">Proceed to Checkout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}