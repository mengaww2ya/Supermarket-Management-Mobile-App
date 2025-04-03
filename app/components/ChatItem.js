import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import * as Haptics from 'expo-haptics';
import { blurhash, getRoomId } from '../utills/common';
import { collection, doc, onSnapshot, orderBy, query, where, limit } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

const DEFAULT_PROFILE_IMAGE = require('../../assets/images/PrifileDemo.png');

export default function ChatItem({ chat, onPress, currentUser, index = 0, animationDelay = 0 }) {
    const opacityAnim = useRef(new Animated.Value(0)).current;
    const translateYAnim = useRef(new Animated.Value(20)).current;
    
    // Animation effect
    useEffect(() => {
        Animated.parallel([
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 500,
                delay: animationDelay,
                useNativeDriver: true,
            }),
            Animated.timing(translateYAnim, {
                toValue: 0,
                duration: 500,
                delay: animationDelay,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);
    
    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (onPress) onPress(chat);
    };
    
    // Format the timestamp
    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        
        try {
            let messageDate;
            if (timestamp.toDate && typeof timestamp.toDate === 'function') {
                messageDate = timestamp.toDate();
            } else if (timestamp instanceof Date) {
                messageDate = timestamp;
            } else if (typeof timestamp === 'number') {
                messageDate = new Date(timestamp);
            } else {
                return '';
            }
            
            const now = new Date();
            
            // Same day - show time
            if (messageDate.toDateString() === now.toDateString()) {
                return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            
            // Within last 7 days - show day of week
            const diffDays = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));
            if (diffDays < 7) {
                return messageDate.toLocaleDateString([], { weekday: 'short' });
            }
            
            // Older - show date
            return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
        } catch (error) {
            console.log('Error formatting time:', error);
            return '';
        }
    };
    
    // Extract last message
    const getLastMessage = () => {
        if (!chat) return '';
        
        if (typeof chat.lastMessage === 'string') {
            return chat.lastMessage;
        }
        
        // Handle object type lastMessage
        if (chat.lastMessage && typeof chat.lastMessage === 'object') {
            if (chat.lastMessage.text) {
                return typeof chat.lastMessage.text === 'string' 
                    ? chat.lastMessage.text 
                    : JSON.stringify(chat.lastMessage.text);
            }
            
            // Try to find text content in any format
            const possibleTextFields = ['text', 'content', 'message', 'body'];
            for (const field of possibleTextFields) {
                if (chat.lastMessage[field] && typeof chat.lastMessage[field] === 'string') {
                    return chat.lastMessage[field];
                }
            }
        }
        
        return 'Start a conversation...';
    };
    
    // Determine if the message is unread
    const isUnread = chat.unreadCount && chat.unreadCount > 0;
    
    // Get chat name
    const getChatName = () => {
        if (!chat) return 'Unknown User';
        
        if (chat.name) {
            return typeof chat.name === 'string' ? chat.name : 'Unknown User';
        }
        
        if (chat.otherUser?.name) {
            return typeof chat.otherUser.name === 'string' ? chat.otherUser.name : 'Unknown User';
        }
        
        if (chat.fullName) {
            return typeof chat.fullName === 'string' ? chat.fullName : 'Unknown User';
        }
        
        return 'Unknown User';
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: opacityAnim,
                    transform: [{ translateY: translateYAnim }],
                }
            ]}
        >
            <TouchableOpacity
                style={styles.chatItem}
                onPress={handlePress}
                activeOpacity={0.8}
            >
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                    {chat.photoURL ? (
                        <Image source={{ uri: chat.photoURL }} style={styles.avatar} />
                    ) : (
                        <LinearGradient
                            colors={['#6366f1', '#8b5cf6']}
                            style={styles.avatar}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <Text style={styles.avatarText}>
                                {getChatName().charAt(0).toUpperCase()}
                    </Text>
                        </LinearGradient>
                    )}
                    
                    {chat.online && (
                        <View style={styles.onlineIndicator} />
                    )}
                </View>
                
                {/* Chat details */}
                <View style={styles.contentContainer}>
                    <View style={styles.headerRow}>
                        <Text 
                            style={[styles.nameText, isUnread && styles.unreadName]} 
                            numberOfLines={1}
                        >
                            {getChatName()}
                        </Text>
                        <Text style={[styles.timeText, isUnread && styles.unreadTime]}>
                            {formatTime(chat.timestamp || chat.lastMessageTimestamp)}
                        </Text>
                    </View>
                    
                    <View style={styles.messageRow}>
                        <Text 
                            style={[styles.messageText, isUnread && styles.unreadMessage]} 
                            numberOfLines={1}
                        >
                            {getLastMessage()}
                        </Text>
                        
                        {isUnread && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadCount}>
                                    {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                                </Text>
                            </View>
                        )}
                    </View>
            </View>
        </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 8,
        borderRadius: 12,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    chatItem: {
        flexDirection: 'row',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    onlineIndicator: {
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#10b981',
        borderWidth: 2,
        borderColor: 'white',
        bottom: 0,
        right: 0,
    },
    contentContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    nameText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#1f2937',
        flex: 1,
    },
    unreadName: {
        fontWeight: '700',
        color: '#111827',
    },
    timeText: {
        fontSize: 12,
        color: '#9ca3af',
        marginLeft: 8,
    },
    unreadTime: {
        color: '#6366f1',
        fontWeight: '600',
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    messageText: {
        fontSize: 14,
        color: '#6b7280',
        flex: 1,
        marginRight: 8,
    },
    unreadMessage: {
        color: '#4b5563',
        fontWeight: '500',
    },
    unreadBadge: {
        backgroundColor: '#4f46e5',
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
    },
    unreadCount: {
        color: 'white',
        fontSize: 11,
        fontWeight: 'bold',
    },
});