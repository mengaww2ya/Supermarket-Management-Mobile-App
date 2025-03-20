import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { deliveryAgents } from "../../global/data";
import { useRouter } from "expo-router";
export default function DeliveryAgentManagement() {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return "text-green-600";
      case "busy":
        return "text-yellow-500";
      case "unavailable":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };
const router=useRouter();
  return (
    <View className="flex-1 bg-gray-100 p-4">
      <Text className="text-2xl font-bold text-center text-gray-800 mb-4">
        Manage Delivery Agents
      </Text>
      
      <FlatList
        data={deliveryAgents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className="bg-white p-4 my-2 rounded-lg shadow flex-row justify-between items-center">
            <TouchableOpacity
              className="flex-1"
              onPress={() => {
                setSelectedAgent(item);
                setModalVisible(true);
              }}
            >
              <Text className="text-lg font-semibold text-blue-600 underline">
                {item.firstName} {item.lastName}
              </Text>
            </TouchableOpacity>
            <Text className={`text-lg font-semibold ${getStatusColor(item.status)}`}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        )}
      />

      {selectedAgent && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/50">
            <View className="bg-white p-6 rounded-lg w-4/5 items-center">
              <Text className="text-xl font-bold mb-2">
                {selectedAgent.firstName} {selectedAgent.lastName}
              </Text>
              <Text className="text-lg font-semibold mb-1">
                Phone: {selectedAgent.phone}
              </Text>
              <Text className="text-lg font-semibold mb-1">
                Status: {selectedAgent.status}
              </Text>
              <Text className="text-lg font-semibold mb-1">
                Rating: ⭐ {selectedAgent.rating}
              </Text>
              <Text className="text-lg font-semibold mb-3">
                Completed Orders: {selectedAgent.completedOrders}
              </Text>

              <TouchableOpacity
                className="bg-blue-600 px-4 py-2 rounded-lg mt-2"
                onPress={() => {
                  router.push({
                    pathname:"/manager/deliveryOrders", 
                    params:{
                    agentId: selectedAgent.id,
                    AgentName: selectedAgent.firstName,
                  }
                  });
                  setModalVisible(false);
                }}
              >
                <Text className="text-white font-bold text-lg">Assign Delivery</Text>
              </TouchableOpacity>

              <Pressable
                className="mt-4 p-2"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-red-500 text-lg font-semibold">Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
