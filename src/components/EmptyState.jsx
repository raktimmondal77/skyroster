export default function EmptyState({
  t,
  icon = "📅",
  title,
  subtitle,
  actionLabel,
  onAction,
}) {
  return (
    <div
      className="anim-fade-up"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "54px 24px",
        textAlign: "center",
        background: t.card,
        border: `1px dashed ${t.cardBdr}`,
        borderRadius: 20,
        margin: "12px 0",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: t.accentSoft || "rgba(37,99,235,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          marginBottom: 16,
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontFamily: "'Sora', sans-serif",
          fontSize: 18,
          fontWeight: 700,
          color: t.text,
          marginBottom: 6,
          letterSpacing: "-0.3px",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          color: t.sub,
          maxWidth: 380,
          marginBottom: actionLabel ? 20 : 0,
          lineHeight: 1.5,
          fontSize: 13,
        }}
      >
        {subtitle}
      </p>
      {actionLabel && (
        <button
          onClick={onAction}
          className="btn-hover"
          style={{
            background: "#2563EB",
            color: "white",
            border: "none",
            padding: "11px 22px",
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 4px 14px rgba(37,99,235,.32)",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
