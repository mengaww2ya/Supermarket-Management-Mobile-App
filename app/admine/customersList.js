import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { db } from '../../firebaseConfig';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';

const CustomerList = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'customers'));
                const customerList = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setCustomers(customerList);
            } catch (err) {
                console.error('Error fetching customer data:', err);
                setError('Error fetching customer data: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCustomers();
    }, []);

    const handleDelete = async (id) => {
        Alert.alert(
            'Delete Customer',
            'Are you sure you want to delete this customer?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'customers', id));
                            Alert.alert('Success', 'Customer deleted successfully');
                            setCustomers(customers.filter((customer) => customer.id !== id));
                        } catch (err) {
                            console.error('Error deleting customer:', err);
                            Alert.alert('Error', 'Failed to delete customer');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return <ActivityIndicator size="large" color="#6200ee" />;
    }

    if (error) {
        return <Text style={styles.error}>{error}</Text>;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Customer List</Text>
            <FlatList
                data={customers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.customerItem}>
                        <View style={styles.profilePictureContainer}>
                            {item.profilePicture ? (
                                <Image
                                    source={{ uri: item.profilePicture }} // Fetching from Firestore
                                    style={styles.profilePicture}
                                />
                            ) : (
                                <View style={styles.placeholderPicture} />
                            )}
                        </View>
                        <View style={styles.customerDetails}>
                            <Text style={styles.customerName}>{item.firstName} {item.lastName}</Text>
                            <Text>Email: {item.email}</Text>
                            <Text>Phone: {item.phone}</Text>
                            <Text>Address: {item.address}</Text>
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={styles.deleteButton}
                                    onPress={() => handleDelete(item.id)}
                                >
                                    <Text style={styles.buttonText}>Delete</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f4f4f8',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#333',
        textAlign: 'center',
    },
    customerItem: {
        marginBottom: 15,
        padding: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        backgroundColor: '#fff',
        elevation: 2,
        flexDirection: 'row',
    },
    profilePictureContainer: {
        marginRight: 10,
    },
    profilePicture: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    placeholderPicture: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#ccc',
    },
    customerDetails: {
        flex: 1,
    },
    customerName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#444',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
    },
    deleteButton: {
        backgroundColor: '#f44336',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    error: {
        color: 'red',
        textAlign: 'center',
        marginTop: 20,
        fontSize: 18,
    },
});

export default CustomerList;