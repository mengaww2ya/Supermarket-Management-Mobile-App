import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { auth } from '../../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Icon } from 'react-native-elements';

export default function Login() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  // Handle login
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert('Success', 'Login successful');
      router.push('/customer/homepage');
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-1 justify-center items-center px-4">
        <Text className="text-2xl font-bold mb-5 text-center text-green-600">
          Welcome to Queen Supermarket
        </Text>

        <View className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
          <Text className="text-lg font-semibold mb-4 text-center">
            Fill the form below to log in
          </Text>

          <Text className="text-md font-medium mb-1">Email</Text>
          <TextInput
            className="border border-gray-300 rounded-md p-3 mb-4 text-lg"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <Text className="text-md font-medium mb-1">Password</Text>
          <View className="flex-row items-center border border-gray-300 rounded-md mb-4">
            <TextInput
              placeholder="Enter your password"
              secureTextEntry={!passwordVisible}
              className="flex-1 p-3 text-lg"
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              onPress={() => setPasswordVisible(!passwordVisible)}
              className="p-3"
            >
              <Icon
                name={passwordVisible ? "eye" : "eye-slash"}
                type="font-awesome"
                color="gray"
                size={20}
              />
            </TouchableOpacity>
          </View>

          {/* Login Button */}
          <Pressable
            className="bg-green-500 py-3 rounded-md mb-2"
            onPress={handleLogin}
          >
            <Text className="text-white text-center text-lg font-bold">Log In</Text>
          </Pressable>

          <Pressable>
            <Text className="text-center text-md text-blue-600 underline">Forgot password?</Text>
          </Pressable>

          {/* Sign-Up Button */}
          <Pressable
            className="bg-gray-300 py-3 rounded-md mt-3"
            onPress={() => router.push('/screans/signup')}
          >
            <Text className="text-center text-lg font-semibold">I don't have an account? Sign up</Text>
          </Pressable>

          {/* Developer Button (Now Below the Sign-Up Button) */}
          <Pressable
            className="bg-blue-500 py-3 rounded-md mt-3"
            onPress={() => router.push('/screans/developingHompage')}
          >
            <Text className="text-white text-center text-lg font-bold">I am Developer</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}