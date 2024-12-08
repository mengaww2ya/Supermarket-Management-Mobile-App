import React from "react";
import { View, Text, StyleSheet,Dimensions } from "react-native";
import { Colors, Icon } from "react-native-elements";
const screenwidth = Dimensions.get("window").width;
const screenheight = Dimensions.get("window").height;
export default function SignupHeader() {
  return (
    <View style={styles.header}>
      <View style={styles.titleTextView}>
        <Text style={styles.titleText}>Sign Up</Text>
      </View>
      <View style={styles.curv}> </View>
    </View>
  );
}
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "hsl(27, 88%, 58%)",

    height: screenheight * 0.05,
    justifyContent: "space-between",
  },
  titleText: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginLeft: 50,
    color: "green",
  },
  titleTextView: {
    backgroundColor: "#FFDC2B",
    width: screenwidth ,
    padding: 3,
    alignContent:"center",
    textAlign: "center",
  },
  curv: {
    flex: 2,
    backgroundColor: "#FFDC2B",
  },
});
