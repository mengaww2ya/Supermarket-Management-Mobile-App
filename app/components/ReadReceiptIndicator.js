import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ReadReceiptIndicator({ status, timestamp, style }) {
    // Message statuses: 'sent', 'delivered', 'read'

    const renderIcon = () => {
        switch (status) {
            case 'sent':
                return <Ionicons name="checkmark" size={14} color="#9CA3AF" />;
            case 'delivered':
                return <Ionicons name="checkmark-done" size={14} color="#9CA3AF" />;
            case 'read':
                return <Ionicons name="checkmark-done" size={14} color="#3B82F6" />;
            default:
                return <Ionicons name="time-outline" size={14} color="#9CA3AF" />;
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';

        const date = timestamp instanceof Date
            ? timestamp
            : new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);

        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <View style={[styles.container, style]}>
            {timestamp && (
                <Text style={styles.timestamp}>{formatTime(timestamp)}</Text>
            )}
            {renderIcon()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        marginTop: 2,
    },
    timestamp: {
        fontSize: 10,
        color: '#9CA3AF',
        marginRight: 4,
    },
}); 