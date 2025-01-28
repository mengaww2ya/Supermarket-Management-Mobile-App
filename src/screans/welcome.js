import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { colors } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Welcome({ navigation }) {
  const { width: screenWidth } = useWindowDimensions();

  return (
    <SafeAreaView style={styles.safeAreaView}>
      <ScrollView showsVerticalScrollIndicator={true}>
        <View style={styles.container}>
          <View style={styles.welcMessagView}>
            <Text style={styles.welcomSlogan}>
              Start Your Smart Shopping Here: Discover Groceries at Your
              Fingertips Better Living Anytime, Anywhere!
            </Text>
          </View>
          <View style={[styles.buttonContainer, { width: screenWidth * 0.6 }]}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("Login")}
            >
              <Text style={styles.buttonText}>Log In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("Signup")}
            >
              <Text style={styles.buttonText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaView:{
alignItems:"center",
  },
container:{
borderColor:colors.grey2,
borderWidth:1,
margin:10,
padding:10,
backgroundColor:"white",
alignContent:"center",
},
  welcomSlogan: {
    fontSize: 20,
    color: colors.black,
    textAlign: "center",
    fontFamily: "new times roman",
    // fontVariant: ["small-caps"],
  },
  welcMessagView: {
    alignItems: "center",
    justifyContent: "center",
    margin: "1%",
    backgroundColor: "white",
    marginHorizontal: 10,
    paddingVertical: 5,
    width: "80%",
  },
  buttonContainer: {
    alignSelf: "center",
    alignContent: "center",
    alignItems: "center",
  },
  button: {
    alignSelf: "center",
    width: "100%",
    backgroundColor: "hsl(23, 100%, 66%)",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 10,
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});