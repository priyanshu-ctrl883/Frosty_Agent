"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  ArrowRight,
  Flame,
  MessageSquare,
  Calendar,
  CreditCard,
  MessageCircle,
  Shield,
  X,
  Activity,
  RefreshCw,
  BookOpen,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import { alertCopy, isUnread } from "@/lib/alerts";
import { isInboxChangeEvent, subscribeInboxRealtime } from "@/lib/inboxRealtime";
import { relative } from "@/lib/format";
import type { AlertPage, MerchantAlert } from "@/lib/types";

type IconConfig = {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  bg: string;
};

function getAlertIcon(alertType: string, kind?: string): IconConfig {
  switch (alertType) {
    case "hot_lead_detected":
    case "lead_score_threshold":
      return {
        icon: Flame,
        bg: "bg-rose-50 text-rose-600 border-rose-100",
      };
    case "custom":
      if (kind === "meeting_needs_approval") {
        return { icon: Calendar, bg: "bg-purple-50 text-purple-600 border-purple-100" };
      }
      if (kind === "agent_probe_down" || kind === "agent_probe_recovered") {
        return { icon: Activity, bg: "bg-sky-50 text-sky-600 border-sky-100" };
      }
      if (kind === "handoff_requested") {
        return { icon: MessageSquare, bg: "bg-teal-50 text-[#0396A6] border-teal-100" };
      }
      return { icon: MessageSquare, bg: "bg-teal-50 text-[#0396A6] border-teal-100" };
    case "calendar_sync_failed":
    case "erasure_calendar_failed":
      return { icon: Calendar, bg: "bg-amber-50 text-amber-600 border-amber-100" };
    case "credit_warning_80":
    case "credit_warning_100":
    case "payment_failed":
      return { icon: CreditCard, bg: "bg-amber-50 text-amber-600 border-amber-100" };
    case "wa_send_failed":
    case "wa_session_expired":
    case "wa_account_disconnected":
      return { icon: MessageCircle, bg: "bg-red-50 text-red-600 border-red-100" };
    case "impersonation_request":
      return { icon: Shield, bg: "bg-cyan-50 text-cyan-600 border-cyan-100" };
    case "kb_ingestion_failed":
    case "kb_storage_warning":
      return { icon: BookOpen, bg: "bg-emerald-50 text-emerald-600 border-emerald-100" };
    case "handoff_queue_full":
    case "handoff_sla_breach":
      return { icon: MessageSquare, bg: "bg-teal-50 text-[#0396A6] border-teal-100" };
    case "agent_probe_down":
    case "agent_probe_recovered":
      return { icon: Activity, bg: "bg-sky-50 text-sky-600 border-sky-100" };
    default:
      return { icon: Bell, bg: "bg-[#EAF8F8] text-[#0396A6] border-[#C5EEF2]" };
  }
}

interface NotificationPopoverProps {
  unreadCount?: number;
  onUnreadChange?: () => void;
}

