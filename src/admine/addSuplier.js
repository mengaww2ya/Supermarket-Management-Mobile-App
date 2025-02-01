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
export default function AddSupplier() {
  const [open, setOpen] = useState(false);
  const [productType, setProductType] = useState(null);
  const [productOptions, setProductOptions] = useState([
    { label: "Groceries", value: "groceries" },
    { label: "Beverages", value: "beverages" },
    { label: "Electronics", value: "electronics" },
    { label: "Household Items", value: "household" },
  ]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={styles.title}>Add Supplier</Text>

          <View style={styles.formView}>
            {/* Supplier Details */}
            <TextInput style={styles.textInput} placeholder="Supplier Name" />
            <TextInput style={styles.textInput} placeholder="Company Name" />
            <TextInput
              style={styles.textInput}
              placeholder="Email"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.textInput}
              placeholder="Phone"
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.textInput}
              placeholder="Address"
              multiline
              numberOfLines={3}
            />

            {/* Product Type Selection */}
            <Text style={styles.sectionTitle}>Product Type</Text>
            <DropDownPicker
              open={open}
              value={productType}
              items={productOptions}
              setOpen={setOpen}
              setValue={setProductType}
              setItems={setProductOptions}
              style={styles.dropdown}
              containerStyle={styles.dropdownContainer}
              placeholder="Select Product Type"
            />

            {productType && (
              <Text style={styles.selectedText}>
                Selected Product Type: {productType}
              </Text>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.button}
              onPress={() =>
                alert("Hey! this button is not functional right now.", "ok")
              }
            >
              <Text style={styles.buttonText}>Add Supplier</Text>
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
