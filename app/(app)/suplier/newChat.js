import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    Alert,
    Image
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
import HomeHeader from '../../components/HomeHeader';

export default function NewChat() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('customer'); // Default to 'customer'
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);

    // Define user categories with their icons and colors and correct database role names
    const userCategories = {
        customer: {
            title: 'Customer Assistance',
            icon: 'people',
            color: '#f59e0b', // Amber
            dbRole: 'customerAssistance'
        },
        manager: {
            title: 'Managers',
            icon: 'business',
            color: '#7c3aed', // Purple
            dbRole: 'manager'
        },
        stockManager: {
            title: 'Stock Managers',
            icon: 'cube',
            color: '#0891b2', // Cyan
            dbRole: 'stockManager'
        },
        delivery: {
            title: 'Delivery Agents',
            icon: 'bicycle',
            color: '#059669', // Green
            dbRole: 'deliveryAgent'
        }
    };

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

            // Get the correct database role name for the selected tab
            const roleToQuery = userCategories[activeTab].dbRole;

            console.log(`Fetching users with role: ${roleToQuery}`);

            const usersRef = collection(db, 'users');
            const q = query(
                usersRef,
                where('role', '==', roleToQuery)
            );

            const snapshot = await getDocs(q);

            console.log(`Found ${snapshot.docs.length} users with role ${roleToQuery}`);

            // Filter out current user and format the data
            const usersData = snapshot.docs
                .map(doc => {
                    const userData = doc.data();
                    console.log(`User data for ${doc.id}:`, userData);
                    return {
                        id: doc.id,
                        ...userData
                    };
                })
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

                try {
                    // Try direct string path with query parameters - use our local chatRoom
                    router.push(`/(app)/chatRoom?uid=${selectedUser.id}&name=${encodeURIComponent(selectedUser.name || selectedUser.email)}&chatId=${existingChatId}`);
                } catch (navError) {
                    console.error("Navigation error:", navError);

                    // Fallback to object-based navigation
                    setTimeout(() => {
                        router.push({
                            pathname: "/(app)/chatRoom",
                            params: {
                                uid: selectedUser.id,
                                name: selectedUser.name || selectedUser.email,
                                chatId: existingChatId
                            }
                        });
                    }, 100);
                }
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
            try {
                // Try direct string path with query parameters - use our local chatRoom
                router.push(`/(app)/chatRoom?uid=${selectedUser.id}&name=${encodeURIComponent(selectedUser.name || selectedUser.email)}&chatId=${newChatRef.id}`);
            } catch (navError) {
                console.error("Navigation error:", navError);

                // Fallback to object-based navigation
                setTimeout(() => {
                    router.push({
                        pathname: "/(app)/chatRoom",
                        params: {
                            uid: selectedUser.id,
                            name: selectedUser.name || selectedUser.email,
                            chatId: newChatRef.id
                        }
                    });
                }, 100);
            }

        } catch (error) {
            console.error('Error creating chat:', error);
            Alert.alert('Error', 'Failed to create chat');
            setLoading(false);
        }
    };

    const renderUserItem = ({ item }) => {
        // Map database role to UI category
        const roleMap = {
            customerAssistance: 'customer',
            deliveryAgent: 'delivery',
            manager: 'manager',
            stockManager: 'stockManager'
        };

        const uiRole = roleMap[item.role] || 'customer';
        const category = userCategories[uiRole];

        // Get user display name - prioritize name, then firstName + lastName, then email, or fallback
        let displayName = "Unknown User";

        if (item.name) {
            displayName = item.name;
        } else if (item.firstName && item.lastName) {
            displayName = `${item.firstName} ${item.lastName}`;
        } else if (item.firstName) {
            displayName = item.firstName;
        } else if (item.email) {
            displayName = item.email.split('@')[0]; // Use email without domain
        }

        const bgColor = category.color + '20'; // Add transparency for background
        const iconName = category.icon;
        const iconColor = category.color;

        return (
            <TouchableOpacity
                style={styles.userItem}
                onPress={() => startNewChat(item)}
                disabled={loading}
            >
                <View style={[styles.userAvatar, { backgroundColor: bgColor }]}>
                    {item.profilePicture ? (
                        <Image
                            source={{ uri: item.profilePicture }}
                            style={styles.avatarImage}
                        />
                    ) : (
                        <Text style={styles.avatarText}>
                            {displayName.charAt(0).toUpperCase()}
                        </Text>
                    )}
                </View>

                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{displayName}</Text>
                    <Text style={styles.userEmail}>{item.email || ''}</Text>
                    {item.phone && <Text style={styles.userPhone}>{item.phone}</Text>}
                </View>

                <Feather name="message-square" size={20} color="#3b82f6" />
            </TouchableOpacity>
        );
    };

    const renderEmptyState = () => {
        const category = userCategories[activeTab];
        return (
            <View style={styles.emptyState}>
                <Ionicons
                    name={category.icon}
                    size={50}
                    color="#9ca3af"
                />
                <Text style={styles.emptyText}>
                    {searchQuery
                        ? `No ${category.title.toLowerCase()} matching "${searchQuery}"`
                        : `No ${category.title.toLowerCase()} available`
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
    };

    return (
        <View style={[styles.container, { paddingTop: 0 }]}>
            <HomeHeader
                title="New Chat"
                showBackButton={true}
                onBackPress={() => router.back()}
            />

            <View style={styles.searchContainer}>
                <View style={styles.searchRow}>
                    <View style={styles.searchInputWrapper}>
                        <Ionicons name="search-outline" size={20} color="#9ca3af" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={`Search ${userCategories[activeTab].title}...`}
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
                        {Object.entries(userCategories).map(([key, category]) => (
                            <TouchableOpacity
                                key={key}
                                style={[styles.filterOption, activeTab === key && styles.activeFilterOption]}
                                onPress={() => {
                                    setActiveTab(key);
                                    setShowFilterDropdown(false);
                                }}
                            >
                                <Ionicons
                                    name={category.icon}
                                    size={18}
                                    color={category.color}
                                    style={styles.filterOptionIcon}
                                />
                                <Text style={[
                                    styles.filterOptionText,
                                    activeTab === key && styles.activeFilterText
                                ]}>
                                    {category.title}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            <View style={styles.listContainer}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#3b82f6" />
                        <Text style={styles.loadingText}>Loading {userCategories[activeTab].title}...</Text>
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
    avatarImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4b5563',
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