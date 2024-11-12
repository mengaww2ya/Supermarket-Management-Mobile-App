import React from 'react';
import { TouchableOpacity } from 'react-native';
import { View, Text, StyleSheet, TextInput, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import  Header from '../subscrean/header.js';
export default function Login() {
  return (
    <SafeAreaView style={styles.safeContainer}>

      <Header/>
      <View style={styles.container}>
        <Text style={styles.wlcome}>Welcome to Queen Supermarket System</Text>

        <View style={styles.login}>
          <TextInput style={styles.textInput} placeholder="Enter your username here" />
          <TextInput style={styles.textInput} placeholder="Enter your password here" secureTextEntry />
          <View >
            <TouchableOpacity  style={[styles.button]} onPress={() => {}} >
              <Text>Log in</Text>
              </TouchableOpacity>
          </View>
          <Text style={styles.text}>
            You don't have an account?
            <TouchableOpacity style={styles.button}  onPress={() => {}} >
              <Text>Sign Up</Text>
              </TouchableOpacity>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    button:{
      width:300,
      padding:10,
      alignItems:"center",
        backgroundColor: 'hsl(23, 100%, 66%)',
      },
  safeContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  text: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
    color: 'black',
    marginVertical: 10,
  },
  textInput: {
    fontSize: 20,
    borderRadius: 5,
    borderWidth:1,
    marginBottom: 10,
    padding: 10,
    textAlign:"center"
  },
  login: {
    width: "70%",
  },

  buttonContainer: {
    width: "50%",
    alignItems:"center",
    borderRadius:"2%",
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    backgroundColor: 'hsl(23, 100%, 66%)',
  },
  wlcome:{
    fontSize:22,
  }
});
