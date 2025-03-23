import { enableScreens } from 'react-native-screens';
import { Tabs } from "expo-router";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { View, TouchableOpacity, Text, Platform } from "react-native";
import HomeHeader from "../../../components/HomeHeader";
if (Platform .OS === 'android') {
    enableScreens();
}
export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        headerTitleAlign: "center", // Centers the title
        headerTitleStyle: {
          fontSize: 25,
          color: "blue",
        },
        headerLeft: () => (
          <TouchableOpacity style={{ marginLeft: 15 }}>
            <FontAwesome name="bars" size={24} color="blue" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <View className="flex-row">
          <TouchableOpacity style={{ marginRight: 15 }} className="flex-row">
            <FontAwesome className="color-blue-600" name="shopping-cart" size={30} />
            <Text className="text-red-600 font-bold text-4xl">0</Text>
          </TouchableOpacity>
               </View>
                  
             
        ),
      }}
    >
      <Tabs.Screen
        name="homepage"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="EditProfile"
        options={{
          title: "profile",
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="user" color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "chat",
          tabBarIcon: ({ color }) => <MaterialIcons size={28} name="chat" color={color} />,
        }}
      />
    </Tabs>
  );
}
