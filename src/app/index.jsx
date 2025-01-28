import React from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import AuthicStackNavig from "../navigator/stackNavigator.js";
export default function App() {
  return (
    <SafeAreaView style={styles.safeContainer}>
      <AuthicStackNavig />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "white",
  },
});
