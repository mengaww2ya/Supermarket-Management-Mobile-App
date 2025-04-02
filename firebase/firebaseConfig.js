import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection } from "firebase/firestore";
import Constants from "expo-constants";
// Firebase configuration
const firebaseConfig = {
  apiKey: Constants.expoConfig.extra.firebaseApiKey,
  authDomain: Constants.expoConfig.extra.firebaseAuthDomain,
  projectId: Constants.expoConfig.extra.firebaseProjectId,
  storageBucket: Constants.expoConfig.extra.firebaseStorageBucket,
  messagingSenderId: Constants.expoConfig.extra.firebaseMessagingSenderId,
  appId: Constants.expoConfig.extra.firebaseAppId,
   measurementId: Constants.expoConfig.extra.firebaseMeasurementId,
};
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);  // ✅ Changed from initializeAuth
// Initialize Firestore
const db = getFirestore(app);
// Firestore collections
export const usersRef = collection(db, 'users');
export const roomRef = collection(db, 'chatRoom');
// Export Firebase services
export { auth, db };
