import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

const TrackRow: React.FC<{ name: string; amount: string; delay: number }> = ({ name, amount, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ fps, frame: frame - delay, config: { damping: 15 } });
  const x = interpolate(Math.max(0, progress), [0, 1], [-100, 0]);
  const opacity = Math.max(0, progress);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "14px 0",
        borderBottom: "1px solid #27272a",
        opacity,
        transform: `translateX(${x}px)`,
      }}
    >
      <span style={{ fontSize: 24, color: "#e4e4e7" }}>{name}</span>
      <span style={{ fontSize: 24, fontWeight: 700, color: "#10b981", fontFamily: "monospace" }}>{amount}</span>
    </div>
  );
};

export const TracksScene: React.FC = () => {
  const frame = useCurrentFrame();
  const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const totalOpacity = interpolate(frame, [160, 190], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const tracks = [
    { name: "Synthesis Open Track", amount: "$28,134", delay: 20 },
    { name: "Venice — Private Agents", amount: "$11,500", delay: 35 },
    { name: "Agent Services on Base", amount: "$5,000", delay: 50 },
    { name: "Ship Something Real (OpenServ)", amount: "$4,500", delay: 65 },
    { name: "Let the Agent Cook", amount: "$4,000", delay: 80 },
    { name: "stETH Agent Treasury", amount: "$3,000", delay: 95 },
    { name: "Yield-Powered AI Agents", amount: "$600", delay: 110 },
    { name: "ampersend-sdk", amount: "$500", delay: 125 },
  ];

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#0a0a0a",
        flexDirection: "column",
        gap: 32,
        padding: "0 300px",
      }}
    >
      <div
        style={{
          fontSize: 20,
          color: "#a1a1aa",
          fontWeight: 500,
          opacity: headerOpacity,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        Competing in 8 Tracks
      </div>

      <div style={{ width: "100%", maxWidth: 900 }}>
        {tracks.map((t) => (
          <TrackRow key={t.name} {...t} />
        ))}
      </div>

      <div
        style={{
          opacity: totalOpacity,
          fontSize: 32,
          fontWeight: 700,
          color: "#f59e0b",
          marginTop: 16,
        }}
      >
        $57,234+ total prize eligibility
      </div>
    </AbsoluteFill>
  );
};
