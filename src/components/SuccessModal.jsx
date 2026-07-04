import { X, CalendarCheck, Heart } from "lucide-react";

export default function SuccessModal({ t, isOpen, onClose, onOpenDonate }) {
  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 18 }}>
      {/* Backdrop */}
      <div 
        onClick={onClose} 
        style={{ 
          position: "absolute", 
          inset: 0, 
          background: "rgba(0, 0, 0, 0.4)", 
          backdropFilter: "blur(5px)" 
        }} 
      />
      
      {/* Modal Card */}
      <div 
        className="anim-scale" 
        style={{ 
          position: "relative", 
          zIndex: 1, 
          width: "100%", 
          maxWidth: 400, 
          background: t.card, 
          borderRadius: 24, 
          border: `1.5px solid ${t.cardBdr}`, 
          boxShadow: "0 20px 50px rgba(0,0,0,.25)", 
          overflow: "hidden",
          padding: 28,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center"
        }}
      >
        <button 
          onClick={onClose} 
          style={{ 
            position: "absolute", 
            top: 18, 
            right: 18, 
            background: "none", 
            border: "none", 
            color: t.sub, 
            cursor: "pointer" 
          }}
        >
          <X size={18} />
        </button>

        {/* Success Icon */}
        <div 
          style={{ 
            width: 58, 
            height: 58, 
            borderRadius: "50%", 
            background: "rgba(5, 150, 105, 0.1)", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            color: "#059669",
            marginBottom: 20
          }}
        >
          <CalendarCheck size={28} />
        </div>

        <h3 className="sora" style={{ fontSize: 18, fontWeight: 800, color: t.text, marginBottom: 10, letterSpacing: "-0.5px" }}>
          Export Successful!
        </h3>
        
        <p style={{ fontSize: 13, color: t.sub, lineHeight: 1.6, marginBottom: 24, maxWidth: 300 }}>
          Your calendar file `smart-shift-roster.ics` has been downloaded. Import it to sync your shifts.
        </p>

        <div 
          style={{ 
            width: "100%",
            background: t.is ? "rgba(255,255,255,0.02)" : "#F8FAFC",
            border: `1px solid ${t.cardBdr}`,
            borderRadius: 18,
            padding: 16,
            marginBottom: 24
          }}
        >
          <p style={{ fontSize: 12.5, color: t.text, lineHeight: 1.5, margin: 0, fontWeight: 500 }}>
            Saved you 15 minutes of manual calendar setup? Consider supporting the project with a small donation!
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
          <button
            onClick={() => {
              onClose();
              onOpenDonate();
            }}
            className="btn-hover"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "12px",
              borderRadius: 12,
              background: "linear-gradient(135deg, #EF4444, #EC4899)",
              color: "#fff",
              border: "none",
              fontWeight: 700,
              fontSize: 13.5,
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(239,68,68,.3)"
            }}
          >
            <Heart size={15} fill="#fff" />
            Support Creator
          </button>
          
          <button
            onClick={onClose}
            style={{
              padding: "10px",
              background: "transparent",
              color: t.sub,
              border: "none",
              fontWeight: 600,
              fontSize: 12.5,
              cursor: "pointer"
            }}
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
