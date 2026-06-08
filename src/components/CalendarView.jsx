import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Clock, MapPin, AlignLeft, X } from "lucide-react";
import { fmtDate, DAYS_SHORT, isON, calcHrs } from "../utils/rosterHelpers";

export default function CalendarView({ t, roster, shifts, updateEntry }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState(null);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthLabel = currentDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  const { calendarCells, monthStats } = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    // Days from previous month to fill the first week
    const cells = [];
    const prevMonthEnd = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthEnd - i);
      cells.push({ date: d, isCurrentMonth: false });
    }

    // Days of current month
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(year, month, i);
      cells.push({ date: d, isCurrentMonth: true });
    }

    // Days from next month to pad remaining week
    const totalCells = Math.ceil(cells.length / 7) * 7;
    const paddingDays = totalCells - cells.length;
    for (let i = 1; i <= paddingDays; i++) {
      const d = new Date(year, month + 1, i);
      cells.push({ date: d, isCurrentMonth: false });
    }

    // Calculate month stats
    let totalWorkHours = 0;
    let workShiftsCount = 0;
    let offDaysCount = 0;

    cells.forEach(cell => {
      if (!cell.isCurrentMonth) return;
      const dStr = fmtDate(cell.date);
      const row = roster.find(r => r.date === dStr);
      if (row && row.shift) {
        const sh = shifts.find(s => s.code === row.shift);
        if (sh && !sh.isOff) {
          totalWorkHours += calcHrs(row.startTime, row.endTime);
          workShiftsCount++;
        } else if (sh && sh.isOff) {
          offDaysCount++;
        }
      }
    });

    return { calendarCells: cells, monthStats: { totalWorkHours, workShiftsCount, offDaysCount } };
  }, [year, month, roster, shifts]);

  // Selected cell modal data
  const selectedRowInfo = useMemo(() => {
    if (!selectedDateStr) return null;
    let idx = roster.findIndex(r => r.date === selectedDateStr);
    let row = roster.find(r => r.date === selectedDateStr);
    
    // If date exists in roster range, edit it. Otherwise create a temporary dummy structure
    // so we can insert it (but the user needs to generate the range first, or we can upsert).
    // Let's support upserting! That's an awesome upgrade.
    return { idx, row: row || { date: selectedDateStr, shift: "", startTime: "", endTime: "", eventTitle: "", location: "", notes: "" } };
  }, [selectedDateStr, roster]);

  const handleSelectShift = (code) => {
    if (!selectedDateStr) return;
    const { idx } = selectedRowInfo;
    
    if (idx >= 0) {
      updateEntry(idx, "shift", code);
    } else {
      // Upsert: If the date is outside generated range, we can inform user or handle addition.
      // Since it's easier to only edit generated dates, let's allow editing existing ones.
      alert("Please ensure this date range is generated in 'Master Roster' before editing.");
    }
  };

  const handleUpdateField = (field, value) => {
    if (!selectedDateStr) return;
    const { idx } = selectedRowInfo;
    if (idx >= 0) {
      updateEntry(idx, field, value);
    }
  };

  return (
    <div className="anim-fade-up" style={{ display: "flex", flexDirection: "column", gap: 20, width: "100%" }}>
      {/* Calendar Header / Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <div>
          <div className="sora" style={{ fontSize: 28, fontWeight: 900, color: t.text, letterSpacing: "-0.6px" }}>
            Calendar Schedule
          </div>
          <div style={{ fontSize: 13, color: t.sub, marginTop: 5 }}>
            Interactive grid for month planning
          </div>
        </div>

        {/* Month Picker Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, background: t.card, border: `1px solid ${t.cardBdr}`, borderRadius: 14, padding: "6px 8px" }}>
          <button onClick={prevMonth} style={navBtnStyle(t)}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 700, color: t.text, minWidth: 130, textAlign: "center" }}>
            {monthLabel}
          </span>
          <button onClick={nextMonth} style={navBtnStyle(t)}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 14 }}>
        {[
          { label: "Planned shifts", val: monthStats.workShiftsCount, color: "#2563EB" },
          { label: "Total work hours", val: `${monthStats.totalWorkHours.toFixed(1)} hrs`, color: "#D97706" },
          { label: "Rest / Off days", val: monthStats.offDaysCount, color: "#059669" },
        ].map((stat, i) => (
          <div key={i} style={{ background: t.card, border: `1px solid ${t.cardBdr}`, borderRadius: 16, padding: "14px 18px" }}>
            <div style={{ fontSize: 11, color: t.sub, textTransform: "uppercase", letterSpacing: 0.5 }}>{stat.label}</div>
            <div className="sora" style={{ fontSize: 20, fontWeight: 800, color: stat.color, marginTop: 4 }}>{stat.val}</div>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div style={{ background: t.card, border: `1px solid ${t.cardBdr}`, borderRadius: 24, overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,.03)" }}>
        {/* Week Days Headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: t.tHead, borderBottom: `1px solid ${t.tBdr}` }}>
          {DAYS_SHORT.map((day, i) => (
            <div key={i} style={{ padding: "12px 10px", textAlign: "center", fontSize: 11, fontWeight: 700, color: t.sub, textTransform: "uppercase" }}>
              {day}
            </div>
          ))}
        </div>

        {/* Days Cells Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gridAutoRows: "minmax(100px, 1fr)", gap: 1, background: t.tBdr }}>
          {calendarCells.map((cell, idx) => {
            const dateStr = fmtDate(cell.date);
            const row = roster.find(r => r.date === dateStr);
            const sh = row?.shift ? shifts.find(s => s.code === row.shift) : null;
            const isToday = dateStr === fmtDate(new Date());
            const weekend = [0, 6].includes(cell.date.getDay());

            return (
              <div
                key={idx}
                onClick={() => setSelectedDateStr(dateStr)}
                style={{
                  background: cell.isCurrentMonth
                    ? isToday
                      ? (t.is ? "rgba(37,99,235,.15)" : "#F0F6FF")
                      : t.card
                    : (t.is ? "#090F1E" : "#F8FAFC"),
                  padding: 10,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "background .15s",
                  minHeight: 100,
                  border: isToday ? `2px solid #2563EB` : "none",
                  opacity: cell.isCurrentMonth ? 1 : 0.4,
                }}
                className="row-hover"
              >
                {/* Cell Top: Date Number & Indicators */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: cell.isCurrentMonth ? (isToday ? 800 : 600) : 400,
                      color: isToday ? "#2563EB" : weekend ? "#7C3AED" : t.text,
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: isToday ? (t.is ? "rgba(255,255,255,0.06)" : "rgba(37,99,235,.12)") : "transparent",
                    }}
                  >
                    {cell.date.getDate()}
                  </span>
                  {row?.notes && (
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#D97706" }} title="Has notes" />
                  )}
                </div>

                {/* Cell Center: Shift Pill */}
                <div style={{ margin: "8px 0" }}>
                  {sh ? (
                    <div
                      style={{
                        background: sh.color,
                        color: "#fff",
                        borderRadius: 8,
                        padding: "4px 8px",
                        fontSize: 11,
                        fontWeight: 700,
                        textAlign: "center",
                        boxShadow: `0 2px 6px ${sh.color}35`,
                      }}
                    >
                      <div>{sh.code}</div>
                      {!sh.isOff && row.startTime && (
                        <div style={{ fontSize: 9, opacity: 0.85, marginTop: 1, fontWeight: 500 }}>
                          {row.startTime}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ height: 20 }} />
                  )}
                </div>

                {/* Cell Bottom: Event Title Preview */}
                <div style={{ height: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 10, color: t.sub, fontWeight: 500 }}>
                  {row?.eventTitle || ""}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* QUICK EDITOR POPUP PANEL */}
      {selectedRowInfo && (
        <div style={{ position: "fixed", inset: 0, zIndex: 110, display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
          <div onClick={() => setSelectedDateStr(null)} style={{ position: "absolute", inset: 0, background: "rgba(0, 0, 0, 0.4)", backdropFilter: "blur(4px)" }} />
          
          <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 440, background: t.card, borderRadius: 24, border: `1.5px solid ${t.cardBdr}`, boxShadow: "0 20px 50px rgba(0,0,0,.25)", overflow: "hidden", animation: "scaleIn .25s ease forwards" }}>
            
            {/* Modal Header */}
            <div style={{ padding: "18px 24px", borderBottom: `1px solid ${t.tBdr}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 className="sora" style={{ fontSize: 16, fontWeight: 800, color: t.text }}>Edit Day Schedule</h3>
                <span style={{ fontSize: 12, color: t.sub, fontWeight: 600 }}>{selectedDateStr} · {selectedRowInfo.idx >= 0 ? "Configured" : "Not generated yet"}</span>
              </div>
              <button onClick={() => setSelectedDateStr(null)} style={{ background: "none", border: "none", color: t.sub, cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            {selectedRowInfo.idx < 0 ? (
              <div style={{ padding: 24, textAlign: "center" }}>
                <p style={{ fontSize: 13, color: t.sub, lineHeight: 1.5 }}>
                  This date lies outside your current generated roster range. To schedule shifts here, please first extend your date range in the <strong>Master Roster</strong> section.
                </p>
                <button
                  onClick={() => setSelectedDateStr(null)}
                  style={{ marginTop: 16, padding: "8px 18px", borderRadius: 10, background: "#2563EB", color: "#fff", border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  OK
                </button>
              </div>
            ) : (
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                
                {/* Shift Selector */}
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: t.sub, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                    Select Shift Type
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {shifts.map(sh => (
                      <button
                        key={sh.id}
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
                          transition: "all .15s",
                        }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: sh.color }} />
                        {sh.code}
                      </button>
                    ))}
                    <button
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
                      Unassign
                    </button>
                  </div>
                </div>

                {/* Start & End Times */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: t.sub, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                      Start Time
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="time"
                        value={selectedRowInfo.row.startTime}
                        disabled={selectedRowInfo.row.shift === "F"}
                        onChange={e => handleUpdateField("startTime", e.target.value)}
                        style={inputStyle(t, selectedRowInfo.row.shift === "F")}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: t.sub, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
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
                  <label style={{ fontSize: 11, fontWeight: 700, color: t.sub, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
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
                  <label style={{ fontSize: 11, fontWeight: 700, color: t.sub, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                    Location
                  </label>
                  <div style={{ position: "relative" }}>
                    <MapPin size={14} style={{ position: "absolute", left: 12, top: 12, color: t.sub }} />
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
                  <label style={{ fontSize: 11, fontWeight: 700, color: t.sub, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                    Notes
                  </label>
                  <div style={{ position: "relative" }}>
                    <AlignLeft size={14} style={{ position: "absolute", left: 12, top: 12, color: t.sub }} />
                    <input
                      type="text"
                      value={selectedRowInfo.row.notes}
                      placeholder="e.g. Handover details, tasks..."
                      onChange={e => handleUpdateField("notes", e.target.value)}
                      style={{ ...inputStyle(t), paddingLeft: 34 }}
                    />
                  </div>
                </div>

                {/* Overnight Warning */}
                {selectedRowInfo.row.startTime && selectedRowInfo.row.endTime && isON(selectedRowInfo.row.startTime, selectedRowInfo.row.endTime) && (
                  <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(217,119,6,.08)", border: "1px solid #D97706", color: "#D97706", fontSize: 11, fontWeight: 600 }}>
                    🌙 Overnight shift detected.
                  </div>
                )}
                
                {/* Save & Dismiss Actions */}
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button
                    onClick={() => setSelectedDateStr(null)}
                    style={{ flex: 1, padding: "11px", borderRadius: 12, background: "#2563EB", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                  >
                    Save & Close
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const navBtnStyle = (t) => ({
  background: "none",
  border: "none",
  cursor: "pointer",
  color: t.sub,
  padding: 6,
  borderRadius: 8,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all .15s",
  hover: { background: t.cardHov }
});

const inputStyle = (t, disabled = false) => ({
  width: "100%",
  padding: "9px 13px",
  borderRadius: 10,
  border: `1.5px solid ${t.inputBdr}`,
  background: t.inputBg,
  color: t.inputTxt,
  fontSize: 13,
  fontFamily: "'DM Sans',sans-serif",
  outline: "none",
  opacity: disabled ? 0.45 : 1,
  pointerEvents: disabled ? "none" : "auto",
});
