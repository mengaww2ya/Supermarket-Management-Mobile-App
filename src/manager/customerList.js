import React from "react";
import { SafeAreaView, View, Text, StyleSheet, FlatList } from "react-native";
import { customer } from "../global/data.js";

export default function CustomerList() {
  return (
    <SafeAreaView style={{ flex: 1, padding: 10 }}>
      <View>
        <Text style={styles.title}>
          These all are registered supermarket customers
        </Text>

        <View style={styles.container}>
          <View style={[styles.row, styles.header]}>
            <Text style={styles.headerText}>User ID</Text>
            <Text style={styles.headerText}>User Name</Text>
            <Text style={styles.headerText}>First Name</Text>
            <Text style={styles.headerText}>Last Name</Text>
            <Text style={styles.headerText}>Phone</Text>
            <Text style={styles.headerText}>Address</Text>
          </View>
          <FlatList
            data={customer}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.row}>
                <Text style={styles.cell}>{item.id}</Text>
                <Text style={styles.cell}>{item.userName}</Text>
                <Text style={styles.cell}>{item.firstName}</Text>
                <Text style={styles.cell}>{item.lastName}</Text>
                <Text style={styles.cell}>{item.phone}</Text>
                <Text style={styles.cell}>{item.address}</Text>
              </View>
            )}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  container: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 8,
    paddingHorizontal: 1,
  },
  cell: {
    flex: 1,
    textAlign: "center",
  },
  header: {
    backgroundColor: "#f1f8ff",
    paddingVertical: 5,
  },
  headerText: {
    flex: 1,
    fontWeight: "bold",
    textAlign: "center",
  },
});
