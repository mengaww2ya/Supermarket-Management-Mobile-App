import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Animated as RNAnimated,
    Easing,
} from 'react-native';
import { useAuth } from '../context/authContext';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const { resetPassword, loading } = useAuth();
    const router = useRouter();
    const [shakeAnim] = useState(new RNAnimated.Value(0));

    const handleResetPassword = async () => {
        try {
            setError('');
            if (!email || email.trim().length === 0) {
                setError('Please enter your email address');
                RNAnimated.sequence([
                    RNAnimated.timing(shakeAnim, {
                        toValue: 10,
                        duration: 100,
                        useNativeDriver: true,
                    }),
                    RNAnimated.timing(shakeAnim, {
                        toValue: -10,
                        duration: 100,
                        useNativeDriver: true,
                    }),
                    RNAnimated.timing(shakeAnim, {
                        toValue: 10,
                        duration: 100,
                        useNativeDriver: true,
                    }),
                    RNAnimated.timing(shakeAnim, {
                        toValue: 0,
                        duration: 100,
                        useNativeDriver: true,
                    }),
                ]).start();
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                setError('Please enter a valid email address');
                RNAnimated.sequence([
                    RNAnimated.timing(shakeAnim, {
                        toValue: 10,
                        duration: 100,
                        useNativeDriver: true,
                    }),
                    RNAnimated.timing(shakeAnim, {
                        toValue: -10,
                        duration: 100,
                        useNativeDriver: true,
                    }),
                    RNAnimated.timing(shakeAnim, {
                        toValue: 10,
                        duration: 100,
                        useNativeDriver: true,
                    }),
                    RNAnimated.timing(shakeAnim, {
                        toValue: 0,
                        duration: 100,
                        useNativeDriver: true,
                    }),
                ]).start();
                return;
            }

            await resetPassword(email);
            setSuccess(true);
        } catch (error) {
            setError(error.message || 'An error occurred. Please try again.');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <LinearGradient
                colors={['#22C55E', '#10B981']}
                style={styles.gradientHeader}
            >
                <Animated.View entering={FadeInDown.duration(1000).springify()} style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Ionicons name="arrow-back" size={24} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Reset Password</Text>
                </Animated.View>
            </LinearGradient>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <Animated.View
                        entering={FadeInUp.delay(200).duration(1000).springify()}
                        style={styles.formContainer}
                    >
                        {success ? (
                            <View style={styles.successContainer}>
                                <Animated.View
                                    entering={FadeInUp.duration(1000).springify()}
                                >
                                    <Ionicons name="checkmark-circle" size={80} color="#22C55E" />
                                </Animated.View>
                                <Text style={styles.successText}>
                                    Password reset email has been sent!
                                </Text>
                                <Text style={styles.successSubText}>
                                    Please check your inbox and follow the instructions to reset your password.
                                </Text>
                                <TouchableOpacity
                                    style={styles.loginButton}
                                    onPress={() => router.push('/(auth)/login')}
                                >
                                    <Text style={styles.loginButtonText}>Back to Login</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <>
                                <Text style={styles.description}>
                                    Enter your email address and we'll send you instructions to reset your password.
                                </Text>
                                <RNAnimated.View
                                    style={[
                                        styles.inputContainer,
                                        {
                                            transform: [
                                                {
                                                    translateX: shakeAnim.interpolate({
                                                        inputRange: [-10, 0, 10],
                                                        outputRange: [-10, 0, 10]
                                                    })
                                                }
                                            ]
                                        }
                                    ]}
                                >
                                    <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your email"
                                        placeholderTextColor="#999"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </RNAnimated.View>
                                {error ? (
                                    <Animated.View entering={FadeInDown.duration(500)}>
                                        <Text style={styles.errorText}>{error}</Text>
                                    </Animated.View>
                                ) : null}
                                <TouchableOpacity
                                    style={styles.resetButton}
                                    onPress={handleResetPassword}
                                    disabled={loading}
                                >
                                    <LinearGradient
                                        colors={['#22C55E', '#10B981']}
                                        style={styles.gradientButton}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color="#fff" />
                                        ) : (
                                            <Text style={styles.resetButtonText}>Send Reset Link</Text>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>
                            </>
                        )}
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    gradientHeader: {
        paddingTop: 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    keyboardView: {
        flex: 1,
    },
    scrollContainer: {
        flexGrow: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 30,
        paddingHorizontal: 20,
    },
    backButton: {
        padding: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginLeft: 10,
        color: '#fff',
    },
    formContainer: {
        flex: 1,
        justifyContent: 'center',
        marginTop: 20,
    },
    description: {
        fontSize: 16,
        color: '#666',
        marginBottom: 30,
        textAlign: 'center',
        lineHeight: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 15,
        marginBottom: 20,
        paddingHorizontal: 15,
        height: 55,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    errorText: {
        color: '#ff3b30',
        marginBottom: 20,
        textAlign: 'center',
        fontSize: 14,
    },
    resetButton: {
        borderRadius: 15,
        overflow: 'hidden',
        marginTop: 10,
    },
    gradientButton: {
        padding: 15,
        alignItems: 'center',
    },
    resetButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    successContainer: {
        alignItems: 'center',
        padding: 20,
    },
    successText: {
        fontSize: 20,
        color: '#333',
        textAlign: 'center',
        marginTop: 20,
        marginBottom: 10,
        fontWeight: 'bold',
    },
    successSubText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 20,
    },
    loginButton: {
        backgroundColor: '#22C55E',
        padding: 15,
        borderRadius: 15,
        width: '100%',
        alignItems: 'center',
    },
    loginButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
}); 