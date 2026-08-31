export const DAYS_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const DAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const fmtDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const genDates = (s, e) => {
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

export const isON = (s, e) => {
  if (!s || !e) return false;
  const [sh, sm] = s.split(":").map(Number);
  const [eh, em] = e.split(":").map(Number);
  return eh < sh || (eh === sh && em < sm);
};

export const calcHrs = (s, e) => {
  if (!s || !e) return 0;
  const [sh, sm] = s.split(":").map(Number);
  const [eh, em] = e.split(":").map(Number);
  let h = (eh + em / 60) - (sh + sm / 60);
  if (h < 0) h += 24;
  return h;
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

/* ICS Builder */
export const buildICS = (roster, shifts) => {
  const fi = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Smart Shift Roster Planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Smart Shift Roster",
  ];
  roster.forEach((r) => {
    if (!r.shift) return;
    const sh = shifts.find((s) => s.code === r.shift);
    if (!sh || sh.isOff || !r.startTime || !r.endTime) return;
    const [sH, sM] = r.startTime.split(":").map(Number);
    const [eH, eM] = r.endTime.split(":").map(Number);
    const ds = new Date(r.date + "T00:00:00");
    ds.setHours(sH, sM, 0, 0);
    const de = new Date(r.date + "T00:00:00");
    if (isON(r.startTime, r.endTime)) de.setDate(de.getDate() + 1);
    de.setHours(eH, eM, 0, 0);
    const uid = `${r.date}-${r.shift}@ssrp`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${fi(new Date())}`,
      `DTSTART:${fi(ds)}`,
      `DTEND:${fi(de)}`,
      `SUMMARY:${esc(r.eventTitle || sh.title)}`
    );
    if (r.location) lines.push(`LOCATION:${esc(r.location)}`);
    if (r.notes) lines.push(`DESCRIPTION:${esc(r.notes)}`);
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
};

/* Team ICS Builder */
export const buildTeamICS = (teamData) => {
  const fi = (d) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Smart Shift Roster Planner//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:Team Roster",
  ];
  
  if (!teamData || !teamData.members) return "";
  
  Object.keys(teamData.members).forEach(member => {
    const roster = teamData.members[member];
    roster.forEach((r) => {
      // Skip if off or missing times
      if (!r.shift || r.shift === "F" || !r.startTime || !r.endTime) return;
      
      const [sH, sM] = r.startTime.split(":").map(Number);
      const [eH, eM] = r.endTime.split(":").map(Number);
      const ds = new Date(r.date + "T00:00:00");
      ds.setHours(sH, sM, 0, 0);
      const de = new Date(r.date + "T00:00:00");
      if (isON(r.startTime, r.endTime)) de.setDate(de.getDate() + 1);
      de.setHours(eH, eM, 0, 0);
      const uid = `${member.replace(/\s+/g, '')}-${r.date}-${r.shift}@ssrp`;
      lines.push(
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${fi(new Date())}`,
        `DTSTART:${fi(ds)}`,
        `DTEND:${fi(de)}`,
        `SUMMARY:${esc(member + ": " + (r.eventTitle || r.shift))}`
      );
      if (r.location) lines.push(`LOCATION:${esc(r.location)}`);
      if (r.notes) lines.push(`DESCRIPTION:${esc(r.notes)}`);
      lines.push("END:VEVENT");
    });
  });
  
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
};

/* Earnings Calculation */
export const calcEarnings = (roster, shifts) => {
  let total = 0;
  roster.forEach((r) => {
    if (!r.shift) return;
    const sh = shifts.find((s) => s.code === r.shift);
    if (!sh || sh.isOff) return;
    const hrs = calcHrs(r.startTime, r.endTime);
    const rate = Number(sh.hourlyRate) || 0;
    total += hrs * rate;
  });
  return total;
};

/* Conflict & Fatigue Checking */
export const checkConflicts = (roster, shifts) => {
  const warnings = [];
  if (roster.length < 2) return warnings;

  // Sort roster by date
  const sorted = [...roster].sort((a, b) => a.date.localeCompare(b.date));

  // 1. Fatigue check: consecutive work days
  let consecutiveWorkDays = 0;
  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    const sh = shifts.find((s) => s.code === entry.shift);
    const isWork = entry.shift && sh && !sh.isOff;

    if (isWork) {
      consecutiveWorkDays++;
      if (consecutiveWorkDays === 7) {
        warnings.push({
          type: "fatigue",
          date: entry.date,
          msg: `Fatigue Warning: working ${consecutiveWorkDays} consecutive days without a rest day.`,
        });
      }
    } else {
      consecutiveWorkDays = 0;
    }

    // 2. Short Rest check (turnaround check)
    if (i < sorted.length - 1) {
      const nextEntry = sorted[i + 1];
      const nextSh = shifts.find((s) => s.code === nextEntry.shift);
      
      const currentIsWork = entry.shift && sh && !sh.isOff && entry.startTime && entry.endTime;
      const nextIsWork = nextEntry.shift && nextSh && !nextSh.isOff && nextEntry.startTime && nextEntry.endTime;

      if (currentIsWork && nextIsWork) {
        // Parse current shift end date and time
        const currentEnd = new Date(entry.date + "T" + entry.endTime + ":00");
        if (isON(entry.startTime, entry.endTime)) {
          // Ends next day
          currentEnd.setDate(currentEnd.getDate() + 1);
        }

        // Parse next shift start date and time
        const nextStart = new Date(nextEntry.date + "T" + nextEntry.startTime + ":00");

        const restHrs = (nextStart - currentEnd) / (1000 * 60 * 60);

        if (restHrs >= 0 && restHrs < 11) {
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
