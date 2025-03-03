import React from "react";
import { ScrollView, SafeAreaView, View, Text, Pressable, Alert } from "react-native";
import { useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";

export default function ManageStock() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const router = useRouter();

  
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView contentContainerStyle={{ alignItems: "center", paddingVertical: 20 }}>
        <Text className="text-2xl font-bold text-gray-800 mb-6">Welcome</Text>

        <View className="flex-row flex-wrap justify-center w-11/12 gap-4">
            <Pressable
              className="bg-gray-300 w-40 h-24 justify-center items-center rounded-lg border border-gray-400 shadow-md hover:bg-gray-400 active:bg-gray-500"
              style={{ width: screenWidth * 0.4, height: screenHeight * 0.1 }}
              onPress={() => {
                  router.push("/stockManager/addProduct");
                
              }}
            >
              <Text className="text-lg font-semibold text-gray-800 text-center">Add Product</Text>
            </Pressable>
            <Pressable
              className="bg-gray-300 w-40 h-24 justify-center items-center rounded-lg border border-gray-400 shadow-md hover:bg-gray-400 active:bg-gray-500"
              style={{ width: screenWidth * 0.4, height: screenHeight * 0.1 }}
              onPress={() => {
                  router.push("/stockManager/removeproduct");
                
              }}
            >
              <Text className="text-lg font-semibold text-gray-800 text-center">Remove Product</Text>
          </Pressable>
          <Pressable
              className="bg-gray-300 w-40 h-24 justify-center items-center rounded-lg border border-gray-400 shadow-md hover:bg-gray-400 active:bg-gray-500"
              style={{ width: screenWidth * 0.4, height: screenHeight * 0.1 }}
              onPress={() => {
                  router.push("/stockManager/updateproduct");
                
              }}
            >
              <Text className="text-lg font-semibold text-gray-800 text-center">Update Product</Text>
          </Pressable>
           <Pressable
              className="bg-gray-300 w-40 h-24 justify-center items-center rounded-lg border border-gray-400 shadow-md hover:bg-gray-400 active:bg-gray-500"
              style={{ width: screenWidth * 0.4, height: screenHeight * 0.1 }}
              onPress={() => {
                  router.push("/stockManager/viewProduct");
                
              }}
            >
              <Text className="text-lg font-semibold text-gray-800 text-center">View Product List</Text>
          </Pressable>
           <Pressable
              className="bg-gray-300 w-40 h-24 justify-center items-center rounded-lg border border-gray-400 shadow-md hover:bg-gray-400 active:bg-gray-500"
              style={{ width: screenWidth * 0.4, height: screenHeight * 0.1 }}
              onPress={() => {
                  router.push("/stockManager/addCategory");
                
              }}
            >
              <Text className="text-lg font-semibold text-gray-800 text-center">Add New Categories</Text>
          </Pressable>
          <Pressable
              className="bg-gray-300 w-40 h-24 justify-center items-center rounded-lg border border-gray-400 shadow-md hover:bg-gray-400 active:bg-gray-500"
              style={{ width: screenWidth * 0.4, height: screenHeight * 0.1 }}
              onPress={() => {
                  router.push("/stockManager/viewProduct");
                
              }}
            >
              <Text className="text-lg font-semibold text-gray-800 text-center">Update Categories</Text>
          </Pressable>
           <Pressable
              className="bg-gray-300 w-40 h-24 justify-center items-center rounded-lg border border-gray-400 shadow-md hover:bg-gray-400 active:bg-gray-500"
              style={{ width: screenWidth * 0.4, height: screenHeight * 0.1 }}
              onPress={() => {
                  router.push("/stockManager/viewProduct");
                
              }}
            >
              <Text className="text-lg font-semibold text-gray-800 text-center">Remove Categories</Text>
          </Pressable>
          <Pressable
              className="bg-gray-300 w-40 h-24 justify-center items-center rounded-lg border border-gray-400 shadow-md hover:bg-gray-400 active:bg-gray-500"
              style={{ width: screenWidth * 0.4, height: screenHeight * 0.1 }}
              onPress={() => {
                  router.push("/stockManager/viewProduct");
                
              }}
            >
              <Text className="text-lg font-semibold text-gray-800 text-center">View Categories List</Text>
            </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
