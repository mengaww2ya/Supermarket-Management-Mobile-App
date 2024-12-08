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
const Authentic = createNativeStackNavigator();
export default function AuthicStackNavig() {
  return (
    <Authentic.Navigator initialRouteName="Welcome">
      <Authentic.Screen
        name="Welcome"
        component={Welcome}
        options={{
          headerShown: false,
          ...TransitionPresets.RevealFromBottomAndroid,
        }}
      />
      <Authentic.Screen
        name="Login"
        component={Login}
        options={{
          headerShown: false,
          ...TransitionPresets.RevealFromBottomAndroid,
        }}
      />
      <Authentic.Screen
        name="Homepage"
        component={Homepage}
        options={{
          headerShown: false,
          ...TransitionPresets.RevealFromBottomAndroid,
        }}
      />
      <Authentic.Screen
        name="Vegetable"
        component={Vegetable}
        options={{
          headerShown: true,
          ...TransitionPresets.RevealFromBottomAndroid,
        }}
      />
      <Authentic.Screen
        name="Fruit"
        component={Fruit}
        options={{
          headerShown: true,
          ...TransitionPresets.RevealFromBottomAndroid,
        }}
      />
      <Authentic.Screen
        name="PckedFood"
        component={PckedFood}
        options={{
          headerShown: true,
          ...TransitionPresets.RevealFromBottomAndroid,
        }}
      />
      <Authentic.Screen
        name="SoftDrink"
        component={SoftDrink}
        options={{
          headerShown: true,
          ...TransitionPresets.RevealFromBottomAndroid,
        }}
      />
      <Authentic.Screen
        name="Csmotics"
        component={Csmotics}
        options={{
          headerShown: true,
          ...TransitionPresets.RevealFromBottomAndroid,
        }}
      />
      <Authentic.Screen
        name="AlcholicDrink"
        component={AlcholicDrink}
        options={{
          headerShown: true,
          ...TransitionPresets.RevealFromBottomAndroid,
        }}
      />
      <Authentic.Screen
        name="Item"
        component={Item}
        options={{
          headerShown: true,
          ...TransitionPresets.RevealFromBottomAndroid,
        }}
      />
      <Authentic.Screen
        name="Footer"
        component={Footer}
        options={{
          headerShown: false,
          ...TransitionPresets.RevealFromBottomAndroid,
        }}
      />
      <Authentic.Screen
        name="Signup"
        component={Signup}
        options={{
          headerShown: false,
          ...TransitionPresets.RevealFromBottomAndroid,
        }}
      />
    </Authentic.Navigator>
  );
}
