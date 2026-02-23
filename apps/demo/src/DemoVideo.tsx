import React from "react";
import { AbsoluteFill, Sequence, useCurrentFrame, interpolate } from "remotion";
import { DemoFrame } from "./components/DemoFrame";
import { SetupWelcome } from "./scenes/SetupWelcome";
import { SetupPlatform } from "./scenes/SetupPlatform";
import { SetupDeploy } from "./scenes/SetupDeploy";
import { SetupPairing } from "./scenes/SetupPairing";
import { DashboardWelcome } from "./scenes/DashboardWelcome";
import { DashboardChat } from "./scenes/DashboardChat";

/*
 * Scene Timeline (30 fps, 45s total = 1350 frames)
 *
 * 1. Setup Welcome     0-119    (4s)
 * 2. Setup Platform  120-299    (6s)
 * 3. Setup Deploy    300-569    (9s)
 * 4. Setup Pairing   570-749    (6s)
 * 5. Transition      750-809    (2s)
 * 6. Dashboard Welc  810-929    (4s)
 * 7. Transition      930-959    (1s)
 * 8. Dashboard Chat  960-1319   (12s)
 * 9. Outro          1320-1349   (1s)
 */

const SCENES = {
  SETUP_WELCOME:     { from: 0,    duration: 120 },
  SETUP_PLATFORM:    { from: 120,  duration: 180 },
  SETUP_DEPLOY:      { from: 300,  duration: 270 },
  SETUP_PAIRING:     { from: 570,  duration: 180 },
  TRANSITION_1:      { from: 750,  duration: 60 },
  DASHBOARD_WELCOME: { from: 810,  duration: 120 },
  TRANSITION_2:      { from: 930,  duration: 30 },
  DASHBOARD_CHAT:    { from: 960,  duration: 360 },
  OUTRO:             { from: 1320, duration: 30 },
};

const FadeTransition: React.FC<{
  children: React.ReactNode;
  fadeInFrames?: number;
  fadeOutFrame?: number;
  fadeOutDuration?: number;
}> = ({ children, fadeInFrames = 12, fadeOutFrame, fadeOutDuration = 12 }) => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, fadeInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  let fadeOut = 1;
  if (fadeOutFrame !== undefined) {
    fadeOut = interpolate(
      frame,
      [fadeOutFrame, fadeOutFrame + fadeOutDuration],
      [1, 0],
      { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
    );
  }

  return (
    <AbsoluteFill style={{ opacity: fadeIn * fadeOut }}>{children}</AbsoluteFill>
  );
};

export const DemoVideo: React.FC = () => {
  const frame = useCurrentFrame();

  const outroOpacity = interpolate(
    frame,
    [SCENES.OUTRO.from, SCENES.OUTRO.from + 30],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const isSetupPhase = frame < SCENES.TRANSITION_1.from + SCENES.TRANSITION_1.duration;
  const browserUrl = isSetupPhase ? "app.kredo.ai/setup" : "app.kredo.ai/dashboard";

  return (
    <AbsoluteFill className="bg-black">
      <DemoFrame url={browserUrl}>
        {/* Setup Welcome */}
        <Sequence
          from={SCENES.SETUP_WELCOME.from}
          durationInFrames={SCENES.SETUP_WELCOME.duration}
        >
          <FadeTransition fadeOutFrame={108} fadeOutDuration={12}>
            <SetupWelcome />
          </FadeTransition>
        </Sequence>

        {/* Setup Platform */}
        <Sequence
          from={SCENES.SETUP_PLATFORM.from}
          durationInFrames={SCENES.SETUP_PLATFORM.duration}
        >
          <FadeTransition fadeOutFrame={168} fadeOutDuration={12}>
            <SetupPlatform />
          </FadeTransition>
        </Sequence>

        {/* Setup Deploy */}
        <Sequence
          from={SCENES.SETUP_DEPLOY.from}
          durationInFrames={SCENES.SETUP_DEPLOY.duration}
        >
          <FadeTransition fadeOutFrame={258} fadeOutDuration={12}>
            <SetupDeploy />
          </FadeTransition>
        </Sequence>

        {/* Setup Pairing */}
        <Sequence
          from={SCENES.SETUP_PAIRING.from}
          durationInFrames={SCENES.SETUP_PAIRING.duration}
        >
          <FadeTransition fadeOutFrame={168} fadeOutDuration={12}>
            <SetupPairing />
          </FadeTransition>
        </Sequence>

        {/* Transition 1 */}
        <Sequence
          from={SCENES.TRANSITION_1.from}
          durationInFrames={SCENES.TRANSITION_1.duration}
        >
          <AbsoluteFill className="bg-black" />
        </Sequence>

        {/* Dashboard Welcome */}
        <Sequence
          from={SCENES.DASHBOARD_WELCOME.from}
          durationInFrames={SCENES.DASHBOARD_WELCOME.duration}
        >
          <FadeTransition fadeOutFrame={108} fadeOutDuration={12}>
            <DashboardWelcome />
          </FadeTransition>
        </Sequence>

        {/* Transition 2 */}
        <Sequence
          from={SCENES.TRANSITION_2.from}
          durationInFrames={SCENES.TRANSITION_2.duration}
        >
          <AbsoluteFill className="bg-black" />
        </Sequence>

        {/* Dashboard Chat */}
        <Sequence
          from={SCENES.DASHBOARD_CHAT.from}
          durationInFrames={SCENES.DASHBOARD_CHAT.duration}
        >
          <FadeTransition>
            <DashboardChat />
          </FadeTransition>
        </Sequence>
      </DemoFrame>

      {/* Outro fade to black */}
      <AbsoluteFill
        style={{ backgroundColor: "black", opacity: outroOpacity, zIndex: 100 }}
      />
    </AbsoluteFill>
  );
};
