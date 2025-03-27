import React, { useState } from "react";
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, Modal, Pressable } from "react-native";
import { customer } from "../global/data.js";

export default function CustomerList() {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openModal = (customer) => {
    setSelectedCustomer(customer);
    setModalVisible(true);
  };

  return (
    <SafeAreaView className="flex-1  bg-grey1 p-4">
      {/* Title */}
      <Text className="text-2xl font-bold text-center text-gray-800 mb-4">
        All Registered Supermarket Customers
      </Text>

      {/* Table Headers */}
      <View className="flex-row bg-blue-600 py-3 rounded-lg mb-2">
        <Text className="flex-1 text-white font-semibold text-center">User ID</Text>
        <Text className="flex-1 text-white font-semibold text-center">User Name</Text>
        <Text className="flex-1 text-white font-semibold text-center">First Name</Text>
        <Text className="flex-1 text-white font-semibold text-center">Last Name</Text>
      </View>

      {/* Customer List */}
      <FlatList
        data={customer}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity 
            className="flex-row bg-white py-3 rounded-lg mb-2 shadow-md active:bg-gray-200"
            onPress={() => openModal(item)}
          >
            <Text className="flex-1 text-gray-700 text-center">{item.id}</Text>
            <Text className="flex-1 text-gray-700 text-center">{item.userName}</Text>
            <Text className="flex-1 text-gray-700 text-center">{item.firstName}</Text>
            <Text className="flex-1 text-gray-700 text-center">{item.lastName}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Customer Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="w-4/5 bg-white p-5 rounded-lg shadow-lg">
            <Text className="text-2xl font-bold text-center mb-4 text-blue-600">
              Customer Details
            </Text>

            {selectedCustomer && (
              <>
                <Text className="text-lg text-gray-700">
                  <Text className="font-bold text-blue-600">User ID:</Text> {selectedCustomer.id}
                </Text>
                <Text className="text-lg text-gray-700">
                  <Text className="font-bold text-blue-600">Username:</Text> {selectedCustomer.userName}
                </Text>
                <Text className="text-lg text-gray-700">
                  <Text className="font-bold text-blue-600">First Name:</Text> {selectedCustomer.firstName}
                </Text>
                <Text className="text-lg text-gray-700">
                  <Text className="font-bold text-blue-600">Last Name:</Text> {selectedCustomer.lastName}
                </Text>
                <Text className="text-lg text-gray-700">
                  <Text className="font-bold text-blue-600">Phone:</Text> {selectedCustomer.phone}
                </Text>
                <Text className="text-lg text-gray-700">
                  <Text className="font-bold text-blue-600">Address:</Text> {selectedCustomer.address}
                </Text>
              </>
            )}

            {/* Buttons */}
            <View className="flex-row justify-between mt-4">
              <Pressable 
                className="bg-green-600 py-2 px-4 rounded-lg active:bg-opacity-80"
                onPress={() => alert("Update feature coming soon!")}
              >
                <Text className="text-white font-bold text-lg">Update</Text>
              </Pressable>

              <Pressable 
                className="bg-red-600 py-2 px-4 rounded-lg active:bg-opacity-80"
                onPress={() => alert("Delete feature coming soon!")}
              >
                <Text className="text-white font-bold text-lg">Delete</Text>
              </Pressable>

              <Pressable 
                className="bg-gray-500 py-2 px-4 rounded-lg active:bg-opacity-80"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-white font-bold text-lg">Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
