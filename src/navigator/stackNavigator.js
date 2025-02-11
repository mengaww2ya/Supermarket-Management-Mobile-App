import Ionicons from "react-native-vector-icons/Ionicons";
import { TransitionPresets } from "@react-navigation/stack";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Login from "../screans/login.js";
import Welcome from "../screans/welcome.js";
import BakeryproductsList from "../customer/Bakeryproducts.js";
import PersonalCareproductsList from "../customer/PersonalCareproducts.js";
import DairyProductsList from "../customer/Dairyproducts.js";
import FreshProductsList from "../customer/Freshproducts.js";
import FrozenproductsList from "../customer/Frozenproducts.js";
import MeatproductsList from "../customer//Meatproducts.js";
import PantryproductsList from "../customer/Pantryproducts.js";
import BeveragesproductsList from "../customer/Beveragesproducts.js";
import Homepage from "../customer/homepage.js";
import Item from "../customer/Item.js";
import Signup from "../screans/signup.js";
import ManagerHomePage from "../manager/managerHomePage.js";
import DeveloperHomePage from "../screans/developingHompage.js";
import emplyeeManagement from "../manager/employee management.js";
import customerManagement from "../manager/customerManagement.js";
import inventoryManagement from "../manager/inventoryManagement.js";
import promotionManagement from "../manager/promotionDiscount.js";
import saleRevenueManagement from "../manager/saleRevenueManagement.js";
import alertNotifManagement from "../manager/alertNotificationManagement.js";
import orderManagement from "../manager/orderManagement.js";
import suplierManagement from "../manager/suplierManagement.js";
import customerList from "../manager/customerList.js";
import manageStock from "../stockManager/Manage stock levels.js";
import stockManagerHome from "../stockManager/stockManagerHome.js";
import addProduct from "../stockManager/addProduct.js";
import aemployeeManagement from "../admine/employeeManagement.js";
import asuplierManagement from "../admine/suplierManagement.js";
import AddEmployee from "../admine/addEmployee.js";
import AddSupplier from "../admine/addSuplier.js";
import admineHomePage from "../admine/adminHompage.js";
import acustomerManagement from "../admine/customerManagement.js";
import addToCart from "../customer/addToCart.js";
import CustomerSuport from "../customeAssistance/customerSuport.js";
import suplierHome from "../suplier/suplierHomePage.js";
import manageProduct from "../suplier/manageProduct.js";
import manageDelivery from "../suplier/manageDelivery.js";
import SmanageOrder from "../suplier/manageOrder.js";
import SperformanceAnalysis from "../suplier/SPerformanceAnalytics.js";
import MDeliveryAgentManagement from "../manager/deliveryManagement.js";
import mdeliveryOrders from "../manager/deliveryOrders.js";
import McustomerAssistance from "../manager/customerAssistance.js";
import MonitorCustomerAssistance from "../manager/monitorCustomerAssistance.js";
import handleEscalatedIssues from "../manager/HandlingEscalatedIssues.js";
import MCustomerServicePerformance from "../manager/customerServicePerformance.js";
import ChannelOverview from "../manager/ChannelOverview.js";
import ManageChannels from "../manager/ManageChannels.js";
const Authentic = createNativeStackNavigator();
export default function AuthicStackNavig() {
  return (
    <Authentic.Navigator initialRouteName="Welcome">
      <Authentic.Screen
        name="Welcome"
        component={Welcome}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Welcome",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="Login"
        component={Login}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Log In",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="Bakeryproducts"
        component={BakeryproductsList}
        options={{
          headerShown: false,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Bakery Food",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="PersonalCareproducts"
        component={PersonalCareproductsList}
        options={{
          headerShown: false,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Personal Care",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="DairyProducts"
        component={DairyProductsList}
        options={{
          headerShown: false,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Dairy Product",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="FreshProducts"
        component={FreshProductsList}
        options={{
          headerShown: false,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Fresh Produce",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="Frozenproducts"
        component={FrozenproductsList}
        options={{
          headerShown: false,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Frozen Foods",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="Meatproducts"
        component={MeatproductsList}
        options={{
          headerShown: false,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Meat Product See food",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="Item"
        component={Item}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Item",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="Signup"
        component={Signup}
        options={{
          headerShown: false,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Sign up",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="ManagerHomePage"
        component={ManagerHomePage}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Manager Home Page",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="DeveloperHomePage"
        component={DeveloperHomePage}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Delevloper Home Page",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="emplyeeManagement"
        component={emplyeeManagement}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Employee Management",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="customerManagement"
        component={customerManagement}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Customer Management",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="inventoryManagement"
        component={inventoryManagement}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Inventory Management",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="promotionManagement"
        component={promotionManagement}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Promotion Management",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="saleRevenueManagement"
        component={saleRevenueManagement}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Sale and Revenue  Management",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="alertNotifManagement"
        component={alertNotifManagement}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Alert And Notification Management",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="orderManagement"
        component={orderManagement}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Order  Management",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="suplierManagement"
        component={suplierManagement}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Suplier  Management",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="customerList"
        component={customerList}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "List Of Customers",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="manageStock"
        component={manageStock}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Stock Management",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="stockManagerHome"
        component={stockManagerHome}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Stock Management Home",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="addProduct"
        component={addProduct}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "ADD PRODUCT",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="asuplierManagement"
        component={asuplierManagement}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: " Suplier management",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="aemployeeManagement"
        component={aemployeeManagement}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: " Employee management",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="AddEmployee"
        component={AddEmployee}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: " Add employee",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="AddSupplier"
        component={AddSupplier}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: " Add suplier",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="admineHomePage"
        component={admineHomePage}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: " Addmin home Page",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="acustomerManagement"
        component={acustomerManagement}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: " Customer Management",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="addToCart"
        component={addToCart}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: " Add to cart",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="CustomerSuport"
        component={CustomerSuport}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: " Customer Support",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="suplierHome"
        component={suplierHome}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: " Suplier home",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="manageProduct"
        component={manageProduct}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: " Order Management",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="manageDelivery"
        component={manageDelivery}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: " Delivery Management",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="SmanageOrder"
        component={SmanageOrder}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: " Order Management",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="SperformanceAnalysis"
        component={SperformanceAnalysis}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: " Performance and analysis",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="MDeliveryAgentManagement"
        component={MDeliveryAgentManagement}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: " Delivery agent management",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="mdeliveryOrders"
        component={mdeliveryOrders}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: " all orders",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="McustomerAssistance"
        component={McustomerAssistance}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 20,
          },
          title: " Customer assistance",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="MonitorCustomerAssistance"
        component={MonitorCustomerAssistance}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 20,
          },
          title: "Track customer assistance",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="handleEscalatedIssues"
        component={handleEscalatedIssues}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 20,
          },
          title: " Escalated issues",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="MCustomerServicePerformance"
        component={MCustomerServicePerformance}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 20,
          },
          title: "Customer Service performance",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="ManageChannels"
        component={ManageChannels}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 20,
          },
          title: "Manage Chanals",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="ChannelOverview"
        component={ChannelOverview}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 20,
          },
          title: "Chanals Overview",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      {/* /////////////////////////////////////////////////////// */}
      <Authentic.Screen
        name="Pantryproducts"
        component={PantryproductsList}
        options={{
          headerShown: false,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 20,
          },
          title: "Pantry Essentials",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="Beveragesproducts"
        component={BeveragesproductsList}
        options={{
          headerShown: false,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 20,
          },
          title: "Beverage Food",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="Homepage"
        component={Homepage}
        options={({ navigation }) => ({
          headerShown: false,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 20,
          },
          title: "Home Page",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
          headerLeft: () => (
            <Ionicons
              name="menu"
              size={30}
              color="black"
              style={{ marginLeft: 15 }}
              onPress={() => navigation.openDrawer()} // Open sidebar/drawer
            />
          ),
          headerRight: () => (
            <Ionicons
              name="cart-outline"
              size={30}
              color="black"
              style={{ marginRight: 15 }}
              onPress={() => navigation.navigate("Cart")} // Navigate to Cart screen
            />
          ),
        })}
      />
    </Authentic.Navigator>
  );
}
