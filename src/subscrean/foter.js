import React from "react";
import { View, StyleSheet } from "react-native";
import { Icon } from "react-native-elements";

export default function Footer({ navigation }) {
  return (
    <View style={styles.footerContainer}>
      {/* Home */}
      <Icon
        name="home"
        type="font-awesome"
        color="#517fa4"
        size={30}
        onPress={() => navigation.navigate("Homepage")}
      />

      {/* Categories */}
      <Icon
        name="th-list"
        type="font-awesome"
        color="#517fa4"
        size={30}
        onPress={() => {
        
           alert("Hey! this button is not functional right now.", "ok");
        }}
      />

      {/* Orders */}
      <Icon
        name="list-alt"
        type="font-awesome"
        color="#517fa4"
        size={30}
        onPress={() => {
          // navigation.navigate("Orders")
           alert("Hey! this button is not functional right now.", "ok");
        }}
      />

      {/* Favorites (New) */}
      <Icon
        name="heart"
        type="font-awesome"
        color="red"
        size={30}
        onPress={() => {
          // navigation.navigate("Favorites");
           alert("Hey! this button is not functional right now.", "ok");
        }}
      />

      {/* Profile */}
      <Icon
        name="user"
        type="font-awesome"
        color="#517fa4"
        size={30}
        onPress={() => {
          // navigation.navigate("Profile"); 
          alert("Hey! this button is not functional right now.", "ok")
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: "hsl(47, 93%, 54%)",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
  },
});
