import React from "react";
import { SafeAreaView, View, Text, TouchableOpacity, ScrollView } from "react-native";

export default function CustomerManagement({ navigation }) {
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClass="p-4"
      >
        <View className="bg-white p-5 rounded-lg shadow-md">
          <Text className="text-2xl font-bold text-center text-gray-800 mb-6">
            Customer Management
          </Text>

          <View className="flex flex-wrap flex-row justify-between">
            <TouchableOpacity
              className="bg-blue-500 w-[47%] h-28 justify-center items-center rounded-lg shadow-md mb-4"
              onPress={() => navigation.navigate("Signup")}
            >
              <Text className="text-lg font-bold text-white">Add Customer</Text>
              <Text className="text-sm text-white">Register New Customer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-red-500 w-[47%] h-28 justify-center items-center rounded-lg shadow-md mb-4"
              onPress={() => navigation.navigate("Signup")}
            >
              <Text className="text-lg font-bold text-white">Delete Customer</Text>
              <Text className="text-sm text-white">Remove Existing Customer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-yellow-500 w-[47%] h-28 justify-center items-center rounded-lg shadow-md mb-4"
              onPress={() => {}}
            >
              <Text className="text-lg font-bold text-white">Update Customer</Text>
              <Text className="text-sm text-white">Update Existing Customer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-green-500 w-[47%] h-28 justify-center items-center rounded-lg shadow-md mb-4"
              onPress={() => {}}
            >
              <Text className="text-lg font-bold text-white">View Customers</Text>
              <Text className="text-sm text-white">Display All Customers</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
