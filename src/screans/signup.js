import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  TextInput,
  SafeAreaView,
} from "react-native";
import { colors, Colors, Icon } from "react-native-elements";
const screenwidth = Dimensions.get("window").width;
const screenheight = Dimensions.get("window").height;
export default function Signup({ navigation }) {
  const [textInput2Focused, setTextInput2Focused] = useState(false);
  const textInput1 = useRef();
  const textInput2 = useRef();
  const handleFocus = () => setTextInput2Focused(false);
  const handleBlur = () => setTextInput2Focused(true);
  return (
    <SafeAreaView>
      <View style={styles.container}>
        <View style={styles.signupbody}>
          <View style={styles.textInputcontainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Enter your first name"
              ref={textInput1}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Enter your last name"
              ref={textInput1}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Enter your address"
              ref={textInput1}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Enter your phone number"
              ref={textInput1}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Enter your email"
              ref={textInput1}
            />
            <TextInput
              placeholder="Create  password"
              secureTextEntry
              style={styles.textInputPass}
              ref={textInput2}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
            <TextInput
              placeholder="Confirm your password"
              secureTextEntry
              style={styles.textInputPass}
              ref={textInput2}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </View>
          <Pressable
            style={styles.signupbutton}
            onPress={() => navigation.navigate("Homepage")}
          >
            Sign Up
          </Pressable>
        </View>
        <Text style={styles.text}>Do you have account?</Text>

        <Pressable
          style={styles.signinbutton}
          onPress={() => navigation.navigate("Login")}
        >
          Sign In
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    // alignContent: "center",
  },
  // signupbody: {
  //   alignSelf: "center",
  //   alignContent: "center",
  // },
  textInputcontainer: {
    marginVertical: 10,
  },
  textInputPass: {
    // width: screenwidth * 0.8,
    padding: 10,
    fontSize: 18,
    margin: 3,
    color: colors.grey4,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.grey4,
  },
  textInput: {
    // width: screenwidth * 0.8,
    padding: 10,
    fontSize: 18,
    margin: 3,
    color: colors.grey4,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: colors.grey4,
  },
  signinbutton: {
    fontSize: 20,
    backgroundColor: "#2ECE33",
    borderRadius: 5,
    borderWidth: 1,
    width: screenwidth * 0.5,
    padding: 8,
    textAlign: "center",
  },
  signupbutton: {
    fontSize: 20,
    backgroundColor: "#FFC107",
    borderRadius: 5,
    borderWidth: 1,
    width: screenwidth * 0.3,
    marginLeft:"50%",
    padding: 6,
    textAlign: "center",
  },
  text: {
    fontSize: 18,
    margin: 3,
    color: colors.grey3,
  },
});
