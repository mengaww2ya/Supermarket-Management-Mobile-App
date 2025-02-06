import React from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "react-native-elements";

export default function ManagerHomePage({ navigation }) {
  return (
    <SafeAreaView style={styles.homeContainer}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.container}>
          <Text style={styles.textTitle}>Welcome!</Text>
          <View style={styles.buttonContainer}>
            {menuOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.button}
                onPress={() => navigation.navigate(option.navigate)}
              >
                <Ionicons
                  name={option.icon}
                  size={30}
                  color="#007bff"
                  style={styles.icon}
                />
                <Text style={styles.buttontxt}>{option.title}</Text>
                <Text style={styles.btnsubtitl}>{option.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const menuOptions = [
  {
    title: "Employee Management",
    subtitle: "Manage all employees",
    icon: "people-outline",
    navigate: "emplyeeManagement",
  },
  {
    title: "Customer Management",
    subtitle: "Manage all customers",
    icon: "person-outline",
    navigate: "customerManagement",
  },
  {
    title: "Promotion & Discount",
    subtitle: "Manage promotions",
    icon: "pricetag-outline",
    navigate: "promotionManagement",
  },
  {
    title: "Inventory Management",
    subtitle: "Monitor stock levels",
    icon: "cube-outline",
    navigate: "inventoryManagement",
  },
  {
    title: "Order Management",
    subtitle: "Track customer orders",
    icon: "cart-outline",
    navigate: "orderManagement",
  },
  {
    title: "Sales & Revenue",
    subtitle: "Monitor sales reports",
    icon: "bar-chart-outline",
    navigate: "saleRevenueManagement",
  },
  {
    title: "Supplier Management",
    subtitle: "Manage suppliers",
    icon: "business-outline",
    navigate: "suplierManagement",
  },
  {
    title: "Alerts & Notifications",
    subtitle: "Set up alerts",
    icon: "notifications-outline",
    navigate: "alertNotifManagement",
  },
];

const styles = StyleSheet.create({
  homeContainer: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  container: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    // margin: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  textTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  button: {
    backgroundColor: "#fff",
    width: "48%",
    height: 130,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  icon: {
    marginBottom: 10,
  },
  buttontxt: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  btnsubtitl: {
    fontSize: 12,
    color: "#555",
    textAlign: "center",
  },
});
