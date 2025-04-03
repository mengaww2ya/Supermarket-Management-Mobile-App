import React, { useState, useEffect } from 'react';
import { View, FlatList, TextInput, Button, StyleSheet, Text } from 'react-native';
import { db } from '../../../firebase/firebaseConfig'; // Adjust the path as necessary
import { collection, onSnapshot, addDoc } from 'firebase/firestore';

const ChatDetail = ({ route }) => {
    const { customerId } = route.params; // Get the customerId from route params
    const [messages, setMessages] = useState([]);
    const [responseText, setResponseText] = useState('');

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, `customers/${customerId}/supportChats`), (snapshot) => {
            const messagesData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(messagesData);
        }, (error) => {
            console.error("Error fetching chat messages: ", error);
        });

        return () => unsubscribe(); // Clean up the listener on unmount
    }, [customerId]);

    const sendResponse = async () => {
        if (responseText.trim()) {
            const responseMessage = {
                message: responseText,
                customerId: customerId, // Store the customer ID with the message
                sender: 'support', // You can modify this based on your logic
                timestamp: new Date(),
            };
            try {
                await addDoc(collection(db, `customers/${customerId}/supportChats`), responseMessage);
                setResponseText(''); // Clear the input after sending
            } catch (error) {
                console.error("Error adding document: ", error);
            }
        }
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={item.sender === 'support' ? styles.managerMessage : styles.customerMessage}>
                        <Text style={styles.messageText}>{item.message}</Text>
                    </View>
                )}
            />
            <TextInput
                style={styles.input}
                value={responseText}
                onChangeText={setResponseText}
                placeholder="Type your response..."
            />
            <Button title="Send Response" onPress={sendResponse} />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, padding: 10, backgroundColor: '#FFFFFF' },
    customerMessage: {
        backgroundColor: '#e0f7fa',
        padding: 10,
        borderRadius: 10,
        marginVertical: 5,
        alignSelf: 'flex-end',
        maxWidth: '70%',
    },
    managerMessage: {
        backgroundColor: '#c8e6c9',
        padding: 10,
        borderRadius: 10,
        marginVertical: 5,
        alignSelf: 'flex-start',
        maxWidth: '70%',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    messageText: {
        fontSize: 14,
        color: '#000',
    },
});

export default ChatDetail;