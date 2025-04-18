import { Tabs } from "expo-router";
import { FontAwesome, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { View, TouchableOpacity, Text } from "react-native";

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        headerTitleAlign: "center", // Centers the title
        headerTitleStyle: {
          fontSize: 25,
          color: "red",
        },
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#6b7280",
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#e5e7eb",
          height: 60,
          paddingBottom: 5
        }
      }}
    >
      <Tabs.Screen
        name="suplierHomePage"
        options={{
          headerShown:false,
          title: "Home",
          tabBarIcon: ({ color }) => <FontAwesome size={24} name="home" color={color} />,
        }}
      />

      <Tabs.Screen
        name="categories"
        options={{
          headerShown:false,
          title: "Categories",
          tabBarIcon: ({ color }) => <MaterialCommunityIcons size={24} name="view-grid" color={color} />,
        }}
      />

      <Tabs.Screen
        name="chat"
        options={{
          headerShown:false,
          title: "Chat",
          tabBarIcon: ({ color }) => <Ionicons size={24} name="chatbubbles" color={color} />,
        }}
      />
    </Tabs>
  );
}
