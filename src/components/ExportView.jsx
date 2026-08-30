import { useState } from "react";
import { Download, Calendar, Award, Clock, BookOpen } from "lucide-react";
import { calcHrs } from "../utils/rosterHelpers";

export default function ExportView({ t, roster, shifts, downloadICS }) {
  const [done, setDone] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [activeApp, setActiveApp] = useState(0);

  const workRows = roster.filter((r) => r.shift && r.shift !== "F" && r.startTime);
  const nightRows = roster.filter((r) => r.shift === "N");
  const offRows = roster.filter((r) => r.shift === "F");
  const totalH = workRows.reduce((a, r) => a + calcHrs(r.startTime, r.endTime), 0);
  const dates = [...new Set(workRows.map((r) => r.date))];
  const canExport = workRows.length > 0;

  const handleExport = () => {
    if (!canExport) return;
    setAnimating(true);
    setTimeout(() => {
      downloadICS();
      setDone(true);
      setAnimating(false);
      setTimeout(() => setDone(false), 4000);
    }, 600);
  };

  const breakdown = shifts
    .filter((sh) => !sh.isOff)
    .map((sh) => ({
      ...sh,
      count: roster.filter((r) => r.shift === sh.code && r.startTime).length,
    }))
    .filter((s) => s.count > 0);

  const maxCount = Math.max(...breakdown.map((s) => s.count), 1);

  const APPS = [
    {
      name: "Google Calendar",
      icon: "🗓",
      color: "#4285F4",
      steps: [
        "Open Google Calendar in a browser (desktop recommended)",
        "Go to Settings menu (⚙ icon) → Import & export",
        "Select the downloaded .ics file from your computer",
        "Choose which calendar to add the shifts to and click Import",
      ],
    },
    {
      name: "Apple Calendar",
      icon: "🍎",
      color: "#FF3B30",
      steps: [
        "Double-click the downloaded .ics file on macOS",
        "Or open Calendar app → click File menu → select Import",
        "Select the downloaded .ics file and hit Import",
        "Your shift events will display immediately across devices",
      ],
    },
    {
      name: "Outlook Calendar",
      icon: "📧",
      color: "#0078D4",
      steps: [
        "Open Outlook Calendar (on web or desktop app)",
        "Click Add Calendar (left panel) → Upload from file",
        "Select the downloaded .ics file and click import",
        "Your shifts will sync with Outlook email alerts",
      ],
    },
  ];

  return (
    <div className="anim-fade-up" style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 820 }}>
      <div>
        <div className="sora" style={{ fontSize: 28, fontWeight: 900, color: t.text, letterSpacing: "-0.6px" }}>
          Export Calendar
        </div>
        <div style={{ fontSize: 13, color: t.sub, marginTop: 5 }}>
          Generate a universal .ics file and import into any calendar app
        </div>
      </div>

      <div
        style={{
          background: t.card,
          border: `1px solid ${t.cardBdr}`,
          borderRadius: 22,
          overflow: "hidden",
          boxShadow: "0 4px 24px rgba(0,0,0,.06)",
        }}
      >
        <div
          style={{
            background: canExport
              ? "linear-gradient(135deg,#1D4ED8 0%,#7C3AED 100%)"
              : t.is
              ? "#19243A"
              : "#F1F5F9",
            padding: "28px 32px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {canExport && (
            <div
              style={{
                position: "absolute",
                top: "-40%",
                right: "-5%",
                width: 280,
                height: 280,
                background: "rgba(255,255,255,.07)",
                borderRadius: "50%",
                filter: "blur(30px)",
              }}
            />
          )}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 20,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: 1.5,
                  color: canExport ? "rgba(255,255,255,.7)" : t.sub,
                  fontWeight: 700,
                  marginBottom: 8,
                }}
              >
                Export Summary
              </div>
              <div
                className="sora"
                style={{
                  fontSize: 38,
                  fontWeight: 900,
                  color: canExport ? "#fff" : t.text,
                  lineHeight: 1,
                  letterSpacing: "-0.8px",
                }}
              >
                {workRows.length}
                <span style={{ fontSize: 18, fontWeight: 600, marginLeft: 8, opacity: 0.75 }}>shifts</span>
              </div>
              <div style={{ fontSize: 13, color: canExport ? "rgba(255,255,255,.75)" : t.sub, marginTop: 6 }}>
                {totalH.toFixed(1)} hours · {nightRows.length} overnight · {dates.length} unique dates
              </div>
            </div>
            <button
              onClick={handleExport}
              disabled={!canExport || animating}
              aria-label="Download ICS file"
              className="btn-hover"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "14px 28px",
                borderRadius: 14,
                border: canExport ? "1px solid rgba(255,255,255,.3)" : "none",
                cursor: canExport && !animating ? "pointer" : "not-allowed",
                background: done ? "#059669" : canExport ? "rgba(255,255,255,.2)" : "#CBD5E1",
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "'DM Sans',sans-serif",
                transition: "all .2s",
                opacity: !canExport ? 0.45 : 1,
              }}
            >
              {animating ? (
                <>⏳ Generating…</>
              ) : done ? (
                <>✅ Downloaded!</>
              ) : (
                <>
                  <Download size={18} /> Download .ics
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats segment */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))",
            borderBottom: `1px solid ${t.tBdr}`,
          }}
        >
          {[
            { label: "Work Shifts", val: workRows.length, icon: Calendar, clr: "#2563EB" },
            { label: "Night Shifts", val: nightRows.length, icon: Award, clr: "#7C3AED" },
            { label: "Off Days", val: offRows.length, icon: Clock, clr: "#059669" },
            { label: "Total Hours", val: totalH.toFixed(1) + "h", icon: Clock, clr: "#D97706" },
          ].map((s, i, arr) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                style={{
                  padding: "20px 22px",
                  textAlign: "center",
                  borderRight: i < arr.length - 1 ? `1px solid ${t.tBdr}` : "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "center", color: s.clr, marginBottom: 6 }}>
                  <Icon size={20} />
                </div>
                <div className="sora" style={{ fontSize: 22, fontWeight: 900, color: s.clr, lineHeight: 1 }}>
                  {s.val}
                </div>
                <div style={{ fontSize: 11, color: t.sub, marginTop: 4, fontWeight: 600 }}>{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Breakdown progress bars */}
        {breakdown.length > 0 && (
          <div style={{ padding: "22px 28px", borderBottom: `1px solid ${t.tBdr}` }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: t.sub,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                marginBottom: 16,
              }}
            >
              Shift Breakdown
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {breakdown.map((sh) => (
                <div key={sh.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 36, textAlign: "right", fontSize: 11, fontWeight: 800, color: sh.color, flexShrink: 0 }}>
                    {sh.code}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      height: 10,
                      borderRadius: 99,
                      background: t.is ? "rgba(255,255,255,.08)" : "#F0F4FC",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 99,
                        background: `linear-gradient(90deg,${sh.color},${sh.color}99)`,
                        width: `${(sh.count / maxCount) * 100}%`,
                        transition: "width .6s cubic-bezier(.22,.68,0,1.2)",
                      }}
                    />
                  </div>
                  <div style={{ width: 32, fontSize: 11, fontWeight: 700, color: t.sub, flexShrink: 0 }}>
                    {sh.count}×
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {!canExport && (
          <div style={{ padding: "24px 28px", textAlign: "center" }}>
            <div style={{ fontSize: 11, color: t.sub, fontWeight: 600 }}>
              💡 Generate your roster and assign shift types to enable export
            </div>
          </div>
        )}
      </div>

      {/* Guide Apps Box */}
      <div
        style={{
          background: t.card,
          border: `1px solid ${t.cardBdr}`,
          borderRadius: 22,
          padding: "24px 28px",
          boxShadow: "0 2px 14px rgba(0,0,0,.04)",
        }}
      >
        <div style={{ fontWeight: 700, color: t.text, fontSize: 16, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          <BookOpen size={18} />
          <span>Import Guide</span>
        </div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {APPS.map((app, i) => (
            <button
              key={i}
              onClick={() => setActiveApp(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 20,
                border: `1.5px solid ${activeApp === i ? app.color : t.cardBdr}`,
                background: activeApp === i ? `${app.color}15` : "transparent",
                cursor: "pointer",
                fontFamily: "'DM Sans',sans-serif",
                fontSize: 12,
                fontWeight: 700,
                color: activeApp === i ? app.color : t.sub,
                transition: "all .15s",
              }}
            >
              <span style={{ fontSize: 16 }}>{app.icon}</span>
              {app.name}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {APPS[activeApp].steps.map((step, i) => (
            <div
              key={i}
              className="anim-slide-r"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 16px",
                borderRadius: 12,
                background: t.cardHov,
                border: `1px solid ${t.cardBdr}`,
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  flexShrink: 0,
                  background: `${APPS[activeApp].color}18`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 800,
                  color: APPS[activeApp].color,
                }}
              >
                {i + 1}
              </div>
              <div style={{ fontSize: 13, color: t.text, fontWeight: 500 }}>{step}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
