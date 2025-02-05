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
 
export default function ManagerHomePage({ navigation }) {
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
          <Text style={styles.textTitle}>Welcome!</Text>

          {/* Cards Section */}
          <View style={styles.buttoncontainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("emplyeeManagement")}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>Employee Management</Text>
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
                <Text style={styles.buttontxt}>Customer Management</Text>
                <Text style={styles.btnsubtitl}>
                  manage all registered custoer
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("promotionManagement")}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>Promotion & Discount</Text>
                <Text style={styles.btnsubtitl}>manage promotions</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("inventoryManagement")}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>Inventory Management</Text>
                <Text style={styles.btnsubtitl}>
                  Monitor stock levels in real-time
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("orderManagement")}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>Order Management</Text>
                <Text style={styles.btnsubtitl}>
                  Process and track customer orders
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("saleRevenueManagement")}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>Sales & Revenue</Text>
                <Text style={styles.btnsubtitl}>
                  Monitor payment , sales reports.
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("suplierManagement")}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>Supplier Management</Text>
                <Text style={styles.btnsubtitl}>
                  Add, update, and remove suppliers
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("alertNotifManagement")}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>Alerts & Notifications</Text>
                <Text style={styles.btnsubtitl}>
                  Set up alerts for low stock, expired items
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderColor: colors.grey5,
    borderWidth: 1,
    alignSelf: "center",
  },
  buttoncontainer: {
    margin:10,
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