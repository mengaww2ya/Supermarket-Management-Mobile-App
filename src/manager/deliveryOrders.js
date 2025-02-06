import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { deliveryOrders } from "../global/data";

export default function mDeliveryOrders({ route, navigation }) {
  const { agentId, AgentName } = route.params; // Get selected agent's ID
  const [orders, setOrders] = useState(
    deliveryOrders.filter((order) => order.status === "pending")
  );

  const assignOrder = (orderId) => {
    Alert.alert(
      "Confirm Assignment",
      `Are you sure you want to assign Order ${orderId} to ${AgentName}`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Assign",
          onPress: () => {
            // Update order status logic (In a real app, update the backend)
            const updatedOrders = orders.map((order) =>
              order.id === orderId ? { ...order, status: "assigned" } : order
            );
            setOrders(updatedOrders);
            Alert.alert("Success", `Order ${orderId} has been assigned.`);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select an Order to Assign</Text>
      {orders.length === 0 ? (
        <Text style={styles.noOrders}>No pending orders available.</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.orderItem,
                item.status === "assigned" && styles.assignedOrder,
              ]}
              onPress={() => assignOrder(item.id)}
              activeOpacity={0.7}
            >
              <View>
                <Text style={styles.orderText}>Order ID: {item.id}</Text>
                <Text style={styles.orderText}>Customer: {item.customer}</Text>
                <Text style={styles.orderText}>Address: {item.address}</Text>
                <Text
                  style={[
                    styles.orderStatus,
                    item.status === "assigned" && styles.statusAssigned,
                  ]}
                >
                  {item.status === "assigned" ? "Assigned" : "Pending"}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f4f4f4" },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
    color: "#333",
  },
  noOrders: {
    textAlign: "center",
    fontSize: 16,
    color: "gray",
    marginTop: 20,
  },
  orderItem: {
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    borderLeftWidth: 5,
    borderLeftColor: "#007bff",
  },
  assignedOrder: {
    borderLeftColor: "green",
    backgroundColor: "#e8f5e9",
  },
  orderText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 2,
  },
  orderStatus: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 5,
    color: "blue",
  },
  statusAssigned: {
    color: "green",
  },
});
