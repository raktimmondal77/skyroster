import { useMemo, useState, useEffect } from "react";
import {
  Calendar,
  CheckSquare,
  Award,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Users,
  ArrowRight,
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";
import {
  calcHrs,
  calcEarnings,
  checkConflicts,
  dayShort,
  fmtDate,
  fmtDayFull,
  isON,
  todayStr,
  isWorkShift,
  isRestDay,
  isNightShift,
} from "../utils/rosterHelpers";
import { sanitizeMemberName } from "../utils/teamSync";

export default function DashboardView({ t, roster, shifts, teamData, userName, setView }) {
  const today = todayStr();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  const { work, night, off, totalH, upcoming, weekStrip } = useMemo(() => {
    const work = roster.filter((r) => isWorkShift(r.shift, shifts) && r.startTime);
    const night = roster.filter((r) => isNightShift(r.shift, shifts, r.startTime, r.endTime));
    const off = roster.filter((r) => isRestDay(r.shift, shifts));
    const totalH = work.reduce((a, r) => {
      const sh = shifts.find((s) => s.code === r.shift);
      return a + calcHrs(r.startTime, r.endTime, Boolean(sh?.is24Hour));
    }, 0);

    const upcoming = roster
      .filter((r) => {
        if (!isWorkShift(r.shift, shifts)) return false;
        if (r.date > today) return true;
        if (r.date < today) return false;
        if (!r.endTime) return true;
        const sh = shifts.find((s) => s.code === r.shift);
        const endDt = new Date(`${r.date}T${r.endTime}:00`);
        if (r.startTime && isON(r.startTime, r.endTime, Boolean(sh?.is24Hour))) {
          endDt.setDate(endDt.getDate() + 1);
        }
        return endDt > now;
      })
      .slice(0, 5);

    const base = new Date(today + "T00:00:00");
    const weekStrip = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(d.getDate() + i);
      const dsStr = fmtDate(d);
      return { ds: dsStr, row: roster.find((r) => r.date === dsStr) };
    });

    return { work, night, off, totalH, upcoming, weekStrip };
  }, [roster, shifts, today, now]);

  const next = upcoming[0];
  const nextSh = next ? shifts.find((s) => s.code === next.shift) : null;

  // Live countdown / status calculation
  const shiftStatusInfo = useMemo(() => {
    if (!next || !next.startTime || !next.endTime) return null;
    const startDt = new Date(`${next.date}T${next.startTime}:00`);
    const endDt = new Date(`${next.date}T${next.endTime}:00`);
    if (isON(next.startTime, next.endTime, Boolean(nextSh?.is24Hour))) {
      endDt.setDate(endDt.getDate() + 1);
    }

    const diffStartMs = startDt.getTime() - now.getTime();
    const diffEndMs = endDt.getTime() - now.getTime();

    if (diffStartMs <= 0 && diffEndMs > 0) {
      const hrs = Math.floor(diffEndMs / (1000 * 60 * 60));
      const mins = Math.floor((diffEndMs % (1000 * 60 * 60)) / (1000 * 60));
      return {
        status: "active",
        badge: "ON SHIFT NOW",
        color: "#10B981",
        timeText: `Ends in ${hrs}h ${mins}m`,
      };
    } else if (diffStartMs > 0) {
      const hrs = Math.floor(diffStartMs / (1000 * 60 * 60));
      const mins = Math.floor((diffStartMs % (1000 * 60 * 60)) / (1000 * 60));
      return {
        status: "upcoming",
        badge: "UPCOMING SHIFT",
        color: "#3B82F6",
        timeText: hrs > 24 ? `Starts in ${Math.round(hrs / 24)} days` : `Starts in ${hrs}h ${mins}m`,
      };
    }
    return null;
  }, [next, nextSh, now]);

  const hr = now.getHours();
  const greet = hr < 12 ? "Good morning" : hr < 18 ? "Good afternoon" : "Good evening";

  const estimatedEarnings = useMemo(() => calcEarnings(roster, shifts), [roster, shifts]);
  const warnings = useMemo(() => checkConflicts(roster, shifts), [roster, shifts]);

  const teammatesToday = useMemo(() => {
    if (!teamData?.members) return [];
    const cleanSelf = userName ? sanitizeMemberName(userName) : "";
    const list = [];
    Object.keys(teamData.members).forEach((m) => {
      if (sanitizeMemberName(m) === cleanSelf) return;
      const mRoster = teamData.members[m];
      if (Array.isArray(mRoster)) {
        const row = mRoster.find((r) => r.date === today);
        if (row && row.shift) {
          const sh = shifts.find((s) => s.code === row.shift) || {
            code: row.shift,
            title: row.shift,
            color: "#64748B",
            isOff: false,
          };
          list.push({ member: m, shift: sh, startTime: row.startTime, endTime: row.endTime });
        }
      }
    });
    return list;
  }, [teamData, userName, shifts, today]);

  const chartData = useMemo(() => {
    if (roster.length === 0) return [];
    const weekMap = new Map();
    roster.forEach((r) => {
      if (!r.date || !isWorkShift(r.shift, shifts)) return;
      const d = new Date(r.date + "T00:00:00");
      const day = d.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(d);
      monday.setDate(d.getDate() + diffToMonday);
      const key = fmtDate(monday);
      const sh = shifts.find((s) => s.code === r.shift);
      const hrs = calcHrs(r.startTime, r.endTime, Boolean(sh?.is24Hour));
      weekMap.set(key, (weekMap.get(key) || 0) + hrs);
    });
    return Array.from(weekMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 8)
      .map(([weekStart, hours]) => ({
        name: weekStart.slice(5),
        hours: Number(hours.toFixed(1)),
      }));
  }, [roster, shifts]);

  const stats = [
    { label: "Scheduled", val: `${work.length} shifts`, icon: CheckSquare, clr: "#3B82F6", tint: "rgba(59,130,246,0.12)" },
    { label: "Night Ops", val: `${night.length} shifts`, icon: Award, clr: "#8B5CF6", tint: "rgba(139,92,246,0.12)" },
    { label: "Rest Days", val: `${off.length} days`, icon: Calendar, clr: "#10B981", tint: "rgba(16,185,129,0.12)" },
    { label: "Est. Earnings", val: `₹${Math.round(estimatedEarnings).toLocaleString("en-IN")}`, icon: DollarSign, clr: "#F59E0B", tint: "rgba(245,158,11,0.12)" },
  ];

  const card = {
    background: t.card,
    border: `1px solid ${t.cardBdr}`,
    borderRadius: 18,
    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
  };

  return (
    <div className="anim-fade-up" style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
      <style>{`
        .bento-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 16px; }
        .bento-hero { grid-column: span 8; }
        .bento-stats { grid-column: span 4; }
        .bento-full { grid-column: span 12; }
        .bento-half { grid-column: span 6; }
        .bento-timeline { grid-column: span 7; }
        .bento-dist { grid-column: span 5; }
        .week-strip-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; overflow-x: auto; }
        @media(max-width: 960px) {
          .bento-hero, .bento-stats, .bento-timeline, .bento-dist, .bento-half { grid-column: span 12; }
        }
      `}</style>

      {/* Greeting & Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="jakarta" style={{ fontSize: 26, fontWeight: 900, color: t.text, letterSpacing: "-0.6px" }}>
            {greet}, <span style={{ color: t.accent }}>Planner.</span>
          </div>
          <div style={{ fontSize: 13, color: t.sub, marginTop: 4 }}>
            {roster.length > 0
              ? `You have ${totalH.toFixed(1)} planned hours scheduled across this period.`
              : "Generate a schedule in Master Roster to populate your dashboard."}
          </div>
        </div>
        <button
          onClick={() => setView("roster")}
          className="btn-press"
          style={{
            background: t.card,
            color: t.text,
            border: `1px solid ${t.cardBdr}`,
            padding: "8px 18px",
            borderRadius: 10,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'Inter', sans-serif",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span>Open Master Roster</span>
          <ArrowRight size={14} color={t.accent} />
        </button>
      </div>

      {/* Warnings & Turnaround Conflicts */}
      {warnings.length > 0 && (
        <div
          style={{
            background: t.is ? "rgba(239, 68, 68, 0.08)" : "#FEF2F2",
            border: `1px solid ${t.is ? "rgba(239, 68, 68, 0.25)" : "#FCA5A5"}`,
            borderRadius: 14,
            padding: "14px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#EF4444", fontWeight: 700, fontSize: 13 }}>
            <AlertTriangle size={16} />
            <span>Turnaround & Fatigue Alerts ({warnings.length})</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {warnings.slice(0, 3).map((w, idx) => (
              <div key={idx} style={{ fontSize: 12, color: t.text, display: "flex", alignItems: "flex-start", gap: 6 }}>
                <span className="mono" style={{ color: "#EF4444", fontWeight: 700 }}>• {w.date}:</span>
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

      {/* Bento Grid */}
      <div className="bento-grid">
        {/* Next Shift Hero */}
        {next ? (
          <div
            className="bento-hero"
            style={{
              ...card,
              padding: "24px 26px",
              position: "relative",
              overflow: "hidden",
              background: t.is
                ? `linear-gradient(135deg, rgba(37,99,235,0.18) 0%, #0E1626 100%)`
                : `linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 100%)`,
              border: `1.5px solid ${nextSh ? `${nextSh.color}45` : t.cardBdr}`,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
              <div>
                {shiftStatusInfo && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: shiftStatusInfo.color,
                        boxShadow: `0 0 10px ${shiftStatusInfo.color}`,
                        animation: "pulse 2s infinite",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: shiftStatusInfo.color,
                        letterSpacing: 1.2,
                        textTransform: "uppercase",
                      }}
                    >
                      {shiftStatusInfo.badge}
                    </span>
                    <span style={{ color: t.sub, fontSize: 11 }}>·</span>
                    <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: t.text }}>
                      {shiftStatusInfo.timeText}
                    </span>
                  </div>
                )}

                <div className="jakarta" style={{ fontSize: "clamp(20px, 3.5vw, 26px)", fontWeight: 800, color: t.text, letterSpacing: "-0.5px" }}>
                  {next.eventTitle || nextSh?.title || "Scheduled Shift"}
                </div>

                <div style={{ fontSize: 13, color: t.sub, marginTop: 4, display: "flex", alignItems: "center", gap: 8 }}>
                  <span>{fmtDayFull(next.date)}</span>
                  {next.startTime && (
                    <>
                      <span>·</span>
                      <span className="mono" style={{ fontWeight: 700, color: t.text }}>
                        {next.startTime} → {next.endTime}
                      </span>
                      {isON(next.startTime, next.endTime, Boolean(nextSh?.is24Hour)) && <span>🌙</span>}
                    </>
                  )}
                </div>
              </div>

              {/* Code Capsule */}
              <div
                style={{
                  padding: "10px 18px",
                  borderRadius: 14,
                  border: `1px solid ${nextSh?.color || "#2563EB"}40`,
                  background: `${nextSh?.color || "#2563EB"}18`,
                  textAlign: "center",
                  minWidth: 80,
                }}
              >
                <div style={{ fontSize: 9, textTransform: "uppercase", fontWeight: 700, color: nextSh?.color || "#2563EB", letterSpacing: 1 }}>
                  Shift Code
                </div>
                <div className="jakarta" style={{ fontSize: 26, fontWeight: 900, color: nextSh?.color || "#2563EB", lineHeight: 1.1, marginTop: 2 }}>
                  {next.shift}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="bento-hero"
            style={{
              ...card,
              padding: "36px 24px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>🗓️</div>
            <div className="jakarta" style={{ fontWeight: 800, color: t.text, fontSize: 15 }}>
              No upcoming shifts scheduled
            </div>
            <div style={{ color: t.sub, fontSize: 12, marginTop: 3 }}>
              Generate your roster to populate the next shift radar.
            </div>
          </div>
        )}

        {/* 4 Quick Stat Tiles */}
        <div className="bento-stats" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                style={{
                  ...card,
                  padding: "14px 16px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: s.tint,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: s.clr,
                    marginBottom: 10,
                  }}
                >
                  <Icon size={15} />
                </div>
                <div>
                  <div className="mono" style={{ fontSize: 16, fontWeight: 800, color: t.text, letterSpacing: "-0.3px" }}>
                    {s.val}
                  </div>
                  <div style={{ fontSize: 10.5, color: t.sub, fontWeight: 600, marginTop: 2 }}>
                    {s.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Next 7 Days Strip */}
        <div className="bento-full" style={{ ...card, padding: "18px 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: t.sub, textTransform: "uppercase", letterSpacing: 0.8 }}>
              Upcoming 7-Day Ribbon
            </span>
            <button
              onClick={() => setView("calendar")}
              style={{ background: "none", border: "none", color: t.accent, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
            >
              Full Calendar →
            </button>
          </div>

          <div className="week-strip-grid">
            {weekStrip.map(({ ds, row }, i) => {
              const sh = row?.shift ? shifts.find((s) => s.code === row.shift) : null;
              const isToday = ds === today;
              return (
                <div
                  key={i}
                  onClick={() => setView("calendar")}
                  className="btn-press"
                  style={{
                    borderRadius: 12,
                    padding: "10px 6px",
                    textAlign: "center",
                    border: `1px solid ${isToday ? t.accent : t.cardBdr}`,
                    background: isToday
                      ? (t.is ? "rgba(59,130,246,0.12)" : "#EFF6FF")
                      : sh
                      ? `${sh.color}0D`
                      : "transparent",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: isToday ? t.accent : t.sub, textTransform: "uppercase" }}>
                    {isToday ? "Today" : dayShort(ds)}
                  </span>
                  <span className="mono" style={{ fontSize: 15, fontWeight: 800, color: t.text }}>
                    {ds.slice(8)}
                  </span>
                  {sh ? (
                    <span
                      style={{
                        padding: "2px 6px",
                        borderRadius: 6,
                        fontSize: 9.5,
                        fontWeight: 800,
                        background: `${sh.color}20`,
                        border: `1px solid ${sh.color}50`,
                        color: sh.color,
                      }}
                    >
                      {sh.code}
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: t.sub, opacity: 0.4 }}>—</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Weekly Hours Trend Chart */}
        {chartData.length > 0 && (
          <div className="bento-timeline" style={{ ...card, padding: "20px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div className="jakarta" style={{ fontSize: 14, fontWeight: 800, color: t.text, display: "flex", alignItems: "center", gap: 6 }}>
                  <TrendingUp size={16} color={t.accent} /> Weekly Workload
                </div>
                <div style={{ fontSize: 11, color: t.sub, marginTop: 2 }}>
                  Planned hours distribution by week
                </div>
              </div>
              <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: t.accent, background: t.accentSoft, padding: "3px 8px", borderRadius: 6 }}>
                Avg: {(totalH / Math.max(chartData.length, 1)).toFixed(1)} hrs/wk
              </span>
            </div>

            <div style={{ width: "100%", height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 6, left: -26, bottom: 0 }}>
                  <XAxis dataKey="name" stroke={t.sub} fontSize={10} tickLine={false} />
                  <YAxis stroke={t.sub} fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: t.card,
                      border: `1px solid ${t.cardBdr}`,
                      borderRadius: 8,
                      color: t.text,
                      fontSize: 11,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  />
                  <Bar dataKey="hours" radius={[5, 5, 0, 0]}>
                    {chartData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? t.accent : "#8B5CF6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Teammates On Duty Widget */}
        <div className="bento-dist" style={{ ...card, padding: "20px 22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div className="jakarta" style={{ fontSize: 14, fontWeight: 800, color: t.text, display: "flex", alignItems: "center", gap: 6 }}>
              <Users size={16} color="#10B981" /> On Duty Today
            </div>
            <button
              onClick={() => setView("team")}
              style={{ background: "none", border: "none", color: t.sub, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
            >
              Team →
            </button>
          </div>

          {teammatesToday.length === 0 ? (
            <div style={{ color: t.sub, fontSize: 12, padding: "20px 0", textAlign: "center", lineHeight: 1.5 }}>
              {teamData?.members
                ? "No teammates scheduled on duty today."
                : "Join or create a team to see colleagues working alongside you."}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {teammatesToday.map((tm, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderRadius: 10,
                    background: t.cardHov,
                    border: `1px solid ${t.cardBdr}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        background: `${tm.shift.color}25`,
                        color: tm.shift.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 800,
                      }}
                    >
                      {tm.member.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: t.text }}>{tm.member}</div>
                      {tm.startTime && (
                        <div className="mono" style={{ fontSize: 10, color: t.sub }}>
                          {tm.startTime} → {tm.endTime}
                        </div>
                      )}
                    </div>
                  </div>

                  <span
                    style={{
                      padding: "2px 7px",
                      borderRadius: 6,
                      fontSize: 10,
                      fontWeight: 800,
                      background: `${tm.shift.color}15`,
                      border: `1px solid ${tm.shift.color}40`,
                      color: tm.shift.color,
                    }}
                  >
                    {tm.shift.code}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
