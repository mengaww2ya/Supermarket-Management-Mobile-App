import React from "react";
import { View, Text, StyleSheet, Pressable ,Dimensions} from "react-native";
import { Colors, Icon } from "react-native-elements";
const screenwidth = Dimensions.get("window").width;
const screenheight = Dimensions.get("window").height;
import SignupHeader from "../subscrean/signupHeader.js";
export default function Signup({navigation}) {
  return (
    <View style={styles.container}>
      <SignupHeader />
      <Pressable onPress={() => navigation.navigate("Login")}>
        Sign In
      </Pressable>
    </View>
  );
}
const styles = StyleSheet.create({
  container:{
    flex:1,
    alignItems:"center",
    alignContent:"center"
  }
});