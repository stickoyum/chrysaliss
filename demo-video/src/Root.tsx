import { Composition } from "remotion";
import { Chrysalis } from "./Chrysalis";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Chrysalis"
      component={Chrysalis}
      durationInFrames={2250}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
