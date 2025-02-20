import React, { useState } from "react";
import { SafeAreaView, View, Text, FlatList, TouchableOpacity, ScrollView, Alert } from "react-native";
import { customerQueries, customerAssistants } from "../global/data";
import { tw } from "nativewind";

export default function MonitorCustomerAssistance() {
  const [queries, setQueries] = useState(customerQueries);

  const escalateIssue = (queryId) => {
    Alert.alert("Confirm Escalation", "Are you sure you want to escalate this issue?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Escalate",
        onPress: () => {
          setQueries((prevQueries) =>
            prevQueries.map((q) => (q.id === queryId ? { ...q, status: "escalated" } : q))
          );
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView className="p-4">
        <Text className="text-xl font-bold text-center mb-4">Customer Assistance Monitoring</Text>

        <Text className="text-lg font-semibold mb-3">Customer Assistance Agents</Text>
        <FlatList
          data={customerAssistants}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <View className={`p-4 rounded-lg mr-3 w-36 text-center ${
              item.status === "available" ? "bg-green-200" : item.status === "busy" ? "bg-red-200" : "bg-gray-300"
            }`}>
              <Text className="text-md font-bold">{item.firstName} {item.lastName}</Text>
              <Text className="text-sm text-gray-700">Status: {item.status}</Text>
            </View>
          )}
        />

        <Text className="text-lg font-semibold mt-6 mb-3">Customer Queries</Text>
        <FlatList
          data={queries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className={`p-4 rounded-lg mb-3 ${
              item.status === "pending" ? "bg-yellow-200" : item.status === "resolved" ? "bg-green-200" : "bg-red-200"
            }`}>
              <Text className="text-md font-bold">Query ID: {item.id}</Text>
              <Text className="text-sm text-gray-800">Customer: {item.customer}</Text>
              <Text className="text-sm text-gray-800">Issue: {item.issue}</Text>
              <Text className="text-sm font-semibold mt-2">Status: {item.status}</Text>
              {item.status === "pending" && (
                <TouchableOpacity
                  className="bg-red-600 py-2 mt-2 rounded-lg items-center"
                  onPress={() => escalateIssue(item.id)}
                >
                  <Text className="text-white font-bold">Escalate Issue</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
