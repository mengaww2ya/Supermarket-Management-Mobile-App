import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  ImageBackground,
  Alert,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { auth } from '../../firebase/firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Icon } from 'react-native-elements';

export default function Login() {
  const screenWidth = useWindowDimensions().width;
  const screenHeight = useWindowDimensions().height;
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert('Success', 'Login successful');
      console.log("Login successfu" )
      // router.push("/(app)/customer/(tabs)/homapage")
    } catch (error) {
      Alert.alert('Error', error.message);
      console.log(error)
    }
  };

  const backgroundImage = require("../../assets/background/login.png");

  return (
    <SafeAreaView className="flex-1 gap-2 bg-grey1">
      <View className="flex-1 justify-center items-center px-4">
        <Text className="text-4xl text-center font-extrabold text-blue-800">Login</Text>

        <ImageBackground
          source={backgroundImage}
          style={{ width: screenWidth, height: screenHeight * 0.4, margin: 5, borderRadius: 5, padding: 5 }}
          resizeMode="cover"
        />

        <Text className="text-lg w-full font-bold mb-1 text-white">Email</Text>
        <TextInput
          className="border border-gray-300 w-full text-white rounded-md p-3 mb-4 text-lg"
          placeholder="Enter your username"
          value={email}
          onChangeText={setEmail}
        />

        <Text className="text-lg font-bold w-full mb-1 text-white">Password</Text>
        <View className="flex-row items-center border border-gray-300 w-full rounded-md mb-4">
          <TextInput
            placeholder="Enter your password"
            secureTextEntry={!passwordVisible}
            className="flex-1 p-3 w-full text-lg text-white"
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

        <Pressable
          className="bg-green-500 py-2 rounded-md w-full"
          onPress={handleLogin}
        >
          <Text className="text-white text-center text-lg font-bold">Log In</Text>
        </Pressable>

        <View className="flex-row gap-10">
          <Pressable>
            <Text className="text-center text-xl text-blue-600">Forgot password?</Text>
          </Pressable>

          <Pressable
            className="rounded-md"
            onPress={() => router.push("/(auth)/signup")}
          >
            <Text className="text-center text-lg text-white font-semibold">Sign up</Text>
          </Pressable>
        </View>
      </View>
      <View>
        <Pressable
          onPress={() => router.push("/screens/developingHomepage")}
          className="bg-gray-800 w-11/12 self-center rounded-md py-3 mt-5"
        >
          <Text className="text-white text-center text-lg font-semibold">I am developing, not logging in</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}