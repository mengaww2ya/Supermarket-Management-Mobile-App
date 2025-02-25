import { Stack } from "expo-router";
import { TouchableOpacity,Text } from "react-native";
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function Layout(){
    return(
   <Stack screenOptions={{
        headerShown: false,
                headerTitleAlign: "center", // Centers the title
          headerTitleStyle:{
            fontSize:25,
            color:"blue",
          },
      }}>
    <Stack.Screen  name="(tabs)"  options={{
headerShown:false
    }} />
   </Stack>
    );
}