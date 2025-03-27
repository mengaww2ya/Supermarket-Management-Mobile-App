import React from "react";
import { ScrollView, SafeAreaView, View, Text, Pressable, Alert, StyleSheet } from "react-native";
import { useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "react-native-vector-icons"; // Importing Ionicons

export default function ManageStock() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const router = useRouter();

  const options = [
    { title: "Add Product", route: "/stockManager/addProduct", icon: "add-circle-outline" },
    { title: "View Product List", route: "/stockManager/ProductList", icon: "list-circle-outline" },
    { title: "Add New Categories", route: "/stockManager/addCategory", icon: "pricetag-outline" },
    { title: "View Categories List", route: "/stockManager/ViewCategory", icon: "albums-outline" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Yellow Header Box */}
      <View style={styles.headerBox} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.welcomeText}>👋 Welcome, Stock Manager!</Text>

        <View style={styles.optionsContainer}>
          {options.map((item, index) => (
            <Pressable
              key={index}
              style={styles.optionButton}
              onPress={() => {
                if (item.route) {
                  router.push(item.route);
                } else {
                  Alert.alert("Feature not implemented", "This feature is coming soon!");
                }
              }}
            >
              <Ionicons name={item.icon} size={30} color="#fff" />
              <Text style={styles.buttonText}>{item.title}</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  headerBox: {
    backgroundColor: "#FFDC2B", // Yellow color
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',

  },
  scrollContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: "#34495e",
    marginBottom: 20,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "90%",
    gap: 16,
  },
  optionButton: {
    backgroundColor: "#28a745", // Green color
    width: "40%",
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
    marginTop: 5,
  },
});