export default function ConfirmDialog({
  t,
  isOpen,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDestructive = true,
  onConfirm,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(6px)",
        padding: 20,
      }}
    >
      <div
        className="anim-scale glass-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: t.card,
          border: `1px solid ${t.cardBdr}`,
          borderRadius: 18,
          padding: "24px 22px",
          maxWidth: 400,
          width: "100%",
          boxShadow: "0 24px 54px rgba(0,0,0,0.4)",
        }}
      >
        <h3
          className="jakarta"
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: t.text,
            marginBottom: 8,
            letterSpacing: "-0.02em",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            color: t.sub,
            fontSize: 13,
            lineHeight: 1.5,
            marginBottom: 22,
          }}
        >
          {message}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            className="btn-press"
            style={{
              padding: "9px 16px",
              borderRadius: 10,
              border: `1px solid ${t.cardBdr}`,
              background: "transparent",
              color: t.text,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="btn-press"
            style={{
              padding: "9px 18px",
              borderRadius: 10,
              border: "none",
              background: isDestructive ? "#EF4444" : "#4F46E5",
              color: "white",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: isDestructive
                ? "0 4px 14px rgba(239,68,68,0.3)"
                : "0 4px 14px rgba(79,70,229,0.3)",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
