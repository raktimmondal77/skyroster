import { useState, useMemo, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, MapPin, AlignLeft, X } from "lucide-react";
import { fmtDate, DAYS_SHORT, isON, calcHrs } from "../utils/rosterHelpers";

export default function CalendarView({ t, roster, shifts, updateEntry, teamData, userName }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(null);
  const [visibleTeammates, setVisibleTeammates] = useState({});

  const touchRef = useRef({ startX: 0, startY: 0, swiping: false });

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Touch Swipe with horizontal dominance calculation
  const onTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    touchRef.current = {
      startX: e.touches[0].clientX,
      startY: e.touches[0].clientY,
      swiping: false,
    };
  };

  const onTouchMove = (e) => {
    if (e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - touchRef.current.startX;
    const dy = e.touches[0].clientY - touchRef.current.startY;
    if (Math.abs(dx) > 15 && Math.abs(dx) > Math.abs(dy)) {
      touchRef.current.swiping = true;
    }
  };

  const onTouchEnd = (e) => {
    if (!touchRef.current.swiping) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.startX;
    const dy = e.changedTouches[0].clientY - touchRef.current.startY;
    const minDistance = 45;

    if (Math.abs(dx) > minDistance && Math.abs(dx) > Math.abs(dy) * 1.4) {
      if (dx < 0) nextMonth();
      else prevMonth();
    }

    setTimeout(() => {
      touchRef.current.swiping = false;
    }, 80);
  };

  const handleCellClick = (dateStr) => {
    if (touchRef.current.swiping) return;
    setSelectedDateStr(dateStr);
  };

  // Escape key listener for Quick Editor modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setSelectedDateStr(null);
    };
    if (selectedDateStr) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDateStr]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthLabel = currentDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  // Pre-index roster and shifts for O(1) cell lookups
  const rosterMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(roster)) {
      roster.forEach(r => map.set(r.date, r));
    }
    return map;
  }, [roster]);

  const shiftsMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(shifts)) {
      shifts.forEach(s => map.set(s.code, s));
    }
    return map;
  }, [shifts]);

  const { calendarCells, monthStats } = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const cells = [];
    const prevMonthEnd = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthEnd - i);
      cells.push({ date: d, isCurrentMonth: false });
    }

    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      cells.push({ date: d, isCurrentMonth: true });
    }

    const totalCells = Math.ceil(cells.length / 7) * 7;
    const paddingDays = totalCells - cells.length;
    for (let i = 1; i <= paddingDays; i++) {
      const d = new Date(year, month + 1, i);
      cells.push({ date: d, isCurrentMonth: false });
    }

    let totalWorkHours = 0;
    let workShiftsCount = 0;
    let offDaysCount = 0;

    cells.forEach(cell => {
      if (!cell.isCurrentMonth) return;
      const dStr = fmtDate(cell.date);
      const row = rosterMap.get(dStr);
      if (row && row.shift) {
        const sh = shiftsMap.get(row.shift);
        if (sh && !sh.isOff) {
          totalWorkHours += calcHrs(row.startTime, row.endTime);
          workShiftsCount++;
        } else if (sh && sh.isOff) {
          offDaysCount++;
        }
      }
    });

    return { calendarCells: cells, monthStats: { totalWorkHours, workShiftsCount, offDaysCount } };
  }, [year, month, rosterMap, shiftsMap]);

  // Selected cell modal data
  const selectedRowInfo = useMemo(() => {
    if (!selectedDateStr) return null;
    const idx = (roster || []).findIndex(r => r.date === selectedDateStr);
    const row = rosterMap.get(selectedDateStr);
    return {
      idx,
      row: row || { date: selectedDateStr, shift: "", startTime: "", endTime: "", eventTitle: "", location: "", notes: "" }
    };
  }, [selectedDateStr, roster, rosterMap]);

  const handleSelectShift = (code) => {
    if (!selectedDateStr) return;
    const { idx } = selectedRowInfo;
    if (idx >= 0) {
      updateEntry(idx, "shift", code);
    }
  };

  const handleUpdateField = (field, val) => {
    if (!selectedDateStr) return;
    const { idx } = selectedRowInfo;
    if (idx >= 0) {
      updateEntry(idx, field, val);
    }
  };

  const todayStr = useMemo(() => fmtDate(new Date()), []);

  return (
    <div className="anim-fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Month Navigation & Metrics Bar */}
      <div
        className="glass"
        style={{
          background: t.card,
          border: `1px solid ${t.cardBdr}`,
          borderRadius: 20,
          padding: "16px 20px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 14,
          boxShadow: "0 4px 16px rgba(0,0,0,.03)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            onClick={prevMonth}
            aria-label="Previous month"
            style={{
              background: t.is ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              border: `1px solid ${t.cardBdr}`,
              color: t.text,
              cursor: "pointer",
              width: 38,
              height: 38,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronLeft size={18} />
          </button>
          
          <h2 className="sora" style={{ fontSize: 18, fontWeight: 800, color: t.text, minWidth: 160, textAlign: "center" }}>
            {monthLabel}
          </h2>

          <button
            onClick={nextMonth}
            aria-label="Next month"
            style={{
              background: t.is ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              border: `1px solid ${t.cardBdr}`,
              color: t.text,
              cursor: "pointer",
              width: 38,
              height: 38,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Month Summary Stats */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: t.sub }}>Work Shifts:</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#2563EB" }}>
              {monthStats.workShiftsCount}
            </span>
          </div>
          <div style={{ width: 1, height: 16, background: t.cardBdr }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: t.sub }}>Hours:</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#059669" }}>
              {monthStats.totalWorkHours}h
            </span>
          </div>
          <div style={{ width: 1, height: 16, background: t.cardBdr }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: t.sub }}>Off Days:</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: t.text }}>
              {monthStats.offDaysCount}
            </span>
          </div>
        </div>
      </div>

      {/* Teammate Filter Bar */}
      {teamData?.members && Object.keys(teamData.members).length > 1 && (
        <div
          className="glass"
          style={{
            background: t.card,
            border: `1px solid ${t.cardBdr}`,
            borderRadius: 14,
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: t.sub }}>Team Visibility:</span>
          {Object.keys(teamData.members).map(m => {
            if (m === userName) return null;
            const isVisible = visibleTeammates[m] !== false;
            return (
              <button
                key={m}
                onClick={() => setVisibleTeammates(p => ({ ...p, [m]: !isVisible }))}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: isVisible ? "1.5px solid #2563EB" : `1px solid ${t.cardBdr}`,
                  background: isVisible ? "rgba(37,99,235,0.1)" : "transparent",
                  color: isVisible ? "#2563EB" : t.sub,
                  transition: "all .15s ease",
                }}
              >
                <span>{m}</span>
                <span style={{ fontSize: 10 }}>{isVisible ? "✓" : "+"}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Calendar Grid Container */}
      <div
        className="glass"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          background: t.card,
          border: `1px solid ${t.cardBdr}`,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "0 6px 20px rgba(0,0,0,.03)",
        }}
      >
        {/* Day Names Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            background: t.tHead,
            borderBottom: `1px solid ${t.tBdr}`,
          }}
        >
          {DAYS_SHORT.map((day, i) => (
            <div
              key={i}
              style={{
                padding: "10px 4px",
                textAlign: "center",
                fontSize: 11,
                fontWeight: 800,
                color: i === 0 || i === 6 ? "#7C3AED" : t.sub,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Cells Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gridAutoRows: "minmax(85px, 1fr)",
            gap: 1,
            background: t.tBdr,
          }}
        >
          {calendarCells.map((cell, idx) => {
            const dateStr = fmtDate(cell.date);
            const row = rosterMap.get(dateStr);
            const sh = row?.shift ? shiftsMap.get(row.shift) : null;
            const isToday = dateStr === todayStr;
            const isWeekend = [0, 6].includes(cell.date.getDay());

            // Collect visible teammates' shifts
            const teamShifts = [];
            if (teamData?.members) {
              Object.keys(teamData.members).forEach(member => {
                if (member !== userName && visibleTeammates[member] !== false) {
                  const mRoster = teamData.members[member];
                  if (Array.isArray(mRoster)) {
                    const mRow = mRoster.find(r => r.date === dateStr);
                    if (mRow && mRow.shift) {
                      const mSh = shiftsMap.get(mRow.shift);
                      if (mSh) teamShifts.push({ member, shift: mSh, startTime: mRow.startTime });
                    }
                  }
                }
              });
            }

            return (
              <div
                key={idx}
                role="button"
                tabIndex={0}
                aria-label={`${cell.date.toLocaleDateString("en-IN", { weekday: "long", month: "short", day: "numeric" })}: ${
                  sh ? `${sh.title} (${sh.code})` : "No shift scheduled"
                }`}
                onClick={() => handleCellClick(dateStr)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCellClick(dateStr);
                  }
                }}
                className="row-hover"
                style={{
                  background: cell.isCurrentMonth
                    ? isToday
                      ? (t.is ? "rgba(37,99,235,.15)" : "#F0F6FF")
                      : t.card
                    : (t.is ? "#070C17" : "#F8FAFC"),
                  padding: "8px 6px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                  boxShadow: isToday ? `inset 0 0 0 2px #2563EB` : "none",
                  opacity: cell.isCurrentMonth ? 1 : 0.4,
                  overflow: "hidden",
                }}
              >
                {/* Cell Top: Date Number & Notes Indicator */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: isToday ? 800 : cell.isCurrentMonth ? 700 : 500,
                      color: isToday ? "#2563EB" : isWeekend ? "#7C3AED" : t.text,
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isToday ? "rgba(37,99,235,.15)" : "transparent",
                    }}
                  >
                    {cell.date.getDate()}
                  </span>
                  {row?.notes && (
                    <div
                      style={{ width: 5, height: 5, borderRadius: "50%", background: "#D97706" }}
                      title="Has notes"
                    />
                  )}
                </div>

                {/* Cell Center: Shift Pill */}
                <div style={{ margin: "4px 0" }}>
                  {sh ? (
                    <div
                      style={{
                        background: sh.color,
                        color: "#ffffff",
                        borderRadius: 6,
                        padding: "3px 4px",
                        fontSize: 10,
                        fontWeight: 800,
                        textAlign: "center",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        boxShadow: `0 2px 5px ${sh.color}35`,
                      }}
                    >
                      <div>{sh.code}</div>
                      {!sh.isOff && row.startTime && (
                        <div className="desk-only" style={{ fontSize: 9, opacity: 0.85, marginTop: 1, fontWeight: 500 }}>
                          {row.startTime}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ height: 16 }} />
                  )}

                  {/* Teammates: Dot Grid Indicator */}
                  {teamShifts.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 4, justifyContent: "center" }}>
                      {teamShifts.map((ts, tIdx) => (
                        <span
                          key={tIdx}
                          title={`${ts.member}: ${ts.shift.code}`}
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: ts.shift.color,
                            display: "inline-block",
                            flexShrink: 0,
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Cell Bottom: Event Title Preview */}
                <div
                  style={{
                    height: 14,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: 9,
                    color: t.sub,
                    fontWeight: 500,
                  }}
                >
                  {row?.eventTitle || ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* QUICK DAY EDITOR MODAL */}
      {selectedRowInfo && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="day-editor-title"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 110,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          {/* Backdrop */}
          <div
            onClick={() => setSelectedDateStr(null)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(5px)",
            }}
          />

          {/* Modal Container */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              width: "100%",
              maxWidth: 420,
              maxHeight: "calc(100dvh - 32px)",
              background: t.card,
              borderRadius: 22,
              border: `1.5px solid ${t.cardBdr}`,
              boxShadow: "0 24px 60px rgba(0,0,0,.3)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              animation: "scaleIn .22s cubic-bezier(.22,.68,0,1.2) forwards",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: `1px solid ${t.tBdr}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <div>
                <h3 id="day-editor-title" className="sora" style={{ fontSize: 16, fontWeight: 800, color: t.text }}>
                  Edit Day Schedule
                </h3>
                <span style={{ fontSize: 12, color: t.sub, fontWeight: 600 }}>
                  {selectedDateStr} · {selectedRowInfo.idx >= 0 ? "Scheduled" : "Outside Range"}
                </span>
              </div>
              <button
                onClick={() => setSelectedDateStr(null)}
                aria-label="Close day schedule editor"
                style={{
                  background: "none",
                  border: "none",
                  color: t.sub,
                  cursor: "pointer",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 8,
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            {selectedRowInfo.idx < 0 ? (
              <div style={{ padding: 24, textAlign: "center" }}>
                <p style={{ fontSize: 13, color: t.sub, lineHeight: 1.6 }}>
                  This date lies outside your current generated roster range. To schedule shifts here, please extend your date range in the <strong>Master Roster</strong> section.
                </p>
                <button
                  onClick={() => setSelectedDateStr(null)}
                  style={{
                    marginTop: 18,
                    padding: "9px 20px",
                    borderRadius: 10,
                    background: "#2563EB",
                    color: "#fff",
                    border: "none",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Understood
                </button>
              </div>
            ) : (
              <div
                style={{
                  padding: "18px 20px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                {/* Shift Selector */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: t.sub, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                    Select Shift Type
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {shifts.map(sh => (
                      <button
                        key={sh.id}
                        type="button"
                        onClick={() => handleSelectShift(sh.code)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 12px",
                          borderRadius: 10,
                          border: selectedRowInfo.row.shift === sh.code ? `2px solid ${sh.color}` : `1px solid ${t.inputBdr}`,
                          background: selectedRowInfo.row.shift === sh.code ? `${sh.color}15` : "transparent",
                          color: selectedRowInfo.row.shift === sh.code ? sh.color : t.text,
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: sh.color }} />
                        {sh.code}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleSelectShift("")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 10,
                        border: selectedRowInfo.row.shift === "" ? `2px solid #94A3B8` : `1px solid ${t.inputBdr}`,
                        background: "transparent",
                        color: t.sub,
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Start & End Times */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: t.sub, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={selectedRowInfo.row.startTime}
                      disabled={selectedRowInfo.row.shift === "F"}
                      onChange={e => handleUpdateField("startTime", e.target.value)}
                      style={inputStyle(t, selectedRowInfo.row.shift === "F")}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: t.sub, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                      End Time
                    </label>
                    <input
                      type="time"
                      value={selectedRowInfo.row.endTime}
                      disabled={selectedRowInfo.row.shift === "F"}
                      onChange={e => handleUpdateField("endTime", e.target.value)}
                      style={inputStyle(t, selectedRowInfo.row.shift === "F")}
                    />
                  </div>
                </div>

                {/* Event Title */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: t.sub, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                    Event Title
                  </label>
                  <input
                    type="text"
                    value={selectedRowInfo.row.eventTitle}
                    placeholder="e.g. Ward Coverage, On-Call"
                    onChange={e => handleUpdateField("eventTitle", e.target.value)}
                    style={inputStyle(t)}
                  />
                </div>

                {/* Location */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: t.sub, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                    Location
                  </label>
                  <div style={{ position: "relative" }}>
                    <MapPin size={14} style={{ position: "absolute", left: 12, top: 11, color: t.sub }} />
                    <input
                      type="text"
                      value={selectedRowInfo.row.location}
                      placeholder="e.g. Building A, Room 402"
                      onChange={e => handleUpdateField("location", e.target.value)}
                      style={{ ...inputStyle(t), paddingLeft: 34 }}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: t.sub, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                    Notes
                  </label>
                  <div style={{ position: "relative" }}>
                    <AlignLeft size={14} style={{ position: "absolute", left: 12, top: 11, color: t.sub }} />
                    <input
                      type="text"
                      value={selectedRowInfo.row.notes}
                      placeholder="e.g. Handover details, special instructions..."
                      onChange={e => handleUpdateField("notes", e.target.value)}
                      style={{ ...inputStyle(t), paddingLeft: 34 }}
                    />
                  </div>
                </div>

                {/* Overnight Warning */}
                {selectedRowInfo.row.startTime && selectedRowInfo.row.endTime && isON(selectedRowInfo.row.startTime, selectedRowInfo.row.endTime) && (
                  <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(217,119,6,.08)", border: "1px solid #D97706", color: "#D97706", fontSize: 11, fontWeight: 600 }}>
                    🌙 Overnight shift detected (ends next morning).
                  </div>
                )}
                
                {/* Done Button */}
                <button
                  type="button"
                  onClick={() => setSelectedDateStr(null)}
                  style={{
                    marginTop: 4,
                    padding: "11px",
                    borderRadius: 12,
                    background: "#2563EB",
                    color: "#fff",
                    border: "none",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = (t, disabled = false) => ({
  width: "100%",
  padding: "9px 12px",
  borderRadius: 10,
  border: `1.5px solid ${t.inputBdr}`,
  background: t.inputBg,
  color: t.inputTxt,
  fontSize: 13,
  fontFamily: "'DM Sans', sans-serif",
  outline: "none",
  opacity: disabled ? 0.45 : 1,
  pointerEvents: disabled ? "none" : "auto",
  boxSizing: "border-box",
});
