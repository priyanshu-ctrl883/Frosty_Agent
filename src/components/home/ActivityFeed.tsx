"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { alertCopy } from "@/lib/alerts";
import { actorLabel, describeActivity } from "@/lib/activityCopy";
import { can } from "@/lib/permissions";
import { relative } from "@/lib/format";
import type { AuditPage, AlertPage, Team } from "@/lib/types";
import { useWorkspace } from "@/lib/workspace";

type FeedItem = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  href: string | null;
  icon: string;
  at: number;
};

const ITEMS_PER_PAGE = 4;

export function ActivityFeed() {
  const [page, setPage] = useState(0);
  const { me } = useWorkspace();
  const canAudit = can(me?.permissions, "team:manage");

  const { data: auditRes, error: auditErr, isLoading: auditLoading } = useSWR<AuditPage | null>(
    canAudit ? "/v1/audit?limit=16" : null,
    (url: string) => apiRequest<AuditPage>(url),
    { refreshInterval: 60_000 },
  );

  const { data: alertRes, error: alertErr, isLoading: alertLoading } = useSWR<AlertPage | null>(
    "/v1/notifications?limit=16",
    (url: string) => apiRequest<AlertPage>(url),
    { refreshInterval: 60_000 },
  );

  const { data: teamRes, isLoading: teamLoading } = useSWR<Team | null>(
    canAudit ? "/v1/team" : null,
    (url: string) => apiRequest<Team>(url).catch(() => null),
  );

  const loading = auditLoading || alertLoading || (canAudit && teamLoading);
  const feedError = Boolean(auditErr || alertErr);

  const membersMap = useMemo(() => {
    const map = new Map<string, { display_name: string; email: string; role: string }>();
    if (teamRes?.members) {
      for (const m of teamRes.members) {
        map.set(m.user_id, {
          display_name: m.display_name || "",
          email: m.email || "",
          role: m.role_name || "",
        });
      }
    }
    if (me) {
      map.set(me.user_id, {
        display_name: me.display_name || "",
        email: me.email || "",
        role: me.role || "",
      });
    }
    return map;
  }, [teamRes, me]);

  const items = useMemo(() => {
    const combined: FeedItem[] = [];

    if (auditRes?.items) {
      for (const ev of auditRes.items) {
        const copy = describeActivity(ev);
        combined.push({
          id: `audit-${ev.id}`,
          title: copy.title,
          subtitle: actorLabel(ev, membersMap),
          time: relative(ev.created_at),
          href: canAudit ? "/settings?tab=activity" : copy.href,
          icon: copy.icon,
          at: new Date(ev.created_at).getTime() || 0,
        });
      }
    }

    if (alertRes?.items) {
      for (const al of alertRes.items) {
        const copy = alertCopy(al);
        combined.push({
          id: `alert-${al.id}`,
          title: copy.title,
          subtitle: copy.body,
          time: relative(al.created_at),
          href: copy.href,
          icon: copy.icon,
          at: new Date(al.created_at).getTime() || 0,
        });
      }
    }

    combined.sort((a, b) => b.at - a.at);
    return combined;
  }, [auditRes, alertRes, canAudit, membersMap]);

  const totalPages = Math.max(1, Math.ceil(items.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageItems = items.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
        <div className="flex items-center gap-2">
          <h3 className="text-base sm:text-lg font-bold font-sans text-foreground">Recent activity</h3>
          {!loading && items.length > ITEMS_PER_PAGE && (
            <span className="text-[11px] font-mono font-bold text-muted-foreground bg-black/5 dark:bg-white/5 px-2.5 py-0.5 rounded-full border border-[var(--line)]">
              {currentPage + 1}/{totalPages}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!loading && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                aria-label="Previous activities"
                title="Previous page"
                className="p-1.5 rounded-lg border border-[var(--line)] bg-card hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground hover:text-foreground transition-all shadow-sm"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                aria-label="Next activities"
                title="Next page"
                className="p-1.5 rounded-lg border border-[var(--line)] bg-card hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed text-muted-foreground hover:text-foreground transition-all shadow-sm"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {canAudit ? (
            <Link href="/settings?tab=activity" className="text-xs font-bold text-[#0396A6] hover:underline ml-1">
              View log
            </Link>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col gap-3 min-h-[260px]">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
            <div key={i} className="flex items-start gap-3.5 p-4 rounded-2xl border border-[var(--line)] bg-card overflow-hidden relative">
              <div className="shrink-0 w-10 h-10 rounded-2xl bg-[var(--line-soft)]" />
              <div className="min-w-0 flex-1 py-1">
                <div className="h-4 w-3/4 bg-[var(--line-soft)] rounded mb-2" />
                <div className="h-3 w-1/2 bg-[var(--line-soft)] rounded" />
              </div>
              <div className="w-10 h-3.5 bg-[var(--line-soft)] rounded mt-1 shrink-0" />
              <div className="skeleton-shimmer" />
            </div>
          ))}
        </div>
      ) : feedError && items.length === 0 ? (
        <div className="text-xs text-[#0396A6] py-8 text-center border border-dashed border-[#0396A6]/25 rounded-2xl bg-[#0396A6]/5">
          Could not load recent activity. Use Clear Cache on the page header and try again.
        </div>
      ) : items.length === 0 ? (
        <div className="text-xs text-muted-foreground py-8 text-center border border-dashed border-[var(--line)] rounded-2xl">
          Nothing yet. New chats, leads, and workspace changes will show up here.
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col gap-3 min-h-[260px]"
          >
            {pageItems.map((event) => {
              const inner = (
                <>
                  <span className="shrink-0 w-10 h-10 rounded-2xl bg-[#0396A6]/10 text-[#0396A6] border border-[#0396A6]/15 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px] leading-none text-[#0396A6]">{event.icon}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold font-sans text-foreground truncate">{event.title}</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5 truncate">{event.subtitle}</p>
                  </div>
                  <span className="text-[11px] font-mono text-muted-foreground shrink-0">{event.time}</span>
                </>
              );
              return (
                <div key={event.id}>
                  {event.href ? (
                    <Link
                      href={event.href}
                      className="flex items-start gap-3.5 p-4 rounded-2xl border border-[var(--line)] bg-[var(--surf-1)]/30 hover:bg-card hover:border-[#0396A6]/30 hover:shadow-xs transition-all"
                    >
                      {inner}
                    </Link>
                  ) : (
                    <div className="flex items-start gap-3.5 p-4 rounded-2xl border border-[var(--line)] bg-card">
                      {inner}
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
