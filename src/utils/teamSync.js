import { db } from "./firebase.js";
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from "firebase/firestore";

// Sanitize user name to prevent dot-notation field path injection in Firestore
export const sanitizeMemberName = (name) => {
  if (!name || typeof name !== "string") return "Member";
  const cleaned = name.trim().replace(/[^a-zA-Z0-9 _-]/g, "");
  return cleaned.slice(0, 30) || "Member";
};

export const subscribeToTeam = (teamId, callback, onError) => {
  if (!db || !teamId) return () => {};
  const docRef = doc(db, "teams", teamId);
  return onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data());
      } else {
        callback(null);
      }
    },
    (err) => {
      console.warn("Firestore team subscription error:", err);
      if (onError) onError(err);
    }
  );
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

export const createTeam = async (teamName, rawUserName, roster) => {
  if (!db) throw new Error("Firebase not configured. Please add your config in src/utils/firebase.js");
  const userName = sanitizeMemberName(rawUserName);
  const teamId = generateSecureCode(8);
  const docRef = doc(db, "teams", teamId);
  await setDoc(docRef, {
    name: teamName.trim().slice(0, 50) || "My Team",
    createdAt: Date.now(),
    members: {
      [userName]: roster
    }
  });
  return teamId;
};

export const joinTeam = async (teamId, rawUserName, roster) => {
  if (!db) throw new Error("Firebase not configured. Please add your config in src/utils/firebase.js");
  const userName = sanitizeMemberName(rawUserName);
  const docRef = doc(db, "teams", teamId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error("Team not found");
  
  const teamData = snap.data();
  if (teamData.members && teamData.members[userName]) {
    throw new Error(`The name "${userName}" is already taken in this team. Please choose a different name.`);
  }

  if (teamData.members && Object.keys(teamData.members).length >= 30) {
    throw new Error("This team has reached the maximum limit of 30 members.");
  }
  
  await updateDoc(docRef, {
    [`members.${userName}`]: roster
  });
};

export const syncMyRoster = async (teamId, rawUserName, roster) => {
  if (!db || !teamId || !rawUserName) return;
  const userName = sanitizeMemberName(rawUserName);
  const docRef = doc(db, "teams", teamId);
  // Do not catch and suppress error here so caller gets accurate status
  await updateDoc(docRef, {
    [`members.${userName}`]: roster
  });
};
