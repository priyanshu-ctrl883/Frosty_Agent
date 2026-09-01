'use client';

import Link from 'next/link';
import React, { FormEvent, useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { AlertModal } from '@/components/ui/AlertModal';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/lib/toast';
import { apiRequest } from '@/lib/api';
import { openRazorpayCheckout } from '@/lib/billingCheckout';
import { buildInviteUrl } from '@/lib/invite-url';
import { dateTime, relative } from '@/lib/format';
import type { InviteCreated, Team, TeamMember, Role } from '@/lib/types';
import { useWorkspace } from '@/lib/workspace';
import { Users, UserCheck, Shield, UsersRound } from 'lucide-react';
import styles from '@/app/team/team.module.css';

interface WorkspaceTeamTabProps {
  team: Team | null;
  roles: Role[];
  canManageTeam: boolean;
  isOwner: boolean;
  currentUserId?: string;
  loading: boolean;
  onRefresh: () => Promise<void>;
  isInviteModalOpen?: boolean;
  onCloseInviteModal?: () => void;
  onOpenInviteModal?: () => void;
}

type Filter = 'all' | 'agents' | 'pending' | 'removed';

function initials(name?: string | null): string {
  if (!name) return '??';
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return '??';
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase();
  return (p[0]![0]! + p[p.length - 1]![0]!).toUpperCase();
}

/** Role label for badge. */
function roleLabel(m: TeamMember): string {
  if (m.is_owner) return 'Owner';
  return m.role_name ? m.role_name.charAt(0).toUpperCase() + m.role_name.slice(1) : 'No role';
}

/** CSS class for avatar by role. */
function avatarClass(m: TeamMember): string {
  if (m.is_owner) return styles.avatarOwner || '';
  switch (m.role_name) {
    case 'manager': return styles.avatarManager || '';
    case 'agent':   return styles.avatarAgent || '';
    default:        return styles.avatarViewer || '';
  }
}

/** CSS class for role badge by role. */
function roleBadgeClass(m: TeamMember): string {
  if (m.is_owner) return styles.roleOwner || '';
  switch (m.role_name) {
    case 'manager': return styles.roleManager || '';
    case 'agent':   return styles.roleAgent || '';
    default:        return styles.roleViewer || '';
  }
}

export function WorkspaceTeamTab({
  team,
  roles,
  canManageTeam,
  isOwner,
  currentUserId,
  loading,
  onRefresh,
  isInviteModalOpen = false,
  onCloseInviteModal,
  onOpenInviteModal,
}: WorkspaceTeamTabProps) {
  const { entitlements, me } = useWorkspace();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>('agent');
  const [lastInvite, setLastInvite] = useState<InviteCreated | null>(null);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editRole, setEditRole] = useState<string>('agent');

  // Confirmation states
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [pendingInviteSubmit, setPendingInviteSubmit] = useState<{ email: string; role: string } | null>(null);

  const setError = useCallback(
    (msg: string | null) => {
      if (msg) showToast(msg, { type: 'error' });
    },
    [showToast]
  );

  const PERMISSION_TITLES: Record<string, string> = {
    'dashboard:view': 'View Dashboard',
    'team:manage': 'Manage Team Roles',
    'inbox:read': 'View Inbox',
    'inbox:reply': 'Reply to Messages',
    'handoff:manage': 'Manage Handoffs',
    'agent:config': 'Configure AI Agents',
    'kb:edit': 'Edit Knowledge Base',
    'kb:view': 'View Knowledge Base',
    'leads:read': 'View Leads',
    'leads:write': 'Manage Leads',
    'meetings:manage': 'Manage Meetings',
    'meetings:view': 'View Meetings',
    'quotations:send': 'Send Quotations',
    'quotations:view': 'View Quotations',
    'billing:manage': 'Manage Billing',
    'billing:view': 'View Billing',
    'webhooks:manage': 'Manage Webhooks',
  };

  const PERMISSION_DESCRIPTIONS: Record<string, string> = {
    'agent:config': 'Create and edit AI agents, draft prompts, and save versions.',
    'billing:manage': 'Subscribe to plans, purchase credit top-ups, and update billing details.',
    'billing:view': 'View credit balance, wallet history, and invoice ledger.',
    'dashboard:view': 'Access home analytics, performance metrics, and general overview.',
    'handoff:manage': 'Configure live agent handoff rules, queue timeouts, and routing.',
    'inbox:read': 'Read customer conversations, messages, and contact timelines.',
    'inbox:reply': 'Send live replies in threads and claim handoff conversations.',
    'kb:edit': 'Upload knowledge documents, sync URLs, and edit FAQ snippets.',
    'kb:view': 'View knowledge base sources and grounding status.',
    'leads:read': 'View captured CRM leads, intent scores, and temperatures.',
    'leads:write': 'Create and edit lead profiles, status, notes, and temperature.',
    'meetings:manage': 'Schedule, reschedule, or cancel customer calendar meetings.',
    'meetings:view': 'View calendar integrations, booked meetings, and slots.',
    'quotations:send': 'Create, save, generate PDF, and email customer quotations.',
    'quotations:view': 'Read drafted and sent quotations and pricing catalog.',
    'team:manage': 'Invite new team members, manage roles, and revoke access.',
    'webhooks:manage': 'Create, edit, and rotate signing secrets for HTTP webhooks.',
  };

  const PERMISSION_GROUPS = [
    { title: 'Dashboard & Team', permissions: ['dashboard:view', 'team:manage'] },
    { title: 'Inbox & Handoffs', permissions: ['inbox:read', 'inbox:reply', 'handoff:manage'] },
    { title: 'Knowledge & AI Agents', permissions: ['agent:config', 'kb:edit', 'kb:view'] },
    { title: 'CRM & Sales', permissions: ['leads:read', 'leads:write', 'meetings:manage', 'meetings:view', 'quotations:send', 'quotations:view'] },
    { title: 'Settings & Billing', permissions: ['billing:manage', 'billing:view', 'webhooks:manage'] },
  ];

  // Sync external invite open modal state if passed from workspace overview
  useEffect(() => {
    if (isInviteModalOpen) {
      setShowInviteForm(true);
    }
  }, [isInviteModalOpen]);

  const closeEditModal = () => {
    setEditingMember(null);
  };

  const handleRoleChange = (newRole: string) => {
    setEditRole(newRole);
  };

  const saveEditModal = async () => {
    if (!editingMember) return;
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {};
      if (!editingMember.is_owner) {
        body.role = editRole;
      }
      await apiRequest(`/v1/team/members/${editingMember.membership_id}`, {
        method: 'PATCH',
        body,
      });
      setEditingMember(null);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update member');
    } finally {
      setBusy(false);
    }
  };

  const activeMembers = team?.members.filter((m) => m.is_active).length ?? 0;
  const totalMembers = team?.members.length ?? 0;
  const pendingCount = team?.pending_invites.length ?? 0;
  const seatsUsed = team?.seats_used ?? (activeMembers + pendingCount);
  const includedSeats = entitlements?.included_seats ?? 2;
  const maxMembers = Math.max(includedSeats, seatsUsed);
  const seatsExhausted = seatsUsed >= includedSeats;
  const seatPercent = Math.round((seatsUsed / maxMembers) * 100);

  async function handlePurchaseSeat() {
    setCheckoutBusy(true);
    setError(null);
    try {
      const out = await apiRequest<{ short_url: string }>('/v1/billing/addons/checkout', {
        method: 'POST',
        body: { addon_type: 'extra_team_seat' },
      });
      if (out.short_url) {
        openRazorpayCheckout(out.short_url);
      }
      await onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to initiate purchase.');
    } finally {
      setCheckoutBusy(false);
    }
  }

  function onInvite(e: FormEvent) {
    e.preventDefault();
    if (seatsExhausted) {
      setError('Seats are exhausted. Please purchase an additional seat in Billing to invite more teammates.');
      return;
    }
    const targetEmail = email.trim().toLowerCase();

    // Check if already an active member
    const alreadyMember = team?.members.some((m) => m.is_active && m.email?.toLowerCase() === targetEmail);
    if (alreadyMember) {
      setError('That person is already an active member of this team.');
      return;
    }

    setError(null);
    setPendingInviteSubmit({ email, role });
  }

  async function resendInvite(targetEmail: string, roleName: string) {
    setBusy(true);
    setError(null);
    setLastInvite(null);
    try {
      const res = await apiRequest<InviteCreated>('/v1/team/invites', {
        method: 'POST',
        body: { email: targetEmail, role_name: roleName || 'agent' },
      });
      setLastInvite(res);
      setCopied(false);
      void onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend invite');
    } finally {
      setBusy(false);
    }
  }

  async function executeInvite() {
    setPendingInviteSubmit(null);
    setBusy(true);
    setLastInvite(null);
    try {
      const res = await apiRequest<InviteCreated>('/v1/team/invites', {
        method: 'POST',
        body: { email, role },
      });
      setEmail('');
      setRole('agent');
      setLastInvite(res);
      setCopied(false);
      void onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite');
    } finally {
      setBusy(false);
    }
  }

  async function revokeInvite(inviteId: string) {
    setBusy(true);
    setError(null);
    try {
      await apiRequest(`/v1/team/invites/${inviteId}/revoke`, { method: 'POST' });
      if (lastInvite?.invite_id === inviteId) setLastInvite(null);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not revoke that invite');
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(membershipId: string) {
    setBusy(true);
    setError(null);
    try {
      await apiRequest(`/v1/team/members/${membershipId}/remove`, { method: 'POST' });
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove that member');
    } finally {
      setBusy(false);
    }
  }

  function inviteUrl(invite: InviteCreated): string {
    if (!invite.invite_token) return '';
    const base = typeof window === 'undefined' ? '' : window.location.origin;
    return buildInviteUrl(base, invite.invite_token);
  }

  async function copyInviteLink() {
    if (!lastInvite) return;
    try {
      await navigator.clipboard.writeText(inviteUrl(lastInvite));
      setCopied(true);
    } catch {
      setError('Could not copy — select the link and copy it manually.');
    }
  }

  // Filter members
  const filteredMembers = team?.members.filter((m) => {
    if (filter === 'removed') return !m.is_active;
    if (filter === 'agents') return m.role_name === 'agent' && m.is_active;
    if (filter === 'pending') return m.is_active && !m.can_sign_in;
    return m.is_active;
  }) ?? [];

  const uniqueRoles = Array.from(new Map((roles || []).map((r) => [r.name, r])).values());

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ---- Stat Cards ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Members */}
        <div className="relative overflow-hidden p-5 sm:p-6 rounded-[24px] sm:rounded-[28px] border border-border bg-card hover:border-[#0396A6]/30 hover:shadow-[0_12px_40px_-8px_rgba(3,150,166,0.12)] transition-all duration-300 flex flex-col justify-between min-h-[160px] sm:min-h-[175px] group min-w-0 shadow-[0_2px_15px_rgba(0,0,0,0.03),0_10px_30px_-10px_rgba(3,150,166,0.05)]">
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
              {totalMembers}
            </h3>
          </div>

          <div className="flex flex-col gap-2 mt-auto relative z-10">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground tracking-wider uppercase leading-tight">
                Total Members
              </span>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground/60 font-medium truncate max-w-[120px] leading-tight hidden sm:inline">
                {activeMembers} active
              </span>
            </div>
            <div className="w-full h-[3.5px] sm:h-[4px] rounded-full overflow-hidden bg-black/5 dark:bg-white/10">
              <div className="h-full bg-[#0396A6] transition-all duration-700 rounded-full w-full" />
            </div>
          </div>
        </div>

        {/* Active Now */}
        <div className="relative overflow-hidden p-5 sm:p-6 rounded-[24px] sm:rounded-[28px] border border-border bg-card hover:border-[#0396A6]/30 hover:shadow-[0_12px_40px_-8px_rgba(3,150,166,0.12)] transition-all duration-300 flex flex-col justify-between min-h-[160px] sm:min-h-[175px] group min-w-0 shadow-[0_2px_15px_rgba(0,0,0,0.03),0_10px_30px_-10px_rgba(3,150,166,0.05)]">
          <div
            className="absolute top-0 left-0 right-0 h-[2.5px] opacity-60 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: 'linear-gradient(90deg, transparent, #0396A6, transparent)' }}
          />
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 bg-[#0396A6]" />

          <div className="flex items-center mb-3 sm:mb-4 relative z-10">
            <UserCheck size={20} className="text-[#0396A6]" />
          </div>

          <div className="mb-3 sm:mb-4 relative z-10">
            <h3 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight font-sans leading-none">
              {activeMembers}
            </h3>
          </div>

          <div className="flex flex-col gap-2 mt-auto relative z-10">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground tracking-wider uppercase leading-tight">
                Active Now
              </span>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground/60 font-medium truncate max-w-[120px] leading-tight hidden sm:inline">
                {pendingCount} pending
              </span>
            </div>
            <div className="w-full h-[3.5px] sm:h-[4px] rounded-full overflow-hidden bg-black/5 dark:bg-white/10">
              <div className="h-full bg-[#0396A6] transition-all duration-700 rounded-full w-full" />
            </div>
          </div>
        </div>

        {/* Roles in Use */}
        <div className="relative overflow-hidden p-5 sm:p-6 rounded-[24px] sm:rounded-[28px] border border-border bg-card hover:border-[#0396A6]/30 hover:shadow-[0_12px_40px_-8px_rgba(3,150,166,0.12)] transition-all duration-300 flex flex-col justify-between min-h-[160px] sm:min-h-[175px] group min-w-0 shadow-[0_2px_15px_rgba(0,0,0,0.03),0_10px_30px_-10px_rgba(3,150,166,0.05)]">
          <div
            className="absolute top-0 left-0 right-0 h-[2.5px] opacity-60 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: 'linear-gradient(90deg, transparent, #0396A6, transparent)' }}
          />
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 bg-[#0396A6]" />

          <div className="flex items-center mb-3 sm:mb-4 relative z-10">
            <Shield size={20} className="text-[#0396A6]" />
          </div>

          <div className="mb-3 sm:mb-4 relative z-10">
            <h3 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight font-sans leading-none">
              {new Set((team?.members || []).filter((m) => m.is_active).map((m) => m.role_name || (m.is_owner ? 'owner' : 'none'))).size}
            </h3>
          </div>

          <div className="flex flex-col gap-2 mt-auto relative z-10">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground tracking-wider uppercase leading-tight">
                Roles in Use
              </span>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground/60 font-medium truncate max-w-[120px] leading-tight hidden sm:inline">
                Owner, Agent, etc.
              </span>
            </div>
            <div className="w-full h-[3.5px] sm:h-[4px] rounded-full overflow-hidden bg-black/5 dark:bg-white/10">
              <div className="h-full bg-[#0396A6] transition-all duration-700 rounded-full w-full" />
            </div>
          </div>
        </div>

        {/* Seat Usage */}
        <div className="relative overflow-hidden p-5 sm:p-6 rounded-[24px] sm:rounded-[28px] border border-border bg-card hover:border-[#0396A6]/30 hover:shadow-[0_12px_40px_-8px_rgba(3,150,166,0.12)] transition-all duration-300 flex flex-col justify-between min-h-[160px] sm:min-h-[175px] group min-w-0 shadow-[0_2px_15px_rgba(0,0,0,0.03),0_10px_30px_-10px_rgba(3,150,166,0.05)]">
          <div
            className="absolute top-0 left-0 right-0 h-[2.5px] opacity-60 group-hover:opacity-100 transition-opacity duration-300"
            style={{ background: 'linear-gradient(90deg, transparent, #0396A6, transparent)' }}
          />
          <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none opacity-0 group-hover:opacity-20 blur-2xl transition-opacity duration-500 bg-[#0396A6]" />

          <div className="flex items-center mb-3 sm:mb-4 relative z-10">
            <UsersRound size={20} className="text-[#0396A6]" />
          </div>

          <div className="mb-3 sm:mb-4 relative z-10">
            <h3 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight font-sans leading-none">
              {seatsUsed} / {maxMembers}
            </h3>
          </div>

          <div className="flex flex-col gap-2 mt-auto relative z-10">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-[11px] font-bold text-muted-foreground tracking-wider uppercase leading-tight">
                Seat Usage
              </span>
              <span className="text-[10px] sm:text-[11px] text-muted-foreground/60 font-medium truncate max-w-[120px] leading-tight hidden sm:inline">
                {seatsUsed > includedSeats ? `+${seatsUsed - includedSeats} overage` : 'All seats in plan'}
              </span>
            </div>
            <div className="w-full h-[3.5px] sm:h-[4px] rounded-full overflow-hidden bg-black/5 dark:bg-white/10">
              <div 
                className="h-full bg-[#0396A6] transition-all duration-700 rounded-full" 
                style={{ width: `${Math.min(seatPercent, 100)}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {seatsExhausted ? (
        <div
          className={styles.warn}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderRadius: 14,
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            color: '#92400E',
            marginBottom: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#B45309' }}>
              warning
            </span>
            <div>
              <strong style={{ display: 'block', fontSize: 14, color: '#92400E' }}>
                Seats are exhausted ({seatsUsed} / {includedSeats} in use)
              </strong>
              <span style={{ fontSize: 13, color: '#B45309' }}>
                Purchase more seats in Billing to invite additional teammates.
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Link href="/billing">
              <Button variant="ghost" style={{ fontSize: 13, whiteSpace: 'nowrap', border: '1px solid #FDE68A' }}>
                Go to Billing
              </Button>
            </Link>
            <Button
              onClick={() => void handlePurchaseSeat()}
              loading={checkoutBusy}
              disabled={checkoutBusy}
              style={{ whiteSpace: 'nowrap' }}
            >
              Purchase Seat (₹999/mo)
            </Button>
          </div>
        </div>
      ) : null}

      {/* ---- Invite Form ---- */}
      {showInviteForm ? (
        <div className={styles.form}>
          <form onSubmit={(e) => void onInvite(e)} className="space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap pb-3 border-b border-border/50">
              <div>
                <h3 className={styles.formTitle}>Invite a Teammate</h3>
                <p className={styles.formSub}>Send an invitation link to add someone to your workspace.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowInviteForm(false);
                    if (onCloseInviteModal) onCloseInviteModal();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={busy}
                  disabled={busy || !email.trim() || seatsExhausted}
                  title={seatsExhausted ? 'Seats are exhausted — purchase more seats in Billing' : undefined}
                >
                  Send Invite
                </Button>
              </div>
            </div>

            {seatsExhausted ? (
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: 12,
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#991B1B',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div>
                  <strong style={{ display: 'block', marginBottom: 2 }}>All {includedSeats} team seats are in use</strong>
                  <span>You must purchase an extra seat in Billing before sending an invite.</span>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Link href="/billing">
                    <Button variant="ghost" style={{ fontSize: 12, padding: '6px 12px', border: '1px solid #FECACA', color: '#991B1B' }}>
                      Go to Billing
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    onClick={() => void handlePurchaseSeat()}
                    loading={checkoutBusy}
                    disabled={checkoutBusy}
                    style={{ whiteSpace: 'nowrap', fontSize: 12, padding: '6px 12px' }}
                  >
                    Purchase Seat (+₹999/mo)
                  </Button>
                </div>
              </div>
            ) : null}

            <div className={styles.formRow}>
              <Field
                label="Email Address"
                name="email"
                type="email"
                value={email}
                onChange={setEmail}
                startIcon="mail"
                placeholder="colleague@yourcompany.com"
                required
                disabled={seatsExhausted}
              />
              <label className={styles.select}>
                <span>Workspace Role</span>
                <Select
                  value={role}
                  onChange={setRole}
                  disabled={seatsExhausted}
                  options={uniqueRoles
                    .filter((r) => r.name !== 'owner')
                    .map((r) => ({
                      value: r.name,
                      label: r.label,
                    }))}
                />
              </label>
            </div>
          </form>
        </div>
      ) : null}

      {/* ---- Invite Success Box ---- */}
      {lastInvite ? (
        <div className={styles.inviteBox} role="status">
          <p>
            <strong>Invite created!</strong> Invitation for <strong>{lastInvite.invited_email}</strong> ({lastInvite.role_name}) · Expires {dateTime(lastInvite.expires_at)}
          </p>
          <div
            onClick={() => void copyInviteLink()}
            style={{
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              marginTop: '12px',
              background: '#ffffff',
              border: '1.5px solid #0396A6',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#1e1b4b',
              fontWeight: 600,
              fontFamily: 'monospace',
              fontSize: '13px',
              boxShadow: '0 2px 8px rgba(var(--brand-rgb), 0.12)',
            }}
            title="Click to copy link"
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', wordBreak: 'break-all', color: '#1e1b4b' }}>
              {inviteUrl(lastInvite) || 'Generating invitation link...'}
            </span>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: copied ? '#10b981' : '#0396A6', flexShrink: 0 }}>
              {copied ? 'check' : 'content_copy'}
            </span>
          </div>
          <div className={styles.formActions}>
            <p className={styles.hint}>Click the link above to copy it and share it directly with your teammate.</p>
          </div>
        </div>
      ) : null}

      {/* ---- Team Table Card ---- */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div className={styles.tableHeaderTop}>
            <h4 className={styles.tableHeaderTitle}>Teammates</h4>
            <div className={styles.cardActions}>
              <Link href="/team/roles" className={styles.rolesBtn}>
                <span className={styles.btnTextFull}>Roles &amp; Permissions</span>
                <span className={styles.btnTextShort}>Roles</span>
              </Link>
              {canManageTeam && (
                <button
                  type="button"
                  className={styles.inviteBtn}
                  onClick={() => {
                    setShowInviteForm(!showInviteForm);
                    if (!showInviteForm && onOpenInviteModal) onOpenInviteModal();
                  }}
                >
                  <span className={`material-symbols-outlined ${styles.btnIcon}`}>person_add</span>
                  <span className={styles.btnTextFull}>Invite Teammate</span>
                  <span className={styles.btnTextShort}>Invite</span>
                </button>
              )}
            </div>
          </div>

          <div className={styles.tabsRow}>
            {(['all', 'agents', 'pending', 'removed'] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                className={`${styles.tabBtn} ${filter === f ? styles.tabBtnActive : ''}`}
                onClick={() => {
                  setFilter(f);
                  setPage(1);
                }}
              >
                {f === 'all' ? 'Active' : f === 'agents' ? 'Agents' : f === 'pending' ? 'Pending' : 'Removed'}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.tableWrap} data-lenis-prevent>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.slice((page - 1) * pageSize, page * pageSize).map((m) => (
                <tr key={m.membership_id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#E2F6F9] text-[#0A1A2F] border border-[#8CE2EE] flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-2xs">
                        {initials(m.display_name || m.email)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-foreground truncate">{m.display_name || m.email}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className={styles.emailCell}>{m.email}</td>
                  <td>
                    <span className="text-xs font-black text-foreground uppercase tracking-wide">
                      {roleLabel(m)}
                    </span>
                  </td>
                  <td>
                    <span className={`text-xs font-bold ${!m.is_active ? 'text-slate-500' : 'text-emerald-600'}`}>
                      {!m.is_active ? 'Removed' : 'Active'}
                    </span>
                  </td>
                  <td className={styles.timeCell}>{relative(m.created_at)}</td>
                  <td className={styles.actionCell}>
                    <div className={styles.actionCellInner}>
                      {canManageTeam && m.is_active && !m.is_owner && m.user_id !== (currentUserId || me?.user_id) ? (
                        <button
                          type="button"
                          className={styles.revokeBtn}
                          disabled={busy}
                          onClick={() => setConfirmRemove(m.membership_id)}
                        >
                          Remove
                        </button>
                      ) : null}
                      {canManageTeam ? (
                        <button
                          type="button"
                          className={styles.editBtn}
                          onClick={() => {
                            setEditingMember(m);
                            const roleKey = m.is_owner ? 'owner' : (m.role_name || 'agent');
                            setEditRole(roleKey);
                          }}
                        >
                          Edit Role
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredMembers.length ? (
                <tr className={styles.emptyRow}>
                  <td colSpan={6}>
                    {filter === 'all'
                      ? 'No team members yet.'
                      : filter === 'agents'
                      ? 'No agents found.'
                      : filter === 'removed'
                      ? 'No removed members.'
                      : 'No pending invites.'}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className={styles.tablePaginationWrap}>
          <Pagination
            currentPage={page}
            pageSize={pageSize}
            totalItems={filteredMembers.length}
            onPageChange={setPage}
            onPageSizeChange={(newSize) => {
              setPageSize(newSize);
              setPage(1);
            }}
            pageSizeOptions={[5, 10, 20, 50]}
            itemLabel="teammates"
          />
        </div>
      </div>

      {/* ---- Pending Invites Table ---- */}
      {pendingCount > 0 ? (
        <div className={`${styles.tableCard} ${styles.pendingSection}`}>
          <div className={styles.tableHeader}>
            <div className={styles.tableHeaderLeft}>
              <h4 className={styles.tableHeaderTitle}>Pending Invites</h4>
              <span className={styles.hint}>{pendingCount} outstanding</span>
            </div>
          </div>
          <div className={styles.tableWrap} data-lenis-prevent>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Expires</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {team?.pending_invites.map((i) => (
                  <tr key={i.invite_id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#E2F6F9] text-[#0A1A2F] border border-[#8CE2EE] flex items-center justify-center font-bold text-xs shrink-0 select-none shadow-2xs">
                          {initials(i.invited_email.split('@')[0] || '')}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-foreground truncate">{i.invited_email}</div>
                          <div className="text-[11px] text-muted-foreground truncate">Invitation sent</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs font-black text-foreground uppercase tracking-wide">
                        {i.role_name ? i.role_name.charAt(0).toUpperCase() + i.role_name.slice(1) : '—'}
                      </span>
                    </td>
                    <td className={styles.timeCell}>{relative(i.expires_at)}</td>
                    <td className={styles.actionCell}>
                      <div className={styles.actionCellInner} style={{ gap: '8px' }}>
                        <button
                          type="button"
                          className={styles.editBtn}
                          disabled={busy}
                          onClick={() => void resendInvite(i.invited_email, i.role_name || 'agent')}
                          title="Refresh token and copy link"
                        >
                          Get Link
                        </button>
                        {canManageTeam && (
                          <button
                            type="button"
                            className={styles.revokeBtn}
                            disabled={busy}
                            onClick={() => setConfirmRevoke(i.invite_id)}
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* ---- Edit Role Modal (Existing Member) ---- */}
      {editingMember && typeof window !== 'undefined' ? createPortal(
        <div className={styles.modalOverlay} onClick={closeEditModal}>
          <div className={styles.modalCard} data-lenis-prevent onClick={(e) => e.stopPropagation()}>
            <button onClick={closeEditModal} className={styles.modalCloseBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
            </button>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Edit Access Levels</h2>
              <p className={styles.modalSub}>
                Customize what {editingMember.display_name || editingMember.email.split('@')[0]} can see and do.
              </p>
            </div>

            <div className={styles.modalUserBox}>
              <div className={`${styles.avatar} ${avatarClass(editingMember)} ${styles.modalUserAvatar}`}>
                {initials(editingMember.display_name || editingMember.email)}
              </div>
              <div>
                <div className={styles.modalUserName}>
                  {editingMember.display_name || editingMember.email.split('@')[0]}
                </div>
                <div className={styles.modalUserEmail}>{editingMember.email}</div>
              </div>
            </div>

            <div className={styles.modalSection}>
              <label className={styles.modalLabel}>Base Role</label>
              {editingMember.is_owner ? (
                <div className={styles.ownerRoleCard}>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)' }}>
                    Primary Account Owner
                  </span>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0396A6' }}>
                    Full Access
                  </span>
                </div>
              ) : (
                <Select
                  value={editRole}
                  onChange={handleRoleChange}
                  className={styles.modalSelect}
                  options={(uniqueRoles.length
                    ? uniqueRoles.filter((r) => r.name !== 'owner')
                    : [
                        { name: 'manager', label: 'Manager' },
                        { name: 'agent', label: 'Agent' },
                        { name: 'viewer', label: 'Viewer' },
                      ]
                  ).map((r) => ({
                    value: r.name,
                    label: r.label || r.name.charAt(0).toUpperCase() + r.name.slice(1),
                  }))}
                />
              )}
              {editingMember.is_owner && (
                <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '0.5rem' }}>
                  Owner role cannot be changed via this panel. Contact support for ownership transfer.
                </p>
              )}
            </div>

            <div className={styles.modalSection}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label className={styles.modalLabel} style={{ marginBottom: 0 }}>Permissions Preview</label>
                <Link href="/team/roles" className={styles.auditLink} style={{ fontSize: '13px' }}>
                  Manage Custom Roles
                  <span className="material-symbols-outlined" style={{ fontSize: 14, marginLeft: 4 }}>
                    open_in_new
                  </span>
                </Link>
              </div>
              <div className={styles.permissionsList}>
                {PERMISSION_GROUPS.map((group) => (
                  <div key={group.title} className={styles.permGroup}>
                    <div className={styles.permGroupTitle}>{group.title}</div>
                    {group.permissions.map((code) => {
                      const isChecked = uniqueRoles.find((r) => r.name === editRole)?.permissions.includes(code) ?? false;
                      return (
                        <label key={code} className={styles.permItem} style={{ cursor: 'default' }}>
                          <div className={styles.permInfo}>
                            <div className={styles.permTitle}>{PERMISSION_TITLES[code]}</div>
                            <div className={styles.permDesc}>{PERMISSION_DESCRIPTIONS[code]}</div>
                          </div>
                          <div className={`${styles.toggleSwitch} ${isChecked ? styles.on : ''}`} style={{ pointerEvents: 'none' }}>
                            <div className={styles.toggleKnob} />
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <Button variant="ghost" onClick={closeEditModal}>Cancel</Button>
              <Button variant="primary" loading={busy} disabled={busy} onClick={() => void saveEditModal()}>
                Save Changes
              </Button>
            </div>
          </div>
        </div>,
        document.body
      ) : null}

      {/* ---- Invite Confirmation Modal ---- */}
      {pendingInviteSubmit && typeof window !== 'undefined' ? createPortal(
        <div className={styles.modalOverlay} onClick={() => setPendingInviteSubmit(null)}>
          <div className={styles.modalCard} data-lenis-prevent onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPendingInviteSubmit(null)} className={styles.modalCloseBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
            </button>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Confirm Invitation</h2>
              <p className={styles.modalSub}>Review the permissions {pendingInviteSubmit.email} will receive.</p>
            </div>

            <div className={styles.modalSection}>
              <label className={styles.modalLabel}>Base Role</label>
              <Select
                value={editRole}
                onChange={handleRoleChange}
                className={styles.modalSelect}
                options={uniqueRoles
                  .filter((r) => r.name !== 'owner')
                  .map((r) => ({
                    value: r.name,
                    label: r.label,
                  }))}
              />
            </div>

            <div className={styles.modalSection}>
              <label className={styles.modalLabel}>Permissions Preview</label>
              <div className={styles.permissionsList}>
                {PERMISSION_GROUPS.map((group) => (
                  <div key={group.title} className={styles.permGroup}>
                    <div className={styles.permGroupTitle}>{group.title}</div>
                    {group.permissions.map((code) => {
                      const isChecked = uniqueRoles.find((r) => r.name === editRole)?.permissions.includes(code) ?? false;
                      return (
                        <label key={code} className={styles.permItem} style={{ cursor: 'default' }}>
                          <div className={styles.permInfo}>
                            <div className={styles.permTitle}>{PERMISSION_TITLES[code]}</div>
                            <div className={styles.permDesc}>{PERMISSION_DESCRIPTIONS[code]}</div>
                          </div>
                          <div className={`${styles.toggleSwitch} ${isChecked ? styles.on : ''}`} style={{ pointerEvents: 'none' }}>
                            <div className={styles.toggleKnob} />
                          </div>
                        </label>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <Button variant="ghost" onClick={() => setPendingInviteSubmit(null)}>Cancel</Button>
              <Button variant="primary" onClick={executeInvite} loading={busy}>Send Invite</Button>
            </div>
          </div>
        </div>,
        document.body
      ) : null}

      {/* ---- Confirm Remove Modal ---- */}
      <AlertModal
        isOpen={confirmRemove !== null}
        onClose={() => setConfirmRemove(null)}
        icon="person_remove"
        title="Remove Member"
        description="Are you sure you want to remove this team member? They will lose access to the workspace immediately."
        confirmText="Remove Member"
        onConfirm={() => {
          if (confirmRemove) {
            const id = confirmRemove;
            setConfirmRemove(null);
            void removeMember(id);
          }
        }}
      />

      {/* ---- Confirm Revoke Modal ---- */}
      <AlertModal
        isOpen={confirmRevoke !== null}
        onClose={() => setConfirmRevoke(null)}
        icon="link_off"
        title="Revoke Invite"
        description="Are you sure you want to revoke this invitation link?"
        confirmText="Revoke Invite"
        onConfirm={() => {
          if (confirmRevoke) {
            const id = confirmRevoke;
            setConfirmRevoke(null);
            void revokeInvite(id);
          }
        }}
      />
    </div>
  );
}
