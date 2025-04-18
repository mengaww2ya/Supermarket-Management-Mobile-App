import React, { useState, useEffect } from 'react';
import {
    View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Modal,
    SafeAreaView, Pressable, ActivityIndicator, Image, Alert, ScrollView, Keyboard, Animated
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { auth, db } from '../../../firebase/firebaseConfig';
import {
    collection, query, where, getDocs, doc, getDoc, setDoc, addDoc,
    serverTimestamp, orderBy, updateDoc, writeBatch, increment
} from 'firebase/firestore';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export default function SystemChat() {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState(null);
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const currentUser = auth.currentUser;
    const [filterAnimation] = useState(new Animated.Value(0));

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [searchQuery, selectedRole, users]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            // Query users collection for all users except the current user
            const usersRef = collection(db, 'users');
            const q = query(
                usersRef,
                where('uid', '!=', currentUser.uid)
            );

            const querySnapshot = await getDocs(q);
            const usersData = querySnapshot.docs.map(doc => {
                const userData = doc.data();

                // Normalize role values
                let normalizedRole = userData.role;

                // Handle delivery role variations
                if (normalizedRole === 'delivery') {
                    normalizedRole = 'deliveryAgent';
                }

                // Handle customer role variations
                if (normalizedRole === 'customer' || normalizedRole === 'user') {
                    normalizedRole = 'customer';
                }

                // Handle stock manager role variations
                if (normalizedRole === 'stockManager' || normalizedRole === 'inventory') {
                    normalizedRole = 'stockManager';
                }

                // Handle store manager role variations
                if (normalizedRole === 'manager' || normalizedRole === 'storeManager') {
                    normalizedRole = 'manager';
                }

                return {
                    id: doc.id,
                    ...userData,
                    role: normalizedRole
                };
            });

            setUsers(usersData);
            setFilteredUsers(usersData);
        } catch (error) {
            console.error("Error fetching users:", error);
            Alert.alert("Error", "Failed to load users. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const filterUsers = () => {
        let filtered = [...users];

        // Apply role filter
        if (selectedRole) {
            filtered = filtered.filter(user => {
                // Match both normalized and potentially non-normalized role values
                if (selectedRole === 'deliveryAgent') {
                    return user.role === 'deliveryAgent' || user.role === 'delivery';
                } else if (selectedRole === 'customer') {
                    return user.role === 'customer' || user.role === 'user';
                } else if (selectedRole === 'stockManager') {
                    return user.role === 'stockManager' || user.role === 'inventory';
                } else if (selectedRole === 'manager') {
                    return user.role === 'manager' || user.role === 'storeManager';
                }
                return user.role === selectedRole;
            });
        }

        // Apply search query
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(user => {
                // Comprehensive search across multiple user fields using optional chaining
                const firstName = user.firstName?.toLowerCase() || '';
                const lastName = user.lastName?.toLowerCase() || '';
                const fullName = user.fullName?.toLowerCase() || '';
                const name = user.name?.toLowerCase() || '';
                const email = user.email?.toLowerCase() || '';
                const phone = user.phone || '';

                return firstName.includes(query) ||
                    lastName.includes(query) ||
                    fullName.includes(query) ||
                    name.includes(query) ||
                    email.includes(query) ||
                    phone.includes(query);
            });
        }

        setFilteredUsers(filtered);
    };

    const handleRoleSelect = (role) => {
        if (selectedRole === role) {
            // If the same role is selected again, deselect it
            setSelectedRole(null);
        } else {
            setSelectedRole(role);
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const animateFilterModal = (show) => {
        Animated.spring(filterAnimation, {
            toValue: show ? 1 : 0,
            friction: 8,
            tension: 100,
            useNativeDriver: true,
        }).start();
    };

    const toggleFilterModal = () => {
        if (!filterModalVisible) {
            setFilterModalVisible(true);
            animateFilterModal(true);
        } else {
            animateFilterModal(false);
            setTimeout(() => setFilterModalVisible(false), 200);
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const applyFilter = (role) => {
        handleRoleSelect(role);
        setFilterModalVisible(false);
    };

    const clearFilter = () => {
        setSelectedRole(null);

        // Close modal with animation
        animateFilterModal(false);
        setTimeout(() => setFilterModalVisible(false), 200);

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const navigateToChat = (user) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            router.push({
                pathname: "/suplier/chatRoom",
                params: {
                    uid: user.uid,
                    name: user.name || user.email || 'User'
                }
            });
        } catch (navError) {
            console.error("Navigation error:", navError);

            // Fallback navigation method if the first fails
            setTimeout(() => {
                router.push(`/suplier/chatRoom?uid=${user.uid}&name=${encodeURIComponent(user.name || user.email || 'User')}`);
            }, 100);
        }
    };

    const RoleFilterChip = ({ title, onPress, isSelected }) => (
        <TouchableOpacity
            style={[
                styles.roleChip,
                isSelected && styles.selectedRoleChip
            ]}
            onPress={onPress}
        >
            <Text style={[
                styles.roleChipText,
                isSelected && styles.selectedRoleChipText
            ]}>
                {title}
            </Text>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyImageContainer}>
                <Feather name="search" size={80} color="#ccc" />
            </View>
            <Text style={styles.emptyTitle}>No users found</Text>
            <Text style={styles.emptyText}>
                {searchQuery.trim() !== ''
                    ? "Try a different search term or clear filters"
                    : selectedRole
                        ? "Try removing role filters"
                        : "There are no users available to message"}
            </Text>
            {(searchQuery.trim() !== '' || selectedRole) && (
                <TouchableOpacity
                    style={styles.clearButton}
                    onPress={() => {
                        setSearchQuery('');
                        setSelectedRole(null);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                >
                    <Text style={styles.clearButtonText}>Clear Filters</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const getRoleDetails = (role) => {
        switch (role) {
            case 'customer':
                return {
                    title: 'Customer',
                    color: '#10b981', // Green
                    icon: 'user',
                    description: 'Shops for products'
                };
            case 'deliveryAgent':
            case 'delivery':
                return {
                    title: 'Delivery Agent',
                    color: '#3b82f6', // Blue
                    icon: 'truck',
                    description: 'Delivers orders'
                };
            case 'stockManager':
            case 'inventory':
                return {
                    title: 'Stock Manager',
                    color: '#8b5cf6', // Purple
                    icon: 'package',
                    description: 'Manages inventory'
                };
            case 'manager':
            case 'storeManager':
                return {
                    title: 'Store Manager',
                    color: '#f59e0b', // Amber
                    icon: 'briefcase',
                    description: 'Manages the store'
                };
            case 'supplier':
            case 'suplier':
            case 'vendor':
                return {
                    title: 'Supplier',
                    color: '#ef4444', // Red
                    icon: 'shopping-bag',
                    description: 'Provides products'
                };
            default:
                return {
                    title: 'User',
                    color: '#6b7280', // Gray
                    icon: 'user',
                    description: 'Application user'
                };
        }
    };

    const renderUserItem = ({ item }) => {
        // Extract name from various possible user properties
        const getName = () => {
            if (item.name) return item.name;
            if (item.fullName) return item.fullName;
            if (item.firstName && item.lastName) return `${item.firstName} ${item.lastName}`;
            if (item.firstName) return item.firstName;
            return item.email || 'Unknown User';
        };

        // Extract initials for avatar placeholder
        const getInitials = () => {
            if (item.firstName && item.lastName) {
                return `${item.firstName.charAt(0)}${item.lastName.charAt(0)}`;
            } else if (item.name) {
                const nameParts = item.name.split(' ');
                if (nameParts.length > 1) {
                    return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`;
                }
                return item.name.charAt(0);
            } else if (item.fullName) {
                const nameParts = item.fullName.split(' ');
                if (nameParts.length > 1) {
                    return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`;
                }
                return item.fullName.charAt(0);
            }
            return item.email ? item.email.charAt(0).toUpperCase() : '?';
        };

        const roleInfo = getRoleDetails(item.role);

        return (
            <TouchableOpacity
                style={styles.userItem}
                onPress={() => navigateToChat(item)}
                activeOpacity={0.7}
            >
                {/* User avatar */}
                <View style={styles.avatarContainer}>
                    {item.photoURL ? (
                        <Image
                            source={{ uri: item.photoURL }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: roleInfo.color }]}>
                            <Text style={styles.initialsText}>{getInitials()}</Text>
                        </View>
                    )}

                    {/* Online indicator - hardcoded for now */}
                    {item.isOnline && (
                        <View style={styles.onlineIndicator} />
                    )}
                </View>

                {/* User info */}
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{getName()}</Text>

                    <View style={styles.roleContainer}>
                        <View style={[styles.roleBadge, { backgroundColor: `${roleInfo.color}20` }]}>
                            <Feather name={roleInfo.icon} size={12} color={roleInfo.color} style={styles.roleIcon} />
                            <Text style={[styles.roleText, { color: roleInfo.color }]}>
                                {roleInfo.title}
                            </Text>
                        </View>

                        {item.status && (
                            <Text style={styles.statusText} numberOfLines={1}>{item.status}</Text>
                        )}
                    </View>
                </View>

                {/* Chat icon */}
                <View style={styles.chatIconContainer}>
                    <Feather name="message-circle" size={22} color="#6b7280" />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Feather name="arrow-left" size={24} color="#111827" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Messages</Text>

                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={toggleFilterModal}
                >
                    <Feather name="filter" size={22} color="#111827" />
                </TouchableOpacity>
            </View>

            {/* Search bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Feather name="search" size={20} color="#9ca3af" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search users..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor="#9ca3af"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            onPress={() => setSearchQuery('')}
                        >
                            <Feather name="x" size={20} color="#9ca3af" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Role filter chips */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipContainer}
                >
                    <RoleFilterChip
                        title="Customers"
                        onPress={() => handleRoleSelect('customer')}
                        isSelected={selectedRole === 'customer'}
                    />
                    <RoleFilterChip
                        title="Delivery Agents"
                        onPress={() => handleRoleSelect('deliveryAgent')}
                        isSelected={selectedRole === 'deliveryAgent'}
                    />
                    <RoleFilterChip
                        title="Stock Managers"
                        onPress={() => handleRoleSelect('stockManager')}
                        isSelected={selectedRole === 'stockManager'}
                    />
                    <RoleFilterChip
                        title="Store Managers"
                        onPress={() => handleRoleSelect('manager')}
                        isSelected={selectedRole === 'manager'}
                    />
                </ScrollView>
            </View>

            {/* User list */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#4f46e5" />
                    <Text style={styles.loadingText}>Loading users...</Text>
                </View>
            ) : (
                <FlatList
                    data={filteredUsers}
                    renderItem={renderUserItem}
                    keyExtractor={(item) => item.uid || item.id}
                    contentContainerStyle={styles.userList}
                    ListEmptyComponent={renderEmptyState}
                />
            )}

            {/* Filter modal */}
            <Modal
                visible={filterModalVisible}
                transparent={true}
                animationType="none"
                onRequestClose={() => {
                    animateFilterModal(false);
                    setTimeout(() => setFilterModalVisible(false), 200);
                }}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => {
                        animateFilterModal(false);
                        setTimeout(() => setFilterModalVisible(false), 200);
                    }}
                >
                    <Animated.View
                        style={[
                            styles.modalContainer,
                            {
                                transform: [
                                    {
                                        translateY: filterAnimation.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [300, 0],
                                        }),
                                    },
                                ],
                                opacity: filterAnimation,
                            },
                        ]}
                    >
                        <Pressable style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>Filter Users</Text>
                                <TouchableOpacity onPress={() => {
                                    animateFilterModal(false);
                                    setTimeout(() => setFilterModalVisible(false), 200);
                                }}>
                                    <Feather name="x" size={24} color="#111827" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.filterSectionTitle}>User Role</Text>

                            <View style={styles.roleGrid}>
                                {['customer', 'deliveryAgent', 'stockManager', 'manager'].map(role => {
                                    const details = getRoleDetails(role);
                                    return (
                                        <TouchableOpacity
                                            key={role}
                                            style={[
                                                styles.roleCard,
                                                selectedRole === role && {
                                                    backgroundColor: `${details.color}10`,
                                                    borderColor: details.color
                                                }
                                            ]}
                                            onPress={() => applyFilter(role)}
                                        >
                                            <View style={[styles.roleIconCircle, { backgroundColor: `${details.color}20` }]}>
                                                <Feather name={details.icon} size={24} color={details.color} />
                                            </View>
                                            <Text style={styles.roleCardTitle}>{details.title}</Text>
                                            <Text style={styles.roleCardDescription}>{details.description}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <TouchableOpacity
                                style={styles.clearFiltersButton}
                                onPress={clearFilter}
                            >
                                <Text style={styles.clearFiltersText}>Clear Filters</Text>
                            </TouchableOpacity>
                        </Pressable>
                    </Animated.View>
                </Pressable>
            </Modal>
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
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
    },
    filterButton: {
        padding: 8,
    },
    searchContainer: {
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
        color: '#111827',
    },
    chipContainer: {
        paddingRight: 16,
    },
    roleChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#f3f4f6',
        borderRadius: 20,
        marginRight: 8,
    },
    selectedRoleChip: {
        backgroundColor: '#4f46e520', // Light indigo
    },
    roleChipText: {
        fontSize: 14,
        color: '#4b5563',
    },
    selectedRoleChipText: {
        color: '#4f46e5', // Indigo
        fontWeight: '500',
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
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 20,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#6b7280',
        justifyContent: 'center',
        alignItems: 'center',
    },
    initialsText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#10b981',
        borderWidth: 2,
        borderColor: 'white',
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
    },
    roleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 8,
    },
    roleIcon: {
        marginRight: 4,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '500',
    },
    statusText: {
        fontSize: 12,
        color: '#6b7280',
        flex: 1,
    },
    chatIconContainer: {
        padding: 8,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
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
    clearButton: {
        backgroundColor: '#4f46e5',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    clearButtonText: {
        color: 'white',
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: 'white',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        overflow: 'hidden',
    },
    modalContent: {
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    filterSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 12,
    },
    roleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    roleCard: {
        width: '48%',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        alignItems: 'center',
    },
    roleIconCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    roleCardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 4,
        textAlign: 'center',
    },
    roleCardDescription: {
        fontSize: 12,
        color: '#6b7280',
        textAlign: 'center',
    },
    clearFiltersButton: {
        backgroundColor: '#f3f4f6',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    clearFiltersText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#4b5563',
    },
}); 