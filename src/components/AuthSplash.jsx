export default function AuthSplash({ dark }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: dark ? "#070D1A" : "#EEF2FB",
      color: dark ? "#EAF0FF" : "#0A1628",
      fontFamily: "'DM Sans',sans-serif",
    }}>
      <style>{`@keyframes sr-spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign: "center" }}>
        <div style={{
          width: 36, height: 36,
          border: "3px solid #2563EB",
          borderTopColor: "transparent",
          borderRadius: "50%",
          margin: "0 auto 14px",
          animation: "sr-spin 0.7s linear infinite",
        }} />
        <div style={{ fontWeight: 500 }}>Loading SkyRoster…</div>
      </div>
    </div>
  );
}
