import { Stack } from "expo-router";
import { TouchableOpacity,Text } from "react-native";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React from 'react';
import { useAuth } from '../../context/authContext';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

export default function ManagerLayout() {
    const { userData } = useAuth();
    const router = useRouter();

    React.useEffect(() => {
        if (!userData?.uid || (userData.role !== 'manager' && userData.role !== 'admin')) {
            Alert.alert('Access Denied', 'You do not have permission to access this area.');
            router.replace('/(auth)/login');
        }
    }, [userData?.uid, userData?.role]);

    return (
        <Stack
            screenOptions={{
                headerShown:false,
                headerStyle: {
                    backgroundColor: '#ffffff',
                },
                headerTintColor: '#4f46e5',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Stack.Screen
                name="(tabs)"
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="systemChat"
                options={{
                    title: 'System Messaging',
                    headerTitleAlign: 'center',
                }}
            />
            <Stack.Screen
                name="suplierManagement"
                options={{
                    title: 'Supplier Management',
                    headerTitleAlign: 'center',
                }}
            />
            <Stack.Screen
                name="orderManagement"
                options={{
                    title: 'Order Management',
                    headerTitleAlign: 'center',
                }}
            />
            <Stack.Screen
                name="HandlingEscalatedIssues"
                options={{
                    title: 'Escalated Issues',
                    headerTitleAlign: 'center',
                }}
            />
            <Stack.Screen
                name="discounts/DiscountDashboard"
                options={{
                    title: 'Promotions & Discounts',
                    headerTitleAlign: 'center',
                }}
            />
            <Stack.Screen
                name="discounts/CreateDiscount"
                options={{
                    title: 'Create Discount',
                    headerTitleAlign: 'center',
                }}
            />
            <Stack.Screen
                name="discounts/ViewDiscounts"
                options={{
                    title: 'View Discounts',
                    headerTitleAlign: 'center',
                }}
            />
            <Stack.Screen
                name="discounts/DiscountAnalytics"
                options={{
                    title: 'Discount Analytics',
                    headerTitleAlign: 'center',
                }}
            />
            <Stack.Screen
                name="discounts/DiscountedOrders"
                options={{
                    title: 'Discounted Orders',
                    headerTitleAlign: 'center',
                }}
            />
        </Stack>
    );
}