import { Menu, Calendar } from "lucide-react";

export default function Header({ t, roster, downloadICS, mobOpen, setMobOpen }) {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  
  const canExport = roster.some(r => r.shift && r.shift !== "F" && r.startTime);

  return (
    <header
      className="glass"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: t.is ? "rgba(7,13,26,.82)" : "rgba(238,242,251,.85)",
        borderBottom: `1px solid ${t.sBdr}`,
        padding: "14px 28px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button
          className="mob-ham"
          aria-label="Open navigation menu"
          aria-expanded={mobOpen}
          onClick={() => setMobOpen(!mobOpen)}
          style={{
            display: "none",
            alignItems: "center",
            background: "none",
            border: "none",
            cursor: "pointer",
            color: t.sub,
            padding: "2px",
          }}
        >
          <Menu size={22} />
        </button>
        <div>
          <div
            className="sora desk-only"
            style={{ fontSize: 17, fontWeight: 700, color: t.text, letterSpacing: "-0.4px" }}
          >
            Smart Shift Dashboard
          </div>
          <div style={{ fontSize: 12, color: t.sub, fontWeight: 500, marginTop: 1 }}>{today}</div>
        </div>
      </div>
      <button
        disabled={!canExport}
        aria-label="Export calendar as ICS"
        onClick={downloadICS}
        className="btn-hover"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 22px",
          borderRadius: 11,
          border: "none",
          cursor: canExport ? "pointer" : "not-allowed",
          background: canExport ? "linear-gradient(135deg,#2563EB,#7C3AED)" : "#CBD5E1",
          color: "#fff",
          fontSize: 13,
          fontWeight: 700,
          fontFamily: "'DM Sans',sans-serif",
          boxShadow: canExport ? "0 4px 14px rgba(37,99,235,.35)" : "none",
          opacity: canExport ? 1 : 0.6,
        }}
      >
        <Calendar size={16} />
        Export .ics
      </button>
    </header>
  );
}
