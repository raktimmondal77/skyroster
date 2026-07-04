import { X, Heart, ExternalLink, Coffee, CreditCard, DollarSign } from "lucide-react";

export default function DonateModal({ t, isOpen, onClose, bmcUser, paypalUser, upiId }) {
  if (!isOpen) return null;

  const hasConfig = bmcUser || paypalUser || upiId;

  // UPI QR Code URL using public QR Server API
  const upiQrUrl = upiId 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(`upi://pay?pa=${upiId}&pn=Smart%20Shift%20Planner&cu=INR`)}`
    : null;

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
          maxWidth: 440, 
          background: t.card, 
          borderRadius: 24, 
          border: `1.5px solid ${t.cardBdr}`, 
          boxShadow: "0 20px 50px rgba(0,0,0,.25)", 
          overflow: "hidden" 
        }}
      >
        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${t.tBdr}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Heart size={18} color="#EF4444" fill="#EF4444" />
            <h3 className="sora" style={{ fontSize: 16, fontWeight: 800, color: t.text, margin: 0 }}>Support the Project</h3>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: t.sub, cursor: "pointer" }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20, alignItems: "center", textAlign: "center" }}>
          
          {!hasConfig ? (
            <div style={{ padding: "20px 0" }}>
              <Coffee size={40} color={t.sub} style={{ marginBottom: 12, opacity: 0.7 }} />
              <p style={{ fontSize: 13.5, color: t.sub, lineHeight: 1.6, maxWidth: 300, marginInline: "auto" }}>
                Thank you for wishing to support! The creator has not configured their donation links yet. 
              </p>
              <p style={{ fontSize: 12, color: t.sub, marginTop: 10, fontWeight: 600 }}>
                💡 If you are the owner, please add your support links in the <strong>Settings</strong> screen.
              </p>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 13, color: t.sub, lineHeight: 1.5, margin: 0 }}>
                If you find Smart Shift helpful, consider buying the creator a coffee or making a small donation to keep the project alive.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, width: "100%" }}>
                {/* Buy Me a Coffee Button */}
                {bmcUser && (
                  <a
                    href={`https://buymeacoffee.com/${bmcUser}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-hover"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      padding: "12px",
                      borderRadius: 12,
                      background: "#FFDD00",
                      color: "#000000",
                      textDecoration: "none",
                      fontWeight: 700,
                      fontSize: 13.5,
                      border: "none",
                      cursor: "pointer"
                    }}
                  >
                    <Coffee size={16} />
                    Buy Me a Coffee
                    <ExternalLink size={12} style={{ opacity: 0.6 }} />
                  </a>
                )}

                {/* PayPal Button */}
                {paypalUser && (
                  <a
                    href={`https://paypal.me/${paypalUser}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-hover"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      padding: "12px",
                      borderRadius: 12,
                      background: t.is ? "rgba(37,99,235,.15)" : "#0070BA15",
                      border: `1.5px solid ${t.is ? "rgba(37,99,235,.3)" : "#0070BA50"}`,
                      color: t.is ? "#60A5FA" : "#0070BA",
                      textDecoration: "none",
                      fontWeight: 700,
                      fontSize: 13.5,
                      cursor: "pointer"
                    }}
                  >
                    <DollarSign size={16} />
                    Donate via PayPal
                    <ExternalLink size={12} style={{ opacity: 0.6 }} />
                  </a>
                )}
              </div>

              {/* UPI Option with QR Code */}
              {upiId && (
                <div 
                  style={{ 
                    marginTop: 10,
                    width: "100%",
                    padding: 16,
                    borderRadius: 18,
                    background: t.is ? "rgba(255,255,255,0.02)" : "#F8FAFC",
                    border: `1px solid ${t.cardBdr}`,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, color: t.text, fontWeight: 700, fontSize: 13 }}>
                    <CreditCard size={15} color="#2563EB" />
                    <span>Pay with UPI</span>
                  </div>
                  
                  {upiQrUrl && (
                    <div 
                      style={{ 
                        padding: 10, 
                        background: "#fff", 
                        borderRadius: 12, 
                        boxShadow: "0 4px 12px rgba(0,0,0,.05)",
                        border: "1px solid #E2E8F0"
                      }}
                    >
                      <img 
                        src={upiQrUrl} 
                        alt="UPI Payment QR Code" 
                        style={{ display: "block", width: 150, height: 150 }} 
                      />
                    </div>
                  )}
                  
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11, color: t.sub, fontWeight: 600 }}>UPI ID:</div>
                    <div className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: t.text, marginTop: 2 }}>{upiId}</div>
                  </div>
                </div>
              )}
            </>
          )}

          <button
            onClick={onClose}
            style={{
              marginTop: 6,
              background: "transparent",
              color: t.sub,
              border: "none",
              fontWeight: 600,
              fontSize: 12.5,
              cursor: "pointer"
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
