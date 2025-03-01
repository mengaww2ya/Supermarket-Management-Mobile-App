import React, { useState } from "react";
import { View, Text, TextInput, SafeAreaView ,TouchableOpacity, KeyboardAvoidingView, ScrollView} from "react-native";
import { useRouter } from "expo-router";

export default function Signup() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

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
    <SafeAreaView className="flex-1 bg-grey1 justify-center p-3 " >
      <ScrollView    showsVerticalScrollIndicator={false}
      contentContainerClassName="flex-1 p-5 bg-white"
      >
        <Text className="text-xl font-semibold text-center text-gray-700">
          Register Customer
        </Text>

      <KeyboardAvoidingView>
             <Text className="font-bold  text-gray-700 m-2">First Name</Text>
          
          <TextInput
            className="border border-gray-300 bg-slate-200   rounded-md w-full p-3 ml-3 "
            placeholder="Enter your first name"
            value={firstName}
            onChangeText={setFirstName}
          />
                    <Text className="font-bold  text-gray-700 m-2">Last Name</Text>
          
          <TextInput
            className="border border-gray-300 rounded-md w-full ml-3 p-3 bg-slate-200 "
            placeholder="Enter your last name"
            value={lastName}
            onChangeText={setLastName}
          />
                    <Text className="font-bold  text-gray-700 m-2">Adress</Text>
          
          <TextInput
            className="border border-gray-300 rounded-md w-full ml-3 p-3 bg-slate-200 "
            placeholder="Enter your address"
            value={address}
            onChangeText={setAddress}
          />
                    <Text className="font-bold  text-gray-700 m-2">Phone</Text>
          
          <TextInput
            className="border border-gray-300 rounded-md w-full ml-3 p-3 bg-slate-200 "
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
                    <Text className="font-bold  text-gray-700 m-2">Email</Text>
          
          <TextInput
            className="border border-gray-300 rounded-md w-full ml-3 p-3 bg-slate-200 "
            placeholder="Enter your email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
                    <Text className="font-bold  text-gray-700 m-2">Create your password</Text>
          
          <TextInput
            className="border border-gray-300 rounded-md w-full ml-3 p-3 bg-slate-200 "
            placeholder="Create password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
                    <Text className="font-bold  text-gray-700 m-2">Confirm Password</Text>
          
          <TextInput
            className="border border-gray-300 rounded-md w-full ml-3 p-3 bg-slate-200 "
            placeholder="Confirm your password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

        <View className="flex-row justify-evenly mt-3" >
          <TouchableOpacity
            className=" py-2 px-4 rounded-md shadow-md active:opacity-80 flex-1 mx-2 bg-purple-600"
            onPress={() => router.push("/customer/homepage")}
          >
            <Text className="text-white font-bold text-xl text-center">Register</Text>
          </TouchableOpacity>
      
        </View>

     
        </KeyboardAvoidingView>
        </ScrollView>
    </SafeAreaView>
  );
}
