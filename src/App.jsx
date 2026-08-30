import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, ClipboardList, Calendar as CalendarIcon, Users, Settings as SettingsIcon } from "lucide-react";
import Sidebar from "./components/Sidebar.jsx";
import Header from "./components/Header.jsx";
import DashboardView from "./components/DashboardView.jsx";
import CalendarView from "./components/CalendarView.jsx";
import RosterView from "./components/RosterView.jsx";
import ShiftsView from "./components/ShiftsView.jsx";
import ExportView from "./components/ExportView.jsx";
import SettingsView from "./components/SettingsView.jsx";
import LandingView from "./components/LandingView.jsx";
import DonateModal from "./components/DonateModal.jsx";
import SuccessModal from "./components/SuccessModal.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import AuthSplash from "./components/AuthSplash.jsx";
import TeamView from "./components/TeamView.jsx";
import ShortcutsModal from "./components/ShortcutsModal.jsx";
import WelcomeModal from "./components/WelcomeModal.jsx";
import { useHotkeys } from "react-hotkeys-hook";
import toast from "react-hot-toast";
import { trackEvent } from "./utils/analytics.js";
import { subscribeToTeam, syncMyRoster } from "./utils/teamSync.js";
import { auth } from "./utils/firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import { signInWithGoogle, logoutUser, loadRosterFromCloud, saveRosterToCloud } from "./utils/authSync.js";
import { buildICS } from "./utils/rosterHelpers.js";
import { useAppStore, DEFAULT_SHIFTS } from "./store/useAppStore.js";

/* ────────── THEMES ────────── */
const T = (d) => ({
  is: d,
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
  tBdr: d ? "#1C2740" : "#E6ECF6",
  accent: d ? "#3B82F6" : "#2563EB",
  accentSoft: d ? "rgba(59,130,246,.15)" : "#EFF6FF",
});

