import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput, FlatList } from 'react-native';
import { GiftedChat, Bubble, Send, SystemMessage } from 'react-native-gifted-chat';
import { FontAwesome, MaterialIcons, Ionicons, Feather } from '@expo/vector-icons';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../../../firebase/firebaseConfig';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import ImageBubble from '../../../components/ImageBubble';
import HomeHeader from '../../../components/HomeHeader';

// Role definitions with colors and icons
const roleConfig = {
    customer: {
        color: '#3b82f6', // Blue
        bgColor: '#dbeafe',
        icon: 'person',
        label: 'Customer'
    },
    customerAssistance: {
        color: '#f59e0b', // Amber
        bgColor: '#fef3c7',
        icon: 'people',
        label: 'Customer Assistance'
    },
    deliveryAgent: {
        color: '#10b981', // Green
        bgColor: '#d1fae5',
        icon: 'bicycle',
        label: 'Delivery'
    },
    manager: {
        color: '#8b5cf6', // Purple
        bgColor: '#ede9fe',
        icon: 'business',
        label: 'Manager'
    },
    stockManager: {
        color: '#0891b2', // Cyan
        bgColor: '#cffafe',
        icon: 'cube',
        label: 'Stock Manager'
    },
    supplier: {
        color: '#f43f5e', // Rose
        bgColor: '#ffe4e6',
        icon: 'cart',
        label: 'Supplier'
    }
};

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
    const [participantDetails, setParticipantDetails] = useState({});

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

                // Map the DB roles to the filter categories
                const roleMapping = {
                    'deliveryAgent': 'delivery',
                    'manager': 'manager',
                    'stockManager': 'manager',
                    'customerAssistance': 'customer'
                };

                const mappedRole = roleMapping[participantRole] || 'customer';
                return mappedRole === activeFilter;
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

            const unsubscribe = onSnapshot(q, async (snapshot) => {
                console.log(`Got ${snapshot.docs.length} chats`);

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

                // Fetch additional details for each participant
                const participants = {};

                // Extract all unique participant IDs
                const participantIds = new Set();
                chatData.forEach(chat => {
                    chat.participants.forEach(id => {
                        if (id !== userId) {
                            participantIds.add(id);
                        }
                    });
                });

                console.log(`Found ${participantIds.size} unique participants to fetch details for`);

                // Fetch user details for each participant
                for (const participantId of participantIds) {
                    try {
                        console.log(`Fetching details for user ${participantId}`);
                        const userDoc = await getDoc(doc(db, 'users', participantId));

                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            console.log(`Got user data for ${participantId}:`,
                                userData.name || 'No name field',
                                userData.firstName || 'No firstName',
                                userData.lastName || 'No lastName',
                                userData.email || 'No email'
                            );
                            participants[participantId] = userData;
                        } else {
                            console.log(`No user document exists for ID ${participantId}`);
                        }
                    } catch (error) {
                        console.error(`Error fetching details for user ${participantId}:`, error);
                    }
                }

                console.log('Setting participant details:', participants);
                setParticipantDetails(participants);
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

    // Select a chat to view
    const handleChatSelect = (chat) => {
        // Get the other participant's ID
        const otherParticipantId = chat.participants.find(id => id !== user?._id);

        // Get participant info
        const participantName = getDisplayName(otherParticipantId, chat);

        // Navigate to our local chatRoom redirector which will then go to the common chatRoom
        console.log(`Navigating to chat with ${participantName} (${otherParticipantId})`);
        router.push(`/(app)/chatRoom?uid=${otherParticipantId}&name=${encodeURIComponent(participantName)}&chatId=${chat.id}`);
    };

    // Get display name from user data
    const getDisplayName = (userId, chat) => {
        console.log(`Getting display name for user ID: ${userId}`);

        // First try from the chat's participantNames
        const nameFromChat = chat.participantNames?.[userId];
        console.log(`Name from chat: ${nameFromChat}`);

        // If we have fetched user details, try to get the name
        const userData = participantDetails[userId];
        console.log(`User data from participantDetails:`, userData);

        if (userData) {
            // First priority: check for the explicit 'name' field
            if (userData.name) {
                console.log(`Using name field: ${userData.name}`);
                return userData.name;
            }

            // Second priority: check for firstName + lastName
            if (userData.firstName && userData.lastName) {
                const fullName = `${userData.firstName} ${userData.lastName}`;
                console.log(`Using firstName + lastName: ${fullName}`);
                return fullName;
            }

            // Third priority: just firstName
            if (userData.firstName) {
                console.log(`Using firstName: ${userData.firstName}`);
                return userData.firstName;
            }

            // Fourth priority: email username
            if (userData.email) {
                const emailName = userData.email.split('@')[0];
                console.log(`Using email username: ${emailName}`);
                return emailName;
            }
        }

        // If we still have nameFromChat, use it instead of a generic fallback
        if (nameFromChat) {
            console.log(`Falling back to chat name: ${nameFromChat}`);
            return nameFromChat;
        }

        // Final fallback to generic name based on role
        const role = chat.participantRoles?.[userId] || 'customer';
        const config = roleConfig[role] || roleConfig.customer;
        console.log(`Using generic role label: ${config.label}`);
        return config.label;
    };

    // Chat list item
    const renderChatItem = ({ item: chat }) => {
        // Get the other participant's ID
        const otherParticipantId = chat.participants.find(id => id !== user?._id);

        // Get participant info
        const participantName = getDisplayName(otherParticipantId, chat);
        console.log(`Displaying name for ${otherParticipantId}: ${participantName}`);

        const participantRole = chat.participantRoles?.[otherParticipantId] || 'customer';
        const userData = participantDetails[otherParticipantId];

        // Get role configuration
        const config = roleConfig[participantRole] || roleConfig.customer;

        // Format timestamp
        const timestamp = chat.lastMessage.createdAt?.toDate?.()
            ? formatMessageTime(chat.lastMessage.createdAt.toDate())
            : '';

        return (
            <TouchableOpacity
                key={chat.id}
                style={styles.chatItem}
                onPress={() => handleChatSelect(chat)}
            >
                <View style={[styles.chatAvatar, { backgroundColor: config.bgColor }]}>
                    {userData?.profilePicture ? (
                        <Image
                            source={{ uri: userData.profilePicture }}
                            style={styles.avatarImage}
                            contentFit="cover"
                        />
                    ) : (
                        <Text style={[styles.avatarText, { color: config.color }]}>
                            {participantName.charAt(0).toUpperCase()}
                        </Text>
                    )}
                </View>
                <View style={styles.chatInfo}>
                    <View style={styles.chatNameRow}>
                        <Text style={styles.chatName}>{participantName}</Text>
                        <View style={[styles.roleBadge, { backgroundColor: config.bgColor }]}>
                            <Text style={[styles.roleBadgeText, { color: config.color }]}>
                                {config.label}
                            </Text>
                        </View>
                    </View>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                        {chat.lastMessage.text}
                    </Text>
                </View>
                <Text style={styles.timestamp}>{timestamp}</Text>
            </TouchableOpacity>
        );
    };

    // Format message time
    const formatMessageTime = (date) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Same day - show time
        if (date >= today) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        // Yesterday
        else if (date >= yesterday) {
            return 'Yesterday';
        }
        // Within last 7 days - show day name
        else if (date >= new Date(today.setDate(today.getDate() - 6))) {
            return date.toLocaleDateString([], { weekday: 'short' });
        }
        // Older - show date
        else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    // Render search and filter section
    const renderSearchBar = () => (
        <View style={styles.searchContainer}>
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
                        style={[styles.filterOption, activeFilter === 'customer' && styles.activeFilterOption]}
                        onPress={() => handleFilterSelect('customer')}
                    >
                        <Text style={[styles.filterOptionText, activeFilter === 'customer' && styles.activeFilterText]}>
                            Customer Assistance
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

    // Simplified render - we always show the chat list now
    return (
        <View style={styles.container}>
            <HomeHeader title="Chats" />

            {renderSearchBar()}

            <View style={{ flex: 1, position: 'relative' }}>
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

                {/* Floating Action Button for New Chat */}
                <TouchableOpacity
                    style={styles.fabButton}
                    onPress={handleNewChat}
                    activeOpacity={0.7}
                >
                    <Feather name="edit" size={24} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        </View>
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
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        overflow: 'hidden',
    },
    avatarImage: {
        width: 50,
        height: 50,
    },
    avatarText: {
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
    },
    roleBadgeText: {
        fontSize: 10,
        fontWeight: '600',
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
    fabButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#3b82f6',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 6,
        zIndex: 100,
    },
}); 