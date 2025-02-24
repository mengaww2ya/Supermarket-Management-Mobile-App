import React from "react";
import { Text, View, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
export default function AdminHomePage() {
  const router=useRouter();
  return (
    <View className="flex-1 bg-gray-100 p-4">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="bg-white shadow-md rounded-lg p-5">
          <Text className="text-xl font-bold text-center text-gray-800 bg-gray-300 p-3 rounded-md mb-4">
            Welcome!
          </Text>
          <View className="flex-row  flex-wrap justify-between">
            {/* Employee Management */}
            <TouchableOpacity
              className="bg-gray-500 w-[48%] h-32 justify-center items-center rounded-lg shadow-md mb-4 active:scale-95"
              onPress={() =>router.push("/admine/employeeManagement")}
            >
              <Text className="text-lg font-bold text-white">Employee Management</Text>
              <Text className="text-sm text-gray-200 text-center">
                Add, delete, update employee
              </Text>
            </TouchableOpacity>

            {/* Customer Management */}
            <TouchableOpacity
              className="bg-gray-500 w-[48%] h-32 justify-center items-center rounded-lg shadow-md mb-4 active:scale-95"
              onPress={() => router.push("/admine/customerManagement")}
            >
              <Text className="text-lg font-bold text-white">Customer Management</Text>
              <Text className="text-sm text-gray-200 text-center">
                Add, delete, update customer
              </Text>
            </TouchableOpacity>

            {/* Supplier Management */}
            <TouchableOpacity
              className="bg-gray-500 w-[48%] h-32 justify-center items-center rounded-lg shadow-md mb-4 active:scale-95"
              onPress={() => router.push("/admine/suplierManagement")}
            >
              <Text className="text-lg font-bold text-white">Supplier Management</Text>
              <Text className="text-sm text-gray-200 text-center">
                Add, delete, update supplier
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
