import React from "react";
import { Sparkles, MousePointerClick, Users, X } from "lucide-react";

export default function WelcomeModal({ t, onClose }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: t.is ? "rgba(0,0,0,0.8)" : "rgba(10,22,40,0.5)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        className="anim-scale-up"
        style={{
          background: t.card,
          border: `1px solid ${t.cardBdr}`,
          borderRadius: 24,
          padding: "32px 24px 24px",
          width: "100%",
          maxWidth: 420,
          position: "relative",
          boxShadow: "0 24px 60px rgba(0,0,0,0.15)",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "transparent",
            border: "none",
            color: t.sub,
            cursor: "pointer",
            padding: 8,
            borderRadius: "50%",
          }}
          className="row-hover"
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 56,
              height: 56,
              background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
              borderRadius: 16,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              color: "#fff",
              boxShadow: "0 8px 24px rgba(37,99,235,0.3)",
            }}
          >
            <Sparkles size={28} />
          </div>
          <h2 className="sora" style={{ margin: 0, fontSize: 24, fontWeight: 800, color: t.text, letterSpacing: "-0.5px" }}>
            Welcome to SkyRoster!
          </h2>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: t.sub, lineHeight: 1.5 }}>
            You're seconds away from a smarter schedule. Here are three quick tips to get you started:
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ padding: 10, background: t.accentSoft, color: t.accent, borderRadius: 12 }}>
              <Sparkles size={20} />
            </div>
            <div>
              <h4 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: t.text }}>1. Auto-Generate Patterns</h4>
              <p style={{ margin: 0, fontSize: 13, color: t.sub, lineHeight: 1.4 }}>
                Go to the Roster tab, select your dates, and use templates like "4-on/4-off" to fill your schedule instantly.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ padding: 10, background: t.accentSoft, color: t.accent, borderRadius: 12 }}>
              <MousePointerClick size={20} />
            </div>
            <div>
              <h4 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: t.text }}>2. Click-to-Cycle</h4>
              <p style={{ margin: 0, fontSize: 13, color: t.sub, lineHeight: 1.4 }}>
                In the Roster grid, click the ↻ button on any row to instantly cycle between shift types (Morning, Night, Off, etc).
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ padding: 10, background: t.accentSoft, color: t.accent, borderRadius: 12 }}>
              <Users size={20} />
            </div>
            <div>
              <h4 style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: t.text }}>3. Team Sync</h4>
              <p style={{ margin: 0, fontSize: 13, color: t.sub, lineHeight: 1.4 }}>
                Sign in with Google, create a Team, and share the code with colleagues to view everyone's shifts overlaid on your calendar.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            padding: "14px",
            background: "linear-gradient(to right, #2563EB, #1D4ED8)",
            color: "#fff",
            border: "none",
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
            transition: "transform 0.1s, box-shadow 0.1s",
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = "scale(0.98)";
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          Let's Go!
        </button>
      </div>
    </div>
  );
}
