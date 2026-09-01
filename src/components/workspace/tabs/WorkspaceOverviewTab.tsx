'use client';

import React, { useState } from 'react';
import {
  Building2, Calendar, Users, Clock, ArrowRight, Plus,
  Copy, Check, ExternalLink, CheckCircle2, Shield, Video,
  Mail, ChevronRight, Sparkles, UserPlus, CalendarPlus,
  Layers, MapPin, Globe, Phone
} from 'lucide-react';
import type { Meeting, Team, MerchantSettings } from '@/lib/types';
import { useToast } from '@/lib/toast';

interface WorkspaceOverviewTabProps {
  settings: MerchantSettings | null;
  meetings: Meeting[];
  team: Team | null;
  canManageTeam: boolean;
  canManageMeetings: boolean;
  onNavigateTab: (tab: 'meetings' | 'team') => void;
  onOpenScheduleModal: () => void;
  onOpenInviteModal: () => void;
}

export function WorkspaceOverviewTab({
  settings,
  meetings,
  team,
  canManageTeam,
  canManageMeetings,
  onNavigateTab,
  onOpenScheduleModal,
  onOpenInviteModal,
}: WorkspaceOverviewTabProps) {
  const { success: toastSuccess } = useToast();
  const [copiedId, setCopiedId] = useState(false);

  const upcomingMeetings = meetings
    .filter(m => m.status === 'scheduled' || m.status === 'confirmed' || m.status === 'pending_approval')
    .slice(0, 5);

  const members = team?.members || [];
  const pendingInvites = team?.pending_invites || [];
  const activeMembersCount = members.filter(m => m.is_active).length;

  const handleCopyTenantId = () => {
    if (!settings?.merchant_id) return;
    navigator.clipboard.writeText(settings.merchant_id);
    setCopiedId(true);
    toastSuccess('Workspace Tenant ID copied to clipboard!');
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── 1. WORKSPACE HEADER CARD ── */}
      <div className="bg-white p-6 rounded-2xl border border-border shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#0396A6]/10 text-[#0396A6] flex items-center justify-center font-black text-2xl shadow-xs border border-[#0396A6]/20">
              {(settings?.company_name || 'W').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-foreground">
                  {settings?.company_name || 'Workspace'}
                </h2>
                <span className="text-xs font-bold text-[#0396A6]">
                  {settings?.plan || 'Pro'} Tier
                </span>
                <span className="text-xs font-bold text-emerald-600">
                  Active
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Central merchant workspace managing company operations, meetings, and team collaboration.
              </p>
            </div>
          </div>

          {/* Top Quick Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCopyTenantId}
              className="py-2 px-3 rounded-xl bg-muted/20 hover:bg-muted/40 text-foreground border border-border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Copy Workspace Tenant ID"
            >
              {copiedId ? <Check size={13} className="text-[#0396A6]" /> : <Copy size={13} className="text-[#0396A6]" />}
              <span className="font-mono text-[11px]">
                {settings?.merchant_id ? `${settings.merchant_id.slice(0, 8)}...` : 'ID'}
              </span>
            </button>

            {canManageMeetings && (
              <button
                type="button"
                onClick={onOpenScheduleModal}
                className="flex-1 sm:flex-initial py-2 px-3.5 bg-[#0396A6] hover:bg-[#087681] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-xs transition-all active:scale-98 cursor-pointer"
              >
                <CalendarPlus size={14} className="text-white" />
                <span>Schedule</span>
              </button>
            )}

            {canManageTeam && (
              <button
                type="button"
                onClick={onOpenInviteModal}
                className="flex-1 sm:flex-initial py-2 px-3.5 bg-muted/20 hover:bg-muted/40 text-foreground border border-border font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <UserPlus size={14} className="text-[#0396A6]" />
                <span>Invite</span>
              </button>
            )}
          </div>
        </div>

        {/* Workspace Quick Metadata strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-border/50 text-xs">
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-center">
            <Clock size={14} className="text-[#0396A6] shrink-0" />
            <span className="truncate">{settings?.timezone || 'Asia/Kolkata'}</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-center">
            <Globe size={14} className="text-[#0396A6] shrink-0" />
            <span className="truncate">{settings?.industry || 'Enterprise SaaS'}</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-center">
            <Phone size={14} className="text-[#0396A6] shrink-0" />
            <span className="truncate">{settings?.phone || 'No phone set'}</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-muted-foreground text-center">
            <Users size={14} className="text-[#0396A6] shrink-0" />
            <span>{members.length} member{members.length === 1 ? '' : 's'}</span>
          </div>
        </div>
      </div>

      {/* ── 2. METRIC SUMMARY CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Members */}
        <div
          onClick={() => onNavigateTab('team')}
          className="relative overflow-hidden p-5 sm:p-6 rounded-[24px] sm:rounded-[28px] border border-border bg-card hover:border-[#0396A6]/30 hover:shadow-[0_12px_40px_-8px_rgba(3,150,166,0.12)] transition-all duration-300 flex flex-col justify-between min-h-[160px] sm:min-h-[175px] group min-w-0 shadow-[0_2px_15px_rgba(0,0,0,0.03),0_10px_30px_-10px_rgba(3,150,166,0.05)] cursor-pointer"
        >
          <div
            className="absolute top-0 left-0 right-0 h-[2.5px] opacity-60 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: 'linear-gradient(90deg, transparent, #0396A6, transparent)' }}
          />
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 bg-[#0396A6]" />

          <div className="flex items-center mb-3 sm:mb-4 relative z-10">
            <Users size={20} className="text-[#0396A6]" />
          </div>

          <div className="mb-3 sm:mb-4 relative z-10">
            <h3 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight font-sans leading-none">
              {members.length}
            </h3>
          </div>

          <div className="flex flex-col gap-2 mt-auto relative z-10">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground tracking-wider uppercase leading-tight">
                Team Members
              </span>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground/60 font-medium truncate max-w-[120px] leading-tight hidden sm:inline">
                {pendingInvites.length} pending
              </span>
            </div>
            <div className="w-full h-[3.5px] sm:h-[4px] rounded-full overflow-hidden bg-black/5 dark:bg-white/10">
              <div className="h-full bg-[#0396A6] transition-all duration-700 rounded-full w-full" />
            </div>
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div
          onClick={() => onNavigateTab('meetings')}
          className="relative overflow-hidden p-5 sm:p-6 rounded-[24px] sm:rounded-[28px] border border-border bg-card hover:border-[#0396A6]/30 hover:shadow-[0_12px_40px_-8px_rgba(3,150,166,0.12)] transition-all duration-300 flex flex-col justify-between min-h-[160px] sm:min-h-[175px] group min-w-0 shadow-[0_2px_15px_rgba(0,0,0,0.03),0_10px_30px_-10px_rgba(3,150,166,0.05)] cursor-pointer"
        >
          <div
            className="absolute top-0 left-0 right-0 h-[2.5px] opacity-60 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: 'linear-gradient(90deg, transparent, #0396A6, transparent)' }}
          />
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 bg-[#0396A6]" />

          <div className="flex items-center mb-3 sm:mb-4 relative z-10">
            <Calendar size={20} className="text-[#0396A6]" />
          </div>

          <div className="mb-3 sm:mb-4 relative z-10">
            <h3 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight font-sans leading-none">
              {upcomingMeetings.length}
            </h3>
          </div>

          <div className="flex flex-col gap-2 mt-auto relative z-10">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground tracking-wider uppercase leading-tight">
                Upcoming Meetings
              </span>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground/60 font-medium truncate max-w-[120px] leading-tight hidden sm:inline">
                Customer &amp; team
              </span>
            </div>
            <div className="w-full h-[3.5px] sm:h-[4px] rounded-full overflow-hidden bg-black/5 dark:bg-white/10">
              <div className="h-full bg-[#0396A6] transition-all duration-700 rounded-full w-full" />
            </div>
          </div>
        </div>

        {/* Channels Active */}
        <div className="relative overflow-hidden p-5 sm:p-6 rounded-[24px] sm:rounded-[28px] border border-border bg-card hover:border-[#0396A6]/30 hover:shadow-[0_12px_40px_-8px_rgba(3,150,166,0.12)] transition-all duration-300 flex flex-col justify-between min-h-[160px] sm:min-h-[175px] group min-w-0 shadow-[0_2px_15px_rgba(0,0,0,0.03),0_10px_30px_-10px_rgba(3,150,166,0.05)]">
          <div
            className="absolute top-0 left-0 right-0 h-[2.5px] opacity-60 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: 'linear-gradient(90deg, transparent, #0396A6, transparent)' }}
          />
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 bg-[#0396A6]" />

          <div className="flex items-center mb-3 sm:mb-4 relative z-10">
            <Layers size={20} className="text-[#0396A6]" />
          </div>

          <div className="mb-3 sm:mb-4 relative z-10">
            <h3 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight font-sans leading-none">
              Web &amp; WA
            </h3>
          </div>

          <div className="flex flex-col gap-2 mt-auto relative z-10">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground tracking-wider uppercase leading-tight">
                Channels Active
              </span>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground/60 font-medium truncate max-w-[120px] leading-tight hidden sm:inline">
                Live assistant
              </span>
            </div>
            <div className="w-full h-[3.5px] sm:h-[4px] rounded-full overflow-hidden bg-black/5 dark:bg-white/10">
              <div className="h-full bg-[#0396A6] transition-all duration-700 rounded-full w-full" />
            </div>
          </div>
        </div>

        {/* Pending Invites */}
        <div
          onClick={() => onNavigateTab('team')}
          className="relative overflow-hidden p-5 sm:p-6 rounded-[24px] sm:rounded-[28px] border border-border bg-card hover:border-[#0396A6]/30 hover:shadow-[0_12px_40px_-8px_rgba(3,150,166,0.12)] transition-all duration-300 flex flex-col justify-between min-h-[160px] sm:min-h-[175px] group min-w-0 shadow-[0_2px_15px_rgba(0,0,0,0.03),0_10px_30px_-10px_rgba(3,150,166,0.05)] cursor-pointer"
        >
          <div
            className="absolute top-0 left-0 right-0 h-[2.5px] opacity-60 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: 'linear-gradient(90deg, transparent, #0396A6, transparent)' }}
          />
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 bg-[#0396A6]" />

          <div className="flex items-center mb-3 sm:mb-4 relative z-10">
            <UserPlus size={20} className="text-[#0396A6]" />
          </div>

          <div className="mb-3 sm:mb-4 relative z-10">
            <h3 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight font-sans leading-none">
              {pendingInvites.length}
            </h3>
          </div>

          <div className="flex flex-col gap-2 mt-auto relative z-10">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground tracking-wider uppercase leading-tight">
                Pending Invites
              </span>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground/60 font-medium truncate max-w-[120px] leading-tight hidden sm:inline">
                {pendingInvites.length > 0 ? 'Awaiting acceptance' : 'All seats active'}
              </span>
            </div>
            <div className="w-full h-[3.5px] sm:h-[4px] rounded-full overflow-hidden bg-black/5 dark:bg-white/10">
              <div className="h-full bg-[#0396A6] transition-all duration-700 rounded-full w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. TWO-COLUMN SPLIT: MEETINGS & TEAM PREVIEWS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Upcoming Meetings Preview */}
        <div className="bg-white p-6 rounded-2xl border border-border shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-[#0396A6] shrink-0" />
                  <h3 className="text-sm font-bold text-foreground">Upcoming Meetings</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Next scheduled meetings with clients.</p>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('meetings')}
                className="text-xs font-bold text-[#0396A6] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                View All <ChevronRight size={13} className="text-[#0396A6]" />
              </button>
            </div>

            {upcomingMeetings.length === 0 ? (
              <div className="text-center py-8 rounded-xl bg-muted/10 border border-dashed border-border space-y-2">
                <Calendar size={28} className="mx-auto text-[#0396A6]/60" />
                <div className="text-xs font-bold text-foreground">No upcoming meetings</div>
                <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                  Schedule meetings with your team or let customers book directly through your AI assistant.
                </p>
                {canManageMeetings && (
                  <button
                    type="button"
                    onClick={onOpenScheduleModal}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-[#0396A6] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} className="text-white" /> Schedule Meeting
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingMeetings.map(meeting => (
                  <div
                    key={meeting.id}
                    className="p-3.5 rounded-xl bg-muted/10 border border-border flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                  >
                    <div className="min-w-0 space-y-0.5 flex-1">
                      <div className="flex items-center gap-2 max-w-full">
                        <span 
                          className="text-xs font-bold text-foreground truncate max-w-[180px] sm:max-w-[240px] md:max-w-[280px]"
                          title={meeting.title || 'Client Consultation'}
                        >
                          {meeting.title || 'Client Consultation'}
                        </span>
                        <span className={`text-[11px] font-extrabold uppercase tracking-wider shrink-0 ${
                          meeting.status === 'confirmed'
                            ? 'text-emerald-600'
                            : 'text-[#0396A6]'
                        }`}>
                          {meeting.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                        <span>{new Date(meeting.scheduled_start).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                        <span>•</span>
                        <span>{new Date(meeting.scheduled_start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {meeting.attendee_name && (
                          <>
                            <span>•</span>
                            <span className="truncate">{meeting.attendee_name}</span>
                          </>
                        )}
                      </p>
                    </div>

                    {meeting.meet_link && (
                      <a
                        href={meeting.meet_link}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 rounded-lg bg-[#0396A6] text-white hover:bg-[#087681] transition-colors shrink-0 text-xs font-bold flex items-center justify-center shadow-2xs no-underline"
                      >
                        <span>Join</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-border/50">
            <button
              type="button"
              onClick={() => onNavigateTab('meetings')}
              className="w-full py-2 px-3 rounded-xl bg-muted/20 hover:bg-muted/40 text-foreground border border-border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Go to Meetings Management</span>
              <ArrowRight size={13} className="text-[#0396A6]" />
            </button>
          </div>
        </div>

        {/* Right Column: Team Preview */}
        <div className="bg-white p-6 rounded-2xl border border-border shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-[#0396A6] shrink-0" />
                  <h3 className="text-sm font-bold text-foreground">Team Directory</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Workspace collaborators and assigned roles.</p>
              </div>

              <button
                type="button"
                onClick={() => onNavigateTab('team')}
                className="text-xs font-bold text-[#0396A6] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                View All <ChevronRight size={13} className="text-[#0396A6]" />
              </button>
            </div>

            {members.length === 0 ? (
              <div className="text-center py-8 rounded-xl bg-muted/10 border border-dashed border-border space-y-2">
                <Users size={28} className="mx-auto text-[#0396A6]/60" />
                <div className="text-xs font-bold text-foreground">No teammates found</div>
                <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                  Invite your team members to collaborate on customer chats, leads, and quotations.
                </p>
                {canManageTeam && (
                  <button
                    type="button"
                    onClick={onOpenInviteModal}
                    className="mt-2 px-3 py-1.5 rounded-lg bg-[#0396A6] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} className="text-white" /> Invite Teammate
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {members.slice(0, 5).map(member => (
                  <div
                    key={member.membership_id}
                    className="p-3 rounded-xl bg-muted/10 border border-border flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[#E2F6F9] text-[#0A1A2F] border border-[#8CE2EE] flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-2xs">
                        {(member.display_name || member.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-foreground truncate">
                            {member.display_name || member.email}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">{member.email}</p>
                      </div>
                    </div>

                    <span className="text-xs font-black text-foreground uppercase tracking-wide shrink-0">
                      {member.role_name || (member.is_owner ? 'Owner' : 'Member')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-border/50">
            <button
              type="button"
              onClick={() => onNavigateTab('team')}
              className="w-full py-2 px-3 rounded-xl bg-muted/20 hover:bg-muted/40 text-foreground border border-border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Go to Team Management</span>
              <ArrowRight size={13} className="text-[#0396A6]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
