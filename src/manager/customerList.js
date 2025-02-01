import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { customer } from "../global/data.js";

export default function CustomerList({navigation}) {
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const openModal = (customer) => {
    setSelectedCustomer(customer);
    setModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>All Registered Supermarket Customers</Text>

      {/* Table Headers */}
      <View style={[styles.row, styles.header]}>
        <Text style={styles.headerText}>User ID</Text>
        <Text style={styles.headerText}>User Name</Text>
        <Text style={styles.headerText}>First Name</Text>
        <Text style={styles.headerText}>Last Name</Text>
        {/* <Text style={styles.headerText}>Phone</Text> */}
      </View>

      {/* List of Customers */}
      <FlatList
        data={customer}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} onPress={() => openModal(item)}>
            <Text style={styles.cell}>{item.id}</Text>
            <Text style={styles.cell}>{item.userName}</Text>
            <Text style={styles.cell}>{item.firstName}</Text>
            <Text style={styles.cell}>{item.lastName}</Text>
            {/* <Text style={styles.cell}>{item.phone}</Text> */}
            {/* <Text style={styles.cell}>{item.address}</Text> */}
          </TouchableOpacity>
        )}
      />

      {/* Modal for Customer Details */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Customer Details</Text>

            {selectedCustomer && (
              <>
                <Text style={styles.detailText}>
                  <Text style={styles.label}>User ID:</Text>{" "}
                  {selectedCustomer.id}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.label}>Username:</Text>{" "}
                  {selectedCustomer.userName}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.label}>First Name:</Text>{" "}
                  {selectedCustomer.firstName}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.label}>Last Name:</Text>{" "}
                  {selectedCustomer.lastName}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.label}>Phone:</Text>{" "}
                  {selectedCustomer.phone}
                </Text>
                <Text style={styles.detailText}>
                  <Text style={styles.label}>Address:</Text>{"  "}
                  {selectedCustomer.address}
                </Text>
              </>
            )}

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
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: "#F5F5F5",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 15,
    color: "#333",
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 10,
    backgroundColor: "white",
    alignItems: "center",
  },
  cell: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    paddingHorizontal: 5,
    color: "#555",
  },
  header: {
    backgroundColor: "#007BFF",
    paddingVertical: 8,
    borderRadius: 5,
  },
  headerText: {
    flex: 1,
    fontWeight: "bold",
    textAlign: "center",
    color: "white",
    fontSize: 14,
  },

  // Modal Styles
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 15,
  },
  detailText: {
    fontSize: 16,
    marginVertical: 3,
    textAlign: "left",
    width: "100%",
  },
  label: {
    fontWeight: "bold",
    color: "#007BFF",
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: "#FF3B30",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  buttonContainer: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  updateButton: {
    backgroundColor: "#28a745",
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
});
