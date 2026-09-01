"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { EntitlementGate } from "@/components/entitlements/EntitlementGate";
import { MERCHANT_PERMISSIONS, type MerchantPermission } from "@/lib/permissions";
import { apiRequest } from "@/lib/api";
import type { Team, Role } from "@/lib/types";
import styles from "./roles.module.css";

// ─────────────────────────────────────────────────────────────────────────────
// BACKEND INTEGRATION LAYER
// When the backend is ready, replace these 3 functions with real API calls:
//   fetchCustomRoles()  → GET /v1/team/roles?type=custom
//   createCustomRole()  → POST /v1/team/roles
//   deleteCustomRole()  → DELETE /v1/team/roles/:id
// The rest of the component doesn't need to change at all.
// ─────────────────────────────────────────────────────────────────────────────
const STORAGE_KEY = "frosty__custom_roles";

export type CustomRole = {
  id: string;
  name: string;
  description: string;
  permissions: Set<MerchantPermission>;
  isCustom: true;
};

function fetchCustomRoles(): CustomRole[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { id: string; name: string; description: string; permissions: MerchantPermission[] }[];
    return parsed.map((r) => ({ ...r, permissions: new Set(r.permissions), isCustom: true as const }));
  } catch { return []; }
}

function saveCustomRoles(roles: CustomRole[]): void {
  const serializable = roles.map((r) => ({ ...r, permissions: [...r.permissions] }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
}

function createCustomRole(name: string, description: string, permissions: Set<MerchantPermission>): CustomRole {
  const role: CustomRole = { id: `custom_${Date.now()}`, name, description, permissions, isCustom: true };
  const existing = fetchCustomRoles();
  saveCustomRoles([...existing, role]);
  return role;
}

function deleteCustomRoleById(id: string): void {
  const existing = fetchCustomRoles();
  saveCustomRoles(existing.filter((r) => r.id !== id));
}

// System role permission overrides (Manager / Agent / Viewer only, stored locally)
// TODO: swap with GET /v1/team/roles?type=system and PUT /v1/team/roles/:id
const OVERRIDE_KEY = "frosty__system_role_overrides";

function fetchSystemOverrides(): Record<string, MerchantPermission[]> {
  try {
    const raw = localStorage.getItem(OVERRIDE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, MerchantPermission[]>) : {};
  } catch { return {}; }
}

function saveSystemOverride(role: string, perms: MerchantPermission[]): void {
  const overrides = fetchSystemOverrides();
  overrides[role] = perms;
  localStorage.setItem(OVERRIDE_KEY, JSON.stringify(overrides));
}
// ─────────────────────────────────────────────────────────────────────────────

const SYSTEM_ROLE_PERMISSIONS: Record<"owner" | "manager" | "agent" | "viewer", Set<MerchantPermission>> = {
  owner: new Set(MERCHANT_PERMISSIONS),
  manager: new Set(MERCHANT_PERMISSIONS.filter((c) => c !== "billing:manage")),
  agent: new Set(["dashboard:view", "inbox:read", "inbox:reply", "leads:read", "leads:write", "meetings:view", "meetings:manage", "quotations:view", "quotations:send", "kb:view"]),
  viewer: new Set(["dashboard:view", "inbox:read", "kb:view", "leads:read", "meetings:view", "quotations:view", "billing:view"]),
};

const SYSTEM_ROLE_DESCS: Record<string, string> = {
  owner: "Full administrative access. All permissions are permanently granted and cannot be modified.",
  manager: "Operations lead access. Can manage the team, inbox, and agents, but cannot access billing.",
  agent: "Support and sales access. Can reply to messages, manage leads, and send quotations.",
  viewer: "Read-only access. Can view the dashboard, inbox, leads, and quotations, but cannot make changes.",
};

type ModuleRow = { name: string; icon: string; codes: string; read: MerchantPermission[]; write: MerchantPermission[]; manage: MerchantPermission[] };

const MODULE_MATRIX: ModuleRow[] = [
  { name: "Agent Management",   icon: "support_agent",  codes: "agent:config",                      read: [],                write: [],               manage: ["agent:config"] },
  { name: "Knowledge Base",     icon: "menu_book",      codes: "kb:view, kb:edit",                  read: ["kb:view"],       write: ["kb:edit"],      manage: [] },
  { name: "Chat Widget",        icon: "chat_bubble",    codes: "widget:config",                     read: [],                write: [],               manage: ["widget:config"] },
  { name: "Unified Inbox",      icon: "inbox",          codes: "inbox:read, inbox:reply, handoff:manage", read: ["inbox:read"], write: ["inbox:reply"], manage: ["handoff:manage"] },
  { name: "Lead Prospecting",   icon: "leaderboard",    codes: "leads:read, leads:write",           read: ["leads:read"],    write: ["leads:write"],  manage: [] },
  { name: "Calendar & Meetings",icon: "calendar_month", codes: "meetings:view, meetings:manage",    read: ["meetings:view"], write: [],               manage: ["meetings:manage"] },
  { name: "Quotes & Estimates", icon: "request_quote",  codes: "quotations:view, quotations:send",  read: ["quotations:view"], write: ["quotations:send"], manage: [] },
  { name: "Billing & Payments", icon: "payments",       codes: "billing:view, billing:manage",      read: ["billing:view"],  write: [],               manage: ["billing:manage"] },
  { name: "Webhooks",           icon: "webhook",        codes: "webhooks:manage",                   read: [],                write: [],               manage: ["webhooks:manage"] },
  { name: "Dashboard & Team",   icon: "dashboard",      codes: "dashboard:view, team:manage",       read: ["dashboard:view"], write: [],              manage: ["team:manage"] },
];

const PERMISSION_GROUPS = [
  { label: "Dashboard & Team",   icon: "dashboard",      perms: ["dashboard:view", "team:manage"] as MerchantPermission[] },
  { label: "Inbox & Handoffs",   icon: "inbox",          perms: ["inbox:read", "inbox:reply", "handoff:manage"] as MerchantPermission[] },
  { label: "Knowledge & Agents", icon: "menu_book",      perms: ["agent:config", "kb:view", "kb:edit", "widget:config"] as MerchantPermission[] },
  { label: "CRM & Sales",        icon: "leaderboard",    perms: ["leads:read", "leads:write", "meetings:view", "meetings:manage", "quotations:view", "quotations:send", "catalog:read", "catalog:write"] as MerchantPermission[] },
  { label: "Settings & Billing", icon: "payments",       perms: ["billing:view", "billing:manage", "webhooks:manage"] as MerchantPermission[] },
];

const PERM_LABELS: Record<MerchantPermission, string> = {
  "dashboard:view": "View Dashboard",
  "team:manage": "Manage Team & Roles",
  "inbox:read": "Read Messages",
  "inbox:reply": "Reply to Chats",
  "handoff:manage": "Manage Handoffs",
  "agent:config": "Configure Agents",
  "kb:view": "View Knowledge Base",
  "kb:edit": "Edit Knowledge Base",
  "widget:config": "Configure Chat Widget",
  "leads:read": "View Leads",
  "leads:write": "Edit Leads",
  "meetings:view": "View Meetings",
  "meetings:manage": "Manage Meetings",
  "quotations:view": "View Quotes",
  "quotations:send": "Send Quotes",
  "catalog:read": "View Product Catalogue",
  "catalog:write": "Edit Product Catalogue",
  "billing:view": "View Billing",
  "billing:manage": "Manage Billing",
  "webhooks:manage": "Manage Webhooks",
};

export default function RolesPage() {
  const [activeTab, setActiveTab] = useState<string>("owner");
  const [teamData, setTeamData] = useState<Team | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [mobilePopoverRow, setMobilePopoverRow] = useState<string | null>(null);
  
  // Inline edit state
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null); // null = create, custom id = edit custom, system key = edit system
  const [editingIsSystem, setEditingIsSystem] = useState(false);

  // Form state (used for BOTH modal create and inline edit)
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRolePerms, setNewRolePerms] = useState<Set<MerchantPermission>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [teamRes, rolesRes] = await Promise.all([
        apiRequest<Team>("/v1/team"),
        apiRequest<Role[]>("/v1/team/roles"),
      ]);
      setTeamData(teamRes);
      setRoles(rolesRes);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Close mobile popover when clicking anywhere outside
  useEffect(() => {
    const handleGlobalClick = () => setMobilePopoverRow(null);
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (showCreateModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [showCreateModal]);

  // Active role data
  const systemRoles = ["owner", "manager", "agent", "viewer"] as const;
  const isSystem = (systemRoles as readonly string[]).includes(activeTab);
  const activeRole = roles.find((r) => r.name === activeTab || r.id === activeTab);

  // Resolve permissions: use local override if present, else default
  const getSystemPerms = (role: string): Set<MerchantPermission> => {
    const r = roles.find(x => x.name === role);
    return new Set(r?.permissions as MerchantPermission[] || []);
  };

  const activePermissions: Set<MerchantPermission> = new Set(activeRole?.permissions as MerchantPermission[] || []);
  const activeRoleDesc = isSystem ? SYSTEM_ROLE_DESCS[activeTab] : (activeRole?.label || "Custom role");

  const assignedCount = teamData?.members.filter(
    (m) => m.is_active && (m.role_name === (activeRole?.name || activeTab) || ((activeRole?.name || activeTab) === "owner" && m.is_owner))
  ).length || 0;

  const toggleInlinePerm = (perms: MerchantPermission[]) => {
    if (perms.length === 0 || !isEditingInline) return;

    setNewRolePerms((prev) => {
      const next = new Set(prev);
      const hasAll = perms.every((p) => next.has(p));
      if (hasAll) {
        perms.forEach((p) => next.delete(p));
      } else {
        perms.forEach((p) => next.add(p));
      }
      return next;
    });
  };

  const renderCheck = (perms: MerchantPermission[]) => {
    if (perms.length === 0) {
      return <span className={styles.checkDisabled}>—</span>;
    }
    const targetSet = isEditingInline ? newRolePerms : activePermissions;
    const hasAll = perms.every((p) => targetSet.has(p));
    
    return (
      <button
        type="button"
        disabled={!isEditingInline}
        className={`${styles.inlineToggle} ${hasAll ? styles.inlineToggleActive : ""} ${!isEditingInline ? styles.inlineToggleReadOnly : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          if (isEditingInline) {
            toggleInlinePerm(perms);
          }
        }}
        aria-label={isEditingInline ? "Toggle permission" : "Permission status"}
      >
        <div className={styles.inlineToggleThumb}>
          <span className={`material-symbols-outlined ${styles.inlineToggleIcon}`}>
            {hasAll ? "check" : "close"}
          </span>
        </div>
      </button>
    );
  };

  const resetFormState = () => {
    setEditingRoleId(null);
    setEditingIsSystem(false);
    setNewRoleName("");
    setNewRoleDesc("");
    setNewRolePerms(new Set());
    setSaveError(null);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    resetFormState();
  };

  const cancelInlineEdit = () => {
    setIsEditingInline(false);
    resetFormState();
  };

  const openCreate = () => {
    resetFormState();
    setEditingRoleId("create");
    setShowCreateModal(true);
  };

  const openEdit = (role: Role) => {
    setEditingRoleId(role.id);
    setEditingIsSystem(false);
    setNewRoleName(role.label || role.name);
    setNewRoleDesc(SYSTEM_ROLE_DESCS[role.name] || "");
    setNewRolePerms(new Set(role.permissions as MerchantPermission[]));
    setSaveError(null);
    setIsEditingInline(true);
  };

  const openEditSystem = (role: string) => {
    setEditingRoleId(role);
    setEditingIsSystem(true);
    setNewRoleName(role.charAt(0).toUpperCase() + role.slice(1));
    setNewRoleDesc(SYSTEM_ROLE_DESCS[role] || "");
    setNewRolePerms(new Set(getSystemPerms(role)));
    setSaveError(null);
    setIsEditingInline(true);
  };

  const handleSave = async () => {
    setSaveError(null);
    if (newRolePerms.size === 0) { setSaveError("Select at least one permission."); return; }
    setSaving(true);

    try {
      if (editingIsSystem && editingRoleId) {
        const baseName = activeTab.toLowerCase();
        const customName = `${baseName}_custom_${Date.now().toString().slice(-4)}`;
        const customLabel = `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} (Custom)`;
        await apiRequest<{ data: { id: string; name: string } }>("/v1/team/roles", {
          method: "POST",
          body: { name: customName, label: customLabel, permission_codes: [...newRolePerms] }
        });
        await load();
        setActiveTab(customName);
        if (isEditingInline) cancelInlineEdit();
        setMobilePopoverRow(null);
        return;
      } else if (editingRoleId && editingRoleId !== "create") {
        await apiRequest(`/v1/team/roles/${editingRoleId}`, {
          method: "PATCH",
          body: { label: newRoleName.trim() || newRoleDesc.trim(), description: newRoleDesc.trim(), permission_codes: [...newRolePerms] }
        });
      } else {
        const payloadName = (newRoleName.trim() || `role_${Date.now().toString().slice(-4)}`).toLowerCase().replace(/\s+/g, '_');
        await apiRequest<{ data: { id: string } }>("/v1/team/roles", {
          method: "POST",
          body: { name: payloadName, label: newRoleName.trim() || newRoleDesc.trim(), description: newRoleDesc.trim(), permission_codes: [...newRolePerms] }
        });
        setActiveTab(payloadName);
      }
      await load();
      if (showCreateModal) closeModal();
      if (isEditingInline) cancelInlineEdit();
      setMobilePopoverRow(null);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  // Change active tab logic => if editing inline, cancel it
  const handleTabChange = (tabId: string) => {
    if (isEditingInline) {
      if (!confirm("Discard unsaved changes?")) return;
      cancelInlineEdit();
    }
    setActiveTab(tabId);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiRequest(`/v1/team/roles/${id}`, { method: "DELETE" });
      await load();
      setShowDeleteConfirm(null);
      setActiveTab("owner");
    } catch (err) {
      console.error(err);
    }
  };

  const togglePerm = (p: MerchantPermission) => {
    setNewRolePerms((prev) => {
      const next = new Set(prev);
      if (next.has(p)) next.delete(p); else next.add(p);
      return next;
    });
  };

  return (
    <AppShell
      title="Roles & Permissions"
      subtitle="Define what your team can access. Permission AND entitlement both required to access specific modules."
      requires="dashboard:view"
      actions={
        <div className="flex gap-3">
          <Button variant="primary" onClick={openCreate}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Create Custom Role
          </Button>
          <Link href="/workspace?tab=team">
            <Button variant="ghost">Back to Team</Button>
          </Link>
        </div>
      }
    >
      <EntitlementGate feature="team_rbac">
        {/* ── Tabs ── */}
        <div className={styles.tabs}>
        {systemRoles.map((role) => (
          <button
            key={role}
            className={`${styles.tab} ${activeTab === role ? styles.tabActive : ""}`}
            onClick={() => handleTabChange(role)}
          >
            {activeTab === role && <span className="material-symbols-outlined" style={{ fontSize: 15 }}>lock</span>}
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </button>
        ))}
        {roles.filter(r => !(systemRoles as readonly string[]).includes(r.name)).map((role) => (
          <button
            key={role.name}
            className={`${styles.tab} ${activeTab === role.name ? styles.tabActive : ""} ${styles.tabCustom}`}
            onClick={() => handleTabChange(role.name)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>tune</span>
            {role.label}
          </button>
        ))}
      </div>

      {/* ── Role Card ── */}
      <div className={styles.card}>
        <div className={styles.roleHeader}>
          <div style={{ flex: 1 }}>
            {isEditingInline && !editingIsSystem ? (
              <div className="flex flex-col gap-2 max-w-[280px] sm:max-w-[320px]">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                    Role Name
                  </label>
                  <input
                    type="text"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="Role Name (e.g. Sales Lead)"
                    className="w-full px-3 py-1.5 bg-white border border-border rounded-md text-sm font-semibold text-foreground outline-none focus:border-[#0396A6] shadow-2xs transition-all"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={newRoleDesc}
                    onChange={(e) => setNewRoleDesc(e.target.value)}
                    placeholder="Brief description"
                    className="w-full px-3 py-1.5 bg-white border border-border rounded-md text-xs font-medium text-foreground outline-none focus:border-[#0396A6] shadow-2xs transition-all"
                  />
                </div>
              </div>
            ) : (
              <>
                <h2 className={styles.roleTitle}>
                  {isSystem
                    ? activeTab.charAt(0).toUpperCase() + activeTab.slice(1) + " Role"
                    : (activeRole?.label ?? "Custom Role")}
                </h2>
                <p className={styles.roleDesc}>{activeRoleDesc}</p>
              </>
            )}
            {saveError && isEditingInline && (
              <div style={{ color: "var(--danger)", fontSize: 13, marginTop: 8 }}>{saveError}</div>
            )}
          </div>
          
          <div className={styles.roleHeaderRight}>
            {isEditingInline ? (
              <div className={styles.inlineHeaderActions}>
                <Button variant="ghost" onClick={cancelInlineEdit}>Cancel</Button>
                <Button variant="primary" onClick={handleSave} loading={saving}>
                  {saving
                    ? <><span className="material-symbols-outlined" style={{ fontSize: 16, animation: "spin 1s linear infinite" }}>progress_activity</span> Saving…</>
                    : "Save Changes"
                  }
                </Button>
              </div>
            ) : (
              <>
                {/* Edit button for custom roles */}
                {!isSystem && activeRole && (
                  <button className={styles.editRoleBtn} onClick={() => openEdit(activeRole)}>
                    <span className={`material-symbols-outlined ${styles.roleBtnIcon}`} style={{ fontSize: 16 }}>edit</span>
                    Edit Role
                  </button>
                )}
                
                {/* Edit button for system roles */}
                {isSystem && (
                  <button className={styles.editRoleBtn} onClick={() => openEditSystem(activeTab)}>
                    <span className={`material-symbols-outlined ${styles.roleBtnIcon}`} style={{ fontSize: 16 }}>edit</span>
                    Edit Permissions
                  </button>
                )}
                
                {!isSystem && activeRole && (
                  <button className={styles.deleteRoleBtn} onClick={() => setShowDeleteConfirm(activeRole.id)}>
                    <span className={`material-symbols-outlined ${styles.roleBtnIcon}`}>delete</span>
                    Delete Role
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className={styles.tableWrap} data-lenis-prevent>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Module & Scope</th>
                <th className={`${styles.center} ${styles.desktopCol}`}>Read</th>
                <th className={`${styles.center} ${styles.desktopCol}`}>Write</th>
                <th className={`${styles.center} ${styles.desktopCol}`}>Manage/Config</th>
                <th className={styles.mobileCol} style={{ textAlign: "right", width: 44 }}></th>
              </tr>
            </thead>
            <tbody>
              {MODULE_MATRIX.map((row) => (
                <tr key={row.name}>
                  <td>
                    <div className={styles.moduleInfo}>
                      <div className={styles.moduleIcon}>
                        <span className="material-symbols-outlined">{row.icon}</span>
                      </div>
                      <div>
                        <div className={styles.moduleName}>{row.name}</div>
                        <div className={styles.moduleCodes}>{row.codes}</div>
                      </div>
                    </div>
                  </td>
                  <td className={`${styles.center} ${styles.desktopCol}`}>{renderCheck(row.read)}</td>
                  <td className={`${styles.center} ${styles.desktopCol}`}>{renderCheck(row.write)}</td>
                  <td className={`${styles.center} ${styles.desktopCol}`}>{renderCheck(row.manage)}</td>
                  <td className={styles.mobileCol}>
                    <div className={styles.mobileMenuContainer}>
                      <button
                        type="button"
                        className={styles.threeDotBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMobilePopoverRow(mobilePopoverRow === row.name ? null : row.name);
                        }}
                        aria-label={`View ${row.name} permissions`}
                      >
                        <span className="material-symbols-outlined">more_vert</span>
                      </button>

                      {mobilePopoverRow === row.name && (
                        <div
                          className={styles.mobilePopover}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className={styles.mobilePopoverTitleRow}>
                            <span className={styles.mobilePopoverTitle}>{row.name}</span>
                            <button
                              type="button"
                              className={styles.mobilePopoverCloseBtn}
                              onClick={() => setMobilePopoverRow(null)}
                            >
                              <span className="material-symbols-outlined">close</span>
                            </button>
                          </div>
                          <div className={styles.mobileScopeRows}>
                            <div
                              className={`${styles.mobileScopeItem} ${row.read.length > 0 && isEditingInline ? styles.mobileScopeItemClickable : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (row.read.length > 0 && isEditingInline) toggleInlinePerm(row.read);
                              }}
                            >
                              <span className={styles.mobileScopeName}>Read</span>
                              <div className={styles.mobileScopeToggle}>{renderCheck(row.read)}</div>
                            </div>
                            <div
                              className={`${styles.mobileScopeItem} ${row.write.length > 0 && isEditingInline ? styles.mobileScopeItemClickable : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (row.write.length > 0 && isEditingInline) toggleInlinePerm(row.write);
                              }}
                            >
                              <span className={styles.mobileScopeName}>Write</span>
                              <div className={styles.mobileScopeToggle}>{renderCheck(row.write)}</div>
                            </div>
                            <div
                              className={`${styles.mobileScopeItem} ${row.manage.length > 0 && isEditingInline ? styles.mobileScopeItemClickable : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (row.manage.length > 0 && isEditingInline) toggleInlinePerm(row.manage);
                              }}
                            >
                              <span className={styles.mobileScopeName}>Manage/Config</span>
                              <div className={styles.mobileScopeToggle}>{renderCheck(row.manage)}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className={styles.cardFooter}>
          <span className={styles.avatarGroupText}>
            {assignedCount} team member{assignedCount !== 1 ? "s" : ""} assigned to this role
          </span>
        </div>
      </div>

      {/* ── Info Cards ── */}
      <div className={styles.infoGrid}>
        <div className={styles.infoCard}>
          <div className={styles.infoCardHeader}>
            <span className="material-symbols-outlined" style={{ color: "var(--pine)" }}>verified_user</span>
            <h3 className={styles.infoCardTitle}>Permission Logic</h3>
          </div>
          <p className={styles.infoCardDesc}>
            Access is granted only when both the User Permission and the Account Entitlement are active. If your plan doesn't include "Quotes", the quote permission will be ignored.
          </p>
        </div>
        <div className={styles.infoCard}>
          <div className={styles.infoCardHeader}>
            <span className="material-symbols-outlined" style={{ color: "var(--warm)" }}>policy</span>
            <h3 className={styles.infoCardTitle}>Audit Log</h3>
          </div>
          <p className={styles.infoCardDesc}>
            Changes to roles and permissions are logged and visible in the Compliance Tab for transparency and security auditing.
          </p>
        </div>
      </div>

      {/* ═══════════════════ Create Role Modal — Premium Redesign ════════════════════ */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.createModalCard} onClick={(e) => e.stopPropagation()}>

            {/* ── Modal Header ── */}
            <div className={styles.createModalHeader}>
              <div className={styles.createModalHeaderIcon}>
                <span className="material-symbols-outlined">
                  {editingRoleId ? "edit" : "tune"}
                </span>
              </div>
              <div className={styles.createModalHeaderText}>
                <h2 className={styles.createModalTitle}>
                  {editingIsSystem
                    ? `Edit ${newRoleName} Permissions`
                    : editingRoleId ? "Edit Custom Role" : "Create Custom Role"}
                </h2>
                <p className={styles.createModalSub}>
                  {editingIsSystem
                    ? `Customize which permissions the ${newRoleName} role has. Changes override the default set.`
                    : editingRoleId
                    ? "Update the name, description, or permissions for this role."
                    : "Define a role name and cherry-pick the exact permissions it should have."}
                </p>
              </div>
              <button className={styles.createModalClose} onClick={closeModal}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* ── Two-column body ── */}
            <div className={styles.createModalBody}>

              {/* Left: Role info */}
              <div className={styles.createModalLeft}>
                {editingIsSystem ? (
                  /* System role — show read-only role card */
                  <div className={styles.rolePreviewCard} style={{ borderStyle: "solid" }}>
                    <p className={styles.rolePreviewLabel}>Editing System Role</p>
                    <div className={styles.rolePreviewName}>
                      <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#0396A6" }}>admin_panel_settings</span>
                      {newRoleName}
                    </div>
                    <p className={styles.rolePreviewDesc}>{newRoleDesc}</p>
                    <div className={styles.rolePreviewBadge}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>lock_open</span>
                      {newRolePerms.size} permission{newRolePerms.size !== 1 ? "s" : ""} selected
                    </div>
                    <p style={{ fontSize: 11.5, color: "var(--muted)", marginTop: 10, lineHeight: 1.5 }}>
                      ⚠️ Overriding a system role only affects new permission checks. Existing sessions update on next login.
                    </p>
                  </div>
                ) : (
                  /* Custom role — show editable fields */
                  <>
                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>Role Name <span className={styles.required}>*</span></label>
                      <input
                        className={styles.fieldInput}
                        placeholder="e.g. Support Tier 2"
                        value={newRoleName}
                        onChange={(e) => setNewRoleName(e.target.value)}
                        maxLength={40}
                        autoFocus
                      />
                      <p className={styles.fieldHint}>{40 - newRoleName.length} characters left</p>
                    </div>

                    <div className={styles.fieldGroup}>
                      <label className={styles.fieldLabel}>Description</label>
                      <textarea
                        className={styles.fieldTextarea}
                        placeholder="What can people with this role do? This shows up in the team invite screen."
                        value={newRoleDesc}
                        onChange={(e) => setNewRoleDesc(e.target.value)}
                        rows={4}
                        maxLength={200}
                      />
                      <p className={styles.fieldHint}>{200 - newRoleDesc.length} characters left</p>
                    </div>

                    {/* Live preview card */}
                    <div className={styles.rolePreviewCard}>
                      <p className={styles.rolePreviewLabel}>Preview</p>
                      <div className={styles.rolePreviewName}>
                        <span className="material-symbols-outlined" style={{ fontSize: 18, color: "#0396A6" }}>tune</span>
                        {newRoleName || <span style={{ opacity: 0.4 }}>Custom Role Name</span>}
                      </div>
                      {newRoleDesc && <p className={styles.rolePreviewDesc}>{newRoleDesc}</p>}
                      <div className={styles.rolePreviewBadge}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>lock_open</span>
                        {newRolePerms.size} permission{newRolePerms.size !== 1 ? "s" : ""} granted
                      </div>
                    </div>
                  </>
                )}

                {saveError && (
                  <div className={styles.createError}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
                    {saveError}
                  </div>
                )}
              </div>

              {/* Right: Permissions */}
              <div className={styles.createModalRight}>
                <div className={styles.permHeader}>
                  <p className={styles.permHeaderTitle}>Permissions <span className={styles.required}>*</span></p>
                  <div className={styles.permHeaderActions}>
                    <button className={styles.permSelectAll} onClick={() => setNewRolePerms(new Set(MERCHANT_PERMISSIONS))}>
                      Select all
                    </button>
                    <button className={styles.permSelectAll} onClick={() => setNewRolePerms(new Set())}>
                      Clear
                    </button>
                  </div>
                </div>

                <div className={styles.permGroupList}>
                  {PERMISSION_GROUPS.map((group) => {
                    const allSelected = group.perms.every((p) => newRolePerms.has(p));
                    const someSelected = group.perms.some((p) => newRolePerms.has(p));
                    return (
                      <div key={group.label} className={styles.permGroupCard}>
                        <div className={styles.permGroupCardHeader}>
                          <div className={styles.permGroupCardIcon}>
                            <span className="material-symbols-outlined">{group.icon}</span>
                          </div>
                          <span className={styles.permGroupCardLabel}>{group.label}</span>
                          <button
                            className={`${styles.permGroupToggleAll} ${allSelected ? styles.permGroupToggleAllActive : ""}`}
                            onClick={() => {
                              if (allSelected) {
                                setNewRolePerms((prev) => { const n = new Set(prev); group.perms.forEach((p) => n.delete(p)); return n; });
                              } else {
                                setNewRolePerms((prev) => { const n = new Set(prev); group.perms.forEach((p) => n.add(p)); return n; });
                              }
                            }}
                          >
                            {allSelected ? "Remove all" : someSelected ? "Add remaining" : "Add all"}
                          </button>
                        </div>
                        <div className={styles.permToggleList}>
                          {group.perms.map((perm) => {
                            const active = newRolePerms.has(perm);
                            return (
                              <div
                                key={perm}
                                className={`${styles.permToggleRow} ${active ? styles.permToggleRowActive : ""}`}
                                onClick={() => togglePerm(perm)}
                              >
                                <div className={styles.permToggleInfo}>
                                  <span className={styles.permToggleName}>{PERM_LABELS[perm] ?? perm}</span>
                                  <span className={styles.permToggleCode}>{perm}</span>
                                </div>
                                <div className={`${styles.permToggleSwitch} ${active ? styles.permToggleSwitchOn : ""}`}>
                                  <div className={styles.permToggleThumb} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className={styles.createModalFooter}>
              <div className={styles.permCount}>
                <span className={styles.permCountBadge}>{newRolePerms.size}</span>
                permission{newRolePerms.size !== 1 ? "s" : ""} selected
              </div>
              <div className={styles.createModalActions}>
                <Button variant="ghost" onClick={closeModal}>Cancel</Button>
                <Button variant="primary" onClick={handleSave}>
                  {saving
                    ? <><span className="material-symbols-outlined" style={{ fontSize: 16, animation: "spin 1s linear infinite" }}>progress_activity</span> Creating…</>
                    : <><span className="material-symbols-outlined" style={{ fontSize: 16 }}>check</span> Create Role</> 
                  }
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════ Delete Confirm Modal ════════════════════════════ */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteConfirm(null)}>
          <div className={styles.alertModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.alertIcon}>
              <span className="material-symbols-outlined">delete_forever</span>
            </div>
            <h2 className={styles.alertTitle}>Delete Role</h2>
            <p className={styles.alertSub}>
              This role will be permanently deleted. Team members currently assigned to it will lose all permissions until reassigned.
            </p>
            <div className={styles.alertFooter}>
              <Button variant="ghost" onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => handleDelete(showDeleteConfirm)}>Delete Role</Button>
            </div>
          </div>
        </div>
      )}
      </EntitlementGate>
    </AppShell>
  );
}
