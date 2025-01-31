import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Icon } from "react-native-elements";
import { ScreenWidth } from "react-native-elements/dist/helpers";

export default function Login({ navigation }) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <Text style={styles.welcome}>Welcome to Queen Supermarket</Text>

        <View style={styles.login}>
          <Text style={styles.loginFormText}>
            Fill the form below to log in
          </Text>

          <Text style={styles.inputTitle}>Username</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Enter your username"
            value={username}
            onChangeText={setUsername}
          />

          <Text style={styles.inputTitle}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              placeholder="Enter your password"
              secureTextEntry={!passwordVisible}
              style={styles.textInputPass}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              onPress={() => setPasswordVisible(!passwordVisible)}
            >
              <Icon
                name={passwordVisible ? "eye" : "eye-slash"}
                type="font-awesome"
                color="gray"
                size={20}
                style={styles.icon}
              />
            </TouchableOpacity>
          </View>

          <Pressable
            style={styles.button}
            onPress={() => navigation.navigate("Homepage")}
          >
            <Text style={styles.buttonText}>Log In</Text>
          </Pressable>

          <Pressable>
            <Text style={styles.text}>Forgot password?</Text>
          </Pressable>

          <View style={styles.thirdPartyLogin}>
            <Pressable
              style={styles.googleButton}
              onPress={() => alert("Hey! Google Sign-in not omplemented ")}
            >
              <Icon
                name="google"
                type="font-awesome"
                color="#DB4437"
                size={25}
              />
              <Text style={styles.buttonTextGoogle}>Sign by Google</Text>
            </Pressable>

            <Pressable
              style={styles.facebookButton}
              onPress={() => alert("Hey! Facebook Sign-in not implemented")}
            >
              <Icon
                name="facebook"
                type="font-awesome"
                color="#4267B2"
                size={25}
              />
              <Text style={styles.buttonTextFacebook}>
                Sign by Facebook
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.signup}
            onPress={() => navigation.navigate("Signup")}
          >
            <Text style={styles.text}>I don't have an account? Sign up</Text>
          </Pressable>
        </View>
      </View>

      <View>
        <Pressable
          onPress={() => navigation.navigate("DeveloperHomePage")}
          style={styles.developingModeBtn}
        >
          <Text style={styles.buttonText}>I am developing, not logging in</Text>
        </Pressable>
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
    borderWidth: 1,
    borderColor: "#d3d3d3",
    width: "100%",
  },
  textInput: {
    fontSize: 18,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#d3d3d3",
    marginBottom: 15,
    padding: 10,
    backgroundColor: "white",
  },
  textInputPass: {
    flex: 1,
    fontSize: 18,
    padding: 10,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#d3d3d3",
    marginBottom: 15,
    backgroundColor: "white",
    paddingHorizontal: 10,
  },
  icon: {
    marginLeft: 10,
  },
  button: {
    backgroundColor: "#2ECE33",
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DB4437",
    paddingVertical: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    flex: 1,
    justifyContent: "center",
  },
  facebookButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#4267B2",
    paddingVertical: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    flex: 1,
    justifyContent: "center",
  },
  buttonTextGoogle: {
    color: "#DB4437",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 10,
  },
  buttonTextFacebook: {
    color: "#4267B2",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 10,
  },
  thirdPartyLogin: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  text: {
    fontSize: 16,
    textAlign: "center",
    marginVertical: 10,
  },
  signup: {
    paddingHorizontal: 10,
    backgroundColor: "#d3d3d3",
    borderRadius: 5,
    paddingVertical: 10,
    marginTop: 10,
  },
  loginFormText: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "bold",
  },
  inputTitle: {
    fontSize: 18,
    fontStyle: "italic",
    color: "black",
    marginBottom: 5,
  },
  developingModeBtn: {
    backgroundColor: "#333",
    width: ScreenWidth * 0.8,
    alignSelf: "center",
    borderRadius: 5,
    paddingVertical: 10,
    marginTop: 20,
  },
});
