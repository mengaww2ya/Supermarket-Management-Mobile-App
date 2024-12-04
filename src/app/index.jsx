import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import Vegetable from '../screans/Vegetable.js'
import AuthicStackNavig from '../navigator/authenticatior.js';
import Item from '../screans/Item.js';
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
