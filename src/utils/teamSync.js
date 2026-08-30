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

export const createTeam = async (teamName, userName, roster) => {
  if (!db) throw new Error("Firebase not configured. Please add your config in src/utils/firebase.js");
  const teamId = Math.random().toString(36).substring(2, 8).toUpperCase();
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
