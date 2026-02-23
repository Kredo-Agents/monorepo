import React from "react";
import { AbsoluteFill } from "remotion";

export const DemoFrame: React.FC<{
  children: React.ReactNode;
  url?: string;
}> = ({ children, url = "app.kredo.ai" }) => (
  <AbsoluteFill className="bg-zinc-950" style={{ fontFamily: "'Geist', sans-serif" }}>
    {/* Browser title bar */}
    <div className="flex items-center h-12 bg-zinc-900 border-b border-zinc-800 px-5 gap-3">
      <div className="flex gap-2">
        <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
        <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
        <div className="w-3 h-3 rounded-full bg-[#28c840]" />
      </div>
      <div className="flex-1 flex justify-center">
        <div className="bg-zinc-800 rounded-md px-6 py-1.5 text-xs text-zinc-400 font-medium">
          {url}
        </div>
      </div>
      <div className="w-[62px]" />
    </div>
    {/* App content */}
    <div className="flex-1 overflow-hidden flex flex-col" style={{ height: "calc(100% - 48px)" }}>
      {children}
    </div>
  </AbsoluteFill>
);
