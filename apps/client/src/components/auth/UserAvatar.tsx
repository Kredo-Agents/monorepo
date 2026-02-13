'use client';

import { useUser, useClerk } from '@clerk/nextjs';
import { useEffect, useRef, useState } from 'react';
import { LogOut } from 'lucide-react';

interface UserAvatarProps {
  size?: 'sm' | 'md';
  dropdownPosition?: 'up' | 'down';
}

export default function UserAvatar({ size = 'md', dropdownPosition = 'down' }: UserAvatarProps) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const initials =
    [user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join('') ||
    user.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() ||
    'U';

  const sizeClasses = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm';
  const dropdownClasses =
    dropdownPosition === 'up'
      ? 'bottom-full mb-2 right-0'
      : 'top-full mt-2 right-0';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`${sizeClasses} rounded-full overflow-hidden flex items-center justify-center bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium hover:ring-2 hover:ring-zinc-400 dark:hover:ring-zinc-500 transition-all`}
        aria-label="User menu"
        aria-expanded={open}
      >
        {initials}
      </button>

      {open && (
        <div className={`absolute ${dropdownClasses} w-52 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg py-1 z-50`}>
          <div className="px-3 py-2 border-b border-zinc-100 dark:border-zinc-800">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
              {user.fullName || user.firstName || 'User'}
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
              {user.primaryEmailAddress?.emailAddress}
            </p>
          </div>
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: '/' })}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
