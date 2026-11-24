import { Component } from "react";
import { trackEvent } from "../utils/analytics.js";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("SkyRoster Component Error:", error, info);
    try {
      trackEvent("app_error", {
        message: error?.message || "Unknown error",
        stack: error?.stack?.slice(0, 250) || "",
      });
    } catch {
      // Ignore analytics failure
    }
  }

  handleEmergencyExport = () => {
    try {
      const raw = localStorage.getItem("skyroster-storage");
      if (!raw) {
        alert("No saved data found in browser storage.");
        return;
      }
      const blob = new Blob([raw], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `skyroster-emergency-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export backup: " + err.message);
    }
  };

  handleResetData = () => {
    if (window.confirm("Reset schedule data to recover? Any unsaved edits will be cleared.")) {
      localStorage.removeItem("skyroster-storage");
      window.location.href = "/";
    }
  };

  render() {
    if (this.state.hasError) {
      const isDark =
        typeof document !== "undefined" &&
        (document.body.dataset.dark === "true" ||
          window.matchMedia?.("(prefers-color-scheme: dark)").matches);

      const textColor = isDark ? "#EAF0FF" : "#0A1628";
      const subColor = isDark ? "#8A99B5" : "#64748B";
      const cardBg = isDark ? "#0D1526" : "#FFFFFF";
      const bdrColor = isDark ? "#1C2740" : "#E2E8F0";

      return (
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            textAlign: "center",
            fontFamily: "'DM Sans', sans-serif",
            color: textColor,
          }}
        >
          <div
            style={{
              background: cardBg,
              border: `1px solid ${bdrColor}`,
              borderRadius: 20,
              padding: "32px 28px",
              maxWidth: 440,
              width: "100%",
              boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
            <h2
              style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: 20,
                fontWeight: 800,
                marginBottom: 8,
                color: textColor,
              }}
            >
              Something went wrong
            </h2>
            <p
              style={{
                color: subColor,
                fontSize: 13,
                marginBottom: 20,
                wordBreak: "break-word",
                lineHeight: 1.5,
              }}
            >
              {this.state.error?.message || "An unexpected error occurred while rendering."}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                style={{
                  background: "#2563EB",
                  color: "#fff",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 16px",
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 13,
                }}
              >
                Reload Application
              </button>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={this.handleEmergencyExport}
                  style={{
                    flex: 1,
                    background: "transparent",
                    color: "#2563EB",
                    border: `1.5px solid ${bdrColor}`,
                    borderRadius: 10,
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  Save Backup
                </button>
                <button
                  onClick={this.handleResetData}
                  style={{
                    flex: 1,
                    background: "transparent",
                    color: "#EF4444",
                    border: "1.5px solid rgba(239,68,68,0.4)",
                    borderRadius: 10,
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 12,
                  }}
                >
                  Reset Data
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
