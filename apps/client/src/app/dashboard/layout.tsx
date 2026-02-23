'use client';

import { PropsWithChildren, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import UserAvatar from '@/components/auth/UserAvatar';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import InstallPrompt from '@/components/InstallPrompt';
import LogoLoader from '@/components/LogoLoader';
import CreditPopover from '@/components/dashboard/CreditPopover';
import {
  CalendarClock,
  ChevronsLeft,
  ChevronsRight,
  Hexagon,
  LayoutDashboard,
  MessageCircle,
  Settings,
  Coins,
} from 'lucide-react';

export default function DashboardLayout({ children }: PropsWithChildren) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: instances } = trpc.instances.list.useQuery(undefined, {
    enabled: !!user,
  });

  const instancesLoaded = !!instances;
  const hasInstance = instances && instances.length > 0;

  useEffect(() => {
    if (isLoaded && !user) {
      router.push('/sign-in');
    }
  }, [isLoaded, user, router]);

  useEffect(() => {
    if (instancesLoaded && !hasInstance) {
      router.replace('/setup');
    }
  }, [instancesLoaded, hasInstance, router]);

  if (!isLoaded || (user && !instances)) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <LogoLoader text="Loading..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (instancesLoaded && !hasInstance) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <LogoLoader text="Setting up your assistant..." />
      </div>
    );
  }

  const navItems = [
    { href: '/dashboard', label: 'Chat', Icon: MessageCircle },
    { href: '/dashboard/skills', label: 'Skills', Icon: LayoutDashboard },
    { href: '/dashboard/automations', label: 'Auto', Icon: CalendarClock },
    { href: '/dashboard/credits', label: 'Credits', Icon: Coins },
    { href: '/dashboard/tokens', label: 'Tokens', Icon: Hexagon },
    { href: '/dashboard/settings', label: 'Settings', Icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 md:flex">
      {/* Desktop sidebar — unchanged */}
      <aside className={`hidden md:flex border-r border-zinc-200/70 dark:border-zinc-800/70 bg-white/80 dark:bg-zinc-950/40 backdrop-blur px-3 py-6 flex-col transition-all duration-200 ${isCollapsed ? 'w-16' : 'w-64'}`}>
        <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2' : 'justify-between px-1'}`}>
          <div className={`flex items-center gap-2 font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 ${isCollapsed ? '' : 'text-lg'}`}>
            <img src="/logo-footer.png" alt="" className="h-6 w-6 shrink-0" />
            {!isCollapsed && 'Kredo'}
          </div>
          {isCollapsed ? (
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="inline-flex items-center justify-center h-7 w-7 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors"
              aria-label="Expand sidebar"
            >
              <ChevronsRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              className="inline-flex items-center justify-center h-7 w-7 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors"
              aria-label="Collapse sidebar"
            >
              <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="mt-6 space-y-1">
          {navItems.map(({ href, label, Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={isCollapsed ? label : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isCollapsed ? 'justify-center' : ''} ${
                  isActive
                    ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/70'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {!isCollapsed && label}
              </Link>
            );
          })}
        </div>

        <div className="mt-auto pt-6 border-t border-zinc-200/70 dark:border-zinc-800/70">
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-3">
              <UserAvatar size="sm" dropdownPosition="up" />
              <button
                type="button"
                onClick={() => setIsCollapsed(false)}
                className="inline-flex items-center justify-center h-7 w-7 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors"
                aria-label="Expand sidebar"
              >
                <ChevronsRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-2">
              <UserAvatar size="md" dropdownPosition="up" />
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                {user.fullName || user.firstName || 'User'}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 min-w-0 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-black md:pb-0 ${pathname === '/dashboard' ? '' : 'pb-20'}`}>
        {/* Mobile top bar for non-chat pages — safe-area-top for iOS PWA */}
        {pathname !== '/dashboard' && (
          <div className="md:hidden safe-area-top">
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-2 font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                <img src="/logo-footer.png" alt="" className="h-5 w-5 shrink-0" />
                <span className="text-sm">Kredo</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditPopover />
                <UserAvatar size="sm" />
              </div>
            </div>
          </div>
        )}
        {children}
      </main>

      <InstallPrompt />

      {/* Floating glass bottom nav */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 safe-area-bottom pointer-events-none">
        <nav className="mx-4 mb-3 pointer-events-auto rounded-2xl bg-white/60 dark:bg-zinc-900/50 backdrop-blur-2xl backdrop-saturate-150 border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20">
          <div className="flex items-center justify-around h-14">
            {navItems.map(({ href, label, Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                    isActive
                      ? 'text-zinc-900 dark:text-zinc-50'
                      : 'text-zinc-400 dark:text-zinc-500'
                  }`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span className="text-[10px] font-medium leading-none">{label}</span>
                  {isActive && (
                    <span className="absolute -bottom-0.5 w-4 h-0.5 rounded-full bg-zinc-900 dark:bg-zinc-50" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
