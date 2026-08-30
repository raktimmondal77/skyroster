import { create } from "zustand";
import { persist } from "zustand/middleware";
import { genDates, dayFull } from "../utils/rosterHelpers.js";
import { trackEvent } from "../utils/analytics.js";

const uid = () =>
  (globalThis.crypto?.randomUUID?.() ??
    `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`);

const makeShift = (s) => ({ ...s, id: uid() });

export const DEFAULT_SHIFTS = [
  { code: "M1", title: "Morning Shift", start: "06:00", end: "14:30", color: "#2563EB", isOff: false, hourlyRate: 200 },
  { code: "M2", title: "Mid Shift",     start: "09:00", end: "17:30", color: "#7C3AED", isOff: false, hourlyRate: 200 },
  { code: "E",  title: "Evening Shift", start: "14:00", end: "22:30", color: "#D97706", isOff: false, hourlyRate: 220 },
  { code: "N",  title: "Night Shift",   start: "20:30", end: "05:00", color: "#DC2626", isOff: false, hourlyRate: 250 },
  { code: "F",  title: "Off Day",       start: "",      end: "",      color: "#059669", isOff: true,  hourlyRate: 0   },
].map(makeShift);

const prefersDark = () =>
  typeof window !== "undefined" &&
  Boolean(window.matchMedia?.("(prefers-color-scheme: dark)").matches);

export const useAppStore = create(
  persist(
    (set, get) => ({
      // State
      roster: [],
      shifts: DEFAULT_SHIFTS,
      dark: prefersDark(),
      mobOpen: false,
      startDate: "",
      endDate: "",
      rangeError: "",
      teamId: "",
      userName: "",
      teamData: null,
      user: null,
      authLoading: true,
      showDonateModal: false,
      showSuccessModal: false,
      hasSeenWelcome: false,

      // Env vars defaults
      bmcUser: import.meta.env.VITE_DEFAULT_BMC || "",
      paypalUser: import.meta.env.VITE_DEFAULT_PAYPAL || "https://www.paypal.com/ncp/payment/8CHC5VF72GMEU",
      upiId: import.meta.env.VITE_DEFAULT_UPI || "9883059530@upi",

      // Setters
      setRoster: (roster) => set({ roster }),
      setShifts: (shifts) => set({ shifts }),
      setDark: (dark) => set({ dark }),
      toggleDark: () => set((state) => ({ dark: !state.dark })),
      setMobOpen: (mobOpen) => set({ mobOpen }),
      setStartDate: (startDate) => set({ startDate }),
      setEndDate: (endDate) => set({ endDate }),
      setRangeError: (rangeError) => set({ rangeError }),
      setTeamId: (teamId) => set({ teamId }),
      setUserName: (userName) => set({ userName }),
      setTeamData: (teamData) => set({ teamData }),
      setUser: (user) => set({ user }),
      setAuthLoading: (authLoading) => set({ authLoading }),
      setShowDonateModal: (showDonateModal) => set({ showDonateModal }),
      setShowSuccessModal: (showSuccessModal) => set({ showSuccessModal }),
      completeWelcome: () => set({ hasSeenWelcome: true }),

      restoreData: (parsedData) => {
        const { roster, shifts, teamId, userName, dark } = parsedData;
        set((state) => ({
          ...state,
          ...(roster ? { roster } : {}),
          ...(shifts ? { shifts } : {}),
          ...(teamId !== undefined ? { teamId } : {}),
          ...(userName !== undefined ? { userName } : {}),
          ...(dark !== undefined ? { dark } : {}),
        }));
      },

      // Helpers & Actions
      updateEntry: (idx, field, value) =>
        set((state) => {
          const next = [...state.roster];
          const row = { ...next[idx], [field]: value };
          if (field === "shift") {
            const sh = state.shifts.find((s) => s.code === value);
            if (sh) {
              row.startTime = sh.isOff ? "" : sh.start;
              row.endTime = sh.isOff ? "" : sh.end;
              row.eventTitle = sh.title;
            }
          }
          next[idx] = row;
          return { roster: next };
        }),

      generateRoster: () => {
        const { startDate, endDate, roster } = get();
        if (!startDate || !endDate) return;
        if (startDate > endDate) {
          set({ rangeError: "Start date must be on or before the end date." });
          return;
        }
        set({ rangeError: "" });
        trackEvent("generate_roster", { startDate, endDate });

        const dates = genDates(startDate, endDate);
        const map = {};
        roster.forEach((r) => {
          map[r.date] = r;
        });

        const newRoster = dates.map(
          (date) =>
            map[date] || {
              date,
              day: dayFull(date),
              shift: "",
              startTime: "",
              endTime: "",
              eventTitle: "",
              location: "",
              notes: "",
            }
        );
        set({ roster: newRoster });
      },

      detectPattern: () => {
        const { roster } = get();
        const assigned = roster.filter((r) => r.shift);
        if (assigned.length < 3) return null;
        const codes = roster.map((r) => r.shift || null);
        for (let len = 2; len <= Math.min(8, Math.floor(codes.length / 2)); len++) {
          for (let s = 0; s <= codes.length - len * 2; s++) {
            const p1 = codes.slice(s, s + len);
            const p2 = codes.slice(s + len, s + len * 2);
            if (p1.every(Boolean) && p1.every((v, idx) => v === p2[idx])) {
              return p1;
            }
          }
        }
        return null;
      },

      applyDetectedPattern: (cycle) => {
        if (!cycle || !cycle.length) return;
        const { shifts } = get();
        set((state) => {
          const firstIdx = state.roster.findIndex((r) => !r.shift);
          if (firstIdx === -1) return { roster: state.roster };
          const nextRoster = state.roster.map((r, i) => {
            if (r.shift || i < firstIdx) return r;
            const code = cycle[(i - firstIdx) % cycle.length];
            const sh = shifts.find((s) => s.code === code);
            if (!sh) return r;
            return {
              ...r,
              shift: code,
              startTime: sh.isOff ? "" : sh.start,
              endTime: sh.isOff ? "" : sh.end,
              eventTitle: sh.title,
            };
          });
          return { roster: nextRoster };
        });
      },
    }),
    {
      name: "skyroster-storage",
      partialize: (state) => ({
        roster: state.roster,
        shifts: state.shifts,
        dark: state.dark,
        teamId: state.teamId,
        userName: state.userName,
        bmcUser: state.bmcUser,
        paypalUser: state.paypalUser,
        upiId: state.upiId,
      }),
    }
  )
);
