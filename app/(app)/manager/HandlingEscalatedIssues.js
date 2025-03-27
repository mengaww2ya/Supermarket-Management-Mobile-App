import React, { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert } from "react-native";
import { escalatedIssues } from "../../global/data";

export default function HandleEscalatedIssues() {
  const [issues, setIssues] = useState(escalatedIssues);

  const handleResolve = (issueId) => {
    Alert.alert(
      "Confirm Resolution",
      "Are you sure you want to mark this issue as resolved?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          onPress: () => {
            setIssues((prevIssues) =>
              prevIssues.filter((issue) => issue.id !== issueId)
            );
            Alert.alert("Success", "Issue marked as resolved.");
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-100 p-4">
      <Text className="text-xl font-bold text-center mb-4">Escalated Issues</Text>
      <FlatList
        data={issues}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="bg-white p-4 mb-3 rounded-lg shadow-md">
            <View className="flex-row justify-between items-center">
              <Text className="text-lg font-semibold text-gray-800">
                {item.issue}
              </Text>
              <Text
                className={`text-white px-3 py-1 rounded-md font-bold ${
                  item.priority === "high"
                    ? "bg-red-500"
                    : item.priority === "medium"
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
              >
                {item.priority.toUpperCase()}
              </Text>
            </View>
            <Text className="text-gray-600 mt-2">Customer: {item.customer}</Text>
            <Text className="text-gray-600">Escalated By: {item.escalatedBy}</Text>
            <TouchableOpacity
              className="bg-green-600 mt-3 py-2 rounded-lg active:bg-green-700"
              onPress={() => handleResolve(item.id)}
            >
              <Text className="text-white text-center font-semibold">Resolve</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}
