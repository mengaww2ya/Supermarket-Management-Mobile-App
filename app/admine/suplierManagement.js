import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";

export default function SupplierManagement({ navigation }) {
  const buttons = [
    { title: "Add Supplier", subtitle: "Register new supplier", screen: "AddSupplier" },
    { title: "Delete Supplier", subtitle: "Remove existing supplier", screen: "DeleteSupplier" },
    { title: "Update Supplier", subtitle: "Modify supplier details", screen: "UpdateSupplier" },
    { title: "View Supplier List", subtitle: "See all suppliers", screen: "ViewSupplier" },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-100 p-4">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="bg-white p-5 rounded-xl shadow-lg">
          <Text className="text-2xl font-bold text-center text-gray-800 mb-4">Supplier Management</Text>
          <View className="flex-row flex-wrap justify-between">
            {buttons.map((btn, index) => (
              <TouchableOpacity
                key={index}
                className="w-[47%] bg-blue-600 p-5 rounded-xl shadow-md mb-4 active:scale-95"
                onPress={() => navigation.navigate(btn.screen)}
              >
                <Text className="text-lg font-semibold text-white text-center">{btn.title}</Text>
                <Text className="text-xs text-gray-200 text-center mt-1">{btn.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
