import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, ActivityIndicator, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const DocumentBubble = ({ documentUrl, documentName, isOutgoing, fileSize }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [confirmModal, setConfirmModal] = useState(false);

    const getFileExtension = () => {
        if (!documentName) return 'document';

        const parts = documentName.split('.');
        if (parts.length > 1) {
            return parts[parts.length - 1].toLowerCase();
        }
        return 'document';
    };

    const getFileIcon = () => {
        const extension = getFileExtension();

        if (['pdf'].includes(extension)) {
            return 'document-text-outline';
        } else if (['doc', 'docx'].includes(extension)) {
            return 'document-outline';
        } else if (['xls', 'xlsx'].includes(extension)) {
            return 'grid-outline';
        } else if (['ppt', 'pptx'].includes(extension)) {
            return 'easel-outline';
        } else if (['zip', 'rar'].includes(extension)) {
            return 'folder-outline';
        } else {
            return 'document-attach-outline';
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes || isNaN(bytes)) return '';

        if (bytes < 1024) {
            return bytes + ' B';
        } else if (bytes < 1024 * 1024) {
            return (bytes / 1024).toFixed(1) + ' KB';
        } else {
            return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        }
    };

    const downloadAndOpenDocument = async () => {
        setConfirmModal(false);
        setLoading(true);
        setError(false);

        try {
            const localUri = `${FileSystem.cacheDirectory}${documentName || 'document'}`;

            const downloadResult = await FileSystem.downloadAsync(
                documentUrl,
                localUri
            );

            if (downloadResult.status === 200) {
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(localUri);
                } else {
                    await Linking.openURL(documentUrl);
                }
            } else {
                setError(true);
                console.error('Error downloading document:', downloadResult);
            }
        } catch (error) {
            setError(true);
            console.error('Error opening document:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePress = () => {
        setConfirmModal(true);
    };

    return (
        <View style={[styles.container, isOutgoing ? styles.outgoingContainer : styles.incomingContainer]}>
            <TouchableOpacity
                style={[styles.documentBubble, isOutgoing ? styles.outgoing : styles.incoming]}
                onPress={handlePress}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color={isOutgoing ? "#fff" : "#3B82F6"} size="small" />
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={24} color={isOutgoing ? "#fff" : "#ff3b30"} />
                        <Text style={[styles.errorText, isOutgoing && styles.outgoingText]}>Failed to load</Text>
                    </View>
                ) : (
                    <View style={styles.documentContent}>
                        <View style={styles.iconContainer}>
                            <Ionicons name={getFileIcon()} size={30} color={isOutgoing ? "#fff" : "#3B82F6"} />
                        </View>
                        <View style={styles.textContainer}>
                            <Text
                                style={[styles.documentName, isOutgoing && styles.outgoingText]}
                                numberOfLines={1}
                                ellipsizeMode="middle"
                            >
                                {documentName || 'Document'}
                            </Text>
                            <Text style={[styles.documentInfo, isOutgoing && styles.outgoingText]}>
                                {getFileExtension().toUpperCase()} {fileSize ? `• ${formatFileSize(fileSize)}` : ''}
                            </Text>
                        </View>
                    </View>
                )}
            </TouchableOpacity>

            <Modal
                visible={confirmModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setConfirmModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setConfirmModal(false)}
                >
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Open Document</Text>
                        <Text style={styles.modalMessage}>
                            Do you want to download and open "{documentName || 'Document'}"?
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setConfirmModal(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={downloadAndOpenDocument}
                            >
                                <Text style={styles.confirmButtonText}>Open</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        maxWidth: '80%',
        marginVertical: 2,
    },
    outgoingContainer: {
        alignSelf: 'flex-end',
    },
    incomingContainer: {
        alignSelf: 'flex-start',
    },
    documentBubble: {
        borderRadius: 16,
        padding: 10,
        minWidth: 200,
    },
    outgoing: {
        backgroundColor: '#3B82F6',
    },
    incoming: {
        backgroundColor: '#F2F2F7',
    },
    outgoingText: {
        color: '#fff',
    },
    documentContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        marginRight: 12,
    },
    textContainer: {
        flex: 1,
    },
    documentName: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000',
        marginBottom: 2,
    },
    documentInfo: {
        fontSize: 12,
        color: '#666',
    },
    errorContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
    },
    errorText: {
        marginTop: 5,
        fontSize: 12,
        color: '#ff3b30',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 14,
        padding: 20,
        width: '80%',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    modalMessage: {
        fontSize: 14,
        textAlign: 'center',
        marginBottom: 20,
        color: '#666',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        flex: 1,
        marginHorizontal: 5,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#F2F2F7',
    },
    confirmButton: {
        backgroundColor: '#3B82F6',
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#666',
    },
    confirmButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: 'white',
    },
});

export default DocumentBubble; 