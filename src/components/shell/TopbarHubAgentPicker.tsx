"use client";



import React, { useMemo } from "react";

import { Bot, Globe, Layers, MessageCircle, Smartphone } from "lucide-react";

import { Dropdown } from "@/components/ui/Dropdown";

import type { Agent } from "@/lib/types";



export type HubChannelFilter = "all" | "website" | "whatsapp";



export type TopbarHubAgentPickerProps = {

  agents: Agent[];

  /** `"all"` or a specific agent id */

  selectedAgentId: string;

  onSelectAgent: (agentId: string) => void;

  channelFilter: HubChannelFilter;

  onChannelFilterChange: (filter: HubChannelFilter) => void;

  /** Show All / WhatsApp / Website when viewing all agents */

  showChannelFilter: boolean;

  agentScopeLabel?: string;

  disabled?: boolean;

};



const CHANNEL_OPTIONS: {

  value: HubChannelFilter;

  label: string;

}[] = [

  { value: "all", label: "All" },

  { value: "whatsapp", label: "WhatsApp" },

  { value: "website", label: "Website" },

];



/** Inbox topbar — agent picker only (channel filters live in the sidebar). */

export function TopbarInboxAgentPicker({

  agents,

  selectedAgentId,

  onSelectAgent,

  agentScopeLabel = "All Agents",

  disabled = false,

}: Pick<

  TopbarHubAgentPickerProps,

  "agents" | "selectedAgentId" | "onSelectAgent" | "agentScopeLabel" | "disabled"

>) {

  const agentOptions = useMemo(

    () => [

      { value: "all", label: agentScopeLabel },

      ...agents.map((agent) => ({

        value: agent.id,

        label: agent.agent_name || agent.slug || "Untitled",

        description: agent.is_active ? "Live" : "Paused",

      })),

    ],

    [agents, agentScopeLabel],

  );



  if (agents.length === 0) return null;



  return (

    <Dropdown

      value={selectedAgentId}

      onChange={onSelectAgent}

      options={agentOptions}

      disabled={disabled}

      size="sm"

      searchable={agents.length > 6}

      searchPlaceholder="Search agents…"

      leadingIcon={<Bot size={14} className="text-[#0396A6]" />}

      className="min-w-[160px] max-w-[220px]"

      triggerClassName="!h-8 !rounded-xl !border-[#0396A6]/35 !bg-white hover:!border-[#0396A6]/60 shadow-2xs"

      dropdownClassName="!min-w-[240px]"

      fullWidth={false}

    />

  );

}



export function TopbarHubAgentPicker({

  agents,

  selectedAgentId,

  onSelectAgent,

  channelFilter,

  onChannelFilterChange,

  showChannelFilter,

  agentScopeLabel = "All Agents",

  disabled = false,

}: TopbarHubAgentPickerProps) {

  const agentOptions = useMemo(

    () => [

      { value: "all", label: agentScopeLabel },

      ...agents.map((agent) => ({

        value: agent.id,

        label: agent.agent_name || agent.slug || "Untitled",

        description: agent.is_active ? "Live" : "Paused",

      })),

    ],

    [agents, agentScopeLabel],

  );



  const channelLeadingIcon =

    channelFilter === "whatsapp" ? (

      <MessageCircle size={14} className="text-emerald-600" />

    ) : channelFilter === "website" ? (

      <Globe size={14} className="text-[#0396A6]" />

    ) : (

      <Layers size={14} className="text-[#0396A6]" />

    );



  if (agents.length === 0) {

    return null;

  }



  return (

    <div className="flex items-center gap-1.5 shrink-0">

      <Dropdown

        value={selectedAgentId}

        onChange={onSelectAgent}

        options={agentOptions}

        disabled={disabled}

        size="sm"

        searchable={agents.length > 6}

        searchPlaceholder="Search agents…"

        leadingIcon={<Bot size={14} className="text-[#0396A6]" />}

        className="min-w-[148px] max-w-[200px]"

        triggerClassName="!h-8 !rounded-xl !border-[#0396A6]/30 !bg-white hover:!border-[#0396A6]/55 shadow-2xs"

        dropdownClassName="!min-w-[220px]"

        fullWidth={false}

      />



      {showChannelFilter ? (

        <Dropdown

          value={channelFilter}

          onChange={(v) => onChannelFilterChange(v as HubChannelFilter)}

          options={CHANNEL_OPTIONS}

          disabled={disabled}

          size="sm"

          leadingIcon={channelLeadingIcon}

          className="min-w-[128px] max-w-[160px]"

          triggerClassName="!h-8 !rounded-xl !border-[#0396A6]/30 !bg-white hover:!border-[#0396A6]/55 shadow-2xs"

          dropdownClassName="!min-w-[180px]"

          fullWidth={false}

        />

      ) : null}

    </div>

  );

}



/** WhatsApp hub variant — channel filter is hidden (agents are WA-only). */

export function TopbarWaAgentPicker({

  agents,

  selectedAgentId,

  onSelectAgent,

  disabled = false,

}: Pick<TopbarHubAgentPickerProps, "agents" | "selectedAgentId" | "onSelectAgent" | "disabled">) {

  const agentOptions = useMemo(

    () => [

      { value: "all", label: "All WhatsApp Agents" },

      ...agents.map((agent) => ({

        value: agent.id,

        label: agent.agent_name || agent.slug || "Untitled",

      })),

    ],

    [agents],

  );



  if (agents.length === 0) return null;



  return (

    <Dropdown

      value={selectedAgentId}

      onChange={onSelectAgent}

      options={agentOptions}

      disabled={disabled}

      size="sm"

      searchable={agents.length > 6}

      leadingIcon={<Smartphone size={14} className="text-emerald-600" />}

      className="min-w-[148px] max-w-[200px]"

      triggerClassName="!h-8 !rounded-xl !border-[#0396A6]/30 !bg-white hover:!border-[#0396A6]/55 shadow-2xs"

      dropdownClassName="!min-w-[220px]"

      fullWidth={false}

    />

  );

}

