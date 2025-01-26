import React from "react";
import {Text,View,Pressable,SafeAreaView,StyleSheet} from "react-native";
import { ScreenHeight, ScreenWidth } from "react-native-elements/dist/helpers";
export default function DeveloperHomePage(){
    return (
      <View>
        <Pressable style={styles.button}>
          <Text>manager</Text>
        </Pressable>
        <Pressable style={styles.button}>
          <Text>customer</Text>
        </Pressable>
        <Pressable style={styles.button}>
          <Text>customerSuport</Text>
        </Pressable>
        <Pressable style={styles.button}>
          <Text style={styles.buttontext}>Admine</Text>
        </Pressable>
        <Pressable style={styles.button}>
          <Text>StockManager</Text>
        </Pressable>
      </View>
    );
}
const styles = StyleSheet.create({
  button: {
    backgroundColor: "white",
    width: ScreenWidth * 0.3,
    height: ScreenHeight * 0.2,
  },
  buttontext:{

  }
});