function AppLayout({ t, downloadICS, onOpenDonate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [showShortcuts, setShowShortcuts] = useState(false);

  const {
    dark,
    setDark,
    mobOpen,
    setMobOpen,
    roster,
    shifts,
    startDate,
    endDate,
    setStartDate,
    setEndDate,
    generateRoster,
    updateEntry,
    applyDetectedPattern,
    detectPattern,
    rangeError,
    setShifts,
    setRoster,
    teamId,
    setTeamId,
    userName,
    setUserName,
    teamData,
    user,
    showDonateModal,
    setShowDonateModal,
    showSuccessModal,
    setShowSuccessModal,
    bmcUser,
    paypalUser,
    upiId,
  } = useAppStore();

  // Navigation Hotkeys
  useHotkeys("g+d", () => navigate("/dashboard"));
  useHotkeys("g+r", () => navigate("/roster"));
  useHotkeys("g+c", () => navigate("/calendar"));
  useHotkeys("g+t", () => navigate("/team"));
  useHotkeys("g+s", () => navigate("/shifts"));
  useHotkeys("g+e", () => navigate("/export"));
  useHotkeys("g+,", () => navigate("/settings"));
  useHotkeys("d", () => setDark(!dark));
  useHotkeys("shift+?", () => setShowShortcuts(true));
  useHotkeys("?", () => setShowShortcuts(true));

  const currentView = location.pathname.replace("/", "") || "dashboard";

  const handleSetView = (viewId) => {
    if (viewId === "landing") navigate("/");
    else navigate(`/${viewId}`);
  };

  const modals = (
    <>
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
        onOpenDonate={onOpenDonate}
      />
      <ShortcutsModal
        t={t}
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </>
  );

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
      <Sidebar
        view={currentView}
        setView={handleSetView}
        dark={dark}
        setDark={setDark}
        t={t}
        open={mobOpen}
        setOpen={setMobOpen}
        setShowDonateModal={onOpenDonate}
      />
      <div
        className="main-content"
        style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}
      >
        <style>{`@media(min-width:768px){.main-content{margin-left:248px}}`}</style>
        <Header
          t={t}
          roster={roster}
          downloadICS={downloadICS}
          mobOpen={mobOpen}
          setMobOpen={setMobOpen}
          onOpenShortcuts={() => setShowShortcuts(true)}
        />
        <main style={{ flex: 1, padding: "28px 32px", overflowY: "auto", position: "relative" }}>
          <ErrorBoundary key={location.pathname}>
            <Routes>
              <Route
                path="/dashboard"
                element={<DashboardView t={t} roster={roster} shifts={shifts} setView={handleSetView} />}
              />
              <Route
                path="/calendar"
                element={
                  <CalendarView
                    t={t}
                    roster={roster}
                    shifts={shifts}
                    updateEntry={updateEntry}
                    teamData={teamData}
                    userName={userName}
                  />
                }
              />
              <Route
                path="/team"
                element={
                  <TeamView
                    t={t}
                    roster={roster}
                    teamId={teamId}
                    setTeamId={setTeamId}
                    userName={userName}
                    setUserName={setUserName}
                    teamData={teamData}
                  />
                }
              />
              <Route
                path="/roster"
                element={
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
                }
              />
              <Route
                path="/shifts"
                element={<ShiftsView t={t} shifts={shifts} setShifts={setShifts} />}
              />
              <Route
                path="/export"
                element={<ExportView t={t} roster={roster} shifts={shifts} downloadICS={downloadICS} />}
              />
              <Route
                path="/settings"
                element={
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
                }
              />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav
        className="mobile-bottom-nav"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 60,
          background: t.card,
          borderTop: `1px solid ${t.cardBdr}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          zIndex: 80,
          backdropFilter: "blur(10px)",
        }}
      >
        <style>{`
          @media(min-width: 768px) {
            .mobile-bottom-nav { display: none !important; }
          }
          @media(max-width: 767px) {
            main { padding-bottom: 80px !important; }
          }
        `}</style>
        {[
          { id: "dashboard", label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
          { id: "roster", label: "Roster", path: "/roster", icon: ClipboardList },
          { id: "calendar", label: "Calendar", path: "/calendar", icon: CalendarIcon },
          { id: "team", label: "Team", path: "/team", icon: Users },
          { id: "settings", label: "Settings", path: "/settings", icon: SettingsIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              style={{
                background: "none",
                border: "none",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                color: active ? "#2563EB" : t.sub,
                cursor: "pointer",
                padding: "6px 12px",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 10,
                fontWeight: active ? 800 : 500,
              }}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {modals}
    </div>
  );
}

function MainApp() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    dark,
    setDark,
    roster,
    setRoster,
    shifts,
    teamId,
    userName,
    setTeamData,
    user,
    setUser,
    authLoading,
    setAuthLoading,
    setShowDonateModal,
    setShowSuccessModal,
    bmcUser,
    paypalUser,
    upiId,
    showDonateModal,
    showSuccessModal,
    hasSeenWelcome,
    completeWelcome,
  } = useAppStore();

  const t = useMemo(() => T(dark), [dark]);

  // Firebase Auth listener
  useEffect(() => {
    if (!auth) {
      setTimeout(() => setAuthLoading(false), 0);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const cloudRoster = await loadRosterFromCloud(currentUser.uid);
        if (cloudRoster && cloudRoster.length > 0) {
          setRoster(cloudRoster);
          if (location.pathname === "/") {
            navigate("/dashboard");
          }
        }
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [location.pathname, navigate, setAuthLoading, setRoster, setUser]);

  // Team Real-time Subscription
  useEffect(() => {
    if (!teamId) {
      setTeamData(null);
      return;
    }
    return subscribeToTeam(teamId, setTeamData);
  }, [teamId, setTeamData]);

  // Self-heal corrupted shifts
  useEffect(() => {
    if (!Array.isArray(shifts)) {
      setShifts(DEFAULT_SHIFTS);
    }
  }, [shifts, setShifts]);

  // Debounced Cloud & Team Sync
  const syncTimerRef = useRef(null);
  useEffect(() => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);

    syncTimerRef.current = setTimeout(() => {
      if (teamId && userName && roster.length > 0) {
        syncMyRoster(teamId, userName, roster);
      }
      if (user && roster.length > 0) {
        saveRosterToCloud(user.uid, roster);
      }
    }, 800);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [roster, teamId, userName, user]);

  useEffect(() => {
    trackEvent("page_view");
  }, []);

  const handleOpenDonateModal = useCallback(() => {
    trackEvent("support_creator_view");
    setShowDonateModal(true);
  }, [setShowDonateModal]);

  // Skip landing page if local roster exists
  useEffect(() => {
    if (!authLoading && roster.length > 0 && location.pathname === "/") {
      navigate("/dashboard", { replace: true });
    }
  }, [roster, location.pathname, navigate, authLoading]);

  const triggerDownloadICS = useCallback(() => {
    const assignedShifts = roster.filter((r) => r.shift && r.shift !== "F" && r.startTime);
    if (assignedShifts.length === 0) {
      toast.error("No active shifts to export. Schedule some shifts first!");
      return;
    }

    try {
      trackEvent("export_ics", { count: assignedShifts.length });
      const blob = new Blob([buildICS(roster, shifts)], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "smart-shift-roster.ics";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Calendar exported successfully!");

      setTimeout(() => {
        setShowSuccessModal(true);
      }, 800);
    } catch {
      toast.error("Calendar export failed — please try again.");
    }
  }, [roster, shifts, setShowSuccessModal]);

  if (authLoading) return <AuthSplash dark={dark} />;

  // Landing Page standalone route
  if (location.pathname === "/" || location.pathname === "/landing") {
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
        <LandingView
          t={t}
          setView={(v) => (v === "landing" ? navigate("/") : navigate(`/${v}`))}
          dark={dark}
          setDark={setDark}
          setShowDonateModal={handleOpenDonateModal}
        />
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
        {!hasSeenWelcome && (
          <WelcomeModal 
            t={t} 
            onClose={completeWelcome} 
          />
        )}
      </div>
    );
  }

  return (
    <AppLayout
      t={t}
      downloadICS={triggerDownloadICS}
      onOpenDonate={handleOpenDonateModal}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <MainApp />
    </BrowserRouter>
  );
}
