import React from "react";
import {
  ScrollView,
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from "react-native";
import { colors } from "react-native-elements";
export default function ManageStock({ navigation }) {
  const { width: ScreenWidth, height: ScreenHeight } = useWindowDimensions();

  const options = [
    { title: "Add Product", route: "addProduct" },
    { title: "Remove Product", route: "" },
    { title: "Update Product", route: "" },
    { title: "View Product List", route: "" },
    { title: "Add New Categories", route: "" },
    { title: "Update Categories", route: "" },
    { title: "Remove Categories", route: "" },
    { title: "View Categories List", route: "" },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.titleText}>Welcome</Text>

        <View style={styles.buttonContainer}>
          {options.map((item, index) => (
            <Pressable
              key={index}
              style={[
                styles.button,
                { width: ScreenWidth * 0.4, height: ScreenHeight * 0.1 },
              ]}
              onPress={() => item.route && navigation.navigate(item.route)}
            >
              <Text style={styles.buttonText}>{item.title}</Text>
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
  buttonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 15,
    width: "90%",
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
