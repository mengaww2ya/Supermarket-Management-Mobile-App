import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { format } from 'date-fns';

export default function ChatItem({ message, isFromCurrentUser, showAvatar, userProfile }) {
    const formatMessageTime = (timestamp) => {
        if (!timestamp) return '';

        try {
            return format(new Date(timestamp), 'h:mm a');
        } catch (error) {
            console.error('Error formatting date:', error);
            return '';
        }
    };

    const avatarSource = userProfile?.photoURL
        ? { uri: userProfile.photoURL }
        : null;

    const getInitial = () => {
        if (userProfile?.name) return userProfile.name.charAt(0).toUpperCase();
        if (userProfile?.fullName) return userProfile.fullName.charAt(0).toUpperCase();
        if (userProfile?.firstName) return userProfile.firstName.charAt(0).toUpperCase();
        return 'U';
    };

    return (
        <View style={[
            styles.messageRow,
            isFromCurrentUser ? styles.messageRowRight : styles.messageRowLeft
        ]}>
            {!isFromCurrentUser && showAvatar ? (
                <View style={styles.avatarContainer}>
                    {avatarSource ? (
                        <Image source={avatarSource} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Text style={styles.avatarText}>{getInitial()}</Text>
                        </View>
                    )}
                </View>
            ) : !isFromCurrentUser ? (
                <View style={styles.spacer} />
            ) : null}

            <View style={[
                styles.messageBubble,
                isFromCurrentUser ? styles.messageBubbleRight : styles.messageBubbleLeft
            ]}>
                <Text style={[
                    styles.messageText,
                    isFromCurrentUser ? styles.messageTextRight : styles.messageTextLeft
                ]}>
                    {message.text}
                </Text>

                <Text style={[
                    styles.messageTime,
                    isFromCurrentUser ? styles.messageTimeRight : styles.messageTimeLeft
                ]}>
                    {formatMessageTime(message.timestamp)}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    messageRow: {
        flexDirection: 'row',
        marginBottom: 12,
        alignItems: 'flex-end',
    },
    messageRowLeft: {
        justifyContent: 'flex-start',
    },
    messageRowRight: {
        justifyContent: 'flex-end',
    },
    avatarContainer: {
        marginRight: 8,
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
    },
    avatarPlaceholder: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#4f46e5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    spacer: {
        width: 36,
    },
    messageBubble: {
        maxWidth: '70%',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 16,
    },
    messageBubbleLeft: {
        backgroundColor: '#f3f4f6',
        borderBottomLeftRadius: 4,
    },
    messageBubbleRight: {
        backgroundColor: '#4f46e5',
        borderBottomRightRadius: 4,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
    },
    messageTextLeft: {
        color: '#1f2937',
    },
    messageTextRight: {
        color: 'white',
    },
    messageTime: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    messageTimeLeft: {
        color: '#6b7280',
    },
    messageTimeRight: {
        color: '#e5e7eb',
    },
});