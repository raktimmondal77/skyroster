import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("SkyRoster crashed:", error, info);
    // Optionally: trackEvent("app_error", { msg: error.message });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "50vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
          textAlign: "center",
          fontFamily: "'DM Sans',sans-serif",
        }}>
          <h2 style={{ fontFamily: "'Sora',sans-serif", marginBottom: 8 }}>
            Something went wrong
          </h2>
          <p style={{ color: "#7488AE", marginBottom: 16 }}>
            {this.state.error?.message ?? "Unexpected error"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              background: "#2563EB", color: "white",
              border: "none", borderRadius: 8,
              padding: "10px 20px", cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
