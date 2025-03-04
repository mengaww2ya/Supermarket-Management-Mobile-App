import React, { useState } from "react";
import { SafeAreaView, TextInput, Pressable, Text, View, } from "react-native";
import { useRouter } from "expo-router";

export default function SearchProductForUpdate() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-white justify-center items-center px-4">
      <View className="w-full bg-gray-100 p-4 rounded-lg shadow-md">
        <Text className="text-lg font-bold mb-2 text-gray-800">Search Product to Update</Text>
        <TextInput
          className="border border-gray-300 p-3 rounded-md mb-4"
          placeholder="Enter Product ID or Name"
          value={""}
          onChangeText={""}
        />
        <Pressable className="bg-blue-500 p-3 rounded-md" onPress={router.push("/stockManager/updateproduct" )}>
          <Text className="text-white text-center font-semibold">Search</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}