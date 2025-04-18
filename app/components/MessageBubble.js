import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import ReadReceiptIndicator from './ReadReceiptIndicator';

export default function MessageBubble({
    message,
    isOwn,
    onImagePress,
    onLongPress,
}) {
    const {
        text,
        timestamp,
        image,
        status = 'sent',
        senderName,
        senderImage,
    } = message;

    const renderContent = () => {
        return (
            <View style={[styles.contentContainer, isOwn ? styles.ownContent : styles.otherContent]}>
                {!isOwn && senderName && (
                    <Text style={styles.senderName}>{senderName}</Text>
                )}

                {image && (
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => onImagePress && onImagePress(image)}
                    >
                        <Image source={{ uri: image }} style={styles.image} />
                    </TouchableOpacity>
                )}

                {text && <Text style={styles.text}>{text}</Text>}

                <View style={styles.metadataContainer}>
                    <ReadReceiptIndicator
                        status={isOwn ? status : null}
                        timestamp={timestamp}
                    />
                </View>
            </View>
        );
    };

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            style={[
                styles.container,
                isOwn ? styles.ownContainer : styles.otherContainer,
            ]}
            onLongPress={onLongPress}
        >
            {!isOwn && senderImage && (
                <Image source={{ uri: senderImage }} style={styles.avatar} />
            )}
            {renderContent()}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        maxWidth: '80%',
        marginVertical: 4,
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    ownContainer: {
        alignSelf: 'flex-end',
        marginRight: 8,
    },
    otherContainer: {
        alignSelf: 'flex-start',
        marginLeft: 8,
    },
    contentContainer: {
        borderRadius: 16,
        padding: 12,
        overflow: 'hidden',
    },
    ownContent: {
        backgroundColor: '#3B82F6',
    },
    otherContent: {
        backgroundColor: '#F3F4F6',
    },
    senderName: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 4,
        color: '#4B5563',
    },
    text: {
        fontSize: 16,
        color: '#1F2937',
    },
    image: {
        width: 200,
        height: 150,
        borderRadius: 8,
        marginBottom: 8,
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        marginRight: 8,
    },
    metadataContainer: {
        alignSelf: 'flex-end',
        marginTop: 4,
    },
}); 