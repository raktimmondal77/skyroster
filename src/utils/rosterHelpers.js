export const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const fmtDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const genDates = (s, e) => {
  if (!s || !e || s > e) return [];
  const out = [];
  const cur = new Date(s + "T00:00:00");
  const end = new Date(e + "T00:00:00");
  while (cur <= end) {
    out.push(fmtDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
};

export const dayFull = (ds) => DAYS_FULL[new Date(ds + "T00:00:00").getDay()];
export const dayShort = (ds) => DAYS_SHORT[new Date(ds + "T00:00:00").getDay()];
export const todayStr = () => fmtDate(new Date());

export const isON = (s, e, is24Hour = false) => {
  if (!s || !e) return false;
  const [sh, sm] = s.split(":").map(Number);
  const [eh, em] = e.split(":").map(Number);
  if (is24Hour && sh === eh && sm === em) return true;
  return eh < sh || (eh === sh && em < sm);
};

export const calcHrs = (s, e, is24Hour = false) => {
  if (!s || !e) return 0;
  const [sh, sm] = s.split(":").map(Number);
  const [eh, em] = e.split(":").map(Number);
  let h = (eh + em / 60) - (sh + sm / 60);
  if (h < 0) {
    h += 24;
  } else if (h === 0 && is24Hour) {
    h = 24;
  }
  return Math.round(h * 100) / 100;
};

export const fmtDayFull = (ds) =>
  new Date(ds + "T00:00:00").toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

/* RFC5545 text escaping */
export const esc = (v = "") =>
  String(v)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");

/**
 * Folds lines to max 75 octets according to RFC 5545 §3.1
 */
export const foldLine = (line) => {
  const MAX_LEN = 75;
  if (line.length <= MAX_LEN) return line;
  let result = "";
  let cur = line;
  while (cur.length > MAX_LEN) {
    result += cur.slice(0, MAX_LEN) + "\r\n ";
    cur = cur.slice(MAX_LEN);
  }
  return result + cur;
};

/**
 * Formats local date and time into floating RFC 5545 format (YYYYMMDDTHHMMSS)
 */
export const toFloatingICS = (dateStr, timeStr) => {
  const cleanDate = dateStr.replace(/-/g, "");
  const cleanTime = timeStr.replace(/:/g, "") + "00";
  return `${cleanDate}T${cleanTime}`;
};

/* Shift Classification Utilities */
export const isWorkShift = (shiftCode, shifts) => {
  if (!shiftCode) return false;
  const sh = (shifts || []).find((s) => s.code === shiftCode);
  return Boolean(sh && !sh.isOff);
};

export const isRestDay = (shiftCode, shifts) => {
  if (!shiftCode) return true;
  const sh = (shifts || []).find((s) => s.code === shiftCode);
  return !sh || Boolean(sh.isOff);
};

export const isNightShift = (shiftCode, shifts, startTime, endTime) => {
  if (startTime && endTime && isON(startTime, endTime)) return true;
  const sh = (shifts || []).find((s) => s.code === shiftCode);
  if (!sh) return false;
  return sh.code === "N" || /night|nocturnal|graveyard/i.test(sh.title || "");
};

/* ICS Builder */
export const buildICS = (roster, shifts) => {
  const nowStamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SkyRoster//Smart Shift Planner v4.0//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:SkyRoster Schedule",
  ];

  roster.forEach((r, idx) => {
    if (!r.shift) return;
    const sh = shifts.find((s) => s.code === r.shift);
    if (!sh || sh.isOff || !r.startTime || !r.endTime) return;

    const dtStart = toFloatingICS(r.date, r.startTime);
    let endDateStr = r.date;
    if (isON(r.startTime, r.endTime)) {
      const d = new Date(r.date + "T00:00:00");
      d.setDate(d.getDate() + 1);
      endDateStr = fmtDate(d);
    }
    const dtEnd = toFloatingICS(endDateStr, r.endTime);
    const uid = `${r.date}-${idx}-${r.shift}@skyroster.app`;

    const eventLines = [
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${nowStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${esc(r.eventTitle || sh.title || r.shift)}`,
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
    ];

    if (r.location) eventLines.push(`LOCATION:${esc(r.location)}`);
    if (r.notes) eventLines.push(`DESCRIPTION:${esc(r.notes)}`);

    eventLines.push("END:VEVENT");
    lines.push(...eventLines);
  });

  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n");
};

/* Team ICS Builder */
export const buildTeamICS = (teamData, shifts = []) => {
  const nowStamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SkyRoster//Smart Shift Planner v4.0//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:SkyRoster Team Schedule",
  ];
  
  if (!teamData || !teamData.members) return "";
  
  Object.keys(teamData.members).forEach(member => {
    const roster = teamData.members[member];
    if (!Array.isArray(roster)) return;

    roster.forEach((r, idx) => {
      if (!r.shift || !r.startTime || !r.endTime) return;
      const sh = (shifts || []).find((s) => s.code === r.shift);
      if (sh && sh.isOff) return;
      
      const dtStart = toFloatingICS(r.date, r.startTime);
      let endDateStr = r.date;
      if (isON(r.startTime, r.endTime)) {
        const d = new Date(r.date + "T00:00:00");
        d.setDate(d.getDate() + 1);
        endDateStr = fmtDate(d);
      }
      const dtEnd = toFloatingICS(endDateStr, r.endTime);
      const memberSlug = member.replace(/[^a-zA-Z0-9]/g, '');
      const uid = `${memberSlug}-${r.date}-${idx}-${r.shift}@skyroster.app`;

      const eventLines = [
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${nowStamp}`,
        `DTSTART:${dtStart}`,
        `DTEND:${dtEnd}`,
        `SUMMARY:${esc(member + ": " + (r.eventTitle || sh?.title || r.shift))}`,
        "STATUS:CONFIRMED",
        "TRANSP:OPAQUE",
      ];
      if (r.location) eventLines.push(`LOCATION:${esc(r.location)}`);
      if (r.notes) eventLines.push(`DESCRIPTION:${esc(r.notes)}`);
      eventLines.push("END:VEVENT");
      lines.push(...eventLines);
    });
  });
  
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n");
};

