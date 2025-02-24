import React from "react";
import { View, Text, ScrollView, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { TouchableOpacity } from "react-native-gesture-handler";

export default function Welcome() {
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView showsVerticalScrollIndicator={false} className="px-4">
        <View className="mt-10 p-6 bg-white rounded-xl shadow-md">
          <Text className="text-2xl font-semibold text-center text-gray-900 leading-8">
            Start Your Smart Shopping Here: Discover Groceries at Your
            Fingertips. Better Living Anytime, Anywhere!
          </Text>
        </View>

        <View
          style={{ width: screenWidth * 0.75 }}
          className="self-center mt-8"
        >
          <TouchableOpacity
            className="w-full bg-gray-500 py-4 rounded-lg items-center shadow-md active:opacity-80"
            onPress={() => router.push("/screans/login")}
          >
            <Text className="text-black text-lg font-bold">Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="w-full bg-blue-500 py-4 rounded-lg items-center mt-4 shadow-md active:opacity-80"
            onPress={() => router.push("/screans/signup")}
          >
            <Text className="text-black text-lg font-bold">Create Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
