import { createStackNavigator, TransitionPresets } from "@react-navigation/stack";
import Login from '../screans/login.js';
import Welcome from '../screans/welcome.js';
import Homepage from "../screans/homepage.js";
const Authentic=createStackNavigator();
export default function AuthicStackNavig(){
    return(
        <Authentic.Navigator>
        <Authentic.Screen
        name="Welcome"
        component={Welcome}
        options={{
            headerShown:false,
        ...TransitionPresets.RevealFromBottomAndroid
        }}
        />
         <Authentic.Screen
        name="Login"
        component={Login}
        options={{
            headerShown:false,
        ...TransitionPresets.RevealFromBottomAndroid
        }}
        />
        <Authentic.Screen
        name="Homepage"
        component={Homepage}
        options={{
            headerShown:false,
        ...TransitionPresets.RevealFromBottomAndroid
        }}
        />
        </Authentic.Navigator>
    );
}