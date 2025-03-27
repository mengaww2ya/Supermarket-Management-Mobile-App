import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { View, TouchableOpacity, Text } from "react-native";

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
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
        name="message"
        options={{
          title: "Help",
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="question-circle" color={color} />,
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
