import React, { useState } from "react";
import { View, Text, TextInput, SafeAreaView } from "react-native";
import { useRouter } from "expo-router";
import { TouchableOpacity } from "react-native-gesture-handler";

export default function Signup() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  // Function to clear input fields
  const clearInputs = () => {
    setFirstName("");
    setLastName("");
    setAddress("");
    setPhone("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 justify-center px-6">
      <View className="bg-white p-6 rounded-xl shadow-lg">
        <Text className="text-lg font-semibold text-center text-gray-700">
          Fill the form to register or press sign in if you have an account
        </Text>

        <View className="mt-4">
          <TextInput
            className="border border-gray-300 rounded-md p-3 my-2 text-gray-800"
            placeholder="Enter your first name"
            value={firstName}
            onChangeText={setFirstName}
          />
          <TextInput
            className="border border-gray-300 rounded-md p-3 my-2 text-gray-800"
            placeholder="Enter your last name"
            value={lastName}
            onChangeText={setLastName}
          />
          <TextInput
            className="border border-gray-300 rounded-md p-3 my-2 text-gray-800"
            placeholder="Enter your address"
            value={address}
            onChangeText={setAddress}
          />
          <TextInput
            className="border border-gray-300 rounded-md p-3 my-2 text-gray-800"
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <TextInput
            className="border border-gray-300 rounded-md p-3 my-2 text-gray-800"
            placeholder="Enter your email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            className="border border-gray-300 rounded-md p-3 my-2 text-gray-800"
            placeholder="Create password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            className="border border-gray-300 rounded-md p-3 my-2 text-gray-800"
            placeholder="Confirm your password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        <View className="flex-row justify-between mt-6">
          <TouchableOpacity
            className="bg-green-500 py-3 px-4 rounded-md shadow-md active:opacity-80 flex-1 mx-2"
            onPress={() => router.push("/customer/homepage")}
          >
            <Text className="text-white font-bold text-center">Sign Up</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-yellow-500 py-3 px-4 rounded-md shadow-md active:opacity-80 flex-1 mx-2"
            onPress={clearInputs}
          >
            <Text className="text-white font-bold text-center">Clear</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-gray-500 py-3 px-4 rounded-md shadow-md active:opacity-80 flex-1 mx-2"
            onPress={() => router.back()}
          >
            <Text className="text-white font-bold text-center">Back</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="items-center mt-8">
        <Text className="text-gray-700">Do you have an account?</Text>
        <TouchableOpacity
          className="bg-blue-500 mt-3 py-3 px-6 rounded-md shadow-md active:opacity-80"
          onPress={() => router.push("/screens/login")}
        >
          <Text className="text-white font-bold">Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
