"use client";

import React, { useState, useEffect, useRef } from "react";
import { Bot, ChevronLeft, ChevronDown, ChevronUp, Copy, Lock, MessageCircle, User as UserIcon } from "lucide-react";
import { formatActivityTime } from "@/lib/format";
import {
  formatInboxHeaderLabel,
  formatInboxSessionCode,
  getInboxInitials,
  isPhoneLikeLabel,
  shouldUseInboxUserIcon,
} from "./inboxDisplay";
import { InboxContactAvatar } from "./InboxContactAvatar";
import type { ActiveConversation, InboxMessage } from "@/lib/types";
import {
  getConversationSummary,
  getConversationBridge,
  getConversationTimeline,
  getConversationAttribution,
  summarizeConversation,
  type ConversationAttribution,
  type ConversationDetail,
  type TimelineEvent,
} from "@/lib/conversations";
import { AssigneeModal } from "./AssigneeModal";
import { InboxActivityTimeline } from "./InboxActivityTimeline";
import { AiHumanModeToggle } from "@/components/conversations/AiHumanModeToggle";
import { InboxWhatsAppTemplateModal } from "./InboxWhatsAppTemplateModal";
import styles from "./inbox.module.css";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/lib/toast";

type Props = {
  selected: string | null;
  selectedActive?: ActiveConversation;
  selectedDetail: ConversationDetail | null;
  headerLabel: string;
  headerContactLabel?: string | null;
  messages: InboxMessage[];
  messagesLoading: boolean;
  draft: string;
  setDraft: (s: string) => void;
  note: string;
  setNote: (s: string) => void;
  busy: boolean;
  canReply: boolean;
  canTransfer: boolean;
  mine: boolean;
  currentMembershipId: string;
  currentUserDisplayName: string;
  onClaim: (conversationId: string) => Promise<void>;
  onReply: (e: React.FormEvent) => Promise<void>;
  onAddNote: (e: React.FormEvent) => Promise<void>;
  onRateMessage: (messageId: string | number, rating: "thumbs_up" | "thumbs_down") => Promise<void>;
  onRelease: () => Promise<void>;
  onResolve: (disposition: "close") => Promise<void>;
  onTransfer: (toMembershipId: string) => Promise<void>;
  messageFeedback: Record<string, string>;
  messagesRef: React.RefObject<HTMLDivElement | null>;
  hasMoreMessages: boolean;
  loadingMore: boolean;
  onLoadMore: () => Promise<void>;
  onBack?: () => void;
  channelFilter?: "all" | "whatsapp" | "website";
  setChannelFilter?: (c: "all" | "whatsapp" | "website") => void;
  conversationsCount?: number;
  whatsappCount?: number;
  websiteCount?: number;
  waWindowExpired?: boolean;
  onTemplateSent?: () => void;
};

function getInitials(label: string | null): string {
  if (!label) return "V";
  return getInboxInitials(label);
}

const clipAttr = (value: string | null | undefined, max = 80): string => {
  const text = (value || "").trim();
  if (!text) return "—";
  return text.length > max ? `${text.slice(0, max)}…` : text;
};

const hasPageContext = (a: ConversationAttribution): boolean =>
  Boolean(
    a.utm_source ||
      a.utm_medium ||
      a.utm_campaign ||
      a.utm_content ||
      a.utm_term ||
      a.referrer ||
      a.landing_page,
  );

