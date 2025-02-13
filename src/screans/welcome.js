import React from "react";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { colors } from "react-native-elements";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Welcome({ navigation }) {
  const { width: screenWidth } = useWindowDimensions();

  return (
    <SafeAreaView style={styles.safeAreaView}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.welcMessagView}>
            <Text style={styles.welcomSlogan}>
              Start Your Smart Shopping Here: Discover Groceries at Your
              Fingertips. Better Living Anytime, Anywhere!
            </Text>
          </View>
          <View style={[styles.buttonContainer, { width: screenWidth * 0.75 }]}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.buttonText}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("Signup")}
            >
              <Text style={styles.buttonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    backgroundColor: colors.grey0,
  },
  container: {
    borderColor: colors.grey2,
    borderWidth: 1,
    padding: 10,
    margin: 10,
    justifyContent: "center",
    backgroundColor: "white",
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  welcMessagView: {
    marginHorizontal: 10,
    marginBottom: 30,
    paddingVertical: 20,
    backgroundColor: "white",
    borderRadius: 8,
  },
  welcomSlogan: {
    fontSize: 24,
    color: colors.black,
    textAlign: "center",
    fontFamily: "Arial",
    fontWeight: "600",
    lineHeight: 30,
  },
  buttonContainer: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    width: "100%",
    backgroundColor: "hsl(23, 100%, 66%)",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 15,
    elevation: 3, // Adds shadow effect for depth
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});