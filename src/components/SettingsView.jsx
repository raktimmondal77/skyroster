import { Sun, Moon, Trash2, RotateCcw, Info, Heart } from "lucide-react";

export default function SettingsView({ 
  t, 
  dark, 
  setDark, 
  setRoster, 
  setShifts, 
  DEFAULT_SHIFTS,
  bmcUser,
  setBmcUser,
  paypalUser,
  setPaypalUser,
  upiId,
  setUpiId
}) {
  const clearRoster = () => {
    if (!window.confirm("Clear all roster data?")) return;
    setRoster([]);
  };

  const resetShifts = () => {
    if (!window.confirm("Reset shifts to defaults?")) return;
    setShifts(DEFAULT_SHIFTS);
  };

  const Row = ({ label, sub, right }) => (
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
        <Row
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
        <Row
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
        <Row
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
      </div>

      {/* Support & Donations Setup */}
      <div
        style={{
          background: t.card,
          border: `1px solid ${t.cardBdr}`,
          borderRadius: 20,
          padding: "22px 24px",
          boxShadow: "0 2px 14px rgba(0,0,0,.04)",
          display: "flex",
          flexDirection: "column",
          gap: 16
        }}
      >
        <div style={{ fontWeight: 700, color: t.text, fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <Heart size={16} color="#EF4444" fill="#EF4444" />
          <span>Support & Donation Links</span>
        </div>
        <div style={{ fontSize: 12.5, color: t.sub, lineHeight: 1.5 }}>
          Set up donation profiles to show a "Support Project" modal on your landing page and sidebar.
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "block" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: t.sub, textTransform: "uppercase", letterSpacing: 0.8 }}>Buy Me a Coffee Username</span>
            <input
              type="text"
              value={bmcUser}
              onChange={(e) => setBmcUser(e.target.value)}
              placeholder="e.g. johndoe"
              style={inputStyle(t)}
            />
          </label>
          
          <label style={{ display: "block" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: t.sub, textTransform: "uppercase", letterSpacing: 0.8 }}>PayPal.me Username</span>
            <input
              type="text"
              value={paypalUser}
              onChange={(e) => setPaypalUser(e.target.value)}
              placeholder="e.g. johndoe"
              style={inputStyle(t)}
            />
          </label>

          <label style={{ display: "block" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: t.sub, textTransform: "uppercase", letterSpacing: 0.8 }}>UPI ID (e.g. UPI QR Code payments)</span>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. johndoe@okaxis"
              style={inputStyle(t)}
            />
          </label>
        </div>
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

const inputStyle = (t) => ({
  width: "100%",
  padding: "9px 13px",
  borderRadius: 10,
  border: `1.5px solid ${t.inputBdr}`,
  background: t.inputBg,
  color: t.inputTxt,
  fontSize: 13,
  fontFamily: "'DM Sans',sans-serif",
  outline: "none",
  marginTop: 6,
});
