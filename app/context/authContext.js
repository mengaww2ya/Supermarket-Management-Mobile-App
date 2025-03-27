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

// Constants for default values
const DEFAULT_ROLE = "customer";
const DEFAULT_STRINGS = {
  noEmail: "No email",
  noDisplayName: "No display name",
  profilePicturesPath: "profile_pictures/",
};

export default function AuthContextProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Effect to check authentication status
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
        const userData = userDoc.exists()
          ? { uid: currentUser.uid, ...userDoc.data() }
          : {
              uid: currentUser.uid,
              email: currentUser.email || DEFAULT_STRINGS.noEmail,
              displayName: currentUser.displayName || DEFAULT_STRINGS.noDisplayName,
              photoURL: currentUser.photoURL || null,
              role: DEFAULT_ROLE,
            };

        setUser(userData);
        setAuthenticated(true);
      } catch (error) {
        console.error("Error fetching user data:", error);
        Alert.alert("Error", "Failed to fetch user data. Please try again.");
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
      if (!uri) throw new Error("Invalid image URI");
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `${DEFAULT_STRINGS.profilePicturesPath}${email}_${Date.now()}.jpg`);
      await uploadBytes(storageRef, blob);
      return await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Image upload failed:", error);
      return null;
    }
  };

  const Register = async (email, password, firstName, lastName, address, phone, profileImageUri, role = DEFAULT_ROLE) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUser = userCredential.user;

      const photoURL = profileImageUri ? await uploadProfileImage(profileImageUri, email) : null;

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
      Alert.alert("Error", "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const Login = async (email, password) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const loggedInUser = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", loggedInUser.uid));
      const userData = userDoc.exists()
        ? { uid: loggedInUser.uid, ...userDoc.data() }
        : {
            uid: loggedInUser.uid,
            email: loggedInUser.email || DEFAULT_STRINGS.noEmail,
            displayName: loggedInUser.displayName || DEFAULT_STRINGS.noDisplayName,
            photoURL: loggedInUser.photoURL || null,
            role: DEFAULT_ROLE,
          };

      setUser(userData);
      setAuthenticated(true);
    } catch (error) {
      console.error("Login Error:", error.message);
      Alert.alert("Error", "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const Logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setUser(null);
      setAuthenticated(false);
    } catch (error) {
      console.error("Logout Error:", error.message);
      Alert.alert("Error", "Failed to log out. Please try again.");
    } finally {
      setLoading(false);
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