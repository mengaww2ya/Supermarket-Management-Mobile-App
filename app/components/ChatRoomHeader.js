import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Modal, Pressable, ScrollView, Platform } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';

export default function ChatRoomHeader({ title, photoURL, online, typing, role }) {
    const insets = useSafeAreaInsets();
    const [showOptions, setShowOptions] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(-20)).current;
    const typingOpacity = useRef(new Animated.Value(0)).current;
    const typingDots = useRef(new Animated.Value(0)).current;
    const optionsScaleAnim = useRef(new Animated.Value(0.5)).current;
    const optionsOpacityAnim = useRef(new Animated.Value(0)).current;

    // Helper function to format dates safely
    const formatDate = (dateValue, formatType = 'date') => {
        if (!dateValue) return 'Unknown';

        try {
            // Handle Firestore timestamps
            if (dateValue && typeof dateValue.toDate === 'function') {
                dateValue = dateValue.toDate();
            }
            // Handle Firestore timestamp as object with seconds and nanoseconds
            else if (dateValue && dateValue.seconds && dateValue.nanoseconds) {
                dateValue = new Date(dateValue.seconds * 1000);
            }
            // Handle string dates
            else if (typeof dateValue === 'string') {
                dateValue = new Date(dateValue);
            }

            // Check if we have a valid date
            if (dateValue instanceof Date && !isNaN(dateValue)) {
                if (formatType === 'datetime') {
                    return dateValue.toLocaleString();
                } else {
                    return dateValue.toLocaleDateString();
                }
            }

            // If it's still an object with seconds, try directly
            if (typeof dateValue === 'object' && dateValue.seconds) {
                const date = new Date(dateValue.seconds * 1000);
                if (formatType === 'datetime') {
                    return date.toLocaleString();
                } else {
                    return date.toLocaleDateString();
                }
            }

            // Last resort - stringify the value
            if (typeof dateValue === 'object') {
                return JSON.stringify(dateValue);
            }

            return 'Unknown';
        } catch (error) {
            console.log('Error formatting date:', error);
            return 'Unknown';
        }
    };

    // Extract user data
    const userData = React.useMemo(() => {
        if (!title) return { name: 'Chat' };

        // If title is a string, use it as name
        if (typeof title === 'string') {
            return { name: title };
        }

        // If it's an object, it's the user data
        if (typeof title === 'object') {
            return title;
        }

        return { name: 'Chat' };
    }, [title]);

    // Get a display name from userData
    const safeTitle = React.useMemo(() => {
        if (userData.fullName) return userData.fullName;
        if (userData.name) return userData.name;
        if (userData.displayName) return userData.displayName;
        if (userData.email) return userData.email;
        return 'Chat';
    }, [userData]);

    useEffect(() => {
        // Entrance animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();

        // Typing animation
        if (typing) {
            Animated.timing(typingOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }).start();

            // Animate the typing dots in a loop
            Animated.loop(
                Animated.sequence([
                    Animated.timing(typingDots, {
                        toValue: 1,
                        duration: 500,
                        useNativeDriver: false,
                    }),
                    Animated.timing(typingDots, {
                        toValue: 0,
                        duration: 500,
                        useNativeDriver: false,
                    }),
                ])
            ).start();
        } else {
            Animated.timing(typingOpacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [typing]);

    const toggleOptions = () => {
        if (showOptions) {
            Animated.parallel([
                Animated.timing(optionsScaleAnim, {
                    toValue: 0.5,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(optionsOpacityAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start(() => setShowOptions(false));
        } else {
            setShowOptions(true);
            Animated.parallel([
                Animated.spring(optionsScaleAnim, {
                    toValue: 1,
                    friction: 6,
                    tension: 80,
                    useNativeDriver: true,
                }),
                Animated.timing(optionsOpacityAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const viewProfile = () => {
        toggleOptions();
        setShowProfileModal(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    };

    const renderTypingDots = () => {
        // Get animated dots based on the animation value
        const dotsValue = typingDots.interpolate({
            inputRange: [0, 0.33, 0.66, 1],
            outputRange: ['', '.', '..', '...'],
        });

        return (
            <Animated.View
                style={[
                    styles.typingContainer,
                    { opacity: typingOpacity }
                ]}
            >
                <Text style={styles.typingText}>
                    typing
                    <Animated.Text style={styles.typingText}>
                        {dotsValue}
                    </Animated.Text>
                </Text>
            </Animated.View>
        );
    };

    const goBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Add debug logging
        console.log("[ChatRoomHeader] Going back with role:", role);

        // Instead of using router.back() which may navigate incorrectly,
        // navigate to specific routes based on user role
        try {
            if (role === 'supplier') {
                console.log("[ChatRoomHeader] Navigating to supplier chat");
                router.replace('/(app)/suplier/(tabs)/chat');
            } else if (role === 'deliveryAgent') {
                console.log("[ChatRoomHeader] Navigating to delivery agent chat");
                router.replace('/(app)/deliveryAgent/(tabs)/chat');
            } else if (role === 'customer') {
                console.log("[ChatRoomHeader] Navigating to customer tabs");
                router.replace('/(app)/customer/(tabs)');
            } else {
                // Fallback to a safe route if role is not recognized
                console.log("[ChatRoomHeader] No specific back route for role:", role);
                router.replace('/(app)');
            }
        } catch (error) {
            console.error('[ChatRoomHeader] Navigation error:', error);
            // Emergency fallback
            router.replace('/(app)');
        }
    };

    // Safely get the first character for avatar
    const getAvatarInitial = () => {
        if (!safeTitle) return '?';
        return safeTitle.charAt(0).toUpperCase();
    };

    const getRoleColor = (userRole) => {
        switch (userRole) {
            case 'admin':
                return '#dc3545';
            case 'manager':
                return '#fd7e14';
            case 'customer':
                return '#20c997';
            case 'stockManager':
                return '#6f42c1';
            case 'customerAssistance':
                return '#0dcaf0';
            case 'deliveryAgent':
                return '#4F46E5';
            case 'supplier':
                return '#f59e0b';
            default:
                return '#6c757d';
        }
    };

    const getRoleLabel = (userRole) => {
        switch (userRole) {
            case 'admin':
                return 'Admin';
            case 'manager':
                return 'Manager';
            case 'customer':
                return 'Customer';
            case 'stockManager':
                return 'Stock Manager';
            case 'customerAssistance':
                return 'Support';
            case 'deliveryAgent':
                return 'Delivery';
            case 'supplier':
                return 'Supplier';
            default:
                return userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1) : 'User';
        }
    };

    return (
        <>
            <LinearGradient
                colors={['#ffffff', '#f8fafc']}
                style={[
                    styles.container,
                    { paddingTop: insets.top > 0 ? insets.top : 12 }
                ]}
            >
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={goBack}
                    activeOpacity={0.7}
                >
                    <View style={styles.iconWrapper}>
                        <Feather name="arrow-left" size={22} color="#374151" />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.profileContainer}
                    onPress={viewProfile}
                    activeOpacity={0.8}
                >
                    <View style={styles.avatarContainer}>
                        {photoURL ? (
                            <Image source={{ uri: photoURL }} style={styles.avatar} />
                        ) : (
                            <LinearGradient
                                colors={['#6366f1', '#8b5cf6']}
                                style={styles.avatar}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Text style={styles.avatarText}>
                                    {getAvatarInitial()}
                                </Text>
                            </LinearGradient>
                        )}

                        {online && <View style={styles.onlineIndicator} />}
                    </View>

                    <View style={styles.titleContainer}>
                        <Animated.Text
                            style={[
                                styles.title,
                                {
                                    opacity: fadeAnim,
                                    transform: [{ translateY: slideAnim }]
                                }
                            ]}
                            numberOfLines={1}
                        >
                            {safeTitle}
                        </Animated.Text>

                        {typing ? renderTypingDots() : online && (
                            <Text style={styles.onlineText}>online</Text>
                        )}
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.optionsButton}
                    onPress={toggleOptions}
                    activeOpacity={0.7}
                >
                    <View style={styles.iconWrapper}>
                        <Feather name="more-vertical" size={22} color="#374151" />
                    </View>
                </TouchableOpacity>

                {showOptions && (
                    <Animated.View
                        style={[
                            styles.optionsMenu,
                            {
                                opacity: optionsOpacityAnim,
                                transform: [{ scale: optionsScaleAnim }]
                            }
                        ]}
                    >
                        <TouchableOpacity
                            style={styles.optionItem}
                            onPress={viewProfile}
                        >
                            <Feather name="user" size={18} color="#374151" />
                            <Text style={styles.optionText}>View Profile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.optionItem}>
                            <Feather name="bell-off" size={18} color="#374151" />
                            <Text style={styles.optionText}>Mute Notifications</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.optionItem}>
                            <Feather name="trash-2" size={18} color="#dc3545" />
                            <Text style={[styles.optionText, { color: '#dc3545' }]}>Delete Chat</Text>
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </LinearGradient>

            {/* Enhanced Profile Modal */}
            <Modal
                visible={showProfileModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowProfileModal(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowProfileModal(false)}
                >
                    <Pressable style={styles.modalContent} onPress={e => e.stopPropagation()}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>User Profile</Text>
                            <TouchableOpacity
                                onPress={() => setShowProfileModal(false)}
                                style={styles.closeButton}
                            >
                                <Feather name="x" size={24} color="#374151" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScrollView} contentContainerStyle={styles.scrollContent}>
                            <View style={styles.profileInfo}>
                                <View style={styles.modalAvatarContainer}>
                                    {photoURL ? (
                                        <Image source={{ uri: photoURL }} style={styles.modalAvatar} />
                                    ) : (
                                        <LinearGradient
                                            colors={['#6366f1', '#8b5cf6']}
                                            style={styles.modalAvatar}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                        >
                                            <Text style={styles.modalAvatarText}>
                                                {getAvatarInitial()}
                                            </Text>
                                        </LinearGradient>
                                    )}

                                    {online && (
                                        <View style={styles.modalOnlineIndicator} />
                                    )}
                                </View>

                                <Text style={styles.profileName}>{safeTitle}</Text>

                                {(userData?.role || role) && (
                                    <View style={[
                                        styles.roleBadge,
                                        { backgroundColor: `${getRoleColor(userData?.role || role)}20` }
                                    ]}>
                                        <Text style={[
                                            styles.roleText,
                                            { color: getRoleColor(userData?.role || role) }
                                        ]}>
                                            {getRoleLabel(userData?.role || role)}
                                        </Text>
                                    </View>
                                )}

                                <View style={styles.profileStatus}>
                                    {online ? (
                                        <Text style={styles.statusText}>
                                            <View style={styles.statusDot} />
                                            Online now
                                        </Text>
                                    ) : (
                                        <Text style={[styles.statusText, { color: '#6b7280' }]}>
                                            Offline
                                        </Text>
                                    )}
                                </View>
                            </View>

                            <View style={styles.infoSection}>
                                <Text style={styles.sectionTitle}>Contact Information</Text>

                                <View style={styles.infoItem}>
                                    <View style={styles.infoIconContainer}>
                                        <Feather name="mail" size={18} color="#4F46E5" />
                                    </View>
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>Email</Text>
                                        <Text style={styles.infoValue}>
                                            {userData?.email || 'Not available'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.infoItem}>
                                    <View style={styles.infoIconContainer}>
                                        <Feather name="phone" size={18} color="#4F46E5" />
                                    </View>
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>Phone Number</Text>
                                        <Text style={styles.infoValue}>
                                            {userData?.phone || userData?.phoneNumber || 'Not available'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.infoItem}>
                                    <View style={styles.infoIconContainer}>
                                        <Feather name="info" size={18} color="#4F46E5" />
                                    </View>
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>Full Name</Text>
                                        <Text style={styles.infoValue}>
                                            {userData?.fullName ||
                                                (userData?.firstName && userData?.lastName ?
                                                    `${userData.firstName} ${userData.lastName}` :
                                                    userData?.name || 'Not available')}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.infoSection}>
                                <Text style={styles.sectionTitle}>Account Information</Text>

                                <View style={styles.infoItem}>
                                    <View style={styles.infoIconContainer}>
                                        <Feather name="award" size={18} color="#4F46E5" />
                                    </View>
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>Role</Text>
                                        <Text style={[styles.infoValue, { color: getRoleColor(userData?.role || role) }]}>
                                            {getRoleLabel(userData?.role || role) || 'User'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.infoItem}>
                                    <View style={styles.infoIconContainer}>
                                        <Feather name="hash" size={18} color="#4F46E5" />
                                    </View>
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>User ID</Text>
                                        <Text style={styles.infoValue} numberOfLines={1} ellipsizeMode="middle">
                                            {userData?.uid || 'Not available'}
                                        </Text>
                                    </View>
                                </View>

                                {userData?.department && (
                                    <View style={styles.infoItem}>
                                        <View style={styles.infoIconContainer}>
                                            <Feather name="briefcase" size={18} color="#4F46E5" />
                                        </View>
                                        <View style={styles.infoContent}>
                                            <Text style={styles.infoLabel}>Department</Text>
                                            <Text style={styles.infoValue}>{userData.department}</Text>
                                        </View>
                                    </View>
                                )}

                                {userData?.location && (
                                    <View style={styles.infoItem}>
                                        <View style={styles.infoIconContainer}>
                                            <Feather name="map-pin" size={18} color="#4F46E5" />
                                        </View>
                                        <View style={styles.infoContent}>
                                            <Text style={styles.infoLabel}>Location</Text>
                                            <Text style={styles.infoValue}>{userData.location}</Text>
                                        </View>
                                    </View>
                                )}

                                {userData?.address && (
                                    <View style={styles.infoItem}>
                                        <View style={styles.infoIconContainer}>
                                            <Feather name="map" size={18} color="#4F46E5" />
                                        </View>
                                        <View style={styles.infoContent}>
                                            <Text style={styles.infoLabel}>Address</Text>
                                            <Text style={styles.infoValue}>{userData.address}</Text>
                                        </View>
                                    </View>
                                )}
                            </View>

                            <View style={styles.infoSection}>
                                <Text style={styles.sectionTitle}>App Activity</Text>

                                <View style={styles.infoItem}>
                                    <View style={styles.infoIconContainer}>
                                        <Feather name="calendar" size={18} color="#4F46E5" />
                                    </View>
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>Last Active</Text>
                                        <Text style={styles.infoValue}>
                                            {online ? 'Now' : userData?.lastActive ?
                                                formatDate(userData.lastActive)
                                                : 'Unknown'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.infoItem}>
                                    <View style={styles.infoIconContainer}>
                                        <Feather name="clock" size={18} color="#4F46E5" />
                                    </View>
                                    <View style={styles.infoContent}>
                                        <Text style={styles.infoLabel}>Created Account</Text>
                                        <Text style={styles.infoValue}>
                                            {userData?.createdAt ?
                                                formatDate(userData.createdAt)
                                                : 'Unknown'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.actionButtons}>
                            <TouchableOpacity
                                style={styles.actionButton}
                                onPress={() => setShowProfileModal(false)}
                            >
                                <Text style={styles.actionButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    backButton: {
        padding: 6,
        borderRadius: 20,
    },
    iconWrapper: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
    },
    profileContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 4,
        padding: 8,
        borderRadius: 25,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#f8fafc',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    onlineIndicator: {
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#10b981',
        borderWidth: 2,
        borderColor: 'white',
        bottom: 0,
        right: 0,
    },
    titleContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    onlineText: {
        fontSize: 12,
        color: '#10b981',
    },
    typingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    typingText: {
        fontSize: 12,
        color: '#6b7280',
    },
    optionsButton: {
        padding: 6,
        borderRadius: 20,
    },
    optionsMenu: {
        position: 'absolute',
        top: 75,
        right: 12,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 4,
        width: 200,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        zIndex: 100,
    },
    optionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
    },
    optionText: {
        marginLeft: 12,
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        width: '95%',
        maxWidth: 450,
        maxHeight: '90%',
        overflow: 'hidden',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    closeButton: {
        padding: 4,
    },
    profileInfo: {
        alignItems: 'center',
        padding: 24,
    },
    modalAvatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    modalAvatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalAvatarText: {
        fontSize: 36,
        fontWeight: 'bold',
        color: 'white',
    },
    modalOnlineIndicator: {
        position: 'absolute',
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#10b981',
        borderWidth: 3,
        borderColor: 'white',
        bottom: 4,
        right: 4,
    },
    profileName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    roleBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 12,
    },
    roleText: {
        fontSize: 14,
        fontWeight: '600',
    },
    profileStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    statusText: {
        fontSize: 14,
        color: '#10b981',
        fontWeight: '500',
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10b981',
        marginRight: 6,
    },
    actionButtons: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        alignItems: 'center',
    },
    actionButton: {
        backgroundColor: '#4F46E5',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 25,
    },
    actionButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    infoSection: {
        padding: 16,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        marginBottom: 8,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 16,
        textAlign: 'center',
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 12,
    },
    infoIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: '#6b7280',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
    },
    modalScrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
    },
});