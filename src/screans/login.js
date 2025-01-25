import React, { useState, useRef } from "react";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Animatable from "react-native-animatable";
import { colors, Icon } from "react-native-elements";

export default function Login({ navigation }) {
  const [textInput2Focused, setTextInput2Focused] = useState(false);
  const textInput1 = useRef();
  const textInput2 = useRef();
  const handleFocus = () => setTextInput2Focused(false);
  const handleBlur = () => setTextInput2Focused(true);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView>
        <View style={styles.container}>
          <View>
            <Text style={styles.welcome}>Welcome to Queen Supermarket</Text>
          </View>
          <View style={styles.login}>
            <Text style={styles.loginFormText}>
              Fill the form below to log in
            </Text>
            <Text style={styles.inputTitle}>user name</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your username"
              ref={textInput1}
            />
            <Text style={styles.inputTitle}>password</Text>
            <TextInput
              placeholder="Enter your password"
              secureTextEntry
              style={styles.textInputPass}
              ref={textInput2}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />

            <Pressable
              style={styles.button}
              onPress={() => {
                navigation.navigate("Homepage");
              }}
            >
              <Text style={styles.buttonText}>Log In</Text>
            </Pressable>
            <Pressable>
              <Text style={styles.text}>Forgot password?</Text>
            </Pressable>
            <View style={styles.thirdPartyLogin}>
              <Pressable
                onPress={() => {
                  navigation.navigate("Homepage");
                }}
                style={styles.googleButton}
              >
                <Text style={styles.buttonTextgoogle}>Sign by Google</Text>
                <Icon
                  name="google"
                  type="font-awesome"
                  color="#517fa4"
                  size={30}
                />
              </Pressable>
              <Pressable
                onPress={() => {
                  navigation.navigate("Homepage");
                }}
                style={styles.facebookButton}
              >
                <Text style={styles.buttonTextFacebook}>Sign by Facebook</Text>
                <Icon
                  name="facebook"
                  type="font-awesome"
                  color="#517fa4"
                  size={30}
                />
              </Pressable>
            </View>
            <Pressable
              style={styles.signup}
              onPress={() => navigation.navigate("Signup")}
            >
              <Text style={styles.text}>I don't have an account? </Text>{" "}
            </Pressable>
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
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  welcome: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  login: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    borderColor: colors.grey0,
    borderWidth: 1,
    borderColor: colors.grey4,

    width: "100%",
  },
  textInput: {
    fontSize: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.grey4,
    marginBottom: 15,
    padding: 10,
    backgroundColor: "white",
  },
  textInputPass: {
    width: "100%",
    fontSize: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.grey4,
    marginBottom: 15,
    padding: 15,
    backgroundColor: "white",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.grey4,
    marginBottom: 15,
    backgroundColor: "white",
  },
  icon: {
    marginHorizontal: 10,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  googleButton: {
    margin: 5,
    backgroundColor: colors.grey5,
    borderRadius: 5,
    height: 40,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  facebookButton: {
    margin: 5,
    height: 40,
    backgroundColor: colors.grey5,
    borderRadius: 5,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  text: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 10,
  },
  linkText: {
    padding: 10,
    color: "white",
    fontWeight: "bold",
  },
  signup: {
    width: "100%",
    paddingHorizontal: 10,
    backgroundColor: colors.grey4,
    marginLeft: 2,
    borderRadius: 5,
  },
  dontAcount: {
    margin: "5%",
    alignItems: "center",
  },
  loginFormText: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
    fontFamily: "new times roman",
    fontWeight: "bold",
  },
  buttonTextgoogle: {
    color: "black",
    fontSize: 14,
    fontWeight: "bold",
    padding: 10,
  },
  buttonTextFacebook: {
    color: "black",
    fontSize: 14,
    fontWeight: "bold",
    padding: 10,
  },
  thirdPartyLogin: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inputTitle:{
    fontSize: 18,
    fontWeight: "Italic",
    color: "black",}
});
