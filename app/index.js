import React from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
// import AuthicStackNavig from "../navigator/stackNavigator.js";
import "../global.css"
import Login from "./screans/login";

export default function App() {
  return (
    <SafeAreaView style={styles.safeContainer}>
      <Login />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "white",
  },
});
