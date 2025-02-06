import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { deliveryOrders } from "../global/data";
export default function mdeliveryOrders({ route, navigation }) {
  const { agentId } = route.params; // Get selected agent's ID
  const [orders, setOrders] = useState(
    deliveryOrders.filter((order) => order.status === "pending")
  );

  const assignOrder = (orderId) => {
    // Logic to update order status (in real app, update the backend)
    alert(`Order ${orderId} assigned to agent ${agentId}`);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select an Order to Assign</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.orderItem}
            onPress={() => assignOrder(item.id)}
          >
            <Text style={styles.orderText}>Order ID: {item.id}</Text>
            <Text style={styles.orderText}>Customer: {item.customer}</Text>
            <Text style={styles.orderText}>Address: {item.address}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f8f8f8" },
  header: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  orderItem: {
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    elevation: 2,
  },
  orderText: { fontSize: 16, color: "#333" },
});
