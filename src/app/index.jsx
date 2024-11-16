import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import Welcome from '../screans/welcome.js'

import Login from '../screans/welcome.js'

import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native-web';
import { colors } from 'react-native-elements';

export default function App() {
  return (
    // <View>
    //   <StatusBar  
    //   barstyle='light-content'
    //   backgroundColor={colors.StatusBar}
    //   />
    <SafeAreaView style={styles.safeContainer}>
      
      <Login />
    </SafeAreaView>
    // </View>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "white",
  },
});
