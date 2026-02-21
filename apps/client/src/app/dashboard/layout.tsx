'use client';

import { PropsWithChildren, useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import UserAvatar from '@/components/auth/UserAvatar';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import {
  CalendarClock,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Settings,
  X,
  Coins,
} from 'lucide-react';

export default function DashboardLayout({ children }: PropsWithChildren) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-zinc-50 mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (instancesLoaded && !hasInstance) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 dark:border-zinc-50 mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Setting up your assistant...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/dashboard', label: 'Chat', Icon: MessageCircle },
    { href: '/dashboard/skills', label: 'Skills', Icon: LayoutDashboard },
    { href: '/dashboard/automations', label: 'Automations', Icon: CalendarClock },
    { href: '/dashboard/credits', label: 'Credits', Icon: Coins },
    { href: '/dashboard/settings', label: 'Settings', Icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 md:flex">
      <aside className="hidden md:flex w-64 border-r border-zinc-200/70 dark:border-zinc-800/70 bg-white/80 dark:bg-zinc-950/40 backdrop-blur px-4 py-6 flex-col">
        <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 px-2">
          Kredo
        </Link>

        <div className="mt-6 space-y-1">
          {navItems.map(({ href, label, Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/70'
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </div>

        <div className="mt-auto pt-6 border-t border-zinc-200/70 dark:border-zinc-800/70">
          <div className="flex items-center gap-3 px-2">
            <UserAvatar size="md" dropdownPosition="up" />
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              {user.fullName || user.firstName || 'User'}
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-black">
        <div className="md:hidden border-b border-zinc-200/70 dark:border-zinc-800/70 bg-white/80 dark:bg-zinc-950/40 backdrop-blur px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-zinc-200/70 dark:border-zinc-800/70 bg-white/80 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-200"
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </button>
            <Link href="/" className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Kredo
            </Link>
            <UserAvatar size="sm" />
          </div>
        </div>

        <div
          className={`md:hidden fixed inset-0 z-40 transition-opacity ${
            isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          aria-hidden={!isMenuOpen}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsMenuOpen(false)}
            aria-label="Close menu"
          />
          <div
            className={`relative h-full w-72 bg-white dark:bg-zinc-950 border-r border-zinc-200/70 dark:border-zinc-800/70 px-4 py-6 flex flex-col transform transition-transform duration-200 ${
              isMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Kredo</div>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex items-center justify-center h-9 w-9 rounded-md border border-zinc-200/70 dark:border-zinc-800/70 bg-white/80 dark:bg-zinc-900/60 text-zinc-700 dark:text-zinc-200"
                aria-label="Close menu"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-6 space-y-1">
              {navItems.map(({ href, label, Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900'
                        : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70 dark:text-zinc-400 dark:hover:text-zinc-50 dark:hover:bg-zinc-800/70'
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {label}
                  </Link>
                );
              })}
            </div>

          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
