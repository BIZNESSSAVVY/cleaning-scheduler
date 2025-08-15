// firebase.js - Create this new file in your React project src folder
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDJ--UD2GuGvkW_7peLPkokVYW9UP3L_Do",
  authDomain: "cleaning-scheduler-562a5.firebaseapp.com",
  projectId: "cleaning-scheduler-562a5",
  storageBucket: "cleaning-scheduler-562a5.firebasestorage.app",
  messagingSenderId: "749989640123",
  appId: "1:749989640123:web:34bb934325f8317894b69e",
  measurementId: "G-Q5M4MDD16M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;