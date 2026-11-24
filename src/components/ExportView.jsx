import { useState } from "react";
import { Download, Calendar, Moon, Sun, Clock, BookOpen, FileSpreadsheet, Printer, Check } from "lucide-react";
import { calcHrs } from "../utils/rosterHelpers";
import { exportRosterToCSV } from "../utils/csvExport";
import toast from "react-hot-toast";

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

  const handleExportCSV = () => {
    if (!canExport) return;
    exportRosterToCSV(roster, shifts);
    toast.success("Spreadsheet (CSV) exported!");
  };

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
      icon: "🗓️",
      color: "#4285F4",
      steps: [
        "Open Google Calendar in your web browser (calendar.google.com)",
        "Click the Gear Settings icon (⚙) at top right → select 'Settings'",
        "In the left sidebar, click 'Import & export'",
        "Select your downloaded .ics file and click 'Import' to sync shifts across all devices",
      ],
    },
    {
      name: "Apple Calendar",
      icon: "🍎",
      color: "#EC4899",
      steps: [
        "Double-click the downloaded .ics file on macOS or iOS",
        "Or in Apple Calendar: File menu → Import...",
        "Select the SkyRoster .ics file and pick your target calendar (e.g., Work)",
        "Shifts will automatically sync to your iPhone, iPad, Apple Watch, and Mac",
      ],
    },
    {
      name: "Outlook Calendar",
      icon: "📧",
      color: "#0284C7",
      steps: [
        "Open Outlook Calendar (on web or desktop application)",
        "Click 'Add Calendar' in the left pane → choose 'Upload from file'",
        "Select the downloaded .ics file and hit 'Import'",
        "Your shift schedule will appear in your work calendar with reminders",
      ],
    },
  ];

  return (
    <div className="anim-fade-up" style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 840 }}>
      {/* Title */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Calendar size={14} color="#6366F1" />
          <span style={{ fontSize: 11, fontWeight: 700, color: t.sub, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Calendar & Data Delivery
          </span>
        </div>
        <h2 className="jakarta" style={{ fontSize: 28, fontWeight: 800, color: t.text, letterSpacing: "-0.03em" }}>
          Export Calendar
        </h2>
        <p style={{ fontSize: 14, color: t.sub, marginTop: 4 }}>
          Generate universal RFC-5545 iCalendar files and CSV timesheets for your devices.
        </p>
      </div>

      {/* Main Export Card */}
      <div
        className="glass-card"
        style={{
          background: t.card,
          border: `1px solid ${t.cardBdr}`,
          borderRadius: 22,
          overflow: "hidden",
        }}
      >
        {/* Hero banner */}
        <div
          style={{
            background: canExport
              ? "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)"
              : t.is
              ? "#0E1526"
              : "#F1F5F9",
            padding: "28px 32px",
            position: "relative",
            overflow: "hidden",
            borderBottom: `1px solid ${t.cardBdr}`,
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
                background: "radial-gradient(circle, rgba(99,102,241,0.25) 0%, transparent 70%)",
                filter: "blur(40px)",
                pointerEvents: "none",
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
                  letterSpacing: "0.08em",
                  color: canExport ? "rgba(255,255,255,0.75)" : t.sub,
                  fontWeight: 700,
                  marginBottom: 6,
                }}
              >
                Schedule Payload Ready
              </div>
              <div
                className="jakarta"
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  color: canExport ? "#F8FAFC" : t.text,
                  lineHeight: 1,
                  letterSpacing: "-0.03em",
                }}
              >
                <span className="mono">{workRows.length}</span>
                <span style={{ fontSize: 18, fontWeight: 600, marginLeft: 8, opacity: 0.8 }}>
                  {workRows.length === 1 ? "shift" : "shifts"}
                </span>
              </div>
              <div
                className="mono"
                style={{
                  fontSize: 13,
                  color: canExport ? "rgba(255,255,255,0.75)" : t.sub,
                  marginTop: 8,
                }}
              >
                {totalH.toFixed(1)} hrs · {nightRows.length} night · {dates.length} days scheduled
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button
                onClick={() => window.print()}
                className="btn-press"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "11px 18px",
                  borderRadius: 12,
                  border: canExport ? "1px solid rgba(255,255,255,0.2)" : `1px solid ${t.cardBdr}`,
                  cursor: "pointer",
                  background: canExport ? "rgba(255,255,255,0.1)" : t.card,
                  color: canExport ? "#fff" : t.text,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <Printer size={16} /> Print / PDF
              </button>

              <button
                onClick={handleExportCSV}
                disabled={!canExport}
                className="btn-press"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "11px 18px",
                  borderRadius: 12,
                  border: canExport ? "1px solid rgba(255,255,255,0.2)" : `1px solid ${t.cardBdr}`,
                  cursor: canExport ? "pointer" : "not-allowed",
                  background: canExport ? "rgba(255,255,255,0.1)" : t.is ? "#131C2E" : "#E2E8F0",
                  color: canExport ? "#fff" : t.sub,
                  fontSize: 13,
                  fontWeight: 700,
                  opacity: !canExport ? 0.6 : 1,
                }}
              >
                <FileSpreadsheet size={16} /> Export CSV
              </button>

              <button
                onClick={handleExport}
                disabled={!canExport || animating}
                className="btn-press"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "11px 22px",
                  borderRadius: 12,
                  border: "none",
                  cursor: canExport && !animating ? "pointer" : "not-allowed",
                  background: done ? "#10B981" : canExport ? "#ffffff" : t.is ? "#131C2E" : "#CBD5E1",
                  color: done ? "#fff" : canExport ? "#1E1B4B" : t.sub,
                  fontSize: 13,
                  fontWeight: 800,
                  boxShadow: canExport ? "0 4px 14px rgba(0,0,0,0.18)" : "none",
                  opacity: !canExport ? 0.6 : 1,
                  transition: "all 0.15s ease",
                }}
              >
                {animating ? (
                  <>Building .ics…</>
                ) : done ? (
                  <>
                    <Check size={16} /> Downloaded!
                  </>
                ) : (
                  <>
                    <Download size={16} /> Download .ics
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Stats summary strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            borderBottom: `1px solid ${t.cardBdr}`,
          }}
        >
          {[
            { label: "Work Shifts", val: workRows.length, icon: Calendar, clr: "#6366F1" },
            { label: "Night Shifts", val: nightRows.length, icon: Moon, clr: "#8B5CF6" },
            { label: "Rest Days", val: offRows.length, icon: Sun, clr: "#10B981" },
            { label: "Total Hours", val: totalH.toFixed(1) + "h", icon: Clock, clr: "#F59E0B" },
          ].map((s, i, arr) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                style={{
                  padding: "18px 20px",
                  textAlign: "center",
                  borderRight: i < arr.length - 1 ? `1px solid ${t.cardBdr}` : "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "center", color: s.clr, marginBottom: 6 }}>
                  <Icon size={18} />
                </div>
                <div className="mono" style={{ fontSize: 22, fontWeight: 800, color: s.clr, lineHeight: 1 }}>
                  {s.val}
                </div>
                <div style={{ fontSize: 11, color: t.sub, marginTop: 4, fontWeight: 600 }}>{s.label}</div>
              </div>
            );
          })}
        </div>

        {/* Breakdown bar tracks */}
        {breakdown.length > 0 && (
          <div style={{ padding: "22px 28px" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: t.sub,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: 16,
              }}
            >
              Shift Frequency Distribution
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {breakdown.map((sh) => (
                <div key={sh.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div className="mono" style={{ width: 44, textAlign: "right", fontSize: 12, fontWeight: 700, color: sh.color, flexShrink: 0 }}>
                    {sh.code}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      height: 8,
                      borderRadius: 99,
                      background: t.is ? "rgba(255,255,255,0.06)" : "#F1F5F9",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 99,
                        background: `linear-gradient(90deg, ${sh.color}, ${sh.color}88)`,
                        width: `${(sh.count / maxCount) * 100}%`,
                        transition: "width 0.4s ease-out",
                      }}
                    />
                  </div>
                  <div className="mono" style={{ width: 40, fontSize: 11, fontWeight: 700, color: t.sub, flexShrink: 0 }}>
                    {sh.count}×
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Import Guide Card */}
      <div
        className="glass-card"
        style={{
          background: t.card,
          border: `1px solid ${t.cardBdr}`,
          borderRadius: 22,
          padding: "24px 28px",
        }}
      >
        <div style={{ fontWeight: 700, color: t.text, fontSize: 16, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
          <BookOpen size={18} color="#6366F1" />
          <span className="jakarta">Platform Import Instructions</span>
        </div>

        {/* Tab pills */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          {APPS.map((app, i) => (
            <button
              key={i}
              onClick={() => setActiveApp(i)}
              className="btn-press"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 99,
                border: `1px solid ${activeApp === i ? app.color : t.cardBdr}`,
                background: activeApp === i ? `${app.color}15` : "transparent",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                color: activeApp === i ? app.color : t.sub,
              }}
            >
              <span>{app.icon}</span>
              <span>{app.name}</span>
            </button>
          ))}
        </div>

        {/* Steps */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {APPS[activeApp].steps.map((step, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "12px 16px",
                borderRadius: 12,
                background: t.is ? "#0E1526" : "#F8FAFC",
                border: `1px solid ${t.cardBdr}`,
              }}
            >
              <div
                className="mono"
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  flexShrink: 0,
                  background: `${APPS[activeApp].color}20`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 800,
                  color: APPS[activeApp].color,
                }}
              >
                {i + 1}
              </div>
              <div style={{ fontSize: 13, color: t.text, fontWeight: 500, lineHeight: 1.5 }}>
                {step}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
