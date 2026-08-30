import { useMemo } from "react";
import { Clock, Calendar, CheckSquare, Award, AlertTriangle, DollarSign, TrendingUp } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import { calcHrs, calcEarnings, checkConflicts, dayShort, fmtDayFull, isON, todayStr } from "../utils/rosterHelpers";

export default function DashboardView({ t, roster, shifts, setView }) {
  const today = todayStr();
  
  const { work, night, off, totalH, upcoming, weekStrip } = useMemo(() => {
    const work = roster.filter((r) => r.shift && r.shift !== "F" && r.startTime);
    const night = roster.filter((r) => r.shift === "N");
    const off = roster.filter((r) => r.shift === "F" || !r.shift);
    const totalH = work.reduce((a, r) => a + calcHrs(r.startTime, r.endTime), 0);
    const upcoming = roster
      .filter((r) => r.date >= today && r.shift && r.shift !== "F")
      .slice(0, 5);

    // next 7 days strip
    const base = new Date(today + "T00:00:00");
    const weekStrip = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      const ds = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      // format to YYYY-MM-DD local style
      const y = ds.getFullYear();
      const m = String(ds.getMonth() + 1).padStart(2, "0");
      const day = String(ds.getDate()).padStart(2, "0");
      const dsStr = `${y}-${m}-${day}`;
      return { ds: dsStr, row: roster.find((r) => r.date === dsStr) };
    });

    return { work, night, off, totalH, upcoming, weekStrip };
  }, [roster, today]);

  const next = upcoming[0];
  const nextSh = next ? shifts.find((s) => s.code === next.shift) : null;
  const hr = new Date().getHours();
  const greet = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";

  // Dynamic earnings calculation
  const estimatedEarnings = useMemo(() => calcEarnings(roster, shifts), [roster, shifts]);

  // Conflict / Fatigue Warnings
  const warnings = useMemo(() => checkConflicts(roster, shifts), [roster, shifts]);

  const breakdown = useMemo(() => {
    const b = shifts
      .filter((s) => !s.isOff)
      .map((s) => ({
        ...s,
        count: roster.filter((r) => r.shift === s.code && r.startTime).length,
      }))
      .filter((s) => s.count > 0);
    const max = Math.max(...b.map((s) => s.count), 1);
    return { b, max };
  }, [shifts, roster]);

  const chartData = useMemo(() => {
    if (roster.length === 0) return [];
    const chunks = [];
    for (let i = 0; i < roster.length; i += 7) {
      const slice = roster.slice(i, i + 7);
      const hours = slice.reduce((sum, r) => sum + (r.shift && r.shift !== "F" ? calcHrs(r.startTime, r.endTime) : 0), 0);
      const weekLabel = slice[0]?.date ? `${slice[0].date.slice(5)}` : `W${Math.floor(i / 7) + 1}`;
      chunks.push({ name: weekLabel, hours: Number(hours.toFixed(1)) });
    }
    return chunks.slice(0, 8);
  }, [roster]);

  const stats = [
    { label: "Scheduled Shifts", val: work.length, icon: CheckSquare, clr: "#2563EB", bg: t.is ? "rgba(37,99,235,.15)" : "#EFF6FF" },
    { label: "Night Operations", val: night.length, icon: Award, clr: "#7C3AED", bg: t.is ? "rgba(124,58,237,.15)" : "#F5F3FF" },
    { label: "Rest / Off Days", val: off.length, icon: Calendar, clr: "#059669", bg: t.is ? "rgba(5,150,105,.15)" : "#ECFDF5" },
    { label: "Estimated Earnings", val: `₹${estimatedEarnings.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, icon: DollarSign, clr: "#10B981", bg: t.is ? "rgba(16,185,129,.15)" : "#ECFDF5" },
  ];

  const card = {
    background: t.card,
    border: `1px solid ${t.cardBdr}`,
    borderRadius: 22,
    boxShadow: "0 2px 14px rgba(0,0,0,.04)",
  };

  return (
    <div className="anim-fade-up" style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
      {/* Greeting */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="sora" style={{ fontSize: 30, fontWeight: 900, color: t.text, letterSpacing: "-0.8px" }}>
            {greet}, <span className="gradient-text">Planner.</span>
          </div>
          <div style={{ fontSize: 14, color: t.sub, marginTop: 6 }}>
            {roster.length > 0
              ? `Your schedule overview containing ${totalH.toFixed(1)} planned hours.`
              : "Generate a roster from the Master Roster view to begin."}
          </div>
        </div>
        <button
          onClick={() => setView("roster")}
          style={{
            background: "transparent",
            color: t.sub,
            border: `1.5px solid ${t.cardBdr}`,
            padding: "10px 22px",
            borderRadius: 11,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'DM Sans',sans-serif",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
          className="btn-hover"
        >
          Open Roster →
        </button>
      </div>

      {/* HEALTH & FATIGUE WARNINGS BANNER */}
      {warnings.length > 0 && (
        <div
          style={{
            background: t.is ? "rgba(239, 68, 68, 0.08)" : "#FEF2F2",
            border: `1.5px solid ${t.is ? "rgba(239, 68, 68, 0.2)" : "#FCA5A5"}`,
            borderRadius: 18,
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#EF4444", fontWeight: 700, fontSize: 14 }}>
            <AlertTriangle size={18} />
            <span>Schedule Health Alerts ({warnings.length})</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {warnings.slice(0, 3).map((w, idx) => (
              <div
                key={idx}
                style={{
                  fontSize: 12.5,
                  color: t.text,
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 6,
                  lineHeight: 1.4,
                }}
              >
                <span style={{ color: "#EF4444", fontWeight: 700 }}>• {w.date}:</span>
                <span>{w.msg}</span>
              </div>
            ))}
            {warnings.length > 3 && (
              <span style={{ fontSize: 11, color: t.sub, fontWeight: 600, marginLeft: 10 }}>
                + {warnings.length - 3} more schedule alert(s) in roster table.
              </span>
            )}
          </div>
        </div>
      )}

      {/* BENTO GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 18 }}>
        
        {/* Next Shift Box */}
        {next ? (
          <div
            className="card-lift"
            style={{
              gridColumn: "span 8",
              borderRadius: 24,
              padding: "30px 34px",
              position: "relative",
              overflow: "hidden",
              background: `linear-gradient(135deg, ${nextSh?.color || "#2563EB"} 0%, #0A1024 100%)`,
              boxShadow: `0 16px 40px -12px ${nextSh?.color || "#2563EB"}66`,
              minWidth: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-30%",
                right: "-8%",
                width: 340,
                height: 340,
                background: "rgba(255,255,255,.07)",
                borderRadius: "50%",
                filter: "blur(40px)",
              }}
            />
            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 24,
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#4ADE80",
                      boxShadow: "0 0 12px #4ADE80",
                      animation: "pulse 2s infinite",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: 2,
                      color: "rgba(255,255,255,.75)",
                      fontWeight: 700,
                    }}
                  >
                    Next Scheduled Shift
                  </span>
                </div>
                <div
                  className="sora"
                  style={{
                    fontSize: 34,
                    fontWeight: 900,
                    color: "#fff",
                    letterSpacing: "-0.8px",
                    marginBottom: 8,
                  }}
                >
                  {nextSh?.title || "Upcoming"}
                </div>
                <div style={{ fontSize: 15, color: "rgba(255,255,255,.85)", fontWeight: 500 }}>
                  {fmtDayFull(next.date)}
                  {next.startTime && (
                    <>
                      {" "}
                      &nbsp;·&nbsp;{" "}
                      <strong style={{ color: "#fff" }}>
                        {next.startTime} – {next.endTime}
                      </strong>{" "}
                      {isON(next.startTime, next.endTime) && "🌙"}
                    </>
                  )}
                </div>
              </div>
              <div
                className="glass"
                style={{
                  background: "rgba(255,255,255,.12)",
                  padding: "18px 30px",
                  borderRadius: 20,
                  textAlign: "center",
                  border: "1px solid rgba(255,255,255,.2)",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: 1.5,
                    color: "rgba(255,255,255,.65)",
                    marginBottom: 4,
                    fontWeight: 600,
                  }}
                >
                  Code
                </div>
                <div className="sora" style={{ fontSize: 44, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
                  {next.shift}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              ...card,
              gridColumn: "span 8",
              padding: "40px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 42, marginBottom: 12 }}>📅</div>
            <div style={{ fontWeight: 800, color: t.text, fontSize: 16 }} className="sora">
              No upcoming shifts
            </div>
            <div style={{ color: t.sub, fontSize: 13, marginTop: 4 }}>
              Generate your roster to populate the dashboard.
            </div>
            <button
              onClick={() => setView("roster")}
              style={{
                marginTop: 16,
                background: "#2563EB",
                color: "#fff",
                border: "none",
                padding: "8px 18px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Generate Roster
            </button>
          </div>
        )}

        {/* 2x2 Stat Cluster */}
        <div style={{ gridColumn: "span 4", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="card-lift" style={{ ...card, padding: "18px", position: "relative", overflow: "hidden" }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    background: s.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: s.clr,
                    marginBottom: 12,
                  }}
                >
                  <Icon size={18} />
                </div>
                <div
                  className="sora"
                  style={{ fontSize: 22, fontWeight: 900, color: t.text, lineHeight: 1, letterSpacing: "-0.5px" }}
                >
                  {s.val}
                </div>
                <div
                  style={{
                    fontSize: 10.5,
                    color: t.sub,
                    marginTop: 6,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Week Strip */}
        <div style={{ ...card, gridColumn: "span 12", padding: "20px 24px" }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: t.sub,
              textTransform: "uppercase",
              letterSpacing: 0.8,
              marginBottom: 14,
            }}
          >
            Next 7 Days
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 10 }}>
            {weekStrip.map(({ ds, row }, i) => {
              const sh = row?.shift ? shifts.find((s) => s.code === row.shift) : null;
              const isToday = ds === today;
              return (
                <div
                  key={i}
                  style={{
                    borderRadius: 14,
                    padding: "12px 10px",
                    textAlign: "center",
                    border: `1px solid ${isToday ? "#2563EB" : t.cardBdr}`,
                    background: sh ? `${sh.color}14` : t.cardHov,
                    position: "relative",
                  }}
                >
                  {isToday && (
                    <div
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 8,
                        fontSize: 8,
                        fontWeight: 800,
                        color: "#2563EB",
                        textTransform: "uppercase",
                      }}
                    >
                      Today
                    </div>
                  )}
                  <div style={{ fontSize: 10, fontWeight: 700, color: t.sub, textTransform: "uppercase" }}>
                    {dayShort(ds)}
                  </div>
                  <div className="sora" style={{ fontSize: 16, fontWeight: 800, color: t.text, margin: "2px 0 6px" }}>
                    {ds.slice(8)}
                  </div>
                  {sh ? (
                    <div
                      style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        borderRadius: 8,
                        fontSize: 10,
                        fontWeight: 800,
                        background: sh.color,
                        color: "#fff",
                      }}
                    >
                      {sh.code}
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: t.sub, opacity: 0.5 }}>—</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Hours Trend Chart */}
        {chartData.length > 0 && (
          <div style={{ ...card, gridColumn: "span 12", padding: "24px 26px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 10 }}>
              <div>
                <div className="sora" style={{ fontSize: 16, fontWeight: 800, color: t.text, display: "flex", alignItems: "center", gap: 8 }}>
                  <TrendingUp size={18} color="#2563EB" /> Weekly Hours Trend
                </div>
                <div style={{ fontSize: 12, color: t.sub, marginTop: 3 }}>
                  Weekly hours worked across your planned schedule
                </div>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#2563EB", background: t.is ? "rgba(37,99,235,0.18)" : "#EFF6FF", padding: "4px 12px", borderRadius: 8 }}>
                Average: {(totalH / Math.max(chartData.length, 1)).toFixed(1)} hrs/wk
              </span>
            </div>

            <div style={{ width: "100%", height: 190 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke={t.sub} fontSize={11} tickLine={false} />
                  <YAxis stroke={t.sub} fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: t.is ? "#0D1526" : "#FFFFFF",
                      border: `1px solid ${t.cardBdr}`,
                      borderRadius: 10,
                      color: t.text,
                      fontSize: 12,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  />
                  <Bar dataKey="hours" fill="#2563EB" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#2563EB" : "#7C3AED"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Timeline */}
        <div style={{ ...card, gridColumn: "span 7", padding: "24px 26px", minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div className="sora" style={{ fontSize: 16, fontWeight: 800, color: t.text }}>
              Upcoming Timeline
            </div>
            <button
              onClick={() => setView("calendar")}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#2563EB", fontSize: 12, fontWeight: 700 }}
            >
              View calendar →
            </button>
          </div>
          {upcoming.length === 0 ? (
            <div style={{ color: t.sub, fontSize: 13, padding: "20px 0", textAlign: "center" }}>
              No upcoming shifts scheduled.
            </div>
          ) : (
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  top: 20,
                  bottom: 20,
                  left: 22,
                  width: 2,
                  background: `linear-gradient(to bottom,#2563EB,${t.cardBdr})`,
                }}
              />
              {upcoming.map((r, i) => {
                const sh = shifts.find((s) => s.code === r.shift);
                const ov = isON(r.startTime, r.endTime);
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 16,
                      position: "relative",
                      zIndex: 1,
                      paddingBottom: i !== upcoming.length - 1 ? 18 : 0,
                    }}
                  >
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: "50%",
                        background: t.card,
                        border: `2.5px solid ${sh?.color || "#2563EB"}`,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: `0 0 0 5px ${t.card}`,
                      }}
                    >
                      <div style={{ fontSize: 9, fontWeight: 700, color: t.sub, textTransform: "uppercase" }}>
                        {dayShort(r.date)}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: t.text, lineHeight: 1 }}>{r.date.slice(8)}</div>
                    </div>
                    <div
                      style={{
                        flex: 1,
                        background: t.cardHov,
                        padding: "12px 16px",
                        borderRadius: 14,
                        border: `1px solid ${t.cardBdr}`,
                        minWidth: 0,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: 13,
                            color: t.text,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {r.eventTitle || sh?.title || r.shift}
                        </div>
                        <div
                          style={{
                            background: `${sh?.color || "#2563EB"}22`,
                            color: sh?.color || "#2563EB",
                            padding: "4px 10px",
                            borderRadius: 8,
                            fontSize: 11,
                            fontWeight: 800,
                            flexShrink: 0,
                          }}
                        >
                          {r.shift}
                        </div>
                      </div>
                      {r.startTime && (
                        <div style={{ fontSize: 11, color: t.sub, marginTop: 5, fontWeight: 500 }}>
                          <Clock size={11} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                          {r.startTime} → {r.endTime} {ov ? "🌙" : ""}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Distribution & Shift list */}
        <div style={{ ...card, gridColumn: "span 5", padding: "24px 26px", minWidth: 0 }}>
          <div className="sora" style={{ fontSize: 16, fontWeight: 800, color: t.text, marginBottom: 18 }}>
            Shift Distribution
          </div>
          {breakdown.b.length === 0 ? (
            <div style={{ color: t.sub, fontSize: 13, marginBottom: 14 }}>Assign shifts to see distribution.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              {breakdown.b.map((sh) => (
                <div key={sh.id} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 30, fontSize: 11, fontWeight: 800, color: sh.color, flexShrink: 0 }}>
                    {sh.code}
                  </div>
                  <div
                    style={{
                      flex: 1,
                      height: 9,
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
                        width: `${(sh.count / breakdown.max) * 100}%`,
                        transition: "width .6s cubic-bezier(.22,.68,0,1.2)",
                      }}
                    />
                  </div>
                  <div style={{ width: 26, fontSize: 11, fontWeight: 700, color: t.sub, flexShrink: 0 }}>
                    {sh.count}×
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {shifts.map((sh) => (
              <div
                key={sh.id}
                className="shift-pill"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 12px 6px 6px",
                  borderRadius: 99,
                  border: `1px solid ${t.cardBdr}`,
                  background: t.cardHov,
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    background: sh.color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Sora',sans-serif",
                    fontWeight: 900,
                    fontSize: 11,
                    color: "#fff",
                  }}
                >
                  {sh.code}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: t.text }}>
                  {sh.isOff ? "Off" : sh.title.split(" ")[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      <style>{`@media(max-width:900px){
        .anim-fade-up > div > [style*="span 8"],
        .anim-fade-up > div > [style*="span 7"],
        .anim-fade-up > div > [style*="span 5"],
        .anim-fade-up > div > [style*="span 4"]{grid-column:span 12!important}
      }`}</style>
    </div>
  );
}
