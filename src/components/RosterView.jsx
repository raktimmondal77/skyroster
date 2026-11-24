import { useState, useMemo } from "react";
import { AlertTriangle, Sparkles, Search, Layers, X, Calendar, ChevronDown, ChevronUp, Printer, RefreshCw } from "lucide-react";
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
  const [showGenerator, setShowGenerator] = useState(!roster.length);
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);

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
    { id: "work", label: "Work", count: workCount },
    { id: "night", label: "Night", count: nightCount },
    { id: "off", label: "Off", count: offCount },
  ];

  const PRESETS = [
    { name: "5-Day Workweek", pattern: ["M1", "M1", "M1", "M1", "M1", "F", "F"] },
    { name: "Rotating 3-Shift", pattern: ["M1", "M1", "E", "E", "N", "N", "F"] },
    { name: "4-on / 4-off", pattern: ["M1", "M1", "M1", "M1", "F", "F", "F", "F"] },
    { name: "Night Owl (4N/3Off)", pattern: ["N", "N", "N", "N", "F", "F", "F"] },
    { name: "2-2-3 Pitman", pattern: ["M1", "M1", "F", "F", "N", "N", "N", "F", "F", "M1", "M1", "M1", "F", "F"] },
  ];

  const handleApplyPreset = (preset) => {
    const res = applyDetectedPattern(preset.pattern);
    setShowPresetsMenu(false);
    if (res?.missingCodes?.length > 0) {
      toast(`Applied ${preset.name} (skipped missing shift codes: ${res.missingCodes.join(", ")})`, { icon: "⚠️" });
    } else if (res?.appliedCount === 0) {
      toast("No empty days left to fill.", { icon: "ℹ️" });
    } else {
      toast.success(`Applied ${preset.name} rotation!`);
    }
  };

  return (
    <div className="anim-fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <style>{`
        .roster-sticky-bar { bottom: calc(64px + var(--safe-bottom, 0px)); }
        @media(min-width: 768px) {
          .roster-sticky-bar { bottom: 16px; }
        }
      `}</style>

      {/* Printable Heading */}
      <div className="print-header">
        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>SkyRoster Shift Schedule</h1>
        <p style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
          Generated {new Date().toLocaleDateString()} · Total: {totalH.toFixed(1)} hrs · {workCount} scheduled shifts
        </p>
      </div>

      {/* Top Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="jakarta" style={{ fontSize: 24, fontWeight: 900, color: t.text, letterSpacing: "-0.5px" }}>
            Master Roster
          </div>
          <div style={{ fontSize: 12.5, color: t.sub, marginTop: 3 }}>
            <span className="mono" style={{ fontWeight: 700, color: t.text }}>{workCount}</span> shifts ·{" "}
            <span className="mono" style={{ fontWeight: 700, color: t.text }}>{totalH.toFixed(1)}</span> hours ·{" "}
            <span className="mono" style={{ fontWeight: 700, color: "#10B981" }}>₹{Math.round(estimatedEarnings).toLocaleString("en-IN")}</span> estimated
          </div>
        </div>

        {roster.length > 0 && (
          <button
            onClick={() => window.print()}
            className="no-print btn-press"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 8,
              border: `1px solid ${t.cardBdr}`,
              background: t.card,
              color: t.text,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Printer size={14} color={t.accent} />
            <span>Print / PDF</span>
          </button>
        )}
      </div>

      {/* Linear Command Toolbar */}
      <div
        style={{
          background: t.card,
          border: `1px solid ${t.cardBdr}`,
          borderRadius: 14,
          padding: "10px 14px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Date Range Generator Pill */}
          <button
            onClick={() => setShowGenerator((p) => !p)}
            className="btn-press"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 8,
              border: `1px solid ${showGenerator ? t.accent : t.cardBdr}`,
              background: showGenerator ? t.accentSoft : "transparent",
              color: showGenerator ? t.accent : t.text,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Calendar size={13} color={t.accent} />
            <span className="mono">
              {startDate && endDate ? `${startDate} → ${endDate}` : "Set Schedule Range"}
            </span>
            {showGenerator ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>

          {/* Rotation Presets Menu Button */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowPresetsMenu((p) => !p)}
              disabled={roster.length === 0}
              className="btn-press"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 8,
                border: `1px solid ${t.cardBdr}`,
                background: "transparent",
                color: roster.length > 0 ? t.text : t.sub,
                fontSize: 12,
                fontWeight: 600,
                cursor: roster.length > 0 ? "pointer" : "not-allowed",
                opacity: roster.length > 0 ? 1 : 0.5,
              }}
            >
              <Layers size={13} color={t.accent} />
              <span>Shift Presets</span>
              <ChevronDown size={13} />
            </button>

            {showPresetsMenu && (
              <div
                className="anim-scale"
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: 6,
                  width: 220,
                  background: t.card,
                  border: `1.5px solid ${t.cardBdr}`,
                  borderRadius: 12,
                  boxShadow: "0 12px 30px rgba(0,0,0,0.18)",
                  zIndex: 60,
                  overflow: "hidden",
                  padding: 6,
                }}
              >
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="btn-press"
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "8px 10px",
                      borderRadius: 6,
                      background: "none",
                      border: "none",
                      color: t.text,
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>{preset.name}</span>
                    <span style={{ fontSize: 10, color: t.sub }}>({preset.pattern.length}d)</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Search & Segmented Filter Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {/* Filters */}
          <div style={{ display: "flex", background: t.is ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", padding: 2, borderRadius: 8 }}>
            {FILTERS.map((f) => {
              const isActive = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                    background: isActive ? t.card : "transparent",
                    color: isActive ? t.accent : t.sub,
                    fontSize: 11,
                    fontWeight: isActive ? 700 : 500,
                    boxShadow: isActive ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                    transition: "all 120ms ease",
                  }}
                >
                  {f.label} <span className="mono" style={{ opacity: 0.7 }}>({f.count})</span>
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 9, top: 9, color: t.sub }} />
            <input
              type="text"
              aria-label="Search by date or day"
              placeholder="Filter dates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: "5px 8px 5px 28px",
                borderRadius: 8,
                border: `1px solid ${t.inputBdr}`,
                background: t.inputBg,
                color: t.inputTxt,
                fontSize: 11.5,
                width: 130,
                fontFamily: "'Inter', sans-serif",
                outline: "none",
              }}
            />
          </div>
        </div>
      </div>

      {/* Collapsible Date Generator Box */}
      {showGenerator && (
        <div
          className="anim-scale"
          style={{
            background: t.card,
            border: `1px solid ${t.cardBdr}`,
            borderRadius: 14,
            padding: "16px 18px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-end" }}>
            <div style={{ flex: "1 1 140px" }}>
              <label style={labelStyle(t)}>
                Start Date
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={inputStyle(t)}
                />
              </label>
            </div>
            <div style={{ flex: "1 1 140px" }}>
              <label style={labelStyle(t)}>
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
              onClick={() => {
                generateRoster();
                if (startDate && endDate && startDate <= endDate) {
                  setShowGenerator(false);
                }
              }}
              className="btn-press"
              style={{
                height: 38,
                padding: "0 20px",
                borderRadius: 8,
                background: t.accent,
                color: "#fff",
                border: "none",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
                boxShadow: `0 4px 12px ${t.is ? "rgba(59,130,246,0.3)" : "rgba(37,99,235,0.25)"}`,
              }}
            >
              Generate Roster
            </button>
          </div>

          {rangeError && (
            <div style={{ marginTop: 10, fontSize: 11.5, color: "#EF4444", fontWeight: 600 }}>
              ⚠ {rangeError}
            </div>
          )}
        </div>
      )}

      {/* Pattern Auto-Fill Banner */}
      {showBanner && (
        <div
          className="anim-scale"
          style={{
            borderRadius: 12,
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
            background: t.accentSoft,
            border: `1.5px solid ${t.is ? "rgba(59,130,246,0.35)" : "rgba(37,99,235,0.3)"}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Sparkles size={18} color={t.accent} />
            <div>
              <div style={{ fontWeight: 800, color: t.text, fontSize: 13 }} className="jakarta">
                Pattern Detected: {cycle.length}-day repeating cycle
              </div>
              <div style={{ fontSize: 11.5, color: t.sub, marginTop: 2, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span>Cycle:</span>
                {cycle.map((c, i) => {
                  const sh = shifts.find((s) => s.code === c);
                  return (
                    <span
                      key={i}
                      style={{
                        padding: "1px 6px",
                        borderRadius: 4,
                        fontSize: 10,
                        fontWeight: 800,
                        background: sh ? `${sh.color}25` : "#94A3B825",
                        color: sh ? sh.color : "#94A3B8",
                        border: `1px solid ${sh ? sh.color : "#94A3B8"}50`,
                      }}
                    >
                      {c}
                    </span>
                  );
                })}
                <span>· will fill <strong style={{ color: t.text }}>{emptyCount}</strong> empty days</span>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => applyDetectedPattern(detected)}
              className="btn-press"
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                background: t.accent,
                color: "#fff",
                border: "none",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Auto-fill
            </button>
            <button
              onClick={() => setDismissed(true)}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                background: "transparent",
                border: `1px solid ${t.cardBdr}`,
                color: t.sub,
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Active Warning Popover Box */}
      {activeWarningDate && warningMap.has(activeWarningDate) && (
        <div
          style={{
            background: t.is ? "rgba(239, 68, 68, 0.1)" : "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: 12,
            padding: "10px 14px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div className="mono" style={{ fontSize: 11.5, fontWeight: 800, color: "#EF4444" }}>
              Alerts for {activeWarningDate}
            </div>
            {warningMap.get(activeWarningDate).map((w, idx) => (
              <div key={idx} style={{ fontSize: 12, color: t.text }}>
                • {w.msg}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setActiveWarningDate(null)}
            aria-label="Close alert"
            style={{ background: "none", border: "none", color: t.sub, cursor: "pointer", padding: 2 }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Table */}
      {roster.length === 0 ? (
        <EmptyState
          t={t}
          icon="🗓️"
          title="No schedule roster generated yet"
          subtitle="Click Set Schedule Range in the toolbar above, pick your start and end dates, and generate your roster."
          actionLabel="Open Date Generator"
          onAction={() => setShowGenerator(true)}
        />
      ) : (
        <>
          <div
            style={{
              background: t.card,
              border: `1px solid ${t.cardBdr}`,
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: t.tHead }}>
                    {[
                      { label: "Date & Day", w: 140 },
                      { label: "Shift", w: 135 },
                      { label: "Start → End", w: 200 },
                      { label: "Duty Title", w: 160 },
                      { label: "Location", w: 130, cls: "hide-mob" },
                      { label: "Notes", w: 140, cls: "hide-mob" },
                      { label: "Hours", w: 60 },
                    ].map((col) => (
                      <th
                        key={col.label}
                        className={col.cls || ""}
                        style={{
                          padding: "10px 14px",
                          textAlign: "left",
                          fontSize: 10,
                          fontWeight: 700,
                          color: t.sub,
                          textTransform: "uppercase",
                          letterSpacing: 0.7,
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
                        className="row-hover"
                        style={{
                          borderBottom: `1px solid ${t.tBdr}`,
                          background: isOff
                            ? (t.is ? "rgba(255,255,255,0.015)" : "rgba(16,185,129,0.02)")
                            : isWeekend
                            ? (t.is ? "rgba(139,92,246,0.03)" : "rgba(139,92,246,0.02)")
                            : "transparent",
                        }}
                      >
                        {/* Date Cell */}
                        <td style={{ padding: "8px 14px", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div>
                              <div className="mono" style={{ fontWeight: 700, fontSize: 12, color: t.text }}>
                                {r.date}
                              </div>
                              <div style={{ fontSize: 10.5, color: isWeekend ? "#8B5CF6" : t.sub, fontWeight: 600 }}>
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
                                aria-label="Schedule conflict warning"
                                style={{
                                  background: "rgba(239, 68, 68, 0.12)",
                                  border: "none",
                                  borderRadius: 5,
                                  padding: 3,
                                  color: "#EF4444",
                                  cursor: "pointer",
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <AlertTriangle size={13} />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Shift Selector Cell */}
                        <td style={{ padding: "8px 14px", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            {/* Cycle Button */}
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
                                padding: "4px 6px",
                                borderRadius: 6,
                                border: `1px solid ${sh ? `${sh.color}50` : t.inputBdr}`,
                                background: sh ? `${sh.color}15` : "transparent",
                                color: sh ? sh.color : t.sub,
                                fontSize: 9.5,
                                fontWeight: 800,
                                cursor: "pointer",
                              }}
                            >
                              <RefreshCw size={11} />
                            </button>

                            <select
                              aria-label={`Shift for ${r.date}`}
                              value={r.shift}
                              onChange={(e) => updateEntry(origIdx, "shift", e.target.value)}
                              style={{
                                padding: "4px 6px",
                                borderRadius: 6,
                                border: `1px solid ${t.inputBdr}`,
                                background: t.inputBg,
                                color: t.inputTxt,
                                fontSize: 11.5,
                                fontWeight: 700,
                                fontFamily: "'Inter', sans-serif",
                                cursor: "pointer",
                                outline: "none",
                                width: 70,
                              }}
                            >
                              <option value="">—</option>
                              {shifts.map((s) => (
                                <option key={s.id} value={s.code}>
                                  {s.code}
                                </option>
                              ))}
                            </select>

                            {r.shift && (
                              <button
                                type="button"
                                onClick={() => updateEntry(origIdx, "shift", "")}
                                title="Clear shift"
                                aria-label="Clear shift"
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: t.sub,
                                  cursor: "pointer",
                                  padding: 2,
                                  display: "flex",
                                  alignItems: "center",
                                }}
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Times Cell */}
                        <td style={{ padding: "8px 14px", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <input
                              type="time"
                              aria-label="Start time"
                              value={r.startTime}
                              onChange={(e) => updateEntry(origIdx, "startTime", e.target.value)}
                              disabled={isOff}
                              style={tableInput(t, isOff, 88)}
                            />
                            <span style={{ color: t.sub, fontSize: 10 }}>→</span>
                            <input
                              type="time"
                              aria-label="End time"
                              value={r.endTime}
                              onChange={(e) => updateEntry(origIdx, "endTime", e.target.value)}
                              disabled={isOff}
                              style={tableInput(t, isOff, 88)}
                            />
                            {ov && <span title="Overnight shift" style={{ fontSize: 12 }}>🌙</span>}
                          </div>
                        </td>

                        {/* Event Title */}
                        <td style={{ padding: "8px 14px", whiteSpace: "nowrap" }}>
                          <input
                            type="text"
                            aria-label="Duty title"
                            value={r.eventTitle}
                            onChange={(e) => updateEntry(origIdx, "eventTitle", e.target.value)}
                            placeholder="Title..."
                            style={tableInput(t, false, 120)}
                          />
                        </td>

                        {/* Location */}
                        <td className="hide-mob" style={{ padding: "8px 14px", whiteSpace: "nowrap" }}>
                          <input
                            type="text"
                            aria-label="Location"
                            value={r.location}
                            onChange={(e) => updateEntry(origIdx, "location", e.target.value)}
                            placeholder="Location..."
                            style={tableInput(t, false, 105)}
                          />
                        </td>

                        {/* Notes */}
                        <td className="hide-mob" style={{ padding: "8px 14px", whiteSpace: "nowrap" }}>
                          <input
                            type="text"
                            aria-label="Notes"
                            value={r.notes}
                            onChange={(e) => updateEntry(origIdx, "notes", e.target.value)}
                            placeholder="Notes..."
                            style={tableInput(t, false, 110)}
                          />
                        </td>

                        {/* Hours Pill */}
                        <td style={{ padding: "8px 14px", whiteSpace: "nowrap" }}>
                          {!isOff && hrs > 0 ? (
                            <span
                              className="mono"
                              style={{
                                display: "inline-block",
                                padding: "2px 8px",
                                borderRadius: 6,
                                background: `${sh?.color || "#2563EB"}15`,
                                border: `1px solid ${sh?.color || "#2563EB"}40`,
                                color: sh?.color || "#2563EB",
                                fontSize: 10.5,
                                fontWeight: 700,
                              }}
                            >
                              {hrs.toFixed(1)}h
                            </span>
                          ) : isOff ? (
                            <span
                              style={{
                                padding: "2px 8px",
                                borderRadius: 6,
                                background: "rgba(16,185,129,0.12)",
                                color: "#10B981",
                                fontSize: 10.5,
                                fontWeight: 700,
                              }}
                            >
                              Off
                            </span>
                          ) : (
                            <span style={{ color: t.sub, fontSize: 11 }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div
              style={{
                padding: "10px 16px",
                borderTop: `1px solid ${t.tBdr}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: t.tHead,
                fontSize: 11.5,
                color: t.sub,
              }}
            >
              <div>
                Showing {filtered.length} of {roster.length} rows
              </div>
              <div>
                Total: <strong className="mono" style={{ color: t.text }}>{totalH.toFixed(1)} hrs</strong>
              </div>
            </div>
          </div>

          {/* Floating Sticky Bottom Bar */}
          <div
            className="no-print roster-sticky-bar"
            style={{
              position: "sticky",
              zIndex: 35,
              background: t.is ? "rgba(14, 22, 38, 0.92)" : "rgba(255, 255, 255, 0.94)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border: `1px solid ${t.cardBdr}`,
              borderRadius: 14,
              padding: "12px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 14,
              boxShadow: "0 8px 30px rgba(0,0,0,0.14)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <div>
                <span style={{ fontSize: 9.5, color: t.sub, textTransform: "uppercase", fontWeight: 700 }}>Total Hours</span>
                <div className="mono" style={{ fontSize: 15, fontWeight: 800, color: t.text }}>
                  {totalH.toFixed(1)} hrs
                </div>
              </div>
              <div style={{ width: 1, height: 24, background: t.tBdr }} />
              <div>
                <span style={{ fontSize: 9.5, color: t.sub, textTransform: "uppercase", fontWeight: 700 }}>Est. Payout</span>
                <div className="mono" style={{ fontSize: 15, fontWeight: 800, color: "#10B981" }}>
                  ₹{Math.round(estimatedEarnings).toLocaleString("en-IN")}
                </div>
              </div>
              <div style={{ width: 1, height: 24, background: t.tBdr }} />
              <div>
                <span style={{ fontSize: 9.5, color: t.sub, textTransform: "uppercase", fontWeight: 700 }}>Schedule Balance</span>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: t.text }}>
                  {workCount} Work · {nightCount} Night · {offCount} Off
                </div>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="btn-press"
              style={{
                padding: "7px 14px",
                borderRadius: 8,
                background: t.accent,
                color: "#fff",
                border: "none",
                fontSize: 11.5,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Printer size={13} />
              <span>Print Schedule</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const labelStyle = (t) => ({
  fontSize: 10,
  fontWeight: 700,
  color: t.sub,
  textTransform: "uppercase",
  letterSpacing: 0.6,
  display: "block",
});

const inputStyle = (t) => ({
  marginTop: 4,
  width: "100%",
  padding: "7px 10px",
  borderRadius: 8,
  border: `1px solid ${t.inputBdr}`,
  background: t.inputBg,
  color: t.inputTxt,
  fontSize: 12,
  fontFamily: "'Inter', sans-serif",
  outline: "none",
  boxSizing: "border-box",
});

const tableInput = (t, disabled = false, minWidth = 80) => ({
  padding: "4px 7px",
  borderRadius: 6,
  border: `1px solid ${t.inputBdr}`,
  background: t.inputBg,
  color: t.inputTxt,
  fontSize: 11.5,
  fontFamily: "'Inter', sans-serif",
  outline: "none",
  opacity: disabled ? 0.4 : 1,
  width: "100%",
  minWidth,
  boxSizing: "border-box",
});
