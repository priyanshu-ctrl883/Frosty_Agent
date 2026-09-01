'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Cookie } from 'lucide-react';
import {
  openConsentPreferencesModal,
  shouldShowFloatingCookieTrigger,
} from '@/lib/useConsentGate';

export const CookiePreferencesTrigger: React.FC = () => {
  const pathname = usePathname() ?? '';

  if (!shouldShowFloatingCookieTrigger(pathname)) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <button
        type="button"
        onClick={openConsentPreferencesModal}
        aria-label="Cookie & Privacy Preferences"
        title="Manage Cookie & Privacy Preferences"
        className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 hover:bg-white border border-[#D9EDEE] hover:border-[#0396A6]/40 shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_16px_rgba(3,150,166,0.12)] backdrop-blur-md text-xs font-semibold text-muted-foreground hover:text-[#0396A6] transition-all duration-200 cursor-pointer"
      >
        <div className="w-5 h-5 rounded-full bg-[#0396A6]/10 text-[#0396A6] flex items-center justify-center shrink-0">
          <Cookie size={12} className="group-hover:rotate-12 transition-transform duration-300" />
        </div>
        <span className="hidden sm:inline text-[11px] font-medium tracking-tight">
          Cookie Preferences
        </span>
      </button>
    </div>
  );
};
