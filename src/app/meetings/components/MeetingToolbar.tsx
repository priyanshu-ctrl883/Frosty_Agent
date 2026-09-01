"use client";

import React, { useState } from "react";
import {
  Bot,
  Calendar as CalendarIcon,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Filter,
  List as ListIcon,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import type { CalendarStatus } from "@/lib/types";
import { MeetingFilterModal } from "./MeetingFilterModal";
import { TableDateFilter } from "@/components/ui/TableDateFilter";

export type ViewMode = "list" | "month" | "week" | "day";

export type FilterStatus =
  | "all"
  | "upcoming"
  | "scheduled"
  | "confirmed"
  | "pending_approval"
  | "rescheduled"
  | "completed"
  | "cancelled";

export type ChannelTag = "all" | "web" | "whatsapp" | "unified";

type Props = {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  filterStatus: FilterStatus;
  onFilterStatusChange: (status: FilterStatus) => void;
  channelFilter?: ChannelTag;
  onChannelFilterChange?: (channel: ChannelTag) => void;
  fromDate?: string;
  onFromDateChange?: (d: string) => void;
  toDate?: string;
  onToDateChange?: (d: string) => void;
  currentDate: Date;
  onDateChange: (d: Date) => void;
  canManage: boolean;
  onOpenCreate: () => void;
  onOpenIntegrations: () => void;
  calendarStatus: CalendarStatus | null;
  onRefresh: () => void;
  loading: boolean;
};

export function MeetingToolbar({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  filterStatus,
  onFilterStatusChange,
  channelFilter = "all",
  onChannelFilterChange,
  fromDate = "",
  onFromDateChange,
  toDate = "",
  onToDateChange,
  currentDate,
  onDateChange,
  canManage,
  onOpenCreate,
  onOpenIntegrations,
  calendarStatus,
  onRefresh,
  loading,
}: Props) {
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  const isGoogleConnected = Boolean(
    calendarStatus?.connections.some((c) => c.provider === "google" && c.connected),
  );
  const isCalendlyConnected = Boolean(
    calendarStatus?.connections.some((c) => c.provider === "calendly" && c.connected),
  );
  const anyConnected =
    isGoogleConnected ||
    isCalendlyConnected ||
    Boolean(calendarStatus?.connected_providers && calendarStatus.connected_providers.length > 0);

  // Active filter count
  const activeFiltersCount =
    (filterStatus !== "all" ? 1 : 0) +
    (channelFilter !== "all" ? 1 : 0) +
    (fromDate || toDate ? 1 : 0);

  // Date Navigation for Month View
  function handlePrev() {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() - 1);
    onDateChange(next);
  }

  function handleNext() {
    const next = new Date(currentDate);
    next.setMonth(next.getMonth() + 1);
    onDateChange(next);
  }

  function handleToday() {
    const now = new Date();
    onDateChange(now);
  }

  // Format Month Year Label (for Month view)
  const formattedMonthLabel = React.useMemo(() => {
    return currentDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  }, [currentDate]);

  return (
    <div className="space-y-3">
      {/* ── ROW 1: Premium Dashboard Toolbar ── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
        {/* Left Section: Search Input + Date Filter + Filter Pop-up Trigger */}
        <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap sm:flex-nowrap">
          {/* Search Pill */}
          <div className="relative flex-1 min-w-[130px]">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-3 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search meetings…"
              className="w-full pl-9 pr-8 py-2 bg-white border border-border rounded-full text-xs font-semibold text-foreground outline-none focus:border-[#0396A6] shadow-xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Filter Dropdown */}
          <TableDateFilter
            preset={!fromDate && !toDate ? "all" : "custom"}
            fromDate={fromDate}
            toDate={toDate}
            onChange={(val) => {
              if (onFromDateChange) onFromDateChange(val.fromDate);
              if (onToDateChange) onToDateChange(val.toDate);
            }}
          />

          {/* Filter Pop-up Pill Button */}
          <button
            type="button"
            onClick={() => setFilterModalOpen(true)}
            className={`py-2 px-4 rounded-full border text-xs font-extrabold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs ${
              activeFiltersCount > 0
                ? "bg-[#0396A6] text-white border-[#0396A6] shadow-[0_4px_14px_rgba(3,150,166,0.3)]"
                : "bg-white hover:bg-[#F7FBFB] text-foreground border-border"
            }`}
            title="Filter Meetings by Status, Agent, or Date"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-[#0396A6] text-[10px] font-black flex items-center justify-center ml-0.5">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Right Section: View Switcher (Styled like 7d/14d/30d/90d pill) + Action Buttons */}
        <div className="flex items-center justify-between md:justify-end gap-2 shrink-0 flex-wrap">
          {/* View Switcher Pill Container */}
          <div className="bg-white p-1 rounded-2xl border border-border shadow-xs flex items-center gap-1 shrink-0">
            {[
              { id: "list" as ViewMode, label: "List", icon: <ListIcon className="w-3.5 h-3.5" /> },
              { id: "month" as ViewMode, label: "Month", icon: <CalendarDays className="w-3.5 h-3.5" /> },
              { id: "week" as ViewMode, label: "Week", icon: <CalendarRange className="w-3.5 h-3.5" /> },
              { id: "day" as ViewMode, label: "Day", icon: <CalendarIcon className="w-3.5 h-3.5" /> },
            ].map((v) => {
              const active = viewMode === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => onViewModeChange(v.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                    active
                      ? "bg-[#0396A6] text-white shadow-sm font-extrabold"
                      : "text-muted-foreground hover:text-foreground hover:bg-[#F7FBFB]"
                  }`}
                  title={`${v.label} View`}
                >
                  {v.icon}
                  <span>{v.label}</span>
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Synced Button */}
            <button
              type="button"
              className="py-2 px-3.5 rounded-full bg-white hover:bg-[#F7FBFB] text-foreground border border-border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs group shrink-0"
              onClick={onOpenIntegrations}
              title="Google Calendar & Calendly Sync Settings"
            >
              <span className="relative flex h-2 w-2">
                {anyConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0396A6] opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    anyConnected ? "bg-[#0396A6]" : "bg-slate-300"
                  }`}
                />
              </span>
              <span className="font-extrabold text-xs">
                {anyConnected ? "Synced" : "Sync"}
              </span>
            </button>

            {/* Refresh Button */}
            <button
              type="button"
              className="p-2 rounded-full bg-white hover:bg-[#F7FBFB] text-foreground border border-border text-xs font-bold transition-all flex items-center justify-center cursor-pointer shrink-0 shadow-xs"
              onClick={onRefresh}
              disabled={loading}
              aria-label="Refresh meetings"
              title="Refresh"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-[#0396A6]" : "text-muted-foreground"}`} />
            </button>

            {/* New Meeting Button */}
            {canManage && (
              <button
                type="button"
                onClick={onOpenCreate}
                className="py-2 px-4 bg-[#0396A6] hover:bg-[#087681] text-white font-extrabold rounded-full text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-[0_4px_14px_rgba(3,150,166,0.35)] transition-all active:scale-98 cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Meeting</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── ROW 2: Only in Month View (Month/Year + Today + < >) ── */}
      {/* Week and Day views do not render this row */}
      {viewMode === "month" && (
        <div className="bg-white p-2 sm:p-2.5 rounded-2xl border border-border shadow-xs flex items-center justify-between sm:justify-end flex-wrap gap-2">
          <span className="text-xs sm:text-sm font-black text-foreground px-2 select-none">
            {formattedMonthLabel}
          </span>
          <div className="flex items-center gap-1 bg-[#F7FBFB] border border-border rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-black text-foreground bg-white border border-border rounded-lg hover:border-[#0396A6] hover:text-[#0396A6] transition-all cursor-pointer shadow-2xs"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white transition-colors cursor-pointer"
              title="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white transition-colors cursor-pointer"
              title="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── FILTER POPUP MODAL ── */}
      <MeetingFilterModal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        filterStatus={filterStatus}
        onFilterStatusChange={onFilterStatusChange}
        channelFilter={channelFilter}
        onChannelFilterChange={onChannelFilterChange || (() => {})}
        fromDate={fromDate}
        onFromDateChange={onFromDateChange}
        toDate={toDate}
        onToDateChange={onToDateChange}
        viewMode={viewMode}
      />
    </div>
  );
}
