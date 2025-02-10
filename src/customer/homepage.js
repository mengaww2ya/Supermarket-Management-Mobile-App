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
} from "react-native";
import { categories } from "../global/data.js";
import { SafeAreaView } from "react-native-web";

// Category Navigation Mapping
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
  const ScreenWidth=useWindowDimensions().width;
  const ScreenHeight=useWindowDimensions().height;
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Filter categories based on status and discount availability
  const promoCategories = categories.filter(
    (item) => item.status === "Active" && item.discountAvailable
  );
  const standardCategories = categories.filter(
    (item) => item.status === "Active" && !item.discountAvailable
  );

  // Handle Category Selection & Navigation
  const handleCategoryPress = (item) => {
    setSelectedCategory(item.categoryId);
    const screenName = categoryNavigationMap[item.categoryName];
    if (screenName) {
      navigation.navigate(screenName);
    }
  };

  // Reusable Category Card
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.cardContainer,{width:ScreenWidth*0.3,height:ScreenHeight*0.3}]}
      onPress={() => handleCategoryPress(item)}
    >
            <Text style={styles.cardText}>{item.categoryName}</Text>

      <Image style={[styles.cardImage,{width:ScreenWidth*0.26,height:ScreenHeight*0.2}]} source={item.image} />
      <Text style={styles.cardDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{flex:1}}>
      <ScrollView
        style={{paddingBottom: 20 }}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.container}>
          {/* Promotion Categories */}
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

          {/* Standard Categories */}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: "#f8f8f8",
  },
  TextHead: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#333",
    textAlign:"center",
  },
  listContainer: {
    paddingVertical: 10,
  },
  cardContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    alignItems: "center",
    elevation: 3,
  },
  cardImage: {
    borderRadius: 10,
    padding:5,
  },
  cardText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  cardDescription: {
    fontSize: 14,
    color: "#66",
    marginTop: 3,
  },
});
