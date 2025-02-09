import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
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

  // Open Modal and Show Channel Details
  const openDetailsModal = (channel) => {
    setSelectedChannel(channel);
    setModalVisible(true);
  };

  // Update Channel Status
  const updateChannelStatus = (status) => {
    setChannelList((prevChannels) =>
      prevChannels.map((channel) =>
        channel.id === selectedChannel.id ? { ...channel, status } : channel
      )
    );
    setSelectedChannel({ ...selectedChannel, status });
  };

  return (
    <SafeAreaView style={styles.safearea}>
      <ScrollView style={styles.scrollview}>
        <View style={styles.container}>
          <Text style={styles.title}>Channel Overview</Text>
          {channelList.map((channel) => (
            <TouchableOpacity
              key={channel.id}
              style={styles.channelCard}
              onPress={() => openDetailsModal(channel)}
            >
              <View>
                <Text style={styles.channelName}>{channel.name}</Text>
                <Text style={styles.lastActivity}>
                  Last Activity: {channel.lastActivity}
                </Text>
                <Text
                  style={[
                    styles.status,
                    channel.status === "Active"
                      ? styles.active
                      : channel.status === "Inactive"
                      ? styles.inactive
                      : styles.maintenance,
                  ]}
                >
                  {channel.status}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Channel Details Modal */}
      <Modal transparent visible={modalVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Channel Details</Text>
            {selectedChannel && (
              <>
                <Text style={styles.modalText}>
                  <Text style={styles.bold}>Name:</Text> {selectedChannel.name}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={styles.bold}>Status:</Text>{" "}
                  {selectedChannel.status}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={styles.bold}>Last Activity:</Text>{" "}
                  {selectedChannel.lastActivity}
                </Text>
                <Text style={styles.modalText}>
                  <Text style={styles.bold}>Description:</Text>{" "}
                  {selectedChannel.description || "No description available"}
                </Text>

                {/* Status Update Buttons */}
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      selectedChannel.status === "Active"
                        ? styles.disabledButton
                        : styles.activateButton,
                    ]}
                    onPress={() => updateChannelStatus("Active")}
                    disabled={selectedChannel.status === "Active"}
                  >
                    <Text style={styles.statusButtonText}>Activate</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      selectedChannel.status === "Inactive"
                        ? styles.disabledButton
                        : styles.deactivateButton,
                    ]}
                    onPress={() => updateChannelStatus("Inactive")}
                    disabled={selectedChannel.status === "Inactive"}
                  >
                    <Text style={styles.statusButtonText}>Deactivate</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      selectedChannel.status === "Under Maintenance"
                        ? styles.disabledButton
                        : styles.maintenanceButton,
                    ]}
                    onPress={() => updateChannelStatus("Under Maintenance")}
                    disabled={selectedChannel.status === "Under Maintenance"}
                  >
                    <Text style={styles.statusButtonText}>
                      Under Maintenance
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  safearea: { flex: 1, backgroundColor: "#f8f8f8" },
  scrollview: { paddingHorizontal: 15 },
  container: { paddingVertical: 20 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  channelCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 3,
  },
  channelName: { fontSize: 18, fontWeight: "bold" },
  lastActivity: { fontSize: 14, color: "#666" },
  status: { fontSize: 14, fontWeight: "bold", marginTop: 5 },
  active: { color: "green" },
  inactive: { color: "red" },
  maintenance: { color: "orange" },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  modalText: { fontSize: 16, marginBottom: 5 },
  bold: { fontWeight: "bold" },

  buttonContainer: { flexDirection: "row", marginTop: 10, gap: 5 ,flexWrap:"wrap",justifyContent:"center" },
  statusButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    alignItems: "center",
  },
  activateButton: { backgroundColor: "#2ecc71" },
  deactivateButton: { backgroundColor: "#e74c3c" },
  maintenanceButton: { backgroundColor: "#f39c12" },
  disabledButton: { backgroundColor: "#bdc3c7" },

  statusButtonText: { color: "#fff", fontWeight: "bold" ,width:"30" },
  closeButton: {
    marginTop: 15,
    backgroundColor: "#e74c3c",
    padding: 10,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
  },
  closeButtonText: { color: "#fff", fontWeight: "bold" },
});
