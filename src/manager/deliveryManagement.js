import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { deliveryAgents } from "../global/data";

export default function DeliveryAgentManagement({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Manage Delivery Agents</Text>
      <FlatList
        data={deliveryAgents}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.agentCard}>
            <Text style={styles.agentName}>
              {item.firstName} {item.lastName}
            </Text>
            <Text style={styles.agentStatus}>Status: {item.status}</Text>
            {item.status === "available" && (
              <TouchableOpacity
                style={styles.assignButton}
                onPress={() =>
                  navigation.navigate("OrderSelectionScreen", {
                    agentId: item.id,
                  })
                }
              >
                <Text style={styles.assignText}>Assign Order</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f8f8" },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  agentCard: {
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    elevation: 2,
  },
  agentName: { fontSize: 18, fontWeight: "bold", color: "#333" },
  agentStatus: { fontSize: 16, color: "gray" },
  assignButton: {
    backgroundColor: "blue",
    padding: 10,
    marginTop: 5,
    borderRadius: 5,
    alignItems: "center",
  },
  assignText: { color: "white", fontWeight: "bold" },
});
