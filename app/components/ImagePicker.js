import React, { useState, useEffect } from 'react';
import {
    View,
    TouchableOpacity,
    Text,
    StyleSheet,
    Image,
    ActivityIndicator,
    Platform,
    Dimensions,
    Alert
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

const SCREEN_WIDTH = Dimensions.get('window').width;

const ImagePicker = ({ onImageSelected, isLoading = false, initialImage = null, maxSizeMB = 5 }) => {
    const [selectedImage, setSelectedImage] = useState(null);
    const [processingImage, setProcessingImage] = useState(false);

    // Initialize with initialImage if provided
    useEffect(() => {
        if (initialImage) {
            setSelectedImage(initialImage);
        }
    }, [initialImage]);

    const imageOptions = {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1200,
        maxHeight: 1200,
        includeBase64: true,
        selectionLimit: 1,
    };

    // Convert image file size to readable format
    const formatFileSize = (bytes) => {
        if (!bytes) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

    // Process image before passing to parent component
    const processImage = async (imageAsset) => {
        try {
            setProcessingImage(true);

            // Extract file information
            const { uri, type, fileName, fileSize } = imageAsset;

            // Format validation
            const validFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'];
            const fileExtension = (fileName?.split('.').pop() || uri.split('.').pop() || '').toLowerCase();

            if (!validFormats.includes(fileExtension)) {
                Alert.alert(
                    "Unsupported Format",
                    `The image format "${fileExtension}" is not supported. Please select a JPG, PNG, or GIF image.`
                );
                setProcessingImage(false);
                return null;
            }

            // Size validation (MB)
            const sizeInMB = fileSize / (1024 * 1024);

            // If image is too large, compress it
            if (sizeInMB > maxSizeMB) {
                const compressionRatio = Math.min(0.8, maxSizeMB / sizeInMB);

                // Use ImageManipulator to compress the image
                const manipResult = await ImageManipulator.manipulateAsync(
                    uri,
                    [{ resize: { width: 1200 } }],
                    { compress: compressionRatio, format: ImageManipulator.SaveFormat.JPEG }
                );

                // Read as base64 for storage
                const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
                    encoding: FileSystem.EncodingType.Base64,
                });

                const processedImage = {
                    uri: manipResult.uri,
                    name: fileName || `image_${Date.now()}.jpg`,
                    type: 'image/jpeg',
                    base64,
                    width: manipResult.width,
                    height: manipResult.height,
                    size: formatFileSize(manipResult.uri.length * 0.75), // Approximate size calculation
                };

                setProcessingImage(false);
                return processedImage;
            }

            // For smaller images, just read as base64
            const base64 = imageAsset.base64 || await FileSystem.readAsStringAsync(uri, {
                encoding: FileSystem.EncodingType.Base64,
            });

            const processedImage = {
                uri,
                name: fileName || `image_${Date.now()}.${fileExtension}`,
                type: type || `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
                base64,
                size: formatFileSize(fileSize),
            };

            setProcessingImage(false);
            return processedImage;

        } catch (error) {
            console.error('Error processing image:', error);
            setProcessingImage(false);
            Alert.alert(
                "Processing Error",
                "Failed to process the selected image. Please try again."
            );
            return null;
        }
    };

    const handleSelectFromGallery = async () => {
        try {
            const result = await launchImageLibrary(imageOptions);
            if (result.didCancel) {
                console.log('User cancelled image picker');
                return;
            }

            if (result.errorCode) {
                console.log('ImagePicker Error: ', result.errorMessage);
                Alert.alert('Error', result.errorMessage || 'Failed to select image');
                return;
            }

            if (result.assets && result.assets.length > 0) {
                const selectedAsset = result.assets[0];

                // Process image before setting
                const processedImage = await processImage(selectedAsset);
                if (processedImage) {
                    setSelectedImage(processedImage);
                    onImageSelected && onImageSelected(processedImage);
                }
            }
        } catch (error) {
            console.log('Error selecting image:', error);
            Alert.alert('Error', 'Failed to select image from gallery');
        }
    };

    const handleTakePhoto = async () => {
        try {
            const cameraOptions = {
                ...imageOptions,
                saveToPhotos: true,
            };

            const result = await launchCamera(cameraOptions);
            if (result.didCancel) {
                console.log('User cancelled camera');
                return;
            }

            if (result.errorCode) {
                console.log('Camera Error: ', result.errorMessage);
                Alert.alert('Error', result.errorMessage || 'Failed to take photo');
                return;
            }

            if (result.assets && result.assets.length > 0) {
                const selectedAsset = result.assets[0];

                // Process image before setting
                const processedImage = await processImage(selectedAsset);
                if (processedImage) {
                    setSelectedImage(processedImage);
                    onImageSelected && onImageSelected(processedImage);
                }
            }
        } catch (error) {
            console.log('Error taking photo:', error);
            Alert.alert('Error', 'Failed to take photo');
        }
    };

    const handleRemoveImage = () => {
        setSelectedImage(null);
        onImageSelected && onImageSelected(null);
    };

    // Render a preview with image format and size info
    const renderPreview = () => {
        return (
            <View style={styles.previewContainer}>
                <Image
                    source={{ uri: selectedImage.uri }}
                    style={styles.previewImage}
                    resizeMode="cover"
                />
                <View style={styles.imageInfoOverlay}>
                    <Text style={styles.imageInfoText}>
                        {selectedImage.type?.split('/')[1]?.toUpperCase() || 'IMAGE'} • {selectedImage.size || ''}
                    </Text>
                </View>
                <TouchableOpacity
                    style={styles.removeButton}
                    onPress={handleRemoveImage}
                    disabled={isLoading}
                >
                    <Ionicons name="close-circle" size={28} color="#FF3B30" />
                </TouchableOpacity>
                {(isLoading || processingImage) && (
                    <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#3B82F6" />
                        <Text style={styles.loadingText}>
                            {processingImage ? 'Processing...' : 'Loading...'}
                        </Text>
                    </View>
                )}
            </View>
        );
    };

    // Render selection buttons with a more modern UI
    const renderSelectionButtons = () => {
        return (
            <View style={styles.buttonContainer}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={handleSelectFromGallery}
                    disabled={isLoading || processingImage}
                >
                    <View style={styles.buttonIconContainer}>
                        <Ionicons name="images" size={28} color="#3B82F6" />
                    </View>
                    <View style={styles.buttonTextContainer}>
                        <Text style={styles.buttonTitle}>Gallery</Text>
                        <Text style={styles.buttonSubtext}>Select from your photos</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleTakePhoto}
                    disabled={isLoading || processingImage}
                >
                    <View style={styles.buttonIconContainer}>
                        <Ionicons name="camera" size={28} color="#3B82F6" />
                    </View>
                    <View style={styles.buttonTextContainer}>
                        <Text style={styles.buttonTitle}>Camera</Text>
                        <Text style={styles.buttonSubtext}>Take a new photo</Text>
                    </View>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            {(isLoading || processingImage) && !selectedImage && (
                <View style={styles.globalLoadingContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>
                        {processingImage ? 'Processing image...' : 'Loading...'}
                    </Text>
                </View>
            )}

            {!isLoading && !processingImage && (
                <View style={styles.infoContainer}>
                    <MaterialCommunityIcons name="information-outline" size={16} color="#6B7280" />
                    <Text style={styles.infoText}>
                        Supported: JPG, PNG, GIF (Max {maxSizeMB}MB)
                    </Text>
                </View>
            )}

            {selectedImage ? renderPreview() : renderSelectionButtons()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginVertical: 15,
        borderRadius: 12,
        overflow: 'hidden',
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
        paddingHorizontal: 10,
    },
    infoText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 4,
    },
    buttonContainer: {
        width: '100%',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 16,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    buttonIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    buttonTextContainer: {
        flex: 1,
    },
    buttonTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 4,
    },
    buttonSubtext: {
        fontSize: 13,
        color: '#6B7280',
    },
    previewContainer: {
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 5,
    },
    previewImage: {
        width: '100%',
        height: 240,
        borderRadius: 12,
    },
    imageInfoOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
    },
    imageInfoText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '500',
    },
    removeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    globalLoadingContainer: {
        padding: 30,
        borderRadius: 12,
        backgroundColor: '#F9FAFB',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 14,
        color: '#374151',
        fontWeight: '500',
    },
});

export default ImagePicker; 