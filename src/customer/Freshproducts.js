import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  Animated,
} from "react-native";
import { Freshproducts } from "../global/data.js";
import Footer from "../subscrean/foter.js";
import Ionicons from "react-native-vector-icons/Ionicons";

export default function FreshProductsList({ navigation }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const fadeAnim = useState(new Animated.Value(0))[0];

  // Filter only active fresh products
  const activeProducts = Freshproducts.filter(
    (product) => product.status === "Active"
  );

  const openModal = (image) => {
    setSelectedImage(image);
    setModalVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      className="bg-white rounded-xl p-4 mb-4 shadow-lg w-[95%] self-center flex flex-row items-center"
      onPress={() => navigation.navigate("Item", { ...item })}
    >
      {/* Product Image with Modal Preview */}
      <TouchableOpacity onPress={() => openModal(item.image)}>
        <View className="w-20 h-20 bg-gray-200 rounded-lg flex justify-center items-center overflow-hidden">
          <Image
            style={{ width: "100%", height: "100%" }}
            source={item.image}
            resizeMode="contain"
          />
        </View>
      </TouchableOpacity>

      {/* Product Info */}
      <View className="ml-4 flex-1">
        <Text className="text-lg font-bold text-gray-800">{item.productName}</Text>
        <Text className="text-green-600 font-semibold text-base mt-1">
          ${item.discountPrice ? item.discountPrice : item.price} / {item.unitType}
        </Text>
        <Text className="text-sm text-gray-500 mt-1">{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100 px-2">
      {/* Header */}
      <View className="flex-row items-center justify-between bg-yellow-300 px-4 py-3">
        <Text className="text-lg font-bold text-green-600">Fresh Products</Text>
        <TouchableOpacity onPress={() => navigation.navigate("CartPage")} className="p-2">
          <Ionicons name="cart" size={30} color="blue" />
        </TouchableOpacity>
      </View>

      {/* Product List */}
      <FlatList
        data={activeProducts}
        keyExtractor={(item) => item.productId.toString()}
        renderItem={renderItem}
        numColumns={1}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Image Modal */}
      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-70">
          <Animated.View style={{ opacity: fadeAnim }} className="w-11/12 h-11/12">
            <TouchableOpacity onPress={() => setModalVisible(false)} className="flex-1 justify-center items-center">
              <Image
                source={selectedImage}
                className="w-full h-full"
                resizeMode="contain"
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Footer */}
      <Footer navigation={navigation} />
    </SafeAreaView>
  );
}