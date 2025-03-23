import { enableScreens } from 'react-native-screens';
import { Stack } from "expo-router";
import { TouchableOpacity,Text, Platform } from "react-native";
import FontAwesome from '@expo/vector-icons/FontAwesome';
if (Platform .OS === 'android') {
    enableScreens();
}
export default function Layout(){
    return(
   <Stack screenOptions={{
        headerShown: false,
                headerTitleAlign: "center", // Centers the title
          headerTitleStyle:{
            fontSize:25,
            color:"blue",
          },
        headerLeft: () => (
          <TouchableOpacity style={{ marginLeft: 15 }}>
            <FontAwesome name="bars" size={30} color="blue" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity style={{ marginRight: 15 }} className="flex-row">
            <FontAwesome className="color-blue-600" name="shopping-cart" size={30}  />
            <Text className="text-red-600 font-bold text-4xl">0</Text>
          </TouchableOpacity>
        ),
      }}>
    <Stack.Screen  name="(tabs)"  options={{
headerShown:false
    }} />
   </Stack>
    );
}