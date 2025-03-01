import React from "react";
import { Text, View, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function AdminHomePage() {
  const router=useRouter();
  return (
    <SafeAreaView className="flex-1 bg-grey1 p-4">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="shadow-md rounded-lg p-5">
          <Text className="text-xl font-bold text-center bg-slate-100  p-3 rounded-md mb-4">
            Welcome!
          </Text>
          <View className="gap-3">
            {/* Employee Management */}
            <TouchableOpacity
              className=" bg-slate-100 h-32 justify-center items-center rounded-lg shadow-md mb-4 active:scale-95"
              onPress={() =>router.push("admine/addEmployee")}
            >
             <MaterialIcons name="person-add-alt-1" size={24} color="black" />
              <Text className="text-lg font-bold ">Add employee</Text>
              <Text className="text-sm text-black text-center">
                Add new employee
              </Text>
            </TouchableOpacity>
   <TouchableOpacity
            className=" bg-slate-100 h-28 justify-center items-center rounded-lg shadow-md mb-4"
            onPress={() => router.push("admine/addCustomer")}
            >
                <MaterialIcons name="person-add-alt-1" size={24} color="black" />
            <Text className="text-lg font-bold ">Add Customer</Text>
            <Text className="text-sm ">Register New Customer</Text>
          </TouchableOpacity>
<TouchableOpacity
              className=" bg-slate-100 h-32 justify-center items-center rounded-lg shadow-md mb-4 active:scale-95"
              onPress={() => router.push("admine/addSuplier")}
            >
                <MaterialIcons name="person-add-alt-1" size={24} color="black" />
              <Text className="text-lg font-bold ">Add Supplier</Text>
              <Text className="text-sm text-black text-center">
                Add new supplier
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className=" bg-slate-100 h-32 justify-center items-center rounded-lg shadow-md mb-4 active:scale-95"
              onPress={() => router.push("")}
            >
              <FontAwesome5 name="user-edit" size={24} color="black" />
              <Text className="text-lg font-bold ">update Employee</Text>
              <Text className="text-sm text-black text-center">
                update existing employee
              </Text>
            </TouchableOpacity>
<TouchableOpacity
            className=" bg-slate-100 h-28 justify-center items-center rounded-lg shadow-md mb-4"
            onPress={() => router.push("")}
            >
              <FontAwesome5 name="user-edit" size={24} color="black" />
            <Text className="text-lg font-bold ">Update Customer</Text>
            <Text className="text-sm ">Update Existing Customer</Text>
            </TouchableOpacity>
            <TouchableOpacity
            className=" bg-slate-100 h-28 justify-center items-center rounded-lg shadow-md mb-4"
            onPress={() => router.push("")}
            >
              <FontAwesome5 name="user-edit" size={24} color="black" />
            <Text className="text-lg font-bold ">Update Supplier</Text>
            <Text className="text-sm ">Update Existing Supplier</Text>
          </TouchableOpacity>
            {/* Supplier Management */}
              <TouchableOpacity
            className=" bg-slate-100 h-28 justify-center items-center rounded-lg shadow-md mb-4"
            onPress={() => router.push("")}
            >
              <MaterialIcons name="person-remove" size={24} color="black" />
            <Text className="text-lg font-bold ">Delete User</Text>
            <Text className="text-sm ">Remove Existing User</Text>
          </TouchableOpacity>
          
        

          
          <TouchableOpacity
            className="bg-slate-100 h-28 justify-center items-center rounded-lg shadow-md mb-4"
            onPress={() => router.push("admine/employeeDetail")}
            >
              <MaterialCommunityIcons name="account-eye" size={24} color="black" />
            <Text className="text-lg font-bold text-black">View Employee</Text>
            <Text className="text-sm text-black">Display All Employee</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className=" bg-slate-100 h-28 justify-center items-center rounded-lg shadow-md mb-4"
            onPress={() => router.push("manager/customerList")}
            >
              <MaterialCommunityIcons name="account-eye" size={24} color="black" />
            <Text className="text-lg font-bold text-black">View Customers</Text>
            <Text className="text-sm text-black">Display All Customers</Text>
            </TouchableOpacity>
              <TouchableOpacity
            className="bg-slate-100 h-28 justify-center items-center rounded-lg shadow-md mb-4"
            onPress={() =>router.push("")}
            >
              <MaterialCommunityIcons name="account-eye" size={24} color="black" />
            <Text className="text-lg font-bold text-black">View Supplier</Text>
            <Text className="text-sm text-black">Display All Supplier</Text>
          </TouchableOpacity>
                        
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
