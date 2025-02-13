import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons'; // Import the cart icon

const SplashScreen = ({ navigation }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            navigation.replace('Splashscreen');
        }, 8000);

        return () => clearTimeout(timer);
    }, [navigation]);

    return (
        <View style={styles.container}>
            <MaterialIcons name="shopping-cart" size={100} color="green" />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white', // Dark Green Color
    },
});

export default SplashScreen;
