import { useState, useRef } from "react";
import { Trash2, RotateCcw, Info, Download, Upload, FileSpreadsheet } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "./ConfirmDialog.jsx";
import { useAppStore } from "../store/useAppStore.js";
import { exportRosterToCSV } from "../utils/csvExport.js";

const Row = ({ label, sub, right, t }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "16px 0",
      borderBottom: `1px solid ${t.tBdr}`,
    }}
  >
    <div>
      <div style={{ fontWeight: 600, fontSize: 14, color: t.text }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>{sub}</div>}
    </div>
    {right}
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
        dark: state.dark
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
          // Sanitize items to prevent store poisoning
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

          // Ask for confirmation before replacing data
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
    <div className="anim-fade-up" style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 560 }}>
      <div>
        <div className="sora" style={{ fontSize: 26, fontWeight: 900, color: t.text, letterSpacing: "-0.5px" }}>
          Settings
        </div>
        <div style={{ fontSize: 13, color: t.sub, marginTop: 4 }}>
          Preferences, data backups & integrations
        </div>
      </div>

      <div
        className="glass"
        style={{
          background: t.card,
          border: `1px solid ${t.cardBdr}`,
          borderRadius: 20,
          padding: "6px 20px",
          boxShadow: "0 2px 14px rgba(0,0,0,.04)",
        }}
      >
        <Row t={t}
          label="Dark Theme"
          sub="Toggle deep contrast dark mode colors"
          right={
            <button
              role="switch"
              aria-checked={dark}
              aria-label="Toggle dark mode"
              onClick={() => setDark(!dark)}
              style={{
                width: 48,
                height: 26,
                borderRadius: 13,
                border: "none",
                cursor: "pointer",
                background: dark ? "#2563EB" : "#CBD5E1",
                position: "relative",
                transition: "background .2s",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 3,
                  width: 20,
                  height: 20,
                  borderRadius: "50%",
                  background: "#fff",
                  boxShadow: "0 1px 4px rgba(0,0,0,.2)",
                  transform: dark ? "translateX(25px)" : "translateX(3px)",
                  transition: "transform .2s",
                }}
              />
            </button>
          }
        />
        <Row t={t}
          label="Clear Roster"
          sub="Permanently delete all scheduled dates and notes"
          right={
            <button
              onClick={handleClearRoster}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 9,
                border: "1.5px solid #FCA5A5",
                background: "transparent",
                color: "#EF4444",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              <Trash2 size={13} />
              Clear
            </button>
          }
        />
        <Row t={t}
          label="Reset Shifts"
          sub="Revert custom templates back to system presets"
          right={
            <button
              onClick={handleResetShifts}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 9,
                border: `1.5px solid ${t.cardBdr}`,
                background: "transparent",
                color: t.sub,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              <RotateCcw size={13} />
              Reset
            </button>
          }
        />
        <Row t={t}
          label="Download JSON Backup"
          sub="Export your entire roster and settings to a JSON file"
          right={
            <button
              onClick={handleExport}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 9,
                border: `1.5px solid ${t.cardBdr}`,
                background: "transparent",
                color: "#2563EB",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              <Download size={13} />
              JSON
            </button>
          }
        />
        <Row t={t}
          label="Export Spreadsheet (CSV)"
          sub="Download your hours and pay calculation for Excel / Sheets"
          right={
            <button
              onClick={handleExportCSV}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 14px",
                borderRadius: 9,
                border: `1.5px solid ${t.cardBdr}`,
                background: "transparent",
                color: "#059669",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif",
              }}
            >
              <FileSpreadsheet size={13} />
              CSV
            </button>
          }
        />
        <Row t={t}
          label="Restore Backup"
          sub="Import roster and settings from a JSON file"
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
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  borderRadius: 9,
                  border: `1.5px solid ${t.cardBdr}`,
                  background: "transparent",
                  color: t.accent,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                <Upload size={13} />
                Restore
              </button>
            </>
          }
        />
        <Row t={t}
          label="Cloud Backup (Google)"
          sub={user ? `Signed in as ${user.email}. Shifts back up automatically.` : "Sign in with Google to sync your shifts across devices"}
          right={
            user ? (
              <button
                onClick={handleSignOut}
                style={{
                  padding: "7px 14px",
                  borderRadius: 9,
                  border: `1.5px solid ${t.cardBdr}`,
                  background: "transparent",
                  color: t.sub,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
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
                style={{
                  padding: "7px 14px",
                  borderRadius: 9,
                  border: "none",
                  background: "#4285F4",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Sign In
              </button>
            )
          }
        />
      </div>

      <div
        className="glass"
        style={{
          background: t.card,
          border: `1px solid ${t.cardBdr}`,
          borderRadius: 20,
          padding: "20px 22px",
          boxShadow: "0 2px 14px rgba(0,0,0,.04)",
        }}
      >
        <div style={{ fontWeight: 700, color: t.text, fontSize: 14, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <Info size={16} />
          <span>About SkyRoster</span>
        </div>
        <div style={{ fontSize: 13, color: t.sub, marginTop: 8, lineHeight: 1.6 }}>
          SkyRoster Smart Shift Planner v4.2
          <br />
          Data is saved securely in your web browser by default. Team sync and cloud backup features connect securely to Google Firebase.
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
          {[
            "Compliance Check",
            "Wage Calculation",
            "ICS Calendar Export",
            "CSV Spreadsheet Export",
            "Pattern Auto-fill",
            "Offline First PWA",
            "Interactive Calendar Grid",
          ].map((tag) => (
            <span
              key={tag}
              style={{
                padding: "4px 10px",
                borderRadius: 20,
                background: "rgba(100,116,139,0.1)",
                color: t.sub,
                fontSize: 11,
                fontWeight: 700,
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
