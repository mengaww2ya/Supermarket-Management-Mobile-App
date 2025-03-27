import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore } from 'firebase/firestore'; // Import Firestore

const firebaseConfig = {
    apiKey: "AIzaSyCENWif-Y8KNr0jFSJTWCoX14ZTftBZpik",
    authDomain: "queens-1f687.firebaseapp.com",
    projectId: "queens-1f687",
    storageBucket: "queens-1f687.firebasestorage.app",
    messagingSenderId: "619277266849",
    appId: "1:619277266849:web:2d29193a37e14e34b565e0",
    measurementId: "G-DJM7C07RZH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore

// Export auth and db for use in other modules
export { auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword };