import { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  LayoutDashboard,
  ClipboardList,
  Calendar,
  Users,
  Clock,
  Download,
  Settings,
  Sun,
  Moon,
  Sparkles,
  ArrowRight,
  X,
} from "lucide-react";

export default function CommandPalette({
  isOpen,
  onClose,
  setView,
  dark,
  setDark,
  downloadICS,
  t,
}) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [prevQuery, setPrevQuery] = useState(query);
  const inputRef = useRef(null);

  if (prevQuery !== query) {
    setPrevQuery(query);
    setSelectedIndex(0);
  }

  const actions = useMemo(() => [
    { id: "dash", title: "Go to Dashboard", category: "Navigation", icon: LayoutDashboard, shortcut: "G D", run: () => setView("dashboard") },
    { id: "roster", title: "Open Master Roster", category: "Navigation", icon: ClipboardList, shortcut: "G R", run: () => setView("roster") },
    { id: "cal", title: "Open Calendar View", category: "Navigation", icon: Calendar, shortcut: "G C", run: () => setView("calendar") },
    { id: "team", title: "View Team Schedule", category: "Navigation", icon: Users, shortcut: "G T", run: () => setView("team") },
    { id: "shifts", title: "Configure Shift Types & Wages", category: "Navigation", icon: Clock, shortcut: "G S", run: () => setView("shifts") },
    { id: "export", title: "Export Schedule (.ics / .csv)", category: "Actions", icon: Download, shortcut: "G E", run: () => setView("export") },
    { id: "settings", title: "App Settings & Backup", category: "Navigation", icon: Settings, shortcut: "G ,", run: () => setView("settings") },
    { id: "theme", title: dark ? "Switch to Light Mode" : "Switch to Dark Mode", category: "Actions", icon: dark ? Sun : Moon, shortcut: "D", run: () => setDark(!dark) },
    { id: "quick_ics", title: "Download Calendar File Now", category: "Actions", icon: Download, run: () => downloadICS() },
  ], [setView, dark, setDark, downloadICS]);

  const filtered = useMemo(() => {
    if (!query.trim()) return actions;
    const q = query.toLowerCase();
    return actions.filter(
      (a) => a.title.toLowerCase().includes(q) || a.category.toLowerCase().includes(q)
    );
  }, [actions, query]);


  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].run();
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, filtered, selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "14vh",
        paddingLeft: 16,
        paddingRight: 16,
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(6px)",
        }}
      />

      <div
        className="anim-scale"
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: 540,
          background: t.card,
          border: `1.5px solid ${t.cardBdr}`,
          borderRadius: 18,
          boxShadow: "0 20px 60px rgba(0,0,0,.35)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "14px 18px",
            borderBottom: `1px solid ${t.tBdr}`,
            gap: 12,
          }}
        >
          <Search size={18} color={t.accent} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or jump to view..."
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              fontSize: 14,
              color: t.text,
              fontFamily: "'Inter', sans-serif",
            }}
          />
          <span
            style={{
              fontSize: 11,
              padding: "2px 6px",
              borderRadius: 6,
              background: t.is ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              color: t.sub,
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            ESC
          </span>
          <button
            onClick={onClose}
            aria-label="Close command palette"
            style={{ background: "none", border: "none", color: t.sub, cursor: "pointer", display: "flex" }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ maxHeight: 340, overflowY: "auto", padding: "8px 10px" }}>
          {filtered.length === 0 ? (
            <div style={{ padding: "28px 16px", textAlign: "center", color: t.sub, fontSize: 13 }}>
              No commands found for "{query}"
            </div>
          ) : (
            filtered.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    item.run();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: 10,
                    cursor: "pointer",
                    background: isSelected ? t.accentSoft : "transparent",
                    color: isSelected ? t.accent : t.text,
                    transition: "all 120ms ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <Icon size={16} color={isSelected ? t.accent : t.sub} />
                    <span style={{ fontSize: 13, fontWeight: isSelected ? 600 : 500 }}>
                      {item.title}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {item.shortcut && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 6px",
                          borderRadius: 6,
                          background: t.is ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                          color: t.sub,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      >
                        {item.shortcut}
                      </span>
                    )}
                    {isSelected && <ArrowRight size={14} color={t.accent} />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div
          style={{
            padding: "8px 16px",
            borderTop: `1px solid ${t.tBdr}`,
            background: t.tHead,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 11,
            color: t.sub,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Sparkles size={12} color={t.accent} />
            <span>Linear + Amie Command Engine</span>
          </div>
          <span>↑↓ Navigate · ↵ Select</span>
        </div>
      </div>
    </div>
  );
}
