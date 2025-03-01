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
      <View className="flex-1 pt-0"> {/* Removed horizontal padding */}
        
        {/* Full-Width Box with Custom Yellow Color */}
        <View style={{ backgroundColor: '#FFDC2B', width: '100%', padding: 26, borderRadius: 0, marginBottom: 35 }}>
          <Text className="text-2xl font-bold text-center text-black">
            Welcome to Queen Supermarket
          </Text>
        </View>

        <TextInput
          className="border border-gray-700 rounded-md p-3 mb-2 text-lg" // Reduced margin
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          style={{marginTop:15}}
        />

        <View className="flex-row items-center border border-gray-700 rounded-md mb-2"style={{marginTop:30}}> 
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
        <View style={{marginTop:100}} > 
        <Pressable 
          className="bg-green-500 py-2 px-4 mx-auto rounded-md mb-2" // Adjusted padding and margin
          style={{ width: '50%', marginBottom:15}} // Centered button
          onPress={handleLogin}
        >
          
          <Text className="text-white text-center text-lg font-bold">Log In</Text>
        </Pressable>

        <Pressable style={{marginBottom:15}}>
          <Text className="text-center text-md text-blue-600 underline mb-2">Forgot password?</Text> {/* Added margin */}
        </Pressable>

        {/* Sign-Up Button */}
        <Pressable 
          className="bg-gray-300 py-2 rounded-md mt-2 mx-auto" // Adjusted padding and margin
          style={{ width: '60%',marginBottom:15}} // Centered button
          onPress={() => router.push('/screans/signup')}
        >
          <Text className="text-center text-lg font-semibold">don't have an account? Sign up</Text>
        </Pressable>

        {/* Developer Button */}
        <Pressable
          className="bg-blue-500 py-2 rounded-md mt-2 mx-auto" // Adjusted padding and margin
          style={{ width: '50%' }} // Centered button
          onPress={() => router.push('/screans/developingHompage')}
        >
          <Text className="text-white text-center text-lg font-bold">I am Developer</Text>
        </Pressable>

        </View>
      </View>
    </SafeAreaView>
  );
}