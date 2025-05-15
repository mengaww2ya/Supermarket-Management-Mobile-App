import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MAX_WIDTH = SCREEN_WIDTH * 0.65;

const ImageBubble = ({ imageUrl, isOutgoing, onPress }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [fullscreenVisible, setFullscreenVisible] = useState(false);
    const [downloadLoading, setDownloadLoading] = useState(false);
    const [imageSize, setImageSize] = useState({ width: MAX_WIDTH, height: MAX_WIDTH });

    useEffect(() => {
        // Get image dimensions when URL changes
        if (imageUrl) {
            Image.getSize(imageUrl,
                (width, height) => {
                    // Calculate aspect ratio
                    const aspectRatio = width / height;
                    let newWidth = MAX_WIDTH;
                    let newHeight = MAX_WIDTH / aspectRatio;

                    // Limit height to reasonable size
                    if (newHeight > 300) {
                        newHeight = 300;
                        newWidth = newHeight * aspectRatio;
                    }

                    setImageSize({ width: newWidth, height: newHeight });
                },
                (error) => {
                    console.log("Error getting image size:", error);
                    setImageSize({ width: MAX_WIDTH, height: 200 });
                }
            );
        }
    }, [imageUrl]);

    const handleImageLoad = () => {
        setLoading(false);
    };

    const handleImageError = () => {
        setLoading(false);
        setError(true);
    };

    const handleImagePress = () => {
        if (!error && !loading && onPress) {
            onPress();
        } else if (!error && !loading) {
            setFullscreenVisible(true);
        }
    };

    const closeFullscreen = () => {
        setFullscreenVisible(false);
    };

    const downloadImage = async () => {
        try {
            setDownloadLoading(true);

            // Request permissions
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                alert('Sorry, we need media library permissions to save the image');
                setDownloadLoading(false);
                return;
            }

            // Download the image
            const fileName = imageUrl.split('/').pop() || 'image.jpg';
            const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

            const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);

            if (downloadResult.status === 200) {
                // Save to media library
                const asset = await MediaLibrary.createAssetAsync(fileUri);
                await MediaLibrary.createAlbumAsync('Chat Images', asset, false);
                alert('Image saved to gallery');
            } else {
                alert('Failed to download image');
            }
        } catch (error) {
            console.error('Error downloading image:', error);
            alert('Error saving image');
        } finally {
            setDownloadLoading(false);
        }
    };

    const shareImage = async () => {
        try {
            setDownloadLoading(true);

            // Download the image
            const fileName = imageUrl.split('/').pop() || 'image.jpg';
            const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

            const downloadResult = await FileSystem.downloadAsync(imageUrl, fileUri);

            if (downloadResult.status === 200) {
                // Share the image
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(fileUri);
                } else {
                    alert('Sharing is not available on this device');
                }
            } else {
                alert('Failed to download image for sharing');
            }
        } catch (error) {
            console.error('Error sharing image:', error);
            alert('Error sharing image');
        } finally {
            setDownloadLoading(false);
        }
    };

    return (
        <View style={[styles.container, isOutgoing ? styles.outgoingContainer : styles.incomingContainer]}>
            <TouchableOpacity
                onPress={handleImagePress}
                activeOpacity={0.9}
                disabled={loading || error}
            >
                <View style={[
                    styles.imageBubble,
                    isOutgoing ? styles.outgoing : styles.incoming,
                    (loading || error) && styles.loadingContainer
                ]}>
                    {loading && (
                        <ActivityIndicator
                            size="small"
                            color={isOutgoing ? "#ffffff" : "#3B82F6"}
                            style={styles.loader}
                        />
                    )}

                    {error ? (
                        <View style={styles.errorContainer}>
                            <Ionicons name="image-outline" size={40} color={isOutgoing ? "#ffffff" : "#3B82F6"} />
                            <Ionicons name="alert-circle" size={16} color="#FF3B30" style={styles.errorIcon} />
                        </View>
                    ) : (
                        <Image
                            source={{ uri: imageUrl }}
                            style={[styles.image, { width: imageSize.width, height: imageSize.height }]}
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                            resizeMode="cover"
                        />
                    )}
                </View>
            </TouchableOpacity>

            <Modal
                visible={fullscreenVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={closeFullscreen}
            >
                <View style={styles.fullscreenModal}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={closeFullscreen}
                    >
                        <Ionicons name="close" size={28} color="#ffffff" />
                    </TouchableOpacity>

                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.fullscreenImage}
                        resizeMode="contain"
                    />

                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={downloadImage}
                            disabled={downloadLoading}
                        >
                            {downloadLoading ? (
                                <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                                <Ionicons name="download-outline" size={24} color="#ffffff" />
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={shareImage}
                            disabled={downloadLoading}
                        >
                            <Ionicons name="share-outline" size={24} color="#ffffff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 2,
        maxWidth: MAX_WIDTH,
    },
    outgoingContainer: {
        alignSelf: 'flex-end',
    },
    incomingContainer: {
        alignSelf: 'flex-start',
    },
    imageBubble: {
        borderRadius: 16,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    outgoing: {
        backgroundColor: '#3B82F6',
    },
    incoming: {
        backgroundColor: '#F2F2F7',
    },
    image: {
        borderRadius: 16,
    },
    loadingContainer: {
        width: MAX_WIDTH,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loader: {
        position: 'absolute',
        zIndex: 2,
    },
    errorContainer: {
        width: MAX_WIDTH,
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    errorIcon: {
        position: 'absolute',
        bottom: 40,
        right: MAX_WIDTH / 2 - 20,
    },
    fullscreenModal: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullscreenImage: {
        width: SCREEN_WIDTH,
        height: SCREEN_WIDTH,
        flex: 1,
    },
    closeButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 20,
        padding: 5,
    },
    actionButtons: {
        position: 'absolute',
        bottom: 40,
        flexDirection: 'row',
        zIndex: 10,
    },
    actionButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 25,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 10,
    }
});

export default ImageBubble;