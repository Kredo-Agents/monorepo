import React from "react";
import { useCurrentFrame } from "remotion";

export const TypewriterText: React.FC<{
  text: string;
  startFrame?: number;
  charsPerFrame?: number;
}> = ({ text, startFrame = 0, charsPerFrame = 0.5 }) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const visibleChars = Math.min(text.length, Math.floor(elapsed * charsPerFrame));
  return <>{text.slice(0, visibleChars)}</>;
};

export const useTypewriter = (
  text: string,
  startFrame: number = 0,
  charsPerFrame: number = 0.5
): string => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const visibleChars = Math.min(text.length, Math.floor(elapsed * charsPerFrame));
  return text.slice(0, visibleChars);
};
