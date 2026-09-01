"use client";

import { useState } from "react";
import { SlidersHorizontal, X, Check, MessageSquare } from "lucide-react";
import { relative } from "@/lib/format";
import { formatInboxListLabel } from "./inboxDisplay";
import { InboxContactAvatar } from "./InboxContactAvatar";
import type { ActiveConversation, QueueItem } from "@/lib/types";
import styles from "./inbox.module.css";

import { InboxChannelFilterPills } from "./InboxChannelFilterPills";

type StatusFilterType = "all" | "pending" | "claimed" | "closed";

type Props = {
  conversations: ActiveConversation[];
  queue: QueueItem[];
  selected: string | null;
  onSelect: (id: string | null) => void;
  channelFilter: "all" | "whatsapp" | "website";
  setChannelFilter?: (next: "all" | "whatsapp" | "website") => void;
  showChannelFilter?: boolean;
  agentScope?: string;
  currentMembershipId?: string | null;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
};

export function InboxSidebar({
  conversations,
  queue,
  selected,
  onSelect,
  channelFilter,
  setChannelFilter,
  showChannelFilter = false,
  agentScope = "all",
  currentMembershipId,
  hasMore,
  loadingMore,
  onLoadMore,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const waitingIds = new Set(queue.map((q) => q.conversation_id));

  const setDatePreset = (preset: "today" | "yesterday" | "7d" | "30d") => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const formatYMD = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (preset === "today") {
      const todayStr = formatYMD(now);
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === "yesterday") {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = formatYMD(y);
      setStartDate(yStr);
      setEndDate(yStr);
    } else if (preset === "7d") {
      const past = new Date(now);
      past.setDate(past.getDate() - 7);
      setStartDate(formatYMD(past));
      setEndDate(formatYMD(now));
    } else if (preset === "30d") {
      const past = new Date(now);
      past.setDate(past.getDate() - 30);
      setStartDate(formatYMD(past));
      setEndDate(formatYMD(now));
    }
  };

  const items = conversations.filter((item) => {
    // 1. Agent filter (topbar)
    if (agentScope !== "all" && item.agent_id !== agentScope) return false;

    // 2. Channel filter (sidebar pills)
    if (channelFilter !== "all" && item.channel !== channelFilter) return false;

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const label = (item.contact_label || "visitor").toLowerCase();
      const convId = (item.conversation_id || "").toLowerCase();
      if (!label.includes(q) && !convId.includes(q)) return false;
    }

    // 4. Status filter
    const isWaiting = waitingIds.has(item.conversation_id);
    const isHuman = item.mode === "human";
    const isClosed =
      item.handoff_status === "closed" ||
      item.handoff_status === "resolved" ||
      (item as any).status === "closed" ||
      (item as any).status === "resolved";

    if (statusFilter === "pending") {
      if (!isWaiting && item.handoff_status !== "pending" && (item as any).status !== "pending") {
        return false;
      }
    } else if (statusFilter === "claimed") {
      if (
        !isHuman &&
        !item.assigned_to_member_id &&
        item.handoff_status !== "claimed" &&
        item.handoff_status !== "active"
      ) {
        return false;
      }
      if (isClosed) return false;
    } else if (statusFilter === "closed") {
      if (!isClosed) return false;
    }

    // 5. Date range filter
    if (startDate || endDate) {
      const dtStr = item.last_message_at || item.created_at;
      if (!dtStr) return false;
      const msgTime = new Date(dtStr).getTime();

      if (startDate) {
        const startParts = startDate.split("-").map(Number);
        if (startParts.length === 3 && !startParts.some(isNaN)) {
          const startTime = new Date(startParts[0]!, startParts[1]! - 1, startParts[2]!, 0, 0, 0, 0).getTime();
          if (msgTime < startTime) return false;
        }
      }
      if (endDate) {
        const endParts = endDate.split("-").map(Number);
        if (endParts.length === 3 && !endParts.some(isNaN)) {
          const endTime = new Date(endParts[0]!, endParts[1]! - 1, endParts[2]!, 23, 59, 59, 999).getTime();
          if (msgTime > endTime) return false;
        }
      }
    }

    return true;
  });

  const activeFilterCount = (statusFilter !== "all" ? 1 : 0) + (startDate || endDate ? 1 : 0);

  const resetFilters = () => {
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className={`${styles.listPane} ${selected ? styles.sidebarMobileHidden : ""}`}>
      {/* Top Header & Search Area */}
      <div className={styles.sidebarHeader}>
        {/* Search and Advanced Filter Row */}
        <div className={styles.sidebarSearchRow}>
          <div className={styles.searchInputWrapper}>
            <svg
              className={styles.searchIcon}
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search conversations…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.searchClearBtn}
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`${styles.filterToggleBtn} ${(showFilters || activeFilterCount > 0) ? styles.filterToggleBtnActive : ""}`}
            title="Filter conversations by status or date"
            aria-label="Filter conversations"
          >
            <SlidersHorizontal size={16} />
            {activeFilterCount > 0 && (
              <span className={styles.filterBadgeCount}>
                {activeFilterCount}
              </span>
            )}
          </button>

          {/* Filter Popover */}
          {showFilters && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[0.5px]"
                onClick={() => setShowFilters(false)}
              />
              <div className={styles.filterPopover} onClick={(e) => e.stopPropagation()}>
                <div className={styles.filterPopoverArrow} />

                <div className={styles.filterHeader}>
                  <div className="flex items-center gap-2 min-w-0">
                    <SlidersHorizontal size={14} className="text-[#0396A6] shrink-0" />
                    <span className={styles.filterHeading}>Filter</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {activeFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="text-[11px] font-bold text-muted-foreground hover:text-red-500 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowFilters(false)}
                      className={styles.filterCloseBtn}
                      aria-label="Close filters"
                    >
                      <X size={15} />
                    </button>
                  </div>
                </div>

                {/* Filter 1: Status (All, Pending, Claimed, Closed) */}
                <div className={styles.filterSection}>
                  <span className={styles.filterLabel}>Status</span>
                  <div className="grid grid-cols-2 gap-1.5 mt-1">
                    {[
                      { id: "all", label: "All Statuses" },
                      { id: "pending", label: "Pending" },
                      { id: "claimed", label: "Claimed" },
                      { id: "closed", label: "Closed" },
                    ].map((st) => {
                      const isActive = statusFilter === st.id;
                      return (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setStatusFilter(st.id as StatusFilterType)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            isActive
                              ? "bg-[#0396A6] text-white border-[#0396A6] shadow-sm"
                              : "bg-[#f9fafb] text-[#374151] border-[#e5e7eb] hover:bg-[#f3f4f6]"
                          }`}
                        >
                          <span className="truncate">{st.label}</span>
                          {isActive && <Check size={13} className="shrink-0 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Filter 2: Date Range (From Date to To Date) */}
                <div className={styles.filterSection}>
                  <div className="flex items-center justify-between">
                    <span className={styles.filterLabel}>Date Range</span>
                    {(startDate || endDate) && (
                      <button
                        type="button"
                        onClick={() => { setStartDate(""); setEndDate(""); }}
                        className="text-[10px] font-bold text-[#0396A6] hover:underline cursor-pointer"
                      >
                        Clear Dates
                      </button>
                    )}
                  </div>

                  {/* Quick Date Presets */}
                  <div className="grid grid-cols-4 gap-1 mt-1">
                    {[
                      { id: "today", label: "Today" },
                      { id: "yesterday", label: "Yesterday" },
                      { id: "7d", label: "Last 7D" },
                      { id: "30d", label: "Last 30D" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setDatePreset(p.id as any)}
                        className="py-1 px-1.5 rounded-lg text-[11px] font-bold text-center border border-[#e5e7eb] bg-[#f9fafb] text-[#374151] hover:bg-[#0396A6]/10 hover:text-[#0396A6] hover:border-[#0396A6]/30 transition-all cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* From Date & To Date Inputs */}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b7280] mb-1">
                        From Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-2.5 py-1.5 text-xs text-[#111827] outline-none focus:border-[#0396A6] focus:ring-2 focus:ring-[#0396A6]/20 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-wider text-[#6b7280] mb-1">
                        To Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-[#f9fafb] border border-[#e5e7eb] rounded-xl px-2.5 py-1.5 text-xs text-[#111827] outline-none focus:border-[#0396A6] focus:ring-2 focus:ring-[#0396A6]/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-2 border-t border-[#f3f4f6] flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#6b7280] font-medium">
                    {items.length} matching
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="px-4 py-1.5 bg-gradient-to-r from-[#0396A6] to-[#02808E] hover:from-[#028493] hover:to-[#026f7b] text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {showChannelFilter && setChannelFilter ? (
          <InboxChannelFilterPills value={channelFilter} onChange={setChannelFilter} />
        ) : null}

        {/* Active Filters Summary Chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {statusFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-[#0396A6]/10 text-[#0396A6] border border-[#0396A6]/20">
                <span>Status: {statusFilter === "pending" ? "Pending" : statusFilter === "claimed" ? "Claimed" : "Closed"}</span>
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className="hover:text-red-500 p-0.5 cursor-pointer"
                  aria-label="Remove status filter"
                >
                  <X size={10} />
                </button>
              </span>
            )}
            {(startDate || endDate) && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold bg-[#0396A6]/10 text-[#0396A6] border border-[#0396A6]/20">
                <span>
                  {startDate && endDate
                    ? `${startDate} → ${endDate}`
                    : startDate
                    ? `From ${startDate}`
                    : `Until ${endDate}`}
                </span>
                <button
                  type="button"
                  onClick={() => { setStartDate(""); setEndDate(""); }}
                  className="hover:text-red-500 p-0.5 cursor-pointer"
                  aria-label="Remove date filter"
                >
                  <X size={10} />
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={resetFilters}
              className="text-[11px] font-bold text-muted-foreground hover:text-red-500 underline ml-auto cursor-pointer"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Conversations List */}
      {!items.length ? (
        <div className={styles.emptyInbox}>
          <MessageSquare size={28} className="text-muted-foreground/40 mb-2" />
          <p>No conversations found matching filters.</p>
        </div>
      ) : (
        <ul className={styles.list}>
          {items.map((item) => {
            const isWaiting = waitingIds.has(item.conversation_id);
            const isActive = selected === item.conversation_id;
            const label = formatInboxListLabel(
              item.contact_label,
              item.conversation_id,
              item.channel,
            );
            const time = item.last_message_at || item.created_at;
            const isHuman = item.mode === "human";
            const isMine =
              currentMembershipId && item.assigned_to_member_id === currentMembershipId;

            // Preview text — show actual last message of the session
            const preview =
              item.last_message_preview?.trim() || "No messages yet";

            return (
              <li
                key={item.conversation_id}
                className={isActive ? styles.cardActive : styles.card}
                onClick={() => onSelect(item.conversation_id)}
              >
                {isActive && <div className={styles.cardActiveBar} />}
                <div className={styles.cardInner}>
                  {/* Avatar (Teal / Dark Blue, no green dot) */}
                  <div className={styles.avatarWrap}>
                    <InboxContactAvatar
                      contactLabel={item.contact_label}
                      channel={item.channel}
                    />
                  </div>

                  {/* Content */}
                  <div className={styles.cardContent}>
                    <div className={styles.cardTopRow}>
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className={styles.cardName}>{label}</span>
                        {isWaiting ? (
                          <span className={styles.pillWaiting}>Waiting</span>
                        ) : isHuman ? (
                          <span className={styles.pillHuman}>
                            {isMine ? "You" : "Human"}
                          </span>
                        ) : (
                          <span className={styles.pillAi}>AI</span>
                        )}
                      </div>
                      {time && (
                        <span className={styles.cardTime}>{relative(time)}</span>
                      )}
                    </div>

                    {/* Snippet Row */}
                    <div className={styles.cardSnippetRow}>
                      <span className={styles.cardSnippet}>
                        {preview}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Pagination Load More */}
      {hasMore && (
        <div style={{ padding: "10px 14px", borderTop: "1px solid #f0f2f5" }}>
          <button
            type="button"
            onClick={onLoadMore}
            disabled={loadingMore}
            style={{
              width: "100%",
              padding: "7px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              background: "#ffffff",
              fontSize: "0.78rem",
              fontWeight: 600,
              color: "#374151",
              cursor: "pointer",
            }}
          >
            {loadingMore ? "Loading more…" : "Load more conversations ↓"}
          </button>
        </div>
      )}
    </div>
  );
}
