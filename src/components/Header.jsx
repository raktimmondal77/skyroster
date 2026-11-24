import { Menu, Calendar, Cloud, Loader2, CloudAlert, CloudCog } from "lucide-react";

export default function Header({ t, roster, downloadICS, mobOpen, setMobOpen, onOpenShortcuts, syncStatus }) {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  
  const canExport = Array.isArray(roster) && roster.some(r => r.shift && r.shift !== "F" && r.startTime);

  const syncLabel =
    syncStatus === "syncing" ? "Saving..." :
    syncStatus === "saved" ? "Saved" :
    syncStatus === "error" ? "Sync Error" : "Unsaved";

  const syncColor =
    syncStatus === "saved" ? "#047857" :
    syncStatus === "error" ? "#EF4444" :
    syncStatus === "syncing" ? "#2563EB" : t.sub;

  const syncBg =
    syncStatus === "saved" ? "rgba(4,120,87,0.1)" :
    syncStatus === "error" ? "rgba(239,68,68,0.1)" :
    syncStatus === "syncing" ? "rgba(37,99,235,0.1)" : "rgba(100,116,139,0.1)";

  return (
    <header
      className="glass"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 50,
        background: t.is ? "rgba(7,13,26,.88)" : "rgba(238,242,251,.92)",
        backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${t.sBdr}`,
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Left: Mobile Nav Button + App Title */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          className="mob-only"
          aria-label="Open navigation menu"
          aria-expanded={mobOpen}
          onClick={() => setMobOpen(!mobOpen)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: 10,
            background: t.is ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.03)",
            border: `1px solid ${t.cardBdr}`,
            color: t.text,
            cursor: "pointer",
          }}
        >
          <Menu size={20} />
        </button>

        <div>
          <div
            className="sora"
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: t.text,
              letterSpacing: "-0.3px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>SkyRoster</span>
            <span
              style={{
                fontSize: 10,
                padding: "2px 6px",
                borderRadius: 6,
                background: "rgba(37,99,235,0.12)",
                color: "#2563EB",
                fontWeight: 700,
                letterSpacing: 0,
              }}
            >
              v4.2
            </span>
          </div>
          <div style={{ fontSize: 11, color: t.sub, fontWeight: 500, marginTop: 1 }}>{today}</div>
        </div>
      </div>

      {/* Right: Cloud Sync Pill + Shortcuts + Export Button */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Sync Status Badge */}
        <div
          role="status"
          aria-live="polite"
          title={`Cloud Sync: ${syncLabel}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
            color: syncColor,
            background: syncBg,
            transition: "all 0.25s ease",
          }}
        >
          {syncStatus === "syncing" ? (
            <Loader2 size={14} className="spin" style={{ color: "#2563EB" }} />
          ) : syncStatus === "saved" ? (
            <Cloud size={14} />
          ) : syncStatus === "error" ? (
            <CloudAlert size={14} />
          ) : (
            <CloudCog size={14} />
          )}
          <span className="desk-only">{syncLabel}</span>
        </div>

        {/* Shortcuts Button */}
        <button
          onClick={onOpenShortcuts}
          title="Keyboard shortcuts (?)"
          aria-label="Keyboard shortcuts"
          className="desk-only card-lift"
          style={{
            padding: "8px 12px",
            borderRadius: 10,
            border: `1px solid ${t.cardBdr}`,
            background: t.card,
            color: t.sub,
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span className="mono" style={{ fontSize: 12, color: "#2563EB" }}>⌨</span>
          <span>Shortcuts</span>
        </button>

        {/* Export Button */}
        <button
          disabled={!canExport}
          aria-label="Export calendar as ICS file"
          onClick={downloadICS}
          className="card-lift"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 10,
            border: "none",
            cursor: canExport ? "pointer" : "not-allowed",
            background: canExport ? "linear-gradient(135deg,#2563EB,#7C3AED)" : (t.is ? "#1C2740" : "#CBD5E1"),
            color: canExport ? "#ffffff" : (t.is ? "#4A5A7A" : "#64748B"),
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: canExport ? "0 4px 12px rgba(37,99,235,.3)" : "none",
            opacity: canExport ? 1 : 0.7,
          }}
        >
          <Calendar size={14} />
          <span>Export .ics</span>
        </button>
      </div>
    </header>
  );
}
