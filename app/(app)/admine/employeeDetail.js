// app/ViewEmployees.js
import React, { useEffect, useState } from 'react';
import {
    SafeAreaView,
    Text,
    ActivityIndicator,
    FlatList,
    TouchableOpacity,
    Alert,
    Image,
    StyleSheet,
    View,
} from 'react-native';
import { db } from '../../../firebase/firebaseConfig'; // Ensure this path is correct
import { collection, getDocs } from 'firebase/firestore';

const roles = ['manager', 'stock_manager', 'delivery_agent', 'customer_assistance'];

const ViewEmployees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const allEmployees = [];

                for (const role of roles) {
                    const querySnapshot = await getDocs(collection(db, role));
                    const employeeList = querySnapshot.docs.map((doc) => ({
                        id: doc.id,
                        role: role,
                        ...doc.data(),
                    }));

                    allEmployees.push(...employeeList);
                }

                setEmployees(allEmployees);
            } catch (err) {
                console.error('Error fetching employee data:', err);
                setError('Error fetching employee data: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEmployees();
    }, []);

    const handleDelete = async (id, role) => {
        Alert.alert(
            'Delete Employee',
            'Are you sure you want to delete this employee?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, role, id));
                            Alert.alert('Success', 'Employee deleted successfully');
                            setEmployees(employees.filter((employee) => employee.id !== id));
                        } catch (err) {
                            console.error('Error deleting employee:', err);
                            Alert.alert('Error', 'Failed to delete employee');
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <ActivityIndicator size="large" color="#6200ee" />
            </SafeAreaView>
        );
    }

    if (error) {
        return (
            <SafeAreaView style={styles.container}>
                <Text style={styles.error}>{error}</Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>Employee List</Text>
            <FlatList
                data={employees}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.employeeItem}>
                        <View style={styles.profilePictureContainer}>
                            {/* Assuming you have a profilePicture field */}
                            {item.profilePicture ? (
                                <Image
                                    source={{ uri: item.profilePicture }} // Fetching from Firestore
                                    style={styles.profilePicture}
                                />
                            ) : (
                                <View style={styles.placeholderPicture} />
                            )}
                        </View>
                        <View style={styles.employeeDetails}>
                            <Text style={styles.employeeName}>{item.firstName} {item.lastName}</Text>
                            <Text>Email: {item.email}</Text>
                            <Text>Phone: {item.phone}</Text>
                            <Text>Role: {item.role}</Text>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDelete(item.id, item.role)}
                            >
                                <Text style={styles.buttonText}>Delete</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />
        </SafeAreaView>
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
    employeeItem: {
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
    employeeDetails: {
        flex: 1,
    },
    employeeName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#444',
    },
    deleteButton: {
        backgroundColor: '#f44336',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 5,
        marginTop: 10,
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

export default ViewEmployees;