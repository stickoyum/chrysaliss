import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

const Particle: React.FC<{ x: number; y: number; size: number; speed: number; color: string }> = ({
  x, y, size, speed, color,
}) => {
  const frame = useCurrentFrame();
  const yPos = y - frame * speed * 0.6;
  const opacity = interpolate(Math.sin(frame * 0.04 + x * 0.01), [-1, 1], [0.05, 0.4]);
  const wrappedY = ((yPos % 1080) + 1080) % 1080;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: wrappedY,
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: color,
        opacity,
      }}
    />
  );
};

const particles = Array.from({ length: 30 }, (_, i) => ({
  x: (i * 173.7) % 1920,
  y: (i * 113.3) % 1080,
  size: 2 + (i % 3),
  speed: 0.2 + (i % 4) * 0.15,
  color: i % 2 === 0 ? "#10b981" : "#3b82f6",
}));

export const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ fps, frame, config: { damping: 8 } });
  const glow = interpolate(Math.sin(frame * 0.06), [-1, 1], [5, 25]);
  const linkOpacity = interpolate(frame, [25, 45], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const linkY = interpolate(frame, [25, 45], [15, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const dashOpacity = interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const handleOpacity = interpolate(frame, [75, 95], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      {particles.map((p, i) => <Particle key={i} {...p} />)}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 28 }}>
        <div
          style={{
            fontSize: 100,
            fontWeight: 800,
            color: "#ffffff",
            fontFamily: "Inter, system-ui, sans-serif",
            transform: `scale(${Math.max(0, logoScale)})`,
            letterSpacing: "-0.04em",
            textShadow: `0 0 ${glow}px rgba(16,185,129,0.4)`,
          }}
        >
          Chrysalis
        </div>

        <div style={{ width: 300, height: 2, background: "linear-gradient(90deg, transparent, #10b981, transparent)", opacity: linkOpacity }} />

        <div
          style={{
            opacity: linkOpacity,
            transform: `translateY(${linkY}px)`,
            fontSize: 28,
            fontFamily: "'Courier New', monospace",
            color: "#3b82f6",
          }}
        >
          github.com/stickoyum/chrysaliss
        </div>

        <div style={{ opacity: dashOpacity, fontSize: 20, fontFamily: "'Courier New', monospace", color: "#71717a" }}>
          dashboard-e0nzvp2hl-xjitsu.vercel.app
        </div>

        <div
          style={{
            opacity: handleOpacity,
            fontSize: 26,
            color: "#10b981",
            fontWeight: 600,
            marginTop: 12,
          }}
        >
          @stickoyum — The Synthesis Hackathon 2026
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
