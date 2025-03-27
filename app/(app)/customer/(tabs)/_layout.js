import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { View, TouchableOpacity, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
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
      <Tabs.Screen
        name="cart"
        options={{
          title: "Cart",
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="shopping-cart" color={color} />,
        }}
      />
    </Tabs>
  );
}
