"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const KEY = "frosty_cookie_notice_v1";

export const CookieNotice = () => {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      setOpen(window.localStorage.getItem(KEY) !== "1");
    } catch {
      setOpen(false);
    }
  }, []);

  if (
    !open ||
    pathname === "/privacy" ||
    pathname === "/terms" ||
    pathname === "/acceptable-use"
  ) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-xl rounded-2xl border border-border bg-background p-4 shadow-lg"
    >
      <p className="text-xs text-foreground leading-relaxed">
        This dashboard uses <strong>essential cookies</strong> to keep you signed in. 
        We do not set advertising or cross-site tracking cookies. Details:{" "}
        <Link href="/privacy#section-8" className="font-bold text-[#0396A6] underline">
          Privacy Policy
        </Link>
        .
      </p>
      <button
        type="button"
        className="mt-3 rounded-xl bg-[#0396A6] px-4 py-2 text-xs font-bold text-white"
        onClick={() => {
          try {
            window.localStorage.setItem(KEY, "1");
          } catch {
            /* ignore */
          }
          setOpen(false);
        }}
      >
        OK
      </button>
    </div>
  );
};
