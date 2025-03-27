import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { deliveryOrders } from "../global/data";
import { useLocalSearchParams,useRouter } from "expo-router";

export default function mDeliveryOrders() {
  const { agentId, AgentName } = useLocalSearchParams;
  const [orders, setOrders] = useState(
    deliveryOrders.filter((order) => order.status === "pending")
  );

  const assignOrder = (orderId) => {
    Alert.alert(
      "Confirm Assignment",
      `Are you sure you want to assign Order ${orderId} to ${AgentName}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Assign",
          onPress: () => {
            const updatedOrders = orders.map((order) =>
              order.id === orderId ? { ...order, status: "assigned" } : order
            );
            setOrders(updatedOrders);
            Alert.alert("Success", `Order ${orderId} has been assigned.`);
            navigation.goBack();
          },
        },
      ]
    );
  };
const route=useRouter();
  return (
    <View className="flex-1 bg-gray-100 p-4">
      <Text className="text-xl font-bold text-center mb-4">
        Select an Order to Assign
      </Text>

      {orders.length === 0 ? (
        <Text className="text-gray-500 text-center text-lg mt-6">
          No pending orders available.
        </Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              className={`p-4 mb-3 rounded-lg shadow-md border-l-4 ${
                item.status === "assigned"
                  ? "border-green-500 bg-green-100"
                  : "border-blue-500 bg-white"
              }`}
              onPress={() => assignOrder(item.id)}
              activeOpacity={0.7}
            >
              <View>
                <Text className="text-lg font-semibold">
                  Order ID: {item.id}
                </Text>
                <Text className="text-gray-700">Customer: {item.customer}</Text>
                <Text className="text-gray-700">Address: {item.address}</Text>
                <Text
                  className={`mt-2 font-bold ${
                    item.status === "assigned" ? "text-green-600" : "text-blue-600"
                  }`}
                >
                  {item.status === "assigned" ? "Assigned" : "Pending"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
