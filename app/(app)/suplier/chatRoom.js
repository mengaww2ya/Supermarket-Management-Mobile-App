import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList,
    KeyboardAvoidingView, Platform, Image, ActivityIndicator,
    SafeAreaView, Alert, Animated, Keyboard
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, router } from 'expo-router';
import {
    collection, query, where, orderBy, onSnapshot, addDoc,
    serverTimestamp, doc, getDoc, updateDoc, Timestamp
} from 'firebase/firestore';
import { auth, db } from '../../../firebase/firebaseConfig';
import * as Haptics from 'expo-haptics';
import ChatItem from '../../components/ChatItem';

export default function ChatRoom() {
    const params = useLocalSearchParams();
    const { uid, name } = params;

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [userProfile, setUserProfile] = useState(null);
    const [typingStatus, setTypingStatus] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const typingTimeout = useRef(null);
    const flatListRef = useRef(null);
    const inputRef = useRef(null);
    const currentUser = auth.currentUser;
    const [scaleAnim] = useState(new Animated.Value(0));

    // Get user profile information
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const userDoc = await getDoc(doc(db, 'users', uid));
                if (userDoc.exists()) {
                    setUserProfile(userDoc.data());
                } else {
                    console.log('User profile not found');
                }
            } catch (error) {
                console.error('Error fetching user profile:', error);
            }
        };

        fetchUserProfile();
    }, [uid]);

    // Listen for messages in real-time
    useEffect(() => {
        if (!currentUser || !uid) return;

        setLoading(true);

        // Create chat room ID by combining user IDs in alphabetical order
        const roomId = [currentUser.uid, uid].sort().join('_');

        // Create a query for messages in this chat room, ordered by timestamp
        const q = query(
            collection(db, 'chatRooms', roomId, 'messages'),
            orderBy('timestamp', 'asc')
        );

        // Set up real-time listener
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const messagesData = [];
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                messagesData.push({
                    id: doc.id,
                    ...data,
                    timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
                });
            });

            setMessages(messagesData);
            setLoading(false);

            // Mark messages as read if they are not from current user
            markMessagesAsRead(roomId);

            // Scroll to bottom of message list
            if (messagesData.length > 0 && flatListRef.current) {
                setTimeout(() => {
                    flatListRef.current.scrollToEnd({ animated: true });
                }, 100);
            }
        });

        // Listen for typing status
        const typingRef = doc(db, 'chatRooms', roomId);
        const typingUnsubscribe = onSnapshot(typingRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                if (data[`${uid}_typing`]) {
                    setTypingStatus(true);

                    // Animate typing indicator
                    Animated.spring(scaleAnim, {
                        toValue: 1,
                        friction: 5,
                        tension: 40,
                        useNativeDriver: true,
                    }).start();
                } else {
                    setTypingStatus(false);

                    // Animate typing indicator out
                    Animated.timing(scaleAnim, {
                        toValue: 0,
                        duration: 200,
                        useNativeDriver: true,
                    }).start();
                }
            }
        });

        return () => {
            unsubscribe();
            typingUnsubscribe();

            // Clear any typing indicators when component unmounts
            if (typingTimeout.current) {
                clearTimeout(typingTimeout.current);
            }
        };
    }, [currentUser, uid]);

    const markMessagesAsRead = async (roomId) => {
        try {
            const q = query(
                collection(db, 'chatRooms', roomId, 'messages'),
                where('senderId', '==', uid),
                where('read', '==', false)
            );

            const querySnapshot = await getDocs(q);
            const batch = writeBatch(db);

            querySnapshot.forEach((doc) => {
                batch.update(doc.ref, { read: true });
            });

            if (!querySnapshot.empty) {
                await batch.commit();
            }
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    const handleSendMessage = async () => {
        if (newMessage.trim() === '') return;

        try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            // Create message content
            const messageText = newMessage.trim();
            setNewMessage('');

            // Create chat room ID
            const roomId = [currentUser.uid, uid].sort().join('_');

            // Add message to Firestore
            await addDoc(collection(db, 'chatRooms', roomId, 'messages'), {
                text: messageText,
                senderId: currentUser.uid,
                receiverId: uid,
                timestamp: serverTimestamp(),
                read: false,
                type: 'text'
            });

            // Update chat room last message
            await updateDoc(doc(db, 'chatRooms', roomId), {
                lastMessage: messageText,
                lastMessageTime: serverTimestamp(),
                [`${currentUser.uid}_hasUnread`]: false,
                [`${uid}_hasUnread`]: true,
                [`${currentUser.uid}_typing`]: false,
            });

            // Update user's chats collection to show this chat in their list
            await updateDoc(doc(db, 'users', currentUser.uid, 'chats', uid), {
                lastMessage: messageText,
                lastMessageTime: serverTimestamp(),
                hasUnread: false,
                displayName: userProfile?.displayName || userProfile?.name || name || 'User',
                photoURL: userProfile?.photoURL || null,
            });

            // Update recipient's chats collection
            await setDoc(doc(db, 'users', uid, 'chats', currentUser.uid), {
                lastMessage: messageText,
                lastMessageTime: serverTimestamp(),
                hasUnread: true,
                displayName: currentUser.displayName || currentUser.email,
                photoURL: currentUser.photoURL || null,
            }, { merge: true });

        } catch (error) {
            console.error('Error sending message:', error);
            Alert.alert('Error', 'Failed to send message. Please try again.');
        }
    };

    const handleInputFocus = () => {
        if (flatListRef.current && messages.length > 0) {
            setTimeout(() => {
                flatListRef.current.scrollToEnd({ animated: true });
            }, 100);
        }
    };

    const updateTypingStatus = (isTyping) => {
        const roomId = [currentUser.uid, uid].sort().join('_');

        // Clear any existing timeout
        if (typingTimeout.current) {
            clearTimeout(typingTimeout.current);
        }

        // Update typing status in Firestore
        if (isTyping) {
            updateDoc(doc(db, 'chatRooms', roomId), {
                [`${currentUser.uid}_typing`]: true
            });

            // Set timeout to clear typing status after 2 seconds of inactivity
            typingTimeout.current = setTimeout(() => {
                updateDoc(doc(db, 'chatRooms', roomId), {
                    [`${currentUser.uid}_typing`]: false
                });
            }, 2000);
        } else {
            updateDoc(doc(db, 'chatRooms', roomId), {
                [`${currentUser.uid}_typing`]: false
            });
        }
    };

    const handleInputChange = (text) => {
        setNewMessage(text);

        // Update typing status
        const isCurrentlyTyping = text.length > 0;
        if (isCurrentlyTyping !== isTyping) {
            setIsTyping(isCurrentlyTyping);
            updateTypingStatus(isCurrentlyTyping);
        }
    };

    // Render header with user info
    const renderHeader = () => {
        const avatarSource = userProfile?.photoURL
            ? { uri: userProfile.photoURL }
            : null;

        const getDisplayName = () => {
            if (userProfile?.name) return userProfile.name;
            if (userProfile?.fullName) return userProfile.fullName;
            if (userProfile?.firstName && userProfile?.lastName) {
                return `${userProfile.firstName} ${userProfile.lastName}`;
            }
            return name || 'User';
        };

        const getRoleLabel = () => {
            const role = userProfile?.role;

            if (!role) return 'User';

            switch (role) {
                case 'customer':
                    return 'Customer';
                case 'deliveryAgent':
                case 'delivery':
                    return 'Delivery Agent';
                case 'stockManager':
                case 'inventory':
                    return 'Stock Manager';
                case 'manager':
                case 'storeManager':
                    return 'Store Manager';
                default:
                    return role.charAt(0).toUpperCase() + role.slice(1);
            }
        };

        return (
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Feather name="arrow-left" size={24} color="#111827" />
                </TouchableOpacity>

                <View style={styles.userContainer}>
                    <View style={styles.avatarContainer}>
                        {avatarSource ? (
                            <Image source={avatarSource} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarText}>
                                    {getDisplayName().charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{getDisplayName()}</Text>
                        <Text style={styles.userRole}>{getRoleLabel()}</Text>
                    </View>
                </View>
            </View>
        );
    };

    // Render typing indicator
    const renderTypingIndicator = () => {
        if (!typingStatus) return null;

        return (
            <Animated.View
                style={[
                    styles.typingContainer,
                    {
                        transform: [{ scale: scaleAnim }],
                        opacity: scaleAnim
                    }
                ]}
            >
                <View style={styles.typingBubble}>
                    <View style={styles.typingDot} />
                    <View style={[styles.typingDot, { marginLeft: 4 }]} />
                    <View style={[styles.typingDot, { marginLeft: 4 }]} />
                </View>
                <Text style={styles.typingText}>typing...</Text>
            </Animated.View>
        );
    };

    // Render empty state
    const renderEmptyState = () => {
        if (loading) return null;

        return (
            <View style={styles.emptyContainer}>
                <View style={styles.emptyImageContainer}>
                    <Feather name="message-circle" size={80} color="#d1d5db" />
                </View>
                <Text style={styles.emptyTitle}>No messages yet</Text>
                <Text style={styles.emptyText}>
                    Send a message to start the conversation with {name || 'this user'}.
                </Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {renderHeader()}

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#4f46e5" />
                        <Text style={styles.loadingText}>Loading messages...</Text>
                    </View>
                ) : (
                    <FlatList
                        ref={flatListRef}
                        data={messages}
                        renderItem={({ item, index }) => (
                            <ChatItem
                                message={item}
                                isFromCurrentUser={item.senderId === currentUser?.uid}
                                showAvatar={
                                    index === 0 ||
                                    messages[index - 1].senderId !== item.senderId
                                }
                                userProfile={userProfile}
                            />
                        )}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.messageList}
                        ListEmptyComponent={renderEmptyState}
                    />
                )}

                {renderTypingIndicator()}

                <View style={styles.inputContainer}>
                    <TextInput
                        ref={inputRef}
                        style={styles.input}
                        placeholder="Type a message..."
                        value={newMessage}
                        onChangeText={handleInputChange}
                        onFocus={handleInputFocus}
                        multiline
                    />

                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            newMessage.trim() === '' && styles.sendButtonDisabled
                        ]}
                        onPress={handleSendMessage}
                        disabled={newMessage.trim() === ''}
                    >
                        <Feather
                            name="send"
                            size={20}
                            color={newMessage.trim() === '' ? '#9ca3af' : 'white'}
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        padding: 8,
        marginRight: 8,
    },
    userContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#4f46e5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    userRole: {
        fontSize: 12,
        color: '#6b7280',
    },
    keyboardView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6b7280',
    },
    messageList: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb',
    },
    input: {
        flex: 1,
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        maxHeight: 100,
        fontSize: 16,
    },
    sendButton: {
        backgroundColor: '#4f46e5',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 12,
    },
    sendButtonDisabled: {
        backgroundColor: '#e5e7eb',
    },
    typingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 24,
        marginBottom: 8,
    },
    typingBubble: {
        flexDirection: 'row',
        backgroundColor: '#e5e7eb',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
        alignItems: 'center',
        maxWidth: '70%',
    },
    typingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#9ca3af',
        marginRight: 2,
    },
    typingText: {
        fontSize: 12,
        color: '#6b7280',
        marginLeft: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyImageContainer: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: '#f3f4f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 20,
    },
}); 