import { db } from "./firebase.js";
import { doc, onSnapshot, runTransaction } from "firebase/firestore";

export const sanitizeMemberName = (name) => {
  if (!name || typeof name !== "string") return "Member";
  const cleaned = name.trim().replace(/[^a-zA-Z0-9 _-]/g, "");
  return cleaned.slice(0, 30) || "Member";
};

export const normalizeTeamId = (teamId) =>
  String(teamId || "").trim().toUpperCase();

export const subscribeToTeam = (rawTeamId, callback, onError) => {
  const teamId = normalizeTeamId(rawTeamId);
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

const generateSecureCode = (length = 8) => {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let result = "";
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
  const cleanTeamName = String(teamName || "").trim().slice(0, 50) || "My Team";

  for (let attempt = 0; attempt < 3; attempt++) {
    const teamId = generateSecureCode(8);
    const docRef = doc(db, "teams", teamId);

    const created = await runTransaction(db, async (tx) => {
      const snap = await tx.get(docRef);
      if (snap.exists()) return false;
      tx.set(docRef, {
        name: cleanTeamName,
        createdAt: Date.now(),
        members: {
          [userName]: Array.isArray(roster) ? roster : [],
        },
      });
      return true;
    });

    if (created) return teamId;
  }

  throw new Error("Could not generate a unique team code. Please try again.");
};

export const joinTeam = async (rawTeamId, rawUserName, roster) => {
  if (!db) throw new Error("Firebase not configured. Please add your config in src/utils/firebase.js");
  const teamId = normalizeTeamId(rawTeamId);
  if (!teamId) throw new Error("Please enter a valid team code.");

  const userName = sanitizeMemberName(rawUserName);
  const docRef = doc(db, "teams", teamId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(docRef);
    if (!snap.exists()) throw new Error("Team not found");

    const teamData = snap.data();
    const members = teamData.members || {};
    const existingKeys = Object.keys(members);

    if (existingKeys.some((k) => k.toLowerCase() === userName.toLowerCase())) {
      throw new Error(`The name "${userName}" is already taken in this team. Please choose a different name.`);
    }

    if (existingKeys.length >= 30) {
      throw new Error("This team has reached the maximum limit of 30 members.");
    }

    tx.update(docRef, {
      [`members.${userName}`]: Array.isArray(roster) ? roster : [],
    });
  });

  return teamId;
};

export const syncMyRoster = async (rawTeamId, rawUserName, roster) => {
  const teamId = normalizeTeamId(rawTeamId);
  if (!db || !teamId || !rawUserName) return;
  const userName = sanitizeMemberName(rawUserName);
  const docRef = doc(db, "teams", teamId);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(docRef);
    if (!snap.exists()) return;
    const members = snap.data().members || {};
    if (!(userName in members)) return;
    tx.update(docRef, {
      [`members.${userName}`]: Array.isArray(roster) ? roster : [],
    });
  });
};
