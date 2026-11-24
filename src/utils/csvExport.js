import { calcHrs } from "./rosterHelpers.js";

const escapeCSV = (field) => {
  const str = field == null ? "" : String(field);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportRosterToCSV = (roster, shifts) => {
  if (!Array.isArray(roster) || roster.length === 0) return;

  const headers = [
    "Date",
    "Day",
    "Shift Code",
    "Shift Title",
    "Start Time",
    "End Time",
    "Hours",
    "Hourly Rate",
    "Total Pay",
    "Location",
    "Notes",
  ];

  const rows = roster.map((r) => {
    const sh = (shifts || []).find((s) => s.code === r.shift);
    const hrs = r.startTime && r.endTime ? calcHrs(r.startTime, r.endTime) : 0;
    const rate = sh && !sh.isOff ? Number(sh.hourlyRate) || 0 : 0;
    const totalPay = (hrs * rate).toFixed(2);

    return [
      escapeCSV(r.date),
      escapeCSV(r.day),
      escapeCSV(r.shift),
      escapeCSV(r.eventTitle || sh?.title || ""),
      escapeCSV(r.startTime),
      escapeCSV(r.endTime),
      escapeCSV(hrs > 0 ? hrs.toFixed(2) : ""),
      escapeCSV(rate > 0 ? rate : ""),
      escapeCSV(hrs > 0 && rate > 0 ? totalPay : ""),
      escapeCSV(r.location || ""),
      escapeCSV(r.notes || ""),
    ].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\r\n");
  // UTF-8 BOM \uFEFF for seamless Excel encoding support
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `skyroster-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};
