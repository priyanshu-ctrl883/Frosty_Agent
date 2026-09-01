'use client';
import React, { useState, useEffect } from 'react';
import type { DateRangeValue } from '@/components/analytics/AnalyticsDateFilter';
import type { Agent } from '@/lib/types';

import { AnalyticsTab } from '../website/tabs/AnalyticsTab';
import { ConversationsTab } from '../website/tabs/ConversationsTab';
import { LeadsTab } from '../website/tabs/LeadsTab';
import { MeetingsTab } from '../website/tabs/MeetingsTab';
import { WhatsAppSettingsTab } from './tabs/WhatsAppSettingsTab';

interface WhatsAppBotDashboardProps {
  tenantId: string;
  isEnabled?: boolean;
  hubTab?: 'analytics' | 'chats' | 'leads' | 'meetings' | 'settings';
  onHubTabChange?: (tab: 'analytics' | 'chats' | 'leads' | 'meetings' | 'settings') => void;
  waAgentId?: string | null;
  allocatedCredits?: number;
  mainBalance?: number;
  refreshBalances?: () => void;
  days?: number;
  fromDate?: string;
  toDate?: string;
  onDateRangeChange?: (range: DateRangeValue) => void;
  onDaysChange?: (days: number) => void;
  initialAgents?: Agent[];
  initialSettingTab?: 'persona' | 'knowledge' | 'connection' | 'sandbox' | 'logs';
  onAgentDeleted?: () => void;
  onActiveChatChange?: (active: boolean) => void;
}

export default function WhatsAppBotDashboard({
  tenantId,
  isEnabled = true,
  hubTab = 'analytics',
  onHubTabChange,
  waAgentId: initialWaAgentId = null,
  allocatedCredits = 0,
  mainBalance = 0,
  refreshBalances = () => { },
  days = 30,
  fromDate,
  toDate,
  onDateRangeChange,
  onDaysChange,
  initialAgents = [],
  initialSettingTab = 'persona',
  onAgentDeleted,
  onActiveChatChange,
}: WhatsAppBotDashboardProps) {
  // ─── AGENT SELECTION ───
  const [agentsList, setAgentsList] = useState<Agent[]>(initialAgents);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(initialWaAgentId);

  useEffect(() => {
    if (initialAgents.length > 0) {
      setAgentsList(initialAgents);
      if (!selectedAgentId) {
        setSelectedAgentId(initialWaAgentId || initialAgents[0]?.id || null);
      }
    }
  }, [initialAgents, initialWaAgentId, selectedAgentId]);

  const targetAgentId = selectedAgentId || initialWaAgentId;

  const [selectedConvoId, setSelectedConvoId] = useState<string | null>(null);

  const handleViewChat = (convoId: string) => {
    setSelectedConvoId(convoId);
    if (onHubTabChange) {
      onHubTabChange('chats');
    }
  };

  return (
    <div className="font-sans flex-1 min-h-0 flex flex-col md:h-full md:overflow-hidden">
      {/* TAB 1: ANALYTICS */}
      {hubTab === 'analytics' && (
        <AnalyticsTab
          days={days}
          fromDate={fromDate}
          toDate={toDate}
          agentId={targetAgentId}
          channel="whatsapp"
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
          channel="whatsapp"
          agentId={targetAgentId}
          onActiveChatChange={onActiveChatChange}
        />
      )}

      {/* TAB 3: LEADS */}
      {hubTab === 'leads' && <LeadsTab channel="whatsapp" agentId={targetAgentId} />}

      {/* TAB 4: MEETINGS */}
      {hubTab === 'meetings' && <MeetingsTab channel="whatsapp" agentId={targetAgentId} />}

      {/* TAB 5: SETTINGS */}
      {hubTab === 'settings' && (
        <WhatsAppSettingsTab
          tenantId={tenantId}
          waAgentId={targetAgentId}
          initialSettingSubTab={initialSettingTab}
          onAgentDeleted={onAgentDeleted}
        />
      )}
    </div>
  );
}
