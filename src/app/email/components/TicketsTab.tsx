"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PageState } from "@/components/ui/PageState";
import { Pagination } from "@/components/ui/Pagination";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { Toast } from "@/components/ui/Toast";
import { type EmailMessage, intentLabel, intentTone } from "@/lib/emailAutomation";
import {
  type EmailTicket,
  type EmailTicketStatus,
  listTickets,
  ticketReasonLabel,
  ticketReasonTone,
  ticketStatusLabel,
  ticketStatusTone,
} from "@/lib/emailTickets";
import styles from "../email.module.css";
import { TicketDetailDrawer } from "./TicketDetailDrawer";

const STATUS_OPTIONS: { value: EmailTicketStatus | "all"; label: string }[] = [
  { value: "all", label: "All tickets" },
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
];

const formatWhen = (iso: string | null): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

type Props = {
  agentId: string;
  canManage: boolean;
  onGenerate: (id: string, prompt?: string) => Promise<EmailMessage>;
  onSend: (id: string, subject: string, body: string) => Promise<void>;
};

export const TicketsTab = ({ agentId, canManage, onGenerate, onSend }: Props) => {
  const [tickets, setTickets] = useState<EmailTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<EmailTicketStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listTickets(agentId);
      setTickets(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(
    () => (statusFilter === "all" ? tickets : tickets.filter((t) => t.status === statusFilter)),
    [tickets, statusFilter],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize],
  );

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  if (loading) {
    return <div className="p-10 text-center text-sm text-zinc-500">Loading tickets…</div>;
  }

  if (tickets.length === 0) {
    return (
      <PageState
        icon="inbox"
        title="No tickets yet"
        description="A ticket opens when the same sender emails again with an enquiry, sales inquiry, support request, or complaint — or when an auto-reply could not answer from your knowledge base. They will show up here."
      />
    );
  }

  return (
    <div className={styles.page} data-lenis-prevent>
      <Toast message={error} type="error" onClose={() => setError(null)} />

      <div className={styles.toolbar}>
        <Select
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as EmailTicketStatus | "all")}
          options={STATUS_OPTIONS}
          size="md"
          fullWidth={false}
          className={styles.filterSelect}
          id="ticket-status-filter"
        />
      </div>

      <div className={styles.metaRow}>
        <span>
          {filtered.length} ticket{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      <div className={styles.tableCard}>
        {filtered.length === 0 ? (
          <div className={styles.emptyFilter}>No tickets match this filter.</div>
        ) : (
          <>
            <div className={styles.listScroll} data-lenis-prevent>
              <div className={styles.desktopTable}>
                <Table className={styles.fixedTable}>
                  <TableHeader>
                    <tr>
                      <TableHead className={styles.colReply}>Ticket</TableHead>
                      <TableHead className={styles.colFrom}>From</TableHead>
                      <TableHead className={styles.colSubject}>Subject</TableHead>
                      <TableHead className={styles.colIntent}>Intent</TableHead>
                      <TableHead className={`${styles.colStatus} ${styles.hideTablet}`}>Reason</TableHead>
                      <TableHead className={styles.colReply}>Emails</TableHead>
                      <TableHead className={styles.colReply}>Status</TableHead>
                      <TableHead className={styles.colDate}>Last activity</TableHead>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {pageRows.map((t) => (
                      <TableRow
                        key={t.id}
                        onClick={() => setSelectedId(t.id)}
                        className={t.id === selectedId ? styles.rowActive : ""}
                      >
                        <TableCell className={styles.tightCell}>
                          <span className={styles.fromName}>{t.ticket_number}</span>
                        </TableCell>
                        <TableCell className={styles.tightCell}>
                          <span className={styles.fromName}>
                            {t.sender_name || t.sender_email || "Unknown sender"}
                          </span>
                          {t.sender_name && t.sender_email ? (
                            <span className={styles.fromEmail}>{t.sender_email}</span>
                          ) : null}
                        </TableCell>
                        <TableCell className={styles.tightCell}>
                          <span className={styles.subjectCell}>{t.subject || "(no subject)"}</span>
                        </TableCell>
                        <TableCell className={styles.tightCell}>
                          <StatusBadge label={intentLabel(t.intent)} tone={intentTone(t.intent)} dot={false} />
                        </TableCell>
                        <TableCell className={`${styles.tightCell} ${styles.hideTablet}`}>
                          <StatusBadge
                            label={ticketReasonLabel(t.reason)}
                            tone={ticketReasonTone(t.reason)}
                            dot={false}
                          />
                        </TableCell>
                        <TableCell className={styles.tightCell}>{t.message_count}</TableCell>
                        <TableCell className={styles.tightCell}>
                          <StatusBadge
                            label={ticketStatusLabel(t.status)}
                            tone={ticketStatusTone(t.status)}
                            dot={false}
                          />
                        </TableCell>
                        <TableCell className={`${styles.tightCell} ${styles.colDate}`}>
                          <span className={styles.dateCell}>{formatWhen(t.last_email_at)}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className={styles.mobileList}>
                {pageRows.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`${styles.mobileCard} ${t.id === selectedId ? styles.rowActive : ""}`}
                    onClick={() => setSelectedId(t.id)}
                  >
                    <div className={styles.mobileCardTop}>
                      <div className="min-w-0">
                        <span className={styles.fromName}>
                          {t.ticket_number}
                          {t.sender_name || t.sender_email
                            ? ` · ${t.sender_name || t.sender_email}`
                            : ""}
                        </span>
                        {t.sender_email ? <span className={styles.fromEmail}>{t.sender_email}</span> : null}
                      </div>
                      <span className={styles.dateCell}>{formatWhen(t.last_email_at)}</span>
                    </div>
                    <p className={styles.mobileSubject}>{t.subject || "(no subject)"}</p>
                    <div className={styles.mobileBadges}>
                      <StatusBadge label={intentLabel(t.intent)} tone={intentTone(t.intent)} dot={false} />
                      <StatusBadge
                        label={ticketReasonLabel(t.reason)}
                        tone={ticketReasonTone(t.reason)}
                        dot={false}
                      />
                      <StatusBadge
                        label={ticketStatusLabel(t.status)}
                        tone={ticketStatusTone(t.status)}
                        dot={false}
                      />
                      <span className="text-xs text-zinc-400">
                        {t.message_count} email{t.message_count === 1 ? "" : "s"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.paginationBar}>
              <Pagination
                currentPage={safePage}
                pageSize={pageSize}
                totalItems={filtered.length}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[10, 20]}
                itemLabel="tickets"
              />
            </div>
          </>
        )}
      </div>

      <TicketDetailDrawer
        open={!!selectedId}
        agentId={agentId}
        ticketId={selectedId}
        canManage={canManage}
        onClose={() => setSelectedId(null)}
        onGenerate={onGenerate}
        onSend={onSend}
        onClosed={() => void load()}
      />
    </div>
  );
};
