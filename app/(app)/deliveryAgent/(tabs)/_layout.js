import { Tabs } from "expo-router";
import { Ionicons, Feather } from "@expo/vector-icons";

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#007bff",
        tabBarInactiveTintColor: "gray",
        tabBarStyle: { backgroundColor: "white", paddingBottom: 5, height: 60 },
      }}
    >
      {/* Home Tab */}
      <Tabs.Screen
        name="homePage"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      
      {/* Messages Tab */}
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, size }) => <Feather name="message-circle" size={size} color={color} />,
          tabBarBadge: 0, // This will be dynamic in a real app
        }}
      />
    </Tabs>
  );
}
