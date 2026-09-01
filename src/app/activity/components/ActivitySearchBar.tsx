"use client";

import React, { useEffect, useRef, useState } from "react";
import { Search, X, Sparkles, Command, ArrowRight } from "lucide-react";

interface ActivitySearchBarProps {
  value: string;
  onChange: (val: string) => void;
  totalMatches: number;
  totalItems: number;
  isSearching: boolean;
  className?: string;
}

const QUICK_SUGGESTIONS = [
  { label: "Agent published", query: "published", icon: "rocket_launch" },
  { label: "Chat claimed", query: "claimed", icon: "support_agent" },
  { label: "Lead created", query: "lead", icon: "person_add" },
  { label: "Teammate invited", query: "invited", icon: "group_add" },
  { label: "Settings changed", query: "settings", icon: "settings" },
  { label: "Quote approved", query: "approved", icon: "check_circle" },
];

export function ActivitySearchBar({
  value,
  onChange,
  totalMatches,
  totalItems,
  isSearching,
  className = "",
}: ActivitySearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isMac, setIsMac] = useState(false);

  // Detect OS for shortcut display (⌘K vs Ctrl+K)
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform || ""));
    }
  }, []);

  // Global keyboard shortcut: ⌘K or Ctrl+K or / to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in another input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        if (e.key === "Escape" && document.activeElement === inputRef.current) {
          onChange("");
          inputRef.current?.blur();
          setIsFocused(false);
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setIsFocused(true);
      } else if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsFocused(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onChange]);

  // Click outside to close suggestion dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectSuggestion = (query: string) => {
    onChange(query);
    setIsFocused(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={`relative flex-1 min-w-0 ${className}`}>
      {/* Search Input Container */}
      <div
        className={`relative flex items-center w-full h-10 sm:h-11 rounded-xl sm:rounded-2xl border transition-all duration-200 bg-white ${
          isFocused
            ? "border-[#0396A6] ring-3 ring-[#0396A6]/15 shadow-sm"
            : "border-[var(--line)] hover:border-slate-300 shadow-2xs"
        }`}
      >
        {/* Left Search Icon */}
        <div className="pl-3.5 pr-2 flex items-center justify-center pointer-events-none shrink-0">
          <Search
            className={`w-4 h-4 transition-colors duration-200 ${
              isFocused || value ? "text-[#0396A6]" : "text-[var(--muted)]"
            }`}
          />
        </div>

        {/* Text Input */}
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="Search by event, action, user, or resource..."
          className="w-full h-full bg-transparent text-xs sm:text-sm font-semibold text-[var(--ink)] placeholder:text-[var(--placeholder)] outline-none pr-2 py-2"
          aria-label="Search activity log"
        />

        {/* Right Side: Matches Counter or Shortcut or Clear Button */}
        <div className="flex items-center gap-1.5 pr-2.5 shrink-0">
          {/* Matches Counter when query active */}
          {isSearching && (
            <span className="hidden xs:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#EAF8F8] text-[#0396A6] animate-in fade-in duration-150">
              {totalMatches} {totalMatches === 1 ? "match" : "matches"}
            </span>
          )}

          {/* Clear Button */}
          {value ? (
            <button
              type="button"
              onClick={() => {
                onChange("");
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-slate-100 active:scale-95 transition-all"
              aria-label="Clear search"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            /* Keyboard Shortcut Badge (hidden on touch / small screens) */
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 border border-slate-200 rounded-md select-none">
              {isMac ? "⌘" : "Ctrl"}K
            </kbd>
          )}
        </div>
      </div>

      {/* Quick Suggestions Dropdown (appears on focus when search is empty or short) */}
      {isFocused && !value && (
        <div className="absolute top-full left-0 right-0 mt-1.5 p-2 bg-white rounded-xl sm:rounded-2xl border border-[var(--line)] shadow-xl z-30 animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between px-2.5 py-1.5 mb-1 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#0396A6]" />
              Quick Suggestions
            </span>
            <span className="text-[10px] lowercase font-normal">click to filter</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {QUICK_SUGGESTIONS.map((sug) => (
              <button
                key={sug.query}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault(); // Prevent input blur
                  handleSelectSuggestion(sug.query);
                }}
                className="flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[var(--ink)] hover:bg-[#EAF8F8] hover:text-[#0396A6] transition-colors text-left border border-transparent hover:border-[#B8E0E2]"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="material-symbols-outlined text-[15px] text-[#0396A6] shrink-0">
                    {sug.icon}
                  </span>
                  <span className="truncate">{sug.label}</span>
                </div>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 shrink-0 text-[#0396A6]" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
