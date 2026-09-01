"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Search } from "lucide-react";
import { WIDGET_REGISTRY, type WidgetDef } from "./widgetRegistry";

type Props = {
  activeWidgetIds: Set<string>;
  onAdd: (widgetId: string) => void;
};

const CATEGORY_LABELS: Record<string, string> = {
  conversations: "Conversations",
  leads: "Leads",
  ai: "AI & Performance",
  billing: "Billing",
  meetings: "Meetings",
  knowledge: "Knowledge",
};

const CATEGORY_ORDER = ["conversations", "leads", "ai", "knowledge", "billing", "meetings"];

export function AddWidgetPanel({ activeWidgetIds, onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const available = useMemo(() => {
    return WIDGET_REGISTRY.filter((w) => {
      if (activeWidgetIds.has(w.id)) return false;
      if (search) {
        const q = search.toLowerCase();
        return w.label.toLowerCase().includes(q) || w.description.toLowerCase().includes(q) || w.category.includes(q);
      }
      return true;
    });
  }, [activeWidgetIds, search]);

  const grouped = useMemo(() => {
    const map: Record<string, WidgetDef[]> = {};
    for (const w of available) {
      if (!map[w.category]) map[w.category] = [];
      map[w.category]!.push(w);
    }
    return map;
  }, [available]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0396A6]/10 border border-[#0396A6]/20 text-[#0396A6] text-xs font-semibold hover:bg-[#0396A6]/20 transition-all shadow-sm active:scale-95"
      >
        <Plus className="w-3.5 h-3.5 text-[#0396A6]" />
        Add Widget
      </button>

      {typeof window !== "undefined" && createPortal(
        <AnimatePresence>
          {open && (
            <div
              data-lenis-prevent
              className="fixed inset-0 z-[99999] bg-black/50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
              onClick={() => setOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden text-gray-900 select-none my-auto"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white shrink-0">
                  <div>
                    <h2 className="text-base sm:text-lg font-serif font-bold text-gray-900">Add Dashboard Widget</h2>
                    <p className="text-xs text-gray-500 mt-0.5">Select a widget to add to your workspace</p>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Search */}
                <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search widgets by name or category..."
                      className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-gray-200 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0396A6] focus:ring-2 focus:ring-[#0396A6]/20 transition-all shadow-sm"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Widget List */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 bg-white">
                  {available.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 text-xs sm:text-sm">
                      {search ? "No widgets match your search." : "All available widgets are already on your dashboard!"}
                    </div>
                  ) : (
                    CATEGORY_ORDER.map((cat) => {
                      const items = grouped[cat];
                      if (!items?.length) return null;
                      return (
                        <div key={cat}>
                          <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2.5">
                            {CATEGORY_LABELS[cat] || cat}
                          </h3>
                          <div className="space-y-2">
                            {items.map((w) => (
                              <button
                                key={w.id}
                                onClick={() => {
                                  onAdd(w.id);
                                  setOpen(false);
                                }}
                                className="w-full flex items-center gap-3.5 p-3 rounded-xl border border-gray-200 bg-gray-50/60 hover:bg-[#0396A6]/5 hover:border-[#0396A6]/40 transition-all group text-left shadow-sm"
                              >
                                <div className="shrink-0 p-2 rounded-lg bg-[#0396A6]/10 text-[#0396A6] border border-[#0396A6]/20 group-hover:bg-[#0396A6] group-hover:text-white transition-colors">
                                  <Plus className="w-4 h-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs sm:text-sm font-semibold text-gray-900 group-hover:text-[#0396A6] transition-colors">
                                    {w.label}
                                  </div>
                                  <div className="text-[11px] sm:text-xs text-gray-500 mt-0.5 line-clamp-1">
                                    {w.description}
                                  </div>
                                </div>
                                <div className="text-[10px] text-gray-400 font-mono hidden sm:block">
                                  {w.chartTypes.join(" · ")}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
