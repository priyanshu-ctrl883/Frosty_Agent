'use client';

import React, { useState, useEffect } from 'react';
import type { DateRangeValue } from '@/components/analytics/AnalyticsDateFilter';
import type { Agent } from '@/lib/types';

import { AnalyticsTab } from './tabs/AnalyticsTab';
import { ConversationsTab } from './tabs/ConversationsTab';
import { LeadsTab } from './tabs/LeadsTab';
import { MeetingsTab } from './tabs/MeetingsTab';
import { SettingsTab } from './tabs/SettingsTab';

interface WebsiteBotDashboardProps {
  tenantId: string;
  isEnabled?: boolean;
  hubTab?: 'analytics' | 'chats' | 'leads' | 'meetings' | 'settings';
  onHubTabChange?: (tab: 'analytics' | 'chats' | 'leads' | 'meetings' | 'settings') => void;
  webAgentId?: string | null;
  allocatedCredits?: number;
  mainBalance?: number;
  refreshBalances?: () => void;
  days?: number;
  fromDate?: string;
  toDate?: string;
  onDateRangeChange?: (range: DateRangeValue) => void;
  onDaysChange?: (days: number) => void;
  initialAgents?: Agent[];
  onAgentDeleted?: () => void;
  onSelectAgent?: (agentId: string) => void;
  onActiveChatChange?: (active: boolean) => void;
  initialSettingSubTab?: 'install' | 'persona' | 'knowledge' | 'widget' | 'sandbox' | 'usage' | 'config';
}

export default function WebsiteBotDashboard({
  tenantId,
  isEnabled = true,
  hubTab = 'analytics',
  onHubTabChange,
  webAgentId: initialWebAgentId = null,
  allocatedCredits = 0,
  mainBalance = 0,
  refreshBalances = () => { },
  days = 30,
  fromDate,
  toDate,
  onDateRangeChange,
  onDaysChange,
  initialAgents = [],
  onAgentDeleted,
  onActiveChatChange,
  initialSettingSubTab,
}: WebsiteBotDashboardProps) {
  // ─── AGENT SELECTION ───
  const [agentsList, setAgentsList] = useState<Agent[]>(initialAgents);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(initialWebAgentId);

  useEffect(() => {
    setAgentsList(initialAgents);
    setSelectedAgentId(initialWebAgentId || initialAgents[0]?.id || null);
  }, [initialAgents, initialWebAgentId]);

  const targetAgentId = selectedAgentId || initialWebAgentId;

  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);

  const handleViewChat = (convoId: string) => {
    setSelectedConvoId(convoId);
    if (onHubTabChange) {
      onHubTabChange('chats');
    }
  };

  return (
    <div className="font-sans flex-1 min-h-0 flex flex-col md:h-full md:overflow-hidden bg-background">
      {/* TAB 1: ANALYTICS */}
      {hubTab === 'analytics' && (
        <AnalyticsTab
          days={days}
          fromDate={fromDate}
          toDate={toDate}
          agentId={targetAgentId}
          channel="website"
          onViewChat={handleViewChat}
          onViewAll={() => onHubTabChange?.('chats')}
          onDateRangeChange={onDateRangeChange}
          onDaysChange={onDaysChange}
        />
      )}

      {/* TAB 2: CONVERSATIONS */}
      {hubTab === 'chats' && (
        <ConversationsTab
          initialConversationId={selectedConvoId}
          agentId={targetAgentId}
          onActiveChatChange={onActiveChatChange}
        />
      )}

      {/* TAB 3: LEADS */}
      {hubTab === 'leads' && (
        <LeadsTab channel="website" agentId={targetAgentId} />
      )}

      {/* TAB 4: MEETINGS */}
      {hubTab === 'meetings' && (
        <MeetingsTab channel="website" agentId={targetAgentId} />
      )}

      {/* TAB 5: SETTINGS */}
      {hubTab === 'settings' && (
        <SettingsTab
          agentId={targetAgentId}
          mainBalance={mainBalance}
          allocatedCredits={allocatedCredits}
          refreshBalances={refreshBalances}
          onViewChat={handleViewChat}
          onAgentDeleted={onAgentDeleted}
          initialSettingSubTab={initialSettingSubTab}
        />
      )}
    </div>
  );
}
