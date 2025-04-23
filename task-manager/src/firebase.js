// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDuQ5U_jvbDYwHIyvGGlIso09Vc9jnMoWU",
    authDomain: "termproject-89a0d.firebaseapp.com",
    projectId: "termproject-89a0d",
    storageBucket: "termproject-89a0d.firebasestorage.app",
    messagingSenderId: "718048077031",
    appId: "1:718048077031:web:0746e272b7399ac2bdee42"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };