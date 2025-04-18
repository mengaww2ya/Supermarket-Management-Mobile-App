import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    setDoc,
    serverTimestamp,
    getDoc
} from 'firebase/firestore';
import { db, auth } from '../../../firebase/firebaseConfig';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function NewChat() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('delivery'); // 'delivery' or 'manager'
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, [activeTab]);

    useEffect(() => {
        if (searchQuery.trim() === '') {
            setFilteredUsers(users);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = users.filter(user =>
            user.name?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query) ||
            user.phone?.includes(query)
        );

        setFilteredUsers(filtered);
    }, [searchQuery, users]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const currentUserId = auth.currentUser?.uid;

            if (!currentUserId) {
                Alert.alert('Error', 'You must be logged in');
                router.back();
                return;
            }

            // Query users with the selected role
            const usersRef = collection(db, 'users');
            const q = query(
                usersRef,
                where('role', '==', activeTab)
            );

            const snapshot = await getDocs(q);

            // Filter out current user and format the data
            const usersData = snapshot.docs
                .map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }))
                .filter(user => user.id !== currentUserId);

            setUsers(usersData);
            setFilteredUsers(usersData);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching users:', error);
            Alert.alert('Error', 'Failed to load users');
            setLoading(false);
        }
    };

    const handleClearSearch = () => {
        setSearchQuery('');
    };

    const startNewChat = async (selectedUser) => {
        try {
            setLoading(true);
            const currentUser = auth.currentUser;

            if (!currentUser) {
                Alert.alert('Error', 'You must be logged in');
                setLoading(false);
                return;
            }

            // Get current user data
            const currentUserDoc = await getDoc(doc(db, 'users', currentUser.uid));
            const currentUserData = currentUserDoc.data();

            // Check if chat already exists between these users
            const chatsRef = collection(db, 'chats');
            const q1 = query(
                chatsRef,
                where('participants', 'array-contains', currentUser.uid)
            );

            const existingChatsSnapshot = await getDocs(q1);
            let existingChatId = null;

            existingChatsSnapshot.docs.forEach(doc => {
                const chatData = doc.data();
                if (chatData.participants.includes(selectedUser.id)) {
                    existingChatId = doc.id;
                }
            });

            // If chat exists, navigate to it
            if (existingChatId) {
                setLoading(false);
                router.push({
                    pathname: '/suplier/(tabs)/chat',
                    params: { chatId: existingChatId }
                });
                return;
            }

            // Create a new chat
            const newChatRef = doc(collection(db, 'chats'));

            // Prepare participant names and roles object
            const participantNames = {};
            participantNames[currentUser.uid] = currentUserData.name || currentUser.email;
            participantNames[selectedUser.id] = selectedUser.name || selectedUser.email;

            const participantRoles = {};
            participantRoles[currentUser.uid] = 'supplier';
            participantRoles[selectedUser.id] = selectedUser.role;

            await setDoc(newChatRef, {
                participants: [currentUser.uid, selectedUser.id],
                participantNames,
                participantRoles,
                createdAt: serverTimestamp(),
                lastMessage: {
                    text: 'Chat started',
                    createdAt: serverTimestamp()
                }
            });

            // Create initial system message
            const messagesRef = collection(db, 'chats', newChatRef.id, 'messages');
            await setDoc(doc(messagesRef), {
                text: `Chat started with ${selectedUser.name || selectedUser.email}`,
                createdAt: serverTimestamp(),
                system: true
            });

            // Navigate to chat
            setLoading(false);
            router.push({
                pathname: '/suplier/(tabs)/chat',
                params: { chatId: newChatRef.id }
            });

        } catch (error) {
            console.error('Error creating chat:', error);
            Alert.alert('Error', 'Failed to create chat');
            setLoading(false);
        }
    };

    const renderUserItem = ({ item }) => {
        // Determine background color based on role
        const bgColor = item.role === 'delivery' ? '#d1fae5' : '#ede9fe';
        const iconName = item.role === 'delivery' ? 'bicycle' : 'business';
        const iconColor = item.role === 'delivery' ? '#059669' : '#7c3aed';

        return (
            <TouchableOpacity
                style={styles.userItem}
                onPress={() => startNewChat(item)}
                disabled={loading}
            >
                <View style={[styles.userAvatar, { backgroundColor: bgColor }]}>
                    <Ionicons name={iconName} size={24} color={iconColor} />
                </View>

                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{item.name || 'User'}</Text>
                    <Text style={styles.userEmail}>{item.email || ''}</Text>
                    {item.phone && <Text style={styles.userPhone}>{item.phone}</Text>}
                </View>

                <Feather name="message-square" size={20} color="#3b82f6" />
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <Ionicons
                name={activeTab === 'delivery' ? 'bicycle' : 'people'}
                size={50}
                color="#9ca3af"
            />
            <Text style={styles.emptyText}>
                {searchQuery
                    ? `No ${activeTab === 'delivery' ? 'delivery agents' : 'managers'} matching "${searchQuery}"`
                    : `No ${activeTab === 'delivery' ? 'delivery agents' : 'managers'} available`
                }
            </Text>
            <Text style={styles.emptySubtext}>
                {searchQuery
                    ? 'Try a different search term'
                    : 'Check back later or contact support'
                }
            </Text>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <MaterialIcons name="arrow-back" size={24} color="#000" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>New Chat</Text>
                <View style={{ width: 24 }} />
            </View>

            <View style={styles.searchContainer}>
                <View style={styles.searchRow}>
                    <View style={styles.searchInputWrapper}>
                        <Ionicons name="search-outline" size={20} color="#9ca3af" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={`Search ${activeTab === 'delivery' ? 'delivery agents' : 'managers'}...`}
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
                        onPress={() => setShowFilterDropdown(!showFilterDropdown)}
                    >
                        <Ionicons
                            name="filter"
                            size={22}
                            color="#374151"
                        />
                    </TouchableOpacity>
                </View>

                {showFilterDropdown && (
                    <View style={styles.filterDropdown}>
                        <TouchableOpacity
                            style={[styles.filterOption, activeTab === 'delivery' && styles.activeFilterOption]}
                            onPress={() => {
                                setActiveTab('delivery');
                                setShowFilterDropdown(false);
                            }}
                        >
                            <Ionicons name="bicycle" size={18} color="#059669" style={styles.filterOptionIcon} />
                            <Text style={[styles.filterOptionText, activeTab === 'delivery' && styles.activeFilterText]}>
                                Delivery Agents
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.filterOption, activeTab === 'manager' && styles.activeFilterOption]}
                            onPress={() => {
                                setActiveTab('manager');
                                setShowFilterDropdown(false);
                            }}
                        >
                            <Ionicons name="business" size={18} color="#7c3aed" style={styles.filterOptionIcon} />
                            <Text style={[styles.filterOptionText, activeTab === 'manager' && styles.activeFilterText]}>
                                Managers
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <View style={styles.listContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                        <Text style={styles.loadingText}>Loading {activeTab === 'delivery' ? 'delivery agents' : 'managers'}...</Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredUsers}
                        renderItem={renderUserItem}
                        keyExtractor={item => item.id}
                        style={styles.userList}
                        ListEmptyComponent={renderEmptyState}
                        contentContainerStyle={filteredUsers.length === 0 ? { flex: 1 } : null}
                    />
                )}
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
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    backButton: {
        padding: 8,
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
        height: 44,
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
        height: 44,
        width: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    filterDropdown: {
        position: 'absolute',
        top: 70,
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
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    filterOptionIcon: {
        marginRight: 12,
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
    listContainer: {
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
    userList: {
        flex: 1,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    userAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 2,
    },
    userEmail: {
        fontSize: 14,
        color: '#6b7280',
    },
    userPhone: {
        fontSize: 14,
        color: '#6b7280',
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
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9ca3af',
        textAlign: 'center',
        marginTop: 8,
    },
}); 