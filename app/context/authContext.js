import { createContext, useContext, useEffect, useState } from "react";
import { auth, db, storage } from "../../firebase/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
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
  const [userData, setUserData] = useState(null);
  const [isAuthenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Effect to check authentication status
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setUserData(null);
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (!userDoc.exists()) {
          throw new Error("User data not found");
        }

        const userData = { uid: currentUser.uid, ...userDoc.data() };
        setUser(currentUser);
        setUserData(userData);
        setAuthenticated(true);
      } catch (error) {
        console.error("Error fetching user data:", error);
        Alert.alert("Error", "Failed to fetch user data. Please try again.");
        setUser(null);
        setUserData(null);
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

  const registerCustomer = async (email, password, userData, preserveSession = false) => {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Prepare customer data
      const customerData = {
        ...userData,
        uid: user.uid,
        userType: 'customer',
        role: 'customer',
        createdAt: new Date(),
        status: 'active'
      };

      // Store in users collection
      await setDoc(doc(db, 'users', user.uid), customerData);

      // Only update local state if not preserving session
      if (!preserveSession) {
        setUser(user);
        setUserData(customerData);
        setLoading(false);
      }

      return user;
    } catch (error) {
      console.error('Error registering customer:', error);
      setLoading(false);
      throw error;
    }
  };

  const registerEmployee = async (email, password, role, userData, preserveSession = false) => {
    try {
      // Validate required fields
      const requiredFields = [
        'firstName', 'lastName', 'email', 'phone', 'address',
        'dateOfBirth', 'gender', 'nationalId'
      ];
      
      const missingFields = requiredFields.filter(field => !userData[field]);
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Prepare employee data with all form fields
      const employeeData = {
        // Basic Information
        firstName: userData.firstName,
        lastName: userData.lastName,
        fullName: `${userData.firstName} ${userData.lastName}`,
        email: userData.email,
        phone: userData.phone,
        address: userData.address,
        dateOfBirth: userData.dateOfBirth,
        gender: userData.gender?.value || userData.gender,
        nationalId: userData.nationalId,

        // Emergency Contact
        emergencyContact: {
          name: userData.emergencyContact?.name || '',
          phone: userData.emergencyContact?.phone || '',
          relationship: userData.emergencyContact?.relationship || ''
        },

        // Employment Details
        employmentDetails: {
          department: userData.employmentDetails?.department || '',
          position: userData.employmentDetails?.position || '',
          joiningDate: userData.employmentDetails?.joiningDate || '',
          salary: userData.employmentDetails?.salary || '',
          bankAccount: userData.employmentDetails?.bankAccount || ''
        },

        // System Fields
        uid: user.uid,
        role: role,
        createdAt: new Date(),
        status: 'active',
        lastUpdated: new Date()
      };

      // Store in users collection
      await setDoc(doc(db, 'users', user.uid), employeeData);

      // Only update local state if not preserving session
      if (!preserveSession) {
        setUser(user);
        setUserData(employeeData);
        setLoading(false);
      }

      return user;
    } catch (error) {
      console.error('Error registering employee:', error);
      setLoading(false);
      throw error;
    }
  };

  const registerSupplier = async (email, password, supplierData, preserveSession = false) => {
    try {
      // Validate required fields
      const requiredFields = [
        'companyName', 'contactPerson', 'email', 'phone', 'address'
      ];
      
      const missingFields = requiredFields.filter(field => !supplierData[field]);
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Extract first and last name from contact person
      const nameParts = supplierData.contactPerson.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Prepare supplier data for users collection
      const userData = {
        uid: user.uid,
        firstName: firstName,
        lastName: lastName,
        fullName: supplierData.contactPerson,
        email: email,
        phone: supplierData.phone,
        address: supplierData.address,
        companyName: supplierData.companyName,
        
        // Optional fields
        website: supplierData.website || '',
        taxId: supplierData.taxId || '',
        productType: supplierData.productType || '',
        yearEstablished: supplierData.yearEstablished || '',
        
        // System Fields
        role: 'supplier',
        createdAt: new Date(),
        status: 'active',
        lastUpdated: new Date()
      };

      // Store in users collection
      await setDoc(doc(db, 'users', user.uid), userData);

      // Only update local state if not preserving session
      // This prevents logging out the admin when they create a supplier
      if (!preserveSession) {
        setUser(user);
        setUserData(userData);
        setLoading(false);
      }

      return user;
    } catch (error) {
      console.error('Error registering supplier:', error);
      setLoading(false);
      throw error;
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
      if (!userDoc.exists()) {
        throw new Error("User data not found");
      }

      const userData = { uid: loggedInUser.uid, ...userDoc.data() };
      setUser(loggedInUser);
      setUserData(userData);
      setAuthenticated(true);
      return userData;
    } catch (error) {
      console.error("Login Error:", error.message);
      let errorMessage = "Failed to log in. Please check your credentials.";
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No user found with this email.";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password.";
      }
      Alert.alert("Error", errorMessage);
      throw error;
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
  const resetPassword = async (email) => {
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        "Success",
        "Password reset email has been sent. Please check your inbox."
      );
    } catch (error) {
      console.error("Reset Password Error:", error.message);
      let errorMessage = "Failed to send reset email. Please try again.";
      if (error.code === 'auth/user-not-found') {
        errorMessage = "No user found with this email.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Invalid email address.";
      }
      Alert.alert("Error", errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const contextValue = {
    user,
    userData,
    isAuthenticated,
    loading,
    Login,
    Logout,
    signIn: Login,     // Keep this for backward compatibility
    signOut: Logout,   // Keep this for backward compatibility
    Register,
    registerCustomer,
    registerEmployee,
    registerSupplier,
    resetPassword,
    updateUserProfile: Register,
    updateUserData: Register,
    isAdmin: userData?.role === 'admin',
    isManager: userData?.role === 'manager',
    isCustomer: userData?.role === 'customer',
    isEmployee: userData?.role !== 'customer',
  };

  return (
    <AuthContext.Provider value={contextValue}>
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