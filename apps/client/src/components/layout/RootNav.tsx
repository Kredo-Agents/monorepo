"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import Image from "next/image";
import UserAvatar from "@/components/auth/UserAvatar";

export default function RootNav() {
  const pathname = usePathname();
  const { isSignedIn } = useAuth();
  const { openSignIn } = useClerk();

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/setup")) {
    return null;
  }

  return (
    <nav className="border-b border-zinc-200 dark:border-zinc-800 safe-area-top safe-area-left safe-area-right">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-end gap-2">
          <Image src="/logo-footer.png" alt="Kredo" width={120} height={40} className="h-8 w-auto" />
          <span className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Kredo</span>
        </div>
        <div className="flex items-center gap-6 text-sm">
          {isSignedIn ? (
            <UserAvatar size="md" dropdownPosition="down" />
          ) : (
            <button
              type="button"
              onClick={() => openSignIn()}
              className="px-4 py-2 text-sm font-medium text-zinc-900 dark:text-zinc-50 border border-zinc-900 dark:border-zinc-50 rounded-lg hover:bg-zinc-900 hover:text-white dark:hover:bg-zinc-50 dark:hover:text-zinc-900 transition-colors"
            >
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
