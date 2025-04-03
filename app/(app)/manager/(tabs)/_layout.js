import { Tabs } from "expo-router";
import { View, TouchableOpacity, Text, useColorScheme } from "react-native";
import { useRouter } from 'expo-router';
import { FontAwesome, Feather, MaterialIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon({ name, color }) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} name={name} color={color} />;
}

export default function Layout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  const openSystemChat = () => {
    router.push('/manager/systemChat');
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        headerTitleAlign: "center",
        headerTitleStyle: {
          fontSize: 25,
          color: "blue",
        },
        tabBarActiveTintColor: '#4f46e5',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          paddingTop: 5,
          paddingBottom: 5
        },
        tabBarLabelStyle: {
          fontSize: 11
        }
      }}
    >
      <Tabs.Screen
        name="managerHomePage"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} />,
          headerRight: () => (
            <TouchableOpacity 
              style={{ marginRight: 15 }}
              onPress={openSystemChat}
            >
              <Ionicons name="chatbox-ellipses" size={24} color="#4f46e5" />
            </TouchableOpacity>
          ),
        }}
      />

      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color }) => <Feather name="package" size={22} color={color} />,
          headerRight: () => (
            <TouchableOpacity 
              style={{ marginRight: 15 }}
              onPress={openSystemChat}
            >
              <Ionicons name="chatbox-ellipses" size={24} color="#4f46e5" />
            </TouchableOpacity>
          ),
        }}
      />

      <Tabs.Screen
        name="customers"
        options={{
          title: 'Customers',
          tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} />,
          headerRight: () => (
            <TouchableOpacity 
              style={{ marginRight: 15 }}
              onPress={openSystemChat}
            >
              <Ionicons name="chatbox-ellipses" size={24} color="#4f46e5" />
            </TouchableOpacity>
          ),
        }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <Feather name="message-circle" size={22} color={color} />,
          tabBarBadge: 3,
          tabBarBadgeStyle: { backgroundColor: '#ef4444' },
          headerRight: () => (
            <TouchableOpacity 
              style={{ marginRight: 15 }}
              onPress={openSystemChat}
            >
              <Ionicons name="chatbox-ellipses" size={24} color="#4f46e5" />
            </TouchableOpacity>
          ),
        }}
      />
    </Tabs>
  );
}
