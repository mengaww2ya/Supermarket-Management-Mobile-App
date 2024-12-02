import {TransitionPresets } from "@react-navigation/stack";
 import Login from '../screans/login.js';
import Welcome from '../screans/welcome.js';
import Homepage from "../screans/homepage.js";
import {createNativeStackNavigator} from "@react-navigation/native-stack"
const Authentic=createNativeStackNavigator();
export default function AuthicStackNavig(){
    return(
             <Authentic.Navigator initialRouteName='Welcome'>
      <Authentic.Screen name='Welcome' component={Welcome} 
      options={{headerShown:false,
      ...TransitionPresets.RevealFromBottomAndroid

      }}
/>
      <Authentic.Screen name='Login' component={Login}
      options={{headerShown:false,
      ...TransitionPresets.RevealFromBottomAndroid

      }} />
      <Authentic.Screen name='Homepage' component={Homepage} 
      options={{headerShown:false,
      ...TransitionPresets.RevealFromBottomAndroid

      }}/>
    </Authentic.Navigator>
    );
}