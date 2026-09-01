"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { LenisProvider } from "@/components/home/LenisProvider";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { AlertModal } from "@/components/ui/AlertModal";
import { ErrorBox, PageState } from "@/components/ui/PageState";
import { Select } from "@/components/ui/Select";
import { Pagination } from "@/components/ui/Pagination";
import { EntitlementGate } from "@/components/entitlements/EntitlementGate";
import { useToast } from "@/lib/toast";
import { apiRequest } from "@/lib/api";
import { openRazorpayCheckout } from "@/lib/billingCheckout";
import { buildInviteUrl } from "@/lib/invite-url";
import { limitLabel } from "@/lib/entitlements";
import { dateTime, relative } from "@/lib/format";
import { type InviteCreated, type Team, type TeamMember, type Role } from "@/lib/types";
import { useWorkspace } from "@/lib/workspace";
import styles from "./team.module.css";

type Filter = "all" | "agents" | "pending" | "removed";

function initials(name?: string | null): string {
  if (!name) return "??";
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "??";
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase();
  return (p[0]![0]! + p[p.length - 1]![0]!).toUpperCase();
}

/** Role label for badge. */
function roleLabel(m: TeamMember): string {
  if (m.is_owner) return "Owner";
  return m.role_name ? m.role_name.charAt(0).toUpperCase() + m.role_name.slice(1) : "No role";
}

/** CSS class for avatar by role. */
function avatarClass(m: TeamMember): string {
  if (m.is_owner) return styles.avatarOwner || "";
  switch (m.role_name) {
    case "manager": return styles.avatarManager || "";
    case "agent":   return styles.avatarAgent || "";
    default:        return styles.avatarViewer || "";
  }
}

/** CSS class for role badge by role. */
function roleBadgeClass(m: TeamMember): string {
  if (m.is_owner) return styles.roleOwner || "";
  switch (m.role_name) {
    case "manager": return styles.roleManager || "";
    case "agent":   return styles.roleAgent || "";
    default:        return styles.roleViewer || "";
  }
}

/**
 * Team and roles (Master ┬ºO).
 *
 * ⚠️∩╕Å THEIR SCREEN CONFLATES MEMBERS AND INVITES INTO ONE LIST with a synthetic `status` of
 * active/pending/inactive, and ours must not — `team/router.py` returns them SEPARATELY and says
 * why: "a pending invite is an offer with no membership behind it, so listing it as a member would
 * count a seat nobody occupies." Migration `0034` is what made that true (invite-before-membership),
 * and it matters here because their "Revoke" button passes a `membership_id` to the revoke-INVITE
 * route. Against our API that is a 404 at best.
 *
 * Three other divergences, all forced by our API rather than chosen:
 *
 *   * **Roles are `manager | agent | viewer`**, read off `MEMBER_ROLES` in `team/service.py`. Theirs
 *     offers `agent | admin`, and `admin` is not a role we seed — an invite naming it would land a
 *     membership with a NULL `role_id`, which is exactly the latent bug D55 found and migration
 *     `0037` fixed.
 *   * **The invite may or may not be emailed, and the response says which.** `delivery` is one of
 *     `sent | failed | not_configured` — the service DOES send mail when `APP_BASE_URL` is set. The
 *     link is always shown for copying, because `failed` and `not_configured` are both normal. This
 *     paragraph previously claimed the value was `"not_sent"` and that no provider existed on this
 *     path; both were false, and line 218 of this same file already had it right. D64 corrected the
 *     router docstring and the render and missed the header, so the file contradicted itself.
 *   * **THE SEAT COUNT IS ENFORCED SINCE D78.** It was display-only from D51a — `max_team_members`
 *     sat in `plans.entitlements` and nothing read it at any write path, so showing "3 / 5" while
 *     the sixth invite succeeded was a lie told with our own numbers. The invite path now refuses
 *     with `limit_reached`, and PENDING INVITES COUNT toward the seat: a seat is committed when it
 *     is offered, not when it is taken, or the cap would land at accept — after the person has
 *     been invited and clicked. The screen still does not disable the form client-side; the server
 *     is the authority and its refusal is what the user sees.
 */
