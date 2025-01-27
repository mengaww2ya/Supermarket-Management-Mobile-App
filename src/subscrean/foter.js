import React, { useState } from "react";
import { View, Modal, Text, StyleSheet } from "react-native";
import { colors, Icon } from "react-native-elements";
// import AuthicStackNavig from '../navigator/authenticatior';

export default function Footer({ navigation }) {
  return (
    <View style={styles.futerContainer}>
      <Icon
        name="home"
        type="font-awesome"
        color="#517fa4"
        size={30}
        onPress={() => {
          navigation.navigate("Homepage");
        }}
      />
      <Icon
        name="user"
        type="font-awesome"
        color="#517fa4"
        size={30}
        onPress={() => alert("Hey! this button is not functional right now.", "ok")}
        style={styles.footerIcon}
      />
      {/* <Modal>
            
            </Modal> */}
    </View>
  );
}
const styles = StyleSheet.create({
  futerContainer: {
    backgroundColor: "hsl(47, 93%, 54%)",
    flexDirection: "row",
    justifyContent: "space-evenly",
    paddingVertical: 10,
    // marginHorizontal:10,
  },
  footerIcon: {
    // backgroundColor:
  },
});
