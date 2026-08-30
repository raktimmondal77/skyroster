import { X, Keyboard } from "lucide-react";

export default function ShortcutsModal({ t, isOpen, onClose }) {
  if (!isOpen) return null;

  const SHORTCUTS = [
    { key: "g + d", desc: "Go to Dashboard" },
    { key: "g + r", desc: "Go to Master Roster" },
    { key: "g + c", desc: "Go to Calendar" },
    { key: "g + t", desc: "Go to Team Sync" },
    { key: "g + s", desc: "Go to Shift Types" },
    { key: "g + e", desc: "Go to Export ICS" },
    { key: "g + ,", desc: "Go to Settings" },
    { key: "d", desc: "Toggle Dark / Light theme" },
    { key: "?", desc: "Open this Shortcuts helper" },
  ];

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(5px)",
        padding: 20,
      }}
    >
      <div
        className="anim-scale"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: t.card,
          border: `1px solid ${t.cardBdr}`,
          borderRadius: 20,
          padding: "26px 28px",
          maxWidth: 460,
          width: "100%",
          boxShadow: "0 24px 54px rgba(0,0,0,.35)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: t.accentSoft || "rgba(37,99,235,0.12)",
                color: "#2563EB",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Keyboard size={20} />
            </div>
            <div>
              <h3 className="sora" style={{ fontSize: 18, fontWeight: 800, color: t.text, margin: 0 }}>
                Keyboard Shortcuts
              </h3>
              <p style={{ fontSize: 12, color: t.sub, margin: "2px 0 0" }}>Navigate SkyRoster at lightning speed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close shortcuts modal"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: t.sub,
              padding: 4,
              borderRadius: 8,
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
          {SHORTCUTS.map((s, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "8px 12px",
                borderRadius: 10,
                background: t.is ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                border: `1px solid ${t.tBdr}`,
              }}
            >
              <span style={{ fontSize: 13, color: t.text, fontWeight: 500 }}>{s.desc}</span>
              <kbd
                className="mono"
                style={{
                  background: t.inputBg,
                  color: "#2563EB",
                  border: `1px solid ${t.inputBdr}`,
                  padding: "3px 8px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 700,
                  boxShadow: "0 2px 0 rgba(0,0,0,0.08)",
                }}
              >
                {s.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
