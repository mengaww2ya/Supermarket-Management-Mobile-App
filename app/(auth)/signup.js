import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  SafeAreaView,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from '../context/authContext';

export default function Signup() {
  const { Register } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileImageUri, setProfileImageUri] = useState(null);
  const router = useRouter();

  const handleSignUp = async () => {
    if (!email || !password || !firstName || !lastName || !address || !phone) {
      Alert.alert("Error", "Please fill in all fields");
      console.log("Please fill in all fields")
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      console.log("Passwords do not match")
      return;
    }
    try {
      // Call the Register function with customer role by default
      await Register(email, password, firstName, lastName, address, phone, profileImageUri, "customer");
      Alert.alert("Success", "Account created successfully!");
    } catch (error) {
      Alert.alert("Error", error.message);
      console.log(error)
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-grey1 justify-center p-3">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, padding: 20, backgroundColor: "white" }}
      >
        <Text className="text-xl font-semibold text-center text-gray-700">
          Sign Up
        </Text>

        <KeyboardAvoidingView>
          <Text className="font-bold text-gray-700 m-2">First Name</Text>
          <TextInput
            className="border border-gray-300 bg-slate-200 rounded-md w-full p-3 ml-3"
            placeholder="Enter your first name"
            value={firstName}
            onChangeText={setFirstName}
          />

          <Text className="font-bold text-gray-700 m-2">Last Name</Text>
          <TextInput
            className="border border-gray-300 rounded-md w-full ml-3 p-3 bg-slate-200"
            placeholder="Enter your last name"
            value={lastName}
            onChangeText={setLastName}
          />

          <Text className="font-bold text-gray-700 m-2">Address</Text>
          <TextInput
            className="border border-gray-300 rounded-md w-full ml-3 p-3 bg-slate-200"
            placeholder="Enter your address"
            value={address}
            onChangeText={setAddress}
          />

          <Text className="font-bold text-gray-700 m-2">Phone</Text>
          <TextInput
            className="border border-gray-300 rounded-md w-full ml-3 p-3 bg-slate-200"
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <Text className="font-bold text-gray-700 m-2">Email</Text>
          <TextInput
            className="border border-gray-300 rounded-md w-full ml-3 p-3 bg-slate-200"
            placeholder="Enter your email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text className="font-bold text-gray-700 m-2">Create Password</Text>
          <TextInput
            className="border border-gray-300 rounded-md w-full ml-3 p-3 bg-slate-200"
            placeholder="Create password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Text className="font-bold text-gray-700 m-2">Confirm Password</Text>
          <TextInput
            className="border border-gray-300 rounded-md w-full ml-3 p-3 bg-slate-200"
            placeholder="Confirm your password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <View className="flex-row justify-evenly mt-3">
            <TouchableOpacity
              className="py-2 px-4 rounded-md shadow-md active:opacity-80 flex-1 mx-2 bg-purple-600"
              onPress={handleSignUp}
            >
              <Text className="text-white font-bold text-xl text-center">Sign Up</Text>
            </TouchableOpacity>
             <TouchableOpacity
                        className="rounded-md"
                        onPress={() => router.push("/(auth)/login")}
                      >
                        <Text className="text-center text-lg text-black font-semibold">Sign In</Text>
                      </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
}
