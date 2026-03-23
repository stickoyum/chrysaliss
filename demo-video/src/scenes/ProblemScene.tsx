import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

export const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const problemScale = spring({ fps, frame: frame - 5, config: { damping: 10, stiffness: 100 } });
  const problemShake = frame < 40 ? Math.sin(frame * 2) * interpolate(frame, [20, 40], [3, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }) : 0;
  const problemFade = interpolate(frame, [70, 85], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const solutionScale = spring({ fps, frame: frame - 90, config: { damping: 8, stiffness: 80 } });
  const solutionGlow = interpolate(frame, [90, 130], [0, 30], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const strikeWidth = interpolate(frame, [55, 70], [0, 100], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", backgroundColor: "#0a0a0a" }}>
      <div
        style={{
          position: "absolute",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: frame < 85
            ? "radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)",
          transition: "background 0.5s",
        }}
      />

      <div
        style={{
          fontSize: 60,
          color: "#ef4444",
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 700,
          textAlign: "center",
          lineHeight: 1.3,
          opacity: problemFade,
          transform: `scale(${Math.max(0, problemScale)}) translateX(${problemShake}px)`,
          position: "absolute",
        }}
      >
        Every AI agent eventually
        <br />
        <span style={{ position: "relative", display: "inline-block" }}>
          runs out of money.
          <div
            style={{
              position: "absolute",
              top: "55%",
              left: 0,
              width: `${strikeWidth}%`,
              height: 4,
              backgroundColor: "#ef4444",
            }}
          />
        </span>
      </div>

      <div
        style={{
          fontSize: 60,
          color: "#10b981",
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: 700,
          textAlign: "center",
          lineHeight: 1.3,
          opacity: frame >= 90 ? 1 : 0,
          transform: `scale(${Math.max(0, solutionScale)})`,
          position: "absolute",
          textShadow: `0 0 ${solutionGlow}px rgba(16,185,129,0.4)`,
        }}
      >
        Chrysalis gets richer
        <br />
        with every query.
      </div>
    </AbsoluteFill>
  );
};
