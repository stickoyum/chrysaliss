import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

const PulseRing: React.FC<{ delay: number; color: string }> = ({ delay, color }) => {
  const frame = useCurrentFrame();
  const cycle = (frame - delay) % 60;
  const scale = interpolate(cycle, [0, 60], [0.8, 2], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const opacity = interpolate(cycle, [0, 60], [0.4, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return frame > delay ? (
    <div
      style={{
        position: "absolute",
        width: 340,
        height: "100%",
        borderRadius: 16,
        border: `2px solid ${color}`,
        opacity,
        transform: `scale(${scale})`,
        pointerEvents: "none",
      }}
    />
  ) : null;
};

const StepBox: React.FC<{
  label: string;
  title: string;
  subtitle: string;
  borderColor: string;
  bgColor: string;
  labelColor: string;
  delay: number;
  pulse?: boolean;
}> = ({ label, title, subtitle, borderColor, bgColor, labelColor, delay, pulse }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ fps, frame: frame - delay, config: { damping: 8, stiffness: 100 } });
  const glow = interpolate(Math.sin((frame - delay) * 0.1), [-1, 1], [0, 12]);

  return (
    <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {pulse && <PulseRing delay={delay + 30} color={borderColor} />}
      <div
        style={{
          border: `2px solid ${borderColor}`,
          backgroundColor: bgColor,
          borderRadius: 16,
          padding: "28px 36px",
          textAlign: "center",
          transform: `scale(${Math.max(0, scale)})`,
          width: 340,
          boxShadow: frame > delay ? `0 0 ${glow}px ${borderColor}` : "none",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={{ fontSize: 18, color: labelColor, marginBottom: 8, fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: "#fff" }}>{title}</div>
        <div style={{ fontSize: 16, color: "#a1a1aa", marginTop: 8 }}>{subtitle}</div>
      </div>
    </div>
  );
};

const AnimatedArrow: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ fps, frame: frame - delay, config: { damping: 12 } });
  const dash = interpolate(frame, [delay, delay + 60], [0, 100], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <div style={{ opacity: Math.max(0, progress), display: "flex", alignItems: "center", padding: "0 12px" }}>
      <svg width="60" height="48" viewBox="0 0 60 24">
        <line x1="0" y1="12" x2="48" y2="12" stroke="#10b981" strokeWidth="2" strokeDasharray={`${dash} 100`} />
        <polygon points="44,6 56,12 44,18" fill="#10b981" opacity={progress} />
      </svg>
    </div>
  );
};

export const LoopScene: React.FC = () => {
  const frame = useCurrentFrame();
  const headerOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const loopScale = spring({ fps: 30, frame: frame - 180, config: { damping: 10 } });
  const loopGlow = interpolate(Math.sin((frame - 200) * 0.06), [-1, 1], [0, 15]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0a0a0a",
        flexDirection: "column",
        gap: 40,
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
        Self-Compounding Loop
      </div>

      <div style={{ display: "flex", alignItems: "center" }}>
        <StepBox label="Step 1" title="Human pays $0.08" subtitle="via x402 / ampersend" borderColor="#71717a" bgColor="#18181b" labelColor="#a1a1aa" delay={15} />
        <AnimatedArrow delay={45} />
        <StepBox label="Step 2" title="Coordinator deposits" subtitle="Pool.supply() on Aave v3" borderColor="#10b981" bgColor="rgba(16,185,129,0.08)" labelColor="#10b981" delay={60} pulse />
        <AnimatedArrow delay={90} />
        <StepBox label="Step 3" title="aToken grows" subtitle="real yield via Aave index" borderColor="#3b82f6" bgColor="rgba(59,130,246,0.08)" labelColor="#3b82f6" delay={110} pulse />
      </div>

      <div
        style={{
          opacity: frame >= 180 ? 1 : 0,
          transform: `scale(${Math.max(0, loopScale)})`,
          border: "2px solid rgba(245,158,11,0.4)",
          backgroundColor: "rgba(245,158,11,0.06)",
          borderRadius: 16,
          padding: "24px 56px",
          textAlign: "center",
          maxWidth: 850,
          boxShadow: `0 0 ${loopGlow}px rgba(245,158,11,0.3)`,
        }}
      >
        <div style={{ fontSize: 20, color: "#f59e0b", marginBottom: 8, fontWeight: 700 }}>Autonomous Loop</div>
        <div style={{ fontSize: 18, color: "#d4d4d8", lineHeight: 1.5 }}>
          yield ≥ $0.08 → TreasuryAgent withdraws → pays Coordinator → deposits back → repeat forever
        </div>
      </div>
    </AbsoluteFill>
  );
};
