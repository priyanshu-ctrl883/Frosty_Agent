"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Layers } from "lucide-react";

export type MobileBottomNavTab = {
  key?: string;
  id?: string;
  label: string;
  icon?: React.ReactNode | React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  href?: string;
  badge?: number | string | React.ReactNode;
};

export type MobileBottomNavProps = {
  tabs: readonly MobileBottomNavTab[] | MobileBottomNavTab[];
  activeTab: string;
  onTabChange?: (key: string) => void;
  className?: string;
  usePortal?: boolean;
};

export function MobileBottomNav({
  tabs,
  activeTab,
  onTabChange,
  className,
  usePortal = false,
}: MobileBottomNavProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const content = (
    <nav
      className={cn(
        "md:hidden fixed z-50 left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-300",
        "bottom-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))]",
        "w-[calc(100%-24px)] max-w-[420px]",
        className
      )}
      aria-label="Mobile bottom navigation"
    >
      <div
        className="pointer-events-auto relative flex items-center justify-around px-2 py-1.5 rounded-[28px] transition-all duration-300 select-none"
        style={{
          background: "var(--lt-card, rgba(255, 255, 255, 0.95))",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid var(--lt-border, rgba(226, 220, 239, 0.8))",
          boxShadow: "0 12px 36px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.04)",
        }}
      >
        {tabs.map((tab) => {
          const tabKey = tab.key ?? tab.id ?? tab.label;
          const isActive = activeTab === tabKey;

          // Render icon whether it's a React element or a component type
          const renderIcon = () => {
            if (!tab.icon) {
              return <Layers className="!w-5 !h-5 shrink-0" />;
            }
            if (React.isValidElement(tab.icon)) {
              return React.cloneElement(tab.icon as React.ReactElement<{ className?: string; size?: number }>, {
                className: cn(
                  "!w-5 !h-5 shrink-0 transition-colors duration-200",
                  isActive ? "text-white" : "text-[#8B847B]"
                ),
              });
            }
            if (typeof tab.icon === "function" || typeof tab.icon === "object") {
              const IconComp = tab.icon as React.ComponentType<{ size?: number; className?: string }>;
              return <IconComp size={20} className={cn("!w-5 !h-5 shrink-0 transition-colors duration-200", isActive ? "text-white" : "text-[#8B847B]")} />;
            }
            return <Layers className="!w-5 !h-5 shrink-0" />;
          };

          const inner = (
            <>
              {/* Icon Container: Filled squircle for active, transparent for inactive */}
              <div
                className={cn(
                  "relative flex items-center justify-center w-11 h-11 rounded-[14px] transition-all duration-200",
                  isActive
                    ? "bg-[#0396A6] text-white shadow-[0_4px_14px_rgba(3,150,166,0.35)] scale-[1.04]"
                    : "bg-transparent text-[#8B847B] hover:text-[#5F6B73]"
                )}
                style={{
                  background: isActive ? "var(--brand, #0396A6)" : "transparent",
                }}
              >
                {renderIcon()}
                {Boolean(tab.badge) && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#D96464] text-white text-[9px] font-extrabold flex items-center justify-center shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-[10px] sm:text-[11px] tracking-tight transition-colors duration-200 text-center truncate max-w-full leading-tight select-none",
                  isActive
                    ? "text-[#0396A6] font-bold"
                    : "text-[#8B847B] font-medium"
                )}
                style={{
                  color: isActive ? "var(--brand, #0396A6)" : "var(--lt-text-secondary, #8B847B)",
                }}
              >
                {tab.label}
              </span>
            </>
          );

          const itemCls = cn(
            "flex flex-col items-center justify-center min-w-[48px] flex-1 gap-1 py-0.5 px-0.5 rounded-xl transition-all duration-200 focus-visible:outline-none shrink-0 group active:scale-95 cursor-pointer"
          );

          if (tab.href) {
            return (
              <Link
                key={tabKey}
                href={tab.href}
                aria-label={tab.label}
                aria-current={isActive ? "page" : undefined}
                className={itemCls}
              >
                {inner}
              </Link>
            );
          }

          return (
            <button
              key={tabKey}
              type="button"
              onClick={() => onTabChange?.(tabKey)}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
              className={itemCls}
            >
              {inner}
            </button>
          );
        })}
      </div>
    </nav>
  );

  if (usePortal && mounted && typeof document !== "undefined") {
    return createPortal(content, document.body);
  }

  return content;
}
