import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  TextInput,
  SafeAreaView,
} from "react-native";
import { colors } from "react-native-elements";

const screenwidth = Dimensions.get("window").width;

export default function Signup({ navigation }) {
  // State for form inputs
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [textInput2Focused, setTextInput2Focused] = useState(false);

  // Function to clear input fields
  const clearInputs = () => {
    setFirstName("");
    setLastName("");
    setAddress("");
    setPhone("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <Text style={styles.text}>
          Fill the form to register or press sign in if you have an account
        </Text>
        <View style={styles.signupBody}>
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your first name"
              value={firstName}
              onChangeText={setFirstName}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Enter your last name"
              value={lastName}
              onChangeText={setLastName}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Enter your address"
              value={address}
              onChangeText={setAddress}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Enter your phone number"
              value={phone}
              onChangeText={setPhone}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              placeholder="Create password"
              secureTextEntry
              style={[
                styles.textInputPass,
                textInput2Focused && styles.focusedInput,
              ]}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setTextInput2Focused(true)}
              onBlur={() => setTextInput2Focused(false)}
            />
            <TextInput
              placeholder="Confirm your password"
              secureTextEntry
              style={[
                styles.textInputPass,
                textInput2Focused && styles.focusedInput,
              ]}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              onFocus={() => setTextInput2Focused(true)}
              onBlur={() => setTextInput2Focused(false)}
            />
          </View>
          <View style={styles.buttonContainer}>
            <Pressable
              style={styles.signupButton}
              onPress={() => navigation.navigate("Homepage")}
            >
              <Text style={styles.textButton}>Sign Up</Text>
            </Pressable>
            <Pressable style={styles.clearButton} onPress={clearInputs}>
              <Text style={styles.textButton}>Clear</Text>
            </Pressable>
            <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.textButton}>Back</Text>
            </Pressable>
          </View>
        </View>
      </View>
      <View style={styles.signInBContainer}>
        <Text style={styles.text}>Do you have an account?</Text>
        <Pressable style={styles.signinButton} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.textButton}>Sign In</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.grey5,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  container: {
    backgroundColor: colors.grey5,
    borderWidth: 1,
    borderColor: colors.grey4,
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  signupBody:{
    width:screenwidth*0.8
  },
  textInputContainer: {
    width: "100%",
    backgroundColor: "white",
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.grey4,
  },
  textInput: {
    padding: 12,
    fontSize: 16,
    marginVertical: 5,
    color: colors.grey4,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.grey4,
  },
  textInputPass: {
    padding: 12,
    fontSize: 16,
    marginVertical: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.grey4,
  },
  focusedInput: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    width: "100%",
    marginTop: 10,
  },
  signupButton: {
    backgroundColor: colors.grey2,
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
    width: "30%",
  },
  clearButton: {
    backgroundColor: colors.warning,
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
    width: "30%",
  },
  backButton: {
    backgroundColor: colors.grey3,
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
    width: "30%",
  },
  signinButton: {
    backgroundColor: colors.grey3,
    borderRadius: 5,
    width: "50%",
    padding: 10,
    alignItems: "center",
  },
  text: {
    fontSize: 18,
    marginVertical: 10,
    color: colors.grey3,
    textAlign: "center",
    fontWeight: "bold",
  },
  textButton: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  signInBContainer: {
    alignItems: "center",
    marginTop: 20,
  },
});

