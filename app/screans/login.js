import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "react-native-elements";
import { useRouter } from "expo-router";
export default function Login() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    // if (!username || !password) {
    //   alert("Please fill in both fields.");
    //   return;
    // }
    router.push("/customer/homepage");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-1 justify-center items-center px-4">
        <Text className="text-2xl font-bold mb-5 text-center">
          Welcome to Queen Supermarket
        </Text>

        <View className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
          <Text className="text-lg font-semibold mb-4 text-center">
            Fill the form below to log in
          </Text>

          <Text className="text-md font-medium mb-1">Username</Text>
          <TextInput
            className="border border-gray-300 rounded-md p-3 mb-4 text-lg"
            placeholder="Enter your username"
            value={username}
            onChangeText={setUsername}
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

          <Pressable
            className="bg-green-500 py-3 rounded-md mb-2"
            onPress={handleLogin}
          >
            <Text className="text-white text-center text-lg font-bold">Log In</Text>
          </Pressable>

          <Pressable>
            <Text className="text-center text-md text-blue-600 underline">Forgot password?</Text>
          </Pressable>

          <Pressable
            className="bg-gray-300 py-3 rounded-md mt-3"
            onPress={() => router.push("/screans/signup")}
          >
            <Text className="text-center text-lg font-semibold">I don't have an account? Sign up</Text>
          </Pressable>
        </View>
      </View>

      <View>
        <Pressable
          onPress={() => router.push("/screans/developingHompage")}
          className="bg-gray-800 w-11/12 self-center rounded-md py-3 mt-5"
        >
          <Text className="text-white text-center text-lg font-semibold">I am developing, not logging in</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}