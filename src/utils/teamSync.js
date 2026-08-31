import { db } from "./firebase.js";
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";

export const subscribeToTeam = (teamId, callback) => {
  if (!db) return () => {};
  const docRef = doc(db, "teams", teamId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data());
    } else {
      callback(null);
    }
  });
};

// Generate a mathematically secure 8-character unambiguous code
const generateSecureCode = (length = 8) => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 32-char alphabet (no 0, O, 1, I, L)
  let result = '';
  const randomValues = new Uint32Array(length);
  window.crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
};

export const createTeam = async (teamName, userName, roster) => {
  if (!db) throw new Error("Firebase not configured. Please add your config in src/utils/firebase.js");
  const teamId = generateSecureCode(8);
  const docRef = doc(db, "teams", teamId);
  await setDoc(docRef, {
    name: teamName,
    members: {
      [userName]: roster
    }
  });
  return teamId;
};

export const joinTeam = async (teamId, userName, roster) => {
  if (!db) throw new Error("Firebase not configured. Please add your config in src/utils/firebase.js");
  const docRef = doc(db, "teams", teamId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error("Team not found");
  
  // Vulnerability Fix: Prevent overwriting an existing member's roster
  const teamData = snap.data();
  if (teamData.members && teamData.members[userName]) {
    throw new Error(`The name "${userName}" is already taken in this team. Please choose a different name.`);
  }
  
  await updateDoc(docRef, {
    [`members.${userName}`]: roster
  });
};

export const syncMyRoster = async (teamId, userName, roster) => {
  if (!db) return;
  if (!teamId || !userName) return;
  const docRef = doc(db, "teams", teamId);
  await updateDoc(docRef, {
    [`members.${userName}`]: roster
  }).catch(err => console.error("Failed to sync roster:", err));
};
