import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { auth } from '../../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Icon } from 'react-native-elements';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebaseConfig'; // Adjust the path as needed

export default function Login() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  // Handle login
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      // Sign in the user
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert('Success', 'Login successful');

      // Check if the user is an employee or customer
      const collections = ['manager', 'stock_manager', 'delivery_agent', 'customer_assistance'];
      let foundRole = false;

      // Check employee collections
      for (const collectionName of collections) {
        const userQuery = query(collection(db, collectionName), where('email', '==', email));
        const querySnapshot = await getDocs(userQuery);

        if (!querySnapshot.empty) {
          foundRole = true;
          // Redirect based on the collection
          switch (collectionName) {
            case 'manager':
              router.push('/manager');
              break;
            case 'stock_manager':
              router.push('/stockManager');
              break;
            case 'delivery_agent':
              router.push('/deliveryAgent');
              break;
            case 'customer_assistance':
              router.push('/customer_assistance/homepage');
              break;
          }
          break; // Exit loop once the role is found
        }
      }

      // Check customer collection if not found in employee collections
      if (!foundRole) {
        const customerQuery = query(collection(db, 'customers'), where('email', '==', email));
        const customerSnapshot = await getDocs(customerQuery);

        if (!customerSnapshot.empty) {
          foundRole = true;
          router.push('/customer/homepage');
        }
      }

      if (!foundRole) {
        Alert.alert('Error', 'User not found in any role.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Welcome to Queen's Supermarket</Text>
      </View>
      <View style={styles.innerContainer}>
        <Text style={styles.subHeaderText}>Fill the form below to log in</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />

        <View style={styles.passwordContainer}>
          <TextInput
            placeholder="Enter your password"
            secureTextEntry={!passwordVisible}
            style={styles.passwordInput}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setPasswordVisible(!passwordVisible)}
            style={styles.eyeIconContainer}
          >
            <Icon
              name={passwordVisible ? "eye" : "eye-slash"}
              type="font-awesome"
              color="gray"
              size={20}
            />
          </TouchableOpacity>
        </View>

        {/* Login Button */}
        <Pressable style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginButtonText}>Log In</Text>
        </Pressable>

        <Pressable>
          <Text style={styles.forgotPasswordText}>Forgot password?</Text>
        </Pressable>

        {/* Sign-Up Button */}
        <Pressable style={styles.signUpButton} onPress={() => router.push('/screans/signup')}>
          <Text style={styles.signUpButtonText}>I don't have an account? Sign up</Text>
        </Pressable>

        {/* Developer Button */}
        <Pressable style={styles.developerButton} onPress={() => router.push('/screans/developingHompage')}>
          <Text style={styles.developerButtonText}>I am Developer</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  header: {
    backgroundColor: '#FFDC2B',
    padding: 20,
    alignItems: 'center',
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  subHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    width: '100%',
    backgroundColor: '#fff',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 15,
    width: '100%',
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 10,
    fontSize: 16,
  },
  eyeIconContainer: {
    padding: 10,
  },
  loginButton: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    borderRadius: 5,
    width: '100%',
    marginBottom: 10,
  },
  loginButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotPasswordText: {
    color: '#007BFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  signUpButton: {
    backgroundColor: '#e0e0e0',
    paddingVertical: 15,
    borderRadius: 5,
    width: '100%',
    marginBottom: 10,
  },
  signUpButtonText: {
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  developerButton: {
    backgroundColor: '#007BFF',
    paddingVertical: 15,
    borderRadius: 5,
    width: '100%',
  },
  developerButtonText: {
    textAlign: 'center',
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});