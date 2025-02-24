import { SafeAreaView, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function EmployeeManagement() {
  const navigation = useNavigation();

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
      >
        <View className="m-4 p-5 bg-white rounded-xl shadow-lg">
          <Text className="text-2xl font-bold text-center text-gray-800 mb-5">
            Employee Management
          </Text>

          <View className="flex-row flex-wrap justify-between">
            {[
              { title: "Add Employee", subtitle: "Add new employee", screen: "AddEmployee" },
              { title: "Delete Employee", subtitle: "Delete existing employee", screen: "DeleteEmployee" },
              { title: "Update Employee", subtitle: "Update employee info", screen: "UpdateEmployee" },
              { title: "Display Employee List", subtitle: "View all employees", screen: "DisplayEmployees" },
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                className="w-[47%] h-28 bg-blue-500 rounded-xl shadow-md mb-4 flex justify-center items-center active:scale-95"
                onPress={() => navigation.navigate(item.screen)}
              >
                <Text className="text-sm text-white font-medium text-center mb-1">
                  {item.subtitle}
                </Text>
                <Text className="text-lg font-bold text-white text-center">
                  {item.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
