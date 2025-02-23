import React from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
// import AuthicStackNavig from "../navigator/stackNavigator.js";
import "../global.css"
import WelcomeScreen from "./screans/scro";

export default function App() {
  return (
    <SafeAreaView style={styles.safeContainer}>
      <WelcomeScreen />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "white",
  },
});
