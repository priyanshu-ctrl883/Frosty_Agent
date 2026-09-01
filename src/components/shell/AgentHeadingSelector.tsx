"use client";

import React from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown, Check } from "lucide-react";
import type { Agent } from "@/lib/types";

export interface AgentHeadingSelectorProps {
  agentName: string;
  agents?: Agent[];
  selectedAgentId?: string | null;
  onSelectAgent?: (agentId: string) => void;
  badge?: string;
}

export function AgentHeadingSelector({
  agentName,
  agents = [],
  selectedAgentId,
  onSelectAgent,
  badge,
}: AgentHeadingSelectorProps) {
  const hasAgents = agents.length > 0;

  if (!hasAgents || !onSelectAgent) {
    return (
      <div className="flex items-center gap-1.5 min-w-0 max-w-full">
        <div className="flex items-center gap-1 min-w-0">
          <h1
            className="text-base sm:text-lg md:text-2xl lg:text-3xl font-bold tracking-tight text-[var(--foreground)] whitespace-nowrap"
            title={agentName}
          >
            {agentName}
          </h1>
          {badge && (
            <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground shrink-0">
              {badge}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 min-w-0 max-w-full">
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className="group flex items-center gap-1.5 min-w-0 max-w-full p-1 -ml-1 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left outline-none cursor-pointer select-none"
            title="Switch Agent"
            aria-label="Switch Agent"
          >
            <div className="flex items-center gap-1 min-w-0">
              <h1
                className="text-base sm:text-lg md:text-2xl lg:text-3xl font-bold tracking-tight text-[var(--foreground)] whitespace-nowrap"
                title={agentName}
              >
                {agentName}
              </h1>
              {badge && (
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground shrink-0">
                  {badge}
                </span>
              )}
            </div>

            <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-lg border border-border/80 bg-white dark:bg-zinc-800 text-muted-foreground group-hover:text-foreground group-hover:border-border shadow-2xs transition-all shrink-0">
              <ChevronDown
                size={13}
                className="transition-transform duration-200 group-data-[state=open]:rotate-180"
              />
            </div>
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={6}
            className="z-[9999] min-w-[200px] sm:min-w-[240px] max-w-[320px] overflow-hidden rounded-2xl p-1.5 shadow-2xl border border-border bg-white dark:bg-zinc-900 text-foreground animate-in fade-in-80 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2"
          >
            <div className="space-y-0.5 max-h-[300px] overflow-y-auto no-scrollbar py-0.5">
              {agents.map((a) => {
                const isSelected = a.id === selectedAgentId;
                const displayName = a.agent_name || a.slug || "Assistant";
                return (
                  <DropdownMenu.Item
                    key={a.id}
                    onSelect={() => onSelectAgent(a.id)}
                    onClick={() => onSelectAgent(a.id)}
                    className={`relative flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs cursor-pointer outline-none transition-colors select-none ${
                      isSelected
                        ? "bg-[#0396A6]/10 text-[#0396A6] font-bold hover:bg-[#0396A6]/15 data-[highlighted]:bg-[#0396A6]/15"
                        : "text-foreground font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 data-[highlighted]:bg-zinc-100 dark:data-[highlighted]:bg-zinc-800 data-[highlighted]:text-foreground"
                    }`}
                  >
                    <span className="truncate text-xs">
                      {displayName}
                    </span>

                    {isSelected && (
                      <Check size={14} className="text-[#0396A6] shrink-0" />
                    )}
                  </DropdownMenu.Item>
                );
              })}
            </div>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}
