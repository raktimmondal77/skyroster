import { useState } from "react";
import { Users, Copy, CheckCircle, Plus, LogIn, Download, LogOut } from "lucide-react";
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

  const memberNames = teamData?.members ? Object.keys(teamData.members) : [];

  return (
    <div className="anim-fade-up" style={{ maxWidth: 640, margin: "0 auto", display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: teamId ? "#10B981" : "#6366F1", boxShadow: teamId ? "0 0 8px rgba(16,185,129,0.5)" : "none" }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: t.sub, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Collaboration Engine
          </span>
        </div>
        <h2 className="jakarta" style={{ fontSize: 28, fontWeight: 800, color: t.text, letterSpacing: "-0.03em" }}>
          Team Sync
        </h2>
        <p style={{ fontSize: 14, color: t.sub, marginTop: 4 }}>
          Sync work rosters in real-time with your crew and compare schedules seamlessly.
        </p>
      </div>

      {error && (
        <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(239, 68, 68, 0.08)", color: "#EF4444", fontSize: 13, fontWeight: 600, border: "1px solid rgba(239, 68, 68, 0.2)" }}>
          {error}
        </div>
      )}

      {!teamId ? (
        <div
          className="glass-card"
          style={{
            background: t.card,
            border: `1px solid ${t.cardBdr}`,
            borderRadius: 20,
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: t.sub, textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 8 }}>
              Your Display Name
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="e.g. Captain Miller"
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 12,
                border: `1px solid ${t.inputBdr}`,
                background: t.inputBg,
                color: t.inputTxt,
                fontSize: 14,
                outline: "none",
                fontWeight: 600,
                transition: "border-color 0.15s ease",
              }}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: t.sub, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Join an Existing Team
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter 8-character Code"
                maxLength={10}
                className="mono"
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: `1px solid ${t.inputBdr}`,
                  background: t.inputBg,
                  color: t.inputTxt,
                  fontSize: 15,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  outline: "none",
                }}
              />
              <button
                onClick={handleJoin}
                disabled={loading}
                className="btn-press"
                style={{
                  padding: "12px 22px",
                  borderRadius: 12,
                  background: "#10B981",
                  color: "#fff",
                  border: "none",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 2px 8px rgba(16,185,129,0.3)",
                }}
              >
                <LogIn size={16} /> Join
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "6px 0" }}>
              <div style={{ flex: 1, height: 1, background: t.cardBdr }} />
              <span style={{ color: t.sub, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>OR</span>
              <div style={{ flex: 1, height: 1, background: t.cardBdr }} />
            </div>

            <button
              onClick={handleCreate}
              disabled={loading}
              className="btn-press"
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 12,
                background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)",
                color: "#fff",
                border: "1px solid rgba(255,255,255,0.15)",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                boxShadow: "0 4px 14px rgba(79,70,229,0.35)",
              }}
            >
              <Plus size={18} /> Create New Team Code
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Active Team Hero Card */}
          <div
            style={{
              background: "linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)",
              borderRadius: 20,
              padding: "24px 28px",
              color: "#fff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              boxShadow: "0 8px 30px rgba(49,46,129,0.35)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34D399" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.75)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Active Team Code
                </span>
              </div>
              <div className="mono" style={{ fontSize: 32, fontWeight: 800, marginTop: 4, letterSpacing: "0.15em", color: "#F8FAFC" }}>
                {teamId}
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
                Share this 8-character code with your colleagues to sync
              </div>
            </div>
            <button
              onClick={copyCode}
              className="btn-press"
              title="Copy Team Code"
              style={{
                background: copied ? "#10B981" : "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: 14,
                padding: "14px",
                color: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.15s ease",
              }}
            >
              {copied ? <CheckCircle size={22} /> : <Copy size={22} />}
            </button>
          </div>

          {/* Members List Card */}
          <div
            className="glass-card"
            style={{
              background: t.card,
              border: `1px solid ${t.cardBdr}`,
              borderRadius: 20,
              padding: 24,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Users size={18} color="#6366F1" />
                <h3 className="jakarta" style={{ fontSize: 16, fontWeight: 700, color: t.text }}>
                  Connected Roster Members
                </h3>
              </div>
              <span
                className="mono"
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  background: t.is ? "rgba(99,102,241,0.15)" : "#EEF2FF",
                  color: "#6366F1",
                  padding: "4px 10px",
                  borderRadius: 99,
                  border: "1px solid rgba(99,102,241,0.25)",
                }}
              >
                {memberNames.length} {memberNames.length === 1 ? "member" : "members"}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {memberNames.map((member, idx) => {
                const isMe = member === userName;
                const colors = ["#6366F1", "#EC4899", "#10B981", "#F59E0B", "#8B5CF6", "#06B6D4"];
                const avatarColor = colors[idx % colors.length];

                return (
                  <div
                    key={member}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      borderRadius: 12,
                      background: t.is ? "#0E1526" : "#F8FAFC",
                      border: `1px solid ${t.cardBdr}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: "50%",
                          background: `${avatarColor}20`,
                          color: avatarColor,
                          border: `1px solid ${avatarColor}50`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 700,
                          fontSize: 14,
                        }}
                      >
                        {member.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: t.text, display: "flex", alignItems: "center", gap: 6 }}>
                          {member}
                          {isMe && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                padding: "2px 6px",
                                borderRadius: 4,
                                background: t.is ? "rgba(255,255,255,0.08)" : "#E2E8F0",
                                color: t.sub,
                              }}
                            >
                              YOU
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: t.sub }}>
                          {teamData?.members[member]?.length || 0} shifts logged
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 22 }}>
              <button
                onClick={handleExportTeam}
                className="btn-press"
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  background: t.is ? "rgba(16,185,129,0.15)" : "#ECFDF5",
                  color: "#059669",
                  border: "1px solid rgba(16,185,129,0.3)",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Download size={16} /> Export Team ICS
              </button>
              <button
                onClick={() => setShowLeaveDialog(true)}
                className="btn-press"
                style={{
                  flex: 1,
                  padding: "12px",
                  borderRadius: 12,
                  background: "transparent",
                  color: "#EF4444",
                  border: "1px dashed rgba(239, 68, 68, 0.4)",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <LogOut size={16} /> Leave Team
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        t={t}
        isOpen={showLeaveDialog}
        title="Leave this Team?"
        message="You will disconnect from this team's roster sync. You can always rejoin later using your team code."
        confirmLabel="Leave Team"
        onConfirm={leaveTeam}
        onClose={() => setShowLeaveDialog(false)}
      />
    </div>
  );
}
