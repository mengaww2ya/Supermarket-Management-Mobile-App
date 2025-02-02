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
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
      >
        {/* Welcome Message */}
        <Text style={styles.titleText}>Welcome!</Text>

        {/* Cards Section */}
        <View style={styles.buttonView}>
          <TouchableOpacity
            style={styles.homeCard}
            onPress={() => navigation.navigate("emplyeeManagement")}
          >
            <Text style={styles.buttonText}>Employee Management</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeCard}
            onPress={() => navigation.navigate("customerManagement")}
          >
            <Text style={styles.buttonText}>Customer Management</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeCard}
            onPress={() => navigation.navigate("promotionManagement")}
          >
            <Text style={styles.buttonText}>Promotion & Discount</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeCard}
            onPress={() => navigation.navigate("inventoryManagement")}
          >
            <Text style={styles.buttonText}>Inventory Management</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeCard}
            onPress={() => navigation.navigate("orderManagement")}
          >
            <Text style={styles.buttonText}>Order Management</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeCard}
            onPress={() => navigation.navigate("saleRevenueManagement")}
          >
            <Text style={styles.buttonText}>Sales & Revenue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeCard}
            onPress={() => navigation.navigate("suplierManagement")}
          >
            <Text style={styles.buttonText}>Supplier Management</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeCard}
            onPress={() => navigation.navigate("alertNotifManagement")}
          >
            <Text style={styles.buttonText}>Alerts & Notifications</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  homeContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
    paddingTop: 20,
  },
  titleText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginBottom: 20,
  },
  buttonView: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  homeCard: {
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
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
});
