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
      setMenuVisible(false); // Close menu after selection
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
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.iconButton}>
          <Ionicons name="menu" size={30} color="black" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Home Page</Text>

        {/* Cart Button */}
        <TouchableOpacity onPress={() => navigation.navigate("CartPage")} style={styles.iconButton}>
          <Ionicons name="cart" size={30} color="blue" />
        </TouchableOpacity>
      </View>

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

      {/* Footer */}
      <Footer navigation={navigation} />

      {/* Category Menu Modal */}
      <Modal visible={menuVisible} transparent={false} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent,{width:ScreenWidth*0.98,height:ScreenHeight*0.98}]}>
            <Text style={styles.modalTitle}>Categories</Text>
            <FlatList
              data={Object.keys(categoryNavigationMap)}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoryItem}
                  onPress={() => handleCategoryPress({ categoryName: item })}
                >
                  <Text style={styles.categoryText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setMenuVisible(false)}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15 },
  TextHead: {
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 12,
    color: "#333",
    textAlign: "center",
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
  
  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFDC2B",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#2ECE33" },
  iconButton: { padding: 5 },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    // width: 300,
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 15 },
  categoryItem: { padding: 10, borderBottomWidth: 1, borderColor: "#ccc" },
  categoryText: { fontSize: 18 },
  closeButton: {
    marginTop: 15,
    backgroundColor: "#FF5733",
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: { color: "white", fontWeight: "bold" },
});


