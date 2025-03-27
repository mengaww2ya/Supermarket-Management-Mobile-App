import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { db } from '../../../../firebase/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import HomeHeader from "../../../components/HomeHeader";
import { MenuProvider } from 'react-native-popup-menu';

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.42;

export default function Homepage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchCategories = async () => {
      const categoryCollection = collection(db, 'AddCategory');
      const categorySnapshot = await getDocs(categoryCollection);
      const categoryList = categorySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCategories(categoryList);
    };

    fetchCategories();
  }, []);

  const handleCategoryPress = (item) => {
    router.push({
      pathname: "/customer/ProductDisplay",
      params: { categoryId: item.id, categoryName: item.categoryName },
    });
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      className="bg-white border border-gray-200 rounded-lg shadow-md p-3 m-2 items-center justify-center"
      style={{ width: CARD_WIDTH, maxHeight: 200 }}
      onPress={() => handleCategoryPress(item)}
    >
      <Text className="text-base font-bold text-center text-blue-700">{item.categoryName}</Text>
      <View className="w-full h-24">
        <Image
          className="rounded-md my-2"
          source={{ uri: item.image }}
          style={{ width: "100%", height: "100%", resizeMode: "contain" }}
        />
      </View>
      <Text className="text-sm font-medium text-center w-full py-2">{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <HomeHeader title={"Home"}/>
      <View className="flex-row items-center bg-white rounded-md px-3 py-2 mx-4 my-3 shadow-md">
        <Ionicons name="search" size={24} color="gray" />
        <TextInput
          className="flex-1 ml-2 text-lg"
          placeholder="Search categories..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView className="flex-1 px-4">
        <Text className="text-xl font-bold text-center text-green-600 my-3">Categories</Text>
        <FlatList
          numColumns={2}
          data={categories.filter(category => category.categoryName.toLowerCase().includes(searchQuery.toLowerCase()))}
          keyExtractor={(item) => item.id}
          renderItem={renderCategoryItem}
          contentContainerStyle={{ alignItems: "center" }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}