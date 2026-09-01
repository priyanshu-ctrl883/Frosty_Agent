"use client";

import { Button } from "@/components/ui/Button";
import { formatActivityTime, formatTimelineLabel, relative } from "@/lib/format";
import type { AiRun, ConversationBridge, ConversationNote, TimelineEvent } from "@/lib/conversations";
import styles from "./inbox.module.css";

type Props = {
  selected: string | null;
  summary: string | null;
  summarizing: boolean;
  canReply: boolean;
  onSummarize: () => Promise<void>;
  conversationNotes: ConversationNote[];
  bridge: ConversationBridge | null;
  timelineEvents: TimelineEvent[];
  aiRuns: AiRun[];
};

export function InboxContextPanel({
  selected,
  summary,
  summarizing,
  canReply,
  onSummarize,
  conversationNotes,
  bridge,
  timelineEvents,
  aiRuns,
}: Props) {
  return (
    <aside className={styles.context}>
      {!selected ? (
        <p className={styles.emptyLead}>Select a conversation to see summary and notes.</p>
      ) : (
        <>
          <h3>Summary</h3>
          {summary ? (
            <p className={styles.summary}>{summary}</p>
          ) : (
            <p className={styles.emptyLead}>No summary yet.</p>
          )}
          {canReply ? (
            <Button
              type="button"
              variant="ghost"
              disabled={summarizing}
              loading={summarizing}
              onClick={() => void onSummarize()}
            >
              Summarize
            </Button>
          ) : null}

          <h3>Notes</h3>
          {!conversationNotes.length ? (
            <p className={styles.emptyLead}>No notes on this conversation.</p>
          ) : (
            <ul className={styles.timelineList}>
              {conversationNotes.map((n) => (
                <li key={n.id}>
                  <strong>{n.author_name || "Teammate"}</strong>
                  <span className={styles.meta}> · {relative(n.created_at)}</span>
                  {n.source === "handoff" ? (
                    <span className={styles.meta}> · handoff</span>
                  ) : null}
                  <p className={styles.snippet}>{n.note}</p>
                </li>
              ))}
            </ul>
          )}

          {bridge ? (
            <>
              <h3>Unified bridge</h3>
              <p className={styles.snippet}>
                Linked {bridge.linked_channel} thread{" "}
                <code>{bridge.linked_conversation_id.slice(0, 8)}…</code>
              </p>
            </>
          ) : null}

          <h3>Timeline</h3>
          {!timelineEvents.length ? (
            <p className={styles.emptyLead}>No timeline events yet.</p>
          ) : (
            <ul className={styles.timelineList}>
              {timelineEvents.slice(0, 12).map((evt) => (
                <li key={`${evt.kind}-${evt.ref}-${evt.at}`}>
                  <strong>{formatTimelineLabel(evt.kind, evt.label)}</strong>
                  <span className={styles.meta}> · {formatActivityTime(evt.at)}</span>
                  {evt.detail ? <p className={styles.snippet}>{evt.detail}</p> : null}
                </li>
              ))}
            </ul>
          )}

          <h3>AI runs</h3>
          {!aiRuns.length ? (
            <p className={styles.emptyLead}>No AI runs recorded.</p>
          ) : (
            <ul className={styles.timelineList}>
              {aiRuns.slice(0, 8).map((run) => (
                <li key={run.id}>
                  <strong>{run.model}</strong>
                  <span className={styles.meta}> · {formatActivityTime(run.created_at)}</span>
                  <p className={styles.snippet}>
                    {run.grounding_ok === false
                      ? `Blocked${run.deny_code ? `: ${run.deny_code}` : ""}`
                      : run.grounding_ok
                        ? "Grounded"
                        : "Run"}
                    {run.prompt_tokens != null ? ` · ${run.prompt_tokens} prompt tok` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </aside>
  );
}
