import React from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  SafeAreaView,
} from "react-native";
import { PersonalCareproducts } from "../global/data.js";
import Footer from "../subscrean/foter.js";
import { colors } from "react-native-elements";
import Ionicons from "react-native-vector-icons/Ionicons";
export default function PersonalCareProductsList({ navigation }) {
  const { width: screenWidth } = useWindowDimensions();

  // Filter only active personal care products
  const activeProducts = PersonalCareproducts.filter(
    (product) => product.status === "Active"
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.cardContainer}
      onPress={() =>
        navigation.navigate("Item", {
          productId: item.productId,
          productName: item.productName,
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          description: item.description,
          image: item.image,
          price: item.price,
          discountPrice: item.discountPrice,
          stockQuantity: item.stockQuantity,
          unitType: item.unitType,
          brand: item.brand,
          supplier: item.supplier,
          status: item.status,
          dateAdded: item.dateAdded,
          lastUpdated: item.lastUpdated,
          productionDate: item.productionDate,
          expirationDate: item.expirationDate,
          bestSeller: item.bestSeller,
          ratings: item.ratings,
          numberOfReviews: item.numberOfReviews,
          specialOffers: item.specialOffers,
          addedBy: item.addedBy,
        })
      }
    >
      <View style={styles.productCard}>
        <Text style={styles.productName}>{item.productName}</Text>

        <Image
          source={item.image}
          style={[styles.productImage, { width: screenWidth * 0.7 }]}
          resizeMode="contain"
        />
        <Text style={styles.productPrice}>
          Price: ${item.discountPrice ? item.discountPrice : item.price} /{" "}
          {item.unitType}
        </Text>
        <Text style={styles.productdiscription}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Personal Care Product</Text>
        {/* Cart Button */}
        <TouchableOpacity
          // onPress={() => navigation.navigate("CartPage")}
          style={styles.iconButton}
        >
          <Ionicons name="cart" size={30} color="blue" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={activeProducts}
        keyExtractor={(item) => item.productId.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      <Footer navigation={navigation} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
    padding: 10,
  },
  listContainer: {
    paddingBottom: 20,
    alignItems: "center",
    marginHorizontal:10,
  },
  cardContainer: {
    width: "95%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    alignItems: "center",
    borderColor: colors.grey4,
    borderWidth: 1,
  },
  productCard: {
    alignItems: "center",
  },
  productImage: {
    height: 180,
    borderRadius: 10,
    marginBottom: 10,
  },
  productName: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  productdiscription: {
    fontSize: 13,
    color: colors.grey3,
    fontWeight: "bold",
  },
  productPrice: {
    fontSize: 16,
    color: "#2ecc71",
    marginTop: 5,
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFDC2B",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2ECE33",
    textAlign: "center",
  },
  iconButton: { padding: 5 },
});
