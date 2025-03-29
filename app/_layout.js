import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import AuthContextProvider, { useAuth } from './context/authContext';
import '../global.css';

const MainLayout = () => {
    const router = useRouter();
    const { isAuthenticated, userData, loading } = useAuth();
    const segments = useSegments();

    useEffect(() => {
        if (loading || typeof isAuthenticated === 'undefined' || !segments.length) return;

        const inAuthGroup = segments[0] === '(auth)';
        const inAppGroup = segments[0] === '(app)';

        if (!isAuthenticated && !inAuthGroup) {
            // Redirect to login if not authenticated
            router.replace('/login');
        } else if (isAuthenticated && inAuthGroup) {
            // Redirect based on role if authenticated
            if (userData?.role === 'admin') {
                router.replace('/admine/(tabs)');
            } else if (userData?.role === 'customer') {
                router.replace('/customer/homepage');
            } else if (userData?.role === 'manager') {
                router.replace('/manager/(tabs)');
            } else if (userData?.role === 'deliveryAgent') {
                router.replace('/deliveryAgent/(tabs)');
            } else if (userData?.role === 'stockManager') {
                router.replace('/stockManager/(tabs)');
            } else if (userData?.role === 'customerAssistance') {
                router.replace('/customeAssistance/(tabs)');
            }
        }
    }, [isAuthenticated, userData, segments, loading]);

    return (
        <Stack screenOptions={{ headerShown: false }} />
    );
};

export default function RootLayout() {
    return (
        <AuthContextProvider>
            <MainLayout />
        </AuthContextProvider>
    );
}