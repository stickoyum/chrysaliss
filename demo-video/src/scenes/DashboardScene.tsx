import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

const AnimatedValue: React.FC<{
  target: number;
  prefix?: string;
  decimals?: number;
  color: string;
  label: string;
  delay: number;
  fontSize?: number;
}> = ({ target, prefix = "", decimals = 2, color, label, delay, fontSize = 52 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ fps, frame: frame - delay, config: { damping: 20, mass: 0.5 } });
  const val = Math.max(0, p) * target;
  const glow = interpolate(Math.sin((frame - delay) * 0.08), [-1, 1], [0, 8]);

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize,
          fontWeight: 800,
          color,
          fontFamily: "'Courier New', monospace",
          textShadow: `0 0 ${glow}px ${color}60`,
        }}
      >
        {prefix}{val.toFixed(decimals)}
      </div>
      <div style={{ fontSize: 14, color: "#71717a", marginTop: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
    </div>
  );
};

const Card: React.FC<{
  children: React.ReactNode;
  delay: number;
  highlight?: string;
}> = ({ children, delay, highlight }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ fps, frame: frame - delay, config: { damping: 10 } });
  const glow = highlight ? interpolate(Math.sin((frame - delay) * 0.06), [-1, 1], [0, 6]) : 0;

  return (
    <div
      style={{
        backgroundColor: "#111113",
        border: `1px solid ${highlight || "#27272a"}`,
        borderRadius: 16,
        padding: "28px 36px",
        transform: `scale(${Math.max(0, scale)})`,
        boxShadow: highlight ? `0 0 ${glow}px ${highlight}40` : "none",
      }}
    >
      {children}
    </div>
  );
};

export const DashboardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const headerOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const progressWidth = interpolate(frame, [120, 200], [0, 100], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0a0a0a",
        flexDirection: "column",
        gap: 32,
        padding: 80,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: headerOpacity }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: "#10b981", boxShadow: "0 0 8px #10b981" }} />
        <span style={{ fontSize: 20, color: "#a1a1aa", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Live Dashboard
        </span>
      </div>

      <div style={{ display: "flex", gap: 24, width: "100%", maxWidth: 1300 }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          <Card delay={10} highlight="#3b82f6">
            <div style={{ fontSize: 14, color: "#71717a", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>aToken Balance</div>
            <AnimatedValue target={2.080003} prefix="$" decimals={6} color="#3b82f6" label="" delay={15} fontSize={44} />
          </Card>
          <Card delay={30}>
            <div style={{ fontSize: 14, color: "#71717a", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Principal Deposited</div>
            <AnimatedValue target={2.08} prefix="$" color="#ffffff" label="" delay={35} fontSize={44} />
          </Card>
          <Card delay={50} highlight="#10b981">
            <div style={{ fontSize: 14, color: "#71717a", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>Available Yield</div>
            <AnimatedValue target={0.000003} prefix="$" decimals={6} color="#10b981" label="" delay={55} fontSize={44} />
          </Card>
        </div>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
          <Card delay={20}>
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <AnimatedValue target={0.24} prefix="$" color="#10b981" label="Total Earned" delay={25} />
              <AnimatedValue target={0.24} prefix="$" color="#3b82f6" label="Total Deposited" delay={40} />
            </div>
          </Card>
          <Card delay={60}>
            <div style={{ display: "flex", justifyContent: "space-around" }}>
              <AnimatedValue target={3} decimals={0} color="#ffffff" label="Human Queries" delay={65} />
              <AnimatedValue target={0} decimals={0} color="#f59e0b" label="Autonomous" delay={80} />
            </div>
          </Card>
          <Card delay={100}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ height: 14, flex: 1, borderRadius: 7, backgroundColor: "rgba(16,185,129,0.15)", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${progressWidth}%`, borderRadius: 7, backgroundColor: "#10b981", boxShadow: "0 0 10px #10b98180" }} />
              </div>
              <span style={{ fontSize: 13, color: "#71717a", whiteSpace: "nowrap" }}>100% to Aave</span>
            </div>
          </Card>

          <Card delay={130}>
            <div style={{ fontSize: 14, color: "#71717a", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Yield → Next Query</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ height: 8, flex: 1, borderRadius: 4, backgroundColor: "#27272a", overflow: "hidden" }}>
                <div style={{ height: "100%", width: "0.004%", borderRadius: 4, backgroundColor: "#f59e0b" }} />
              </div>
              <span style={{ fontSize: 12, color: "#f59e0b", fontFamily: "monospace" }}>$0.000003 / $0.08</span>
            </div>
          </Card>
        </div>
      </div>
    </AbsoluteFill>
  );
};
