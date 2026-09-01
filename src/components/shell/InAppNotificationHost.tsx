"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, X } from "lucide-react";
import type { InAppToastDetail } from "@/lib/notificationPrefs";
import {
  handleInboxEventForNotifications,
  loadClientPrefs,
  parseServerNotificationPrefs,
} from "@/lib/notificationPrefs";
import { subscribeInboxRealtime, isInboxChangeEvent } from "@/lib/inboxRealtime";
import { apiRequest } from "@/lib/api";
import { canFeature } from "@/lib/entitlements";
import { can } from "@/lib/permissions";
import type { MerchantSettings } from "@/lib/types";
import { useWorkspace } from "@/lib/workspace";

type Toast = InAppToastDetail & { id: number };

let toastId = 0;

export function InAppNotificationHost() {
  const { me, entitlements } = useWorkspace();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [serverPrefs, setServerPrefs] = useState(parseServerNotificationPrefs(null));

  useEffect(() => {
    let cancelled = false;
    void apiRequest<MerchantSettings>("/v1/settings")
      .then((snap) => {
        if (!cancelled) {
          setServerPrefs(parseServerNotificationPrefs(snap.notification_prefs as Record<string, unknown>));
        }
      })
      .catch(() => {});

    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<InAppToastDetail>).detail;
      if (!detail?.title) return;
      const id = ++toastId;
      setToasts((prev) => [...prev.slice(-2), { ...detail, id }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 8000);
    };

    window.addEventListener("frosty:in-app-toast", onToast);
    const reloadPrefs = () => {
      void apiRequest<MerchantSettings>("/v1/settings")
        .then((snap) => setServerPrefs(parseServerNotificationPrefs(snap.notification_prefs as Record<string, unknown>)))
        .catch(() => {});
    };
    window.addEventListener("frosty:notification-prefs-updated", reloadPrefs);
    return () => {
      cancelled = true;
      window.removeEventListener("frosty:in-app-toast", onToast);
      window.removeEventListener("frosty:notification-prefs-updated", reloadPrefs);
    };
  }, []);

  useEffect(() => {
    if (!me || !can(me.permissions, "inbox:read")) return;
    if (!canFeature(entitlements, "human_handoff")) return;
    return subscribeInboxRealtime({
      onEvent: (evt) => {
        if (!isInboxChangeEvent(evt)) return;
        const client = loadClientPrefs();
        handleInboxEventForNotifications(evt, client, serverPrefs);
      },
    });
  }, [me, entitlements, serverPrefs]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none max-w-sm w-full"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto rounded-2xl border shadow-lg p-4 flex gap-3 animate-in slide-in-from-right-5 fade-in duration-300 ${
            toast.variant === "urgent"
              ? "bg-amber-50 border-amber-200 text-amber-950"
              : "bg-[var(--lt-card)] border-[var(--brand-border)] text-foreground"
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              toast.variant === "urgent" ? "bg-amber-200/60 text-amber-900" : "bg-[var(--brand-muted)] text-[var(--brand)]"
            }`}
          >
            <Bell size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm leading-tight">{toast.title}</div>
            {toast.body ? <p className="text-xs mt-1 opacity-80 leading-relaxed">{toast.body}</p> : null}
            {toast.href ? (
              <Link
                href={toast.href}
                className="inline-block mt-2 text-xs font-bold text-[var(--brand)] hover:underline no-underline"
              >
                View details →
              </Link>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            className="p-1 rounded-lg hover:bg-black/5 border-none bg-transparent cursor-pointer shrink-0 self-start opacity-60 hover:opacity-100"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
