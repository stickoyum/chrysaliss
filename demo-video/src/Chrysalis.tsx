import { AbsoluteFill, Sequence } from "remotion";
import { TitleScene } from "./scenes/TitleScene";
import { ProblemScene } from "./scenes/ProblemScene";
import { LoopScene } from "./scenes/LoopScene";
import { DashboardScene } from "./scenes/DashboardScene";
import { TechStackScene } from "./scenes/TechStackScene";
import { ProofScene } from "./scenes/ProofScene";
import { TracksScene } from "./scenes/TracksScene";
import { CTAScene } from "./scenes/CTAScene";

export const Chrysalis: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      <Sequence from={0} durationInFrames={120}>
        <TitleScene />
      </Sequence>
      <Sequence from={120} durationInFrames={180}>
        <ProblemScene />
      </Sequence>
      <Sequence from={300} durationInFrames={450}>
        <LoopScene />
      </Sequence>
      <Sequence from={750} durationInFrames={450}>
        <DashboardScene />
      </Sequence>
      <Sequence from={1200} durationInFrames={300}>
        <TechStackScene />
      </Sequence>
      <Sequence from={1500} durationInFrames={300}>
        <ProofScene />
      </Sequence>
      <Sequence from={1800} durationInFrames={250}>
        <TracksScene />
      </Sequence>
      <Sequence from={2050} durationInFrames={200}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};
