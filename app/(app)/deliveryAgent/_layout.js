import { Stack } from "expo-router";
import { TouchableOpacity, Text, Alert } from "react-native";
import React from 'react';
import { useAuth } from '../../context/authContext';
import { useRouter } from 'expo-router';

export default function DeliveryAgentLayout() {
  const { userData } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!userData?.uid || userData.role !== 'deliveryAgent') {
      Alert.alert('Access Denied', 'You do not have permission to access this area.');
      router.replace('/(auth)/login');
    }
  }, [userData?.uid, userData?.role]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTintColor: '#4f46e5',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen 
        name="(tabs)" 
        options={{ 
          headerShown: false 
        }} 
      />
      <Stack.Screen
        name="systemChat"
        options={{
          title: 'System Chat',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="Assigned_deliveries_list"
        options={{
          title: 'Assigned Deliveries',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="completed_order"
        options={{
          title: 'Completed Orders',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Inprogress_Orders"
        options={{
          title: 'In Progress Orders',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
