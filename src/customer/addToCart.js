import React, { useState, useEffect } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function AddToCart({ route }) {
  const {
    image,
    ProductName,
    Price = 0,
    DiscountPrice = 0,
    packagetype,
  } = route.params || {};
  const [quantity, setQuantity] = useState(1);
  const increaseAmount = () => setQuantity((prev) => prev + 1);
  const decreaseAmount = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  const totalPrice = Price * quantity;
  const discount = DiscountPrice * quantity;
  const finalPrice = totalPrice - discount;
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={true}
        //   contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.container}>
          <Text style={styles.title}>Add {ProductName} to Cart</Text>
          <View style={styles.imageContainer}>
            <Image source={image} style={styles.productImage} />
          </View>

          <Text style={styles.productName}>{ProductName}</Text>
          <View style={styles.quantityContainer}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={decreaseAmount}
            >
              <Text style={styles.quantityButtonText}>Decrease</Text>
            </TouchableOpacity>
            <Text style={styles.quantityText}>{quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={increaseAmount}
            >
              <Text style={styles.quantityButtonText}>Increase</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.infoText}>
            Price for one {packagetype} {ProductName}: {Price.toFixed(2)} Birr
          </Text>
          {DiscountPrice > 0 && (
            <Text style={styles.infoText}>
              Discount for one {packagetype} {ProductName}:{" "}
              {DiscountPrice.toFixed(2)} Birr
            </Text>
          )}
          <Text style={styles.infoText}>
            You add {quantity} {packagetype} {ProductName}
          </Text>
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>
              Total Price: {totalPrice.toFixed(2)} Birr
            </Text>
            {DiscountPrice > 0 && (
              <Text style={styles.discountText}>
                Discount: {discount.toFixed(2)} Birr
              </Text>
            )}
            <Text style={styles.finalPriceText}>
              Final Price: {finalPrice.toFixed(2)} Birr
            </Text>
          </View>

          <TouchableOpacity
            style={styles.checkoutButton}
            onPress={() => {
              alert("Hey! this button is not functional right now.", "ok");
            }}
          >
            <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    margin: 10,
    backgroundColor: "white",
  },

  container: {
    margin: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginBottom: 20,
  },
  imageContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  productImage: {
    width: "100%",
    height: 200,
    resizeMode: "contain",
    borderRadius: 10,
  },
  noImageText: {
    fontSize: 16,
    color: "gray",
  },
  productName: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: "#444",
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    textAlign: "center",
    color: "#555",
    marginBottom: 5,
  },
  quantityContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    marginVertical: 20,
  },
  quantityButton: {
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 8,
    width: "30%",
    alignItems: "center",
  },
  quantityButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  quantityText: {
    fontSize: 20,
    fontWeight: "bold",
    marginHorizontal: 15,
    color: "#333",
  },
  priceContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  priceText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#444",
  },
  discountText: {
    fontSize: 16,
    color: "red",
  },
  finalPriceText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 5,
  },
  checkoutButton: {
    backgroundColor: "#28a745",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  checkoutButtonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
});
