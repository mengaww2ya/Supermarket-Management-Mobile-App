import React, { useState, useRef } from 'react';
import {
    View,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Platform,
    ActivityIndicator,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function ChatInput({
    onSend,
    isLoading = false,
    placeholder = 'Type a message...',
}) {
    const [message, setMessage] = useState('');
    const [image, setImage] = useState(null);
    const inputRef = useRef(null);

    const handleSend = () => {
        if ((message.trim() || image) && !isLoading) {
            onSend({ text: message.trim(), image });
            setMessage('');
            setImage(null);
        }
    };

    const pickImage = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                setImage(result.assets[0].uri);
            }
        } catch (error) {
            console.log('Error picking image:', error);
        }
    };

    const removeImage = () => {
        setImage(null);
    };

    return (
        <View style={styles.container}>
            {image && (
                <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: image }} style={styles.imagePreview} />
                    <TouchableOpacity style={styles.removeButton} onPress={removeImage}>
                        <Ionicons name="close-circle" size={24} color="#FF4D4F" />
                    </TouchableOpacity>
                </View>
            )}

            <View style={styles.inputContainer}>
                <TouchableOpacity style={styles.attachButton} onPress={pickImage}>
                    <Ionicons name="attach" size={24} color="#6B7280" />
                </TouchableOpacity>

                <TextInput
                    ref={inputRef}
                    value={message}
                    onChangeText={setMessage}
                    style={styles.input}
                    placeholder={placeholder}
                    placeholderTextColor="#9CA3AF"
                    multiline
                    maxHeight={100}
                    onSubmitEditing={handleSend}
                />

                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        (!message.trim() && !image) || isLoading ? styles.sendButtonDisabled : {}
                    ]}
                    onPress={handleSend}
                    disabled={(!message.trim() && !image) || isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                        <Ionicons name="send" size={20} color="#FFFFFF" />
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        fontSize: 16,
        backgroundColor: '#F9FAFB',
        maxHeight: 100,
    },
    attachButton: {
        marginRight: 8,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButton: {
        marginLeft: 8,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#3B82F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#93C5FD',
    },
    imagePreviewContainer: {
        position: 'relative',
        marginBottom: 8,
        alignSelf: 'flex-start',
    },
    imagePreview: {
        width: 100,
        height: 100,
        borderRadius:
            12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    removeButton: {
        position: 'absolute',
        top: -10,
        right: -10,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
    },
}); 