/* Earnings Calculation */
export const calcEarnings = (roster, shifts) => {
  let total = 0;
  if (!Array.isArray(roster) || !Array.isArray(shifts)) return 0;
  roster.forEach((r) => {
    if (!r.shift) return;
    const sh = shifts.find((s) => s.code === r.shift);
    if (!sh || sh.isOff) return;
    const hrs = calcHrs(r.startTime, r.endTime);
    const rate = Number(sh.hourlyRate) || 0;
    total += hrs * rate;
  });
  return Math.round(total * 100) / 100;
};

/* Conflict & Fatigue Checking */
export const checkConflicts = (roster, shifts) => {
  const warnings = [];
  if (!Array.isArray(roster) || roster.length < 2) return warnings;

  // Sort roster by date
  const sorted = [...roster]
    .filter((r) => r && r.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  // 1. Fatigue check: consecutive calendar work days
  let consecutiveWorkDays = 0;
  let lastWorkDate = null;

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    const sh = (shifts || []).find((s) => s.code === entry.shift);
    const isWork = Boolean(entry.shift && sh && !sh.isOff);

    if (isWork) {
      if (!lastWorkDate) {
        consecutiveWorkDays = 1;
      } else {
        const prevTime = new Date(lastWorkDate + "T12:00:00").getTime();
        const currTime = new Date(entry.date + "T12:00:00").getTime();
        const diffDays = Math.round((currTime - prevTime) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          consecutiveWorkDays++;
        } else {
          // Calendar gap resets the streak
          consecutiveWorkDays = 1;
        }
      }
      lastWorkDate = entry.date;

      if (consecutiveWorkDays >= 7) {
        warnings.push({
          type: "fatigue",
          date: entry.date,
          msg: `Fatigue Warning: working ${consecutiveWorkDays} consecutive days without a rest day.`,
        });
      }
    } else {
      consecutiveWorkDays = 0;
      lastWorkDate = null;
    }

    // 2. Short Rest & Collision check (turnaround check)
    if (i < sorted.length - 1) {
      const nextEntry = sorted[i + 1];
      const nextSh = (shifts || []).find((s) => s.code === nextEntry.shift);
      
      const currentIsWork = isWork && entry.startTime && entry.endTime;
      const nextIsWork = nextEntry.shift && nextSh && !nextSh.isOff && nextEntry.startTime && nextEntry.endTime;

      if (currentIsWork && nextIsWork) {
        const currentEnd = new Date(entry.date + "T" + entry.endTime + ":00");
        if (isON(entry.startTime, entry.endTime)) {
          currentEnd.setDate(currentEnd.getDate() + 1);
        }

        const nextStart = new Date(nextEntry.date + "T" + nextEntry.startTime + ":00");
        const restHrs = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60 * 60);

        if (restHrs < 0) {
          // ACTIVE SHIFT COLLISION / OVERLAP
          warnings.push({
            type: "collision",
            date: nextEntry.date,
            msg: `Shift overlap conflict: Shift on ${nextEntry.date} starts ${Math.abs(restHrs).toFixed(1)}h before previous shift ends!`,
          });
        } else if (restHrs < 11) {
          // SHORT TURNAROUND VIOLATION (< 11h rest)
          warnings.push({
            type: "rest",
            date: nextEntry.date,
            msg: `Short turnaround rest: Only ${restHrs.toFixed(1)}h rest between shift ${entry.shift} (${entry.endTime}) and next shift ${nextEntry.shift} (${nextEntry.startTime}).`,
          });
        }
      }
    }
  }

  return warnings;
};
