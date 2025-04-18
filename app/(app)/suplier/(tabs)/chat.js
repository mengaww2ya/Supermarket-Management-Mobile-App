import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput, FlatList } from 'react-native';
import { GiftedChat, Bubble, Send, SystemMessage } from 'react-native-gifted-chat';
import { FontAwesome, MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../../../firebase/firebaseConfig';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import ImageBubble from '../../../components/ImageBubble';

export default function Chat() {
    const router = useRouter();
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);
    const [chats, setChats] = useState([]);
    const [filteredChats, setFilteredChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'delivery', 'manager'

    // Auth state listener
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser({
                    _id: user.uid,
                    name: user.displayName || user.email,
                    avatar: user.photoURL,
                });
                fetchChats(user.uid);
            } else {
                setUser(null);
                setMessages([]);
                setChats([]);
                setFilteredChats([]);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Filter chats based on search query and active filter
    useEffect(() => {
        if (!chats.length) {
            setFilteredChats([]);
            return;
        }

        let result = [...chats];

        // Apply text search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(chat => {
                // Get the other participant's name
                const otherParticipantId = chat.participants.find(id => id !== user?._id);
                const participantName = chat.participantNames?.[otherParticipantId] || 'Customer';

                // Search in name or last message
                return (
                    participantName.toLowerCase().includes(query) ||
                    (chat.lastMessage?.text && chat.lastMessage.text.toLowerCase().includes(query))
                );
            });
        }

        // Apply role filter
        if (activeFilter !== 'all') {
            result = result.filter(chat => {
                const otherParticipantId = chat.participants.find(id => id !== user?._id);
                const participantRole = chat.participantRoles?.[otherParticipantId] || 'customer';
                return participantRole.toLowerCase() === activeFilter;
            });
        }

        setFilteredChats(result);
    }, [chats, searchQuery, activeFilter, user]);

    // Fetch active chats for supplier
    const fetchChats = async (userId) => {
        try {
            setLoading(true);
            const q = query(
                collection(db, 'chats'),
                where('participants', 'array-contains', userId)
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const chatData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    lastMessage: doc.data().lastMessage || { text: 'No messages yet', createdAt: new Date() }
                }));

                // Sort chats by last message timestamp
                chatData.sort((a, b) => {
                    const aTime = a.lastMessage?.createdAt?.toDate?.() || new Date(0);
                    const bTime = b.lastMessage?.createdAt?.toDate?.() || new Date(0);
                    return bTime - aTime;
                });

                setChats(chatData);
                setFilteredChats(chatData);
                setLoading(false);
            });

            return unsubscribe;
        } catch (err) {
            console.error('Error fetching chats:', err);
            setError('Failed to load chats');
            setLoading(false);
        }
    };

    // Load messages when a chat is selected
    useEffect(() => {
        if (!selectedChat) return;

        const q = query(
            collection(db, 'chats', selectedChat.id, 'messages'),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const messageData = snapshot.docs.map(doc => {
                const data = doc.data();
                const createdAt = data.createdAt?.toDate() || new Date();

                return {
                    _id: doc.id,
                    text: data.text,
                    createdAt,
                    image: data.image || null,
                    user: data.user,
                };
            });

            setMessages(messageData);
        });

        return unsubscribe;
    }, [selectedChat]);

    // Clear search query
    const handleClearSearch = () => {
        setSearchQuery('');
    };

    // Handle filter selection
    const handleFilterSelect = (filter) => {
        setActiveFilter(filter);
        setShowFilters(false);
    };

    // Navigate to New Chat page
    const handleNewChat = () => {
        router.push('/suplier/newChat');
    };

    // Send a message
    const onSend = useCallback(async (newMessages = []) => {
        if (!selectedChat || !user) return;

        const message = newMessages[0];

        try {
            const messageRef = collection(db, 'chats', selectedChat.id, 'messages');
            await addDoc(messageRef, {
                text: message.text,
                createdAt: serverTimestamp(),
                user: {
                    _id: user._id,
                    name: user.name,
                    avatar: user.avatar
                },
                image: message.image || null
            });

            // Update the last message in the chat document
            const chatRef = doc(db, 'chats', selectedChat.id);
            await updateDoc(chatRef, {
                lastMessage: {
                    text: message.text,
                    createdAt: serverTimestamp()
                }
            });
        } catch (error) {
            console.error('Error sending message:', error);
            setError('Failed to send message');
        }
    }, [selectedChat, user]);

    // Select a chat to view
    const handleChatSelect = (chat) => {
        setSelectedChat(chat);
    };

    // Back to chat list
    const handleBackToList = () => {
        setSelectedChat(null);
    };

    // Customize the bubbles
    const renderBubble = (props) => {
        return (
            <Bubble
                {...props}
                wrapperStyle={{
                    right: {
                        backgroundColor: '#3b82f6',
                    },
                    left: {
                        backgroundColor: '#e5e7eb',
                    },
                }}
                textStyle={{
                    right: {
                        color: '#ffffff',
                    },
                    left: {
                        color: '#000000',
                    },
                }}
            />
        );
    };

    // Customize the send button
    const renderSend = (props) => {
        return (
            <Send {...props}>
                <View style={styles.sendButton}>
                    <FontAwesome name="send" size={24} color="#3b82f6" />
                </View>
            </Send>
        );
    };

    // Render message image bubble
    const renderMessageImage = (props) => {
        return <ImageBubble {...props} />;
    };

    // Chat list item
    const renderChatItem = ({ item: chat }) => {
        // Get the other participant's name
        const otherParticipantId = chat.participants.find(id => id !== user?._id);
        const participantName = chat.participantNames?.[otherParticipantId] || 'Customer';
        const participantRole = chat.participantRoles?.[otherParticipantId] || 'customer';

        // Change avatar background color based on role
        let avatarBgColor = '#3b82f6'; // Default blue for customers
        if (participantRole === 'delivery') {
            avatarBgColor = '#10b981'; // Green for delivery agents
        } else if (participantRole === 'manager') {
            avatarBgColor = '#8b5cf6'; // Purple for managers
        }

        return (
            <TouchableOpacity
                key={chat.id}
                style={styles.chatItem}
                onPress={() => handleChatSelect(chat)}
            >
                <View style={[styles.chatAvatar, { backgroundColor: avatarBgColor }]}>
                    <Text style={styles.avatarText}>{participantName.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.chatInfo}>
                    <View style={styles.chatNameRow}>
                        <Text style={styles.chatName}>{participantName}</Text>
                        {participantRole !== 'customer' && (
                            <View style={[styles.roleBadge,
                            participantRole === 'delivery' ? styles.deliveryBadge : styles.managerBadge]}>
                                <Text style={styles.roleBadgeText}>
                                    {participantRole === 'delivery' ? 'Delivery' : 'Manager'}
                                </Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                        {chat.lastMessage.text}
                    </Text>
                </View>
                <Text style={styles.timestamp}>
                    {chat.lastMessage.createdAt?.toDate?.()
                        ? new Date(chat.lastMessage.createdAt.toDate()).toLocaleDateString()
                        : ''}
                </Text>
            </TouchableOpacity>
        );
    };

    // Render search and filter section
    const renderSearchBar = () => (
        <View style={styles.searchContainer}>
            <TouchableOpacity
                style={styles.newChatButton}
                onPress={handleNewChat}
            >
                <Feather name="message-square" size={18} color="#ffffff" />
                <Text style={styles.newChatButtonText}>New Chat</Text>
            </TouchableOpacity>

            <View style={styles.searchRow}>
                <View style={styles.searchInputWrapper}>
                    <Ionicons name="search-outline" size={20} color="#9ca3af" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search chats..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#9ca3af"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={handleClearSearch} style={styles.clearSearchButton}>
                            <Ionicons name="close-circle" size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setShowFilters(!showFilters)}
                >
                    <Ionicons
                        name={activeFilter !== 'all' ? "filter" : "filter-outline"}
                        size={22}
                        color={activeFilter !== 'all' ? "#3b82f6" : "#374151"}
                    />
                </TouchableOpacity>
            </View>

            {showFilters && (
                <View style={styles.filterDropdown}>
                    <TouchableOpacity
                        style={[styles.filterOption, activeFilter === 'all' && styles.activeFilterOption]}
                        onPress={() => handleFilterSelect('all')}
                    >
                        <Text style={[styles.filterOptionText, activeFilter === 'all' && styles.activeFilterText]}>
                            All Contacts
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterOption, activeFilter === 'delivery' && styles.activeFilterOption]}
                        onPress={() => handleFilterSelect('delivery')}
                    >
                        <Text style={[styles.filterOptionText, activeFilter === 'delivery' && styles.activeFilterText]}>
                            Delivery Agents
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.filterOption, activeFilter === 'manager' && styles.activeFilterOption]}
                        onPress={() => handleFilterSelect('manager')}
                    >
                        <Text style={[styles.filterOptionText, activeFilter === 'manager' && styles.activeFilterText]}>
                            Managers
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    // Empty state with search term
    const renderEmptyState = () => {
        // Different message if we have chats but none match the search/filter
        const hasChats = chats.length > 0;
        const message = hasChats
            ? `No ${activeFilter !== 'all' ? activeFilter + ' ' : ''}chats matching "${searchQuery}"`
            : 'No chats yet';
        const subtext = hasChats
            ? 'Try a different search term or filter'
            : 'When customers contact you, the chats will appear here';

        return (
            <View style={styles.emptyState}>
                <MaterialIcons name="chat-bubble-outline" size={60} color="#9ca3af" />
                <Text style={styles.emptyText}>{message}</Text>
                <Text style={styles.emptySubtext}>{subtext}</Text>

                {!hasChats && (
                    <TouchableOpacity
                        style={styles.emptyStateButton}
                        onPress={handleNewChat}
                    >
                        <Feather name="message-square" size={18} color="#ffffff" style={{ marginRight: 8 }} />
                        <Text style={styles.emptyStateButtonText}>Start New Chat</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#3b82f6" />
            </View>
        );
    }

    if (!user) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Please log in to access chats</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    // Show chat list if no chat is selected
    if (!selectedChat) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Chats</Text>
                </View>

                {renderSearchBar()}

                {filteredChats.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <FlatList
                        data={filteredChats}
                        renderItem={renderChatItem}
                        keyExtractor={item => item.id}
                        style={styles.chatList}
                    />
                )}
            </View>
        );
    }

    // Show selected chat
    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
        >
            <View style={styles.container}>
                <View style={styles.chatHeader}>
                    <TouchableOpacity onPress={handleBackToList} style={styles.backButton}>
                        <MaterialIcons name="arrow-back" size={24} color="#000" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>
                        {selectedChat.participantNames?.[
                            selectedChat.participants.find(id => id !== user?._id)
                        ] || 'Chat'}
                    </Text>
                </View>

                <GiftedChat
                    messages={messages}
                    onSend={onSend}
                    user={user}
                    renderBubble={renderBubble}
                    renderSend={renderSend}
                    renderMessageImage={renderMessageImage}
                    alwaysShowSend
                    scrollToBottom
                    renderAvatarOnTop
                    showUserAvatar
                    renderUsernameOnMessage
                    infiniteScroll
                />
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        height: 100,
        padding: 16,
        backgroundColor: '#ffffff',
        justifyContent: 'flex-end',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    chatHeader: {
        height: 100,
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingBottom: 16,
        paddingHorizontal: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    backButton: {
        marginRight: 16,
        alignSelf: 'center',
    },
    searchContainer: {
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        position: 'relative',
        zIndex: 10,
    },
    searchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 12,
    },
    searchInputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        borderRadius: 10,
        paddingHorizontal: 12,
        marginRight: 8,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 16,
        color: '#4b5563',
    },
    clearSearchButton: {
        padding: 4,
    },
    filterButton: {
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        height: 40,
        width: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    newChatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 12,
    },
    newChatButtonText: {
        color: '#ffffff',
        fontWeight: '600',
        marginLeft: 8,
        fontSize: 16,
    },
    filterDropdown: {
        position: 'absolute',
        top: 110,
        right: 16,
        width: 200,
        backgroundColor: '#ffffff',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        zIndex: 20,
    },
    filterOption: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    activeFilterOption: {
        backgroundColor: '#ebf5ff',
    },
    filterOptionText: {
        fontSize: 16,
        color: '#4b5563',
    },
    activeFilterText: {
        color: '#3b82f6',
        fontWeight: '600',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        color: '#4b5563',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 20,
    },
    emptyStateButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginTop: 16,
    },
    emptyStateButtonText: {
        color: '#ffffff',
        fontWeight: '600',
        fontSize: 16,
    },
    sendButton: {
        marginRight: 10,
        marginBottom: 5,
    },
    chatList: {
        flex: 1,
    },
    chatItem: {
        flexDirection: 'row',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        alignItems: 'center',
    },
    chatAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        color: '#ffffff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    chatInfo: {
        flex: 1,
    },
    chatNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    chatName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
    },
    roleBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 12,
        backgroundColor: '#e5e7eb',
    },
    deliveryBadge: {
        backgroundColor: '#d1fae5',
    },
    managerBadge: {
        backgroundColor: '#ede9fe',
    },
    roleBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#065f46',
    },
    lastMessage: {
        fontSize: 14,
        color: '#6b7280',
    },
    timestamp: {
        fontSize: 12,
        color: '#9ca3af',
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        textAlign: 'center',
        margin: 20,
    },
}); 