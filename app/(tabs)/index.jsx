import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const dicusing = require("/home/menga/vs code/mobapp/SupApp/assets/images/dicus.jpeg");

export default function App() {
  return (
    <View style={styles.container}>
      
      <Text style={styles.text}>
        Hello everyone, this is the start of the application.
      </Text>
      <Image source={dicusing} style={styles.imageStyle} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'gray',
    padding: 20,
  },
  text: {
    fontSize: 30,
    textAlign: 'center',
    marginBottom: 20,
    color: 'white', // Added color for better visibility
  },
  imageStyle: {
    width: 300,
    height: 300,
  },
});