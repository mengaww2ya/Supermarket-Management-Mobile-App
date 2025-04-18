import React, { useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

const FileAttachmentButton = ({ onFileSelected, isUploading }) => {
    const [menuVisible, setMenuVisible] = useState(false);

    const toggleMenu = () => {
        setMenuVisible(!menuVisible);
    };

    const pickImage = async () => {
        setMenuVisible(false);

        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (permissionResult.granted === false) {
                alert("Permission to access camera roll is required!");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const selectedImage = result.assets[0];
                onFileSelected(selectedImage.uri, 'image');
            }
        } catch (error) {
            console.error("Error picking image:", error);
            alert("Failed to select image. Please try again.");
        }
    };

    const takePhoto = async () => {
        setMenuVisible(false);

        try {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

            if (permissionResult.granted === false) {
                alert("Permission to access camera is required!");
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const capturedImage = result.assets[0];
                onFileSelected(capturedImage.uri, 'image');
            }
        } catch (error) {
            console.error("Error taking photo:", error);
            alert("Failed to capture image. Please try again.");
        }
    };

    const pickDocument = async () => {
        setMenuVisible(false);

        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: Platform.OS === 'ios' ? '*/*' : ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
                copyToCacheDirectory: true,
            });

            if (result.canceled === false && result.assets && result.assets.length > 0) {
                const document = result.assets[0];
                onFileSelected(document.uri, 'document', document.name || 'Document');
            }
        } catch (error) {
            console.error("Error picking document:", error);
            alert("Failed to select document. Please try again.");
        }
    };

    return (
        <View style={styles.container}>
            {isUploading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#3B82F6" />
                </View>
            ) : (
                <TouchableOpacity
                    style={styles.attachButton}
                    onPress={toggleMenu}
                    activeOpacity={0.7}
                >
                    <Ionicons name="attach" size={24} color="#3B82F6" />
                </TouchableOpacity>
            )}

            {menuVisible && (
                <View style={styles.menu}>
                    <TouchableOpacity style={styles.menuItem} onPress={pickImage}>
                        <Ionicons name="image-outline" size={20} color="#3B82F6" />
                        <Text style={styles.menuText}>Gallery</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={takePhoto}>
                        <Ionicons name="camera-outline" size={20} color="#3B82F6" />
                        <Text style={styles.menuText}>Camera</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={pickDocument}>
                        <Ionicons name="document-outline" size={20} color="#3B82F6" />
                        <Text style={styles.menuText}>Document</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    attachButton: {
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        padding: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menu: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        backgroundColor: 'white',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 5,
        padding: 5,
        width: 140,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
    },
    menuText: {
        marginLeft: 10,
        color: '#333',
        fontSize: 14,
    },
});

export default FileAttachmentButton; 