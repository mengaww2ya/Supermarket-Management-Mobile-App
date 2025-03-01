import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  TextInput,
  SafeAreaView,
  Alert,
} from "react-native";
import { colors } from "react-native-elements";
import { useRouter } from "expo-router";
import { auth, db } from "../../firebaseConfig"; // Import Firestore
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; // Import Firestore functions

const screenwidth = Dimensions.get("window").width;

export default function Signup() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const router = useRouter();

  const handleSignUp = async () => {
    if (!email || !password || !firstName || !lastName || !address || !phone) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid; // Get the user ID from the credential

      // Store additional user info in Firestore
      await setDoc(doc(db, "customers", userId), {
        firstName,
        lastName,
        email,
        address,
        phone,
      });

      Alert.alert("Success", "Account created!");
      router.push("/screans/login");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        <Text style={styles.text}>
          Fill the form to register or press sign in if you have an account
        </Text>
        <View style={styles.signupBody}>
          <View style={styles.textInputContainer}>
            <TextInput style={styles.textInput} placeholder="First Name" value={firstName} onChangeText={setFirstName} />
            <TextInput style={styles.textInput} placeholder="Last Name" value={lastName} onChangeText={setLastName} />
            <TextInput style={styles.textInput} placeholder="Address" value={address} onChangeText={setAddress} />
            <TextInput style={styles.textInput} placeholder="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <TextInput style={styles.textInput} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <TextInput style={styles.textInput} placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
            <TextInput style={styles.textInput} placeholder="Confirm Password" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} />
          </View>
          <View style={styles.buttonContainer}>
            <Pressable style={styles.signupButton} onPress={handleSignUp}>
              <Text style={styles.textButton}>Sign Up</Text>
            </Pressable>
            <Pressable style={styles.clearButton} onPress={() => { setFirstName(''); setLastName(''); setAddress(''); setPhone(''); setEmail(''); setPassword(''); setConfirmPassword(''); }}>
              <Text style={styles.textButton}>Clear</Text>
            </Pressable>
          </View>
        </View>
      </View>
      <View style={styles.signInBContainer}>
        <Text style={styles.text}>Already have an account?</Text>
        <Pressable style={styles.signinButton} onPress={() => router.push("/screans/login")}>
          <Text style={styles.textButton}>Login</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: colors.grey5, justifyContent: "center", paddingHorizontal: 20 },
  container: { backgroundColor: colors.grey5, padding: 15, borderRadius: 5, alignItems: "center" },
  signupBody: { width: screenwidth * 0.8 },
  textInputContainer: { width: "100%", backgroundColor: "white", padding: 10, borderRadius: 5, borderWidth: 1, borderColor: colors.grey4 },
  textInput: { padding: 12, fontSize: 16, marginVertical: 5, borderRadius: 5, borderWidth: 1, borderColor: colors.grey4 },
  buttonContainer: { flexDirection: "row", justifyContent: "space-evenly", width: "100%", marginTop: 10 },
  signupButton: { backgroundColor: colors.grey2, borderRadius: 5, padding: 10, alignItems: "center", width: "45%" },
  clearButton: { backgroundColor: colors.warning, borderRadius: 5, padding: 10, alignItems: "center", width: "45%" },
  signinButton: { backgroundColor: colors.grey3, borderRadius: 5, padding: 10, alignItems: "center" },
  text: { fontSize: 18, marginVertical: 10, color: colors.grey3, textAlign: "center", fontWeight: "bold" },
  textButton: { color: "white", fontSize: 16, fontWeight: "bold" },
  signInBContainer: { alignItems: "center", marginTop: 20 },
});