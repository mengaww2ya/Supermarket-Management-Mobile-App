import React, { useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Animated,
    KeyboardAvoidingView,
    Platform,
    Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from 'react-native-elements';
import { useAuth } from '../context/authContext';
import * as Animatable from 'react-native-animatable';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(50));
    const router = useRouter();
    const { resetPassword } = useAuth();
    const bubble1Anim = useRef(new Animated.Value(0)).current;
    const bubble2Anim = useRef(new Animated.Value(0)).current;
    const bubble3Anim = useRef(new Animated.Value(0)).current;
    const bubble4Anim = useRef(new Animated.Value(0)).current;

    React.useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true,
            }),
        ]).start();

        // Start bubble animations
        const startBubbleAnimation = (anim) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(anim, {
                        toValue: 1,
                        duration: 3000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(anim, {
                        toValue: 0,
                        duration: 3000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };

        startBubbleAnimation(bubble1Anim);
        startBubbleAnimation(bubble2Anim);
        startBubbleAnimation(bubble3Anim);
        startBubbleAnimation(bubble4Anim);
    }, []);

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert('Error', 'Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            await resetPassword(email);
            Alert.alert(
                'Success',
                'Password reset email sent. Please check your inbox.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-100">
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <View className="bg-green-500 p-5 items-center rounded-b-3xl shadow-lg relative overflow-hidden">
                    {/* Animated Bubbles */}
                    <Animated.View 
                        style={{
                            position: 'absolute',
                            top: -80,
                            right: -80,
                            width: 160,
                            height: 160,
                            backgroundColor: 'rgba(74, 222, 128, 0.2)',
                            borderRadius: 80,
                            transform: [
                                {
                                    translateX: bubble1Anim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, 20],
                                    }),
                                },
                                {
                                    translateY: bubble1Anim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, 20],
                                    }),
                                },
                            ],
                        }}
                    />
                    <Animated.View 
                        style={{
                            position: 'absolute',
                            bottom: -80,
                            left: -80,
                            width: 160,
                            height: 160,
                            backgroundColor: 'rgba(74, 222, 128, 0.2)',
                            borderRadius: 80,
                            transform: [
                                {
                                    translateX: bubble2Anim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, 20],
                                    }),
                                },
                                {
                                    translateY: bubble2Anim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, 20],
                                    }),
                                },
                            ],
                        }}
                    />
                    <Animated.View 
                        style={{
                            position: 'absolute',
                            top: 20,
                            right: 20,
                            width: 80,
                            height: 80,
                            backgroundColor: 'rgba(74, 222, 128, 0.2)',
                            borderRadius: 40,
                            transform: [
                                {
                                    translateX: bubble3Anim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, 10],
                                    }),
                                },
                                {
                                    translateY: bubble3Anim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, 10],
                                    }),
                                },
                            ],
                        }}
                    />
                    <Animated.View 
                        style={{
                            position: 'absolute',
                            bottom: 20,
                            left: 20,
                            width: 80,
                            height: 80,
                            backgroundColor: 'rgba(74, 222, 128, 0.2)',
                            borderRadius: 40,
                            transform: [
                                {
                                    translateX: bubble4Anim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, 10],
                                    }),
                                },
                                {
                                    translateY: bubble4Anim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: [0, 10],
                                    }),
                                },
                            ],
                        }}
                    />
                    
                    <Animatable.View
                        animation="bounceIn"
                        duration={1500}
                        className="w-24 h-24 mb-2 bg-white rounded-full items-center justify-center shadow-lg relative z-10"
                    >
                        <Icon
                            name="key"
                            type="font-awesome"
                            size={40}
                            color="#22C55E"
                        />
                    </Animatable.View>
                    <Animatable.Text 
                        animation="fadeInDown"
                        duration={1500}
                        className="text-2xl font-bold text-white text-center mb-2 relative z-10"
                        style={{ fontSize: wp('6%') }}
                    >
                        Reset Password
                    </Animatable.Text>
                </View>

                <Animated.View 
                    className="flex-1 justify-center items-center px-5"
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    }}
                >
                    <Animatable.View 
                        animation="fadeInLeft"
                        duration={1500}
                        className="flex-row items-center bg-white rounded-xl mb-4 w-full shadow-md"
                    >
                        <Icon
                            name="envelope"
                            type="font-awesome"
                            color="#666"
                            size={20}
                            className="p-4"
                        />
                        <TextInput
                            className="flex-1 h-12 px-3 text-base text-gray-700"
                            placeholder="Enter your email"
                            placeholderTextColor="#666"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            editable={!loading}
                        />
                    </Animatable.View>

                    <Animatable.View 
                        animation="fadeInUp"
                        duration={1500}
                        className="w-full mt-5"
                    >
                        <Pressable 
                            className={`bg-green-500 py-4 rounded-xl w-full mb-3 shadow-lg ${
                                loading ? 'opacity-70' : ''
                            }`}
                            onPress={handleResetPassword}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text className="text-center text-white text-lg font-bold">
                                    Reset Password
                                </Text>
                            )}
                        </Pressable>

                        <Pressable 
                            className="bg-gray-200 py-4 rounded-xl w-full shadow-md"
                            onPress={() => router.back()}
                        >
                            <Text className="text-center text-gray-700 text-base font-semibold">
                                Back to Login
                            </Text>
                        </Pressable>
                    </Animatable.View>
                </Animated.View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
} 