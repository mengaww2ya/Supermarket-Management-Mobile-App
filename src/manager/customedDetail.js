import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";

export default function CustomerDetail({ route, navigation }) {
  const { customer } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Customer Details</Text>

      <View style={styles.infoContainer}>
        <Text style={styles.info}>
          <Text style={styles.label}>User ID:</Text> {customer.id}
        </Text>
        <Text style={styles.info}>
          <Text style={styles.label}>User Name:</Text> {customer.userName}
        </Text>
        <Text style={styles.info}>
          <Text style={styles.label}>First Name:</Text> {customer.firstName}
        </Text>
        <Text style={styles.info}>
          <Text style={styles.label}>Last Name:</Text> {customer.lastName}
        </Text>
        <Text style={styles.info}>
          <Text style={styles.label}>Phone:</Text> {customer.phone}
        </Text>
        <Text style={styles.info}>
          <Text style={styles.label}>Address:</Text> {customer.address}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Pressable
          style={styles.updateButton}
          onPress={() => alert("Update feature coming soon!")}
        >
          <Text style={styles.buttonText}>Update</Text>
        </Pressable>
        <Pressable
          style={styles.deleteButton}
          onPress={() => alert("Delete feature coming soon!")}
        >
          <Text style={styles.buttonText}>Delete</Text>
        </Pressable>
        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Back to List</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
justifyContent:"center",
    flex: 1,
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  infoContainer: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  info: {
    fontSize: 16,
    paddingVertical: 5,
  },
  label: {
    fontWeight: "bold",
    color: "#007BFF",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  updateButton: {
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 5,
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    padding: 12,
    borderRadius: 5,
  },
  backButton: {
    backgroundColor: "#6c757d",
    padding: 12,
    borderRadius: 5,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
});