export function NotificationPopover({
  unreadCount = 0,
  onUnreadChange,
}: NotificationPopoverProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MerchantAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchRecent = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await apiRequest<AlertPage>("/v1/notifications?limit=8");
      setItems(page.items || []);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
      setError(err instanceof Error ? err.message : "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void fetchRecent();
    }
  }, [open, fetchRecent]);

  useEffect(() => {
    if (!open) return;
    return subscribeInboxRealtime({
      onEvent: (evt) => {
        if (!isInboxChangeEvent(evt)) return;
        void fetchRecent();
        onUnreadChange?.();
      },
    });
  }, [open, fetchRecent, onUnreadChange]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleMarkAllRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const unreadItems = items.filter((a) => isUnread(a));
    if (unreadItems.length === 0) return;

    setMarkingAll(true);
    try {
      await Promise.all(
        unreadItems.map((a) =>
          apiRequest(`/v1/notifications/${a.id}`, {
            method: "PATCH",
            body: { status: "dismissed" },
          }),
        ),
      );
      setItems((prev) =>
        prev.map((a) => ({ ...a, status: "dismissed" as const })),
      );
      onUnreadChange?.();
    } catch (err) {
      console.error("Failed to mark all as read", err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleItemClick = async (alert: MerchantAlert) => {
    const copy = alertCopy(alert);
    if (isUnread(alert)) {
      try {
        await apiRequest(`/v1/notifications/${alert.id}`, {
          method: "PATCH",
          body: { status: "dismissed" },
        });
        setItems((prev) =>
          prev.map((a) =>
            a.id === alert.id ? { ...a, status: "dismissed" as const } : a,
          ),
        );
        onUnreadChange?.();
      } catch (err) {
        console.error("Failed to acknowledge notification", err);
      }
    }

    setOpen(false);
    if (copy.href) {
      router.push(copy.href);
    }
  };

  const handleSeeAll = () => {
    setOpen(false);
    router.push("/notifications");
  };

  const unreadInList = items.filter((a) => isUnread(a)).length;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`relative inline-flex shrink-0 items-center justify-center w-8 h-8 rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0396A6]/40 cursor-pointer ${
          open
            ? "bg-[#EAF8F8] text-[#0396A6]"
            : "text-muted-foreground hover:bg-[#EAF8F8]/70 hover:text-[#0396A6]"
        }`}
        aria-label={
          unreadCount
            ? `Notifications — ${unreadCount} unread`
            : "Notifications"
        }
        aria-expanded={open}
      >
        <Bell className="w-[17px] h-[17px]" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#0396A6] text-white text-[10px] font-bold flex items-center justify-center shadow-[0_0_0_2px_var(--lt-card,#fff)]">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] w-[min(380px,calc(100vw-24px))] rounded-2xl border border-[#E8E4DE] bg-white shadow-[0_20px_50px_-12px_rgba(10,26,47,0.18)] z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-200"
          role="dialog"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#EFEAE3] bg-gradient-to-b from-[#FAF9F7] to-white">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[#0A1A2F] tracking-tight">
                Notifications
              </span>
              {unreadInList > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0396A6]/10 text-[#0396A6]">
                  {unreadInList} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => void fetchRecent()}
                disabled={loading}
                className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-[#0396A6] hover:bg-[#EAF8F8] transition-colors cursor-pointer disabled:opacity-50"
                aria-label="Refresh notifications"
                title="Refresh"
              >
                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              </button>
              {unreadInList > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0396A6] hover:text-[#027582] disabled:opacity-50 transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-[#EAF8F8]"
                  title="Mark all as read"
                >
                  <CheckCheck size={12} />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          <div
            className="overflow-y-auto max-h-[min(340px,50vh)]"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {error && items.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <p className="text-xs font-semibold text-red-600">{error}</p>
                <button
                  type="button"
                  onClick={() => void fetchRecent()}
                  className="mt-2 text-xs font-bold text-[#0396A6] hover:underline cursor-pointer"
                >
                  Try again
                </button>
              </div>
            ) : loading && items.length === 0 ? (
              <div className="p-4 space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex gap-3 items-start animate-pulse">
                    <div className="w-9 h-9 rounded-xl bg-[#F3F0EB] shrink-0" />
                    <div className="flex-1 space-y-2 pt-0.5">
                      <div className="h-3 bg-[#F3F0EB] rounded-md w-2/3" />
                      <div className="h-2.5 bg-[#F3F0EB]/80 rounded-md w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="py-10 px-4 text-center flex flex-col items-center">
                <div className="w-11 h-11 rounded-2xl bg-[#EAF8F8] flex items-center justify-center text-[#0396A6] mb-2">
                  <Bell size={20} />
                </div>
                <p className="text-sm font-bold text-[#0A1A2F]">All caught up</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
                  New alerts for leads, handoffs, billing, and agent health will show up here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-[#EFEAE3]/80">
                {items.map((alert) => {
                  const unread = isUnread(alert);
                  const copy = alertCopy(alert);
                  const kind = String(alert.data?.kind || "");
                  const iconConfig = getAlertIcon(alert.alert_type, kind);
                  const IconComponent = iconConfig.icon;

                  return (
                    <li key={alert.id}>
                      <button
                        type="button"
                        onClick={() => void handleItemClick(alert)}
                        className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer group ${
                          unread
                            ? "bg-[#0396A6]/[0.04] hover:bg-[#0396A6]/[0.08]"
                            : "hover:bg-[#FAF9F7]"
                        }`}
                      >
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${iconConfig.bg}`}
                        >
                          <IconComponent size={16} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-0.5">
                            <p
                              className={`text-[13px] leading-snug ${
                                unread
                                  ? "font-bold text-[#0A1A2F]"
                                  : "font-semibold text-[#0A1A2F]/85"
                              }`}
                            >
                              {copy.title}
                            </p>
                            <span className="text-[10px] text-muted-foreground shrink-0 whitespace-nowrap pt-0.5">
                              {relative(alert.created_at)}
                            </span>
                          </div>
                          <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed">
                            {copy.body}
                          </p>
                          {copy.href && (
                            <span className="inline-flex items-center gap-0.5 mt-1.5 text-[10px] font-semibold text-[#0396A6] opacity-0 group-hover:opacity-100 transition-opacity">
                              View
                              <ArrowRight size={10} />
                            </span>
                          )}
                        </div>

                        {unread && (
                          <span
                            className="w-2 h-2 rounded-full bg-[#0396A6] shrink-0 mt-2"
                            aria-hidden
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="px-3 py-2.5 border-t border-[#EFEAE3] bg-[#FAF9F7]/80">
            <button
              type="button"
              onClick={handleSeeAll}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-[12px] font-bold text-[#0396A6] hover:bg-[#EAF8F8] transition-colors cursor-pointer"
            >
              <span>See all notifications</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
