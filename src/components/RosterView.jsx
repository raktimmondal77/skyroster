import { useState, useMemo } from "react";
import { AlertTriangle, Sparkles, Search, Layers, X } from "lucide-react";
import { calcHrs, dayFull, checkConflicts, isON, isWorkShift, isRestDay, isNightShift } from "../utils/rosterHelpers";
import EmptyState from "./EmptyState.jsx";
import toast from "react-hot-toast";

export default function RosterView({
  t,
  roster,
  shifts,
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  generateRoster,
  updateEntry,
  applyDetectedPattern,
  rangeError,
  detectPattern,
}) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const [activeWarningDate, setActiveWarningDate] = useState(null);

  const detected = useMemo(() => detectPattern(roster), [roster, detectPattern]);
  const cycle = detected?.cycle || null;

  const emptyCount = useMemo(() => {
    const firstIdx = roster.findIndex((r) => r.shift);
    return firstIdx < 0 ? 0 : roster.slice(firstIdx).filter((r) => !r.shift).length;
  }, [roster]);
  const showBanner = Boolean(cycle && emptyCount > 0 && !dismissed);

  const filtered = useMemo(
    () =>
      roster.filter((r) => {
        if (filter === "work" && !isWorkShift(r.shift, shifts)) return false;
        if (filter === "off" && !isRestDay(r.shift, shifts)) return false;
        if (filter === "night" && !isNightShift(r.shift, shifts, r.startTime, r.endTime)) return false;
        if (
          search &&
          !r.date.includes(search) &&
          !dayFull(r.date).toLowerCase().includes(search.toLowerCase())
        )
          return false;
        return true;
      }),
    [roster, shifts, filter, search]
  );

  const { totalH, workCount, nightCount, offCount } = useMemo(() => {
    const w = roster.filter((r) => isWorkShift(r.shift, shifts));
    const n = roster.filter((r) => isNightShift(r.shift, shifts, r.startTime, r.endTime));
    const o = roster.filter((r) => isRestDay(r.shift, shifts));
    return {
      totalH: w.reduce((a, r) => {
        const sh = shifts.find((s) => s.code === r.shift);
        return a + calcHrs(r.startTime, r.endTime, Boolean(sh?.is24Hour));
      }, 0),
      workCount: w.length,
      nightCount: n.length,
      offCount: o.length,
    };
  }, [roster, shifts]);

  const estimatedEarnings = useMemo(() => {
    return roster.reduce((total, r) => {
      const sh = shifts.find((s) => s.code === r.shift);
      if (!sh || sh.isOff || !r.startTime || !r.endTime) return total;
      const hrs = calcHrs(r.startTime, r.endTime, Boolean(sh.is24Hour));
      return total + hrs * (sh.hourlyRate || 0);
    }, 0);
  }, [roster, shifts]);

  const warnings = useMemo(() => checkConflicts(roster, shifts), [roster, shifts]);

  const warningMap = useMemo(() => {
    const map = new Map();
    warnings.forEach((w) => {
      if (!map.has(w.date)) map.set(w.date, []);
      map.get(w.date).push(w);
    });
    return map;
  }, [warnings]);

  const rosterIndexMap = useMemo(() => {
    const map = new Map();
    roster.forEach((r, idx) => {
      if (!map.has(r.date)) map.set(r.date, idx);
    });
    return map;
  }, [roster]);

  const FILTERS = [
    { id: "all", label: "All Days", count: roster.length },
    { id: "work", label: "Work Shifts", count: workCount },
    { id: "night", label: "Night Only", count: nightCount },
    { id: "off", label: "Off Days", count: offCount },
  ];

  const handleApplyPreset = (preset) => {
    const res = applyDetectedPattern(preset.pattern);
    if (res?.missingCodes?.length > 0) {
      toast(`Applied ${preset.name} (skipped missing shift codes: ${res.missingCodes.join(", ")})`, { icon: "⚠️" });
    } else if (res?.appliedCount === 0) {
      toast("No empty days left to fill.", { icon: "ℹ️" });
    } else {
      toast.success(`Applied ${preset.name} rotation!`);
    }
  };

  return (
    <div className="anim-fade-up" style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <style>{`
        .roster-sticky-bar { bottom: calc(70px + var(--safe-bottom, 0px)); }
        @media(min-width: 768px) {
          .roster-sticky-bar { bottom: 16px; }
        }
      `}</style>

      <div className="print-header">
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>SkyRoster Shift Schedule</h1>
        <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
          Generated on {new Date().toLocaleDateString()} · Total: {totalH.toFixed(1)} hrs · {workCount} scheduled shifts
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="sora" style={{ fontSize: 28, fontWeight: 900, color: t.text, letterSpacing: "-0.6px" }}>
            Master Roster
          </div>
          <div style={{ fontSize: 13, color: t.sub, marginTop: 5 }}>
            {workCount} shifts · {totalH.toFixed(1)} hours planned · ₹{Math.round(estimatedEarnings).toLocaleString("en-IN")} estimated
          </div>
        </div>
        {roster.length > 0 && (
          <button
            onClick={() => window.print()}
            className="no-print btn-hover"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "9px 16px",
              borderRadius: 10,
              border: `1px solid ${t.cardBdr}`,
              background: t.card,
              color: t.text,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            🖨️ Print Roster
          </button>
        )}
      </div>

      <div
        style={{
          background: t.card,
          border: `1px solid ${t.cardBdr}`,
          borderRadius: 20,
          padding: "22px 26px",
          boxShadow: "0 2px 14px rgba(0,0,0,.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2563EB" }} />
          <div style={{ fontWeight: 700, color: t.text, fontSize: 14 }}>Generate Schedule</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14, alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 160px" }}>
            <label
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: t.sub,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                display: "block",
              }}
            >
              Start Date
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={inputStyle(t)}
              />
            </label>
          </div>
          <div style={{ flex: "1 1 160px" }}>
            <label
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: t.sub,
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: 0.8,
                display: "block",
              }}
            >
              End Date
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={inputStyle(t)}
              />
            </label>
          </div>
          <button
            onClick={generateRoster}
            style={{
              height: 42,
              padding: "0 26px",
              borderRadius: 11,
              background: "#2563EB",
              color: "#fff",
              border: "none",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              opacity: !startDate || !endDate ? 0.7 : 1,
              boxShadow: "0 4px 14px rgba(37,99,235,.3)",
            }}
          >
            ⚡ Generate
          </button>
        </div>
        {rangeError && (
          <div style={{ marginTop: 12, fontSize: 12, color: "#EF4444", fontWeight: 600 }}>
            ⚠ {rangeError}
          </div>
        )}

        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${t.tBdr}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: t.sub, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <Layers size={13} color="#2563EB" />
            <span>Shift Rotation Presets:</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {[
              { name: "5-Day Workweek", pattern: ["M1", "M1", "M1", "M1", "M1", "F", "F"] },
              { name: "Rotating 3-Shift", pattern: ["M1", "M1", "E", "E", "N", "N", "F"] },
              { name: "4-on / 4-off", pattern: ["M1", "M1", "M1", "M1", "F", "F", "F", "F"] },
              { name: "Night Owl (4N/3Off)", pattern: ["N", "N", "N", "N", "F", "F", "F"] },
              { name: "2-2-3 Pitman", pattern: ["M1", "M1", "F", "F", "N", "N", "N", "F", "F", "M1", "M1", "M1", "F", "F"] },
            ].map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                disabled={roster.length === 0}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: `1px solid ${t.cardBdr}`,
                  background: t.is ? "rgba(255,255,255,0.04)" : "#F8FAFC",
                  color: roster.length > 0 ? t.text : t.sub,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: roster.length > 0 ? "pointer" : "not-allowed",
                  opacity: roster.length > 0 ? 1 : 0.5,
                  transition: "all .15s",
                }}
              >
                + {preset.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showBanner && (
        <div
          className="anim-scale"
          style={{
            borderRadius: 18,
            padding: "18px 22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 14,
            background: "linear-gradient(135deg,rgba(37,99,235,.12),rgba(124,58,237,.12))",
            border: "1.5px solid rgba(37,99,235,.3)",
            animation: "scaleIn .25s forwards, glow 2.5s infinite",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14, minWidth: 0 }}>
            <div style={{ fontSize: 26 }} aria-hidden>
              <Sparkles color="#2563EB" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, color: t.text, fontSize: 14 }} className="sora">
                Pattern detected — {cycle.length}-day cycle
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: t.sub,
                  marginTop: 4,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  flexWrap: "wrap",
                }}
              >
                Repeating
                {cycle.map((c, i) => {
                  const sh = shifts.find((s) => s.code === c);
                  return (
                    <span
                      key={i}
                      style={{
                        padding: "2px 8px",
                        borderRadius: 7,
                        fontSize: 11,
                        fontWeight: 800,
                        background: sh ? sh.color : "#94A3B8",
                        color: "#fff",
                      }}
                    >
                      {c}
                    </span>
                  );
                })}
                · fills <strong style={{ color: t.text }}>{emptyCount}</strong> empty day
                {emptyCount !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            <button
              onClick={() => applyDetectedPattern(detected)}
              style={{
                padding: "8px 18px",
                borderRadius: 10,
                background: "#2563EB",
                color: "#fff",
                border: "none",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(37,99,235,.3)",
              }}
            >
              ✨ Auto-fill
            </button>
            <button
              onClick={() => setDismissed(true)}
              style={{
                padding: "8px 18px",
                borderRadius: 10,
                background: "transparent",
                border: `1.5px solid ${t.cardBdr}`,
                color: t.sub,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {activeWarningDate && warningMap.has(activeWarningDate) && (
        <div
          style={{
            background: t.is ? "rgba(239, 68, 68, 0.1)" : "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: 14,
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#EF4444" }}>
              Alerts for {activeWarningDate}
            </div>
            {warningMap.get(activeWarningDate).map((w, idx) => (
              <div key={idx} style={{ fontSize: 12.5, color: t.text }}>
                • {w.msg}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setActiveWarningDate(null)}
            aria-label="Close warning details"
            style={{ background: "none", border: "none", color: t.sub, cursor: "pointer", padding: 4 }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {roster.length === 0 ? (
        <EmptyState
          t={t}
          icon="🗓️"
          title="No roster generated yet"
          subtitle="Select a start and end date above, then click Generate Roster to build your shift schedule."
          actionLabel="Generate Roster"
          onAction={generateRoster}
        />
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: 6, flex: 1, flexWrap: "wrap" }}>
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 20,
                    border: "none",
                    cursor: "pointer",
                    background: filter === f.id ? "#2563EB" : t.is ? "#19243A" : "#EEF2FF",
                    color: filter === f.id ? "#fff" : t.sub,
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "'DM Sans',sans-serif",
                    transition: "all .15s",
                  }}
                >
                  {f.label} <span style={{ opacity: 0.7, marginLeft: 4 }}>({f.count})</span>
                </button>
              ))}
            </div>

            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: 10, color: t.sub }} />
              <input
                type="text"
                aria-label="Search by date or day"
                placeholder="Search date or day…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: "6px 10px 6px 32px",
                  borderRadius: 8,
                  border: `1px solid ${t.inputBdr}`,
                  background: t.inputBg,
                  color: t.inputTxt,
                  fontSize: 12,
                  width: 200,
                  fontFamily: "'DM Sans',sans-serif",
                  outline: "none",
                }}
              />
            </div>
          </div>

          <div
            style={{
              background: t.card,
              border: `1px solid ${t.cardBdr}`,
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: "0 2px 18px rgba(0,0,0,.05)",
            }}
          >
            <div className="roster-table-wrap" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: t.tHead }}>
                    {[
                      { label: "Date & Day", w: 150 },
                      { label: "Shift", w: 145 },
                      { label: "Start → End", w: 215 },
                      { label: "Event Title", w: 180 },
                      { label: "Location", w: 140, cls: "hide-mob" },
                      { label: "Notes", w: 150, cls: "hide-mob" },
                      { label: "Hours", w: 65 },
                    ].map((col) => (
                      <th
                        key={col.label}
                        className={col.cls || ""}
                        style={{
                          padding: "12px 16px",
                          textAlign: "left",
                          fontSize: 10,
                          fontWeight: 700,
                          color: t.sub,
                          textTransform: "uppercase",
                          letterSpacing: 0.8,
                          borderBottom: `1px solid ${t.tBdr}`,
                          whiteSpace: "nowrap",
                          width: col.w,
                        }}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, fIdx) => {
                    const origIdx = rosterIndexMap.get(r.date) ?? fIdx;
                    const sh = shifts.find((s) => s.code === r.shift);
                    const isOff = Boolean(sh?.isOff);
                    const ov = !isOff && isON(r.startTime, r.endTime, Boolean(sh?.is24Hour));
                    const hrs = isOff ? 0 : calcHrs(r.startTime, r.endTime, Boolean(sh?.is24Hour));
                    const isWeekend = [0, 6].includes(new Date(r.date + "T00:00:00").getDay());
                    const rowWarnings = warningMap.get(r.date);

                    return (
                      <tr
                        key={`${r.date}-${fIdx}`}
                        className="roster-row row-hover"
                        style={{
                          borderBottom: `1px solid ${t.tBdr}`,
                          background: isOff
                            ? t.is
                              ? "rgba(255,255,255,.015)"
                              : "rgba(5,150,105,.02)"
                            : isWeekend
                            ? t.is
                              ? "rgba(124,58,237,.03)"
                              : "rgba(124,58,237,.02)"
                            : "transparent",
                        }}
                      >
                        <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div>
                              <div className="mono" style={{ fontWeight: 600, fontSize: 12, color: t.text }}>
                                {r.date}
                              </div>
                              <div style={{ fontSize: 11, marginTop: 2, fontWeight: 600, color: isWeekend ? "#7C3AED" : t.sub }}>
                                {dayFull(r.date)}
                              </div>
                            </div>
                            {rowWarnings && (
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveWarningDate((prev) => (prev === r.date ? null : r.date))
                                }
                                title={rowWarnings.map((w) => w.msg).join(" | ")}
                                aria-label={`View ${rowWarnings.length} schedule warning(s) for ${r.date}`}
                                style={{
                                  background: "rgba(239, 68, 68, 0.12)",
                                  border: "none",
                                  borderRadius: 6,
                                  padding: 4,
                                  color: "#EF4444",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <AlertTriangle size={14} />
                              </button>
                            )}
                          </div>
                        </td>

                        <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <button
                              type="button"
                              onClick={() => {
                                if (!shifts.length) return;
                                const currentIdx = shifts.findIndex((s) => s.code === r.shift);
                                const nextShift = shifts[(currentIdx + 1) % shifts.length];
                                updateEntry(origIdx, "shift", nextShift.code);
                              }}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                updateEntry(origIdx, "shift", "");
                              }}
                              title="Click to cycle next shift · Right-click to clear"
                              style={{
                                padding: "5px 7px",
                                borderRadius: 6,
                                border: `1px solid ${sh ? sh.color : t.inputBdr}`,
                                background: sh ? `${sh.color}18` : "transparent",
                                color: sh ? sh.color : t.sub,
                                fontSize: 10,
                                fontWeight: 800,
                                cursor: "pointer",
                                transition: "all .15s",
                              }}
                            >
                              ↻
                            </button>
                            {sh && (
                              <div
                                style={{
                                  width: 3,
                                  height: 30,
                                  borderRadius: 2,
                                  background: sh.color,
                                  flexShrink: 0,
                                }}
                              />
                            )}
                            <div>
                              <select
                                aria-label={`Shift for ${r.date}`}
                                value={r.shift}
                                onChange={(e) => updateEntry(origIdx, "shift", e.target.value)}
                                style={{
                                  padding: "5px 8px",
                                  borderRadius: 8,
                                  border: `1px solid ${t.inputBdr}`,
                                  background: t.inputBg,
                                  color: t.inputTxt,
                                  fontSize: 12,
                                  fontWeight: 700,
                                  fontFamily: "'DM Sans',sans-serif",
                                  cursor: "pointer",
                                  outline: "none",
                                  width: 72,
                                }}
                              >
                                <option value="">—</option>
                                {shifts.map((s) => (
                                  <option key={s.id} value={s.code}>
                                    {s.code}
                                  </option>
                                ))}
                              </select>
                              {sh && (
                                <div style={{ fontSize: 10, color: sh.color, marginTop: 2, fontWeight: 700, paddingLeft: 2 }}>
                                  {sh.title.split(" ")[0]}
                                </div>
                              )}
                            </div>
                            {r.shift && (
                              <button
                                type="button"
                                onClick={() => updateEntry(origIdx, "shift", "")}
                                title="Clear shift"
                                aria-label={`Clear shift for ${r.date}`}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: t.sub,
                                  cursor: "pointer",
                                  padding: 4,
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>
                        </td>

                        <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <input
                              type="time"
                              aria-label="Start time"
                              value={r.startTime}
                              onChange={(e) => updateEntry(origIdx, "startTime", e.target.value)}
                              disabled={isOff}
                              style={tinyInputStyle(t, isOff, 94)}
                            />
                            <span style={{ color: t.sub, fontSize: 10 }}>→</span>
                            <input
                              type="time"
                              aria-label="End time"
                              value={r.endTime}
                              onChange={(e) => updateEntry(origIdx, "endTime", e.target.value)}
                              disabled={isOff}
                              style={tinyInputStyle(t, isOff, 94)}
                            />
                            {ov && <span title="Overnight shift" style={{ fontSize: 13 }}>🌙</span>}
                          </div>
                        </td>

                        <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                          <input
                            type="text"
                            aria-label="Event title"
                            value={r.eventTitle}
                            onChange={(e) => updateEntry(origIdx, "eventTitle", e.target.value)}
                            placeholder="Event title"
                            style={tinyInputStyle(t, false, 130)}
                          />
                        </td>

                        <td className="hide-mob" style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                          <input
                            type="text"
                            aria-label="Location"
                            value={r.location}
                            onChange={(e) => updateEntry(origIdx, "location", e.target.value)}
                            placeholder="Location"
                            style={tinyInputStyle(t, false, 115)}
                          />
                        </td>

                        <td className="hide-mob" style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                          <input
                            type="text"
                            aria-label="Notes"
                            value={r.notes}
                            onChange={(e) => updateEntry(origIdx, "notes", e.target.value)}
                            placeholder="Notes"
                            style={tinyInputStyle(t, false, 120)}
                          />
                        </td>

                        <td style={{ padding: "10px 16px", whiteSpace: "nowrap" }}>
                          {!isOff && hrs > 0 ? (
                            <div
                              style={{
                                display: "inline-block",
                                padding: "3px 10px",
                                borderRadius: 20,
                                background: `${sh?.color || "#2563EB"}18`,
                                color: sh?.color || "#2563EB",
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              {hrs.toFixed(1)}h
                            </div>
                          ) : isOff ? (
                            <div
                              style={{
                                padding: "3px 10px",
                                borderRadius: 20,
                                background: "rgba(5,150,105,.12)",
                                color: "#059669",
                                fontSize: 11,
                                fontWeight: 700,
                                display: "inline-block",
                              }}
                            >
                              Off
                            </div>
                          ) : (
                            <div style={{ color: t.sub, fontSize: 11 }}>—</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div
              style={{
                padding: "12px 20px",
                borderTop: `1px solid ${t.tBdr}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: t.tHead,
              }}
            >
              <div style={{ fontSize: 12, color: t.sub }}>
                Showing {filtered.length} of {roster.length} entries
              </div>
              <div style={{ fontSize: 12, color: t.sub, fontWeight: 600 }}>
                Total:{" "}
                <span style={{ color: t.text, fontWeight: 700 }}>{totalH.toFixed(1)} hrs</span>
              </div>
            </div>
          </div>

          <div
            className="no-print roster-sticky-bar"
            style={{
              position: "sticky",
              zIndex: 40,
              background: t.card,
              border: `1px solid ${t.cardBdr}`,
              borderRadius: 16,
              padding: "14px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
              boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
              backdropFilter: "blur(8px)",
              marginTop: 14,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div>
                <span style={{ fontSize: 10, color: t.sub, textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>Total Hours</span>
                <div style={{ fontSize: 16, fontWeight: 800, color: t.text }} className="sora">{totalH.toFixed(1)} hrs</div>
              </div>
              <div style={{ width: 1, height: 28, background: t.tBdr }} />
              <div>
                <span style={{ fontSize: 10, color: t.sub, textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>Est. Earnings</span>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#10B981" }} className="sora">₹{Math.round(estimatedEarnings).toLocaleString("en-IN")}</div>
              </div>
              <div style={{ width: 1, height: 28, background: t.tBdr }} />
              <div>
                <span style={{ fontSize: 10, color: t.sub, textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.5 }}>Breakdown</span>
                <div style={{ fontSize: 12, fontWeight: 600, color: t.text }}>
                  {workCount} Work · {nightCount} Night · {offCount} Off
                </div>
              </div>
            </div>
            <button
              onClick={() => window.print()}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                background: t.is ? "rgba(37,99,235,0.2)" : "#EFF6FF",
                color: "#2563EB",
                border: "1px solid rgba(37,99,235,0.3)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              🖨️ Print / Save PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const inputStyle = (t) => ({
  marginTop: 6,
  width: "100%",
  padding: "9px 13px",
  borderRadius: 10,
  border: `1.5px solid ${t.inputBdr}`,
  background: t.inputBg,
  color: t.inputTxt,
  fontSize: 13,
  fontFamily: "'DM Sans',sans-serif",
  outline: "none",
});

const tinyInputStyle = (t, disabled = false, minWidth = 90) => ({
  padding: "5px 8px",
  borderRadius: 8,
  border: `1px solid ${t.inputBdr}`,
  background: t.inputBg,
  color: t.inputTxt,
  fontSize: 12,
  fontFamily: "'DM Sans',sans-serif",
  outline: "none",
  opacity: disabled ? 0.4 : 1,
  width: "100%",
  minWidth,
});
