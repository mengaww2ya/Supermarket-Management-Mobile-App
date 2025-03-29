import React from "react";
import { Text, View, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import HomeHeader from "../../../components/HomeHeader";
const { width } = Dimensions.get('window');

const menuItems = [
  {
    title: "Add Employee",
    subtitle: "Add new employee to the system",
    icon: "person-add-alt-1",
    iconType: "MaterialIcons",
    color: "#4F46E5",
    route: "admine/addEmployee",
    gradient: ["#4F46E5", "#6366F1"]
  },
  {
    title: "Add Supplier",
    subtitle: "Add new supplier to the system",
    icon: "truck",
    iconType: "FontAwesome5",
    color: "#10B981",
    route: "admine/addSuplier",
    gradient: ["#10B981", "#34D399"]
  },
  {
    title: "View Employees",
    subtitle: "Display all employees",
    icon: "account-group",
    iconType: "MaterialCommunityIcons",
    color: "#F59E0B",
    route: "admine/employeeDetail",
    gradient: ["#F59E0B", "#FBBF24"]
  },
  {
    title: "View Customers",
    subtitle: "Display all customers",
    icon: "account-multiple",
    iconType: "MaterialCommunityIcons",
    color: "#EC4899",
    route: "/admine/customersList",
    gradient: ["#EC4899", "#F472B6"]
  },
  {
    title: "View Suppliers",
    subtitle: "Display all suppliers",
    icon: "truck-delivery",
    iconType: "MaterialCommunityIcons",
    color: "#3B82F6",
    route: "",
    gradient: ["#3B82F6", "#60A5FA"]
  }
];

const stats = [
  {
    title: "Total Employees",
    value: "24",
    icon: "people",
    iconType: "MaterialIcons",
    color: "#4F46E5",
    gradient: ["#4F46E5", "#6366F1"],
    change: "+12%"
  },
  {
    title: "Total Customers",
    value: "156",
    icon: "account-multiple",
    iconType: "MaterialCommunityIcons",
    color: "#10B981",
    gradient: ["#10B981", "#34D399"],
    change: "+8%"
  },
  {
    title: "Total Suppliers",
    value: "12",
    icon: "truck-delivery",
    iconType: "MaterialCommunityIcons",
    color: "#F59E0B",
    gradient: ["#F59E0B", "#FBBF24"],
    change: "+5%"
  },
  {
    title: "Total Orders",
    value: "89",
    icon: "shopping-cart",
    iconType: "MaterialIcons",
    color: "#EC4899",
    gradient: ["#EC4899", "#F472B6"],
    change: "+15%"
  }
];

export default function AdminHomePage() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={['#4F46E5', '#6366F1']}
        className="h-32 rounded-b-3xl px-6 pt-4"
      >
        {/* <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-2xl font-bold text-white mb-2">Admin Dashboard</Text>
            <Text className="text-white/80">Manage your supermarket system</Text>
          </View>
          <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
            <MaterialIcons name="notifications" size={24} color="white" />
          </View>
        </View> */}
        <HomeHeader title="Admin Dashboard" />

      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1 px-4 -mt-8"
      >
        {/* Stats Section */}
        <View className="bg-white rounded-2xl shadow-lg p-4 mb-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-800">System Overview</Text>
            <TouchableOpacity className="bg-indigo-50 px-3 py-1 rounded-full">
              <Text className="text-indigo-600 text-sm font-medium">This Month</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row flex-wrap justify-between">
            {stats.map((stat, index) => (
              <View key={index} className="w-[48%] mb-4">
                <LinearGradient
                  colors={stat.gradient}
                  className="rounded-2xl p-4"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
                      {stat.iconType === "MaterialIcons" && (
                        <MaterialIcons name={stat.icon} size={24} color="white" />
                      )}
                      {stat.iconType === "MaterialCommunityIcons" && (
                        <MaterialCommunityIcons name={stat.icon} size={24} color="white" />
                      )}
                    </View>
                    <View className="bg-white/20 px-2 py-1 rounded-full">
                      <Text className="text-white text-xs font-medium">{stat.change}</Text>
                    </View>
                  </View>
                  <Text className="text-2xl font-bold text-white mt-2">{stat.value}</Text>
                  <Text className="text-white/80 text-sm mt-1">{stat.title}</Text>
                </LinearGradient>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View className="bg-white rounded-2xl shadow-lg p-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-800">Quick Actions</Text>
            <TouchableOpacity className="bg-indigo-50 px-3 py-1 rounded-full">
              <Text className="text-indigo-600 text-sm font-medium">All Actions</Text>
            </TouchableOpacity>
          </View>
          
          <View className="flex-row flex-wrap justify-between">
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                className="w-[48%] mb-4"
                onPress={() => router.push(item.route)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={item.gradient}
                  className="rounded-2xl p-4 h-40 justify-between"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
                      {item.iconType === "MaterialIcons" && (
                        <MaterialIcons name={item.icon} size={24} color="white" />
                      )}
                      {item.iconType === "FontAwesome5" && (
                        <FontAwesome5 name={item.icon} size={24} color="white" />
                      )}
                      {item.iconType === "MaterialCommunityIcons" && (
                        <MaterialCommunityIcons name={item.icon} size={24} color="white" />
                      )}
                    </View>
                    <View className="w-2 h-2 rounded-full bg-white/50" />
                  </View>
                  
                  <View>
                    <Text className="text-white font-bold text-lg">{item.title}</Text>
                    <Text className="text-white/80 text-sm mt-1">{item.subtitle}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
