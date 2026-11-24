import { auth, provider, db } from "./firebase.js";
import { signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
  }
};

export const loadRosterFromCloud = async (uid) => {
  if (!db || !uid) return null;
  try {
    const docRef = doc(db, "users", uid);
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data().roster) {
      return snap.data().roster;
    }
    return null;
  } catch (error) {
    console.warn("Could not load roster from cloud (possibly offline):", error);
    return null;
  }
};

export const saveRosterToCloud = async (uid, roster) => {
  if (!db || !uid) return;
  const docRef = doc(db, "users", uid);
  // Do not catch and swallow error here so caller gets true sync status
  await setDoc(docRef, { roster, updatedAt: Date.now() }, { merge: true });
};
