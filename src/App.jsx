import { useState, useEffect, useRef, useMemo, useCallback, lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { LayoutDashboard, ClipboardList, Calendar as CalendarIcon, Users, Settings as SettingsIcon } from "lucide-react";
import Sidebar from "./components/Sidebar.jsx";
import Header from "./components/Header.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import AuthSplash from "./components/AuthSplash.jsx";
import { useHotkeys } from "react-hotkeys-hook";
import toast from "react-hot-toast";
import { trackEvent } from "./utils/analytics.js";
import { subscribeToTeam, syncMyRoster } from "./utils/teamSync.js";
import { auth } from "./utils/firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import { signInWithGoogle, logoutUser, loadRosterFromCloud, saveRosterToCloud } from "./utils/authSync.js";
import { buildICS } from "./utils/rosterHelpers.js";
import { useAppStore, DEFAULT_SHIFTS } from "./store/useAppStore.js";

// Lazy-loaded Views
const DashboardView = lazy(() => import("./components/DashboardView.jsx"));
const CalendarView  = lazy(() => import("./components/CalendarView.jsx"));
const RosterView    = lazy(() => import("./components/RosterView.jsx"));
const ShiftsView    = lazy(() => import("./components/ShiftsView.jsx"));
const ExportView    = lazy(() => import("./components/ExportView.jsx"));
const SettingsView  = lazy(() => import("./components/SettingsView.jsx"));
const LandingView   = lazy(() => import("./components/LandingView.jsx"));
const TeamView      = lazy(() => import("./components/TeamView.jsx"));

// Lazy-loaded Modals
const DonateModal    = lazy(() => import("./components/DonateModal.jsx"));
const SuccessModal   = lazy(() => import("./components/SuccessModal.jsx"));
const ShortcutsModal = lazy(() => import("./components/ShortcutsModal.jsx"));
const WelcomeModal   = lazy(() => import("./components/WelcomeModal.jsx"));

/* ────────── THEME CONFIG ────────── */
const T = (dark) => ({
  is: dark,
  bg: dark ? "#070D1A" : "#EEF2FB",
  sidebar: dark ? "#0C1322" : "#FFFFFF",
  sBdr: dark ? "#1C2740" : "#E6ECF6",
  card: dark ? "#0D1526" : "#FFFFFF",
  cardBdr: dark ? "#1C2740" : "#E8EDF7",
  cardHov: dark ? "#121C32" : "#F6F9FF",
  text: dark ? "#EAF0FF" : "#0A1628",
  sub: dark ? "#7488AE" : "#5A6E92",
  inputBg: dark ? "#060C18" : "#FFFFFF",
  inputBdr: dark ? "#26314F" : "#D0D9EA",
  inputTxt: dark ? "#EAF0FF" : "#0A1628",
  tHead: dark ? "#060C18" : "#F4F7FF",
  tBdr: dark ? "#1C2740" : "#E6ECF6",
  accent: dark ? "#3B82F6" : "#2563EB",
  accentSoft: dark ? "rgba(59,130,246,.12)" : "rgba(37,99,235,.08)",
  tag: dark ? "#1C2740" : "#E8EDF7",
});

function RouteLoader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "45vh" }}>
      <div style={{ width: 28, height: 28, borderRadius: "50%", border: "3px solid #2563EB", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
    </div>
  );
}

