// lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
   apiKey: "AIzaSyBjPfrcMefvk3i0UtwclGt8qHB2sJ0wFog",
  authDomain: "kinnect-60ba9.firebaseapp.com",
  projectId: "kinnect-60ba9",
  storageBucket: "kinnect-60ba9.firebasestorage.app",
  messagingSenderId: "301865968784",
  appId: "1:301865968784:web:3e65e337de83e8a6502415",
  measurementId: "G-4QS5PJ884X"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
