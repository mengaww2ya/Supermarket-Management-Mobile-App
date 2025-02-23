import React from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  SafeAreaView,
} from "react-native";
import { colors } from "react-native-elements";
import SupplierFooter from "../subscrean/suplierfooter";

export default function manageProduct({ navigation }) {
  const screenWidth = useWindowDimensions().width;
  const screenHeight = useWindowDimensions().height;
  return (
    <SafeAreaView style={styles.homeContainer}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
      >
        <View style={styles.container}>
          {/* Welcome Message */}
          <Text style={styles.textTitle}>Manage Product</Text>

          {/* Cards Section */}
          <View style={styles.buttoncontainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("emplyeeManagement")}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>View Supplied Products</Text>
                <Text style={styles.btnsubtitl}>
                  manage all employee in the supermarket
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("customerManagement")}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>Add Products</Text>
                <Text style={styles.btnsubtitl}>
                  Add new products for supply
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("promotionManagement")}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>Update Product</Text>
                <Text style={styles.btnsubtitl}>
                  Update Product Information
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("inventoryManagement")}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>Delete Product</Text>
                <Text style={styles.btnsubtitl}>remove existing product</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <SupplierFooter navigation={navigation} />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  homeContainer:{
    flex:1,
  },
  container: {
    backgroundColor: "white",
    borderColor: colors.grey5,
    borderWidth: 1,
    alignSelf: "center",
  },
  buttoncontainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  textTitle: {
    backgroundColor: colors.grey3,
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    padding: 10,
    margin: 10,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.grey5,
    width: "47%", // Responsive grid layout
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    borderColor: colors.grey4,
    borderWidth: 1,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4, // For Android shadow
  },
  buttontxt: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 5,
    color: "#333",
  },
  btnsubtitl: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
});
