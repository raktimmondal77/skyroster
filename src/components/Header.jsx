import { Search, Download } from "lucide-react";

export default function Header({
  t,
  roster,
  downloadICS,
  onOpenCommandPalette,
  syncStatus,
}) {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  const canExport = Array.isArray(roster) && roster.some((r) => r.shift && r.startTime);

  const syncLabel =
    syncStatus === "syncing" ? "Syncing..." :
    syncStatus === "saved" ? "Cloud Synced" :
    syncStatus === "error" ? "Sync Error" : "Local Only";

  const syncDotColor =
    syncStatus === "saved" ? "#10B981" :
    syncStatus === "error" ? "#EF4444" :
    syncStatus === "syncing" ? "#3B82F6" : "#94A3B8";

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        background: t.is ? "rgba(8, 13, 26, 0.82)" : "rgba(248, 250, 252, 0.85)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: `1px solid ${t.sBdr}`,
        padding: "12px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: 60,
      }}
    >
      {/* Left: Mobile Brand & Date Pill */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div className="mob-only" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span className="jakarta" style={{ fontWeight: 900, fontSize: 13, color: "#fff" }}>
              S
            </span>
          </div>
          <span className="jakarta" style={{ fontWeight: 800, fontSize: 14, color: t.text }}>
            SkyRoster
          </span>
        </div>

        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: 20,
            background: t.is ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
            border: `1px solid ${t.cardBdr}`,
            fontSize: 11,
            fontWeight: 600,
            color: t.sub,
          }}
        >
          <span className="mono" style={{ color: t.text, fontWeight: 700 }}>
            {today}
          </span>
        </div>
      </div>

      {/* Center: Command Palette Search Pill (Desktop) */}
      <button
        onClick={onOpenCommandPalette}
        className="desk-only btn-press"
        aria-label="Open command menu"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "7px 14px",
          width: 320,
          borderRadius: 10,
          border: `1px solid ${t.cardBdr}`,
          background: t.is ? "rgba(255,255,255,0.04)" : "#FFFFFF",
          color: t.sub,
          fontSize: 12,
          cursor: "pointer",
          boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
        }}
      >
        <Search size={14} color={t.accent} />
        <span style={{ flex: 1, textAlign: "left" }}>Quick search or command...</span>
        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
          <span
            style={{
              fontSize: 10,
              padding: "1px 5px",
              borderRadius: 4,
              background: t.is ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 700,
            }}
          >
            ⌘K
          </span>
        </div>
      </button>

      {/* Right: Sync Status + Mobile Search + Quick Export */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Mobile Search Button */}
        <button
          onClick={onOpenCommandPalette}
          className="mob-only btn-press"
          aria-label="Open command menu"
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            border: `1px solid ${t.cardBdr}`,
            background: t.card,
            color: t.text,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Search size={16} />
        </button>

        {/* Live Cloud Sync Pill */}
        <div
          title={`Sync status: ${syncLabel}`}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: 20,
            background: t.is ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
            border: `1px solid ${t.cardBdr}`,
            fontSize: 11,
            fontWeight: 600,
            color: t.sub,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: syncDotColor,
              boxShadow: syncStatus === "saved" ? "0 0 8px rgba(16,185,129,0.5)" : "none",
            }}
          />
          <span className="desk-only">{syncLabel}</span>
        </div>

        {/* Fast Export ICS */}
        {canExport && (
          <button
            onClick={downloadICS}
            className="btn-press"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 9,
              background: t.accent,
              color: "#fff",
              border: "none",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: `0 4px 12px ${t.is ? "rgba(59,130,246,0.3)" : "rgba(37,99,235,0.25)"}`,
            }}
          >
            <Download size={13} />
            <span className="desk-only">Export ICS</span>
          </button>
        )}
      </div>
    </header>
  );
}
