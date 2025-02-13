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
  Modal,
  TextInput,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { categories } from "../global/data.js";
import Footer from "../subscrean/foter.js";
import { colors } from "react-native-elements";
import { ScreenHeight } from "react-native-elements/dist/helpers/index.js";

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
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
      setMenuVisible(false);
    }
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.cardContainer, { width: ScreenWidth * 0.42 }]}
      onPress={() => handleCategoryPress(item)}
    >
      <Text style={styles.cardText}>{item.categoryName}</Text>
      <Image style={styles.cardImage} source={item.image} />
      <Text style={styles.cardDescription}>{item.description}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f4f4f4" }}>
      {/* Header Section */}
      <View style={styles.header}>
        {/* Menu Button */}
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          style={styles.iconButton}
        >
          <Ionicons name="menu" size={30} color="black" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Home Page</Text>

        {/* Cart Button */}
        <TouchableOpacity
          onPress={() => navigation.navigate("CartPage")}
          style={styles.iconButton}
        >
          <Ionicons name="cart" size={30} color="black" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.container}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={24} color="gray" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search categories..."
              value={searchQuery}
              onChangeText={(text) => setSearchQuery(text)}
            />
          </View>

          {promoCategories.length > 0 && (
            <View>
              <Text style={styles.TextHeadPromo}>Promotion Categories</Text>
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

      {/* Footer */}
      <Footer navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginHorizontal: 15,
    marginVertical: 10,
    elevation: 3,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16 },
  TextHead: {
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 12,
    color: "#333",
    textAlign: "center",
  },
  TextHeadPromo: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 12,
    color: "black",
  },
  listContainer: { paddingVertical: 10 },
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
  cardText: { fontSize: 16, fontWeight: "bold", textAlign: "center" },
  cardDescription: { fontSize: 12, color: colors.grey3, fontWeight: "bold" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFDC2B",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "black" },
  iconButton: { padding: 5 },
});
