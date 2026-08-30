import { useState } from "react";
import { Plus, Clock } from "lucide-react";
import { isON } from "../utils/rosterHelpers";

export default function ShiftsView({ t, shifts, setShifts }) {
  const BLANK = { code: "", title: "", start: "", end: "", color: "#2563EB", isOff: false, hourlyRate: "" };
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(BLANK);

  const openAdd = () => {
    setForm(BLANK);
    setEditId(null);
    setShowForm(true);
  };
  
  const openEdit = (sh) => {
    setForm({ ...sh, hourlyRate: sh.hourlyRate !== undefined ? sh.hourlyRate : "" });
    setEditId(sh.id);
    setShowForm(true);
  };
  
  const cancel = () => {
    setShowForm(false);
    setEditId(null);
  };
  
  const save = () => {
    if (!form.code.trim() || !form.title.trim()) return;
    
    // Clean hourly rate
    const cleanedRate = form.isOff ? 0 : Number(form.hourlyRate) || 0;
    const finalForm = { ...form, hourlyRate: cleanedRate };

    if (editId) {
      setShifts(shifts.map((s) => (s.id === editId ? { ...finalForm, id: editId } : s)));
    } else {
      setShifts([...shifts, { ...finalForm, id: "s" + Date.now() }]);
    }
    cancel();
  };

  const del = (id) => {
    if (!window.confirm("Delete this shift?")) return;
    setShifts(shifts.filter((s) => s.id !== id));
  };

  return (
    <div className="anim-fade-up" style={{ display: "flex", flexDirection: "column", gap: 22, maxWidth: 820 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="sora" style={{ fontSize: 28, fontWeight: 900, color: t.text, letterSpacing: "-0.6px" }}>
            Shift Config
          </div>
          <div style={{ fontSize: 13, color: t.sub, marginTop: 5 }}>
            Define your operational shift templates and wage rates
          </div>
        </div>
        <button
          onClick={openAdd}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 22px",
            borderRadius: 11,
            background: "#2563EB",
            color: "#fff",
            border: "none",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(37,99,235,.3)",
          }}
          className="btn-hover"
        >
          <Plus size={16} />
          Add Shift
        </button>
      </div>

      {showForm && (
        <div
          className="anim-scale"
          style={{
            background: t.card,
            border: "1.5px solid rgba(37,99,235,.25)",
            borderRadius: 22,
            padding: "26px 28px",
            boxShadow: "0 12px 40px rgba(37,99,235,.12)",
          }}
        >
          <div style={{ fontWeight: 700, color: t.text, fontSize: 16, marginBottom: 20 }}>
            {editId ? "✏️ Edit Shift Template" : "✨ New Shift Profile"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))", gap: 18 }}>
            <label style={{ display: "block" }}>
              <span style={lbl(t)}>Code</span>
              <input
                value={form.code}
                onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                placeholder="e.g. M1"
                style={inputStyle(t)}
              />
            </label>
            <label style={{ display: "block" }}>
              <span style={lbl(t)}>Title</span>
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Morning Shift"
                style={inputStyle(t)}
              />
            </label>
            <label style={{ display: "block" }}>
              <span style={lbl(t)}>Color</span>
              <input
                type="color"
                aria-label="Shift color"
                value={form.color}
                onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                style={{
                  width: "100%",
                  height: 42,
                  marginTop: 6,
                  borderRadius: 10,
                  border: `1.5px solid ${t.inputBdr}`,
                  cursor: "pointer",
                  background: "none",
                }}
              />
            </label>
            <label style={{ display: "block" }}>
              <span style={lbl(t)}>Start</span>
              <input
                type="time"
                value={form.start}
                onChange={(e) => setForm((p) => ({ ...p, start: e.target.value }))}
                disabled={form.isOff}
                style={{ ...inputStyle(t), opacity: form.isOff ? 0.4 : 1 }}
              />
            </label>
            <label style={{ display: "block" }}>
              <span style={lbl(t)}>End</span>
              <input
                type="time"
                value={form.end}
                onChange={(e) => setForm((p) => ({ ...p, end: e.target.value }))}
                disabled={form.isOff}
                style={{ ...inputStyle(t), opacity: form.isOff ? 0.4 : 1 }}
              />
            </label>
            
            {/* Hourly Rate Input */}
            <label style={{ display: "block" }}>
              <span style={lbl(t)}>Hourly Rate (₹)</span>
              <div style={{ position: "relative" }}>
                <input
                  type="number"
                  value={form.hourlyRate}
                  disabled={form.isOff}
                  onChange={(e) => setForm((p) => ({ ...p, hourlyRate: e.target.value }))}
                  placeholder="e.g. 200"
                  style={{ ...inputStyle(t), opacity: form.isOff ? 0.4 : 1 }}
                />
              </div>
            </label>

            {/* Checkbox */}
            <div style={{ display: "flex", alignItems: "flex-end", paddingBottom: 2 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  padding: "10px 14px",
                  borderRadius: 10,
                  width: "100%",
                  background: t.is ? "rgba(255,255,255,.04)" : "#F1F5F9",
                  border: `1px solid ${t.cardBdr}`,
                }}
              >
                <input
                  type="checkbox"
                  checked={form.isOff}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, isOff: e.target.checked, start: "", end: "", hourlyRate: "" }))
                  }
                  style={{ width: 16, height: 16, accentColor: "#2563EB", cursor: "pointer" }}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: t.text }}>Off / Rest Day</span>
              </label>
            </div>
          </div>
          {form.start && form.end && isON(form.start, form.end) && (
            <div
              style={{
                marginTop: 16,
                padding: "10px 16px",
                borderRadius: 10,
                background: "rgba(217,119,6,.08)",
                border: "1px solid #D97706",
                color: "#D97706",
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              🌙 Overnight shift detected — end date auto-adjusts to next day on export.
            </div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
            <button
              onClick={save}
              style={{
                padding: "10px 22px",
                borderRadius: 11,
                background: "#2563EB",
                color: "#fff",
                border: "none",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(37,99,235,.3)",
              }}
              className="btn-hover"
            >
              {editId ? "Update" : "Save Profile"}
            </button>
            <button
              onClick={cancel}
              style={{
                padding: "10px 22px",
                borderRadius: 11,
                background: "transparent",
                border: `1.5px solid ${t.cardBdr}`,
                color: t.sub,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Shifts Templates Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {Array.isArray(shifts) && shifts.map((sh) => (
          <div
            key={sh.id}
            className="card-lift"
            style={{
              background: t.card,
              border: `1px solid ${t.cardBdr}`,
              borderRadius: 18,
              padding: "16px 22px",
              display: "flex",
              alignItems: "center",
              gap: 18,
              boxShadow: "0 2px 10px rgba(0,0,0,.04)",
            }}
          >
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: 14,
                background: sh.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Sora',sans-serif",
                fontWeight: 900,
                fontSize: 16,
                color: "#fff",
                boxShadow: `0 6px 16px ${sh.color}45`,
                flexShrink: 0,
              }}
            >
              {sh.code}
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: t.text }}>{sh.title}</div>
              <div style={{ fontSize: 12, color: t.sub, marginTop: 3, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span>
                  {sh.isOff ? (
                    "Rest / Off Day"
                  ) : (
                    <>
                      <Clock size={11} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
                      {sh.start} → {sh.end}
                      {isON(sh.start, sh.end) && (
                        <span style={{ color: "#D97706", fontWeight: 700 }}> · 🌙 Overnight</span>
                      )}
                    </>
                  )}
                </span>
                {!sh.isOff && (
                  <span style={{ color: "#10B981", fontWeight: 600 }}>
                    ₹{(Number(sh.hourlyRate) || 0)}/hr
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button
                onClick={() => openEdit(sh)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 9,
                  border: "none",
                  cursor: "pointer",
                  background: t.is ? "rgba(37,99,235,.15)" : "#EFF6FF",
                  color: "#2563EB",
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                Edit
              </button>
              <button
                onClick={() => del(sh.id)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 9,
                  border: "none",
                  cursor: "pointer",
                  background: t.is ? "rgba(239,68,68,.1)" : "#FEE2E2",
                  color: "#EF4444",
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const lbl = (t) => ({
  fontSize: 10,
  fontWeight: 700,
  color: t.sub,
  textTransform: "uppercase",
  letterSpacing: 0.8,
  display: "block",
});

const inputStyle = (t) => ({
  width: "100%",
  padding: "9px 13px",
  borderRadius: 10,
  border: `1.5px solid ${t.inputBdr}`,
  background: t.inputBg,
  color: t.inputTxt,
  fontSize: 13,
  fontFamily: "'DM Sans',sans-serif",
  outline: "none",
  marginTop: 6,
});
