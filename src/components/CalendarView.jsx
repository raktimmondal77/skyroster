import { useState, useMemo, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, MapPin, AlignLeft, X, Check } from "lucide-react";
import { fmtDate, DAYS_SHORT, isON, calcHrs } from "../utils/rosterHelpers";
import { sanitizeMemberName } from "../utils/teamSync";

export default function CalendarView({ t, roster, shifts, updateEntry, teamData, userName, setView }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(null);
  const [visibleTeammates, setVisibleTeammates] = useState({});

  const touchRef = useRef({ startX: 0, startY: 0, swiping: false });

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const jumpToToday = () => setCurrentDate(new Date());

  const onTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    touchRef.current = { startX: e.touches[0].clientX, startY: e.touches[0].clientY, swiping: false };
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
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.4) {
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

  useEffect(() => {
    if (!selectedDateStr) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setSelectedDateStr(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedDateStr]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const now = new Date();
  const isCurrentMonthShown = year === now.getFullYear() && month === now.getMonth();
  const monthLabel = currentDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const rosterMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(roster)) {
      roster.forEach((r) => map.set(r.date, r));
    }
    return map;
  }, [roster]);

  const shiftsMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(shifts)) {
      shifts.forEach((s) => map.set(s.code, s));
    }
    return map;
  }, [shifts]);

  const cleanSelfName = useMemo(() => (userName ? sanitizeMemberName(userName) : ""), [userName]);

  const { calendarCells, monthStats } = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const cells = [];
    const prevMonthEnd = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({ date: new Date(year, month - 1, prevMonthEnd - i), isCurrentMonth: false });
    }
    for (let i = 1; i <= totalDays; i++) {
      cells.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const totalCells = Math.ceil(cells.length / 7) * 7;
    const paddingDays = totalCells - cells.length;
    for (let i = 1; i <= paddingDays; i++) {
      cells.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }

    let totalWorkHours = 0;
    let workShiftsCount = 0;
    let offDaysCount = 0;

    cells.forEach((cell) => {
      if (!cell.isCurrentMonth) return;
      const dStr = fmtDate(cell.date);
      const row = rosterMap.get(dStr);
      if (row && row.shift) {
        const sh = shiftsMap.get(row.shift);
        if (sh && !sh.isOff) {
          totalWorkHours += calcHrs(row.startTime, row.endTime, Boolean(sh.is24Hour));
          workShiftsCount++;
        } else if (sh && sh.isOff) {
          offDaysCount++;
        }
      }
    });

    return {
      calendarCells: cells,
      monthStats: { totalWorkHours: Number(totalWorkHours.toFixed(1)), workShiftsCount, offDaysCount },
    };
  }, [year, month, rosterMap, shiftsMap]);

  const selectedRowInfo = useMemo(() => {
    if (!selectedDateStr) return null;
    const idx = (roster || []).findIndex((r) => r.date === selectedDateStr);
    const row = rosterMap.get(selectedDateStr);
    return {
      idx,
      row: row || { date: selectedDateStr, shift: "", startTime: "", endTime: "", eventTitle: "", location: "", notes: "" },
    };
  }, [selectedDateStr, roster, rosterMap]);

  const selectedShiftDef = selectedRowInfo?.row?.shift ? shiftsMap.get(selectedRowInfo.row.shift) : null;
  const isSelectedOff = Boolean(selectedShiftDef?.isOff);

  const handleSelectShift = (code) => {
    if (!selectedDateStr || !selectedRowInfo || selectedRowInfo.idx < 0) return;
    updateEntry(selectedRowInfo.idx, "shift", code);
  };

  const handleUpdateField = (field, val) => {
    if (!selectedDateStr || !selectedRowInfo || selectedRowInfo.idx < 0) return;
    updateEntry(selectedRowInfo.idx, field, val);
  };

  const todayStr = useMemo(() => fmtDate(new Date()), []);

  const teammatesList = useMemo(() => {
    if (!teamData?.members) return [];
    return Object.keys(teamData.members).filter((m) => sanitizeMemberName(m) !== cleanSelfName);
  }, [teamData, cleanSelfName]);

  return (
    <div className="anim-fade-up" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Calendar Header Navigation Bar */}
      <div
        style={{
          background: t.card,
          border: `1px solid ${t.cardBdr}`,
          borderRadius: 16,
          padding: "12px 18px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={prevMonth}
            aria-label="Previous month"
            className="btn-press"
            style={{
              background: t.is ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              border: `1px solid ${t.cardBdr}`,
              color: t.text,
              cursor: "pointer",
              width: 34,
              height: 34,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronLeft size={16} />
          </button>

          <h2 className="jakarta" style={{ fontSize: 16, fontWeight: 800, color: t.text, minWidth: 150, textAlign: "center", margin: 0 }}>
            {monthLabel}
          </h2>

          <button
            onClick={nextMonth}
            aria-label="Next month"
            className="btn-press"
            style={{
              background: t.is ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              border: `1px solid ${t.cardBdr}`,
              color: t.text,
              cursor: "pointer",
              width: 34,
              height: 34,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronRight size={16} />
          </button>

          {!isCurrentMonthShown && (
            <button
              type="button"
              onClick={jumpToToday}
              className="btn-press"
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: `1px solid ${t.is ? "rgba(59,130,246,0.3)" : "rgba(37,99,235,0.25)"}`,
                background: t.accentSoft,
                color: t.accent,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Today
            </button>
          )}
        </div>

        {/* Quick Stats Pill */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: t.sub }}>Work:</span>
            <span className="mono" style={{ fontSize: 12, fontWeight: 800, color: t.accent }}>
              {monthStats.workShiftsCount}
            </span>
          </div>
          <div style={{ width: 1, height: 14, background: t.cardBdr }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: t.sub }}>Hours:</span>
            <span className="mono" style={{ fontSize: 12, fontWeight: 800, color: "#10B981" }}>
              {monthStats.totalWorkHours}h
            </span>
          </div>
          <div style={{ width: 1, height: 14, background: t.cardBdr }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 11, color: t.sub }}>Off:</span>
            <span className="mono" style={{ fontSize: 12, fontWeight: 800, color: t.text }}>
              {monthStats.offDaysCount}
            </span>
          </div>
        </div>
      </div>

      {/* Teammate Filter Bar */}
      {teammatesList.length > 0 && (
        <div
          style={{
            background: t.card,
            border: `1px solid ${t.cardBdr}`,
            borderRadius: 12,
            padding: "8px 14px",
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 700, color: t.sub }}>Team Overlay:</span>
          {teammatesList.map((m) => {
            const isVisible = visibleTeammates[m] !== false;
            return (
              <button
                key={m}
                onClick={() => setVisibleTeammates((p) => ({ ...p, [m]: !isVisible }))}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "3px 8px",
                  borderRadius: 20,
                  fontSize: 10.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: isVisible ? `1px solid ${t.accent}` : `1px solid ${t.cardBdr}`,
                  background: isVisible ? t.accentSoft : "transparent",
                  color: isVisible ? t.accent : t.sub,
                  transition: "all 120ms ease",
                }}
              >
                <span>{m}</span>
                <span style={{ fontSize: 9 }}>{isVisible ? "✓" : "+"}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Calendar Grid */}
      <div
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{
          background: t.card,
          border: `1px solid ${t.cardBdr}`,
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {/* Day Name Headers */}
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
                padding: "8px 4px",
                textAlign: "center",
                fontSize: 10,
                fontWeight: 700,
                color: i === 0 || i === 6 ? "#8B5CF6" : t.sub,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gridAutoRows: "minmax(82px, 1fr)",
            gap: 1,
            background: t.tBdr,
          }}
        >
          {calendarCells.map((cell, idx) => {
            const dateStr = fmtDate(cell.date);
            const row = rosterMap.get(dateStr);
            const sh = row?.shift ? shiftsMap.get(row.shift) : null;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDateStr;
            const isWeekend = [0, 6].includes(cell.date.getDay());

            const teamShifts = [];
            if (teamData?.members) {
              teammatesList.forEach((member) => {
                if (visibleTeammates[member] !== false) {
                  const mRoster = teamData.members[member];
                  if (Array.isArray(mRoster)) {
                    const mRow = mRoster.find((r) => r.date === dateStr);
                    if (mRow && mRow.shift) {
                      const mSh = shiftsMap.get(mRow.shift) || {
                        code: mRow.shift,
                        color: "#64748B",
                        isOff: false,
                      };
                      teamShifts.push({ member, shift: mSh, startTime: mRow.startTime });
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
                aria-label={`${dateStr}: ${sh ? sh.code : "No shift"}`}
                onClick={() => handleCellClick(dateStr)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleCellClick(dateStr);
                  }
                }}
                className="row-hover"
                style={{
                  background: isSelected
                    ? (t.is ? "rgba(59,130,246,0.18)" : "#EFF6FF")
                    : cell.isCurrentMonth
                    ? isToday
                      ? (t.is ? "rgba(59,130,246,0.1)" : "#F0F6FF")
                      : t.card
                    : (t.is ? "#070C18" : "#F8FAFC"),
                  padding: "6px 5px",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxSizing: "border-box",
                  boxShadow: isSelected
                    ? `inset 0 0 0 2px ${t.accent}`
                    : isToday
                    ? `inset 0 0 0 1.5px ${t.accent}`
                    : "none",
                  opacity: cell.isCurrentMonth ? 1 : 0.35,
                  overflow: "hidden",
                }}
              >
                {/* Cell Top Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span
                    className="mono"
                    style={{
                      fontSize: 11,
                      fontWeight: isToday ? 800 : cell.isCurrentMonth ? 700 : 500,
                      color: isToday ? t.accent : isWeekend ? "#8B5CF6" : t.text,
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isToday ? t.accentSoft : "transparent",
                    }}
                  >
                    {cell.date.getDate()}
                  </span>

                  {row?.notes && (
                    <span
                      style={{ width: 5, height: 5, borderRadius: "50%", background: "#F59E0B" }}
                      title="Notes attached"
                    />
                  )}
                </div>

                {/* Shift Capsule (Linear Micro-Glow Badge) */}
                <div style={{ margin: "2px 0" }}>
                  {sh ? (
                    <div
                      style={{
                        background: `${sh.color}15`,
                        border: `1px solid ${sh.color}45`,
                        color: sh.color,
                        borderRadius: 6,
                        padding: "2px 4px",
                        fontSize: 9.5,
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                        textAlign: "center",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: sh.color, flexShrink: 0 }} />
                      <span>{sh.code}</span>
                      {!sh.isOff && row.startTime && (
                        <span className="desk-only mono" style={{ fontSize: 8.5, opacity: 0.85, fontWeight: 500 }}>
                          {row.startTime}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div style={{ height: 16 }} />
                  )}

                  {/* Teammate Dots */}
                  {teamShifts.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginTop: 3, justifyContent: "center" }}>
                      {teamShifts.map((ts, tIdx) => (
                        <span
                          key={tIdx}
                          title={`${ts.member}: ${ts.shift.code}`}
                          style={{
                            width: 5,
                            height: 5,
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

                {/* Event Title Line */}
                <div
                  style={{
                    height: 12,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    fontSize: 8.5,
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

      {/* Quick Shift Inspector / Drawer (Bottom Sheet on Mobile, Side Inspector on Desktop) */}
      {selectedRowInfo && (
        <>
          <style>{`
            .calendar-inspector-backdrop {
              position: fixed;
              inset: 0;
              background: rgba(0, 0, 0, 0.45);
              backdrop-filter: blur(4px);
              z-index: 105;
            }
            .calendar-inspector-panel {
              position: fixed;
              z-index: 110;
              background: ${t.card};
              display: flex;
              flex-direction: column;
              box-shadow: 0 10px 40px rgba(0,0,0,0.25);
            }
            /* Mobile: Bottom Sheet */
            @media (max-width: 767px) {
              .calendar-inspector-panel {
                left: 0;
                right: 0;
                bottom: 0;
                max-height: calc(85dvh - var(--safe-bottom, 0px));
                border-top-left-radius: 20px;
                border-top-right-radius: 20px;
                border-top: 1.5px solid ${t.cardBdr};
                animation: slideUpSheet 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
              }
            }
            /* Desktop: Side Inspector Drawer */
            @media (min-width: 768px) {
              .calendar-inspector-panel {
                top: 0;
                right: 0;
                bottom: 0;
                width: 380px;
                border-left: 1px solid ${t.cardBdr};
                animation: slideRightDrawer 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
              }
            }
          `}</style>

          {/* Backdrop on Mobile */}
          <div
            className="calendar-inspector-backdrop mob-only"
            onClick={() => setSelectedDateStr(null)}
          />

          <div
            className="calendar-inspector-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="inspector-title"
          >
            {/* Grab Handle for Mobile */}
            <div className="mob-only" style={{ display: "flex", justifyContent: "center", padding: "8px 0 2px" }}>
              <div style={{ width: 36, height: 4, borderRadius: 99, background: t.cardBdr }} />
            </div>

            {/* Header */}
            <div
              style={{
                padding: "14px 18px",
                borderBottom: `1px solid ${t.tBdr}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <div>
                <h3 id="inspector-title" className="jakarta" style={{ fontSize: 15, fontWeight: 800, color: t.text, margin: 0 }}>
                  Day Inspector
                </h3>
                <span className="mono" style={{ fontSize: 11, color: t.sub, fontWeight: 600 }}>
                  {selectedDateStr} · {selectedRowInfo.idx >= 0 ? "In Roster" : "Outside Range"}
                </span>
              </div>
              <button
                onClick={() => setSelectedDateStr(null)}
                aria-label="Close inspector"
                className="btn-press"
                style={{
                  background: "none",
                  border: "none",
                  color: t.sub,
                  cursor: "pointer",
                  width: 30,
                  height: 30,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 6,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {selectedRowInfo.idx < 0 ? (
              <div style={{ padding: 22, textAlign: "center" }}>
                <p style={{ fontSize: 12.5, color: t.sub, lineHeight: 1.6 }}>
                  This date lies outside your generated roster range. Extend your schedule dates in <strong>Master Roster</strong> to assign shifts here.
                </p>
                {setView && (
                  <button
                    onClick={() => {
                      setSelectedDateStr(null);
                      setView("roster");
                    }}
                    className="btn-press"
                    style={{
                      marginTop: 14,
                      padding: "8px 16px",
                      borderRadius: 8,
                      background: t.accent,
                      color: "#fff",
                      border: "none",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Open Master Roster →
                  </button>
                )}
              </div>
            ) : (
              <div
                style={{
                  padding: "16px 18px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                {/* 1-Tap Quick Shift Pill Selector */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: t.sub, textTransform: "uppercase", letterSpacing: 0.6, display: "block", marginBottom: 6 }}>
                    Quick Shift Select
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {shifts.map((sh) => {
                      const isSelected = selectedRowInfo.row.shift === sh.code;
                      return (
                        <button
                          key={sh.id}
                          type="button"
                          onClick={() => handleSelectShift(sh.code)}
                          className="btn-press"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "6px 10px",
                            borderRadius: 8,
                            border: isSelected ? `1.5px solid ${sh.color}` : `1px solid ${t.inputBdr}`,
                            background: isSelected ? `${sh.color}18` : "transparent",
                            color: isSelected ? sh.color : t.text,
                            fontWeight: 700,
                            fontSize: 11,
                            cursor: "pointer",
                            transition: "all 120ms ease",
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: sh.color }} />
                          <span>{sh.code}</span>
                          {isSelected && <Check size={12} color={sh.color} />}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => handleSelectShift("")}
                      className="btn-press"
                      style={{
                        padding: "6px 10px",
                        borderRadius: 8,
                        border: `1px solid ${t.inputBdr}`,
                        background: "transparent",
                        color: t.sub,
                        fontWeight: 600,
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Start / End Times */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: t.sub, textTransform: "uppercase", letterSpacing: 0.6, display: "block", marginBottom: 5 }}>
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={selectedRowInfo.row.startTime}
                      disabled={isSelectedOff}
                      onChange={(e) => handleUpdateField("startTime", e.target.value)}
                      style={drawerInput(t, isSelectedOff)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: t.sub, textTransform: "uppercase", letterSpacing: 0.6, display: "block", marginBottom: 5 }}>
                      End Time
                    </label>
                    <input
                      type="time"
                      value={selectedRowInfo.row.endTime}
                      disabled={isSelectedOff}
                      onChange={(e) => handleUpdateField("endTime", e.target.value)}
                      style={drawerInput(t, isSelectedOff)}
                    />
                  </div>
                </div>

                {/* Event Title */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: t.sub, textTransform: "uppercase", letterSpacing: 0.6, display: "block", marginBottom: 5 }}>
                    Shift / Duty Title
                  </label>
                  <input
                    type="text"
                    value={selectedRowInfo.row.eventTitle}
                    placeholder="e.g. Ward Coverage, On-Call"
                    onChange={(e) => handleUpdateField("eventTitle", e.target.value)}
                    style={drawerInput(t)}
                  />
                </div>

                {/* Location */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: t.sub, textTransform: "uppercase", letterSpacing: 0.6, display: "block", marginBottom: 5 }}>
                    Location
                  </label>
                  <div style={{ position: "relative" }}>
                    <MapPin size={13} style={{ position: "absolute", left: 10, top: 10, color: t.sub }} />
                    <input
                      type="text"
                      value={selectedRowInfo.row.location}
                      placeholder="e.g. Terminal 2, Station A"
                      onChange={(e) => handleUpdateField("location", e.target.value)}
                      style={{ ...drawerInput(t), paddingLeft: 30 }}
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: t.sub, textTransform: "uppercase", letterSpacing: 0.6, display: "block", marginBottom: 5 }}>
                    Notes
                  </label>
                  <div style={{ position: "relative" }}>
                    <AlignLeft size={13} style={{ position: "absolute", left: 10, top: 10, color: t.sub }} />
                    <input
                      type="text"
                      value={selectedRowInfo.row.notes}
                      placeholder="Handover instructions, key notes..."
                      onChange={(e) => handleUpdateField("notes", e.target.value)}
                      style={{ ...drawerInput(t), paddingLeft: 30 }}
                    />
                  </div>
                </div>

                {!isSelectedOff &&
                  selectedRowInfo.row.startTime &&
                  selectedRowInfo.row.endTime &&
                  isON(selectedRowInfo.row.startTime, selectedRowInfo.row.endTime, Boolean(selectedShiftDef?.is24Hour)) && (
                    <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(245,158,11,0.08)", border: "1px solid #F59E0B", color: "#F59E0B", fontSize: 11, fontWeight: 600 }}>
                      🌙 Overnight shift detected (crosses into following day).
                    </div>
                  )}

                <button
                  type="button"
                  onClick={() => setSelectedDateStr(null)}
                  className="btn-press"
                  style={{
                    marginTop: 6,
                    padding: "10px",
                    borderRadius: 10,
                    background: t.accent,
                    color: "#fff",
                    border: "none",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const drawerInput = (t, disabled = false) => ({
  width: "100%",
  padding: "8px 11px",
  borderRadius: 8,
  border: `1px solid ${t.inputBdr}`,
  background: t.inputBg,
  color: t.inputTxt,
  fontSize: 12,
  fontFamily: "'Inter', sans-serif",
  outline: "none",
  opacity: disabled ? 0.45 : 1,
  pointerEvents: disabled ? "none" : "auto",
  boxSizing: "border-box",
});
