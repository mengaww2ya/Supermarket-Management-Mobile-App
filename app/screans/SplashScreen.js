import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const SplashScreen = () => {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace('/screans/scro'); // Navigating to scro page
        }, 4000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <View style={styles.container}>
            <MaterialIcons name="shopping-cart" size={100} color="white" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFDC2B',
    },
});

export default SplashScreen;