export function InboxThread({
  selected,
  selectedActive,
  selectedDetail,
  headerLabel,
  headerContactLabel,
  messages,
  messagesLoading,
  draft,
  setDraft,
  note,
  setNote,
  busy,
  canReply,
  canTransfer,
  mine,
  currentMembershipId,
  currentUserDisplayName,
  onClaim,
  onReply,
  onAddNote,
  onRateMessage,
  onRelease,
  onResolve,
  onTransfer,
  messageFeedback,
  messagesRef,
  hasMoreMessages,
  loadingMore,
  onLoadMore,
  onBack,
  waWindowExpired = false,
  onTemplateSent,
}: Props) {
  const { showToast } = useToast();
  const [composerTab, setComposerTab] = useState<"reply" | "note">("reply");
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [bridge, setBridge] = useState<{ user_phone?: string; linked_channel?: string } | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [attribution, setAttribution] = useState<ConversationAttribution | null | undefined>(undefined);
  const [attrExpanded, setAttrExpanded] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [localClaimed, setLocalClaimed] = useState<Record<string, boolean>>({});
  const [modeBusy, setModeBusy] = useState(false);

  const handleClaim = async () => {
    if (!selected) return;
    setLocalClaimed((prev) => ({ ...prev, [selected]: true }));
    try {
      await onClaim(selected);
    } catch {
      setLocalClaimed((prev) => ({ ...prev, [selected]: false }));
      throw new Error("claim_failed");
    }
  };

  const handleModeSelect = async (nextMode: "ai" | "human") => {
    if (!selected || modeBusy || busy) return;

    const apiMode = (selectedDetail?.mode || selectedActive?.mode || "ai") as "ai" | "human";
    const currentlyHuman = apiMode === "human" || Boolean(localClaimed[selected]);

    if (nextMode === "human" && !currentlyHuman) {
      if (channel === "whatsapp" && waWindowExpired) {
        showToast(
          "Send an approved template and wait for the customer to reply before you can claim this chat.",
          { type: "info" },
        );
        setTemplateModalOpen(true);
        return;
      }
      setModeBusy(true);
      try {
        await handleClaim();
      } catch {
        showToast("Could not switch to human mode.", { type: "error" });
      } finally {
        setModeBusy(false);
      }
      return;
    }

    if (nextMode === "ai" && currentlyHuman) {
      const claimedByMe = Boolean(
        mine ||
          Boolean(localClaimed[selected]) ||
          (currentMembershipId && selectedDetail?.assigned_agent?.membership_id === currentMembershipId) ||
          (currentMembershipId && selectedActive?.assigned_to_member_id === currentMembershipId)
      );
      if (!claimedByMe) {
        showToast("Only the assigned agent can return this conversation to AI.", { type: "error" });
        return;
      }
      setModeBusy(true);
      try {
        await onRelease();
        setLocalClaimed((prev) => ({ ...prev, [selected]: false }));
      } catch {
        showToast("Could not return conversation to AI.", { type: "error" });
      } finally {
        setModeBusy(false);
      }
    }
  };

  const fetchTimeline = async (convId: string) => {
    if (!convId) return;
    setTimelineLoading(true);
    try {
      const res = await getConversationTimeline(convId);
      setTimelineEvents(res?.events || []);
    } catch (err) {
      console.error("Failed to load conversation timeline", err);
    } finally {
      setTimelineLoading(false);
    }
  };

  useEffect(() => {
    setProfileDrawerOpen(false);
    setSummary(null);
    setBridge(null);
    setTimelineEvents([]);
    setTimelineOpen(false);
    setAttribution(undefined);
    setAttrExpanded(false);
    setCopiedKey(null);

    if (!selected) return;
    let active = true;

    getConversationSummary(selected)
      .then((res) => {
        if (active && res.summary) setSummary(res.summary);
      })
      .catch(() => {});

    getConversationBridge(selected)
      .then((res) => {
        if (active && res) setBridge(res as any);
      })
      .catch(() => {});

    getConversationAttribution(selected)
      .then((res) => {
        if (active) setAttribution(res);
      })
      .catch(() => {
        if (active) setAttribution(null);
      });

    return () => {
      active = false;
    };
  }, [selected]);

  useEffect(() => {
    if (!timelineOpen || !selected) return;
    void fetchTimeline(selected);
  }, [timelineOpen, selected]);

  const handleSummarize = async () => {
    if (!selected) return;
    setSummaryLoading(true);
    try {
      const res = await summarizeConversation(selected);
      setSummary(res.summary);
      showToast("Chat summary generated.", { type: "success" });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not summarize this chat.", { type: "error" });
    } finally {
      setSummaryLoading(false);
    }
  };

  if (!selected) {
    return (
      <div className={`${styles.thread} ${styles.threadMobileHidden}`}>
        <div className={styles.emptyThreadCenter}>
          <div className={styles.emptyThreadIconWrap}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <h3>Select a conversation</h3>
          <p>Choose a conversation from the left to view transcripts, inspect AI responses, or send a live reply.</p>
        </div>
      </div>
    );
  }

  const isLocallyClaimed = Boolean(selected && localClaimed[selected]);
  const apiMode = (selectedDetail?.mode || selectedActive?.mode || "ai") as "ai" | "human";
  const isHumanMode = apiMode === "human" || isLocallyClaimed;
  const toggleMode: "ai" | "human" = isHumanMode ? "human" : "ai";
  const channel = selectedDetail?.channel || selectedActive?.channel || "website";
  const contactLabel =
    headerContactLabel ??
    selectedDetail?.contact?.display_name ??
    selectedActive?.contact_label ??
    null;
  const sessionCode = selected ? formatInboxSessionCode(selected, channel) : "";
  const displayHeaderLabel = selected
    ? formatInboxHeaderLabel(
        contactLabel,
        selected,
        channel,
        bridge?.user_phone ?? (selectedDetail?.contact as { primary_phone?: string } | undefined)?.primary_phone,
      )
    : headerLabel;
  const assignedAgentName = (() => {
    const agent = selectedDetail?.assigned_agent;
    if (agent?.display_name) {
      const isYou = agent.membership_id === currentMembershipId;
      return isYou ? `${agent.display_name} (You)` : agent.display_name;
    }
    if (selectedActive?.assigned_to_member_id === currentMembershipId || isLocallyClaimed) {
      return `${currentUserDisplayName} (You)`;
    }
    if (selectedActive?.assigned_to_member_id) return "Team member";
    return null;
  })();
  const initials = getInitials(displayHeaderLabel);

  const contactPhone = (() => {
    const fromBridge = bridge?.user_phone?.trim();
    if (fromBridge) return fromBridge;
    const fromContact = selectedDetail?.contact?.primary_phone?.trim();
    if (fromContact) return fromContact;
    if (channel === "whatsapp" && isPhoneLikeLabel(contactLabel)) return contactLabel!.trim();
    return null;
  })();

  const handleGatedComposerClick = () => {
    if (assignedToOther) {
      showToast("Only the assigned agent can reply. Use Assign / Transfer in the profile panel.", {
        type: "info",
      });
      return;
    }
    if (channel === "whatsapp" && waWindowExpired) {
      showToast("Send a template first — you can claim once the customer replies.", {
        type: "info",
      });
      setTemplateModalOpen(true);
      return;
    }
    showToast("Switch to Human in the header to pause AI and reply yourself.", { type: "info" });
  };

  const copySessionId = async () => {
    if (!selected) return;
    try {
      await navigator.clipboard.writeText(selected);
      showToast("Session ID copied to clipboard.", { type: "success" });
    } catch {
      showToast("Could not copy session ID.", { type: "error" });
    }
  };

  const isClaimedByMe = Boolean(
    mine ||
    isLocallyClaimed ||
    (currentMembershipId && selectedDetail?.assigned_agent?.membership_id === currentMembershipId) ||
    (currentMembershipId && selectedActive?.assigned_to_member_id === currentMembershipId)
  );

  const assignedToOther = Boolean(
    isHumanMode &&
      selectedActive?.assigned_to_member_id &&
      selectedActive.assigned_to_member_id !== currentMembershipId &&
      selectedDetail?.assigned_agent?.membership_id !== currentMembershipId
  );

  const canToggleMode = Boolean(canReply && !assignedToOther);

  const gatedComposerCopy = assignedToOther
    ? {
        title: `Assigned to ${assignedAgentName || "another teammate"}`,
        hint: "Only the assigned agent can reply. Transfer the conversation or use the profile panel.",
      }
    : channel === "whatsapp" && waWindowExpired
    ? {
        title: "24h window expired — send a template first",
        hint: "Claim and free-form reply unlock after the customer responds to your template.",
      }
    : isHumanMode
    ? {
        title: "Human mode — take over to reply",
        hint: "Switch to Human in the header to claim this conversation and start typing.",
      }
    : {
        title: "AI is answering this conversation",
        hint: "Switch to Human in the header to pause AI and reply yourself.",
      };

  const showWaTemplateGate = Boolean(
    channel === "whatsapp" && waWindowExpired && canReply && !assignedToOther,
  );
  const canWriteReply = Boolean(
    canReply &&
    (isHumanMode || isClaimedByMe) &&
    !(channel === "whatsapp" && waWindowExpired),
  );

  const handleOpenTemplate = () => {
    if (!selected || assignedToOther) return;
    setTemplateModalOpen(true);
  };

  const waWindowBanner = showWaTemplateGate ? (
    <div className={styles.waWindowBanner}>
      <div className={styles.waWindowBannerText}>
        <span className={styles.waWindowBannerTitle}>
          The 24h WhatsApp service window has expired — a template send is required.
        </span>
        <span className={styles.waWindowBannerHint}>
          Send a template first. You can claim and reply freely once the customer responds.
        </span>
      </div>
      <button
        type="button"
        className={styles.waWindowSendBtn}
        onClick={() => void handleOpenTemplate()}
        disabled={busy || modeBusy}
      >
        <MessageCircle size={14} />
        Send Template
      </button>
    </div>
  ) : null;

  return (
    <div className={styles.thread}>
      {/* ── WhatsApp-Style Header ────────────────────────────────────────── */}
      <div className={styles.threadHead}>
        <div
          className={styles.threadHeadLeft}
          onClick={() => setProfileDrawerOpen(true)}
          title="View profile & details"
          style={{ cursor: "pointer" }}
        >
          {onBack && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onBack();
              }}
              className={styles.mobileBackBtn}
              title="Back to conversations"
              aria-label="Back to conversations list"
            >
              <ChevronLeft size={16} />
              <span>Back</span>
            </button>
          )}

          <div className={styles.avatarWrap}>
            <InboxContactAvatar contactLabel={contactLabel} channel={channel} compact />
          </div>

          {/* Contact name and session id row */}
          <div className={styles.threadHeadInfo}>
            <span className={styles.threadTitle}>{displayHeaderLabel}</span>
            <div className={styles.threadSessionRow}>
              <span className={styles.threadSessionCode}>{sessionCode}</span>
              <button
                type="button"
                className={styles.threadSessionCopyBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  void copySessionId();
                }}
                title="Copy full session ID"
                aria-label="Copy full session ID"
              >
                <Copy size={12} />
              </button>
              {attribution && attribution.attribution_status === "attributed" ? (
                <span
                  className={styles.attrPill}
                  title={clipAttr(attribution.campaign || attribution.source_id || "Attributed", 200)}
                >
                  · Source
                </span>
              ) : attribution && attribution.attribution_status === "unknown" ? (
                <span className={styles.attrPill} title="Unknown source — not labelled organic">
                  · Unknown
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Right header actions: AI/Human toggle + profile */}
        <div className={styles.threadHeadActions}>
          {canReply && (
            <AiHumanModeToggle
              mode={toggleMode}
              onSelect={(mode) => void handleModeSelect(mode)}
              disabled={!canToggleMode}
              loading={modeBusy || busy}
              className={styles.headerModeToggle}
            />
          )}

          <button
            type="button"
            className={styles.profileBtnHeaderIcon}
            onClick={() => setProfileDrawerOpen(true)}
            title="Contact profile & details"
            aria-label="Contact profile and details"
          >
            <UserIcon size={20} strokeWidth={2.25} color="#0396A6" />
          </button>
        </div>
      </div>

      {/* Summary Box if generated */}
      {summary && (
        <div className={styles.summaryBox}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <strong>AI Summary</strong>
            <button
              type="button"
              onClick={() => setSummary(null)}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#166534" }}
            >
              ✕
            </button>
          </div>
          <div>{summary}</div>
        </div>
      )}

      {/* ── WhatsApp-Style Messages Stream (Fills Screen) ──────────────── */}
      <div className={styles.messages} ref={messagesRef}>
        {messagesLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "16px" }}>
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: i % 2 === 0 ? "row-reverse" : "row",
                  gap: "8px",
                  alignItems: "flex-end",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "#e2e8f0",
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{
                    width: i % 2 === 0 ? "45%" : "60%",
                    height: "42px",
                    borderRadius: "14px",
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                  }}
                />
              </div>
            ))}
          </div>
        ) : !messages.length ? (
          <div className={styles.emptyMessages}>
            <span>No messages yet in this conversation</span>
          </div>
        ) : (
          messages.map((m, idx) => {
            const isUser = m.sender_type === "user" || m.sender_type === "contact";
            const isAgent = m.sender_type === "agent";
            const isAI = m.sender_type === "ai";
            const isOutgoing = isAgent || isAI;
            const isSystem = m.sender_type === "system";
            const isNote = m.sender_type === "note";

            const prevMsg = messages[idx - 1];
            const isSameGroup = prevMsg && prevMsg.sender_type === m.sender_type;

            if (isSystem) {
              return (
                <div key={m.id} className={styles.systemEvent}>
                  <span>{m.body}</span>
                  <span>{formatActivityTime(m.created_at)}</span>
                </div>
              );
            }

            if (isNote) {
              return (
                <div
                  key={m.id}
                  style={{
                    background: "#fffbeb",
                    padding: "10px 14px",
                    borderRadius: "12px",
                    margin: "6px 0",
                    border: "1px solid #fef3c7",
                    borderLeft: "4px solid #f59e0b",
                    fontSize: "0.82rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "3px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.7rem", textTransform: "uppercase", color: "#b45309" }}>
                      Internal Note · Private
                    </span>
                    <span style={{ color: "#9ca3af", fontSize: "0.68rem" }}>
                      {formatActivityTime(m.created_at)}
                    </span>
                  </div>
                  <div style={{ color: "#111827", lineHeight: 1.4 }}>{m.body}</div>
                  <div style={{ fontSize: "0.7rem", color: "#6b7280", marginTop: "2px" }}>
                    By {(m as any).author_name || "Team Member"}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={m.id}
                className={`${styles.messageRow} ${isOutgoing ? styles.messageRowRight : styles.messageRowLeft}`}
              >
                {!isOutgoing && !isSameGroup ? (
                  <div className={`${styles.msgAvatar} ${styles.msgAvatarUser}`}>
                    {shouldUseInboxUserIcon(contactLabel, channel) ? (
                      <UserIcon size={12} strokeWidth={2.5} color="#0A1A2F" />
                    ) : (
                      initials
                    )}
                  </div>
                ) : !isOutgoing ? (
                  <div className={styles.msgAvatarSpacer} />
                ) : null}

                <div className={`${styles.messageGroup} ${isOutgoing ? styles.messageGroupRight : ""}`}>
                  {!isSameGroup && (
                    <span className={`${styles.senderLabel} ${isOutgoing ? styles.senderRight : ""}`}>
                      {isAI ? "Frosty AI" : isAgent ? (m.author_name || "Agent") : displayHeaderLabel}
                    </span>
                  )}
                  <div className={`${styles.bubble} ${styles["sender_" + m.sender_type]}`}>
                    <p>{m.body}</p>
                  </div>
                  <span className={`${styles.msgTime} ${isOutgoing ? styles.msgTimeRight : ""}`}>
                    {formatActivityTime(m.created_at)}
                    {isOutgoing && <span style={{ color: "#0396a6", marginLeft: 3 }}>✓✓</span>}
                  </span>
                </div>

                {isOutgoing && !isSameGroup ? (
                  <div className={`${styles.msgAvatar} ${isAI ? styles.msgAvatarAi : styles.msgAvatarAgent}`}>
                    {isAI ? "AI" : (m.author_name ? m.author_name.slice(0, 1).toUpperCase() : "A")}
                  </div>
                ) : isOutgoing ? (
                  <div className={styles.msgAvatarSpacer} />
                ) : null}
              </div>
            );
          })
        )}

        {hasMoreMessages && (
          <div style={{ display: "flex", justifyContent: "center", margin: "12px 0" }}>
            <Button variant="ghost" onClick={() => void onLoadMore()} disabled={loadingMore}>
              {loadingMore ? "Loading…" : "Load older messages ↑"}
            </Button>
          </div>
        )}
      </div>

      {/* ── WhatsApp-Style Composer Footer or Claim Gate ───────────────── */}
      {!canReply ? (
        <div style={{ padding: "10px 14px", borderTop: "1px solid #f0f2f5", textAlign: "center", fontSize: "0.78rem", color: "#64748b" }}>
          <span>Read-only view. You do not have permission to reply.</span>
        </div>
      ) : !canWriteReply ? (
        <div className={styles.gatedFooter}>
          {waWindowBanner}
          <div
            className={styles.gatedComposerCard}
            onClick={handleGatedComposerClick}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleGatedComposerClick();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={gatedComposerCopy.hint}
          >
            <div className={styles.gatedComposerBanner}>
              <div className={styles.gatedComposerIconWrap} aria-hidden>
                {assignedToOther ? (
                  <Lock size={15} strokeWidth={2.25} />
                ) : (
                  <Bot size={15} strokeWidth={2.25} />
                )}
              </div>
              <div className={styles.gatedComposerBannerText}>
                <span className={styles.gatedComposerTitle}>{gatedComposerCopy.title}</span>
                <span className={styles.gatedComposerHint}>{gatedComposerCopy.hint}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Active Composer: Revealed once claimed */
        <div className={styles.threadFooter}>
          {waWindowBanner}

          {/* Tab Switcher: Reply vs Note */}
          <div className={styles.composerTabs}>
            <button
              type="button"
              className={composerTab === "reply" ? styles.composerTabActive : styles.composerTab}
              onClick={() => setComposerTab("reply")}
            >
              Reply to customer
            </button>
            <button
              type="button"
              className={composerTab === "note" ? styles.composerTabActive : styles.composerTab}
              onClick={() => setComposerTab("note")}
            >
              Internal Note
            </button>
          </div>

          {composerTab === "reply" ? (
            <div className={`${styles.composerCard}${showWaTemplateGate ? ` ${styles.composerCardWindowExpired}` : ""}`}>
              <form onSubmit={onReply}>
                <textarea
                  className={styles.composerTextarea}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={
                    showWaTemplateGate
                      ? "Free-form reply unavailable — send a template to re-open the window"
                      : "Type a message…"
                  }
                  disabled={busy || showWaTemplateGate}
                  rows={1}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                />
                <div className={styles.composerBottomBar}>
                  <div className={styles.composerActionsLeft}>
                    <span className={styles.composerStatusTag}>
                      Replying as human agent
                    </span>
                  </div>
                  <div className={styles.composerActionsRight}>
                    <span className={styles.composerHint}>Ctrl + Enter</span>
                    <button
                      type="submit"
                      disabled={busy || !draft.trim() || showWaTemplateGate}
                      className={styles.sendBtn}
                    >
                      <span>Send</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                      </svg>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          ) : (
            <div className={`${styles.composerCard} ${styles.composerNote}`}>
              <form onSubmit={onAddNote}>
                <textarea
                  className={`${styles.composerTextarea} ${styles.composerNote}`}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Write a private note for your team…"
                  disabled={busy}
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.currentTarget.form?.requestSubmit();
                    }
                  }}
                />
                <div className={styles.composerBottomBar} style={{ background: "#fef3c7" }}>
                  <div className={styles.composerActionsLeft}>
                    <span className={styles.composerStatusTag} style={{ color: "#92400e" }}>
                      Private internal note
                    </span>
                  </div>
                  <div className={styles.composerActionsRight}>
                    <span className={styles.composerHint}>Ctrl + Enter</span>
                    <button
                      type="submit"
                      disabled={busy || !note.trim()}
                      className={styles.sendBtn}
                      style={{ background: "#d97706" }}
                    >
                      <span>Save Note</span>
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {selected && (
        <InboxWhatsAppTemplateModal
          open={templateModalOpen}
          conversationId={selected}
          contactName={displayHeaderLabel}
          contactTopic={selectedDetail?.summary?.slice(0, 80) ?? undefined}
          onClose={() => setTemplateModalOpen(false)}
          onSuccess={() => {
            showToast("Template sent — wait for the customer to reply before claiming.", {
              type: "success",
            });
            onTemplateSent?.();
          }}
        />
      )}

      {/* ── Slide-Over Profile Info Drawer (WhatsApp-Style) ────────────── */}
      {profileDrawerOpen && (
        <div className={styles.profileDrawerOverlay} onClick={() => setProfileDrawerOpen(false)}>
          <div className={styles.profileDrawerContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.profileDrawerHeader}>
              <span className={styles.profileDrawerTitle}>Contact Info & Details</span>
              <button
                type="button"
                className={styles.profileDrawerClose}
                onClick={() => setProfileDrawerOpen(false)}
                aria-label="Close details"
              >
                ✕
              </button>
            </div>

            <div className={styles.profileDrawerBody}>
              {/* Profile Avatar Hero */}
              <div className={styles.profileAvatarHero}>
                <InboxContactAvatar contactLabel={contactLabel} channel={channel} />
                <div className={styles.profileHeroName}>{displayHeaderLabel}</div>
                {contactPhone && (
                  <div className={styles.profileHeroPhone}>{contactPhone}</div>
                )}
              </div>

              {/* Meta Info Card */}
              <div className={styles.profileMetaCard}>
                <div className={styles.profileMetaRow}>
                  <span className={styles.profileMetaLabel}>Channel:</span>
                  <span className={styles.profileMetaVal}>
                    {channel === "whatsapp" ? "WhatsApp" : "Website"}
                  </span>
                </div>
                {channel === "whatsapp" && contactPhone ? (
                  <div className={styles.profileMetaRow}>
                    <span className={styles.profileMetaLabel}>WhatsApp Number:</span>
                    <span className={styles.profileMetaVal}>{contactPhone}</span>
                  </div>
                ) : null}
                <div className={styles.profileMetaRow}>
                  <span className={styles.profileMetaLabel}>Status Mode:</span>
                  <span
                    className={styles.profileMetaVal}
                    style={{ color: isHumanMode ? "#047857" : "#0396a6" }}
                  >
                    {isHumanMode ? "● Human Handling" : "● AI Answering"}
                  </span>
                </div>
                <div className={styles.profileMetaRow}>
                  <span className={styles.profileMetaLabel}>Assigned Agent:</span>
                  <span className={styles.profileMetaVal}>{assignedAgentName || "Unassigned"}</span>
                </div>
                <div className={styles.profileMetaRow}>
                  <span className={styles.profileMetaLabel}>Session ID:</span>
                  <span className={`${styles.profileMetaVal} ${styles.profileMetaMono}`}>{sessionCode}</span>
                  <button
                    type="button"
                    className={styles.threadSessionCopyBtn}
                    onClick={() => void copySessionId()}
                    title="Copy full session ID"
                    aria-label="Copy full session ID"
                  >
                    <Copy size={12} />
                  </button>
                </div>
                <div className={styles.profileMetaRow}>
                  <span className={styles.profileMetaLabel}>Full ID:</span>
                  <span className={`${styles.profileMetaVal} ${styles.profileMetaMonoSm}`}>{selected}</span>
                </div>
              </div>

              {/* Campaign attribution (D265) — lazy GET, never blocks the transcript */}
              <div className={styles.profileMetaCard} style={{ marginTop: 4 }}>
                <div className={styles.profileMetaRow}>
                  <span className={styles.profileMetaLabel}>Attribution</span>
                  <span className={styles.profileMetaVal}>
                    {attribution === undefined
                      ? "…"
                      : attribution && attribution.attribution_status === "attributed"
                        ? "Attributed"
                        : "Unknown source"}
                  </span>
                </div>
                {attribution ? (
                  <>
                    <div className={styles.profileMetaRow}>
                      <span className={styles.profileMetaLabel}>Channel:</span>
                      <span className={styles.profileMetaVal}>
                        {attribution.channel === "whatsapp" ? "WhatsApp" : "Website"}
                      </span>
                    </div>
                    {attribution.attribution_status === "attributed" ? (
                      <div className={styles.profileMetaRow}>
                        <span className={styles.profileMetaLabel}>Campaign:</span>
                        <span
                          className={styles.profileMetaVal}
                          title={attribution.campaign || attribution.source_id || undefined}
                        >
                          {clipAttr(
                            attribution.campaign
                              || (attribution.source_id ? `Ad ID: ${attribution.source_id}` : null),
                            90,
                          )}
                        </span>
                      </div>
                    ) : null}
                    {attribution.source_id ? (
                      <div className={styles.profileMetaRow}>
                        <span className={styles.profileMetaLabel}>Ad ID:</span>
                        <button
                          type="button"
                          className={styles.attrCopyBtn}
                          title="Copy ad ID"
                          onClick={() => {
                            void navigator.clipboard.writeText(attribution.source_id || "");
                            setCopiedKey("source_id");
                            window.setTimeout(() => setCopiedKey(null), 1500);
                          }}
                        >
                          <code>{attribution.source_id.length > 18
                            ? `${attribution.source_id.slice(0, 10)}…${attribution.source_id.slice(-4)}`
                            : attribution.source_id}</code>
                          <span>{copiedKey === "source_id" ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    ) : null}
                    {attribution.click_id ? (
                      <div className={styles.profileMetaRow}>
                        <span className={styles.profileMetaLabel}>
                          {attribution.click_id_kind === "ctwa_clid"
                            ? "CTWA click"
                            : attribution.click_id_kind === "gclid"
                              ? "gclid"
                              : attribution.click_id_kind === "fbclid"
                                ? "fbclid"
                                : "Click ID"}
                          :
                        </span>
                        <button
                          type="button"
                          className={styles.attrCopyBtn}
                          title="Copy click ID"
                          onClick={() => {
                            void navigator.clipboard.writeText(attribution.click_id || "");
                            setCopiedKey("click_id");
                            window.setTimeout(() => setCopiedKey(null), 1500);
                          }}
                        >
                          <code>{attribution.click_id.length > 18
                            ? `${attribution.click_id.slice(0, 10)}…${attribution.click_id.slice(-4)}`
                            : attribution.click_id}</code>
                          <span>{copiedKey === "click_id" ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    ) : null}
                    {hasPageContext(attribution) ? (
                      <>
                        <button
                          type="button"
                          className={styles.attrMoreBtn}
                          onClick={() => setAttrExpanded((v) => !v)}
                        >
                          {attrExpanded ? "Hide details ▲" : "More details ▼"}
                        </button>
                        {attrExpanded ? (
                          <div className={styles.attrDetails}>
                            {attribution.utm_source ? (
                              <div className={styles.profileMetaRow}>
                                <span className={styles.profileMetaLabel}>utm_source</span>
                                <span className={styles.profileMetaVal} title={attribution.utm_source}>
                                  {clipAttr(attribution.utm_source)}
                                </span>
                              </div>
                            ) : null}
                            {attribution.utm_medium ? (
                              <div className={styles.profileMetaRow}>
                                <span className={styles.profileMetaLabel}>utm_medium</span>
                                <span className={styles.profileMetaVal} title={attribution.utm_medium}>
                                  {clipAttr(attribution.utm_medium)}
                                </span>
                              </div>
                            ) : null}
                            {attribution.utm_campaign ? (
                              <div className={styles.profileMetaRow}>
                                <span className={styles.profileMetaLabel}>utm_campaign</span>
                                <span className={styles.profileMetaVal} title={attribution.utm_campaign}>
                                  {clipAttr(attribution.utm_campaign)}
                                </span>
                              </div>
                            ) : null}
                            {attribution.landing_page ? (
                              <div className={styles.profileMetaRow}>
                                <span className={styles.profileMetaLabel}>Landing</span>
                                <span className={styles.profileMetaVal} title={attribution.landing_page}>
                                  {clipAttr(attribution.landing_page, 120)}
                                </span>
                              </div>
                            ) : null}
                            {attribution.referrer ? (
                              <div className={styles.profileMetaRow}>
                                <span className={styles.profileMetaLabel}>Referrer</span>
                                <span className={styles.profileMetaVal} title={attribution.referrer}>
                                  {clipAttr(attribution.referrer, 120)}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </>
                    ) : null}
                    {attribution.attribution_status !== "attributed" && !hasPageContext(attribution) ? (
                      <p className={styles.emptyLead} style={{ margin: 0, fontSize: "0.78rem" }}>
                        No campaign or UTM data — stored as unknown, not organic.
                      </p>
                    ) : null}
                  </>
                ) : attribution === null ? (
                  <p className={styles.emptyLead} style={{ margin: 0, fontSize: "0.78rem" }}>
                    No campaign or UTM data on this conversation.
                  </p>
                ) : null}
              </div>

              <div className={styles.profileSummarySection}>
                <button
                  type="button"
                  className={styles.profileActionBtn}
                  onClick={() => void handleSummarize()}
                  disabled={summaryLoading}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#03B8E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  <span>{summaryLoading ? "Summarizing chat…" : "Summarize Chat with AI"}</span>
                </button>
                {summary ? (
                  <div className={styles.profileSummaryBox}>
                    <div className={styles.profileSummaryHeader}>
                      <strong>AI Summary</strong>
                    </div>
                    <p>{summary}</p>
                  </div>
                ) : (
                  <p className={styles.profileSummaryHint}>
                    Generate a quick AI summary of this conversation.
                  </p>
                )}
              </div>

              <div className={styles.profileActionsGrid}>
                {canTransfer && (
                  <button
                    type="button"
                    className={styles.profileActionBtn}
                    onClick={() => {
                      setTransferModalOpen(true);
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#03B8E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>
                    <span>Assign / Transfer Conversation</span>
                  </button>
                )}

                {canReply && (
                  <button
                    type="button"
                    className={`${styles.profileActionBtn} ${styles.profileActionBtnDanger}`}
                    onClick={() => {
                      void onResolve("close");
                      setProfileDrawerOpen(false);
                    }}
                    disabled={busy}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                    <span>Close Conversation</span>
                  </button>
                )}
              </div>

              {/* Activity & History */}
              <div className={styles.profileTimelineSection}>
                <button
                  type="button"
                  onClick={() => setTimelineOpen(!timelineOpen)}
                  className={styles.profileTimelineToggle}
                >
                  <span className={styles.profileTimelineToggleLabel}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#03B8E1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    <span>Activity & History ({timelineEvents.length})</span>
                  </span>
                  <span className={styles.profileTimelineChevron}>
                    {timelineOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </button>

                {timelineOpen && (
                  <div className={styles.profileTimelineBody}>
                    <InboxActivityTimeline
                      events={timelineEvents}
                      loading={timelineLoading}
                      onRefresh={() => void fetchTimeline(selected)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {transferModalOpen && (
        <AssigneeModal
          currentAssigneeId={selectedActive?.assigned_to_member_id || null}
          onAssign={onTransfer}
          onClose={() => setTransferModalOpen(false)}
        />
      )}
    </div>
  );
}
