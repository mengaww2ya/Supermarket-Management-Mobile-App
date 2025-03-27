import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Modal,
} from "react-native";
import { channels } from "../global/data.js";

export default function ChannelOverview() {
  const [channelList, setChannelList] = useState(channels);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openDetailsModal = (channel) => {
    setSelectedChannel(channel);
    setModalVisible(true);
  };

  const updateChannelStatus = (status) => {
    setChannelList((prevChannels) =>
      prevChannels.map((channel) =>
        channel.id === selectedChannel.id ? { ...channel, status } : channel
      )
    );
    setSelectedChannel({ ...selectedChannel, status });
  };

  return (
    <SafeAreaView className="flex-1  bg-grey1">
      <ScrollView className="px-4 py-5">
        <View className="py-4">
          <Text className="text-2xl font-bold text-center mb-4">
            Channel Overview
          </Text>
          
          <View className="flex-row flex-wrap justify-between">
            {channelList.map((channel) => (
              <TouchableOpacity
                key={channel.id}
                className="w-[48%] bg-white p-4 rounded-lg mb-3 shadow-md"
                onPress={() => openDetailsModal(channel)}
                activeOpacity={0.7}
              >
                <Text className="text-lg font-bold">{channel.name}</Text>
                <Text className="text-sm text-gray-600">
                  Last Activity: {channel.lastActivity}
                </Text>
                <Text
                  className={`text-sm font-bold mt-2 ${
                    channel.status === "Active"
                      ? "text-green-600"
                      : channel.status === "Inactive"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                >
                  {channel.status}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <Modal transparent visible={modalVisible} animationType="slide">
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white p-6 rounded-lg w-4/5">
            <Text className="text-xl font-bold mb-4">Channel Details</Text>
            {selectedChannel && (
              <>
                <Text className="text-lg">
                  <Text className="font-semibold">Name:</Text> {selectedChannel.name}
                </Text>
                <Text className="text-lg">
                  <Text className="font-semibold">Status:</Text> {selectedChannel.status}
                </Text>
                <Text className="text-lg">
                  <Text className="font-semibold">Last Activity:</Text> {selectedChannel.lastActivity}
                </Text>
                <Text className="text-lg">
                  <Text className="font-semibold">Description:</Text> {selectedChannel.description || "No description available"}
                </Text>
                
                <View className="flex-row flex-wrap justify-center gap-3 mt-4">
                  <TouchableOpacity
                    className={`px-4 py-2 rounded-lg text-white ${selectedChannel.status === "Active" ? "bg-gray-400" : "bg-green-600"}`}
                    onPress={() => updateChannelStatus("Active")}
                    disabled={selectedChannel.status === "Active"}
                  >
                    <Text className="text-white font-bold">Activate</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className={`px-4 py-2 rounded-lg text-white ${selectedChannel.status === "Inactive" ? "bg-gray-400" : "bg-red-600"}`}
                    onPress={() => updateChannelStatus("Inactive")}
                    disabled={selectedChannel.status === "Inactive"}
                  >
                    <Text className="text-white font-bold">Deactivate</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className={`px-4 py-2 rounded-lg text-white ${selectedChannel.status === "Under Maintenance" ? "bg-gray-400" : "bg-yellow-600"}`}
                    onPress={() => updateChannelStatus("Under Maintenance")}
                    disabled={selectedChannel.status === "Under Maintenance"}
                  >
                    <Text className="text-white font-bold">Maintenance</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            <TouchableOpacity
              className="mt-4 bg-red-500 px-4 py-2 rounded-lg w-full text-center"
              onPress={() => setModalVisible(false)}
            >
              <Text className="text-white font-bold text-center">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
