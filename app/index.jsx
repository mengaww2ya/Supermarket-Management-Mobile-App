import React from 'react';
import { View, Text, StyleSheet, Image, TextInput, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const dicusing = require("/home/menga/vs code/mobapp/Supermarket-Mobile-App/assets/images/dicus.jpeg");

export default function App() {
  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <Text style={styles.text}>
          Welcome to Queen Supermarket System
        </Text>
        
        <View style={styles.login}>
          <TextInput style={styles.textInput} placeholder='Enter your username here' />
          <TextInput style={styles.textInput} placeholder='Enter your password here' secureTextEntry />
          <View style={styles.buttonContainer}>
            <Button title='Login' onPress={() => {}} />
            <Button title='Sign Up' onPress={() => {}} />
          </View>
        </View>

        {/* Uncomment this if you want to display the image */}
        {/* <View style={styles.imageStyl}>
          <Image source={dicusing} style={styles.imageStyle} />
        </View> */}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "gray",
  },
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
    color: 'white',
  },
  imageStyle: {
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "red",
  },
  textInput: {
    width: "70%",
    borderRadius: 20,
    fontSize: 20,
    backgroundColor: "white",
    marginBottom: 10, // Added margin for spacing
    padding: 10, // Added padding for better touch experience
  },
  login: {
    width: "70%",
  },
  buttonContainer: {
    marginTop: 20, // Added margin for spacing between buttons
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  imageStyl: {
    width: 300,
    height: 500,
  },
});