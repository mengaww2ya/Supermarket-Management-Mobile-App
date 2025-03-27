import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { db } from '../../../firebase/firebaseConfig';
import { collection, getDocs, query, where } from 'firebase/firestore';
import HomeHeader from "../../components/HomeHeader";
export default function ProductDisplay() {
  const router = useRouter();
  const { categoryId } = useLocalSearchParams();
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const productsRef = collection(db, "Products");

        const q = query(productsRef, where("categoryId", "==", categoryId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setFilteredProducts([]);
        } else {
          const products = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setFilteredProducts(products);
        }
      } catch (err) {
        console.error("Error fetching products: ", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId]);


  const displayedProducts = filteredProducts.filter(product =>
    product.productName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-100">
        <Text className="text-xl">Loading...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-100">
        <Text className="text-xl font-bold text-red-500">{error}</Text>
      </SafeAreaView>
    );
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      className="bg-white rounded-xl p-4 mb-4 shadow-lg w-[95%] self-center flex flex-row items-center"
      onPress={() => router.push({ pathname: "/customer/Item", params: { productId: item.id } })}
    >
      <View className="w-20 h-20 bg-gray-200 rounded-lg flex justify-center items-center overflow-hidden">
        <Image
          style={{ width: "100%", height: "100%" }}
          source={{ uri: item.image }}
          resizeMode="contain"
        />
      </View>

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
      <HomeHeader title={"Products"}/>
      {/* Search Bar */}
      <View className="flex-row p-4 bg-white shadow-md rounded-lg">
        <TextInput
          placeholder="Search products..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          className="flex-1 border border-gray-300 rounded-lg p-2"
        />
      </View>

      <FlatList
        data={displayedProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={1}
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}