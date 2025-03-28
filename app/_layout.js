import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import AuthContextProvider, { useAuth } from './context/authContext';
import '../global.css';

const MainLayout = () => {
    const router = useRouter();
    const { isAuthenticated, user, loading } = useAuth();
    const segments = useSegments();

    const rolePaths = {
        customer: '/(app)/customer/(tabs)',
        manager: '/(app)/manager/(tabs)',
        stockManager: '/(app)/stockManager/(tabs)',
        deliveryAgent: '/(app)/deliveryAgent/(tabs)',
        admin: '/(app)/admine/(tabs)',
        customerAssistance: '/(app)/customeAssistance/(tabs)',
        suplier: '/(app)/suplier/(tabs)'
    };

    useEffect(() => {
        if (loading || typeof isAuthenticated === 'undefined' || !segments.length) return;

        const inApp = segments[0] === '(app)';
        const isAuthPage = segments[0] === '(auth)' && (segments[1] === 'login' || segments[1] === 'signup');

        if (isAuthenticated) {
            const userRole = user?.role;

            if (!inApp && userRole in rolePaths) {
                router.replace(rolePaths[userRole]);
            }
        } else if (!isAuthPage) {
            router.replace('/(auth)/login');
        }
    }, [isAuthenticated, user, segments, loading]);

    return (
        <Stack screenOptions={{ headerShown: false }} />
    );
};

export default function _layout() {
    return (
        <AuthContextProvider>  
            <MainLayout />
        </AuthContextProvider>
    );
}