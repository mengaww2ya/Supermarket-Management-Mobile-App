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
import { PieChart } from "react-native-chart-kit";
import { BarChart } from "react-native-chart-kit";

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
  const totalProducts = dashboardData.inventory.totalProducts;
  const discountedProducts = dashboardData.promotions.discountedProducts;
  const nonDiscountedProducts = totalProducts - discountedProducts;
  const totalCategories = dashboardData.inventory.totalCategories;
  const orderLabels = ["Incoming", "Pending", "Transit"];
  const orderValues = [
    dashboardData.orders.incoming,
    dashboardData.orders.pending,
    dashboardData.orders.transit,
  ];
  const productsPerCategory = Math.round(totalProducts / totalCategories);
  const totalRevenue =
    parseFloat(
      dashboardData.sales.totalRevenue.replace("$", "").replace("K", "")
    ) * 1000;
  const totalProfit =
    parseFloat(
      dashboardData.sales.totalProfit.replace("$", "").replace("K", "")
    ) * 1000;
  const totalSales = dashboardData.sales.totalSales;

  const salesLabels = ["Revenue", "Sales", "Profit"];
  const salesValues = [totalRevenue, totalSales, totalProfit];
  const totalSuppliers = dashboardData.suppliers.total;
  const pendingOrders = dashboardData.suppliers.pendingOrders;
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
          <View
            style={[
              styles.buttonview,
              { width: screenWidth * 0.85, height: screenHeight * 0.4 },
            ]}
          >
            <View style={styles.buttonContent}>
              <Text style={styles.metricText}>
                Total Employees:{" "}
                <Text style={styles.metricValue}>
                  {dashboardData.employees.total}
                </Text>
              </Text>

              {/* Pie Chart for Employee Distribution */}
              <PieChart
                data={[
                  {
                    name: "Stock Managers",
                    population: dashboardData.employees.stockManagers,
                    color: "#FF6384",
                    legendFontColor: "#333",
                    legendFontSize: 12,
                  },
                  {
                    name: "Customer Assistants",
                    population: dashboardData.employees.customerAssistants,
                    color: "#36A2EB",
                    legendFontColor: "#333",
                    legendFontSize: 12,
                  },
                  {
                    name: "Delivery Agents",
                    population: dashboardData.employees.deliveryAgents,
                    color: "#FFCE56",
                    legendFontColor: "#333",
                    legendFontSize: 12,
                  },
                ]}
                width={screenWidth * 0.8}
                height={100}
                chartConfig={{
                  backgroundColor: "#fff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                navigation.navigate("EmployeeManagement");
              }}
            >
              <Text style={styles.buttontxt}>Employee Management</Text>
            </TouchableOpacity>
          </View>
          {/* Customer Management */}
          <View
            style={[
              styles.buttonview,
              { width: screenWidth * 0.85, height: screenHeight * 0.45 },
            ]}
          >
            <View style={styles.buttonContent}>
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

              {/* Customer Feedback Bar Chart */}
              <BarChart
                data={{
                  labels: ["Total", "Feedback"],
                  datasets: [
                    {
                      data: [
                        dashboardData.customers.total,
                        dashboardData.customers.feedback,
                      ],
                    },
                  ],
                }}
                width={screenWidth * 0.55}
                height={130}
                chartConfig={{
                  backgroundGradientFrom: "#f4f4f4",
                  backgroundGradientTo: "#ffffff",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  barPercentage: 0.6,
                }}
                style={{ marginVertical: 10, borderRadius: 10 }}
                yAxisSuffix=""
                fromZero
              />

              {/* Feedback Percentage */}
              <Text
                style={[
                  styles.metricText,
                  { fontSize: 16, fontWeight: "bold", color: "#007bff" },
                ]}
              >
                Feedback Engagement:{" "}
                {(
                  (dashboardData.customers.feedback /
                    dashboardData.customers.total) *
                  100
                ).toFixed(2)}
                %
              </Text>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                navigation.navigate("CustomerManagement");
              }}
            >
              <Text style={styles.buttontxt}>Customer Management</Text>
            </TouchableOpacity>
          </View>

          {/* Promotion & Discount */}
          <View
            style={[
              styles.buttonview,
              { width: screenWidth * 0.85, height: screenHeight * 0.4 },
            ]}
          >
            <View style={styles.buttonContent}>
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

              {/* Pie Chart for Discounted vs Non-Discounted Products */}
              <PieChart
                data={[
                  {
                    name: "Discounted",
                    population: discountedProducts,
                    color: "#007bff",
                    legendFontColor: "#007bff",
                    legendFontSize: 12,
                  },
                  {
                    name: "Non-Discounted",
                    population: nonDiscountedProducts,
                    color: "#ffcc00",
                    legendFontColor: "#00cc00",
                    legendFontSize: 12,
                  },
                ]}
                width={screenWidth * 0.55}
                height={130}
                chartConfig={{
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                style={{ marginVertical: 10 }}
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                navigation.navigate("promotionManagement");
              }}
            >
              <Text style={styles.buttontxt}>Promotion & Discount</Text>
            </TouchableOpacity>
          </View>
          {/* Inventory Management */}
          <View
            style={[
              styles.buttonview,
              { width: screenWidth * 0.85, height: screenHeight * 0.45 },
            ]}
          >
            <View style={styles.buttonContent}>
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

              {/* Bar Chart for Products per Category */}
              <BarChart
                data={{
                  labels: ["Categories"],
                  datasets: [{ data: [productsPerCategory] }],
                }}
                width={screenWidth * 0.55}
                height={130}
                yAxisLabel=""
                chartConfig={{
                  backgroundGradientFrom: "#f3f3f3",
                  backgroundGradientTo: "#f3f3f3",
                  color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
                  barPercentage: 0.5,
                }}
                style={{ marginVertical: 10, borderRadius: 10 }}
                verticalLabelRotation={0}
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                navigation.navigate("inventoryManagement");
              }}
            >
              <Text style={styles.buttontxt}>Inventory Management</Text>
            </TouchableOpacity>
          </View>
          {/* Order Management */}
          <View
            style={[
              styles.buttonview,
              { width: screenWidth * 0.85, height: screenHeight * 0.5 },
            ]}
          >
            <View style={styles.buttonContent}>
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

              {/* Bar Graph for Order Status */}
              <BarChart
                data={{
                  labels: orderLabels,
                  datasets: [{ data: orderValues }],
                }}
                width={screenWidth * 0.6}
                height={150}
                yAxisLabel=""
                chartConfig={{
                  backgroundGradientFrom: "#f3f3f3",
                  backgroundGradientTo: "#f3f3f3",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  barPercentage: 0.5,
                }}
                style={{ marginVertical: 10, borderRadius: 10 }}
                fromZero
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                navigation.navigate("orderManagement");
              }}
            >
              <Text style={styles.buttontxt}>Order Management</Text>
            </TouchableOpacity>
          </View>
          {/* Sales & Revenue */}
          <View
            style={[
              styles.buttonview,
              { width: screenWidth * 0.85, height: screenHeight * 0.5 },
            ]}
          >
            <View style={styles.buttonContent}>
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

              {/* Bar Graph for Sales & Revenue */}
              <BarChart
                data={{
                  labels: salesLabels,
                  datasets: [{ data: salesValues }],
                }}
                width={screenWidth * 0.65}
                height={150}
                yAxisLabel="$"
                chartConfig={{
                  backgroundGradientFrom: "#f3f3f3",
                  backgroundGradientTo: "#f3f3f3",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(34, 193, 195, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  barPercentage: 0.5,
                }}
                style={{ marginVertical: 10, borderRadius: 10 }}
                fromZero
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                navigation.navigate("saleRevenueManagement");
              }}
            >
              <Text style={styles.buttontxt}>Sales & Revenue</Text>
            </TouchableOpacity>
          </View>
          {/* Supplier Management */}
          <View
            style={[
              styles.buttonview,
              { width: screenWidth * 0.85, height: screenHeight * 0.5 },
            ]}
          >
            <View style={styles.buttonContent}>
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

              {/* Pie Chart for Supplier Data */}
              <PieChart
                data={[
                  {
                    name: "Active Suppliers",
                    population: totalSuppliers - pendingOrders,
                    color: "#4CAF50",
                    legendFontColor: "#000",
                    legendFontSize: 14,
                  },
                  {
                    name: "Pending Orders",
                    population: pendingOrders,
                    color: "#FF9800",
                    legendFontColor: "#000",
                    legendFontSize: 14,
                  },
                ]}
                width={screenWidth * 0.75}
                height={160}
                chartConfig={{
                  backgroundColor: "#f3f3f3",
                  backgroundGradientFrom: "#f3f3f3",
                  backgroundGradientTo: "#f3f3f3",
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                navigation.navigate("suplierManagement");
              }}
            >
              <Text style={styles.buttontxt}>Supplier Management</Text>
            </TouchableOpacity>
          </View>
          {/* Alerts & Notifications */}
          <View
            style={[
              styles.buttonview,
              { width: screenWidth * 0.85, height: screenHeight * 0.5 },
            ]}
          >
            <View style={styles.buttonContent}>
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

              {/* Bar Chart for Alert Data */}
              <BarChart
                data={{
                  labels: ["Low Stock", "Pending Orders", "Expiry Warnings"],
                  datasets: [
                    {
                      data: [
                        dashboardData.alerts.lowStock,
                        dashboardData.alerts.pendingOrders,
                        dashboardData.alerts.expiryWarnings,
                      ],
                    },
                  ],
                }}
                width={screenWidth * 0.65}
                height={150}
                yAxisLabel=""
                chartConfig={{
                  backgroundGradientFrom: "#f3f3f3",
                  backgroundGradientTo: "#f3f3f3",
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(255, 69, 0, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                style={{ marginVertical: 8, borderRadius: 10 }}
                verticalLabelRotation={0}
              />
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                navigation.navigate("alertNotifManagement");
              }}
            >
              <Text style={styles.buttontxt}>Alerts & Notifications</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles remain the same as in your original code.
const styles = StyleSheet.create({
  homeContainer: {
    flex: 1,
    backgroundColor: "#F4F6F9", // Light background for a modern look
  },
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
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  buttonview: {
    backgroundColor: "#FFFFFF", // Clean white cards
    borderRadius: 15,
    padding: 25,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5, // Shadow for Android
    shadowColor: "#000", // Shadow for iOS
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    marginBottom: 20,
  },
  buttonContent: {
    alignItems: "center",
    width: "100%",
  },
  metricText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#34495E",
    marginBottom: 5,
    textAlign: "center",
  },
  metricValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007bff",
  },
  button: {
    backgroundColor: "green",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 25,
    marginTop: 10,
    width: "90%",
    alignItems: "center",
  },
  buttontxt: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    // color: "#333",
    textAlign: "center",
  },
  icon: {
    marginBottom: 10,
  },
});
