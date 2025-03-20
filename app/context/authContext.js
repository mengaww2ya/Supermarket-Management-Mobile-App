import { createContext, useContext, useEffect, useState } from "react";
import { auth, db, storage } from "../../firebase/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Alert } from "react-native";

export const AuthContext = createContext();

export default function AuthContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // This effect runs when the component mounts to check the user's authentication status.
useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (!currentUser) {
            setUser(null);
            setAuthenticated(false);
            setLoading(false);
            return;
        }

        try {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            let userData = userDoc.exists() ? { uid: currentUser.uid, ...userDoc.data() } : null;

            if (!userData) {
                userData = {
                    uid: currentUser.uid,
                    email: currentUser.email || "No email",
                    displayName: currentUser.displayName || "No display name",
                    photoURL: currentUser.photoURL || null,
                    role: "customer",
                };
            }

            setUser(userData);
            setAuthenticated(true);
        } catch (error) {
            console.error("Error fetching user data:", error);
            setUser(null);
            setAuthenticated(false);
        } finally {
            setLoading(false);
        }
    });

    return () => unsubscribe();
}, []);


  const uploadProfileImage = async (uri, email) => {
    try {
      if (!uri) return null;
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `profile_pictures/${email}_${Date.now()}.jpg`);
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Image upload failed:", error);
      return null;
    }
  };

  const Register = async (email, password, firstName, lastName, address, phone, profileImageUri, role = "customer") => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      let photoURL = null;
      if (profileImageUri) {
        photoURL = await uploadProfileImage(profileImageUri, email);
      }

      await updateProfile(newUser, {
        displayName: `${firstName} ${lastName}`,
        photoURL: photoURL || "",
      });

      const userData = {
        uid: newUser.uid,
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        email,
        address,
        phone,
        role,
        photoURL: photoURL || null,
        createdAt: new Date(),
      };

      await setDoc(doc(db, "users", newUser.uid), userData);
      setUser(userData);
      setAuthenticated(true);
      Alert.alert("Success", "Account created successfully!");
    } catch (error) {
      console.error("Registration Error:", error.message);
      Alert.alert("Error", error.message || "Failed to create account.");
    } finally {
      setLoading(false); // Always stop loading after the operation
    }
  };

  const Login = async (email, password) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const loggedInUser = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", loggedInUser.uid));
      let userData;

      if (userDoc.exists()) {
        userData = { uid: loggedInUser.uid, ...userDoc.data() };
      } else {
        userData = {
          uid: loggedInUser.uid,
          email: loggedInUser.email || "No email",
          displayName: loggedInUser.displayName || "No display name",
          photoURL: loggedInUser.photoURL || null,
          role: "customer", // Default role
        };
      }

      setUser(userData);
      setAuthenticated(true);
      Alert.alert("Success", "Logged in successfully!");
    } catch (error) {
      console.error("Login Error:", error.message);
      Alert.alert("Error", error.message || "Failed to log in.");
    } finally {
      setLoading(false); // Always stop loading after the operation
    }
  };

  const Logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setAuthenticated(false);
      Alert.alert("Success", "Logged out successfully!");
    } catch (error) {
      console.error("Logout Error:", error.message);
      Alert.alert("Error", error.message || "Failed to log out.");
    } finally {
      setLoading(false); // Always stop loading after the operation
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, Login, Logout, Register, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within an AuthContextProvider");
  }
  return value;
};
