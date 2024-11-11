import React from "react";
import { View, StyleSheet } from "react-native";

export default function Header() {
  return (
    <View style={styles.header}>
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
