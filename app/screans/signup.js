import React, { useState } from "react";
import { View, Text, TextInput, SafeAreaView ,TouchableOpacity, KeyboardAvoidingView} from "react-native";
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
    <SafeAreaView className="flex-1 bg-grey1 justify-center p-3 " >
      {/* <View className="bg-white p-6 rounded-xl shadow-lg"> */}
        <Text className="text-4xl font-semibold text-center text-white">
          Sign Up
        </Text>

<KeyboardAvoidingView>
        <View className="gap-4 m-2 ">
             <Text className="text-lg w-full font-bold  text-white">First Name</Text>
          
          <TextInput
            className="border border-gray-300 bg-slate-200   rounded-md w-full p-3  "
            placeholder="Enter your first name"
            value={firstName}
            onChangeText={setFirstName}
          />
                    <Text className="text-lg w-full font-bold  text-white">Last Name</Text>
          
          <TextInput
            className="border border-gray-300 rounded-md w-full p-3 bg-slate-200 "
            placeholder="Enter your last name"
            value={lastName}
            onChangeText={setLastName}
          />
                    <Text className="text-lg w-full font-bold  text-white">Adress</Text>
          
          <TextInput
            className="border border-gray-300 rounded-md w-full p-3 bg-slate-200 "
            placeholder="Enter your address"
            value={address}
            onChangeText={setAddress}
          />
                    <Text className="text-lg w-full font-bold  text-white">Phone</Text>
          
          <TextInput
            className="border border-gray-300 rounded-md w-full p-3 bg-slate-200 "
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
                    <Text className="text-lg w-full font-bold  text-white">email</Text>
          
          <TextInput
            className="border border-gray-300 rounded-md w-full p-3 bg-slate-200 "
            placeholder="Enter your email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
                    <Text className="text-lg w-full font-bold  text-white">Create your password</Text>
          
          <TextInput
            className="border border-gray-300 rounded-md w-full  p-3 bg-slate-200 "
            placeholder="Create password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
                    <Text className="text-lg w-full font-bold  text-white">Confirm Password</Text>
          
          <TextInput
            className="border border-gray-300 rounded-md w-full p-3 bg-gray-400 "
            placeholder="Confirm your password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        <View className="flex-row justify-evenly mt-3" >
          <TouchableOpacity
            className=" py-3 px-4 rounded-md shadow-md active:opacity-80 flex-1 mx-2 bg-purple-600"
            onPress={() => router.push("/customer/homepage")}
          >
            <Text className="text-white font-bold text-2xl text-center">Sign Up</Text>
          </TouchableOpacity>

       

      
        </View>
      {/* </View> */}

      <View className="justify-evenly  mt-3 flex-row ">
        <Text className="text-white text-2xl font-bold">Do you have an account?</Text>
        <TouchableOpacity
          className="  rounded-md shadow-md active:opacity-80"
          onPress={() => router.back("/screens/login")}
        >
          <Text className="text-blue-700 text-2xl font-bold">Sign In</Text>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
