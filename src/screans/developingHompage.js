import React from "react";
import {Text,View,Pressable,SafeAreaView,StyleSheet, ScrollView} from "react-native";
import { colors } from "react-native-elements";
import { ScreenHeight, ScreenWidth } from "react-native-elements/dist/helpers";
export default function DeveloperHomePage({navigation}){
    return (
      <ScrollView>
        <Text style={styles.titlText}>
            Hey! which role you want to test
          </Text>
        <View style={styles.container}>
          
          <Pressable
            style={styles.button}
            onPress={() => {
              navigation.navigate("ManagerHomePage");
            }}
          >
            <Text style={styles.buttontext}>manager</Text>
          </Pressable>
          <Pressable
            style={styles.button}
            onPress={() => {
              navigation.navigate("Homepage");
            }}
          >
            <Text style={styles.buttontext}>customer</Text>
          </Pressable>
          <Pressable style={styles.button}>
            <Text style={styles.buttontext}>customerSuport</Text>
          </Pressable>
          <Pressable style={styles.button}>
            <Text style={styles.buttontext}>Admine</Text>
          </Pressable>
          <Pressable style={styles.button}>
            <Text style={styles.buttontext}>StockManager</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
}
const styles = StyleSheet.create({
  container:{
    marginHorizontal:10,
    marginVertical:10,
    flexDirection:"row",
    flexWrap:"wrap",
    justifyContent:"space-between",
    borderColor:colors.grey5,
    borderWidth:0.5,
    alignSelf:"center",
    rowGap:20,
  },
  button: {
    backgroundColor: colors.grey5,
    width: ScreenWidth * 0.3,
    height: ScreenHeight * 0.2,
    justifyContent: "center",
    borderColor: colors.grey4,
    borderWidth: 1,
    borderRadius: 5,
    bordershadowColor: colors.grey0,
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
    // elevation: 10,

  },
  titlText:{
    padding:10,
    fontFamily:"new times roman",
    fontSize:20,
    textAlign:"center",
    backgroundColor:colors.grey5,
    fontWeight:"bold",
    fontVariant: ["small-caps"],
    
  },
buttontext:{
padding:10,
fontFamily:"new times roman",
fontSize:20,
textAlign:"center",
  }
});