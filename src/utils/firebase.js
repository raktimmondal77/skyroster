import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBM39BNJD7VxmDf42xpkmGJXvJTGHX9lVM",
  authDomain: "smart-shift-roster.firebaseapp.com",
  projectId: "smart-shift-roster",
  storageBucket: "smart-shift-roster.firebasestorage.app",
  messagingSenderId: "961671736074",
  appId: "1:961671736074:web:3b8324084f19da541168f3"
};

let app, db, auth, provider;

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  provider = new GoogleAuthProvider();
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

export { db, auth, provider };
