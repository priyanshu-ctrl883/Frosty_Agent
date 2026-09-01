'use client';
import React, { useState } from 'react';
import type { DateRangeValue } from '@/components/analytics/AnalyticsDateFilter';

import { AnalyticsTab } from '../website/tabs/AnalyticsTab';
import { ConversationsTab } from '../website/tabs/ConversationsTab';
import { LeadsTab } from '../website/tabs/LeadsTab';
import { MeetingsTab } from '../website/tabs/MeetingsTab';
import { UnifiedSettingsTab } from './tabs/UnifiedSettingsTab';

interface UnifiedBotDashboardProps {
  tenantId: string;
  isEnabled?: boolean;
  hubTab?: 'analytics' | 'chats' | 'leads' | 'meetings' | 'settings';
  onHubTabChange?: (tab: 'analytics' | 'chats' | 'leads' | 'meetings' | 'settings') => void;
  allocatedCredits?: number;
  mainBalance?: number;
  refreshBalances?: () => void;
  days?: number;
  fromDate?: string;
  toDate?: string;
  onDateRangeChange?: (range: DateRangeValue) => void;
  onDaysChange?: (days: number) => void;
  unifiedAgentId?: string | null;
  onAgentDeleted?: () => void;
  onActiveChatChange?: (active: boolean) => void;
}

export default function UnifiedBotDashboard({
  tenantId,
  isEnabled = true,
  hubTab = 'analytics',
  onHubTabChange,
  allocatedCredits = 0,
  mainBalance = 0,
  refreshBalances = () => { },
  days = 30,
  fromDate,
  toDate,
  onDateRangeChange,
  onDaysChange,
  unifiedAgentId,
  onAgentDeleted,
  onActiveChatChange,
}: UnifiedBotDashboardProps) {
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
          agentId={unifiedAgentId}
          channel="unified"
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
          channel="unified"
          agentId={unifiedAgentId}
          onActiveChatChange={onActiveChatChange}
        />
      )}

      {/* TAB 3: LEADS */}
      {hubTab === 'leads' && <LeadsTab channel="unified" agentId={unifiedAgentId} />}

      {/* TAB 4: MEETINGS */}
      {hubTab === 'meetings' && <MeetingsTab channel="unified" agentId={unifiedAgentId} />}

      {/* TAB 5: SETTINGS (READ ONLY / ORCHESTRATION) */}
      {hubTab === 'settings' && (
        <UnifiedSettingsTab unifiedAgentId={unifiedAgentId} onViewChat={handleViewChat} onAgentDeleted={onAgentDeleted} />
      )}
    </div>
  );
}
