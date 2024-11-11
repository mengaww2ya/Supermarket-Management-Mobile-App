import React from "react";
import { View, StyleSheet } from "react-native";
import { Icon } from "@rneui/base";
export default function Header() {
  return (
    <View style={styles.header}>
      <Icon
    type="material-community"
    name="arrow-left"
    color="#hsl(0, 0%, 100%)"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    backgroundColor: "hsl(23, 100%, 66%)",
    height: 60,
    alignItems: "center", 
    paddingHorizontal: 10, 
  },
});
