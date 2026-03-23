import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

export const ProofScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const cardScale = spring({ fps, frame: frame - 30, config: { damping: 12 } });
  const badgeOpacity = interpolate(frame, [120, 150], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const txHash = "0x8a7d...3f2e";
  const walletAddr = "0x6FFa...99BC";

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
          fontSize: 20,
          color: "#a1a1aa",
          fontWeight: 500,
          opacity: headerOpacity,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        On-Chain Proof
      </div>

      <div
        style={{
          backgroundColor: "#18181b",
          border: "1px solid #27272a",
          borderRadius: 16,
          padding: "48px 64px",
          transform: `scale(${Math.max(0, cardScale)})`,
          textAlign: "center",
          maxWidth: 800,
        }}
      >
        <div style={{ fontSize: 16, color: "#a1a1aa", marginBottom: 12 }}>Latest Aave Supply Transaction</div>
        <div style={{ fontSize: 32, fontFamily: "monospace", color: "#3b82f6", marginBottom: 32 }}>{txHash}</div>

        <div style={{ fontSize: 16, color: "#a1a1aa", marginBottom: 12 }}>Agent Wallet</div>
        <div style={{ fontSize: 28, fontFamily: "monospace", color: "#10b981" }}>{walletAddr}</div>

        <div style={{ fontSize: 14, color: "#71717a", marginTop: 24 }}>
          sepolia.basescan.org — Base Sepolia Testnet
        </div>
      </div>

      <div
        style={{
          opacity: badgeOpacity,
          border: "2px solid rgba(16,185,129,0.3)",
          backgroundColor: "rgba(16,185,129,0.1)",
          borderRadius: 100,
          padding: "12px 32px",
          fontSize: 20,
          color: "#10b981",
          fontWeight: 600,
        }}
      >
        All transactions are real and verifiable
      </div>
    </AbsoluteFill>
  );
};
