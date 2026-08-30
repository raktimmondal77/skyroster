import { Menu, Calendar, Cloud, Loader2, CloudAlert, CloudCog } from "lucide-react";

export default function Header({ t, roster, downloadICS, mobOpen, setMobOpen, onOpenShortcuts, syncStatus }) {
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
      <style>{`
        .mob-ham { display: flex; align-items: center; background: none; border: none; cursor: pointer; padding: 2px; }
        .desk-only { display: none; }
        @media(min-width:768px) {
          .mob-ham { display: none; }
          .desk-only { display: block; }
        }
      `}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button
          className="mob-ham"
          aria-label="Open navigation menu"
          aria-expanded={mobOpen}
          onClick={() => setMobOpen(!mobOpen)}
          style={{
            color: t.sub,
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
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Sync Indicator */}
        <div
          title={
            syncStatus === "saved" ? "Saved to cloud" :
            syncStatus === "syncing" ? "Saving..." :
            syncStatus === "error" ? "Cloud save failed" : "Unsaved changes"
          }
          className="desk-only"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
            color: syncStatus === "saved" ? "#059669" : syncStatus === "error" ? "#EF4444" : t.sub,
            background: syncStatus === "saved" ? "rgba(5,150,105,0.1)" : syncStatus === "error" ? "rgba(239,68,68,0.1)" : "transparent",
            transition: "all 0.3s"
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
          <span>
            {syncStatus === "syncing" ? "Saving..." : syncStatus === "saved" ? "Saved" : syncStatus === "error" ? "Error" : "Syncing..."}
          </span>
        </div>

        <button
          onClick={onOpenShortcuts}
          title="Keyboard shortcuts (?)"
          className="desk-only btn-hover"
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
          <span className="mono" style={{ fontSize: 13, color: "#2563EB" }}>⌨</span>
          <span>Shortcuts</span>
        </button>

        <button
          disabled={!canExport}
          aria-label="Export calendar as ICS"
          onClick={downloadICS}
          className="btn-hover"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 20px",
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
      </div>
    </header>
  );
}
