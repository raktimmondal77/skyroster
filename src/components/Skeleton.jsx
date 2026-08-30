export function SkeletonBlock({ w = "100%", h = 16, r = 8, mt = 0 }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        marginTop: mt,
        borderRadius: r,
        background: "linear-gradient(90deg, rgba(127,127,127,.08) 0%, rgba(127,127,127,.18) 50%, rgba(127,127,127,.08) 100%)",
        backgroundSize: "200% 100%",
        animation: "sk-shimmer 1.4s ease-in-out infinite",
      }}
    />
  );
}

export function RosterSkeleton() {
  return (
    <div className="anim-fade-up" style={{ display: "grid", gap: 12 }}>
      <style>{`@keyframes sk-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      {[...Array(7)].map((_, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            gap: 14,
            alignItems: "center",
            padding: "12px 16px",
            borderRadius: 12,
            background: "rgba(127,127,127,0.03)",
          }}
        >
          <SkeletonBlock w={80} h={18} />
          <SkeletonBlock w={110} h={30} r={8} />
          <SkeletonBlock w={60} h={18} />
          <SkeletonBlock w="100%" h={18} />
        </div>
      ))}
    </div>
  );
}
