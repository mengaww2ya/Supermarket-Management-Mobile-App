import { TransitionPresets } from "@react-navigation/stack";
import Login from "../screans/login.js";
import Welcome from "../screans/welcome.js";
import Homepage from "../customer/homepage.js";
import Vegetable from "../customer/Vegetable.js";
import Fruit from "../customer/fruit.js";
import PckedFood from "../customer/packedFood.js";
import SoftDrink from "../customer/softDrink.js";
import Csmotics from "../customer/cosmotics.js";
import AlcholicDrink from "../customer/alcholicDrink.js";
import Item from "../customer/Item.js";
import Footer from "../subscrean/foter.js";
import Signup from "../screans/signup.js";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
const drawNavig = createDrawerNavigator();
export default function DrawNavigator() {
  return (
    <drawNavig.Navigator initialRouteName="Homepage">
      {/* <drawNavig.Screen
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
      /> */}
      {/* <drawNavig.Screen
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
      /> */}
      <drawNavig.Screen
        name="Homepage"
        component={Homepage}
        options={{
          headerShown: true,
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
      <drawNavig.Screen
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
      <drawNavig.Screen
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
      <drawNavig.Screen
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
      <drawNavig.Screen
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
      <drawNavig.Screen
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
      <drawNavig.Screen
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
      {/* <drawNavig.Screen
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
      /> */}
      {/* <drawNavig.Screen
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
      /> */}
      {/* <drawNavig.Screen
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
      /> */}
    </drawNavig.Navigator>
  );
}
