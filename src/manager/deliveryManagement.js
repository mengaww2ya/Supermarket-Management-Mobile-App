import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from "react-native";
import { deliveryAgents } from "../global/data";

export default function DeliveryAgentManagement({ navigation }) {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Function to get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return "#28a745"; // Green
      case "busy":
        return "#ffc107"; // Yellow
      case "unavailable":
        return "#dc3545"; // Red
      default:
        return "#6c757d"; // Gray
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Manage Delivery Agents</Text>
      <FlatList
        data={deliveryAgents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.agentCard}>
            {/* Agent Name Button */}
            <TouchableOpacity
              style={styles.agentButton}
              onPress={() => {
                setSelectedAgent(item);
                setModalVisible(true);
              }}
            >
              <Text style={styles.agentName}>
                {item.firstName} {item.lastName}
              </Text>
            </TouchableOpacity>
            <Text
              style={[
                styles.agentStatus,
                { color: getStatusColor(item.status) },
              ]}
            >
              {item.status.toUpperCase()}
            </Text>
          </View>
        )}
      />

      {/* Modal Popup for Agent Details */}
      {selectedAgent && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {selectedAgent.firstName} {selectedAgent.lastName}
              </Text>
              <Text style={styles.detailText}>
                Phone: {selectedAgent.phone}
              </Text>
              <Text style={styles.detailText}>
                Status: {selectedAgent.status}
              </Text>
              <Text style={styles.detailText}>
                Rating: ⭐ {selectedAgent.rating}
              </Text>
              <Text style={styles.detailText}>
                Completed Orders: {selectedAgent.completedOrders}
              </Text>
              <TouchableOpacity
                style={styles.assignButton}
                onPress={() => {
                  navigation.navigate("mdeliveryOrders", {
                    agentId: selectedAgent.id,
                    AgentName: selectedAgent.firstName,
                  });
                  setModalVisible(false);
                }}
              >
                <Text style={styles.assignText}>Assign Delivery</Text>
              </TouchableOpacity>
              <Pressable
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f4f4f4",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  agentCard: {
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    elevation: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  agentButton: {
    flex: 1,
  },
  agentName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#007bff",
    textDecorationLine: "underline",
  },
  agentStatus: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  detailText: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  assignButton: {
    backgroundColor: "#007bff",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginTop: 10,
  },
  assignText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  closeButton: {
    marginTop: 10,
    padding: 10,
  },
  closeText: {
    fontSize: 16,
    color: "red",
  },
});
