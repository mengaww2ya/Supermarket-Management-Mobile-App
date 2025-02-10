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
import { Dairyproducts } from "../global/data.js";

export default function DairyProductsList({ navigation }) {
  const { width: screenWidth } = useWindowDimensions();

  // Filter only active dairy products
  const activeProducts = Dairyproducts.filter(
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
        <Image
          source={item.image}
          style={[styles.productImage, { width: screenWidth * 0.7 }]}
          resizeMode="contain"
        />
        <Text style={styles.productName}>{item.productName}</Text>
        <Text style={styles.productPrice}>
          Price: ${item.discountPrice ? item.discountPrice : item.price} /{" "}
          {item.unitType}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={activeProducts}
        keyExtractor={(item) => item.productId.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
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
  },
  cardContainer: {
    width: "95%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 3,
    alignItems: "center",
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
  productPrice: {
    fontSize: 16,
    color: "#2ecc71",
    marginTop: 5,
    fontWeight: "600",
  },
});
