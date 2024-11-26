import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';
import RootNavigator from '../navigator/RootNavigator.js';
import Homepage from '../screans/homepage.js'
export default function App() {
  return (
     <View style={styles.safeContainer}>
       <Homepage />
    </View>
  );
}
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "white",
  },
});
