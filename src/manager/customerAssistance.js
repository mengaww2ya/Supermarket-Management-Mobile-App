import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "react-native-elements";

export default function McustomerAssistance({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.container}>
          <Text style={styles.titleText}>Customer Assistance Management</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              activeOpacity={0.7}
              onPress={() => {
                navigation.navigate("MonitorCustomerAssistance");
              }}
            >
              <Text style={styles.buttonText}>Review Operations</Text>
              <Text style={styles.buttonSubtitle}>
                Overseeing Customer Support Operations
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              activeOpacity={0.7}
              onPress={() => {
                navigation.navigate("handleEscalatedIssues");
              }}
            >
              <Text style={styles.buttonText}>Handling Escalated Issues</Text>
              <Text style={styles.buttonSubtitle}>
                Customer Assistance Transforms These Issues
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              activeOpacity={0.7}
              onPress={() => {
                navigation.navigate("MCustomerServicePerformance");
              }}
            >
              <Text style={styles.buttonText}>
                Customer Service Performance
              </Text>
              <Text style={styles.buttonSubtitle}>
                Monitoring Customer Service Performance
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} activeOpacity={0.7}>
              <Text style={styles.buttonText}>Manage Channels</Text>
              <Text style={styles.buttonSubtitle}>
                Customer Support Tools & Communication Channels
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  scrollView: {
    flexGrow: 1,
    paddingVertical: 20,
    alignItems: "center",
  },
  container: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  buttonContainer: {
    margin: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  titleText: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  button: {
    backgroundColor: "#fff",
    width: "48%",
    height: 130,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
    textAlign: "center",
  },
  buttonSubtitle: {
    fontSize: 12,
    textAlign: "center",
  },
});
