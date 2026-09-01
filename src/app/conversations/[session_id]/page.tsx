"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { apiRequest } from "@/lib/api";
import { MessageCircle, ArrowLeft, User, Bot, Clock } from "lucide-react";
import Link from "next/link";

/**
 * Conversation detail page — ported from Frosty SaaS `/dashboard/conversations/[session_id]`.
 * Shows a single conversation's full message history.
 * Connected to Agent's conversation API.
 */

type Message = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
};

type Conversation = {
  session_id: string;
  channel: string;
  status: string;
  lead_name?: string;
  messages: Message[];
  created_at: string;
};

export default function ConversationDetailPage() {
  const params = useParams();
  const sessionId = params?.session_id as string;
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversation = useCallback(async () => {
    if (!sessionId) return;
    try {
      setLoading(true);
      const data = await apiRequest<Conversation>(`/v1/conversations/${sessionId}`);
      setConversation(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversation");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchConversation();
  }, [fetchConversation]);

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleString();
    } catch {
      return ts;
    }
  };

  return (
    <AppShell title="Conversation" subtitle={sessionId ? `Session ${sessionId.slice(0, 8)}…` : ""}>
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Back link */}
        <Link
          href="/inbox"
          className="inline-flex items-center gap-2 text-sm font-medium transition-colors"
          style={{ color: 'var(--lt-text-muted)' }}
        >
          <ArrowLeft size={14} />
          Back to Inbox
        </Link>

        {loading ? (
          <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--lt-primary)', borderTopColor: 'transparent' }} />
              <p className="text-sm" style={{ color: 'var(--lt-text-muted)' }}>Loading conversation…</p>
            </div>
          </div>
        ) : error ? (
          <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
            <p className="text-sm" style={{ color: 'var(--lt-error)' }}>{error}</p>
          </div>
        ) : conversation ? (
          <>
            {/* Header */}
            <div className="glass-card" style={{ padding: '20px 24px' }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(3,150,166,0.1)' }}>
                    <MessageCircle size={18} style={{ color: 'var(--lt-primary)' }} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold" style={{ color: 'var(--lt-text-primary)' }}>
                      {conversation.lead_name || `Session ${sessionId.slice(0, 8)}`}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs" style={{ color: 'var(--lt-text-muted)' }}>{conversation.channel}</span>
                      <span className="text-xs" style={{ color: 'var(--lt-text-muted)' }}>•</span>
                      <span className="text-xs" style={{ color: 'var(--lt-text-muted)' }}>{formatTime(conversation.created_at)}</span>
                    </div>
                  </div>
                </div>
                <span
                  className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: conversation.status === 'open' ? 'rgba(3,150,166,0.1)' : 'rgba(139,132,123,0.1)',
                    color: conversation.status === 'open' ? 'var(--lt-primary)' : 'var(--lt-text-muted)',
                  }}
                >
                  {conversation.status}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-3">
              {conversation.messages.map((msg) => (
                <div
                  key={msg.id}
                  className="glass-card"
                  style={{
                    padding: '16px 20px',
                    borderLeft: msg.role === 'assistant' ? '3px solid var(--lt-primary)' : msg.role === 'user' ? '3px solid var(--lt-gold)' : '3px solid var(--lt-border)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {msg.role === 'assistant' ? (
                      <Bot size={14} style={{ color: 'var(--lt-primary)' }} />
                    ) : msg.role === 'user' ? (
                      <User size={14} style={{ color: 'var(--lt-gold)' }} />
                    ) : (
                      <Clock size={14} style={{ color: 'var(--lt-text-muted)' }} />
                    )}
                    <span className="text-xs font-semibold capitalize" style={{ color: 'var(--lt-text-secondary)' }}>
                      {msg.role}
                    </span>
                    <span className="text-xs ml-auto" style={{ color: 'var(--lt-text-muted)' }}>
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--lt-text-primary)' }}>
                    {msg.content}
                  </p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="glass-card" style={{ padding: 32, textAlign: 'center' }}>
            <MessageCircle size={48} style={{ color: 'var(--lt-text-muted)', opacity: 0.4, margin: '0 auto 12px' }} />
            <p className="text-sm" style={{ color: 'var(--lt-text-muted)' }}>No conversation found.</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
