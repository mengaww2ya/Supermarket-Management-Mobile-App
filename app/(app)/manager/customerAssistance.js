import React from "react";
import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
export default function McustomerAssistance() {
  const menuOptions = [
    {
      title: "Review Operations",
      subtitle: "Overseeing Customer Support Operations",
      navigate: "/manager/monitorCustomerAssistance",
    },
    {
      title: "Handling Escalated Issues",
      subtitle: "Customer Assistance Transforms These Issues",
      navigate: "/manager/HandlingEscalatedIssues",
    },
    {
      title: "Customer Service Performance",
      subtitle: "Monitoring Customer Service Performance",
      navigate: "/manager/customerServicePerformance",
    },
    {
      title: "Manage Channels",
      subtitle: "Customer Support Tools & Communication Channels",
      navigate: "/manager/ManageChannels",
    },
  ];
const router=useRouter();
  return (
    <SafeAreaView className="flex-1  bg-grey1">
      <ScrollView className="px-4 py-6">
        {/* Header */}
        <View className="bg-blue-600 p-5 rounded-lg shadow-lg">
          <Text className="text-2xl font-bold text-white text-center">Customer Assistance Management</Text>
        </View>

        {/* Options - Two-column Layout */}
        <View className="mt-6 flex-row flex-wrap justify-between">
          {menuOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              className="bg-white w-[48%] p-5 rounded-xl shadow-lg mb-4 active:bg-gray-200"
              style={{
                minHeight: 130,
                justifyContent: "center",
                alignItems: "center",
                elevation: 5,
              }}
              onPress={() => router.push(option.navigate)}
            >
              <Text className="text-lg font-semibold text-gray-800 text-center">{option.title}</Text>
              <Text className="text-gray-500 text-sm mt-1 text-center">{option.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
