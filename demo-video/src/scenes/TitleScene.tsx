import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

const Particle: React.FC<{ x: number; y: number; size: number; speed: number; color: string }> = ({
  x, y, size, speed, color,
}) => {
  const frame = useCurrentFrame();
  const yPos = y - frame * speed * 0.5;
  const opacity = interpolate(Math.sin(frame * 0.05 + x), [-1, 1], [0.1, 0.6]);
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
        filter: `blur(${size > 3 ? 1 : 0}px)`,
      }}
    />
  );
};

const particles = Array.from({ length: 40 }, (_, i) => ({
  x: (i * 137.5) % 1920,
  y: (i * 97.3) % 1080,
  size: 2 + (i % 4),
  speed: 0.3 + (i % 5) * 0.2,
  color: i % 3 === 0 ? "#10b981" : i % 3 === 1 ? "#3b82f6" : "#f59e0b",
}));

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleScale = spring({ fps, frame, config: { damping: 8, stiffness: 80 } });
  const titleGlow = interpolate(Math.sin(frame * 0.08), [-1, 1], [0, 20]);
  const taglineOpacity = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const taglineY = interpolate(frame, [40, 60], [30, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const lineWidth = interpolate(frame, [60, 90], [0, 400], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      {particles.map((p, i) => (
        <Particle key={i} {...p} />
      ))}

      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <div style={{ textAlign: "center", position: "relative" }}>
          <div
            style={{
              fontSize: 140,
              fontWeight: 800,
              color: "#ffffff",
              fontFamily: "Inter, system-ui, sans-serif",
              transform: `scale(${titleScale})`,
              letterSpacing: "-0.04em",
              textShadow: `0 0 ${titleGlow}px rgba(16,185,129,0.5), 0 0 ${titleGlow * 2}px rgba(16,185,129,0.2)`,
            }}
          >
            Chrysalis
          </div>

          <div
            style={{
              width: lineWidth,
              height: 2,
              background: "linear-gradient(90deg, transparent, #10b981, transparent)",
              margin: "16px auto",
              opacity: taglineOpacity,
            }}
          />

          <div
            style={{
              fontSize: 38,
              color: "#10b981",
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 400,
              opacity: taglineOpacity,
              transform: `translateY(${taglineY}px)`,
              letterSpacing: "0.02em",
            }}
          >
            Seed it once. It runs forever.
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
