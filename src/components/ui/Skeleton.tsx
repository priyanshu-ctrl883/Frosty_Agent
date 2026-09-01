"use client";

import { motion } from "framer-motion";

/* ─── Base Skeleton Shimmer ─── */
export function Skeleton({
  className = "",
  w = "w-full",
  h = "h-4",
  rounded = "rounded-lg",
}: {
  className?: string;
  w?: string;
  h?: string;
  rounded?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden bg-[var(--line-soft)] ${w} ${h} ${rounded} ${className}`}
    >
      <div className="skeleton-shimmer" />
    </div>
  );
}

/* ─── Card-shaped skeleton for charts/widgets ─── */
export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[28px] border border-[var(--line)] bg-card p-6 flex flex-col gap-4 ${className}`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between">
        <Skeleton w="w-36" h="h-4" />
        <Skeleton w="w-16" h="h-6" rounded="rounded-full" />
      </div>
      {/* Chart body placeholder */}
      <div className="flex-1 min-h-[140px] flex flex-col justify-end gap-2 pt-4">
        <div className="flex items-end gap-2 h-24">
          {[40, 65, 50, 80, 55, 70, 45].map((h, i) => (
            <Skeleton
              key={i}
              w="w-full"
              h={`h-[${h}%]`}
              rounded="rounded-t-md"
              className="flex-1"
            />
          ))}
        </div>
        {/* X-axis labels */}
        <div className="flex justify-between pt-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} w="w-6" h="h-2" rounded="rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── KPI Stat card skeleton ─── */
export function SkeletonKpi() {
  return (
    <div className="relative overflow-hidden p-6 rounded-[28px] border border-[var(--line)] bg-card flex flex-col justify-between min-h-[150px]">
      {/* Icon */}
      <div className="flex justify-between items-center mb-6">
        <Skeleton w="w-10" h="h-10" rounded="rounded-xl" />
      </div>
      {/* Number */}
      <div className="mb-4">
        <Skeleton w="w-24" h="h-10" rounded="rounded-lg" />
      </div>
      {/* Label & bar */}
      <div className="flex flex-col gap-2 mt-auto">
        <Skeleton w="w-20" h="h-3" />
        <Skeleton w="w-12" h="h-1" rounded="rounded-full" />
      </div>
      <div className="skeleton-shimmer" />
    </div>
  );
}

/* ─── Full dashboard skeleton (KPI row + chart grid + activity) ─── */
export function DashboardSkeleton() {
  return (
    <div className="w-full pb-24">
      {/* KPI Row */}
      <div className="mb-10 mt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonKpi key={i} />
          ))}
        </div>
      </div>

      {/* Chart Section Header */}
      <div className="mb-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-3 border-b border-[var(--line-divider)]">
          <div className="flex items-center gap-2">
            <Skeleton w="w-5" h="h-5" rounded="rounded" />
            <Skeleton w="w-48" h="h-6" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton w="w-24" h="h-8" rounded="rounded-xl" />
            <Skeleton w="w-32" h="h-8" rounded="rounded-xl" />
          </div>
        </div>

        {/* Chart Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard className="lg:col-span-2 min-h-[350px]" />
          <SkeletonCard className="min-h-[350px]" />
          <SkeletonCard className="lg:col-span-2 min-h-[350px]" />
          <SkeletonCard className="min-h-[350px]" />
        </div>
      </div>

      {/* Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-[var(--line)]">
        <div className="rounded-[28px] border border-[var(--line)] bg-card p-6">
          <Skeleton w="w-32" h="h-5" className="mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton w="w-9" h="h-9" rounded="rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton w="w-40" h="h-3" />
                  <Skeleton w="w-24" h="h-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[28px] border border-[var(--line)] bg-card p-6">
          <Skeleton w="w-28" h="h-5" className="mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton w="w-8" h="h-8" rounded="rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton w="w-48" h="h-3" />
                  <Skeleton w="w-20" h="h-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Widget card skeleton (matches the chart card shape) ─── */
export function WidgetSkeleton() {
  return (
    <div className="w-full h-full flex flex-col rounded-[28px] border border-[var(--line)] bg-card p-6 overflow-hidden min-w-0 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <Skeleton w="w-32" h="h-4" />
      </div>
      {/* Body */}
      <div className="flex-1 min-h-0 relative flex items-center justify-center">
        <div className="w-full h-full flex flex-col justify-end gap-1.5 pb-2">
          <div className="flex items-end gap-1.5 flex-1">
            {[35, 55, 40, 72, 48, 60, 38, 65, 50, 58].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col justify-end h-full">
                <Skeleton
                  w="w-full"
                  h="h-full"
                  rounded="rounded-t-sm"
                  className={`!h-[${h}%] opacity-${30 + i * 5}`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="skeleton-shimmer" />
    </div>
  );
}

/* ─── Generic Page Skeleton (for Lists, Settings, Data Tables) ─── */
export function PageSkeleton() {
  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-8 pb-24 px-4 sm:px-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between mt-4">
        <Skeleton w="w-48" h="h-8" rounded="rounded-xl" />
        <Skeleton w="w-32" h="h-10" rounded="rounded-xl" />
      </div>

      {/* Main card */}
      <div className="rounded-[28px] border border-[var(--line)] bg-card p-8 flex flex-col gap-6 shadow-[var(--shadow)] relative overflow-hidden">
        <div className="flex items-center gap-4 border-b border-[var(--line-divider)] pb-6 z-10">
          <Skeleton w="w-12" h="h-12" rounded="rounded-xl" />
          <div className="flex flex-col gap-2">
            <Skeleton w="w-64" h="h-5" />
            <Skeleton w="w-40" h="h-3" />
          </div>
        </div>

        {/* Content rows */}
        <div className="flex flex-col gap-4 pt-2 z-10">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-[var(--surf-1)] border border-[var(--line)]">
              <div className="flex items-center gap-4">
                <Skeleton w="w-10" h="h-10" rounded="rounded-full" />
                <div className="flex flex-col gap-2">
                  <Skeleton w="w-32" h="h-4" />
                  <Skeleton w="w-24" h="h-3" />
                </div>
              </div>
              <Skeleton w="w-16" h="h-8" rounded="rounded-lg" />
            </div>
          ))}
        </div>
        <div className="skeleton-shimmer" />
      </div>
    </div>
  );
}

