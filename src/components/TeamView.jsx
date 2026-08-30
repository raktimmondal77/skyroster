import { useState } from "react";
import { Users, Copy, CheckCircle, Plus, LogIn, Download } from "lucide-react";
import toast from "react-hot-toast";
import { createTeam, joinTeam } from "../utils/teamSync.js";
import { buildTeamICS } from "../utils/rosterHelpers.js";
import ConfirmDialog from "./ConfirmDialog.jsx";

export default function TeamView({ t, roster, teamId, setTeamId, userName, setUserName, teamData }) {
  const [nameInput, setNameInput] = useState(userName);
  const [joinCode, setJoinCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);

  const handleCreate = async () => {
    if (!nameInput.trim()) {
      toast.error("Please enter your name");
      return setError("Please enter your name");
    }
    setError("");
    setLoading(true);
    try {
      const newTeamId = await createTeam("My Team", nameInput.trim(), roster);
      setUserName(nameInput.trim());
      setTeamId(newTeamId);
      toast.success(`Team created! Code: ${newTeamId}`);
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Failed to create team");
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!nameInput.trim()) {
      toast.error("Please enter your name");
      return setError("Please enter your name");
    }
    if (!joinCode.trim()) {
      toast.error("Please enter a Team Code");
      return setError("Please enter a Team Code");
    }
    setError("");
    setLoading(true);
    try {
      await joinTeam(joinCode.trim().toUpperCase(), nameInput.trim(), roster);
      setUserName(nameInput.trim());
      setTeamId(joinCode.trim().toUpperCase());
      toast.success("Joined team successfully!");
    } catch (err) {
      setError(err.message);
      toast.error(err.message || "Failed to join team");
    }
    setLoading(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(teamId);
    setCopied(true);
    toast.success("Team code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const leaveTeam = () => {
    setTeamId("");
    toast.success("Left team");
  };

  const handleExportTeam = () => {
    if (!teamData || !teamData.members) {
      toast.error("No team members found to export");
      return;
    }
    const icsContent = buildTeamICS(teamData);
    if (!icsContent) {
      toast.error("No active shifts to export");
      return;
    }
    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `team-${teamId}-roster.ics`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Team calendar exported!");
  };

  return (
    <div className="anim-fade-up" style={{ maxWidth: 600, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 className="sora" style={{ fontSize: 28, fontWeight: 900, color: t.text, letterSpacing: "-0.6px" }}>Team Sync</h2>
        <p style={{ fontSize: 14, color: t.sub, marginTop: 6 }}>Sync your roster with your team in real-time.</p>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(220, 38, 38, 0.1)", color: "#DC2626", fontSize: 13, fontWeight: 600, border: "1px solid rgba(220, 38, 38, 0.2)" }}>
          {error}
        </div>
      )}

      {!teamId ? (
        <div style={{ background: t.card, border: `1px solid ${t.cardBdr}`, borderRadius: 20, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,.03)" }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: t.sub, textTransform: "uppercase", display: "block", marginBottom: 8 }}>Your Name</label>
            <input
              type="text"
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              placeholder="e.g. John Doe"
              style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: `1.5px solid ${t.inputBdr}`, background: t.inputBg, color: t.inputTxt, fontSize: 14, outline: "none" }}
            />
          </div>

          <div style={{ display: "flex", gap: 16, flexDirection: "column" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <input
                type="text"
                value={joinCode}
                onChange={e => setJoinCode(e.target.value)}
                placeholder="Team Code (e.g. A7X9K)"
                style={{ flex: 1, padding: "12px 16px", borderRadius: 12, border: `1.5px solid ${t.inputBdr}`, background: t.inputBg, color: t.inputTxt, fontSize: 14, textTransform: "uppercase", outline: "none" }}
              />
              <button
                onClick={handleJoin}
                disabled={loading}
                className="btn-hover"
                style={{ padding: "12px 20px", borderRadius: 12, background: "#10B981", color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}
              >
                <LogIn size={18} /> Join
              </button>
            </div>
            
            <div style={{ textAlign: "center", color: t.sub, fontSize: 12, fontWeight: 600 }}>OR</div>
            
            <button
              onClick={handleCreate}
              disabled={loading}
              className="btn-hover"
              style={{ width: "100%", padding: "14px", borderRadius: 12, background: "#2563EB", color: "#fff", border: "none", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <Plus size={18} /> Create New Team
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Active Team Card */}
          <div style={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)", borderRadius: 20, padding: 24, color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 10px 25px rgba(37,99,235,0.3)" }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.8, textTransform: "uppercase", letterSpacing: 0.5 }}>Your Team Code</div>
              <div className="mono" style={{ fontSize: 32, fontWeight: 800, marginTop: 4, letterSpacing: 2 }}>{teamId}</div>
            </div>
            <button
              onClick={copyCode}
              style={{ background: "rgba(255,255,255,0.2)", border: "none", borderRadius: 12, padding: "12px", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s" }}
            >
              {copied ? <CheckCircle size={24} /> : <Copy size={24} />}
            </button>
          </div>

          {/* Members List */}
          <div style={{ background: t.card, border: `1px solid ${t.cardBdr}`, borderRadius: 20, padding: 24, boxShadow: "0 4px 20px rgba(0,0,0,.03)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 className="sora" style={{ fontSize: 16, fontWeight: 800, color: t.text, display: "flex", alignItems: "center", gap: 8 }}>
                <Users size={18} color="#2563EB" /> Team Members
              </h3>
              <span style={{ fontSize: 12, fontWeight: 700, background: "#EEF2FF", color: "#2563EB", padding: "4px 10px", borderRadius: 99 }}>
                {teamData?.members ? Object.keys(teamData.members).length : 1}
              </span>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {teamData?.members && Object.keys(teamData.members).map(member => (
                <div key={member} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 12, background: t.is ? "#131C2D" : "#F8FAFC", border: `1px solid ${t.tBdr}` }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#2563EB", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                    {member.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>
                    {member} {member === userName && <span style={{ fontSize: 11, color: t.sub, fontWeight: 500 }}>(You)</span>}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button
                onClick={handleExportTeam}
                className="btn-hover"
                style={{ flex: 1, padding: "12px", borderRadius: 12, background: "#10B981", color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
              >
                <Download size={16} /> Export Team ICS
              </button>
              <button
                onClick={() => setShowLeaveDialog(true)}
                style={{ flex: 1, padding: "12px", borderRadius: 12, background: "transparent", color: "#DC2626", border: "1px dashed #DC2626", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
              >
                Leave Team
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        t={t}
        isOpen={showLeaveDialog}
        title="Leave this Team?"
        message="You will disconnect from this team's roster sync. You can always rejoin later if you have the 6-character code."
        confirmLabel="Leave Team"
        onConfirm={leaveTeam}
        onClose={() => setShowLeaveDialog(false)}
      />
    </div>
  );
}
