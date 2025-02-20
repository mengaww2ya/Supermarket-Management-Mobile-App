import React from "react";
import {
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { colors } from "react-native-elements";

export default function DeveloperHomePage({ navigation }) {
  const { width: ScreenWidth, height: ScreenHeight } = useWindowDimensions();

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingVertical: 20 }}>
        <Text className="text-2xl font-bold text-center text-gray-800 mb-5">
          Hey! Which role do you want to test?
        </Text>

        <View className="flex-row flex-wrap justify-center gap-4 mt-5">
          {[
            { title: "Manager", screen: "ManagerHomePage" },
            { title: "Customer", screen: "Homepage" },
            { title: "Customer Support", screen: "CustomerSuport" },
            { title: "Admin", screen: "admineHomePage" },
            { title: "Stock Manager", screen: "stockManagerHome" },
            { title: "Supplier", screen: "suplierHome" },
          ].map((role) => (
            <TouchableOpacity
              key={role.title}
              className="bg-gray-300 w-40 h-28 justify-center items-center rounded-lg border border-gray-400 shadow-md"
              onPress={() => navigation.navigate(role.screen)}
              style={{ width: ScreenWidth * 0.4, height: ScreenHeight * 0.12 }}
            >
              <Text className="text-lg font-bold text-center text-gray-800">
                {role.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}