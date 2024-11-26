import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import RootNavigator from '../navigator/RootNavigator.js';
import Homepage from '../screans/homepage.js'
import { ScrollView } from 'react-native-gesture-handler';
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
