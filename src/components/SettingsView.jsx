import { Sun, Moon, Trash2, RotateCcw, Info } from "lucide-react";

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
  const clearRoster = () => {
    if (!window.confirm("Clear all roster data?")) return;
    setRoster([]);
  };

  const resetShifts = () => {
    if (!window.confirm("Reset shifts to defaults?")) return;
    setShifts(DEFAULT_SHIFTS);
  };

  return (
    <div className="anim-fade-up" style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 560 }}>
      <div>
        <div className="sora" style={{ fontSize: 28, fontWeight: 900, color: t.text, letterSpacing: "-0.6px" }}>
          Settings
        </div>
        <div style={{ fontSize: 13, color: t.sub, marginTop: 5 }}>
          Preferences & data management
        </div>
      </div>

      <div
        style={{
          background: t.card,
          border: `1px solid ${t.cardBdr}`,
          borderRadius: 20,
          padding: "6px 24px",
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
              onClick={clearRoster}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 16px",
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
              onClick={resetShifts}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "7px 16px",
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
          label="Cloud Backup (Google)"
          sub={user ? `Signed in as ${user.email}. Shifts are backing up automatically.` : "Sign in with Google to sync your shifts across devices"}
          right={
            user ? (
              <button
                onClick={logoutUser}
                style={{
                  padding: "7px 16px",
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
                onClick={signInWithGoogle}
                style={{
                  padding: "7px 16px",
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
        style={{
          background: t.card,
          border: `1px solid ${t.cardBdr}`,
          borderRadius: 20,
          padding: "22px 24px",
          boxShadow: "0 2px 14px rgba(0,0,0,.04)",
        }}
      >
        <div style={{ fontWeight: 700, color: t.text, fontSize: 14, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <Info size={16} />
          <span>About Smart Shift</span>
        </div>
        <div style={{ fontSize: 13, color: t.sub, lineHeight: 1.8 }}>
          Smart Shift Roster Planner v4.0
          <br />
          All data is securely saved directly in your web browser using localStorage. 
          Nothing is uploaded or shared.
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
          {[
            "Compliance Check",
            "Wage Calculation",
            "ICS Calendar Export",
            "Pattern Auto-fill",
            "Local Storage Cache",
            "Interactive Calendar Grid",
          ].map((tag) => (
            <span
              key={tag}
              style={{
                padding: "4px 12px",
                borderRadius: 20,
                background: t.tag,
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
    </div>
  );
}
