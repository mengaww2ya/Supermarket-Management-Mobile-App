import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth } from '../../../firebase/firebaseConfig';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const ChangePassword = () => {
    const router = useRouter();
    const scrollViewRef = useRef();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!currentPassword) {
            newErrors.currentPassword = 'Current password is required';
        }

        if (!newPassword) {
            newErrors.newPassword = 'New password is required';
        } else if (newPassword.length < 6) {
            newErrors.newPassword = 'Password must be at least 6 characters';
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Please confirm your new password';
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChangePassword = async () => {
        if (!validateForm()) return;

        try {
            setLoading(true);

            // Re-authenticate user
            const user = auth.currentUser;
            const credential = EmailAuthProvider.credential(
                user.email,
                currentPassword
            );

            await reauthenticateWithCredential(user, credential);

            // Update password
            await updatePassword(user, newPassword);

            Alert.alert(
                'Success',
                'Your password has been updated successfully',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error) {
            console.error('Error changing password:', error);

            if (error.code === 'auth/wrong-password') {
                setErrors({ ...errors, currentPassword: 'Incorrect current password' });
            } else {
                Alert.alert('Error', 'Failed to update password. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="light" />

            <View style={styles.headerContainer}>
                <TouchableOpacity
                    style={styles.headerBackButton}
                    onPress={() => router.back()}
                    activeOpacity={0.8}
                >
                    <Ionicons name="arrow-back" size={24} color="#374151" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Change Password</Text>
                <View style={{ width: 40 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    ref={scrollViewRef}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="always"
                >
                    <Animated.View
                        entering={FadeInDown.duration(1000).springify()}
                        style={styles.formContainer}
                    >
                        <View style={styles.sectionContainer}>
                            <View style={styles.sectionHeader}>
                                <MaterialIcons name="lock-outline" size={22} color="#FF6B00" />
                                <Text style={styles.sectionTitle}>Password Information</Text>
                            </View>

                            <Text style={styles.descriptionText}>
                                Please enter your current password and choose a new password.
                            </Text>

                            {/* Current Password Field */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Current Password</Text>
                                <View style={[
                                    styles.inputWrapper,
                                    errors.currentPassword && styles.inputError
                                ]}>
                                    <Ionicons name="lock-closed-outline" size={20} color="#FF6B00" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your current password"
                                        secureTextEntry={!showCurrentPassword}
                                        value={currentPassword}
                                        onChangeText={(text) => {
                                            setCurrentPassword(text);
                                            if (errors.currentPassword) {
                                                setErrors({ ...errors, currentPassword: null });
                                            }
                                        }}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                                        style={styles.eyeIcon}
                                    >
                                        <Ionicons
                                            name={showCurrentPassword ? "eye-off-outline" : "eye-outline"}
                                            size={20}
                                            color="#9CA3AF"
                                        />
                                    </TouchableOpacity>
                                </View>
                                {errors.currentPassword && (
                                    <Text style={styles.errorText}>{errors.currentPassword}</Text>
                                )}
                            </View>

                            {/* New Password Field */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>New Password</Text>
                                <View style={[
                                    styles.inputWrapper,
                                    errors.newPassword && styles.inputError
                                ]}>
                                    <Ionicons name="lock-closed-outline" size={20} color="#FF6B00" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your new password"
                                        secureTextEntry={!showNewPassword}
                                        value={newPassword}
                                        onChangeText={(text) => {
                                            setNewPassword(text);
                                            if (errors.newPassword) {
                                                setErrors({ ...errors, newPassword: null });
                                            }
                                        }}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowNewPassword(!showNewPassword)}
                                        style={styles.eyeIcon}
                                    >
                                        <Ionicons
                                            name={showNewPassword ? "eye-off-outline" : "eye-outline"}
                                            size={20}
                                            color="#9CA3AF"
                                        />
                                    </TouchableOpacity>
                                </View>
                                {errors.newPassword && (
                                    <Text style={styles.errorText}>{errors.newPassword}</Text>
                                )}
                            </View>

                            {/* Confirm Password Field */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Confirm New Password</Text>
                                <View style={[
                                    styles.inputWrapper,
                                    errors.confirmPassword && styles.inputError
                                ]}>
                                    <Ionicons name="lock-closed-outline" size={20} color="#FF6B00" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Confirm your new password"
                                        secureTextEntry={!showConfirmPassword}
                                        value={confirmPassword}
                                        onChangeText={(text) => {
                                            setConfirmPassword(text);
                                            if (errors.confirmPassword) {
                                                setErrors({ ...errors, confirmPassword: null });
                                            }
                                        }}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                        style={styles.eyeIcon}
                                    >
                                        <Ionicons
                                            name={showConfirmPassword ? "eye-off-outline" : "eye-outline"}
                                            size={20}
                                            color="#9CA3AF"
                                        />
                                    </TouchableOpacity>
                                </View>
                                {errors.confirmPassword && (
                                    <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                                )}
                            </View>
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={handleChangePassword}
                            disabled={loading}
                            activeOpacity={0.9}
                        >
                            {loading ? (
                                <ActivityIndicator color="#ffffff" size="small" />
                            ) : (
                                <>
                                    <Feather name="check" size={20} color="#ffffff" />
                                    <Text style={styles.saveButtonText}>Update Password</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    headerBackButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F3F4F6',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#374151',
    },
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 30,
    },
    formContainer: {
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    sectionContainer: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
        marginLeft: 8,
    },
    descriptionText: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
        lineHeight: 20,
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        color: '#4B5563',
        marginBottom: 6,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 54,
    },
    inputError: {
        borderColor: '#EF4444',
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
        paddingVertical: 12,
    },
    eyeIcon: {
        padding: 4,
    },
    errorText: {
        color: '#EF4444',
        fontSize: 12,
        marginTop: 4,
        marginLeft: 4,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FF6B00',
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 8,
        marginBottom: 24,
        shadowColor: "#FF6B00",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    saveButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        marginLeft: 8,
    },
});

export default ChangePassword; 