function AppLayout({ t, downloadICS, onOpenDonate }) {
  const navigate = useNavigate();
  const location = useLocation();

  const dark = useAppStore((s) => s.dark);
  const setDark = useAppStore((s) => s.setDark);
  const mobOpen = useAppStore((s) => s.mobOpen);
  const setMobOpen = useAppStore((s) => s.setMobOpen);
  const roster = useAppStore((s) => s.roster);
  const setRoster = useAppStore((s) => s.setRoster);
  const shifts = useAppStore((s) => s.shifts);
  const setShifts = useAppStore((s) => s.setShifts);
  const startDate = useAppStore((s) => s.startDate);
  const setStartDate = useAppStore((s) => s.setStartDate);
  const endDate = useAppStore((s) => s.endDate);
  const setEndDate = useAppStore((s) => s.setEndDate);
  const rangeError = useAppStore((s) => s.rangeError);
  const teamId = useAppStore((s) => s.teamId);
  const setTeamId = useAppStore((s) => s.setTeamId);
  const userName = useAppStore((s) => s.userName);
  const setUserName = useAppStore((s) => s.setUserName);
  const teamData = useAppStore((s) => s.teamData);
  const user = useAppStore((s) => s.user);
  const showDonateModal = useAppStore((s) => s.showDonateModal);
  const setShowDonateModal = useAppStore((s) => s.setShowDonateModal);
  const showSuccessModal = useAppStore((s) => s.showSuccessModal);
  const setShowSuccessModal = useAppStore((s) => s.setShowSuccessModal);
  const bmcUser = useAppStore((s) => s.bmcUser);
  const paypalUser = useAppStore((s) => s.paypalUser);
  const upiId = useAppStore((s) => s.upiId);
  const generateRoster = useAppStore((s) => s.generateRoster);
  const updateEntry = useAppStore((s) => s.updateEntry);
  const applyDetectedPattern = useAppStore((s) => s.applyDetectedPattern);
  const detectPattern = useAppStore((s) => s.detectPattern);
  const syncStatus = useAppStore((s) => s.syncStatus);

  const [showShortcuts, setShowShortcuts] = useState(false);

  const currentView = useMemo(() => {
    const path = location.pathname.replace("/", "");
    return path || "dashboard";
  }, [location.pathname]);

  const handleSetView = useCallback((v) => {
    if (v === "landing") {
      navigate("/");
    } else {
      navigate(`/${v}`);
    }
  }, [navigate]);

  // Keyboard navigation shortcuts
  useHotkeys("g+d", () => handleSetView("dashboard"), { preventDefault: true });
  useHotkeys("g+r", () => handleSetView("roster"), { preventDefault: true });
  useHotkeys("g+c", () => handleSetView("calendar"), { preventDefault: true });
  useHotkeys("g+s", () => handleSetView("shifts"), { preventDefault: true });
  useHotkeys("g+e", () => handleSetView("export"), { preventDefault: true });
  useHotkeys("g+,", () => handleSetView("settings"), { preventDefault: true });
  useHotkeys("d", () => setDark(!dark));
  useHotkeys("shift+?", () => setShowShortcuts((s) => !s));

  return (
    <div
      data-dark={dark || undefined}
      style={{
        display: "flex",
        minHeight: "100vh",
        background: t.bg,
        color: t.text,
        transition: "background .25s",
      }}
    >
      {/* Skip link for keyboard accessibility */}
      <a
        href="#main-content"
        style={{
          position: "absolute",
          top: -100,
          left: 16,
          background: "#2563EB",
          color: "#fff",
          padding: "8px 16px",
          borderRadius: 8,
          fontWeight: 700,
          zIndex: 99999,
          textDecoration: "none",
        }}
        onFocus={(e) => (e.currentTarget.style.top = "12px")}
        onBlur={(e) => (e.currentTarget.style.top = "-100px")}
      >
        Skip to main content
      </a>

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
          syncStatus={syncStatus}
        />

        <main id="main-content" tabIndex={-1} style={{ flex: 1, padding: "24px 28px", overflowY: "auto", position: "relative" }}>
          <ErrorBoundary key={location.pathname}>
            <Suspense fallback={<RouteLoader />}>
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
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="mobile-bottom-nav"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "calc(58px + var(--safe-bottom))",
          paddingBottom: "var(--safe-bottom)",
          background: t.card,
          borderTop: `1px solid ${t.cardBdr}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          zIndex: 80,
          backdropFilter: "blur(12px)",
        }}
      >
        <style>{`
          @media(min-width: 768px) {
            .mobile-bottom-nav { display: none !important; }
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
              aria-label={tab.label}
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

      {/* Lazy Modals */}
      <Suspense fallback={null}>
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
      </Suspense>
    </div>
  );
}

function MainApp() {
  const navigate = useNavigate();
  const location = useLocation();

  const dark = useAppStore((s) => s.dark);
  const setDark = useAppStore((s) => s.setDark);
  const roster = useAppStore((s) => s.roster);
  const setRoster = useAppStore((s) => s.setRoster);
  const shifts = useAppStore((s) => s.shifts);
  const setShifts = useAppStore((s) => s.setShifts);
  const teamId = useAppStore((s) => s.teamId);
  const userName = useAppStore((s) => s.userName);
  const setTeamData = useAppStore((s) => s.setTeamData);
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const authLoading = useAppStore((s) => s.authLoading);
  const setAuthLoading = useAppStore((s) => s.setAuthLoading);
  const setShowDonateModal = useAppStore((s) => s.setShowDonateModal);
  const setShowSuccessModal = useAppStore((s) => s.setShowSuccessModal);
  const hasSeenWelcome = useAppStore((s) => s.hasSeenWelcome);
  const completeWelcome = useAppStore((s) => s.completeWelcome);
  const setSyncStatus = useAppStore((s) => s.setSyncStatus);
  const showDonateModal = useAppStore((s) => s.showDonateModal);
  const showSuccessModal = useAppStore((s) => s.showSuccessModal);
  const bmcUser = useAppStore((s) => s.bmcUser);
  const paypalUser = useAppStore((s) => s.paypalUser);
  const upiId = useAppStore((s) => s.upiId);

  const t = useMemo(() => T(dark), [dark]);

  // Online / Offline Status Awareness
  useEffect(() => {
    const handleOnline = () => {
      toast.success("Back online!", { id: "online-status" });
    };
    const handleOffline = () => {
      toast("You are currently offline. Edits save locally.", { icon: "📶", id: "online-status" });
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Firebase Auth listener with offline safety timeout (NO location.pathname dependency!)
  useEffect(() => {
    if (!auth) {
      setTimeout(() => setAuthLoading(false), 0);
      return;
    }

    let isDone = false;
    const safetyTimeout = setTimeout(() => {
      if (!isDone) {
        isDone = true;
        setAuthLoading(false);
      }
    }, 3500);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const cloudRoster = await loadRosterFromCloud(currentUser.uid);
          if (cloudRoster && cloudRoster.length > 0) {
            setRoster(cloudRoster);
          }
        } catch (e) {
          console.warn("Could not load cloud roster on startup:", e);
        }
      }
      if (!isDone) {
        isDone = true;
        clearTimeout(safetyTimeout);
        setAuthLoading(false);
      }
    });

    return () => {
      clearTimeout(safetyTimeout);
      unsubscribe();
    };
  }, [setAuthLoading, setRoster, setUser]);

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
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip initial false-dirty alert on mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!user && !teamId) {
      setSyncStatus("saved");
      return;
    }

    if (roster.length > 0) setSyncStatus("unsaved");

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);

    syncTimerRef.current = setTimeout(async () => {
      setSyncStatus("syncing");
      try {
        const promises = [];
        if (teamId && userName && roster.length > 0) {
          promises.push(syncMyRoster(teamId, userName, roster));
        }
        if (user && roster.length > 0) {
          promises.push(saveRosterToCloud(user.uid, roster));
        }
        
        if (promises.length > 0) {
          await Promise.all(promises);
        }
        setSyncStatus("saved");
      } catch (error) {
        console.error("Cloud sync failed:", error);
        setSyncStatus("error");
      }
    }, 800);

    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [roster, teamId, userName, user, setSyncStatus]);

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
      a.download = `skyroster-${new Date().toISOString().slice(0, 10)}.ics`;
      a.click();
      URL.revokeObjectURL(url);
      setShowSuccessModal(true);
    } catch (e) {
      console.error(e);
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
        <Suspense fallback={<RouteLoader />}>
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
        </Suspense>
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
