import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { Alert } from "react-native";

export default function AddEmployee() {
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [roles, setRoles] = useState([
    { label: "Manager", value: "manager" },
    { label: "Stock Manager", value: "stock_manager" },
    { label: "Delivery Agent", value: "delivery_agent" },
    { label: "Customer Assistance", value: "customer_assistance" },
  ]);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
    confirmPassword: "",
    emergencyFirstName: "",
    emergencyLastName: "",
    emergencyPhone: "",
  });

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.firstName || !form.lastName || !form.phone || !selectedRole) {
      Alert.alert("Error", "Please fill all required fields.");
      return;
    }
    Alert.alert("Success", "Employee added successfully!");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 p-4">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
          <Text className="text-2xl font-bold text-center text-gray-800 mb-5">
            Add Employee
          </Text>

          <View className="bg-white p-4 rounded-xl shadow-md">
            <TextInput
              className="border border-gray-300 p-3 rounded-lg mb-3"
              placeholder="First Name"
              value={form.firstName}
              onChangeText={(text) => handleInputChange("firstName", text)}
            />
            <TextInput
              className="border border-gray-300 p-3 rounded-lg mb-3"
              placeholder="Last Name"
              value={form.lastName}
              onChangeText={(text) => handleInputChange("lastName", text)}
            />
            <TextInput
              className="border border-gray-300 p-3 rounded-lg mb-3"
              placeholder="Phone Number"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(text) => handleInputChange("phone", text)}
            />
            <TextInput
              className="border border-gray-300 p-3 rounded-lg mb-3"
              placeholder="Password"
              secureTextEntry
              value={form.password}
              onChangeText={(text) => handleInputChange("password", text)}
            />
            <TextInput
              className="border border-gray-300 p-3 rounded-lg mb-3"
              placeholder="Confirm Password"
              secureTextEntry
              value={form.confirmPassword}
              onChangeText={(text) => handleInputChange("confirmPassword", text)}
            />

            <Text className="text-lg font-semibold text-gray-700 mt-3 mb-2">
              Emergency Contact
            </Text>
            <TextInput
              className="border border-gray-300 p-3 rounded-lg mb-3"
              placeholder="Emergency First Name"
              value={form.emergencyFirstName}
              onChangeText={(text) => handleInputChange("emergencyFirstName", text)}
            />
            <TextInput
              className="border border-gray-300 p-3 rounded-lg mb-3"
              placeholder="Emergency Last Name"
              value={form.emergencyLastName}
              onChangeText={(text) => handleInputChange("emergencyLastName", text)}
            />
            <TextInput
              className="border border-gray-300 p-3 rounded-lg mb-3"
              placeholder="Emergency Phone"
              keyboardType="phone-pad"
              value={form.emergencyPhone}
              onChangeText={(text) => handleInputChange("emergencyPhone", text)}
            />

            <Text className="text-lg font-semibold text-gray-700 mt-3 mb-2">
              Select Employee Role
            </Text>
            <DropDownPicker
              open={open}
              value={selectedRole}
              items={roles}
              setOpen={setOpen}
              setValue={setSelectedRole}
              setItems={setRoles}
              placeholder="Select a role"
              className="border border-gray-300 rounded-lg mb-3"
            />

            {selectedRole && (
              <Text className="text-blue-600 font-semibold text-lg mt-2">
                Selected Role: {roles.find((r) => r.value === selectedRole)?.label}
              </Text>
            )}

            <TouchableOpacity
              className="bg-blue-500 p-4 rounded-lg mt-4"
              onPress={handleSubmit}
            >
              <Text className="text-white text-lg font-bold text-center">
                Add Employee
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
