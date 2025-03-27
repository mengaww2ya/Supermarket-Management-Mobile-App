import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  TextInput,
  SafeAreaView,
  Modal,
} from "react-native";
import { Icon } from "react-native-elements";
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
  const [modalVisible, setModalVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const router = useRouter();

  const showAlert = (message) => {
    setAlertMessage(message);
    setModalVisible(true);
  };

  const handleSignUp = async () => {
    console.log({ firstName, lastName, address, phone, email, password, confirmPassword });

    if (!email.trim() || !password.trim() || !firstName.trim() || !lastName.trim() || !address.trim() || !phone.trim()) {
      showAlert("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      showAlert("Password must be at least 6 characters long");
      return;
    }

    if (password !== confirmPassword) {
      showAlert("Passwords do not match");
      return;
    }

    // Email validation using a regular expression
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
      showAlert("Please enter a valid email address (e.g., example@gmail.com)");
      return;
    }

    // Phone number validation
    const phonePattern = /^\d{10}$/;
    if (!phonePattern.test(phone)) {
      showAlert("Please enter a valid 10-digit phone number");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userId = userCredential.user.uid;

      await setDoc(doc(db, "customers", userId), {
        firstName,
        lastName,
        email,
        address,
        phone,
      });

      showAlert("Account created successfully!");
      setTimeout(() => {
        router.push("/screans/login");
      }, 2000);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        showAlert("The email address is already in use. Please use a different email.");
      } else {
        showAlert(error.message);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Welcome to Queen Supermarket</Text>
      </View>
      <View style={styles.signupBody}>
        <View style={styles.textInputContainer}>
          <View style={styles.inputWrapper}>
            <Icon name="user" type="font-awesome" size={20} />
            <TextInput
              style={styles.textInput}
              placeholder="First Name"
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>
          <View style={styles.inputWrapper}>
            <Icon name="user" type="font-awesome" size={20} />
            <TextInput
              style={styles.textInput}
              placeholder="Last Name"
              value={lastName}
              onChangeText={setLastName}
            />
          </View>
          <View style={styles.inputWrapper}>
            <Icon name="phone" type="font-awesome" size={20} />
            <TextInput
              style={styles.textInput}
              placeholder="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.inputWrapper}>
            <Icon name="envelope" type="font-awesome" size={20} />
            <TextInput
              style={styles.textInput}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
          </View>
          <View style={styles.inputWrapper}>
            <Icon name="home" type="font-awesome" size={20} />
            <TextInput
              style={styles.textInput}
              placeholder="Address"
              value={address}
              onChangeText={setAddress}
            />
          </View>
          <View style={styles.inputWrapper}>
            <Icon name="lock" type="font-awesome" size={20} />
            <TextInput
              style={styles.textInput}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
          <View style={styles.inputWrapper}>
            <Icon name="lock" type="font-awesome" size={20} />
            <TextInput
              style={styles.textInput}
              placeholder="Confirm Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>
        </View>
        <Pressable style={styles.signupButton} onPress={handleSignUp}>
          <Text style={styles.textButton}>Register</Text>
        </Pressable>
      </View>

      <View style={styles.signInBContainer}>
        <Text style={styles.text}>Already have an account?</Text>
        <Pressable style={styles.signinButton} onPress={() => router.push("/screans/login")}>
          <Text style={styles.textButton}>Login</Text>
        </Pressable>
      </View>

      <Modal
        transparent={true}
        animationType="fade"
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalText}>{alertMessage}</Text>
            <Pressable
              style={styles.modalButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f0f0" },
  header: { backgroundColor: '#FFDC2B', padding: 26, marginBottom: 20 },
  headerText: { fontSize: 24, fontWeight: "bold", textAlign: "center", color: "black" },
  signupBody: { alignItems: "center", width: "100%" },
  textInputContainer: { width: "80%" }, // Center inputs
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 5,
    backgroundColor: "#ffffff",
  },
  textInput: { flex: 1, padding: 12, fontSize: 16, borderWidth: 0, textAlign: 'center' }, // Center text in inputs
  signupButton: { backgroundColor: "#28a745", borderRadius: 5, paddingVertical: 10, alignItems: "center", width: "80%", marginTop: 15 }, // Minimized height
  signinButton: { backgroundColor: "#007BFF", borderRadius: 5, paddingVertical: 10, alignItems: "center", width: "80%", marginTop: 10 }, // Minimized height
  text: { fontSize: 16, marginVertical: 10, textAlign: "center", fontWeight: "bold" },
  textButton: { color: "white", fontSize: 16, fontWeight: "bold" },
  signInBContainer: { alignItems: "center", marginTop: 20 },

  // Modal styles
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContainer: {
    width: 300,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 15,
  },
  modalButton: {
    backgroundColor: "#007BFF",
    borderRadius: 5,
    padding: 10,
    alignItems: "center",
    width: "100%",
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});