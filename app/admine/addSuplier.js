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
  Alert,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

export default function AddSupplier() {
  const [open, setOpen] = useState(false);
  const [productType, setProductType] = useState(null);
  const [supplier, setSupplier] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    address: "",
  });
  const [productOptions, setProductOptions] = useState([
    { label: "Groceries", value: "groceries" },
    { label: "Beverages", value: "beverages" },
    { label: "Electronics", value: "electronics" },
    { label: "Household Items", value: "household" },
  ]);

  const handleInputChange = (field, value) => {
    setSupplier({ ...supplier, [field]: value });
  };

  const handleSubmit = () => {
    if (!supplier.name || !supplier.company || !supplier.email || !supplier.phone || !supplier.address || !productType) {
      Alert.alert("Error", "All fields are required");
      return;
    }
    Alert.alert("Success", "Supplier added successfully!");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 p-4">
        <ScrollView contentContainerClassName="pb-6">
          <Text className="text-2xl font-bold text-center text-gray-800 mb-5">Add Supplier</Text>
          
          <View className="bg-white p-4 rounded-xl shadow-md">
            <TextInput className="border border-gray-300 p-3 rounded-md mb-3" placeholder="Supplier Name" value={supplier.name} onChangeText={(text) => handleInputChange("name", text)} />
            <TextInput className="border border-gray-300 p-3 rounded-md mb-3" placeholder="Company Name" value={supplier.company} onChangeText={(text) => handleInputChange("company", text)} />
            <TextInput className="border border-gray-300 p-3 rounded-md mb-3" placeholder="Email" keyboardType="email-address" value={supplier.email} onChangeText={(text) => handleInputChange("email", text)} />
            <TextInput className="border border-gray-300 p-3 rounded-md mb-3" placeholder="Phone" keyboardType="phone-pad" value={supplier.phone} onChangeText={(text) => handleInputChange("phone", text)} />
            <TextInput className="border border-gray-300 p-3 rounded-md mb-3" placeholder="Address" multiline numberOfLines={3} value={supplier.address} onChangeText={(text) => handleInputChange("address", text)} />
            
            <Text className="text-lg font-semibold text-gray-700 mb-2">Product Type</Text>
            <DropDownPicker open={open} value={productType} items={productOptions} setOpen={setOpen} setValue={setProductType} setItems={setProductOptions} placeholder="Select Product Type" className="border border-gray-300 rounded-md mb-3" />
            
            {productType && <Text className="text-blue-600 font-semibold text-center mb-3">Selected Product Type: {productType}</Text>}

            <TouchableOpacity className="bg-blue-600 p-4 rounded-lg items-center" onPress={handleSubmit}>
              <Text className="text-white text-lg font-bold">Add Supplier</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
