'use client';

import { useEffect, useState } from 'react';
import { Share, X } from 'lucide-react';

const DISMISSED_KEY = 'kredo-install-prompt-dismissed';

function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);
  const isStandalone = ('standalone' in navigator && (navigator as any).standalone) || window.matchMedia('(display-mode: standalone)').matches;
  return isIOS && isSafari && !isStandalone;
}

export default function InstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isIOSSafari() && !localStorage.getItem(DISMISSED_KEY)) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setShow(false);
  };

  return (
    <div className="md:hidden fixed top-0 inset-x-0 z-50 safe-area-top animate-fade-in">
      <div className="mx-3 mt-2 flex items-center gap-3 rounded-xl bg-zinc-900 dark:bg-zinc-100 px-4 py-3 text-white dark:text-zinc-900 shadow-lg">
        <Share className="h-5 w-5 shrink-0" aria-hidden="true" />
        <p className="flex-1 text-xs leading-snug">
          Tap <Share className="inline h-3.5 w-3.5 align-text-bottom" aria-hidden="true" /> then <strong>&quot;Add to Home Screen&quot;</strong> for a full-screen app experience.
        </p>
        <button
          onClick={dismiss}
          className="shrink-0 rounded-full p-1 hover:bg-white/20 dark:hover:bg-black/10 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
