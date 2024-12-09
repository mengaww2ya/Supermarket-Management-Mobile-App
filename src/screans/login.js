import React, { useState, useRef } from 'react';
import {
   TouchableOpacity,
   View,
    Text, 
    StyleSheet,
     TextInput 
     } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Animatable from 'react-native-animatable';
import { colors, Icon ,SocialIcon} from 'react-native-elements';
import Header from '../subscrean/header.js';
import { ScrollView } from 'react-native';
export default function Login({navigation}) {
  const [textInput2Focused, setTextInput2Focused] = useState(false);
  const textInput1 = useRef();
  const textInput2 = useRef();
  const handleFocus = () => setTextInput2Focused(false);
  const handleBlur = () => setTextInput2Focused(true);
  const handleForgotPassword = () => {
  };
  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView>
        <View>
          <Header type="arrow-left" navigation={navigation} />
        </View>
        <View style={styles.container}>
          <View>
            <Text style={styles.welcome}>
              Welcome to Queen Supermarket System
            </Text>
          </View>
          <View style={styles.login}>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your username"
              ref={textInput1}
            />
            <View style={styles.passwordContainer}>
              <Animatable.View
                animation={textInput2Focused ? "" : "fadeInLeft"}
                duration={400}
              >
                <Icon
                  name="lock"
                  iconStyle={colors.grey3}
                  type="material"
                  style={styles.icon}
                />
              </Animatable.View>
              <TextInput
                placeholder="Enter your password"
                secureTextEntry
                style={styles.textInputPass}
                ref={textInput2}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
              <Animatable.View
                animation={textInput2Focused ? "" : "fadeInLeft"}
                duration={400}
              >
                <Icon
                  name="visibility-off"
                  iconStyle={[colors.grey3]}
                  type="material"
                  style={styles.icon}
                />
              </Animatable.View>
            </View>

            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                navigation.navigate("Homepage");
              }}
            >
              <Text style={styles.buttonText}>Log In</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleForgotPassword}>
              <Text style={styles.text}>Forgot password?</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.googleButton}>
              <SocialIcon
                name="Sign In With Google"
                iconStyle={colors.grey3}
                type="google"
                style={styles.SocialIcon}
              />
              <Text style={styles.buttonText}>Sign in with Google</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.dontAcount}>
            <Text style={styles.text}>Don't have an account? </Text>
            <TouchableOpacity
              style={styles.signup}
              onPress={() => navigation.navigate("Signup")}
            >
              <Text style={styles.linkText}>Create Acount</Text>
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
    backgroundColor: 'hsl(261, 87%, 68%)',
    borderRadius: 5,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  googleIcon: {
    marginRight: 10, 
  },
  text: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 10,
  },
  linkText: {
    padding:"3%",
    color: 'white',
    fontWeight: 'bold',
  },
  wellimageContainer:{
    width:"20%",
    height:"20%",
    marginTop:"30%",
    marginBottom:"0.5%",   
   },
  wellimage:{
    width:"100%",
    height:"50%",
  },
  signup:{
    width:"100%",
    backgroundColor:"hsl(23, 100%, 66%)",
    alignItems:"center",
    marginLeft:"20%",
    marginBottom:"20%",
    padding:"5%",
    borderRadius:"2%",
    justifyContent:"flex-end"
  },
  dontAcount:{
    margin:"5%",
    alignItems:"center",
  }
});