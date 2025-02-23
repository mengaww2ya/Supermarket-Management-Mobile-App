import React from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
export default function ManageChannels() {
  const router =useRouter();
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="p-5">
        <View className="bg-white p-6 rounded-2xl shadow-md">
          <Text className="text-xl font-bold text-center text-gray-800 mb-6">Manage Channels</Text>

          <View className="grid grid-cols-2 gap-4">
            <TouchableOpacity
              className="bg-white p-5 rounded-xl border border-gray-300 shadow-md active:bg-gray-200"
              onPress={() => router.push("/manager/ChannelOverview")}
            >
              <Text className="text-lg font-bold text-center mb-2">Channel Overview</Text>
              <Text className="text-sm text-center text-gray-600">List communication channels</Text>
            </TouchableOpacity>

            <TouchableOpacity className="bg-white p-5 rounded-xl border border-gray-300 shadow-md active:bg-gray-200">
              <Text className="text-lg font-bold text-center mb-2">Manage Channels</Text>
              <Text className="text-sm text-center text-gray-600">Add, Edit, or Remove Channels</Text>
            </TouchableOpacity>

            <TouchableOpacity className="bg-white p-5 rounded-xl border border-gray-300 shadow-md active:bg-gray-200 col-span-2">
              <Text className="text-lg font-bold text-center mb-2">Customer Assistant Assignment</Text>
              <Text className="text-sm text-center text-gray-600">Assign assistants to channels</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
