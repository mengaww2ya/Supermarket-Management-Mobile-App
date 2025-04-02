import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Icon } from 'react-native-elements';
import { useAuth } from '../context/authContext';
import * as Animatable from 'react-native-animatable';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

export default function Login() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));
  const router = useRouter();
  const { signIn, loading } = useAuth();

  useEffect(() => {
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
  }, []);

  // Handle login
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await signIn(email, password);
      // Navigation will be handled by the root layout based on role
    } catch (error) {
      // Error handling is done in the context
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View className="bg-yellow-400 p-5 items-center rounded-b-3xl shadow-lg">
          <Animatable.View
            animation="bounceIn"
            duration={1500}
            className="w-24 h-24 mb-2 bg-white rounded-full items-center justify-center shadow-lg"
          >
            <Icon
              name="shopping-cart"
              type="font-awesome"
              size={40}
              color="#FFDC2B"
            />
          </Animatable.View>
          <Animatable.Text 
            animation="fadeInDown"
            duration={1500}
            className="text-2xl font-bold text-black text-center mb-2"
            style={{ fontSize: wp('6%') }}
          >
            Welcome to Queen's Supermarket
          </Animatable.Text>
        </View>

        <Animated.View 
          className="flex-1 justify-center items-center px-5"
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <Animatable.Text 
            animation="fadeInUp"
            duration={1500}
            className="text-lg font-semibold mb-8 text-center text-gray-600"
            style={{ fontSize: wp('4%') }}
          >
            Fill the form below to log in
          </Animatable.Text>

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
            animation="fadeInRight"
            duration={1500}
            className="flex-row items-center bg-white rounded-xl mb-4 w-full shadow-md"
          >
            <Icon
              name="lock"
              type="font-awesome"
              color="#666"
              size={20}
              className="p-4"
            />
            <TextInput
              className="flex-1 h-12 px-3 text-base text-gray-700"
              placeholder="Enter your password"
              placeholderTextColor="#666"
              secureTextEntry={!passwordVisible}
              value={password}
              onChangeText={setPassword}
              editable={!loading}
            />
            <TouchableOpacity
              onPress={() => setPasswordVisible(!passwordVisible)}
              className="p-4"
            >
              <Icon
                name={passwordVisible ? "eye" : "eye-slash"}
                type="font-awesome"
                color="gray"
                size={20}
              />
            </TouchableOpacity>
          </Animatable.View>

          <Animatable.View 
            animation="fadeInUp"
            duration={1500}
            className="w-full mt-5"
          >
            {/* Login Button */}
            <Pressable 
              className={`bg-green-500 py-4 rounded-xl w-full mb-3 shadow-lg ${
                loading ? 'opacity-70' : ''
              }`}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text className="text-center text-white text-lg font-bold">
                  Log In
                </Text>
              )}
            </Pressable>

            <TouchableOpacity className="py-2 mb-3">
              <Text className="text-blue-500 text-center text-base">
                Forgot password?
              </Text>
            </TouchableOpacity>

            {/* Sign-Up Button */}
            <Pressable 
              className={`bg-gray-200 py-4 rounded-xl w-full mb-3 shadow-md ${
                loading ? 'opacity-70' : ''
              }`}
              onPress={() => router.push('/(auth)/signup')}
              disabled={loading}
            >
              <Text className="text-center text-gray-700 text-base font-semibold">
                I don't have an account? Sign up
              </Text>
            </Pressable>

            {/* Developer Button */}
            <Pressable 
              className={`bg-blue-500 py-4 rounded-xl w-full shadow-lg ${
                loading ? 'opacity-70' : ''
              }`}
              onPress={() => router.push('/screans/developingHompage')}
              disabled={loading}
            >
              <Text className="text-center text-white text-lg font-bold">
                I am Developer
              </Text>
            </Pressable>
          </Animatable.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}