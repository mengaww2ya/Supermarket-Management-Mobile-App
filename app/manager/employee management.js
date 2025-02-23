import { SafeAreaView, ScrollView, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function EmployeeManagement() {
  const menuOptions = [
    {
      title: "Delivery Agent",
      subtitle: "Manage & Assign Deliveries",
      icon: "bicycle-outline",
      navigate: "/manager/deliveryManagement",
    },
    {
      title: "Customer Assistance",
      subtitle: "Manage Customer Support",
      icon: "people-outline",
      navigate: "/manager/customerAssistance",
    },
    {
      title: "Stock Manager",
      subtitle: "Manage Stock & Inventory",
      icon: "cube-outline",
    },
    {
      title: "Schedule",
      subtitle: "Manage Shifts & Work Hours",
      icon: "calendar-outline",
    },
  ];
const router =useRouter();
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView className="px-4 py-6">
        {/* Header */}
        <View className="bg-blue-600 p-5 rounded-lg shadow-lg">
          <Text className="text-2xl font-bold text-white text-center">Employee Management</Text>
        </View>

        {/* Employee Management Options - Two Columns */}
        <View className="mt-6 flex-row flex-wrap justify-between">
          {menuOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              className="bg-white w-[48%] p-5 rounded-xl shadow-lg mb-4 active:bg-gray-200"
              style={{
                minHeight: 130,
                justifyContent: "center",
                alignItems: "center",
                elevation: 5,
              }}
              onPress={() =>router.push(option.navigate)}
            >
              <Ionicons name={option.icon} size={30} color="#007bff" className="mb-3" />
              <Text className="text-lg font-semibold text-gray-800">{option.title}</Text>
              <Text className="text-gray-500 text-sm mt-1 text-center">{option.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
