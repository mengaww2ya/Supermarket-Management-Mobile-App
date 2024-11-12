import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import Login from '../screans/login.js';

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
