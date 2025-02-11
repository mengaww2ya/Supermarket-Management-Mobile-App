import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { categories } from "../global/data.js";
import Footer from "../subscrean/foter.js";
import { colors } from "react-native-elements";

const categoryNavigationMap = {
  "Fruit & Vegetable": "FreshProducts",
  "Dairy & Eggs": "DairyProducts",
  "Meat & Seafood": "Meatproducts",
  Bakery: "Bakeryproducts",
  Beverages: "Beveragesproducts",
  "Pantry Essentials": "Pantryproducts",
  "Frozen Foods": "Frozenproducts",
  "Personal Care": "PersonalCareproducts",
};

export default function Homepage({ navigation }) {
  const ScreenWidth = useWindowDimensions().width;
  const [selectedCategory, setSelectedCategory] = useState(null);

  const promoCategories = categories.filter(
    (item) => item.status === "Active" && item.discountAvailable === true
  );
  const standardCategories = categories.filter(
    (item) => item.status === "Active" && item.discountAvailable === false
  );

  const handleCategoryPress = (item) => {
    setSelectedCategory(item.categoryId);
    const screenName = categoryNavigationMap[item.categoryName];
    if (screenName) {
      navigation.navigate(screenName);
    }
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.cardContainer, { width: ScreenWidth * 0.42 }]}
      onPress={() => handleCategoryPress(item)}
    >
      <Text style={styles.cardText}>{item.categoryName}</Text>
      <Image style={styles.cardImage} source={item.image} />
      <Text style={styles.carddiscription}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f4f4f4" }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          {promoCategories.length > 0 && (
            <View>
              <Text style={styles.TextHead}>Promotion Categories</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={promoCategories}
                keyExtractor={(item) => item.categoryId.toString()}
                renderItem={renderCategoryItem}
                contentContainerStyle={styles.listContainer}
              />
            </View>
          )}
          {standardCategories.length > 0 && (
            <View>
              <Text style={styles.TextHead}>Standard Categories</Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={standardCategories}
                keyExtractor={(item) => item.categoryId.toString()}
                renderItem={renderCategoryItem}
                contentContainerStyle={styles.listContainer}
              />
            </View>
          )}
        </View>
      </ScrollView>
      <Footer navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
  },
  TextHead: {
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 12,
    color: "#333",
    textAlign: "center",
  },
  listContainer: {
    paddingVertical: 10,
  },
  cardContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.grey4,
  },
  cardImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginBottom: 10,
    resizeMode: "contain",
  },
  cardText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  carddiscription:{
    fontSize:12,
    color:colors.grey3,
    fontWeight:"bold"
  }
});