/* ─── Table Skeleton (for Leads, Activity, Meetings, Quotes) ─── */
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6 pb-24">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton w="w-48" h="h-10" rounded="rounded-xl" />
        <Skeleton w="w-32" h="h-10" rounded="rounded-xl" />
        <Skeleton w="w-28" h="h-10" rounded="rounded-xl" />
        <div className="flex-1" />
        <Skeleton w="w-36" h="h-10" rounded="rounded-xl" />
      </div>

      {/* Table */}
      <div className="rounded-[28px] border border-[var(--line)] bg-card overflow-hidden shadow-[var(--shadow)] relative">
        {/* Header row */}
        <div className="flex items-center gap-4 px-6 py-4 border-b border-[var(--line-divider)] bg-[var(--surf-1)]">
          {[80, 120, 100, 80, 60].map((w, i) => (
            <Skeleton key={i} w={`w-${Math.round(w / 4)}`} h="h-3" />
          ))}
        </div>
        {/* Data rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-6 py-4 border-b border-[var(--line-divider)] last:border-b-0"
          >
            <Skeleton w="w-8" h="h-8" rounded="rounded-full" />
            <div className="flex-1 flex flex-col gap-1.5">
              <Skeleton w="w-32" h="h-3.5" />
              <Skeleton w="w-20" h="h-2.5" />
            </div>
            <Skeleton w="w-16" h="h-6" rounded="rounded-full" />
            <Skeleton w="w-20" h="h-3" />
            <Skeleton w="w-8" h="h-8" rounded="rounded-lg" />
          </div>
        ))}
        <div className="skeleton-shimmer" />
      </div>
    </div>
  );
}

/* ─── Inbox Skeleton (two-pane: queue list + chat area) ─── */
export function InboxSkeleton() {
  return (
    <div className="flex gap-4 h-[calc(100vh-220px)] min-h-[400px]">
      {/* Queue panel */}
      <div className="w-80 shrink-0 rounded-[28px] border border-[var(--line)] bg-card p-4 flex flex-col gap-3 overflow-hidden relative">
        <Skeleton w="w-full" h="h-10" rounded="rounded-xl" />
        <div className="flex gap-2 mb-1">
          <Skeleton w="w-20" h="h-7" rounded="rounded-full" />
          <Skeleton w="w-20" h="h-7" rounded="rounded-full" />
          <Skeleton w="w-20" h="h-7" rounded="rounded-full" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--surf-1)]">
            <Skeleton w="w-10" h="h-10" rounded="rounded-full" />
            <div className="flex-1 flex flex-col gap-1.5">
              <Skeleton w="w-24" h="h-3.5" />
              <Skeleton w="w-32" h="h-2.5" />
            </div>
            <Skeleton w="w-5" h="h-5" rounded="rounded-full" />
          </div>
        ))}
        <div className="skeleton-shimmer" />
      </div>
      {/* Chat area */}
      <div className="flex-1 rounded-[28px] border border-[var(--line)] bg-card p-6 flex flex-col overflow-hidden relative">
        <div className="flex items-center gap-3 pb-4 border-b border-[var(--line-divider)] mb-4">
          <Skeleton w="w-10" h="h-10" rounded="rounded-full" />
          <div className="flex flex-col gap-1.5">
            <Skeleton w="w-32" h="h-4" />
            <Skeleton w="w-20" h="h-2.5" />
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-4 justify-end">
          <div className="flex gap-3">
            <Skeleton w="w-8" h="h-8" rounded="rounded-full" />
            <Skeleton w="w-48" h="h-16" rounded="rounded-2xl" />
          </div>
          <div className="flex gap-3 justify-end">
            <Skeleton w="w-56" h="h-12" rounded="rounded-2xl" />
          </div>
          <div className="flex gap-3">
            <Skeleton w="w-8" h="h-8" rounded="rounded-full" />
            <Skeleton w="w-40" h="h-12" rounded="rounded-2xl" />
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-[var(--line-divider)]">
          <Skeleton w="w-full" h="h-12" rounded="rounded-xl" />
        </div>
        <div className="skeleton-shimmer" />
      </div>
    </div>
  );
}

