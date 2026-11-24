import { useEffect } from "react";
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Download,
  Settings,
  Sun,
  Moon,
  Heart,
  Users,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "roster",    label: "Master Roster", icon: ClipboardList },
  { id: "calendar",  label: "Calendar", icon: Calendar },
  { id: "team",      label: "Team Sync", icon: Users },
  { id: "shifts",    label: "Shift Config", icon: Clock },
  { id: "export",    label: "Export", icon: Download },
  { id: "settings",  label: "Settings", icon: Settings },
];

export default function Sidebar({
  view,
  setView,
  dark,
  setDark,
  t,
  open,
  setOpen,
  setShowDonateModal,
  collapsed,
  setCollapsed,
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const width = collapsed ? 68 : 240;

  return (
    <>
      {/* Mobile Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.6)",
            zIndex: 90,
            backdropFilter: "blur(4px)",
          }}
        />
      )}

      <style>{`
        @media(min-width: 768px) {
          .sidebar-shell {
            transform: translateX(0) !important;
          }
        }
      `}</style>

      <aside
        className="sidebar-shell"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width,
          background: t.sidebar,
          borderRight: `1px solid ${t.sBdr}`,
          display: "flex",
          flexDirection: "column",
          zIndex: 100,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          transition: "width 200ms cubic-bezier(0.16, 1, 0.3, 1), transform 240ms ease",
          boxShadow: "0 0 24px rgba(0,0,0,0.02)",
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: collapsed ? "18px 12px" : "18px 18px",
            borderBottom: `1px solid ${t.sBdr}`,
            display: "flex",
            alignItems: "center",
            justifyContent: collapsed ? "center" : "space-between",
            minHeight: 65,
          }}
        >
          <div
            onClick={() => setView("dashboard")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              cursor: "pointer",
              minWidth: 0,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 14px rgba(37,99,235,.35)",
                flexShrink: 0,
              }}
            >
              <span className="jakarta" style={{ fontWeight: 900, fontSize: 16, color: "#fff" }}>
                S
              </span>
            </div>
            {!collapsed && (
              <div style={{ overflow: "hidden", whiteSpace: "nowrap" }}>
                <div className="jakarta" style={{ fontWeight: 800, fontSize: 14, color: t.text, letterSpacing: "-0.3px" }}>
                  SkyRoster
                </div>
                <div style={{ fontSize: 10, color: t.sub, fontWeight: 600, letterSpacing: 0.8, textTransform: "uppercase" }}>
                  Pro Planner
                </div>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="desk-only"
              aria-label="Collapse sidebar"
              style={{
                background: "none",
                border: "none",
                color: t.sub,
                cursor: "pointer",
                padding: 4,
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronLeft size={16} />
            </button>
          )}
        </div>

        {/* Collapsed Expand Trigger (Desktop) */}
        {collapsed && (
          <div style={{ display: "flex", justifyContent: "center", padding: "8px 0" }} className="desk-only">
            <button
              onClick={() => setCollapsed(false)}
              aria-label="Expand sidebar"
              style={{
                background: t.is ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                border: `1px solid ${t.cardBdr}`,
                color: t.sub,
                cursor: "pointer",
                width: 28,
                height: 28,
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}

        {/* Navigation Items */}
        <nav style={{ flex: 1, padding: collapsed ? "12px 8px 0" : "14px 10px 0", overflowY: "auto" }}>
          {NAV_ITEMS.map((n) => {
            const Icon = n.icon;
            const active = view === n.id;
            return (
              <button
                key={n.id}
                className="btn-press"
                aria-current={active ? "page" : undefined}
                title={collapsed ? n.label : undefined}
                onClick={() => {
                  setView(n.id);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: collapsed ? "center" : "flex-start",
                  gap: 12,
                  padding: collapsed ? "10px 0" : "9px 12px",
                  borderRadius: 10,
                  border: active
                    ? `1px solid ${t.is ? "rgba(59,130,246,0.3)" : "rgba(37,99,235,0.2)"}`
                    : "1px solid transparent",
                  cursor: "pointer",
                  background: active ? (t.is ? "rgba(59,130,246,.12)" : "#EFF6FF") : "transparent",
                  color: active ? (t.is ? "#60A5FA" : "#2563EB") : t.sub,
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  marginBottom: 3,
                  fontFamily: "'Inter', sans-serif",
                  textAlign: "left",
                  transition: "all 140ms ease",
                }}
              >
                <Icon size={18} style={{ opacity: active ? 1 : 0.7, flexShrink: 0 }} />
                {!collapsed && <span style={{ flex: 1 }}>{n.label}</span>}
                {!collapsed && active && (
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: t.accent,
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div
          style={{
            padding: collapsed ? "12px 8px" : "14px 12px",
            borderTop: `1px solid ${t.sBdr}`,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <button
            className="btn-press"
            onClick={() => setShowDonateModal(true)}
            title={collapsed ? "Support Creator" : undefined}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "flex-start",
              gap: 10,
              padding: collapsed ? "10px 0" : "9px 12px",
              borderRadius: 10,
              border: `1px solid ${t.is ? "rgba(239,68,68,0.2)" : "rgba(239,68,68,0.15)"}`,
              cursor: "pointer",
              background: t.is ? "rgba(239,68,68,0.08)" : "#FEF2F2",
              color: "#EF4444",
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <Heart size={16} fill="#EF4444" color="#EF4444" style={{ flexShrink: 0 }} />
            {!collapsed && <span>Support Creator</span>}
          </button>

          <button
            className="btn-press"
            role="switch"
            aria-checked={dark}
            aria-label="Toggle dark mode"
            title={collapsed ? (dark ? "Light Mode" : "Dark Mode") : undefined}
            onClick={() => setDark(!dark)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: collapsed ? "center" : "space-between",
              gap: 10,
              padding: collapsed ? "10px 0" : "9px 12px",
              borderRadius: 10,
              border: `1px solid ${t.cardBdr}`,
              cursor: "pointer",
              background: t.is ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
              color: t.sub,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {dark ? <Sun size={16} color="#FBBF24" /> : <Moon size={16} color="#6366F1" />}
              {!collapsed && <span>{dark ? "Light Mode" : "Dark Mode"}</span>}
            </div>

            {!collapsed && (
              <div
                aria-hidden
                style={{
                  width: 30,
                  height: 16,
                  borderRadius: 99,
                  background: dark ? "#3B82F6" : "#CBD5E1",
                  position: "relative",
                  transition: "background 150ms ease",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 2,
                    left: dark ? 16 : 2,
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: "#fff",
                    boxShadow: "0 1px 3px rgba(0,0,0,.25)",
                    transition: "left 150ms ease",
                  }}
                />
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
