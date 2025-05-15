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

        // Don't redirect if we're on the forgot password screen
        if (segments[1] === 'forgot-password') return;

        if (!isAuthenticated && !inAuthGroup) {
            // Redirect to login if not authenticated
            router.replace('/login');
        } else if (isAuthenticated && inAuthGroup) {
            // Redirect based on role if authenticated
            if (userData?.role === 'admin') {
                router.replace('/admine/(tabs)');
            } else if (userData?.role === 'customer') {
                router.replace('/customer/(tabs)');
            } else if (userData?.role === 'manager') {
                router.replace('/manager/(tabs)');
            } else if (userData?.role === 'deliveryAgent') {
                router.replace('/deliveryAgent/(tabs)');
            } else if (userData?.role === 'stockManager') {
                router.replace('/stockManager/(tabs)');
            } else if (userData?.role === 'customerAssistance') {
                router.replace('/customeAssistance/(tabs)');
            } else if (userData?.role === 'supplier') {
                router.replace('/suplier/(tabs)');
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