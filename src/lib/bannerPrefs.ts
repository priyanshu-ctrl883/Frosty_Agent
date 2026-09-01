"use client";

import { useState, useEffect, useCallback } from "react";

export type BannerAnimationMode = "revolving" | "static";

const STORAGE_KEY = "frosty_banner_animation_mode";
const EVENT_NAME = "frosty-banner-animation-mode-change";

export function loadBannerAnimationMode(): BannerAnimationMode {
  if (typeof window === "undefined") return "revolving";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "static" || saved === "revolving") return saved;
  } catch {
    // ignore
  }
  return "revolving";
}

export function saveBannerAnimationMode(mode: BannerAnimationMode): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: mode }));
  } catch {
    // ignore
  }
}

export function useBannerAnimationMode() {
  const [mode, setModeState] = useState<BannerAnimationMode>("revolving");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setModeState(loadBannerAnimationMode());
    setMounted(true);

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<BannerAnimationMode>;
      if (customEvent.detail) {
        setModeState(customEvent.detail);
      } else {
        setModeState(loadBannerAnimationMode());
      }
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setModeState(loadBannerAnimationMode());
      }
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const setMode = useCallback((newMode: BannerAnimationMode) => {
    setModeState(newMode);
    saveBannerAnimationMode(newMode);
  }, []);

  return { mode: mounted ? mode : "revolving", setMode, isMounted: mounted };
}
