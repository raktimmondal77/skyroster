import { useState, useEffect, useCallback, useMemo } from "react";
import Sidebar from "./components/Sidebar.jsx";
import Header from "./components/Header.jsx";
import DashboardView from "./components/DashboardView.jsx";
import RosterView from "./components/RosterView.jsx";
import ShiftsView from "./components/ShiftsView.jsx";
import ExportView from "./components/ExportView.jsx";
import SettingsView from "./components/SettingsView.jsx";
import CalendarView from "./components/CalendarView.jsx";
import LandingView from "./components/LandingView.jsx";
import DonateModal from "./components/DonateModal.jsx";
import SuccessModal from "./components/SuccessModal.jsx";
import TeamView from "./components/TeamView.jsx";
import { trackEvent } from "./utils/analytics.js";
import { subscribeToTeam, syncMyRoster } from "./utils/teamSync.js";
import { auth } from "./utils/firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import { saveRosterToCloud, loadRosterFromCloud, signInWithGoogle, logoutUser } from "./utils/authSync.js";

import {
  fmtDate,
  todayStr,
  dayFull,
  buildICS,
  detectPattern,
  genDates,
} from "./utils/rosterHelpers.js";

/* ────────── GLOBAL STYLES ────────── */
const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Sora:wght@600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    html{scroll-behavior:smooth}
    body{font-family:'DM Sans',system-ui,sans-serif}
    .mono{font-family:'JetBrains Mono',monospace}
    .sora{font-family:'Sora',sans-serif}
    :focus-visible{outline:2px solid #2563EB;outline-offset:2px;border-radius:8px}
    ::-webkit-scrollbar{width:6px;height:6px}
    ::-webkit-scrollbar-track{background:transparent}
    ::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:99px}
    [data-dark] ::-webkit-scrollbar-thumb{background:#334155}
    input[type=date]::-webkit-calendar-picker-indicator,
    input[type=time]::-webkit-calendar-picker-indicator{opacity:.5;cursor:pointer}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
    @keyframes slideR{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:translateX(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
    @keyframes glow{0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,.4)}50%{box-shadow:0 0 0 6px rgba(37,99,235,0)}}
    .anim-fade-up{animation:fadeUp .4s cubic-bezier(.22,.68,0,1.2) forwards}
    .anim-scale{animation:scaleIn .25s cubic-bezier(.22,.68,0,1.2) forwards}
    .anim-slide-r{animation:slideR .3s ease forwards}
    .nav-item{transition:all .2s ease}
    .nav-item:hover{transform:translateX(3px)}
    .card-lift{transition:transform .25s cubic-bezier(.22,.68,0,1.2),box-shadow .25s ease}
    .card-lift:hover{transform:translateY(-4px)}
    .row-hover{transition: background .15s}
    .row-hover:hover{background:rgba(37,99,235,.035)!important}
    [data-dark] .row-hover:hover{background:rgba(255,255,255,.04)!important}
    .btn-hover{transition:all .18s ease}
    .btn-hover:hover:not(:disabled){filter:brightness(1.08);transform:translateY(-1px);box-shadow:0 6px 18px rgba(37,99,235,.32)}
    .shift-pill{transition:all .15s ease}
    .shift-pill:hover{transform:translateY(-2px);box-shadow:0 6px 16px rgba(0,0,0,.12)}
    .sidebar-el{transition:transform .28s cubic-bezier(.4,0,.2,1)}
    @media(min-width:768px){.sidebar-el{transform:translateX(0)!important}}
    @media(max-width:767px){.mob-ham{display:flex!important}.desk-only{display:none!important}.hide-mob{display:none!important}}
    .gradient-text{background:linear-gradient(135deg,#2563EB 0%,#7C3AED 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .glass{backdrop-filter:blur(16px) saturate(140%)}
    .roster-table-wrap{font-size:13px}
    @media(max-width:767px){.roster-table-wrap{font-size:11px}}
  `}</style>
);

/* ────────── DEFAULT TEMPLATE SHIFTS ────────── */
const DEFAULT_SHIFTS = [
  { id: "s1", code: "M1", title: "Morning Shift", start: "06:00", end: "14:30", color: "#2563EB", isOff: false, hourlyRate: 200 },
  { id: "s2", code: "M2", title: "Mid Shift",     start: "09:00", end: "17:30", color: "#7C3AED", isOff: false, hourlyRate: 200 },
  { id: "s3", code: "E",  title: "Evening Shift", start: "14:00", end: "22:30", color: "#D97706", isOff: false, hourlyRate: 220 },
  { id: "s4", code: "N",  title: "Night Shift",   start: "20:30", end: "05:00", color: "#DC2626", isOff: false, hourlyRate: 250 },
  { id: "s5", code: "F",  title: "Off Day",       start: "",      end: "",      color: "#059669", isOff: true,  hourlyRate: 0   },
];

const STORE_VERSION = 4; // Upgraded version for rate additions and calendar support

/* ────────── THEMES ────────── */
const T = (d) => ({
  bg: d ? "#070D1A" : "#EEF2FB",
  sidebar: d ? "#0C1322" : "#FFFFFF",
  sBdr: d ? "#1C2740" : "#E6ECF6",
  card: d ? "#0D1526" : "#FFFFFF",
  cardBdr: d ? "#1C2740" : "#E8EDF7",
  cardHov: d ? "#121C32" : "#F6F9FF",
  glass: d ? "rgba(13,21,38,.6)" : "rgba(255,255,255,.6)",
  text: d ? "#EAF0FF" : "#0A1628",
  sub: d ? "#7488AE" : "#5A6E92",
  inputBg: d ? "#060C18" : "#FFFFFF",
  inputBdr: d ? "#26314F" : "#D0D9EA",
  inputTxt: d ? "#EAF0FF" : "#0A1628",
  tHead: d ? "#060C18" : "#F4F7FF",
  tBdr: d ? "#19243A" : "#ECF0FA",
  tag: d ? "#19243A" : "#EEF2FF",
  is: d,
});

/* ────────── LOCAL STORAGE LOADERS ────────── */
const loadStore = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.__v === STORE_VERSION && "data" in parsed) return parsed.data;
    // Handle migration from old storage schema if version mismatch
    if (parsed && parsed.__v === 3 && "data" in parsed) {
      if (key === "ssrp_shifts") {
        // inject hourly rate to old shifts
        return parsed.data.map(s => {
          const matched = DEFAULT_SHIFTS.find(ds => ds.code === s.code);
          return { ...s, hourlyRate: matched ? matched.hourlyRate : 0 };
        });
      }
      return parsed.data;
    }
    return fallback;
  } catch {
    return fallback;
  }
};

const saveStore = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify({ __v: STORE_VERSION, data }));
  } catch (e) {
    console.error(e);
  }
};

export default function App() {
  const [view, setView] = useState(() => {
    const existingRoster = loadStore("ssrp_roster", []);
    return existingRoster.length > 0 ? "dashboard" : "landing";
  });
  const [dark, setDark] = useState(() => loadStore("ssrp_dark", false));
  const [mobOpen, setMobOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rangeError, setRangeError] = useState("");
  const [shifts, setShifts] = useState(() => loadStore("ssrp_shifts", DEFAULT_SHIFTS));
  const [roster, setRoster] = useState(() => loadStore("ssrp_roster", []));
  const [bmcUser, setBmcUser] = useState(() => loadStore("ssrp_bmc", ""));
  const [paypalUser, setPaypalUser] = useState(() => loadStore("ssrp_paypal", "https://www.paypal.com/ncp/payment/8CHC5VF72GMEU"));
  const [upiId, setUpiId] = useState(() => loadStore("ssrp_upi", "9883059530@upi"));
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [teamId, setTeamId] = useState(() => loadStore("ssrp_team_id", ""));
  const [userName, setUserName] = useState(() => loadStore("ssrp_user_name", ""));
  const [teamData, setTeamData] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!auth) { setAuthLoading(false); return; }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Load roster from cloud on login
        const cloudRoster = await loadRosterFromCloud(currentUser.uid);
        if (cloudRoster && cloudRoster.length > 0) {
          setRoster(cloudRoster);
          setView("dashboard");
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    saveStore("ssrp_team_id", teamId);
  }, [teamId]);
  useEffect(() => {
    saveStore("ssrp_user_name", userName);
  }, [userName]);

  useEffect(() => {
    if (teamId) {
      return subscribeToTeam(teamId, setTeamData);
    } else {
      setTimeout(() => setTeamData(null), 0);
    }
  }, [teamId]);

  useEffect(() => {
    // Sync to Team
    if (teamId && userName && roster.length > 0) {
      syncMyRoster(teamId, userName, roster);
    }
    // Sync to Cloud
    if (user && roster.length > 0) {
      saveRosterToCloud(user.uid, roster);
    }
  }, [roster, teamId, userName, user]);

  useEffect(() => {
    saveStore("ssrp_shifts", shifts);
  }, [shifts]);
  useEffect(() => {
    saveStore("ssrp_roster", roster);
  }, [roster]);
  useEffect(() => {
    saveStore("ssrp_dark", dark);
  }, [dark]);
  useEffect(() => {
    saveStore("ssrp_bmc", bmcUser);
  }, [bmcUser]);
  useEffect(() => {
    saveStore("ssrp_paypal", paypalUser);
  }, [paypalUser]);
  useEffect(() => {
    saveStore("ssrp_upi", upiId);
  }, [upiId]);

  useEffect(() => {
    trackEvent("page_view");
  }, []);

  const handleOpenDonateModal = () => {
    trackEvent("support_creator_view");
    setShowDonateModal(true);
  };

  const t = useMemo(() => T(dark), [dark]);

  const generateRoster = useCallback(() => {
    if (!startDate || !endDate) return;
    if (startDate > endDate) {
      setRangeError("Start date must be on or before the end date.");
      return;
    }
    setRangeError("");
    trackEvent("generate_roster", { startDate, endDate });
    const dates = genDates(startDate, endDate);
    const map = {};
    roster.forEach((r) => {
      map[r.date] = r;
    });
    setRoster(
      dates.map(
        (date) =>
          map[date] || {
            date,
            day: dayFull(date),
            shift: "",
            startTime: "",
            endTime: "",
            eventTitle: "",
            location: "",
            notes: "",
          }
      )
    );
  }, [startDate, endDate, roster]);

  const updateEntry = useCallback(
    (idx, field, value) => {
      setRoster((prev) => {
        const next = [...prev];
        const row = { ...next[idx], [field]: value };
        if (field === "shift") {
          const sh = shifts.find((s) => s.code === value);
          if (sh) {
            row.startTime = sh.isOff ? "" : sh.start;
            row.endTime = sh.isOff ? "" : sh.end;
            row.eventTitle = sh.title;
          }
        }
        next[idx] = row;
        return next;
      });
    },
    [shifts]
  );

  // Apply detected cycle to all empty days (non-destructive)
  const applyDetectedPattern = useCallback(
    (cycle) => {
      if (!cycle || !cycle.length) return;
      setRoster((prev) => {
        const firstIdx = prev.findIndex((r) => r.shift);
        if (firstIdx < 0) return prev;
        return prev.map((r, i) => {
          if (r.shift || i < firstIdx) return r;
          const code = cycle[(i - firstIdx) % cycle.length];
          const sh = shifts.find((s) => s.code === code);
          if (!sh) return r;
          return {
            ...r,
            shift: code,
            startTime: sh.isOff ? "" : sh.start,
            endTime: sh.isOff ? "" : sh.end,
            eventTitle: sh.title,
          };
        });
      });
    },
    [shifts]
  );

  const triggerDownloadICS = () => {
    trackEvent("export_ics", { count: roster.filter((r) => r.shift).length });
    const blob = new Blob([buildICS(roster, shifts)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "smart-shift-roster.ics";
    a.click();
    URL.revokeObjectURL(url);

    // Show thank you support modal trigger after 800ms
    setTimeout(() => {
      setShowSuccessModal(true);
    }, 800);
  };

  const VIEWS = {
    landing: (
      <LandingView
        t={t}
        setView={setView}
        dark={dark}
        setDark={setDark}
        setShowDonateModal={handleOpenDonateModal}
      />
    ),
    dashboard: <DashboardView t={t} roster={roster} shifts={shifts} setView={setView} />,
    calendar: <CalendarView t={t} roster={roster} shifts={shifts} updateEntry={updateEntry} teamData={teamData} userName={userName} />,
    team: <TeamView t={t} roster={roster} teamId={teamId} setTeamId={setTeamId} userName={userName} setUserName={setUserName} teamData={teamData} />,
    roster: (
      <RosterView
        t={t}
        roster={roster}
        shifts={shifts}
        startDate={startDate}
        endDate={endDate}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        generateRoster={generateRoster}
        updateEntry={updateEntry}
        applyDetectedPattern={applyDetectedPattern}
        rangeError={rangeError}
        detectPattern={detectPattern}
      />
    ),
    shifts: <ShiftsView t={t} shifts={shifts} setShifts={setShifts} />,
    export: <ExportView t={t} roster={roster} shifts={shifts} downloadICS={triggerDownloadICS} />,
    settings: (
      <SettingsView
        t={t}
        dark={dark}
        setDark={setDark}
        setRoster={setRoster}
        setShifts={setShifts}
        DEFAULT_SHIFTS={DEFAULT_SHIFTS}
        user={user}
        signInWithGoogle={signInWithGoogle}
        logoutUser={logoutUser}
      />
    ),
  };

  if (view === "landing") {
    return (
      <div
        data-dark={dark || undefined}
        style={{
          minHeight: "100vh",
          background: t.bg,
          color: t.text,
          transition: "background .25s",
          padding: "32px 24px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          overflowX: "hidden",
        }}
      >
        <GlobalStyle />
        {VIEWS.landing}
        <DonateModal
          t={t}
          isOpen={showDonateModal}
          onClose={() => setShowDonateModal(false)}
          bmcUser={bmcUser}
          paypalUser={paypalUser}
          upiId={upiId}
        />
        <SuccessModal
          t={t}
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          onOpenDonate={handleOpenDonateModal}
        />
      </div>
    );
  }

  return (
    <div
      data-dark={dark || undefined}
      style={{
        minHeight: "100vh",
        background: t.bg,
        fontFamily: "'DM Sans',sans-serif",
        display: "flex",
        transition: "background .25s",
      }}
    >
      <GlobalStyle />
      <Sidebar
        view={view}
        setView={setView}
        dark={dark}
        setDark={setDark}
        t={t}
        open={mobOpen}
        setOpen={setMobOpen}
        setShowDonateModal={handleOpenDonateModal}
      />
      <div
        className="main-content"
        style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}
      >
        <style>{`@media(min-width:768px){.main-content{margin-left:248px}}`}</style>
        <Header
          t={t}
          roster={roster}
          downloadICS={triggerDownloadICS}
          mobOpen={mobOpen}
          setMobOpen={setMobOpen}
        />
        <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto" }}>{VIEWS[view]}</main>
      </div>
      <DonateModal
        t={t}
        isOpen={showDonateModal}
        onClose={() => setShowDonateModal(false)}
        bmcUser={bmcUser}
        paypalUser={paypalUser}
        upiId={upiId}
      />
      <SuccessModal
        t={t}
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        onOpenDonate={handleOpenDonateModal}
      />
    </div>
  );
}
