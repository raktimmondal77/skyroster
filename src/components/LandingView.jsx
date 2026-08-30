import { useState } from "react";
import { Sparkles, Calendar, DollarSign, ShieldAlert, Award, Moon, Sun, Heart } from "lucide-react";
import { trackEvent } from "../utils/analytics.js";

export default function LandingView({ t, setView, dark, setDark, setShowDonateModal }) {
  // Interactive Calculator State
  const [rate, setRate] = useState(250);
  const [hours, setHours] = useState(40);

  // compliance simulator state
  const [consecutiveDays, setConsecutiveDays] = useState(6);

  const estimatedMonthly = rate * hours * 4.33;
  const estimatedAnnual = estimatedMonthly * 12;

  const cardStyle = {
    background: t.card,
    border: `1px solid ${t.cardBdr}`,
    borderRadius: 24,
    padding: "28px 30px",
    boxShadow: "0 4px 20px rgba(0,0,0,.03)",
    transition: "transform .3s cubic-bezier(.22,.68,0,1.2), box-shadow .3s ease",
  };

  return (
    <div 
      className="anim-fade-up" 
      style={{ 
        display: "flex", 
        flexDirection: "column", 
        gap: 80, 
        width: "100%",
        maxWidth: 1100,
        margin: "0 auto",
        paddingBottom: 60
      }}
    >
      {/* HEADER NAVBAR */}
      <nav 
        className="glass"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 28px",
          borderRadius: 20,
          background: t.glass,
          border: `1px solid ${t.cardBdr}`,
          position: "sticky",
          top: 20,
          zIndex: 100,
          boxShadow: "0 8px 32px rgba(0,0,0,.04)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "linear-gradient(135deg,#2563EB,#7C3AED)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(37,99,235,.3)"
            }}
          >
            <span style={{ fontFamily: "'Sora',sans-serif", fontWeight: 900, fontSize: 16, color: "#fff" }}>S</span>
          </div>
          <span className="sora" style={{ fontWeight: 800, fontSize: 15, color: t.text, letterSpacing: "-0.5px" }}>
            Smart Shift
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <button
            onClick={() => setShowDonateModal(true)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#EF4444",
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12.5,
              fontWeight: 700,
              fontFamily: "'DM Sans',sans-serif"
            }}
            className="btn-hover"
          >
            <Heart size={15} fill="#EF4444" />
            Support
          </button>
          <button
            onClick={() => setDark(!dark)}
            aria-label="Toggle theme"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: t.sub,
              display: "flex",
              alignItems: "center",
              padding: 4
            }}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => {
              trackEvent("launch_planner", { location: "nav" });
              setView("dashboard");
            }}
            className="btn-hover"
            style={{
              padding: "8px 18px",
              borderRadius: 10,
              background: "linear-gradient(135deg, #2563EB, #7C3AED)",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: 12.5,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(37,99,235,.25)"
            }}
          >
            Launch Planner →
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 24, marginTop: 20 }}>
        <div 
          style={{ 
            display: "inline-flex", 
            alignItems: "center", 
            gap: 6, 
            background: t.is ? "rgba(37,99,235,.15)" : "#EFF6FF", 
            padding: "6px 16px", 
            borderRadius: 99, 
            fontSize: 12, 
            fontWeight: 700, 
            color: "#2563EB" 
          }}
        >
          <Sparkles size={13} />
          <span>Roster Planning, Smarter & Faster</span>
        </div>
        <h1 
          className="sora"
          style={{ 
            fontSize: "clamp(32px, 5vw, 56px)", 
            fontWeight: 900, 
            lineHeight: 1.15, 
            letterSpacing: "-1.8px",
            color: t.text,
            maxWidth: 800,
            margin: 0
          }}
        >
          Streamline Your Work Schedules in <span className="gradient-text">Seconds.</span>
        </h1>
        <p style={{ fontSize: "clamp(14px, 2.5vw, 17px)", color: t.sub, maxWidth: 640, lineHeight: 1.6, margin: 0 }}>
          An intelligent client-side planner designed for rotating shifts. Auto-detect work cycles, verify compliance guardrails, estimate gross pay, and export straight to your calendar.
        </p>

        <div style={{ display: "flex", gap: 14, marginTop: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={() => {
              trackEvent("launch_planner", { location: "hero" });
              setView("dashboard");
            }}
            className="btn-hover"
            style={{
              padding: "14px 32px",
              borderRadius: 14,
              background: "#2563EB",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: 14.5,
              cursor: "pointer",
              boxShadow: "0 6px 20px rgba(37,99,235,.35)"
            }}
          >
            Start Planning Free
          </button>
          <button
            onClick={() => {
              const el = document.getElementById("features");
              if (el) el.scrollIntoView({ behavior: "smooth" });
            }}
            style={{
              padding: "14px 28px",
              borderRadius: 14,
              background: "transparent",
              color: t.sub,
              border: `1.5px solid ${t.cardBdr}`,
              fontWeight: 700,
              fontSize: 14.5,
              cursor: "pointer",
              transition: "all .2s"
            }}
            className="btn-hover"
          >
            Explore Features
          </button>
        </div>

        {/* HERO MOCKUP WITH GLASS EFFECT */}
        <div 
          style={{ 
            width: "100%", 
            maxWidth: 880, 
            marginTop: 40,
            position: "relative",
            borderRadius: 24,
            padding: "8px",
            background: t.is ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.02)",
            border: `1.5px solid ${t.cardBdr}`,
            boxShadow: "0 30px 70px rgba(0,0,0,.15)",
            overflow: "hidden"
          }}
        >
          <img 
            src="/roster_dashboard_mockup.jpg" 
            alt="Smart Shift Roster Studio Mockup" 
            style={{ 
              width: "100%", 
              borderRadius: 18, 
              display: "block",
              objectFit: "cover"
            }}
          />
        </div>
      </section>

      {/* CORE FEATURES BENTO GRID */}
      <section id="features" style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        <div style={{ textAlign: "center" }}>
          <h2 className="sora" style={{ fontSize: 28, fontWeight: 900, color: t.text }}>
            Packed with Powerful Utilities
          </h2>
          <p style={{ fontSize: 14, color: t.sub, marginTop: 4 }}>
            Everything you need to master your rosters, all stored locally and secure.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
          {/* Card 1: Pattern Detection */}
          <div className="card-lift" style={cardStyle}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(124,58,237,.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#7C3AED", marginBottom: 20 }}>
              <Sparkles size={20} />
            </div>
            <h3 className="sora" style={{ fontSize: 16, fontWeight: 800, color: t.text, marginBottom: 8 }}>
              Smart Cycle Auto-fill
            </h3>
            <p style={{ fontSize: 13, color: t.sub, lineHeight: 1.6 }}>
              Enter just the first few days of your shift rotation. The system automatically detects the repeat pattern and fills the remaining slots with a single click.
            </p>
          </div>

          {/* Card 2: CalSync */}
          <div className="card-lift" style={cardStyle}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(37,99,235,.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", marginBottom: 20 }}>
              <Calendar size={20} />
            </div>
            <h3 className="sora" style={{ fontSize: 16, fontWeight: 800, color: t.text, marginBottom: 8 }}>
              Universal Calendar Export
            </h3>
            <p style={{ fontSize: 13, color: t.sub, lineHeight: 1.6 }}>
              Generate universal standard `.ics` schedule files. Import your shifts seamlessly to Google Calendar, Apple Calendar, or Outlook to keep your family and devices in sync.
            </p>
          </div>

          {/* Card 3: Pay Calculator */}
          <div className="card-lift" style={cardStyle}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(16,185,129,.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981", marginBottom: 20 }}>
              <DollarSign size={20} />
            </div>
            <h3 className="sora" style={{ fontSize: 16, fontWeight: 800, color: t.text, marginBottom: 8 }}>
              Earnings Forecast
            </h3>
            <p style={{ fontSize: 13, color: t.sub, lineHeight: 1.6 }}>
              Set customized hourly rates for each individual shift type. Watch your estimated gross pay update dynamically as you schedule shifts or overtime.
            </p>
          </div>
        </div>
      </section>

      {/* DYNAMIC INTERACTIVE WIDGET: EARNINGS ESTIMATOR */}
      <section 
        style={{ 
          background: t.card,
          border: `1.5px solid ${t.cardBdr}`,
          borderRadius: 28,
          padding: "36px 40px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 40,
          alignItems: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,.03)"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "inline-flex", width: "fit-content", background: "rgba(16,185,129,.12)", color: "#10B981", fontSize: 10.5, fontWeight: 800, padding: "4px 12px", borderRadius: 20, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Interactive Demo
          </div>
          <h2 className="sora" style={{ fontSize: 26, fontWeight: 900, color: t.text, letterSpacing: "-0.5px" }}>
            See how shift rates boost your earnings
          </h2>
          <p style={{ fontSize: 13.5, color: t.sub, lineHeight: 1.6 }}>
            Adjust your hourly rate and estimated weekly work hours below. Our algorithm calculates real-time estimated projections.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
            <div style={{ fontSize: 12.5, color: t.text, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
              Supports differential shift rates
            </div>
            <div style={{ fontSize: 12.5, color: t.text, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
              Tracks overtime hours automatically
            </div>
          </div>
        </div>

        {/* Interactive Calculator panel */}
        <div 
          style={{ 
            background: t.is ? "#070D1A" : "#F4F7FF", 
            border: `1px solid ${t.tBdr}`, 
            borderRadius: 20, 
            padding: 24,
            display: "flex",
            flexDirection: "column",
            gap: 18
          }}
        >
          {/* Slider 1: Hourly rate */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: t.sub }}>Hourly Shift Wage</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#10B981" }}>₹{rate}/hr</span>
            </div>
            <input 
              type="range" 
              min="100" 
              max="1000" 
              step="10"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#10B981", cursor: "pointer" }}
            />
          </div>

          {/* Slider 2: Shift Hours */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: t.sub }}>Weekly Shift Hours</span>
              <span style={{ fontSize: 13, fontWeight: 800, color: "#2563EB" }}>{hours} hrs</span>
            </div>
            <input 
              type="range" 
              min="10" 
              max="80" 
              step="1"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#2563EB", cursor: "pointer" }}
            />
          </div>

          {/* Display Output */}
          <div style={{ borderTop: `1px solid ${t.tBdr}`, paddingTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: t.sub, textTransform: "uppercase" }}>Monthly Estimate</div>
              <div className="sora" style={{ fontSize: 20, fontWeight: 800, color: t.text, marginTop: 4 }}>
                ₹{estimatedMonthly.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: t.sub, textTransform: "uppercase" }}>Annual Forecast</div>
              <div className="sora" style={{ fontSize: 20, fontWeight: 800, color: t.text, marginTop: 4 }}>
                ₹{estimatedAnnual.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPLIANCE GUARD RAIL INTERACTIVE PREVIEW */}
      <section 
        style={{ 
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 50,
          alignItems: "center"
        }}
      >
        {/* Compliance Simulator Output */}
        <div 
          style={{ 
            background: t.card,
            border: `1.5px solid ${t.cardBdr}`, 
            borderRadius: 24, 
            padding: 28,
            boxShadow: "0 4px 20px rgba(0,0,0,.03)",
            display: "flex",
            flexDirection: "column",
            gap: 16
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: t.sub }}>Schedule Health Sandbox</span>
            <span 
              style={{ 
                padding: "3px 10px", 
                borderRadius: 20, 
                fontSize: 11, 
                fontWeight: 700, 
                background: consecutiveDays >= 7 ? "rgba(239, 68, 68, 0.1)" : "rgba(5, 150, 105, 0.1)",
                color: consecutiveDays >= 7 ? "#EF4444" : "#059669" 
              }}
            >
              {consecutiveDays >= 7 ? "⚠ High Fatigue Risk" : "✓ Compliance Met"}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11.5, color: t.sub, fontWeight: 600 }}>Simulate consecutive work days:</span>
            <div style={{ display: "flex", gap: 6 }}>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((day) => (
                <button
                  key={day}
                  onClick={() => setConsecutiveDays(day)}
                  style={{
                    flex: 1,
                    padding: "8px 0",
                    borderRadius: 8,
                    border: "none",
                    background: day <= consecutiveDays 
                      ? (consecutiveDays >= 7 ? "#EF4444" : "#2563EB") 
                      : (t.is ? "rgba(255,255,255,0.05)" : "#EEF2FB"),
                    color: day <= consecutiveDays ? "#fff" : t.sub,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all .15s"
                  }}
                >
                  {day}d
                </button>
              ))}
            </div>
          </div>

          {consecutiveDays >= 7 ? (
            <div style={{ display: "flex", gap: 10, background: t.is ? "rgba(239, 68, 68, 0.06)" : "#FEF2F2", border: "1px solid #EF4444", borderRadius: 12, padding: 12 }}>
              <ShieldAlert size={18} color="#EF4444" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 11.5, color: t.text, lineHeight: 1.5 }}>
                <strong>Fatigue Warning:</strong> Schedule contains {consecutiveDays} consecutive work days. We recommend introducing a rest shift to avoid burnout and comply with labor norms.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10, background: t.is ? "rgba(5, 150, 105, 0.06)" : "#ECFDF5", border: "1px solid #059669", borderRadius: 12, padding: 12 }}>
              <Award size={18} color="#059669" style={{ flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 11.5, color: t.text, lineHeight: 1.5 }}>
                <strong>Optimal Work Balance:</strong> Roster satisfies the safety guidelines. Rest periods are spaced out correctly.
              </p>
            </div>
          )}
        </div>

        {/* Text details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "inline-flex", width: "fit-content", background: "rgba(124,58,237,.12)", color: "#7C3AED", fontSize: 10.5, fontWeight: 800, padding: "4px 12px", borderRadius: 20, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Schedule Health Guard
          </div>
          <h2 className="sora" style={{ fontSize: 26, fontWeight: 900, color: t.text, letterSpacing: "-0.5px" }}>
            Protect yourself from scheduling fatigue
          </h2>
          <p style={{ fontSize: 13.5, color: t.sub, lineHeight: 1.6 }}>
            Avoid illegal turnarounds or safety issues. Smart Shift alerts you immediately if a rest interval falls under 11 hours or if you plan consecutive work days exceeding standard recommendations.
          </p>
        </div>
      </section>

      {/* FOOTER CALL TO ACTION */}
      <section 
        className="glass"
        style={{
          borderRadius: 28,
          padding: "50px 40px",
          textAlign: "center",
          background: "linear-gradient(135deg,#1D4ED8 0%,#7C3AED 100%)",
          color: "#fff",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 15px 40px rgba(37,99,235,.25)"
        }}
      >
        <div style={{ position: "absolute", top: "-50%", left: "-20%", width: 400, height: 400, background: "rgba(255,255,255,.05)", borderRadius: "50%", filter: "blur(40px)" }} />
        
        <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
          <h2 className="sora" style={{ fontSize: 32, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.8px" }}>
            Ready to design your perfect roster?
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.85)", maxWidth: 500, lineHeight: 1.6, margin: 0 }}>
            No sign-ups, no hidden costs. Access all shift building features in your web browser instantly.
          </p>
          <button
            onClick={() => {
              trackEvent("launch_planner", { location: "footer" });
              setView("dashboard");
            }}
            style={{
              marginTop: 10,
              padding: "14px 34px",
              borderRadius: 14,
              background: "#fff",
              color: "#2563EB",
              border: "none",
              fontWeight: 800,
              fontSize: 14.5,
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(0,0,0,.15)"
            }}
            className="btn-hover"
          >
            Launch Roster Studio
          </button>
        </div>
      </section>
    </div>
  );
}
