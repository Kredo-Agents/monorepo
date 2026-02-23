import React from "react";
import { staticFile } from "remotion";
import {
  CalendarClock,
  ChevronsLeft,
  Coins,
  LayoutDashboard,
  MessageCircle,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Chat", Icon: MessageCircle },
  { href: "/dashboard/skills", label: "Skills", Icon: LayoutDashboard },
  { href: "/dashboard/automations", label: "Automations", Icon: CalendarClock },
  { href: "/dashboard/credits", label: "Credits", Icon: Coins },
  { href: "/dashboard/settings", label: "Settings", Icon: Settings },
];

export const DashboardShell: React.FC<{
  activeRoute?: string;
  children: React.ReactNode;
}> = ({ activeRoute = "/dashboard", children }) => {
  return (
    <div className="min-h-full bg-zinc-950 flex" style={{ height: "100%" }}>
      {/* Sidebar */}
      <aside className="flex border-r border-zinc-800/70 bg-zinc-950/40 backdrop-blur px-3 py-6 flex-col w-64">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 font-semibold tracking-tight text-zinc-50 text-lg">
            <img src={staticFile("logo-footer.png")} alt="" className="h-6 w-6 shrink-0" />
            Kredo
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center h-7 w-7 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/70 transition-colors"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-6 space-y-1">
          {navItems.map(({ href, label, Icon }) => {
            const isActive = activeRoute === href;
            return (
              <div
                key={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-zinc-50 text-zinc-900"
                    : "text-zinc-400 hover:text-zinc-50 hover:bg-zinc-800/70"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </div>
            );
          })}
        </div>

        <div className="mt-auto pt-6 border-t border-zinc-800/70">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-300">
              JK
            </div>
            <div className="text-sm text-zinc-400">Julian</div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 bg-gradient-to-b from-zinc-950 to-black">
        {children}
      </main>
    </div>
  );
};
