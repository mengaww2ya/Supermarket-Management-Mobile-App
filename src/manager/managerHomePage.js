import React from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  useWindowDimensions,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const dashboardData = {
  employees: {
    total: 50,
    stockManagers: 10,
    customerAssistants: 20,
    deliveryAgents: 20,
  },
  customers: { total: 5000, feedback: 200 },
  promotions: { discountCategories: 5, discountedProducts: 20 },
  inventory: { totalProducts: 1000, totalCategories: 50 },
  orders: { incoming: 30, pending: 15, transit: 10 },
  sales: { totalRevenue: "$120K", totalSales: 2000, totalProfit: "$30K" },
  suppliers: { total: 20, pendingOrders: 5 },
  alerts: { lowStock: 10, pendingOrders: 15, expiryWarnings: 8 },
};

export default function ManagerHomePage({ navigation }) {
  const screenWidth = useWindowDimensions().width;
  const screenHeight = useWindowDimensions().height;

  return (
    <SafeAreaView style={styles.homeContainer}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <ImageBackground
          source={require("../../assets/background/city.jpg")}
          style={styles.container}
          resizeMode="cover"
        >
          <Text style={styles.textTitle}>Welcome, Manager!</Text>

          {/* Employee Management */}
          <TouchableOpacity
            style={[
              styles.button,
              { width: screenWidth * 0.85, height: screenHeight * 0.25 },
            ]}
            onPress={() => navigation.navigate("emplyeeManagement")}
          >
            <View style={styles.buttonContent}>
              <Ionicons
                name="people-outline"
                size={50}
                color="#007bff"
                style={styles.icon}
              />
              <Text style={styles.buttontxt}>Employee Management</Text>
              <Text style={styles.metricText}>
                Total Employees:{" "}
                <Text style={styles.metricValue}>
                  {dashboardData.employees.total}
                </Text>
              </Text>
              <Text style={styles.metricText}>
                Stock Managers:{" "}
                <Text style={styles.metricValue}>
                  {dashboardData.employees.stockManagers}
                </Text>
              </Text>
              <Text style={styles.metricText}>
                Customer Assistants:{" "}
                <Text style={styles.metricValue}>
                  {dashboardData.employees.customerAssistants}
                </Text>
              </Text>
              <Text style={styles.metricText}>
                Delivery Agents:{" "}
                <Text style={styles.metricValue}>
                  {dashboardData.employees.deliveryAgents}
                </Text>
              </Text>
            </View>
          </TouchableOpacity>

          {/* Customer Management */}
          <TouchableOpacity
            style={[
              styles.button,
              { width: screenWidth * 0.85, height: screenHeight * 0.25 },
            ]}
            onPress={() => navigation.navigate("customerManagement")}
          >
            <View style={styles.buttonContent}>
              <Ionicons
                name="person-outline"
                size={50}
                color="#007bff"
                style={styles.icon}
              />
              <Text style={styles.buttontxt}>Customer Management</Text>
              <Text style={styles.metricText}>
                Total Customers:{" "}
                <Text style={styles.metricValue}>
                  {dashboardData.customers.total}
                </Text>
              </Text>
              <Text style={styles.metricText}>
                Total Feedback:{" "}
                <Text style={styles.metricValue}>
                  {dashboardData.customers.feedback}
                </Text>
              </Text>
            </View>
          </TouchableOpacity>

          {/* Promotion & Discount */}
          <TouchableOpacity
            style={[
              styles.button,
              { width: screenWidth * 0.85, height: screenHeight * 0.25 },
            ]}
            onPress={() => navigation.navigate("promotionManagement")}
          >
            <View style={styles.buttonContent}>
              <Ionicons
                name="pricetag-outline"
                size={50}
                color="#007bff"
                style={styles.icon}
              />
              <Text style={styles.buttontxt}>Promotion & Discount</Text>
              <Text style={styles.metricText}>
                Discount Categories:{" "}
                <Text style={styles.metricValue}>
                  {dashboardData.promotions.discountCategories}
                </Text>
              </Text>
              <Text style={styles.metricText}>
                Discounted Products:{" "}
                <Text style={styles.metricValue}>
                  {dashboardData.promotions.discountedProducts}
                </Text>
              </Text>
            </View>
          </TouchableOpacity>

          {/* Inventory Management */}
          <TouchableOpacity
            style={[
              styles.button,
              { width: screenWidth * 0.85, height: screenHeight * 0.25 },
            ]}
            onPress={() => navigation.navigate("inventoryManagement")}
          >
            <View style={styles.buttonContent}>
              <Ionicons
                name="cube-outline"
                size={50}
                color="#007bff"
                style={styles.icon}
              />
              <Text style={styles.buttontxt}>Inventory Management</Text>
              <Text style={styles.metricText}>
                Total Products:{" "}
                <Text style={styles.metricValue}>
                  {dashboardData.inventory.totalProducts}
                </Text>
              </Text>
              <Text style={styles.metricText}>
                Total Categories:{" "}
                <Text style={styles.metricValue}>
                  {dashboardData.inventory.totalCategories}
                </Text>
              </Text>
            </View>
          </TouchableOpacity>

          {/* Order Management */}
          <TouchableOpacity
            style={[
              styles.button,
              { width: screenWidth * 0.85, height: screenHeight * 0.25 },
            ]}
            onPress={() => navigation.navigate("orderManagement")}
          >
            <View style={styles.buttonContent}>
              <Ionicons
                name="cart-outline"
                size={50}
                color="#007bff"
                style={styles.icon}
              />
              <Text style={styles.buttontxt}>Order Management</Text>
              <Text style={styles.metricText}>
                Incoming Orders:{" "}
                <Text style={styles.metricValue}>
                  {dashboardData.orders.incoming}
                </Text>
              </Text>
              <Text style={styles.metricText}>
                Pending Orders:{" "}
                <Text style={styles.metricValue}>
                  {dashboardData.orders.pending}
                </Text>
              </Text>
              <Text style={styles.metricText}>
                Transit Orders:{" "}
                <Text style={styles.metricValue}>
                  {dashboardData.orders.transit}
                </Text>
              </Text>
            </View>
          </TouchableOpacity>

          {/* Sales & Revenue */}
          <TouchableOpacity
            style={[
              styles.button,
              { width: screenWidth * 0.85, height: screenHeight * 0.25 },
            ]}
            onPress={() => navigation.navigate("saleRevenueManagement")}
          >
            <View style={styles.buttonContent}>
              <Ionicons
                name="bar-chart-outline"
                size={50}
                color="#007bff"
                style={styles.icon}
              />
              <Text style={styles.buttontxt}>Sales & Revenue</Text>
              <Text style={styles.metricText}>
                Total Revenue:{" "}
                <Text style={styles.metricValue}>
                  {dashboardData.sales.totalRevenue}
                </Text>
              </Text>
              <Text style={styles.metricText}>
                Total Sales:{" "}
                <Text style={styles.metricValue}>
                  {dashboardData.sales.totalSales}
                </Text>
              </Text>
              <Text style={styles.metricText}>
                Total Profit:{" "}
                <Text style={styles.metricValue}>
                  {dashboardData.sales.totalProfit}
                </Text>
              </Text>
            </View>
          </TouchableOpacity>

          {/* Supplier Management */}
          <TouchableOpacity
            style={[
              styles.button,
              { width: screenWidth * 0.85, height: screenHeight * 0.25 },
            ]}
            onPress={() => navigation.navigate("supplierManagement")}
          >
            <View style={styles.buttonContent}>
              <Ionicons
                name="business-outline"
                size={50}
                color="#007bff"
                style={styles.icon}
              />
              <Text style={styles.buttontxt}>Supplier Management</Text>
              <Text style={styles.metricText}>
                Total Suppliers:{" "}
                <Text style={styles.metricValue}>
                  {dashboardData.suppliers.total}
                </Text>
              </Text>
              <Text style={styles.metricText}>
                Pending Orders:{" "}
                <Text style={styles.metricValue}>
                  {dashboardData.suppliers.pendingOrders}
                </Text>
              </Text>
            </View>
          </TouchableOpacity>
          {/* Alerts & Notifications */}
          <TouchableOpacity
            style={[
              styles.button,
              { width: screenWidth * 0.85, height: screenHeight * 0.25 },
            ]}
            onPress={() => navigation.navigate("alertManagement")}
          >
            <View style={styles.buttonContent}>
              <Ionicons
                name="notifications-circle-outline"
                size={50}
                color="#ff4444"
                style={styles.icon}
              />
              <Text style={styles.buttontxt}>Alerts & Notifications</Text>
              <Text style={styles.metricText}>
                Low Stock Alerts:{" "}
                <Text style={styles.metricValue}>
                  {dashboardData.alerts.lowStock}
                </Text>
              </Text>
              <Text style={styles.metricText}>
                Pending Order Alerts:{" "}
                <Text style={styles.metricValue}>
                  {dashboardData.alerts.pendingOrders}
                </Text>
              </Text>
              <Text style={styles.metricText}>
                Expiry Warnings:{" "}
                <Text style={styles.metricValue}>
                  {dashboardData.alerts.expiryWarnings}
                </Text>
              </Text>
            </View>
          </TouchableOpacity>
        </ImageBackground>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles remain the same as in your original code.

const styles = StyleSheet.create({
  homeContainer: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
    alignItems: "center",
  },
  container: {
    flex: 1,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  textTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#007bff",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    padding: 15,
  },
  buttonContent: {
    alignItems: "center",
  },
  icon: {
    marginBottom: 10,
  },
  buttontxt: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  metricText: {
    fontSize: 14,
    color: "#555",
    fontWeight: "600",
    textAlign: "center",
  },
  metricValue: {
    color: "#007bff",
    fontWeight: "bold",
  },
});
