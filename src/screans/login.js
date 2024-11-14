import React, { useState, useRef } from 'react';
import { TouchableOpacity } from 'react-native';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import { colors, Icon } from 'react-native-elements';
import Header from '../subscrean/header.js';

export default function Login() {
  const [textInput2Focused, setTextInput2Focused] = useState(false);
  const textInput1 = useRef(null);
  const textInput2 = useRef(null);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <Header />
      <View style={styles.container}>
        <Text style={styles.welcome}>Welcome to Queen Supermarket System</Text>

        <View style={styles.login}>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your username"
            ref={textInput1}
          />

          <View style={styles.passwordContainer}>
            <Animatable.View animation={textInput2Focused ? "" : "fadeInLeft"} duration={400}>
              <Icon
                name='lock'
                iconStyle={colors.grey3}
                type='material'
                style={styles.icon}
              />
            </Animatable.View>
            <TextInput
              placeholder="Enter your password"
              secureTextEntry
              style={styles.textInput}
              ref={textInput2}
              onFocus={() => setTextInput2Focused(true)}
              onBlur={() => setTextInput2Focused(false)}
            />
            <Animatable.View animation={textInput2Focused ? "" : "fadeInLeft"} duration={400}>
              <Icon
                name='visibility-off'
                iconStyle={colors.grey3}
                type='material'
                style={styles.icon}
              />
            </Animatable.View>
          </View>

          <TouchableOpacity style={styles.button} onPress={() => {}}>
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>

          <Text style={styles.text}>
            Don't have an account?{' '}
            <TouchableOpacity onPress={() => {}}>
              <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
          </Text>

          <TouchableOpacity style={styles.googleButton}>
            <Text style={styles.buttonText}>Sign in with Google</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#f7f9fc",
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  login: {
    width: "90%",
  },
  textInput: {
    fontSize: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.grey4,
    marginBottom: 15,
    padding: 10,
    backgroundColor: 'white',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.grey4,
    marginBottom: 15,
    backgroundColor: 'white',
  },
  icon: {
    marginHorizontal: 10,
  },
  button: {
    backgroundColor: 'hsl(23, 100%, 66%)',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  googleButton: {
    backgroundColor: 'hsl(258, 81%, 52%)',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
  },
  linkText: {
    color: 'hsl(23, 100%, 66%)',
    fontWeight: 'bold',
  },
});