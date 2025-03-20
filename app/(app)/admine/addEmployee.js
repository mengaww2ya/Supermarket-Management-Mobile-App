import React, { useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
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
    <SafeAreaView className="flex-1 bg-grey1 justify-center p-4">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerClassName=" p-5 bg-white"
        >
          <Text className="text-2xl font-bold text-center text-grey1 mb-5">
            Add Employee
          </Text>

          {/* <View className="bg-white rounded-xl p-2 shadow-md"> */}
            <Text className="font-bold  text-gray-700 m-2">
            First Name
          </Text>
            <TextInput
              className="border border-gray-500 p-3 bg-slate-200 rounded-lg ml-3 text-gray-700"
              placeholder="First Name"
              value={form.firstName}
              onChangeText={(text) => handleInputChange("firstName", text)}
            />
              <Text className="font-bold  text-gray-700 m-2">
            Last Name
          </Text>
            <TextInput
              className="border border-gray-500 p-3 bg-slate-200 rounded-lg ml-3 text-gray-700"
              placeholder="Last Name"
              value={form.lastName}
              onChangeText={(text) => handleInputChange("lastName", text)}
            />
              <Text className="font-bold  text-gray-700 m-2">
            Phone Number
          </Text>
            <TextInput
              className="border border-gray-500 p-3 bg-slate-200 rounded-lg ml-3 text-gray-700"
              placeholder="Phone Number"
              keyboardType="phone-pad"
              value={form.phone}
              onChangeText={(text) => handleInputChange("phone", text)}
            />
              <Text className="font-bold  text-gray-700 m-2">
            Password
          </Text>
            <TextInput
              className="border border-gray-500 p-3 bg-slate-200 rounded-lg ml-3 text-gray-700"
              placeholder="Password"
              secureTextEntry
              value={form.password}
              onChangeText={(text) => handleInputChange("password", text)}
            />
              <Text className="font-bold  text-gray-700 m-2">
          Confirm  Password
          </Text>
            <TextInput
              className="border border-gray-500 p-3 bg-slate-200 rounded-lg ml-3 text-gray-700"
              placeholder="Confirm Password"
              secureTextEntry
              value={form.confirmPassword}
              onChangeText={(text) => handleInputChange("confirmPassword", text)}
            />
            
            <Text className="font-semibold text-gray-700 mt-3 mb-2 text-center " >
              Emergency Contact
            </Text>
              <Text className="font-bold  text-gray-700 m-2">
           Contact First Name
          </Text>
            <TextInput
              className="border border-gray-500 p-3 bg-slate-200 rounded-lg ml-3 text-gray-700"
              placeholder="Emergency First Name"
              value={form.emergencyFirstName}
              onChangeText={(text) => handleInputChange("emergencyFirstName", text)}
            />
              <Text className="font-bold  text-gray-700 m-2">
            Contact Last Name
          </Text>
            <TextInput
              className="border border-gray-500 p-3 bg-slate-200 rounded-lg ml-3 text-gray-700"
              placeholder="Emergency Last Name"
              value={form.emergencyLastName}
              onChangeText={(text) => handleInputChange("emergencyLastName", text)}
            />
              <Text className="font-bold  text-gray-700 m-2">
            Contact Phone
          </Text>
            <TextInput
              className="border border-gray-500 p-3 bg-slate-200 rounded-lg ml-3 text-gray-700"
              placeholder="Emergency Phone"
              keyboardType="phone-pad"
              value={form.emergencyPhone}
              onChangeText={(text) => handleInputChange("emergencyPhone", text)}
            />
            <Text className="font-semibold text-gray-700 mt-3 mb-2 text-center">
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
              className="border border-gray-500 rounded-lg ml-3 text-gray-700"
            />

            {selectedRole && (
              <Text className="text-blue-600 font-semibold mt-2">
                Selected Role: {roles.find((r) => r.value === selectedRole)?.label}
              </Text>
            )}

            <TouchableOpacity
              className="bg-blue-500 p-4 rounded-lg mt-4"
              onPress={handleSubmit}
            >
              <Text className="text-white font-bold text-center">
                Add Employee
              </Text>
            </TouchableOpacity>
          {/* </View> */}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
