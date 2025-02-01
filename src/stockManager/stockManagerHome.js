import React from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { colors } from "react-native-elements";
export default function StockManagerHome({ navigation }) {
  const { width: ScreenWidth, height: ScreenHeight } = useWindowDimensions();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.titleText}>Welcome to Stock Management</Text>

        <View style={styles.container}>
          {[
            { name: "Stock Management", route: "manageStock" },
            { name: "Review Stock Status", route: "" },
            { name: "Supplier Order Management", route: "" },
          ].map((item, index) => (
            <Pressable
              key={index}
              style={[
                styles.button,
                { width: ScreenWidth * 0.8, height: ScreenHeight * 0.1 },
              ]}
              onPress={() => item.route && navigation.navigate(item.route)}
            >
              <Text style={styles.buttonText}>{item.name}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  titleText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginBottom: 20,
  },
  container: {
    width: "100%",
    alignItems: "center",
    gap: 15,
  },
  button: {
    backgroundColor: colors.grey5,
    width: "47%", // Responsive grid layout
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    borderColor: colors.grey4,
    borderWidth: 1,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4, //
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
});
