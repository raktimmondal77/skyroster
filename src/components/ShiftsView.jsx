import { useState } from "react";
import { Plus, Clock, Trash2, Edit3 } from "lucide-react";
import { isON } from "../utils/rosterHelpers";
import toast from "react-hot-toast";

export default function ShiftsView({ t, shifts, setShifts, roster = [], syncShiftTemplateChange }) {
  const BLANK = { code: "", title: "", start: "", end: "", color: "#2563EB", isOff: false, hourlyRate: "" };
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [formError, setFormError] = useState("");

  const openAdd = () => {
    setForm(BLANK);
    setEditId(null);
    setFormError("");
    setShowForm(true);
  };

  const openEdit = (sh) => {
    setForm({ ...sh, hourlyRate: sh.hourlyRate !== undefined ? sh.hourlyRate : "" });
    setEditId(sh.id);
    setFormError("");
    setShowForm(true);
  };

  const cancel = () => {
    setShowForm(false);
    setEditId(null);
    setFormError("");
  };

  const save = () => {
    const cleanCode = form.code.trim().toUpperCase();
    const cleanTitle = form.title.trim();

    if (!cleanCode || !cleanTitle) {
      setFormError("Shift code and title are required.");
      return;
    }

    if (shifts.some((s) => s.id !== editId && s.code.toUpperCase() === cleanCode)) {
      setFormError(`Shift code "${cleanCode}" already exists.`);
      return;
    }

    if (!form.isOff && (!form.start || !form.end)) {
      setFormError("Start and end times are required for working shifts.");
      return;
    }

    const cleanedRate = form.isOff ? 0 : Math.max(0, Number(form.hourlyRate) || 0);
    const finalForm = {
      ...form,
      code: cleanCode,
      title: cleanTitle,
      start: form.isOff ? "" : form.start,
      end: form.isOff ? "" : form.end,
      hourlyRate: cleanedRate,
    };

    if (editId) {
      const oldShift = shifts.find((s) => s.id === editId);
      setShifts(shifts.map((s) => (s.id === editId ? { ...finalForm, id: editId } : s)));
      if (oldShift && syncShiftTemplateChange) {
        syncShiftTemplateChange(oldShift.code, finalForm);
      }
      toast.success(`Updated ${cleanCode} shift template.`);
    } else {
      setShifts([...shifts, { ...finalForm, id: "s" + Date.now() }]);
      toast.success(`Added ${cleanCode} shift template.`);
    }
    cancel();
  };

  const del = (sh) => {
    const inUseCount = roster.filter((r) => r.shift === sh.code).length;
    const msg =
      inUseCount > 0
        ? `"${sh.code}" is currently assigned to ${inUseCount} day(s) in your roster. Delete this shift template anyway?`
        : `Delete "${sh.code} — ${sh.title}"?`;
    if (!window.confirm(msg)) return;
    setShifts(shifts.filter((s) => s.id !== sh.id));
  };

  return (
    <div className="anim-fade-up" style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 780 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div className="jakarta" style={{ fontSize: 24, fontWeight: 900, color: t.text, letterSpacing: "-0.5px" }}>
            Shift Types & Wages
          </div>
          <div style={{ fontSize: 12.5, color: t.sub, marginTop: 3 }}>
            Configure operational shift templates, scheduled hours, and pay rates
          </div>
        </div>
        <button
          onClick={openAdd}
          className="btn-press"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 9,
            background: t.accent,
            color: "#fff",
            border: "none",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: `0 4px 12px ${t.is ? "rgba(59,130,246,0.3)" : "rgba(37,99,235,0.25)"}`,
          }}
        >
          <Plus size={14} />
          <span>Add Shift</span>
        </button>
      </div>

      {/* Inline Form */}
      {showForm && (
        <div
          className="anim-scale"
          style={{
            background: t.card,
            border: `1.5px solid ${t.is ? "rgba(59,130,246,0.35)" : "rgba(37,99,235,0.3)"}`,
            borderRadius: 16,
            padding: "20px 22px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
          }}
        >
          <div className="jakarta" style={{ fontWeight: 800, color: t.text, fontSize: 14, marginBottom: 14 }}>
            {editId ? "Edit Shift Template" : "New Shift Template"}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 14 }}>
            <label style={{ display: "block" }}>
              <span style={lbl(t)}>Shift Code</span>
              <input
                maxLength={6}
                value={form.code}
                onChange={(e) => {
                  setFormError("");
                  setForm((p) => ({ ...p, code: e.target.value }));
                }}
                placeholder="e.g. M1"
                style={inputStyle(t)}
              />
            </label>

            <label style={{ display: "block" }}>
              <span style={lbl(t)}>Title / Duty</span>
              <input
                value={form.title}
                onChange={(e) => {
                  setFormError("");
                  setForm((p) => ({ ...p, title: e.target.value }));
                }}
                placeholder="e.g. Morning Shift"
                style={inputStyle(t)}
              />
            </label>

            <label style={{ display: "block" }}>
              <span style={lbl(t)}>Badge Color</span>
              <input
                type="color"
                aria-label="Shift color"
                value={form.color}
                onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
                style={{
                  width: "100%",
                  height: 36,
                  marginTop: 4,
                  borderRadius: 8,
                  border: `1px solid ${t.inputBdr}`,
                  cursor: "pointer",
                  background: "none",
                }}
              />
            </label>

            <label style={{ display: "block" }}>
              <span style={lbl(t)}>Start Time</span>
              <input
                type="time"
                value={form.start}
                onChange={(e) => {
                  setFormError("");
                  setForm((p) => ({ ...p, start: e.target.value }));
                }}
                disabled={form.isOff}
                style={{ ...inputStyle(t), opacity: form.isOff ? 0.4 : 1 }}
              />
            </label>

            <label style={{ display: "block" }}>
              <span style={lbl(t)}>End Time</span>
              <input
                type="time"
                value={form.end}
                onChange={(e) => {
                  setFormError("");
                  setForm((p) => ({ ...p, end: e.target.value }));
                }}
                disabled={form.isOff}
                style={{ ...inputStyle(t), opacity: form.isOff ? 0.4 : 1 }}
              />
            </label>

            <label style={{ display: "block" }}>
              <span style={lbl(t)}>Rate (₹ / hr)</span>
              <input
                type="number"
                min="0"
                step="1"
                value={form.hourlyRate}
                disabled={form.isOff}
                onChange={(e) => setForm((p) => ({ ...p, hourlyRate: e.target.value }))}
                placeholder="e.g. 250"
                style={{ ...inputStyle(t), opacity: form.isOff ? 0.4 : 1 }}
              />
            </label>

            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  padding: "8px 12px",
                  borderRadius: 8,
                  width: "100%",
                  background: t.is ? "rgba(255,255,255,.04)" : "#F1F5F9",
                  border: `1px solid ${t.cardBdr}`,
                }}
              >
                <input
                  type="checkbox"
                  checked={form.isOff}
                  onChange={(e) => {
                    setFormError("");
                    setForm((p) => ({ ...p, isOff: e.target.checked, start: "", end: "", hourlyRate: "" }));
                  }}
                  style={{ width: 14, height: 14, accentColor: t.accent, cursor: "pointer" }}
                />
                <span style={{ fontSize: 12, fontWeight: 600, color: t.text }}>Rest Day</span>
              </label>
            </div>
          </div>

          {!form.isOff && form.start && form.end && isON(form.start, form.end) && (
            <div
              style={{
                marginTop: 12,
                padding: "8px 12px",
                borderRadius: 8,
                background: "rgba(245,158,11,0.08)",
                border: "1px solid #F59E0B",
                color: "#F59E0B",
                fontSize: 11.5,
                fontWeight: 600,
              }}
            >
              🌙 Overnight shift detected — ends on following calendar date.
            </div>
          )}

          {formError && (
            <div style={{ marginTop: 10, fontSize: 11.5, color: "#EF4444", fontWeight: 600 }}>
              ⚠ {formError}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button
              onClick={save}
              className="btn-press"
              style={{
                padding: "8px 18px",
                borderRadius: 8,
                background: t.accent,
                color: "#fff",
                border: "none",
                fontWeight: 700,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              {editId ? "Update Template" : "Save Template"}
            </button>
            <button
              onClick={cancel}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                background: "transparent",
                border: `1px solid ${t.cardBdr}`,
                color: t.sub,
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Shift Templates List */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {Array.isArray(shifts) &&
          shifts.map((sh) => (
            <div
              key={sh.id}
              style={{
                background: t.card,
                border: `1px solid ${t.cardBdr}`,
                borderRadius: 14,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                {/* Micro-Glow Badge */}
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 10,
                    background: `${sh.color}18`,
                    border: `1px solid ${sh.color}45`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontWeight: 900,
                    fontSize: 14,
                    color: sh.color,
                    flexShrink: 0,
                  }}
                >
                  {sh.code}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: t.text }}>{sh.title}</div>
                  <div style={{ fontSize: 11.5, color: t.sub, marginTop: 2, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    {sh.isOff ? (
                      <span style={{ color: "#10B981", fontWeight: 600 }}>Rest / Off Day</span>
                    ) : (
                      <>
                        <span className="mono">
                          <Clock size={11} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
                          {sh.start} → {sh.end}
                        </span>
                        {isON(sh.start, sh.end) && (
                          <span style={{ color: "#F59E0B", fontWeight: 700 }}>· 🌙 Overnight</span>
                        )}
                        <span className="mono" style={{ color: "#10B981", fontWeight: 700 }}>
                          · ₹{Number(sh.hourlyRate) || 0}/hr
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => openEdit(sh)}
                  aria-label={`Edit ${sh.code}`}
                  className="btn-press"
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: `1px solid ${t.cardBdr}`,
                    cursor: "pointer",
                    background: t.is ? "rgba(255,255,255,0.04)" : "#F8FAFC",
                    color: t.text,
                    fontSize: 11,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Edit3 size={11} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => del(sh)}
                  aria-label={`Delete ${sh.code}`}
                  className="btn-press"
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "none",
                    cursor: "pointer",
                    background: "rgba(239,68,68,0.1)",
                    color: "#EF4444",
                    fontSize: 11,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Trash2 size={12} />
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
  letterSpacing: 0.6,
  display: "block",
});

const inputStyle = (t) => ({
  width: "100%",
  padding: "7px 10px",
  borderRadius: 8,
  border: `1px solid ${t.inputBdr}`,
  background: t.inputBg,
  color: t.inputTxt,
  fontSize: 12,
  fontFamily: "'Inter', sans-serif",
  outline: "none",
  marginTop: 4,
  boxSizing: "border-box",
});
