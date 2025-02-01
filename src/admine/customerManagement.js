import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { colors } from "react-native-elements";

export default function CustomerManagement() {
  const { width: screenWidth } = useWindowDimensions();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <Text style={styles.titleText}>Customer Management</Text>

        <View style={styles.container}>
          {/* Add New Customer */}
          <Pressable style={[styles.button, { width: screenWidth * 0.9 }]}>
            <Text style={styles.buttonTitle}>Add New Customer</Text>
            <Text style={styles.buttonText}>Add Customer</Text>
          </Pressable>

          {/* Delete Customer */}
          <Pressable style={[styles.button, { width: screenWidth * 0.9 }]}>
            <Text style={styles.buttonTitle}>Delete Existing Customer</Text>
            <Text style={styles.buttonText}>Delete Customer</Text>
          </Pressable>

          {/* Update Customer */}
          <Pressable style={[styles.button, { width: screenWidth * 0.9 }]}>
            <Text style={styles.buttonTitle}>Update Existing Customer</Text>
            <Text style={styles.buttonText}>Update Customer</Text>
          </Pressable>

          {/* View Customer List */}
          <Pressable style={[styles.button, { width: screenWidth * 0.9 }]}>
            <Text style={styles.buttonTitle}>Display All Customers</Text>
            <Text style={styles.buttonText}>View Customer List</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// 🎨 Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  titleText: {
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginBottom: 25,
  },
  container: {
    width: "100%",
    alignItems: "center",
  },
  button: {
    backgroundColor: colors.grey5,
    width: "47%",
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    borderColor: colors.grey4,
    borderWidth: 1,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 5,
    color: "#333",
  },
  buttonText: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
});
