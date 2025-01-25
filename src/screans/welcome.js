import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet, ScrollView, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Welcome({ navigation }) {
  const { width: screenWidth } = useWindowDimensions();

  return (
    <SafeAreaView style={styles.safeAreaView}>
      <ScrollView showsVerticalScrollIndicator={true}>
        <View style={styles.welcMessagView}>
          <Text style={styles.welcomSlogan}>Start Your Smart Shopping Here:</Text>
          <Text style={styles.welcomSlogan}>Discover Groceries at Your Fingertips Better Living</Text>
          <Text style={styles.welcomSlogan}>Anytime, Anywhere!</Text>
        </View>
        <View style={[styles.buttonContainer, { width: screenWidth * 0.6 }]}>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Signup")}>
            <Text style={styles.buttonText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
  },
  welcomSlogan: {
    fontSize: 20,
    color: 'hsl(227, 86%, 55%)',
    textAlign: "center",
  },
  welcMessagView: {
    alignItems: "center",
    justifyContent: "center",
    margin: "1%",
    backgroundColor: "white",
    marginHorizontal: 10,
    paddingVertical: 5,
    width: '80%',
  },
  buttonContainer: {
    alignSelf: "center",
    alignContent: "center",
    alignItems: "center",
  },
  button: {
    alignSelf: "center",
    width: "100%",
    backgroundColor: 'hsl(23, 100%, 66%)',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});