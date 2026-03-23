import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

const Badge: React.FC<{ label: string; color: string; delay: number; row: number }> = ({ label, color, delay, row }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ fps, frame: frame - delay, config: { damping: 8, stiffness: 120 } });
  const glow = interpolate(Math.sin((frame - delay) * 0.1 + row), [-1, 1], [0, 10]);
  const y = interpolate(Math.sin((frame - delay) * 0.03 + delay), [-1, 1], [-3, 3]);

  return (
    <div
      style={{
        border: `2px solid ${color}50`,
        backgroundColor: `${color}12`,
        borderRadius: 14,
        padding: "18px 36px",
        fontSize: 26,
        fontWeight: 700,
        color,
        fontFamily: "Inter, system-ui, sans-serif",
        transform: `scale(${Math.max(0, scale)}) translateY(${y}px)`,
        boxShadow: `0 0 ${glow}px ${color}30`,
      }}
    >
      {label}
    </div>
  );
};

export const TechStackScene: React.FC = () => {
  const frame = useCurrentFrame();
  const headerOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const row1 = [
    { label: "ampersend-sdk", color: "#f59e0b", delay: 15 },
    { label: "Aave v3", color: "#10b981", delay: 30 },
    { label: "Venice AI", color: "#8b5cf6", delay: 45 },
    { label: "x402", color: "#ef4444", delay: 60 },
  ];
  const row2 = [
    { label: "Base Sepolia", color: "#3b82f6", delay: 75 },
    { label: "Claude Code", color: "#f97316", delay: 90 },
    { label: "Next.js", color: "#ffffff", delay: 105 },
    { label: "shadcn/ui", color: "#a1a1aa", delay: 120 },
  ];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0a0a0a",
        flexDirection: "column",
        gap: 48,
      }}
    >
      <div
        style={{
          fontSize: 22,
          color: "#a1a1aa",
          fontWeight: 600,
          opacity: headerOpacity,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        Built With
      </div>
      <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
        {row1.map((t) => <Badge key={t.label} {...t} row={0} />)}
      </div>
      <div style={{ display: "flex", gap: 20, justifyContent: "center" }}>
        {row2.map((t) => <Badge key={t.label} {...t} row={1} />)}
      </div>
    </AbsoluteFill>
  );
};
