import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import Welcome from '../screans/welcome.js'
export default function App() {
  return (
    <SafeAreaView style={styles.safeContainer}>
      <Welcome />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "white",
  },
});
