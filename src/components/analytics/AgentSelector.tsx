"use client";

import React, { useMemo } from "react";
import { Bot, MessageCircle, Smartphone } from "lucide-react";
import { Select } from "@/components/ui/Select";
import type { Agent } from "@/lib/types";

interface AgentSelectorProps {
  channel: "website" | "whatsapp" | "unified";
  agents: Agent[];
  selectedAgentId: string;
  onSelectAgent: (agentId: string) => void;
  disabled?: boolean;
  className?: string;
}

const CHANNEL_CONFIG = {
  website: {
    all: "All Web Agents",
    single: "Web Agent",
    icon: Bot,
  },
  whatsapp: {
    all: "All WhatsApp Agents",
    single: "WhatsApp Agent",
    icon: MessageCircle,
  },
  unified: {
    all: "All Unified Agents",
    single: "Unified Agent",
    icon: Smartphone,
  },
} as const;

export function AgentSelector({
  channel,
  agents,
  selectedAgentId,
  onSelectAgent,
  disabled = false,
  className = "",
}: AgentSelectorProps) {
  const info = CHANNEL_CONFIG[channel] ?? CHANNEL_CONFIG.website;
  const Icon = info.icon;

  const options = useMemo(
    () => [
      { value: "all", label: info.all },
      ...agents.map((agent) => ({
        value: agent.id,
        label:
          agent.agent_name ||
          `${info.single} (${agent.slug || agent.id.slice(0, 6)})` +
            (agent.is_active ? "" : " — Paused"),
      })),
    ],
    [agents, info.all, info.single],
  );

  return (
    <Select
      value={selectedAgentId}
      onChange={onSelectAgent}
      options={options}
      disabled={disabled}
      leadingIcon={<Icon size={14} className="text-[#0396A6]" />}
      fullWidth={false}
      className={`w-full sm:w-auto min-w-[200px] sm:min-w-[220px] ${className}`}
      aria-label={`Select ${info.single}`}
    />
  );
}
