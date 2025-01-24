import { TransitionPresets } from "@react-navigation/stack";
import Login from "../screans/login.js";
import Welcome from "../screans/welcome.js";
import Homepage from "../screans/homepage.js";
import Vegetable from "../screans/Vegetable.js";
import Fruit from "../screans/fruit.js";
import PckedFood from "../screans/packedFood.js";
import SoftDrink from "../screans/softDrink.js";
import Csmotics from "../screans/cosmotics.js";
import AlcholicDrink from "../screans/alcholicDrink.js";
import Item from "../screans/Item.js";
import Footer from "../subscrean/foter.js";
import Signup from "../screans/signup.js";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DrawNavigator from "../navigator/drawNavigator.js"
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
    </Authentic.Navigator>
  );
}
