import { useState, useRef } from "react";
import { Trash2, RotateCcw, Info, Download, Upload, FileSpreadsheet, ShieldCheck, Moon, Sun, LogIn, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "./ConfirmDialog.jsx";
import { useAppStore } from "../store/useAppStore.js";
import { exportRosterToCSV } from "../utils/csvExport.js";

const SettingRow = ({ label, sub, right, t }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 0",
      borderBottom: `1px solid ${t.tBdr}`,
      gap: 16,
    }}
  >
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 600, fontSize: 14, color: t.text }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: t.sub, marginTop: 3, lineHeight: 1.4 }}>{sub}</div>}
    </div>
    <div style={{ flexShrink: 0 }}>
      {right}
    </div>
  </div>
);

export default function SettingsView({ t, dark, setDark, setRoster, setShifts, DEFAULT_SHIFTS, user, signInWithGoogle, logoutUser }) {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmLabel: "",
    onConfirm: () => {},
  });

  const fileInputRef = useRef(null);

  const handleExport = () => {
    try {
      const state = useAppStore.getState();
      const data = {
        version: 2,
        roster: state.roster,
        shifts: state.shifts,
        startDate: state.startDate,
        endDate: state.endDate,
        dark: state.dark,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `skyroster-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Backup downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export backup.");
    }
  };

  const handleExportCSV = () => {
    const { roster, shifts } = useAppStore.getState();
    if (!roster || roster.length === 0) {
      toast.error("No roster data to export.");
      return;
    }
    exportRosterToCSV(roster, shifts);
    toast.success("Spreadsheet (CSV) exported!");
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File is too large (max 2MB).");
      e.target.value = null;
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      toast.error("Error reading file.");
      e.target.value = null;
    };

    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (!json || typeof json !== "object") throw new Error("Invalid format");

        if (Array.isArray(json.roster) && Array.isArray(json.shifts)) {
          const cleanRoster = json.roster
            .filter((r) => r && typeof r.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.date))
            .map((r) => ({
              date: r.date,
              day: String(r.day || ""),
              shift: String(r.shift || "").slice(0, 8),
              startTime: String(r.startTime || "").slice(0, 5),
              endTime: String(r.endTime || "").slice(0, 5),
              eventTitle: String(r.eventTitle || "").slice(0, 80),
              location: String(r.location || "").slice(0, 80),
              notes: String(r.notes || "").slice(0, 300),
            }));

          const cleanShifts = json.shifts
            .filter((s) => s && typeof s.code === "string")
            .map((s) => ({
              id: s.id || `shift-${Math.random().toString(36).slice(2, 7)}`,
              code: String(s.code).slice(0, 8),
              title: String(s.title || s.code).slice(0, 40),
              start: String(s.start || "").slice(0, 5),
              end: String(s.end || "").slice(0, 5),
              color: typeof s.color === "string" && s.color.startsWith("#") ? s.color : "#2563EB",
              isOff: Boolean(s.isOff),
              hourlyRate: Number(s.hourlyRate) >= 0 ? Number(s.hourlyRate) : 0,
            }));

          setDialogState({
            isOpen: true,
            title: "Restore Schedule Backup?",
            message: `This will replace your current schedule with ${cleanRoster.length} dates and ${cleanShifts.length} shift templates from the backup file.`,
            confirmLabel: "Restore Data",
            onConfirm: () => {
              useAppStore.getState().restoreData({
                roster: cleanRoster,
                shifts: cleanShifts,
                startDate: json.startDate || cleanRoster[0]?.date || "",
                endDate: json.endDate || cleanRoster[cleanRoster.length - 1]?.date || "",
                dark: Boolean(json.dark),
              });
              toast.success("Roster and settings restored successfully!");
            },
          });
        } else {
          toast.error("Invalid backup schema: Missing roster or shifts.");
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to parse file: " + (err.message || "Invalid JSON"));
      } finally {
        e.target.value = null;
      }
    };
    reader.readAsText(file);
  };

  const handleClearRoster = () => {
    setDialogState({
      isOpen: true,
      title: "Clear all roster data?",
      message: "This will permanently remove all your scheduled dates, shifts, and shift notes. This action cannot be undone.",
      confirmLabel: "Delete Roster",
      onConfirm: () => {
        setRoster([]);
        toast.success("Roster cleared successfully");
      },
    });
  };

  const handleResetShifts = () => {
    setDialogState({
      isOpen: true,
      title: "Reset shift templates?",
      message: "This will restore the standard default shift types (Morning, Mid, Evening, Night, Off). Custom shift modifications will be reset.",
      confirmLabel: "Reset Shifts",
      onConfirm: () => {
        setShifts(DEFAULT_SHIFTS);
        toast.success("Shift templates restored to defaults");
      },
    });
  };

  const handleSignOut = () => {
    setDialogState({
      isOpen: true,
      title: "Sign out of Google Backup?",
      message: "Your current schedule will remain saved locally on this device.",
      confirmLabel: "Sign Out",
      onConfirm: async () => {
        try {
          await logoutUser();
          toast.success("Signed out");
        } catch {
          toast.error("Failed to sign out");
        }
      },
    });
  };

  return (
    <div className="anim-fade-up" style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 640 }}>
      {/* Title */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <ShieldCheck size={14} color="#6366F1" />
          <span style={{ fontSize: 11, fontWeight: 700, color: t.sub, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Preferences & Storage
          </span>
        </div>
        <h2 className="jakarta" style={{ fontSize: 28, fontWeight: 800, color: t.text, letterSpacing: "-0.03em" }}>
          Settings
        </h2>
        <p style={{ fontSize: 14, color: t.sub, marginTop: 4 }}>
          Manage appearances, cloud backups, and local roster storage.
        </p>
      </div>

      {/* Main Settings Card */}
      <div
        className="glass-card"
        style={{
          background: t.card,
          border: `1px solid ${t.cardBdr}`,
          borderRadius: 20,
          padding: "8px 24px",
        }}
      >
        {/* Dark Mode */}
        <SettingRow
          t={t}
          label="Appearance"
          sub="Toggle between OLED Dark and Precision Light modes"
          right={
            <button
              role="switch"
              aria-checked={dark}
              aria-label="Toggle dark mode"
              onClick={() => setDark(!dark)}
              className="btn-press"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 14px",
                borderRadius: 99,
                border: `1px solid ${t.cardBdr}`,
                background: t.is ? "#0E1526" : "#F1F5F9",
                color: t.text,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              {dark ? <Moon size={14} color="#818CF8" /> : <Sun size={14} color="#F59E0B" />}
              <span>{dark ? "Dark" : "Light"}</span>
            </button>
          }
        />

        {/* Cloud Backup Google */}
        <SettingRow
          t={t}
          label="Google Cloud Sync"
          sub={
            user
              ? `Connected: ${user.email} (auto-sync active)`
              : "Sign in with Google to safely back up your roster to the cloud"
          }
          right={
            user ? (
              <button
                onClick={handleSignOut}
                className="btn-press"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: `1px solid ${t.cardBdr}`,
                  background: "transparent",
                  color: t.sub,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <LogOut size={13} />
                Sign Out
              </button>
            ) : (
              <button
                onClick={async () => {
                  try {
                    await signInWithGoogle();
                    toast.success("Signed in with Google");
                  } catch (e) {
                    toast.error(e?.message || "Sign in failed");
                  }
                }}
                className="btn-press"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: "none",
                  background: "#4285F4",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(66,133,244,0.3)",
                }}
              >
                <LogIn size={13} />
                Sign In
              </button>
            )
          }
        />

        {/* Download JSON Backup */}
        <SettingRow
          t={t}
          label="Export JSON Backup"
          sub="Download complete offline snapshot of all dates, notes, and custom shifts"
          right={
            <button
              onClick={handleExport}
              className="btn-press"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 10,
                border: `1px solid ${t.cardBdr}`,
                background: t.is ? "rgba(99,102,241,0.1)" : "#EEF2FF",
                color: "#6366F1",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Download size={13} />
              JSON
            </button>
          }
        />

        {/* Export CSV */}
        <SettingRow
          t={t}
          label="Export CSV Spreadsheet"
          sub="Download timesheet for Microsoft Excel, Apple Numbers, or Google Sheets"
          right={
            <button
              onClick={handleExportCSV}
              className="btn-press"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 10,
                border: `1px solid ${t.cardBdr}`,
                background: t.is ? "rgba(16,185,129,0.1)" : "#ECFDF5",
                color: "#059669",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <FileSpreadsheet size={13} />
              CSV
            </button>
          }
        />

        {/* Restore Backup */}
        <SettingRow
          t={t}
          label="Restore JSON Backup"
          sub="Import roster data and shift templates from an existing backup file"
          right={
            <>
              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleImport}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-press"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 14px",
                  borderRadius: 10,
                  border: `1px solid ${t.cardBdr}`,
                  background: t.is ? "rgba(245,158,11,0.1)" : "#FFFBEB",
                  color: "#D97706",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                <Upload size={13} />
                Restore
              </button>
            </>
          }
        />

        {/* Reset Shifts */}
        <SettingRow
          t={t}
          label="Reset Shift Templates"
          sub="Restore standard shift definitions (Morning, Mid, Evening, Night, Off)"
          right={
            <button
              onClick={handleResetShifts}
              className="btn-press"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 10,
                border: `1px solid ${t.cardBdr}`,
                background: "transparent",
                color: t.sub,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <RotateCcw size={13} />
              Reset
            </button>
          }
        />

        {/* Clear Roster */}
        <SettingRow
          t={t}
          label="Clear Current Schedule"
          sub="Permanently erase all scheduled assignments and custom shift notes"
          right={
            <button
              onClick={handleClearRoster}
              className="btn-press"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 10,
                border: "1px solid rgba(239,68,68,0.3)",
                background: "rgba(239,68,68,0.06)",
                color: "#EF4444",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <Trash2 size={13} />
              Clear
            </button>
          }
        />
      </div>

      {/* About Box */}
      <div
        className="glass-card"
        style={{
          background: t.card,
          border: `1px solid ${t.cardBdr}`,
          borderRadius: 20,
          padding: "20px 24px",
        }}
      >
        <div style={{ fontWeight: 700, color: t.text, fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <Info size={16} color="#6366F1" />
          <span className="jakarta">SkyRoster Architecture</span>
        </div>
        <div style={{ fontSize: 13, color: t.sub, marginTop: 8, lineHeight: 1.6 }}>
          Version 4.2 · Offline-First Progressive Web Application.
          <br />
          Your schedule is stored locally by default. Real-time team collaboration and cloud backups sync seamlessly via Google Cloud Firestore.
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
          {[
            "Fatigue & Compliance Check",
            "Wage Calculation Engine",
            "Universal ICS Calendar",
            "CSV Spreadsheet Export",
            "PWA Offline Engine",
            "Linear + Amie UI/UX",
          ].map((tag) => (
            <span
              key={tag}
              style={{
                padding: "4px 10px",
                borderRadius: 20,
                background: t.is ? "rgba(255,255,255,0.05)" : "rgba(100,116,139,0.08)",
                color: t.sub,
                fontSize: 11,
                fontWeight: 600,
                border: `1px solid ${t.cardBdr}`,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <ConfirmDialog
        t={t}
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        confirmLabel={dialogState.confirmLabel}
        onConfirm={dialogState.onConfirm}
        onClose={() => setDialogState((s) => ({ ...s, isOpen: false }))}
      />
    </div>
  );
}
