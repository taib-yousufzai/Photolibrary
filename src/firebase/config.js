// Firebase Configuration - FORCE ONLINE MODE
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration
export const firebaseConfig = {
    apiKey: "AIzaSyDJDgPtpP4ZO5_ZulUDQFmr99DWltywmn4",
    authDomain: "brass-libs.firebaseapp.com",
    projectId: "brass-libs",
    storageBucket: "brass-libs.firebasestorage.app",
    messagingSenderId: "492704979776",
    appId: "1:492704979776:web:5ac844ae6bfa8d564eb8a5",
    measurementId: "G-MRL7Q9GNB8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('Firebase app initialized successfully');

// Initialize services with MINIMAL configuration to force online mode
export const auth = getAuth(app);
console.log('Firebase Auth initialized successfully');

// Use basic Firestore initialization - NO custom settings that could cause offline issues
export const db = getFirestore(app);
console.log('Firestore initialized in ONLINE-ONLY mode');

export const storage = getStorage(app);
console.log('Firebase Storage initialized successfully');

export default app;
