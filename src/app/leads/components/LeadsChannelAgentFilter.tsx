"use client";

import { useMemo } from "react";
import { Dropdown } from "@/components/ui/Dropdown";
import type { Agent } from "@/lib/types";
import styles from "../leads.module.css";

export type LeadsChannelFilter = "all" | "website" | "whatsapp";

type Props = {
  channel: LeadsChannelFilter;
  agentScope: string;
  agents: Agent[];
  onChannelChange: (next: LeadsChannelFilter) => void;
  onAgentChange: (agentId: string) => void;
};

const CHANNEL_OPTIONS: { id: LeadsChannelFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "website", label: "Web" },
  { id: "whatsapp", label: "WhatsApp" },
];

const agentsForChannel = (agents: Agent[], channel: LeadsChannelFilter): Agent[] => {
  if (channel === "website") {
    return agents.filter((a) => a.mode === "website" || a.mode === "unified");
  }
  if (channel === "whatsapp") {
    return agents.filter((a) => a.mode === "whatsapp" || a.mode === "unified");
  }
  return [];
};

export function LeadsChannelAgentFilter({
  channel,
  agentScope,
  agents,
  onChannelChange,
  onAgentChange,
}: Props) {
  const channelAgents = useMemo(() => agentsForChannel(agents, channel), [agents, channel]);

  const agentOptions = useMemo(() => {
    const scopeLabel = channel === "website" ? "All Web agents" : "All WhatsApp agents";
    return [
      { value: "all", label: scopeLabel },
      ...channelAgents.map((agent) => ({
        value: agent.id,
        label: agent.agent_name || agent.slug || "Untitled",
      })),
    ];
  }, [channelAgents, channel]);

  return (
    <div className={styles.channelAgentFilterRow}>
      <div className={styles.statusSegmentedBar}>
        {CHANNEL_OPTIONS.map((ch) => {
          const isActive = channel === ch.id;
          return (
            <button
              key={ch.id}
              type="button"
              className={`${styles.statusSegmentBtn} ${isActive ? styles.statusSegmentBtnActive : ""}`}
              onClick={() => onChannelChange(ch.id)}
              aria-pressed={isActive}
            >
              <span>{ch.label}</span>
            </button>
          );
        })}
      </div>

      {channel !== "all" && channelAgents.length > 0 ? (
        <Dropdown
          value={agentScope}
          onChange={onAgentChange}
          options={agentOptions}
          size="sm"
          searchable={channelAgents.length > 6}
          searchPlaceholder="Search agents…"
          className={styles.leadsAgentDropdown}
          triggerClassName="!h-[30px] !rounded-lg !border-[#0396A6]/30 !bg-white hover:!border-[#0396A6]/55"
          dropdownClassName="!min-w-[200px]"
          fullWidth={false}
        />
      ) : null}
    </div>
  );
}
