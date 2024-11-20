import { createStackNavigator, TransitionPresets } from "@react-navigation/stack";
import Login from '../screans/login.js';
import Welcome from '../screans/welcome.js';
import Homepage from "../screans/homepage.js";
const authentic=createStackNavigator();
export default function AuthicStackNavig(){
    return(
        <authentic.Navigator>
        <authentic.Screen
        name="Welcome"
        component={Welcome}
        options={{
            headerShown:false,
        ...TransitionPresets.RevealFromBottomAndroid
        }}
        />
         <authentic.Screen
        name="Login"
        component={Login}
        options={{
            headerShown:false,
        ...TransitionPresets.RevealFromBottomAndroid
        }}
        />
        <authentic.Screen
        name="Homepage"
        component={Homepage}
        options={{
            headerShown:false,
        ...TransitionPresets.RevealFromBottomAndroid
        }}
        />
        </authentic.Navigator>
    );
}