/* ─── Knowledge Base Skeleton ─── */
export function KnowledgeSkeleton() {
  return (
    <div className="w-full flex flex-col gap-8 pb-24">
      {/* Stat cards row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[28px] border border-[var(--line)] bg-card p-5 flex items-center gap-3 relative overflow-hidden">
            <Skeleton w="w-11" h="h-11" rounded="rounded-xl" />
            <div className="flex flex-col gap-1.5">
              <Skeleton w="w-12" h="h-7" rounded="rounded-lg" />
              <Skeleton w="w-20" h="h-2.5" />
            </div>
            <div className="skeleton-shimmer" />
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton w="w-64" h="h-10" rounded="rounded-xl" />
        <div className="flex-1" />
        <Skeleton w="w-28" h="h-10" rounded="rounded-xl" />
        <Skeleton w="w-36" h="h-10" rounded="rounded-xl" />
      </div>

      {/* Source cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-[28px] border border-[var(--line)] bg-card p-5 flex flex-col gap-3 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <Skeleton w="w-10" h="h-10" rounded="rounded-xl" />
              <div className="flex-1 flex flex-col gap-1.5">
                <Skeleton w="w-32" h="h-4" />
                <Skeleton w="w-20" h="h-2.5" />
              </div>
            </div>
            <Skeleton w="w-full" h="h-2" rounded="rounded-full" />
            <div className="flex justify-between items-center">
              <Skeleton w="w-16" h="h-6" rounded="rounded-full" />
              <Skeleton w="w-20" h="h-3" />
            </div>
            <div className="skeleton-shimmer" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Settings Skeleton ─── */
export function SettingsSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 pb-24">
      {/* Tab bar */}
      <div className="flex gap-2 border-b border-[var(--line-divider)] pb-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} w="w-24" h="h-9" rounded="rounded-xl" />
        ))}
      </div>

      {/* Settings sections */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-[28px] border border-[var(--line)] bg-card p-8 flex flex-col gap-6 relative overflow-hidden">
          <div className="flex items-center gap-3 pb-4 border-b border-[var(--line-divider)]">
            <Skeleton w="w-8" h="h-8" rounded="rounded-lg" />
            <div className="flex flex-col gap-1.5">
              <Skeleton w="w-40" h="h-5" />
              <Skeleton w="w-64" h="h-3" />
            </div>
          </div>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between">
                <div className="flex flex-col gap-1.5">
                  <Skeleton w="w-32" h="h-4" />
                  <Skeleton w="w-48" h="h-2.5" />
                </div>
                <Skeleton w="w-20" h="h-8" rounded="rounded-lg" />
              </div>
            ))}
          </div>
          <div className="skeleton-shimmer" />
        </div>
      ))}
    </div>
  );
}
