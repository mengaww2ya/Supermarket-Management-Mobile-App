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
  const homeBackground=require("../../assets/background/city.jpg");
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
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView
        showsVerticalScrollIndicator={false}
      contentContainerStyle={{
    paddingBottom: 20,
            alignItems: "center",
  }}
      >
        <ImageBackground
        className="w-full  items-center py-5 flex-1 justify-start"
          source={homeBackground}
          
          resizeMode="cover"
        >
          <Text className="text-2xl font-bold text-gray-800 mb-5 text-center">Welcome, Manager!</Text>
          {/* Employee Management */}
          <View 
           className="flex-1 bg-white rounded-2xl p-6 items-center justify-center shadow-md mb-5"
            style={[
              
              { width: screenWidth * 0.85, height: screenHeight * 0.4 },
            ]}
          >
            <View className="items-center w-full">
              <Text className="text-base font-bold text-gray-700 mb-1 text-center">
                Total Employees:{" "}
                <Text className="text-lg font-bold text-blue-500">
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
             className="bg-green-500 rounded-lg py-3 px-6 mt-2 w-11/12 items-center"
              onPress={() => {
                navigation.navigate("EmployeeManagement");
              }}
            >
              <Text  className="text-white text-base font-bold text-center">Employee Management</Text>
            </TouchableOpacity>
          </View>
          {/* Customer Management */}
          <View
          className="bg-white rounded-2xl p-6 items-center justify-center shadow-md mb-5"
            style={[
              
              { width: screenWidth * 0.85, height: screenHeight * 0.45 },
            ]}
          >
            <View className="items-center w-full">
              <Text className="text-base font-bold text-gray-700 mb-1 text-center">
                Total Customers:{" "}
                <Text className="text-lg font-bold text-blue-500">
                  {dashboardData.customers.total}
                </Text>
              </Text>

              <Text className="text-base font-bold text-gray-700 mb-1 text-center">
                Total Feedback:{" "}
                <Text className="text-lg font-bold text-blue-500">
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
                  labelColor: (opacity = 1) => `rgba(0, 200, 150, ${opacity})`,
                  barPercentage: 0.6,
                }}
                style={{ marginVertical: 10, borderRadius: 10 }}
                yAxisSuffix=""
                fromZero
              />

              {/* Feedback Percentage */}
              <Text
              className="text-base font-bold text-gray-700 mb-1 text-center"
                style={[
                  
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
             className="bg-green-500 rounded-lg py-3 px-6 mt-2 w-11/12 items-center"
              onPress={() => {
                navigation.navigate("CustomerManagement");
              }}
            >
              <Text  className="text-white text-base font-bold text-center">Customer Management</Text>
            </TouchableOpacity>
          </View>

          {/* Promotion & Discount */}
          <View
          className="bg-white rounded-2xl p-6 items-center justify-center shadow-md mb-5"
            style={[
              
              { width: screenWidth * 0.85, height: screenHeight * 0.4 },
            ]}
          >
            <View className="items-center w-full">
              <Text className="text-base font-bold text-gray-700 mb-1 text-center">
                Discount Categories:{" "}
                <Text className="text-lg font-bold text-blue-500">
                  {dashboardData.promotions.discountCategories}
                </Text>
              </Text>
              <Text className="text-base font-bold text-gray-700 mb-1 text-center">
                Discounted Products:{" "}
                <Text className="text-lg font-bold text-blue-500">
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
             className="bg-green-500 rounded-lg py-3 px-6 mt-2 w-11/12 items-center"
              onPress={() => {
                navigation.navigate("promotionManagement");
              }}
            >
              <Text  className="text-white text-base font-bold text-center">Promotion & Discount</Text>
            </TouchableOpacity>
          </View>
          {/* Inventory Management */}
          <View
          className="bg-white rounded-2xl p-6 items-center justify-center shadow-md mb-5"
            style={[
              
              { width: screenWidth * 0.85, height: screenHeight * 0.45 },
            ]}
          >
            <View className="items-center w-full">
              <Text className="text-base font-bold text-gray-700 mb-1 text-center">
                Total Products:{" "}
                <Text className="text-lg font-bold text-blue-500">
                  {dashboardData.inventory.totalProducts}
                </Text>
              </Text>
              <Text className="text-base font-bold text-gray-700 mb-1 text-center">
                Total Categories:{" "}
                <Text className="text-lg font-bold text-blue-500">
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
             className="bg-green-500 rounded-lg py-3 px-6 mt-2 w-11/12 items-center"
              onPress={() => {
                navigation.navigate("inventoryManagement");
              }}
            >
              <Text  className="text-white text-base font-bold text-center">Inventory Management</Text>
            </TouchableOpacity>
          </View>
          {/* Order Management */}
          <View
          className="bg-white rounded-2xl p-6 items-center justify-center shadow-md mb-5"
            style={[
              
              { width: screenWidth * 0.85, height: screenHeight * 0.5 },
            ]}
          >
            <View className="items-center w-full">
              <Text className="text-base font-bold text-gray-700 mb-1 text-center">
                Incoming Orders:{" "}
                <Text className="text-lg font-bold text-blue-500">
                  {dashboardData.orders.incoming}
                </Text>
              </Text>
              <Text className="text-base font-bold text-gray-700 mb-1 text-center">
                Pending Orders:{" "}
                <Text className="text-lg font-bold text-blue-500">
                  {dashboardData.orders.pending}
                </Text>
              </Text>
              <Text className="text-base font-bold text-gray-700 mb-1 text-center">
                Transit Orders:{" "}
                <Text className="text-lg font-bold text-blue-500">
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
                  labelColor: (opacity = 1) => `rgba(0, 200, 150, ${opacity})`,
                  barPercentage: 0.5,
                }}
                style={{ marginVertical: 10, borderRadius: 10 }}
                fromZero
              />
            </View>

            <TouchableOpacity
             className="bg-green-500 rounded-lg py-3 px-6 mt-2 w-11/12 items-center"
              onPress={() => {
                navigation.navigate("orderManagement");
              }}
            >
              <Text  className="text-white text-base font-bold text-center">Order Management</Text>
            </TouchableOpacity>
          </View>
          {/* Sales & Revenue */}
          <View
          className="bg-white rounded-2xl p-6 items-center justify-center shadow-md mb-5"
            style={[
              
              { width: screenWidth * 0.85, height: screenHeight * 0.5 },
            ]}
          >
            <View className="items-center w-full">
              <Text className="text-base font-bold text-gray-700 mb-1 text-center">
                Total Revenue:{" "}
                <Text className="text-lg font-bold text-blue-500">
                  {dashboardData.sales.totalRevenue}
                </Text>
              </Text>
              <Text className="text-base font-bold text-gray-700 mb-1 text-center">
                Total Sales:{" "}
                <Text className="text-lg font-bold text-blue-500">
                  {dashboardData.sales.totalSales}
                </Text>
              </Text>
              <Text className="text-base font-bold text-gray-700 mb-1 text-center">
                Total Profit:{" "}
                <Text className="text-lg font-bold text-blue-500">
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
                  color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 200, 150, ${opacity})`,
                  barPercentage: 0.5,
                }}
                style={{ marginVertical: 10, borderRadius: 10 }}
                fromZero
              />
            </View>

            <TouchableOpacity
             className="bg-green-500 rounded-lg py-3 px-6 mt-2 w-11/12 items-center"
              onPress={() => {
                navigation.navigate("saleRevenueManagement");
              }}
            >
              <Text  className="text-white text-base font-bold text-center">Sales & Revenue</Text>
            </TouchableOpacity>
          </View>
          {/* Supplier Management */}
          <View
          className="bg-white rounded-2xl p-6 items-center justify-center shadow-md mb-5"
            style={[
              
              { width: screenWidth * 0.85, height: screenHeight * 0.5 },
            ]}
          >
            <View className="items-center w-full">
              <Text className="text-base font-bold text-gray-700 mb-1 text-center">
                Total Suppliers:{" "}
                <Text className="text-lg font-bold text-blue-500">
                  {dashboardData.suppliers.total}
                </Text>
              </Text>
              <Text className="text-base font-bold text-gray-700 mb-1 text-center">
                Pending Orders:{" "}
                <Text className="text-lg font-bold text-blue-500">
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
             className="bg-green-500 rounded-lg py-3 px-6 mt-2 w-11/12 items-center"
              onPress={() => {
                navigation.navigate("suplierManagement");
              }}
            >
              <Text  className="text-white text-base font-bold text-center">Supplier Management</Text>
            </TouchableOpacity>
          </View>
          {/* Alerts & Notifications */}
          <View
          className="bg-white rounded-2xl p-6 items-center justify-center shadow-md mb-5"
            style={[
              { width: screenWidth * 0.85, height: screenHeight * 0.5 },
            ]}
          >
            <View className="items-center w-full">
              <Text className="text-base font-bold text-gray-700 mb-1 text-center">
                Low Stock Alerts:{" "}
                <Text className="text-lg font-bold text-blue-500">
                  {dashboardData.alerts.lowStock}
                </Text>
              </Text>
              <Text className="text-base font-bold text-gray-700 mb-1 text-center">
                Pending Order Alerts:{" "}
                <Text className="text-lg font-bold text-blue-500">
                  {dashboardData.alerts.pendingOrders}
                </Text>
              </Text>
              <Text className="text-base font-bold text-gray-700 mb-1 text-center">
                Expiry Warnings:{" "}
                <Text className="text-lg font-bold text-blue-500">
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
                  color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 200, 150, ${opacity})`,
                }}
                style={{ marginVertical: 8, borderRadius: 10 }}
                verticalLabelRotation={0}
              />
            </View>

            <TouchableOpacity
             className="bg-green-500 rounded-lg py-3 px-6 mt-2 w-11/12 items-center"
              onPress={() => {
                navigation.navigate("alertNotifManagement");
              }}
            >
              <Text  className="text-white text-base font-bold text-center">Alerts & Notifications</Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>
      </ScrollView>
    </SafeAreaView>
  );
}