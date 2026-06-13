import React from 'react';
import { Composition } from 'remotion';
import { WhatsAppReel } from './WhatsAppReel';
import { WIDTH, HEIGHT, FPS, DURATION_FRAMES } from './constants';
import { FbCarousel, FB_CAROUSEL_DURATION } from './FbCarousel';
import { FbBoostAd, FB_BOOST_DURATION } from './FbBoostAd';
import { FbPainVideo, FB_PAIN_DURATION } from './FbPainVideo';
import { FbLightCarousel, FB_LIGHT_DURATION } from './FbLightCarousel';

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="WhatsAppReel"
        component={WhatsAppReel}
        durationInFrames={DURATION_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="FbCarousel"
        component={FbCarousel}
        durationInFrames={FB_CAROUSEL_DURATION}
        fps={FPS}
        width={1080}
        height={1080}
      />
      <Composition
        id="FbBoostAd"
        component={FbBoostAd}
        durationInFrames={FB_BOOST_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="FbPainVideo"
        component={FbPainVideo}
        durationInFrames={FB_PAIN_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
      <Composition
        id="FbLightCarousel"
        component={FbLightCarousel}
        durationInFrames={FB_LIGHT_DURATION}
        fps={30}
        width={1080}
        height={1080}
      />
    </>
  );
};
