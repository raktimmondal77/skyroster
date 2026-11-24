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
  { code: "E",  title: "Evening Shift", start: "14:00", end: "22:30", color: "#B45309", isOff: false, hourlyRate: 220 },
  { code: "N",  title: "Night Shift",   start: "20:30", end: "05:00", color: "#DC2626", isOff: false, hourlyRate: 250 },
  { code: "F",  title: "Off Day",       start: "",      end: "",      color: "#047857", isOff: true,  hourlyRate: 0   },
].map(makeShift);

const prefersDark = () =>
  typeof window !== "undefined" &&
  Boolean(window.matchMedia?.("(prefers-color-scheme: dark)").matches);

export const useAppStore = create(
  persist(
    (set, get) => ({
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
      syncStatus: "saved",

      bmcUser: import.meta.env.VITE_BMC_USER || "",
      paypalUser: import.meta.env.VITE_PAYPAL_USER || "",
      upiId: import.meta.env.VITE_UPI_ID || "",

      setRoster: (roster) => set({ roster }),
      setShifts: (shifts) => set({ shifts }),
      setDark: (dark) => set({ dark }),
      setMobOpen: (mobOpen) => set({ mobOpen }),
      setStartDate: (startDate) => set({ startDate, rangeError: "" }),
      setEndDate: (endDate) => set({ endDate, rangeError: "" }),
      setRangeError: (rangeError) => set({ rangeError }),
      setTeamId: (teamId) => set({ teamId }),
      setUserName: (userName) => set({ userName }),
      setTeamData: (teamData) => set({ teamData }),
      setUser: (user) => set({ user }),
      setAuthLoading: (authLoading) => set({ authLoading }),
      setShowDonateModal: (showDonateModal) => set({ showDonateModal }),
      setShowSuccessModal: (showSuccessModal) => set({ showSuccessModal }),
      completeWelcome: () => set({ hasSeenWelcome: true }),
      setSyncStatus: (syncStatus) => set({ syncStatus }),

      restoreData: (parsedData) => {
        if (!parsedData || typeof parsedData !== "object") return false;
        const { roster, shifts, teamId, userName, dark, startDate, endDate } = parsedData;
        set((state) => ({
          ...state,
          ...(Array.isArray(roster) ? { roster } : {}),
          ...(Array.isArray(shifts) && shifts.length > 0 ? { shifts } : {}),
          ...(typeof teamId === "string" ? { teamId } : {}),
          ...(typeof userName === "string" ? { userName } : {}),
          ...(typeof dark === "boolean" ? { dark } : {}),
          ...(typeof startDate === "string" ? { startDate } : {}),
          ...(typeof endDate === "string" ? { endDate } : {}),
        }));
        return true;
      },

      syncShiftTemplateChange: (oldCode, updatedShift) =>
        set((state) => ({
          roster: state.roster.map((r) => {
            if (r.shift !== oldCode) return r;
            return {
              ...r,
              shift: updatedShift.code,
              startTime: updatedShift.isOff ? "" : updatedShift.start,
              endTime: updatedShift.isOff ? "" : updatedShift.end,
              eventTitle: updatedShift.title,
            };
          }),
        })),

      updateEntry: (idx, field, value) =>
        set((state) => {
          if (idx < 0 || idx >= state.roster.length) return state;
          const next = [...state.roster];
          const row = { ...next[idx], [field]: value };
          if (field === "shift") {
            if (!value) {
              row.startTime = "";
              row.endTime = "";
              row.eventTitle = "";
            } else {
              const sh = state.shifts.find((s) => s.code === value);
              if (sh) {
                row.startTime = sh.isOff ? "" : sh.start;
                row.endTime = sh.isOff ? "" : sh.end;
                row.eventTitle = sh.title;
              }
            }
          }
          next[idx] = row;
          return { roster: next };
        }),

      generateRoster: () => {
        const { startDate, endDate, roster } = get();
        if (!startDate || !endDate) {
          set({ rangeError: "Please select both a start date and an end date." });
          return;
        }
        if (startDate > endDate) {
          set({ rangeError: "Start date must be on or before the end date." });
          return;
        }

        const dates = genDates(startDate, endDate);
        if (dates.length > 366) {
          set({ rangeError: "Date range cannot exceed 366 days at once." });
          return;
        }

        set({ rangeError: "" });
        trackEvent("generate_roster", { startDate, endDate });

        const map = new Map();
        roster.forEach((r) => {
          if (!map.has(r.date)) map.set(r.date, []);
          map.get(r.date).push(r);
        });

        const newRoster = [];
        dates.forEach((date) => {
          if (map.has(date)) {
            newRoster.push(...map.get(date));
          } else {
            newRoster.push({
              date,
              day: dayFull(date),
              shift: "",
              startTime: "",
              endTime: "",
              eventTitle: "",
              location: "",
              notes: "",
            });
          }
        });
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
              return { cycle: p1, startIndex: s };
            }
          }
        }
        return null;
      },

      applyDetectedPattern: (patternInput) => {
        const cycle = Array.isArray(patternInput) ? patternInput : patternInput?.cycle;
        if (!cycle || !cycle.length) return { appliedCount: 0, missingCodes: [] };

        const { shifts } = get();
        const missingCodes = [...new Set(cycle.filter((c) => !shifts.some((s) => s.code === c)))];
        let appliedCount = 0;

        set((state) => {
          const firstEmptyIdx = state.roster.findIndex((r) => !r.shift);
          if (firstEmptyIdx === -1) return { roster: state.roster };

          const anchorIdx =
            !Array.isArray(patternInput) && typeof patternInput?.startIndex === "number"
              ? patternInput.startIndex
              : firstEmptyIdx;

          const nextRoster = state.roster.map((r, i) => {
            if (r.shift || i < firstEmptyIdx) return r;
            const offset = (((i - anchorIdx) % cycle.length) + cycle.length) % cycle.length;
            const code = cycle[offset];
            const sh = shifts.find((s) => s.code === code);
            if (!sh) return r;
            appliedCount++;
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

        return { appliedCount, missingCodes };
      },
    }),
    {
      name: "skyroster-storage",
      version: 1,
      migrate: (persistedState) => {
        if (!persistedState || typeof persistedState !== "object") {
          return { roster: [], shifts: DEFAULT_SHIFTS };
        }
        return {
          ...persistedState,
          roster: Array.isArray(persistedState.roster) ? persistedState.roster : [],
          shifts:
            Array.isArray(persistedState.shifts) && persistedState.shifts.length > 0
              ? persistedState.shifts
              : DEFAULT_SHIFTS,
        };
      },
      partialize: (state) => ({
        roster: state.roster,
        shifts: state.shifts,
        dark: state.dark,
        startDate: state.startDate,
        endDate: state.endDate,
        hasSeenWelcome: state.hasSeenWelcome,
        teamId: state.teamId,
        userName: state.userName,
      }),
    }
  )
);
