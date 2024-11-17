import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import RootNavigator from '../navigator/RootNavigator.js'
export default function App() {
  return (
     <SafeAreaView style={styles.safeContainer}>
       <RootNavigator />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "white",
  },
});
