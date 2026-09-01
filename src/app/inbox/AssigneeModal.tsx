"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import type { Team, TeamMember } from "@/lib/types";

type Props = {
  open?: boolean;
  onClose: () => void;
  onTransfer?: (membershipId: string) => Promise<void>;
  onAssign?: (membershipId: string) => Promise<void>;
  currentAssigneeId?: string | null;
  busy?: boolean;
};

export function AssigneeModal({
  open = true,
  onClose,
  onTransfer,
  onAssign,
  currentAssigneeId,
  busy = false,
}: Props) {
  const handleTransfer = onTransfer || onAssign;
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>("");
  const [customId, setCustomId] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    apiRequest<Team>("/v1/team")
      .then((res) => {
        if (active) {
          const activeMembers = (res.members || []).filter((m) => m.is_active);
          setTeam(activeMembers);
        }
      })
      .catch((err) => {
        console.error("Failed to load team for assignment", err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open]);

  if (!open) return null;

  const filteredMembers = team.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.display_name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.role_name?.toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetId = showCustomInput ? customId.trim() : selectedId;
    if (!targetId || !handleTransfer) return;
    await handleTransfer(targetId);
    onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(0, 0, 0, 0.45)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          background: "var(--lt-card, #ffffff)",
          border: "1px solid var(--lt-border, #e5e7eb)",
          borderRadius: "16px",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.15)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "85vh",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid var(--lt-border, #e5e7eb)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: "1.1rem",
                fontWeight: 700,
                color: "var(--lt-text-primary, #111827)",
                letterSpacing: "-0.01em",
              }}
            >
              Assign Conversation
            </h3>
            <p
              style={{
                margin: "4px 0 0",
                fontSize: "0.82rem",
                color: "var(--lt-text-muted, #6b7280)",
              }}
            >
              Select a team member to transfer handling to
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "8px",
              color: "var(--lt-text-muted, #6b7280)",
              fontSize: "1.2rem",
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Search */}
        {!showCustomInput && (
          <div style={{ padding: "0.85rem 1.5rem", borderBottom: "1px solid var(--lt-border, #f3f4f6)" }}>
            <input
              type="text"
              placeholder="Search team by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1px solid var(--lt-border, #d1d5db)",
                background: "var(--lt-surface, #f9fafb)",
                fontSize: "0.875rem",
                color: "var(--lt-text-primary, #111827)",
                outline: "none",
              }}
            />
          </div>
        )}

        {/* Member List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0.75rem 1.5rem" }}>
          {showCustomInput ? (
            <div style={{ padding: "0.5rem 0" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  marginBottom: "8px",
                  color: "var(--lt-text-primary, #111827)",
                }}
              >
                Teammate Membership ID
              </label>
              <input
                type="text"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                placeholder="e.g. 5b18804b-19e6-40c0-a887-2f60d74c248e"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: "1px solid var(--lt-border, #d1d5db)",
                  background: "var(--lt-surface, #f9fafb)",
                  fontSize: "0.875rem",
                  color: "var(--lt-text-primary, #111827)",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setShowCustomInput(false)}
                style={{
                  marginTop: "10px",
                  background: "transparent",
                  border: "none",
                  color: "var(--lt-primary, #0396a6)",
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  padding: 0,
                  fontWeight: 600,
                }}
              >
                ← Back to team list
              </button>
            </div>
          ) : loading ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--lt-text-muted, #6b7280)" }}>
              Loading teammates…
            </div>
          ) : !filteredMembers.length ? (
            <div style={{ textAlign: "center", padding: "1.5rem", color: "var(--lt-text-muted, #6b7280)" }}>
              <p style={{ margin: 0, fontSize: "0.875rem" }}>No team members found.</p>
              <button
                type="button"
                onClick={() => setShowCustomInput(true)}
                style={{
                  marginTop: "8px",
                  background: "transparent",
                  border: "none",
                  color: "var(--lt-primary, #0396a6)",
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Enter Membership ID manually →
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {filteredMembers.map((m) => {
                const isSelected = selectedId === m.membership_id;
                const isCurrent = currentAssigneeId === m.membership_id;
                const initials = (m.display_name || m.email || "?").slice(0, 2).toUpperCase();

                return (
                  <div
                    key={m.membership_id}
                    onClick={() => setSelectedId(m.membership_id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 12px",
                      borderRadius: "12px",
                      border: isSelected
                        ? "1.5px solid var(--lt-primary, #0396a6)"
                        : "1px solid var(--lt-border, #f3f4f6)",
                      background: isSelected
                        ? "rgba(3, 150, 166, 0.08)"
                        : "var(--lt-card, #ffffff)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: isSelected
                          ? "var(--lt-primary, #0396a6)"
                          : "rgba(3, 150, 166, 0.12)",
                        color: isSelected ? "#ffffff" : "var(--lt-primary, #0396a6)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: "0.875rem",
                            color: "var(--lt-text-primary, #111827)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {m.display_name || m.email}
                        </span>
                        {isCurrent && (
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              background: "rgba(107, 114, 128, 0.12)",
                              color: "var(--lt-text-muted, #6b7280)",
                              padding: "2px 6px",
                              borderRadius: "999px",
                            }}
                          >
                            Current
                          </span>
                        )}
                        {m.is_owner && (
                          <span
                            style={{
                              fontSize: "10px",
                              fontWeight: 700,
                              background: "rgba(245, 158, 11, 0.12)",
                              color: "#d97706",
                              padding: "2px 6px",
                              borderRadius: "999px",
                            }}
                          >
                            Owner
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--lt-text-muted, #6b7280)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          marginTop: "2px",
                        }}
                      >
                        {m.email} {m.role_name ? `• ${m.role_name}` : ""}
                      </div>
                    </div>

                    {/* Radio circle */}
                    <div
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        border: isSelected
                          ? "5px solid var(--lt-primary, #0396a6)"
                          : "2px solid var(--lt-border, #d1d5db)",
                        background: "#ffffff",
                        flexShrink: 0,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "1rem 1.5rem",
            borderTop: "1px solid var(--lt-border, #e5e7eb)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "var(--lt-surface, #f9fafb)",
          }}
        >
          {!showCustomInput ? (
            <button
              type="button"
              onClick={() => setShowCustomInput(true)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--lt-text-muted, #6b7280)",
                fontSize: "0.78rem",
                cursor: "pointer",
                padding: 0,
              }}
            >
              Manual ID input
            </button>
          ) : (
            <div />
          )}

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={busy || (!showCustomInput && !selectedId) || (showCustomInput && !customId.trim())}
              loading={busy}
              onClick={handleSubmit}
            >
              Transfer
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
