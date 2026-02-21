"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function RootFooter() {
  const pathname = usePathname();

  if (pathname.startsWith("/dashboard")) {
    return null;
  }

  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Main footer content */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="sm:col-span-2 flex flex-col gap-4">
            <Image
              src="/logo-footer.png"
              alt="Kredo"
              width={48}
              height={48}
              className="light:invert"
            />
            <div>
              <p className="font-semibold text-zinc-900 dark:text-zinc-50 text-sm">
                Kredo AG
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-xs leading-relaxed">
                The AI cloud assistant for your everyone.
              </p>
            </div>
          </div>

          {/* Product links */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Product
            </p>
            <nav className="flex flex-col gap-2 text-sm">
              <Link
                href="/dashboard"
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
              >
                Dashboard
              </Link>
            </nav>
          </div>

          {/* Resources links */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Resources
            </p>
            <nav className="flex flex-col gap-2 text-sm">
              <a
                href="https://github.com/Kredo-Agents/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
              >
                GitHub
              </a>
              <a
                href="https://pump.fun"
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
              >
                pump.fun
              </a>
            </nav>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400 dark:text-zinc-500">
          <p>&copy; {new Date().getFullYear()} Kredo AG. All rights reserved.</p>
          <p>
            Built for the{" "}
            <a
              href="https://pump.fun"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors underline underline-offset-2"
            >
              pump.fun hackathon
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
