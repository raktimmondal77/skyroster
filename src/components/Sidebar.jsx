import { LayoutDashboard, Calendar, Clock, Download, Settings, Sun, Moon, Home, SlidersHorizontal } from "lucide-react";

const NAV_ITEMS = [
  { id: "landing",   label: "Welcome Home", icon: Home },
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "calendar",  label: "Calendar View", icon: Calendar },
  { id: "roster",    label: "Master Roster", icon: Clock },
  { id: "shifts",    label: "Shift Config", icon: SlidersHorizontal },
  { id: "export",    label: "Export",       icon: Download },
  { id: "settings",  label: "Settings",     icon: Settings },
];

export default function Sidebar({ view, setView, dark, setDark, t, open, setOpen }) {
  return (
    <>
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.5)",
            zIndex: 90,
            backdropFilter: "blur(4px)",
          }}
        />
      )}
      <aside
        className="sidebar-el"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: 248,
          background: t.sidebar,
          borderRight: `1px solid ${t.sBdr}`,
          display: "flex",
          flexDirection: "column",
          zIndex: 100,
          transform: open ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <div style={{ padding: "22px 22px 18px", borderBottom: `1px solid ${t.sBdr}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 13,
                background: "linear-gradient(135deg,#2563EB,#7C3AED)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 6px 18px rgba(37,99,235,.35)",
              }}
            >
              <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 900, fontSize: 20, color: "#fff" }}>S</span>
            </div>
            <div>
              <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 14, color: t.text, letterSpacing: "-0.3px" }}>Smart Shift</div>
              <div style={{ fontSize: 10, color: t.sub, marginTop: 1, textTransform: "uppercase", letterSpacing: 1.2, fontWeight: 600 }}>Roster Planner</div>
            </div>
          </div>
        </div>
        <nav style={{ flex: 1, padding: "14px 12px 0", overflowY: "auto" }}>
          {NAV_ITEMS.map((n) => {
            const Icon = n.icon;
            const active = view === n.id;
            return (
              <button
                key={n.id}
                className="nav-item"
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  setView(n.id);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "11px 14px",
                  borderRadius: 12,
                  border: "none",
                  cursor: "pointer",
                  background: active ? (t.is ? "rgba(37,99,235,.18)" : "#EFF6FF") : "transparent",
                  color: active ? "#2563EB" : t.sub,
                  fontSize: 13,
                  fontWeight: active ? 700 : 500,
                  marginBottom: 3,
                  fontFamily: "'DM Sans',sans-serif",
                  textAlign: "left",
                  boxShadow: active ? "inset 3px 0 0 #2563EB" : "none",
                }}
              >
                <Icon size={18} style={{ opacity: active ? 1 : 0.65 }} />
                {n.label}
                {active && (
                  <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#2563EB" }} />
                )}
              </button>
            );
          })}
        </nav>
        <div style={{ padding: "14px 12px 22px", borderTop: `1px solid ${t.sBdr}`, marginTop: 12 }}>
          <button
            className="nav-item"
            role="switch"
            aria-checked={dark}
            aria-label="Toggle dark mode"
            onClick={() => setDark(!dark)}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "11px 14px",
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              background: "transparent",
              color: t.sub,
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "'DM Sans',sans-serif",
              textAlign: "left",
            }}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
            {dark ? "Light Mode" : "Dark Mode"}
            <div
              aria-hidden
              style={{
                marginLeft: "auto",
                width: 36,
                height: 20,
                borderRadius: 10,
                background: dark ? "#2563EB" : "#CBD5E1",
                position: "relative",
                flexShrink: 0,
                transition: "background .2s",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 3,
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: "#fff",
                  boxShadow: "0 1px 4px rgba(0,0,0,.2)",
                  transform: dark ? "translateX(19px)" : "translateX(3px)",
                  transition: "transform .2s",
                }}
              />
            </div>
          </button>
        </div>
      </aside>
    </>
  );
}
