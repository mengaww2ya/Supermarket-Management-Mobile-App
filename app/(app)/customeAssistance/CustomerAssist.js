import React, { useEffect, useState } from 'react';
import { View, FlatList, Text, Button, StyleSheet } from 'react-native';
import { db } from '../../../firebase/firebaseConfig'; // Adjust the path as necessary
import { collection, onSnapshot } from 'firebase/firestore';

const CustomerAssist = ({ navigation }) => {
    const [customers, setCustomers] = useState([]);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'customers'), (snapshot) => {
            const customersData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCustomers(customersData);
        }, (error) => {
            console.error("Error fetching customers: ", error);
        });

        return () => unsubscribe(); // Clean up the listener on unmount
    }, []);

    const navigateToChat = (customerId) => {
        navigation.navigate('ChatDetail', { customerId });
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={customers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.customerItem}>
                        <Text style={styles.customerName}>{item.name}</Text>
                        <Button title="Chat" onPress={() => navigateToChat(item.id)} />
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10, backgroundColor: '#FFFFFF' },
    customerItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    customerName: {
        fontSize: 18,
    },
});

export default CustomerAssist;