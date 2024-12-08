import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { Icon } from "react-native-elements";
export default function Header({ navigation }) {
  return (
    <View style={styles.header}>
      <View style={styles.menuIconViw}>
        <Icon
          type="material-community"
          name="arrow-left"
          color="white"
          onPress={() => {
            navigation.goBack();
          }}
        />
      </View>
      <View
        style={{
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
        }}
      >
        <Text style={styles.titleText}>Sign In</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "hsl(27, 88%, 58%)",
    padding: 10,
    height: "100%",
  },
  menuIconViw: {
    alignContent: "center",
    justifyContent: "center",
    marginLeft: 15,
  },
  titleText: {
    fontSize: 25,
    fontWeight: "bold",
    textAlign: "center",
    marginLeft: 50,
    color: "white",
  },
});
