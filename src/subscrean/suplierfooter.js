import React from "react";
import { View, StyleSheet } from "react-native";
import { Icon } from "react-native-elements";

export default function SupplierFooter({ navigation }) {
  return (
    <View style={styles.footerContainer}>
      {/* Home */}
      <Icon
        name="home"
        type="font-awesome"
        color="#517fa4"
        size={30}
        onPress={() => navigation.navigate("suplierHome")}
      />

      {/* Communication & Alerts */}
      <Icon
        name="comments"
        type="font-awesome"
        color="#517fa4"
        size={30}
        onPress={() => {
          alert("Hey! message button is not functional right now.", "ok");
        }}
      />

      {/* Manage Profile & Business Info */}
      <Icon
        name="user"
        type="font-awesome"
        color="#517fa4"
        size={30}
        onPress={() => {
          alert("Hey! profile button is not functional right now.", "ok");
        }}
      />

      {/* Notifications */}
      <Icon
        name="bell"
        type="font-awesome"
        color="#ff9900"
        size={30}
        onPress={() => {
          alert("Hey! alert button is not functional right now.", "ok");
        }}
      />

      {/* Settings */}
      <Icon
        name="cog"
        type="font-awesome"
        color="#517fa4"
        size={30}
        onPress={() => {
          alert("Hey! seting button is not functional right now.", "ok");
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
    paddingVertical: 12,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
});
