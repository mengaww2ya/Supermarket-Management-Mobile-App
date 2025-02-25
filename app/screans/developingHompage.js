import React from "react";
import {
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
export default function DeveloperHomePage({ navigation }) {
  const { width: ScreenWidth, height: ScreenHeight } = useWindowDimensions();
    const router =useRouter();
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <ScrollView contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingVertical: 20 }}>
        <Text className="text-2xl font-bold text-center text-gray-800 mb-5">
          Hey! Which role do you want to test?
        </Text>

        <View className="flex-row flex-wrap justify-center gap-4 mt-5">
          {[
            { title: "Manager", screen: "/manager/(tabs)" },
            { title: "Customer", screen: "/customer/(tabs)" },
            { title: "Customer Support", screen: "/customeAssistance/customerSuport" },
            { title: "Admin", screen: "/admine/adminHompage" },
            { title: "Stock Manager", screen: "/stockManager/stockManagerHome" },
            { title: "Supplier", screen: "suplier/suplierHomePage" },
          ].map((role) => (
            <TouchableOpacity
              key={role.title}
              className="bg-gray-300 w-40 h-28 justify-center items-center rounded-lg border border-gray-400 shadow-md"
              onPress={() => router.push(role.screen)}
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