import React, { useState, useRef } from 'react';
import { TouchableOpacity, View, Text, StyleSheet, TextInput ,Image} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import { colors, Icon ,SocialIcon} from 'react-native-elements';
import Header from '../subscrean/header.js';
import { ScrollView } from 'react-native-web';

export default function Login() {
  const wellImage=require("../../assets/images/welImage.jpg");
  const [textInput2Focused, setTextInput2Focused] = useState(false);
  const textInput1 = useRef(null);
  const textInput2 = useRef(null);

  const handleFocus = () => setTextInput2Focused(true);
  const handleBlur = () => setTextInput2Focused(false);
  const handleLogin = () => {
    // Handle login logic here
  };
  const handleSignUp = () => {
    // Navigate to the sign-up page
  };
  const handleForgotPassword = () => {
    // Handle forgot password logic
  };
  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView>
      <Header />
      <View style={styles.container}>
      <Image source={wellImage} style={styles.wellimage}/>

        <Text style={styles.welcome}>Welcome to Queen Supermarket System</Text>

        <View style={styles.login}>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your username"
            ref={textInput1}
          />

          <View style={styles.passwordContainer}>
            <Animatable.View animation={textInput2Focused ? "" : "fadeInLeft"} duration={400}>
              <Icon name='lock' iconStyle={colors.grey3} type='material' style={styles.icon} />
            </Animatable.View>
            <TextInput
              placeholder="Enter your password"
              secureTextEntry
              style={styles.textInputPass}
              ref={textInput2}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
            <Animatable.View animation={textInput2Focused ? "" : "fadeInLeft"} duration={400}>
              <Icon name='visibility-off' iconStyle={[colors.grey3]} type='material' style={styles.icon} />
            </Animatable.View>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleForgotPassword}>
            <Text style={styles.text}>Forgot password?</Text>
          </TouchableOpacity>

          <Text style={styles.text}>
            Don't have an account?{' '}
            <TouchableOpacity onPress={handleSignUp}>
              <Text style={styles.linkText}>Sign Up</Text>
            </TouchableOpacity>
          </Text>

          <TouchableOpacity style={styles.googleButton}>
            <SocialIcon
              name='Sign In With Google'
              iconStyle={colors.grey3}
              type='google'
              style={styles.SocialIcon}
            />
            <Text style={styles.buttonText}>Sign in with Google</Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
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
  textInputPass:{
    width:"100%",
    fontSize: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.grey4,
    marginBottom: 15,
    padding: 15,
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
    borderRadius: 5,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  googleIcon: {
    marginRight: 10, // Space between icon and text
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
  wellimage:{
    width:500,
    height:"50%",
marginTop:"10%",
  },
});