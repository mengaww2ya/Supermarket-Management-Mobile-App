import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { customerQueries, customerAssistants } from "../global/data"; // Importing data

export default function MonitorCustomerAssistance() {
  const [queries, setQueries] = useState(customerQueries);

  // Function to escalate an issue
  const escalateIssue = (queryId) => {
    Alert.alert(
      "Confirm Escalation",
      "Are you sure you want to escalate this issue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Escalate",
          onPress: () => {
            setQueries((prevQueries) =>
              prevQueries.map((q) =>
                q.id === queryId ? { ...q, status: "escalated" } : q
              )
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView>
        <View style={styles.container}>
          {/* Page Header */}
          <Text style={styles.title}>Customer Assistance Monitoring</Text>

          {/* Section: Active Agents */}
          <Text style={styles.sectionTitle}>Customer Assistance Agents</Text>
          <FlatList
            data={customerAssistants}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.agentCard,
                  item.status === "available"
                    ? styles.available
                    : item.status === "busy"
                    ? styles.busy
                    : styles.offline,
                ]}
              >
                <Text style={styles.agentName}>
                  {item.firstName} {item.lastName}
                </Text>
                <Text style={styles.agentStatus}>Status: {item.status}</Text>
              </View>
            )}
          />

          {/* Section: Customer Queries */}
          <Text style={styles.sectionTitle}>Customer Queries</Text>
          <FlatList
            data={queries}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.queryCard,
                  item.status === "pending"
                    ? styles.pending
                    : item.status === "resolved"
                    ? styles.resolved
                    : styles.escalated,
                ]}
              >
                <Text style={styles.queryTitle}>Query ID: {item.id}</Text>
                <Text style={styles.queryDetail}>
                  Customer: {item.customer}
                </Text>
                <Text style={styles.queryDetail}>Issue: {item.issue}</Text>
                <Text style={styles.queryStatus}>Status: {item.status}</Text>

                {/* Manager Actions */}
                {item.status === "pending" && (
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => escalateIssue(item.id)}
                  >
                    <Text style={styles.actionText}>Escalate Issue</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f5f5f5" },
  container: { padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },

  // Agent Cards
  agentCard: {
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
    width: 150,
    alignItems: "center",
  },
  available: { backgroundColor: "#d4edda" },
  busy: { backgroundColor: "#f8d7da" },
  offline: { backgroundColor: "#ccc" },
  agentName: { fontSize: 16, fontWeight: "bold" },
  agentStatus: { fontSize: 14, color: "#555" },

  // Query Cards
  queryCard: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  pending: { backgroundColor: "#ffeeba" },
  resolved: { backgroundColor: "#d4edda" },
  escalated: { backgroundColor: "#f8d7da" },
  queryTitle: { fontSize: 16, fontWeight: "bold" },
  queryDetail: { fontSize: 14, color: "#333" },
  queryStatus: { fontSize: 14, fontWeight: "bold", marginTop: 5 },

  // Action Button
  actionButton: {
    backgroundColor: "red",
    padding: 10,
    marginTop: 5,
    borderRadius: 5,
    alignItems: "center",
  },
  actionText: { color: "white", fontWeight: "bold" },
});
