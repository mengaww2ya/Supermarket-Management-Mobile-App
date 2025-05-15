import React, { useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function AttachmentBubble({ imageUrl, isOutgoing, onPress }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    const handleImageLoad = () => {
        setLoading(false);
        setError(false);
    };

    const handleImageError = () => {
        setLoading(false);
        setError(true);
    };

    const openFullScreenImage = () => {
        if (!error) {
            setModalVisible(true);
        }
    };

    return (
        <View>
            <TouchableOpacity
                onPress={openFullScreenImage}
                style={[
                    styles.container,
                    isOutgoing ? styles.outgoingContainer : styles.incomingContainer
                ]}
            >
                {loading && (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="small" color="#3B82F6" />
                    </View>
                )}

                {error ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={24} color="#EF4444" />
                    </View>
                ) : (
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.image}
                        onLoad={handleImageLoad}
                        onError={handleImageError}
                        resizeMode="cover"
                    />
                )}
            </TouchableOpacity>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalContainer}
                    activeOpacity={1}
                    onPress={() => setModalVisible(false)}
                >
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.fullScreenImage}
                        resizeMode="contain"
                    />

                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => setModalVisible(false)}
                    >
                        <Ionicons name="close-circle" size={36} color="white" />
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        maxWidth: 200,
        borderRadius: 12,
        overflow: 'hidden',
        marginVertical: 2,
        backgroundColor: '#E5E7EB',
    },
    outgoingContainer: {
        backgroundColor: '#DBEAFE',
        borderBottomRightRadius: 4,
    },
    incomingContainer: {
        backgroundColor: '#E5E7EB',
        borderBottomLeftRadius: 4,
    },
    image: {
        width: 200,
        height: 150,
        backgroundColor: '#F3F4F6',
    },
    loaderContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
        backgroundColor: 'rgba(243, 244, 246, 0.7)',
    },
    errorContainer: {
        width: 200,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenImage: {
        width: '100%',
        height: '80%',
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 20,
    },
}); 