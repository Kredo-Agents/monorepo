"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function RootFooter() {
  const pathname = usePathname();

  if (pathname.startsWith("/dashboard")) {
    return null;
  }

  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500 dark:text-zinc-400">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <span>Built by <span className="font-medium text-zinc-900 dark:text-zinc-50">Kredo AG</span></span>
          <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">·</span>
          <span>Built for the <span className="font-medium text-zinc-900 dark:text-zinc-50">pump.fun hackathon</span></span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors">
            Dashboard
          </Link>
          <a
            href="https://pump.fun"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
          >
            pump.fun
          </a>
          <a
            href="https://github.com/Kredo-Agents/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
