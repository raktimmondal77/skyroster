import { useEffect } from "react";
import { Sparkles, MousePointerClick, Users, X } from "lucide-react";

export default function WelcomeModal({ t, onClose }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-modal-title"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: t.is ? "rgba(0,0,0,0.8)" : "rgba(10,22,40,0.5)",
        backdropFilter: "blur(6px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        className="anim-scale"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: t.card,
          border: `1px solid ${t.cardBdr}`,
          borderRadius: 24,
          padding: "28px 24px 20px",
          width: "100%",
          maxWidth: 420,
          maxHeight: "calc(100dvh - 32px)",
          overflowY: "auto",
          position: "relative",
          boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
        }}
      >
        <button
          onClick={onClose}
          aria-label="Close welcome guide"
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            background: "transparent",
            border: "none",
            color: t.sub,
            cursor: "pointer",
            width: 32,
            height: 32,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          className="row-hover"
        >
          <X size={18} />
        </button>

        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            style={{
              width: 52,
              height: 52,
              background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px",
              color: "#fff",
              boxShadow: "0 8px 20px rgba(37,99,235,0.3)",
            }}
          >
            <Sparkles size={26} />
          </div>
          <h2 id="welcome-modal-title" className="sora" style={{ margin: 0, fontSize: 22, fontWeight: 800, color: t.text, letterSpacing: "-0.4px" }}>
            Welcome to SkyRoster!
          </h2>
          <p style={{ margin: "6px 0 0", fontSize: 13, color: t.sub, lineHeight: 1.5 }}>
            Plan, visualize, and sync your shifts effortlessly. Here is how to get the most out of your schedule:
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ padding: 8, background: "rgba(37,99,235,0.1)", color: "#2563EB", borderRadius: 10, flexShrink: 0 }}>
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>Smart Pattern Auto-Fill</div>
              <div style={{ fontSize: 12, color: t.sub, marginTop: 2, lineHeight: 1.4 }}>
                Enter a few shifts (e.g. 4 on, 4 off) and click <strong>Auto-Fill</strong> in Master Roster to project your entire schedule forward instantly.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ padding: 8, background: "rgba(124,58,237,0.1)", color: "#7C3AED", borderRadius: 10, flexShrink: 0 }}>
              <MousePointerClick size={18} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>Calendar View & Quick Edits</div>
              <div style={{ fontSize: 12, color: t.sub, marginTop: 2, lineHeight: 1.4 }}>
                Switch to the <strong>Calendar</strong> tab to visualize your month or tap any date to customize hours, add notes, and inspect fatigue turnaround.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            <div style={{ padding: 8, background: "rgba(5,150,105,0.1)", color: "#059669", borderRadius: 10, flexShrink: 0 }}>
              <Users size={18} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>Team Sync & Collaboration</div>
              <div style={{ fontSize: 12, color: t.sub, marginTop: 2, lineHeight: 1.4 }}>
                Create or join a team with an 8-character code to view your coworkers' shifts alongside your own in real time.
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 12,
            background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
            color: "#fff",
            border: "none",
            fontSize: 14,
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
          }}
        >
          Let's Go!
        </button>
      </div>
    </div>
  );
}
