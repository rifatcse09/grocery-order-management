import React from "react";
import { Composition } from "remotion";
import { InvatiqReel } from "./InvatiqReel";

// 30fps × 40 seconds = 1200 frames total
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="InvatiqReel"
        component={InvatiqReel}
        durationInFrames={1200}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{}}
      />
    </>
  );
};
