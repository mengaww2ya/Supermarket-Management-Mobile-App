import React, { useState, useEffect } from 'react';
import { View, FlatList, TextInput, Button, StyleSheet, Text } from 'react-native';
import { db } from '../../../firebaseConfig';
import { collection, addDoc, onSnapshot } from 'firebase/firestore';
import { auth } from '../../../firebaseConfig';

const ChatScreen = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const userId = auth.currentUser.uid;

    const sendMessage = async () => {
        if (input.trim()) {
            const newMessage = {
                text: input,
                sender: 'customer',
                timestamp: new Date(),
            };
            const messageRef = collection(db, 'customers', userId, 'supportChats');
            try {
                await addDoc(messageRef, newMessage);
                setInput('');
            } catch (error) {
                console.error("Error sending message:", error);
            }
        } else {
            console.warn("Input is empty. Message not sent.");
        }
    };

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'customers', userId, 'supportChats'), (snapshot) => {
            const messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setMessages(messagesData);
        });

        return () => unsubscribe();
    }, [userId]);

    return (
        <View style={styles.container}>
            <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={item.sender === 'customer' ? styles.customerMessage : styles.managerMessage}>
                        <Text style={styles.messageText}>{item.text}</Text>
                    </View>
                )}
            />
            <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="Type your message..."
            />
            <Button title="Send" onPress={sendMessage} />
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
        marginBottom: 10
    },
    messageText: {
        fontSize: 14,
        color: '#000'
    },
});

export default ChatScreen;