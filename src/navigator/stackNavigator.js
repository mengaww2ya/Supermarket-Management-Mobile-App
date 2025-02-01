import { TransitionPresets } from "@react-navigation/stack";
import Login from "../screans/login.js";
import Welcome from "../screans/welcome.js";
import Vegetable from "../customer/Vegetable.js";
import Fruit from "../customer/fruit.js";
import PckedFood from "../customer/packedFood.js";
import SoftDrink from "../customer/softDrink.js";
import Csmotics from "../customer/cosmotics.js";
import AlcholicDrink from "../customer/alcholicDrink.js";
import Item from "../customer/Item.js";
import Footer from "../subscrean/foter.js";
import Signup from "../screans/signup.js";
import ManagerHomePage from "../manager/managerHomePage.js";
import DeveloperHomePage from "../screans/developingHompage.js";  
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DrawNavigator from "../navigator/drawNavigator.js";
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
import acustomerManagement from "../admine/customerManagement.js"
const Authentic = createNativeStackNavigator();
export default function AuthicStackNavig() {
  return (
    <Authentic.Navigator>
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
        name="Homepage"
        component={DrawNavigator}
        options={{
          headerShown: false,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Home Page",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="Vegetable"
        component={Vegetable}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Vegateble",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="Fruit"
        component={Fruit}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Fruit",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="PckedFood"
        component={PckedFood}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Packed Food",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="SoftDrink"
        component={SoftDrink}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Soft Drink",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="Csmotics"
        component={Csmotics}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Cosmotics",
          ...TransitionPresets.RevealFromBottomAndroid,
          headerStyle: {
            backgroundColor: "#FFDC2B",
          },
        }}
      />
      <Authentic.Screen
        name="AlcholicDrink"
        component={AlcholicDrink}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Alcholic Drink",
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
        name="Footer"
        component={Footer}
        options={{
          headerShown: true,
          headerTitleStyle: {
            color: "#2ECE33",
            fontSize: 25,
          },
          title: "Detail",
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
          headerShown: true,
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
    </Authentic.Navigator>
  );
}
