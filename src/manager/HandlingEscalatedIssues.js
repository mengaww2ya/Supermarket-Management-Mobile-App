import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { escalatedIssues } from "../global/data";

export default function handleEscalatedIssues() {
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

  const renderPriority = (priority) => {
    let color = "#ccc";
    if (priority === "high") color = "#e74c3c";
    else if (priority === "medium") color = "#f1c40f";
    else if (priority === "low") color = "#2ecc71";

    return (
      <Text style={[styles.priority, { backgroundColor: color }]}>
        {priority.toUpperCase()}
      </Text>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Escalated Issues</Text>
      <FlatList
        data={issues}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.issueCard}>
            <View style={styles.issueHeader}>
              <Text style={styles.issueTitle}>{item.issue}</Text>
              {renderPriority(item.priority)}
            </View>
            <Text style={styles.issueText}>Customer: {item.customer}</Text>
            <Text style={styles.issueText}>
              Escalated By: {item.escalatedBy}
            </Text>
            <TouchableOpacity
              style={styles.resolveButton}
              onPress={() => handleResolve(item.id)}
            >
              <Text style={styles.buttonText}>Resolve</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f8f8" },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
  },
  issueCard: {
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    elevation: 2,
  },
  issueHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  issueTitle: { fontSize: 18, fontWeight: "bold", color: "#333" },
  issueText: { fontSize: 16, color: "#555", marginTop: 5 },
  priority: { padding: 5, borderRadius: 5, color: "#fff", fontWeight: "bold" },
  resolveButton: {
    backgroundColor: "#27ae60",
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  buttonText: { color: "white", fontWeight: "bold", textAlign: "center" },
});
