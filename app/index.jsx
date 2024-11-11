import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import Header from './subscrean/header.js'; // Ensure correct path to Header
import Login from './screans/login.js';

export default function App() {
  return (
    <SafeAreaView style={styles.safeContainer}>
      <Header/>
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
