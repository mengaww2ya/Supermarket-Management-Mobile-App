import { Tabs } from "expo-router";
import { FontAwesome } from "@expo/vector-icons";
import { View, TouchableOpacity ,Text } from "react-native";

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:false,
                headerTitleAlign: "center", // Centers the title
          headerTitleStyle:{
            fontSize:25,
            color:"blue",
          },
      }}
    >
      <Tabs.Screen
        name="homePage"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <FontAwesome size={28} name="home" color={color} />,
        }}
      />
    </Tabs>
  );
}
