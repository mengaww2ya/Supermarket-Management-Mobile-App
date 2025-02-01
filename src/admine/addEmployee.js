import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

export default function AddEmployee() {
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [roles, setRoles] = useState([
    { label: "Manager", value: "manager" },
    { label: "Stock Manager", value: "stock_manager" },
    { label: "Delivery Agent", value: "delivery_agent" },
    { label: "Customer Assistance", value: "customer_assistance" },
  ]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Add Employee</Text>

          <View style={styles.formView}>
            {/* Employee Details */}
            <TextInput
              style={styles.textInput}
              placeholder="Enter First Name"
            />
            <TextInput style={styles.textInput} placeholder="Enter Last Name" />
            <TextInput
              style={styles.textInput}
              placeholder="Enter Phone"
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.textInput}
              placeholder="Enter Password"
              secureTextEntry
            />
            <TextInput
              style={styles.textInput}
              placeholder="Confirm Password"
              secureTextEntry
            />

            {/* Emergency Contact */}
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter Contact First Name"
            />
            <TextInput
              style={styles.textInput}
              placeholder="Enter Contact Last Name"
            />
            <TextInput
              style={styles.textInput}
              placeholder="Enter Contact Phone"
              keyboardType="phone-pad"
            />

            {/* Employee Role Selection */}
            <Text style={styles.sectionTitle}>Select Employee Role</Text>
            <DropDownPicker
              open={open}
              value={selectedRole}
              items={roles}
              setOpen={setOpen}
              setValue={setSelectedRole}
              setItems={setRoles}
              style={styles.dropdown}
              containerStyle={styles.dropdownContainer}
              placeholder="Select a role"
            />

            {selectedRole && (
              <Text style={styles.selectedText}>
                Selected Role: {selectedRole}
              </Text>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.button}
              onPress={() =>
                alert("Hey! this button is not functional right now.", "ok")
              }
            >
              <Text style={styles.buttonText}>Add Employee</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  container: {
    flex: 1,
    padding: 15,
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  formView: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  textInput: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 12,
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginVertical: 10,
    color: "#555",
  },
  dropdownContainer: {
    marginBottom: 12,
  },
  dropdown: {
    borderColor: "#ddd",
  },
  selectedText: {
    fontSize: 16,
    color: "#007BFF",
    fontWeight: "bold",
    marginVertical: 8,
  },
  button: {
    backgroundColor: "#007BFF",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