export default function TeamPage() {
  const { entitlements, me } = useWorkspace();
  const { showToast } = useToast();
  const [data, setData] = useState<Team | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const setError = useCallback(
    (msg: string | null) => {
      if (msg) showToast(msg, { type: "error" });
    },
    [showToast]
  );
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("agent");
  const [lastInvite, setLastInvite] = useState<InviteCreated | null>(null);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editRole, setEditRole] = useState<string>("agent");

  // Confirmation states
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);
  const [pendingInviteSubmit, setPendingInviteSubmit] = useState<{ email: string, role: string } | null>(null);

  const PERMISSION_TITLES: Record<string, string> = {
    "dashboard:view": "View Dashboard",
    "team:manage": "Manage Team Roles",
    "inbox:read": "View Inbox",
    "inbox:reply": "Reply to Messages",
    "handoff:manage": "Manage Handoffs",
    "agent:config": "Configure AI Agents",
    "kb:edit": "Edit Knowledge Base",
    "kb:view": "View Knowledge Base",
    "leads:read": "View Leads",
    "leads:write": "Manage Leads",
    "meetings:manage": "Manage Meetings",
    "meetings:view": "View Meetings",
    "quotations:send": "Send Quotations",
    "quotations:view": "View Quotations",
    "billing:manage": "Manage Billing",
    "billing:view": "View Billing",
    "webhooks:manage": "Manage Webhooks",
  };

  const PERMISSION_DESCRIPTIONS: Record<string, string> = {
    "agent:config": "Create and edit AI agents, draft prompts, and save versions.",
    "billing:manage": "Subscribe to plans, purchase credit top-ups, and update billing details.",
    "billing:view": "View credit balance, wallet history, and invoice ledger.",
    "dashboard:view": "Access home analytics, performance metrics, and general overview.",
    "handoff:manage": "Configure live agent handoff rules, queue timeouts, and routing.",
    "inbox:read": "Read customer conversations, messages, and contact timelines.",
    "inbox:reply": "Send live replies in threads and claim handoff conversations.",
    "kb:edit": "Upload knowledge documents, sync URLs, and edit FAQ snippets.",
    "kb:view": "View knowledge base sources and grounding status.",
    "leads:read": "View captured CRM leads, intent scores, and temperatures.",
    "leads:write": "Create and edit lead profiles, status, notes, and temperature.",
    "meetings:manage": "Schedule, reschedule, or cancel customer calendar meetings.",
    "meetings:view": "View calendar integrations, booked meetings, and slots.",
    "quotations:send": "Create, save, generate PDF, and email customer quotations.",
    "quotations:view": "Read drafted and sent quotations and pricing catalog.",
    "team:manage": "Invite new team members, manage roles, and revoke access.",
    "webhooks:manage": "Create, edit, and rotate signing secrets for HTTP webhooks.",
  };

  const PERMISSION_GROUPS = [
    { title: "Dashboard & Team", permissions: ["dashboard:view", "team:manage"] },
    { title: "Inbox & Handoffs", permissions: ["inbox:read", "inbox:reply", "handoff:manage"] },
    { title: "Knowledge & AI Agents", permissions: ["agent:config", "kb:edit", "kb:view"] },
    { title: "CRM & Sales", permissions: ["leads:read", "leads:write", "meetings:manage", "meetings:view", "quotations:send", "quotations:view"] },
    { title: "Settings & Billing", permissions: ["billing:manage", "billing:view", "webhooks:manage"] },
  ];

  const closeEditModal = () => {
    setEditingMember(null);
  };

  // Auto-dismiss handled by shareable Toast component

  const handleRoleChange = (newRole: string) => {
    setEditRole(newRole);
  };

  const saveEditModal = async () => {
    if (!editingMember) return;
    setBusy(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {};
      // Only include role if the member is not an owner — the PATCH endpoint rejects owner role
      // changes with owner_role_immutable 409, so we don't send the field at all for owners.
      if (!editingMember.is_owner) {
        body.role = editRole;
      }
      await apiRequest(`/v1/team/members/${editingMember.membership_id}`, {
        method: "PATCH",
        body,
      });
      setEditingMember(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update member");
    } finally {
      setBusy(false);
    }
  };

  const load = useCallback(async () => {
    setError(null);
    try {
      const [teamData, rolesData] = await Promise.all([
        apiRequest<Team>("/v1/team"),
        apiRequest<Role[]>("/v1/team/roles"),
      ]);
      setData(teamData);
      // Deduplicate roles by name to prevent React key collision if API returns duplicates
      const uniqueRoles = Array.from(
        new Map((rolesData || []).map((r) => [r.name, r])).values()
      );
      setRoles(uniqueRoles);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your team");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    // When editingMember or pendingInviteSubmit opens, lock body scroll
    if (editingMember || pendingInviteSubmit || confirmRemove || confirmRevoke) {
      if (editingMember) {
        const initialRole = editingMember.is_owner ? "owner" : (editingMember.role_name || "agent");
        setEditRole(initialRole);
      } else if (pendingInviteSubmit) {
        setEditRole(pendingInviteSubmit.role);
      }
      
      // Lock body scroll
      document.body.style.overflow = "hidden";
    } else {
      // Unlock body scroll
      document.body.style.overflow = "";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "";
    };
  }, [editingMember, pendingInviteSubmit, confirmRemove, confirmRevoke]);

  const activeMembers = data?.members.filter((m) => m.is_active).length ?? 0;
  const totalMembers = data?.members.length ?? 0;
  const pendingCount = data?.pending_invites.length ?? 0;
  const seatsUsed = data?.seats_used ?? (activeMembers + pendingCount);
  const includedSeats = entitlements?.included_seats ?? 2;
  const maxMembers = Math.max(includedSeats, seatsUsed);
  const seatsExhausted = seatsUsed >= includedSeats;
  const seatPercent = Math.round((seatsUsed / maxMembers) * 100);

  async function handlePurchaseSeat() {
    setCheckoutBusy(true);
    setError(null);
    try {
      const out = await apiRequest<{ short_url: string }>("/v1/billing/addons/checkout", {
        method: "POST",
        body: { addon_type: "extra_team_seat" }
      });
      if (out.short_url) {
        openRazorpayCheckout(out.short_url);
      }
      await load();
    } catch (err: any) {
      setError(err.message || "Failed to initiate purchase.");
    } finally {
      setCheckoutBusy(false);
    }
  }

  function onInvite(e: FormEvent) {
    e.preventDefault();
    if (seatsExhausted) {
      setError("Seats are exhausted. Please purchase an additional seat in Billing to invite more teammates.");
      return;
    }
    const targetEmail = email.trim().toLowerCase();
    
    // Check if already an active member
    const alreadyMember = data?.members.some(m => m.is_active && m.email?.toLowerCase() === targetEmail);
    if (alreadyMember) {
      setError("That person is already an active member of this team.");
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
      const res = await apiRequest<InviteCreated>("/v1/team/invites", {
        method: "POST",
        body: { email: targetEmail, role_name: roleName || "agent" },
      });
      setLastInvite(res);
      setCopied(false);
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend invite");
    } finally {
      setBusy(false);
    }
  }

  async function executeInvite() {
    setPendingInviteSubmit(null);
    setBusy(true);
    setLastInvite(null);
    try {
      const res = await apiRequest<InviteCreated>("/v1/team/invites", {
        method: "POST",
        body: { email, role_name: role },
      });
      console.log("INVITE API RESPONSE:", res);
      setEmail("");
      setRole("agent");
      setLastInvite(res);
      setCopied(false);
      void load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to invite");
    } finally {
      setBusy(false);
    }
  }

  async function revokeInvite(inviteId: string) {
    setBusy(true);
    setError(null);
    try {
      await apiRequest(`/v1/team/invites/${inviteId}/revoke`, { method: "POST" });
      if (lastInvite?.invite_id === inviteId) setLastInvite(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not revoke that invite");
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(membershipId: string) {
    setBusy(true);
    setError(null);
    try {
      await apiRequest(`/v1/team/members/${membershipId}/remove`, { method: "POST" });
      await load();
    } catch (err) {
      // The server refuses to remove the LAST ACTIVE OWNER with a 409 — one careless click must not
      // lock a merchant out of its own account, and there is no self-service way back in. Its
      // message is better than anything this screen could invent, so it is shown verbatim.
      setError(err instanceof Error ? err.message : "Could not remove that member");
    } finally {
      setBusy(false);
    }
  }

  /** The one-time link — uses the shared buildInviteUrl helper so email and copy-link
   * can never drift apart (Task 1). The helper uses the same ?token= query-param shape
   * that invite/page.tsx reads from useSearchParams().get('token'). */
  function inviteUrl(invite: InviteCreated): string {
    if (!invite.invite_token) return "";
    const base = typeof window === "undefined" ? "" : window.location.origin;
    return buildInviteUrl(base, invite.invite_token);
  }

  async function copyInviteLink() {
    if (!lastInvite) return;
    try {
      await navigator.clipboard.writeText(inviteUrl(lastInvite));
      setCopied(true);
    } catch {
      setError("Could not copy — select the link and copy it manually.");
    }
  }

  // Filter members
  const filteredMembers = data?.members.filter((m) => {
    if (filter === "removed") return !m.is_active;
    if (filter === "agents") return m.role_name === "agent" && m.is_active;
    if (filter === "pending") return m.is_active && !m.can_sign_in;
    return m.is_active;
  }) ?? [];

  return (
    <LenisProvider>
      <AppShell
        wide
        title="Team Management"
        subtitle="Manage your team members, assign roles, and control access to your workspace."
        requires="team:manage"
      >
      <EntitlementGate feature="team_rbac">
        {/* Removed top ErrorBox, now rendered as a toast at the bottom */}

        {loading || !data ? (
          <PageState
            icon="group"
            title={loading ? "Loading team…" : "No team data"}
            description={loading ? "Fetching members and invites." : "Try refreshing."}
          />
        ) : (
        <>
          {/* ---- Body Action Bar ---- */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-bold text-foreground">Team Overview</h2>
              <p className="text-xs text-muted-foreground">Monitor workspace access, seat capacity, and member permissions.</p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <Link href="/team/roles">
                <Button variant="ghost" className="gap-1.5 text-xs font-semibold border border-border">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>shield_person</span>
                  Roles & Permissions
                </Button>
              </Link>
              <Button
                variant="primary"
                onClick={() => setShowInviteForm(!showInviteForm)}
                className="gap-1.5 text-xs font-semibold"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>person_add</span>
                Invite Teammate
              </Button>
            </div>
          </div>

          {/* ---- Stat Cards ---- */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statCardTop}>
                <div>
                  <p className={styles.statLabel}>Total Members</p>
                  <p className={styles.statValue}>{totalMembers}</p>
                </div>
                <div className={styles.statIconBadge}>
                  <span className="material-symbols-outlined">group</span>
                </div>
              </div>
              <div className={`${styles.statFooter}`} style={{ color: "var(--pine)" }}>
                <span className="material-symbols-outlined">trending_up</span>
                {activeMembers} active
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statCardTop}>
                <div>
                  <p className={styles.statLabel}>Active Now</p>
                  <p className={styles.statValue}>{activeMembers}</p>
                </div>
                <div className={styles.statIconBadge}>
                  <span className="material-symbols-outlined">person</span>
                </div>
              </div>
              <div className={styles.statFooter} style={{ color: "var(--warm)" }}>
                <span className="material-symbols-outlined">schedule</span>
                {pendingCount} pending invite{pendingCount !== 1 ? "s" : ""}
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statCardTop}>
                <div>
                  <p className={styles.statLabel}>Roles in Use</p>
                  <p className={styles.statValue}>
                    {new Set(data.members.filter(m => m.is_active).map(m => m.role_name || (m.is_owner ? "owner" : "none"))).size}
                  </p>
                </div>
                <div className={styles.statIconBadge}>
                  <span className="material-symbols-outlined">business_center</span>
                </div>
              </div>
              <div className={styles.statFooter} style={{ color: "var(--muted)" }}>
                <span className="material-symbols-outlined">shield</span>
                owner, manager, agent, viewer
              </div>
            </div>

            <div className={`${styles.statCard} ${styles.statHighlight}`}>
              <p className={styles.statLabel}>Seat Usage</p>
              <p className={styles.statValue}>
                {seatsUsed} / {maxMembers}
              </p>
              <div className={styles.seatBar}>
                <div 
                  className={styles.seatBarFill} 
                  style={{ 
                    width: `${Math.min(seatPercent, 100)}%`,
                    background: seatsUsed > includedSeats 
                      ? "linear-gradient(90deg, #f87171, #ef4444)" 
                      : "linear-gradient(90deg, #4ade80, #22c55e)",
                    boxShadow: seatsUsed > includedSeats
                      ? "0 0 10px rgba(239, 68, 68, 0.7)"
                      : "0 0 10px rgba(74, 222, 128, 0.7)"
                  }} 
                />
              </div>
              <div className={styles.statFooter}>
                <span style={{ color: seatsUsed > includedSeats ? "#fca5a5" : "#ffffff", fontWeight: 600 }}>
                  {includedSeats} Included
                  {seatsUsed > includedSeats && `, ${seatsUsed - includedSeats} Overage`}
                </span>
                {pendingCount > 0 && (
                  <span style={{ color: "rgba(255, 255, 255, 0.9)", marginLeft: "auto", fontWeight: 500 }}>
                    ({activeMembers} active, {pendingCount} pending)
                  </span>
                )}
              </div>
              <span className={`material-symbols-outlined ${styles.statBg}`}>groups</span>
            </div>
          </div>

          {seatsExhausted ? (
            <div className={styles.warn} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderRadius: 14, background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#B45309' }}>warning</span>
                <div>
                  <strong style={{ display: 'block', fontSize: 14, color: '#92400E' }}>Seats are exhausted ({seatsUsed} / {includedSeats} in use)</strong>
                  <span style={{ fontSize: 13, color: '#B45309' }}>Purchase more seats in Billing to invite additional teammates.</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Link href="/billing">
                  <Button variant="ghost" style={{ fontSize: 13, whiteSpace: 'nowrap', border: '1px solid #FDE68A' }}>Go to Billing</Button>
                </Link>
                <Button onClick={() => void handlePurchaseSeat()} loading={checkoutBusy} disabled={checkoutBusy} style={{ whiteSpace: 'nowrap' }}>
                  Purchase Seat (₹999/mo)
                </Button>
              </div>
            </div>
          ) : null}

          {/* ---- Invite Form ---- */}
          {showInviteForm ? (
            <div className={styles.form}>
              <div>
                <h3 className={styles.formTitle}>Invite a Teammate</h3>
                <p className={styles.formSub}>Send an invitation link to add someone to your workspace.</p>
              </div>

              {seatsExhausted ? (
                <div style={{ padding: '14px 18px', borderRadius: 12, background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
                  <div>
                    <strong style={{ display: 'block', marginBottom: 2 }}>All {includedSeats} team seats are in use</strong>
                    <span>You must purchase an extra seat in Billing before sending an invite.</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <Link href="/billing">
                      <Button variant="ghost" style={{ fontSize: 12, padding: '6px 12px', border: '1px solid #FECACA', color: '#991B1B' }}>Go to Billing</Button>
                    </Link>
                    <Button type="button" onClick={() => void handlePurchaseSeat()} loading={checkoutBusy} disabled={checkoutBusy} style={{ whiteSpace: 'nowrap', fontSize: 12, padding: '6px 12px' }}>
                      Purchase Seat (+₹999/mo)
                    </Button>
                  </div>
                </div>
              ) : null}

              <form onSubmit={(e) => void onInvite(e)}>
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
                      options={roles
                        .filter((r) => r.name !== "owner")
                        .map((r) => ({
                          value: r.name,
                          label: r.label,
                        }))}
                    />
                  </label>
                </div>
                <div className={styles.formActions}>
                  <Button type="button" variant="ghost" onClick={() => setShowInviteForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={busy} disabled={busy || !email.trim() || seatsExhausted} title={seatsExhausted ? "Seats are exhausted — purchase more seats in Billing" : undefined}>
                    Send Invite
                  </Button>
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
                  cursor: "pointer", 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  gap: "12px", 
                  marginTop: "12px",
                  background: "#ffffff",
                  border: "1.5px solid #0396A6",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  color: "#1e1b4b",
                  fontWeight: 600,
                  fontFamily: "monospace",
                  fontSize: "13px",
                  boxShadow: "0 2px 8px rgba(var(--brand-rgb), 0.12)"
                }}
                title="Click to copy link"
              >
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", wordBreak: "break-all", color: "#1e1b4b" }}>
                  {inviteUrl(lastInvite) || "Generating invitation link..."}
                </span>
                <span className="material-symbols-outlined" style={{ fontSize: 18, color: copied ? "#10b981" : "#0396A6", flexShrink: 0 }}>
                  {copied ? "check" : "content_copy"}
                </span>
              </div>
              <div className={styles.formActions}>
                <p className={styles.hint}>
                  Click the link above to copy it and share it directly with your teammate.
                </p>
              </div>
            </div>
          ) : null}

          {/* ---- Team Table ---- */}
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <div className={styles.tableHeaderTop}>
                <h4 className={styles.tableHeaderTitle}>Teammates</h4>
                <div className={styles.cardActions}>
                  <Link href="/team/roles" className={styles.rolesBtn}>
                    <span className={styles.btnTextFull}>Roles &amp; Permissions</span>
                    <span className={styles.btnTextShort}>Roles</span>
                  </Link>
                  <button
                    type="button"
                    className={styles.inviteBtn}
                    onClick={() => setShowInviteForm(!showInviteForm)}
                  >
                    <span className={`material-symbols-outlined ${styles.btnIcon}`}>person_add</span>
                    <span className={styles.btnTextFull}>Invite Teammate</span>
                    <span className={styles.btnTextShort}>Invite</span>
                  </button>
                </div>
              </div>
              <div className={styles.tabsRow}>
                {(["all", "agents", "pending", "removed"] as Filter[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    className={`${styles.tabBtn} ${filter === f ? styles.tabBtnActive : ""}`}
                    onClick={() => {
                      setFilter(f);
                      setPage(1);
                    }}
                  >
                    {f === "all" ? "Active" : f === "agents" ? "Agents" : f === "pending" ? "Pending" : "Removed"}
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
                    <th style={{ textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.slice((page - 1) * pageSize, page * pageSize).map((m) => (
                    <tr key={m.membership_id}>
                      <td>
                        <div className={styles.memberCell}>
                          <div className={`${styles.avatar} ${avatarClass(m)}`}>
                            {initials(m.display_name || m.email)}
                          </div>
                          <div className={styles.memberInfo}>
                            <div className={styles.memberName}>{m.display_name || m.email}</div>
                            <div className={styles.memberSub}>{roleLabel(m)}</div>
                          </div>
                        </div>
                      </td>
                      <td className={styles.emailCell}>{m.email}</td>
                      <td>
                        <span className={`${styles.roleBadge} ${roleBadgeClass(m)}`}>
                          {roleLabel(m)}
                        </span>
                      </td>
                      <td>
                        <span className={`text-xs font-bold ${!m.is_active ? 'text-slate-500' : 'text-emerald-600'}`}>
                          {!m.is_active ? "Removed" : "Active"}
                        </span>
                      </td>
                      <td className={styles.timeCell}>{relative(m.created_at)}</td>
                      <td className={styles.actionCell}>
                        <div className={styles.actionCellInner}>
                          {m.is_active && !m.is_owner && m.user_id !== me?.user_id ? (
                            <button
                              type="button"
                              className={styles.revokeBtn}
                              disabled={busy}
                              onClick={() => setConfirmRemove(m.membership_id)}
                            >
                              Remove
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className={styles.editBtn}
                            onClick={() => {
                              setEditingMember(m);
                              const roleKey = m.is_owner ? "owner" : (m.role_name || "agent");
                              setEditRole(roleKey);
                            }}
                          >
                            Edit Role
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filteredMembers.length ? (
                    <tr className={styles.emptyRow}>
                      <td colSpan={6}>
                        {filter === "all" ? "No team members yet." :
                         filter === "agents" ? "No agents found." :
                         filter === "removed" ? "No removed members." :
                         "No pending invites."}
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
                      <th style={{ textAlign: "right" }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.pending_invites.map((i) => (
                      <tr key={i.invite_id}>
                        <td>
                          <div className={styles.memberCell}>
                            <div className={`${styles.avatar} ${styles.avatarAgent}`}>
                              {initials(i.invited_email.split("@")[0] || "")}
                            </div>
                            <div className={styles.memberInfo}>
                              <div className={styles.memberName}>{i.invited_email}</div>
                              <div className={styles.memberSub}>Invitation sent</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.roleBadge} ${styles.roleAgent}`}>
                            {i.role_name ? i.role_name.charAt(0).toUpperCase() + i.role_name.slice(1) : "—"}
                          </span>
                        </td>
                        <td className={styles.timeCell}>{relative(i.expires_at)}</td>
                        <td className={styles.actionCell}>
                          <div className={styles.actionCellInner} style={{ gap: "8px" }}>
                            <button
                              type="button"
                              className={styles.editBtn}
                              disabled={busy}
                              onClick={() => void resendInvite(i.invited_email, i.role_name || "agent")}
                              title="Refresh token and copy link"
                            >
                              Get Link
                            </button>
                            <button
                              type="button"
                              className={styles.revokeBtn}
                              disabled={busy}
                              onClick={() => setConfirmRevoke(i.invite_id)}
                            >
                              Revoke
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </>
      )}

      {/* ---- Edit Role Modal (Existing Member) ---- */}
      {editingMember ? (
        <div className={styles.modalOverlay} onClick={closeEditModal}>
          <div className={styles.modalCard} data-lenis-prevent onClick={(e) => e.stopPropagation()}>
            <button onClick={closeEditModal} className={styles.modalCloseBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
            </button>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Edit Access Levels</h2>
              <p className={styles.modalSub}>Customize what {editingMember.display_name || editingMember.email.split("@")[0]} can see and do.</p>
            </div>
            
            <div className={styles.modalUserBox}>
              <div className={`${styles.avatar} ${avatarClass(editingMember)} ${styles.modalUserAvatar}`}>
                {initials(editingMember.display_name || editingMember.email)}
              </div>
              <div>
                <div className={styles.modalUserName}>{editingMember.display_name || editingMember.email.split("@")[0]}</div>
                <div className={styles.modalUserEmail}>{editingMember.email}</div>
              </div>
            </div>

            <div className={styles.modalSection}>
              <label className={styles.modalLabel}>Base Role</label>
              {editingMember.is_owner ? (
                <div className={styles.ownerRoleCard}>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)' }}>Primary Account Owner</span>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0396A6' }}>
                    Full Access
                  </span>
                </div>
              ) : (
                <Select 
                  value={editRole}
                  onChange={handleRoleChange}
                  className={styles.modalSelect}
                  options={(roles.length ? roles.filter((r) => r.name !== "owner") : [
                    { name: "manager", label: "Manager" },
                    { name: "agent", label: "Agent" },
                    { name: "viewer", label: "Viewer" }
                  ]).map((r) => ({
                    value: r.name,
                    label: r.label || (r.name.charAt(0).toUpperCase() + r.name.slice(1)),
                  }))}
                />
              )}
              {editingMember.is_owner && (
                <p style={{ fontSize: "12px", color: "var(--muted)", marginTop: "0.5rem" }}>
                  Owner role cannot be changed via this panel. Contact support for ownership transfer.
                </p>
              )}
            </div>

            <div className={styles.modalSection}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label className={styles.modalLabel} style={{ marginBottom: 0 }}>Permissions Preview</label>
                <Link href="/team/roles" className={styles.auditLink} style={{ fontSize: "13px" }}>
                  Manage Custom Roles
                  <span className="material-symbols-outlined" style={{ fontSize: 14, marginLeft: 4 }}>open_in_new</span>
                </Link>
              </div>
              <div className={styles.permissionsList}>
                {PERMISSION_GROUPS.map(group => (
                  <div key={group.title} className={styles.permGroup}>
                    <div className={styles.permGroupTitle}>{group.title}</div>
                    {group.permissions.map(code => {
                      const isChecked = roles.find(r => r.name === editRole)?.permissions.includes(code) ?? false;
                      return (
                        <label key={code} className={styles.permItem} style={{ cursor: "default" }}>
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
              <Button variant="primary" loading={busy} disabled={busy} onClick={() => void saveEditModal()}>Save Changes</Button>
            </div>
          </div>
        </div>
      ) : null}

      {/* ---- Invite Confirmation Modal ---- */}
      {pendingInviteSubmit ? (
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
                options={roles
                  .filter((r) => r.name !== "owner")
                  .map((r) => ({
                    value: r.name,
                    label: r.label,
                  }))}
              />
            </div>

            <div className={styles.modalSection}>
              <label className={styles.modalLabel}>Permissions Preview</label>
              <div className={styles.permissionsList}>
                {PERMISSION_GROUPS.map(group => (
                  <div key={group.title} className={styles.permGroup}>
                    <div className={styles.permGroupTitle}>{group.title}</div>
                    {group.permissions.map(code => {
                      const isChecked = roles.find(r => r.name === editRole)?.permissions.includes(code) ?? false;
                      return (
                        <label key={code} className={styles.permItem} style={{ cursor: "default" }}>
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
        </div>
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
      </EntitlementGate>
    </AppShell>
  </LenisProvider>
);
}
