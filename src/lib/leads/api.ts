import { API_URL, apiRequest, apiPage, qs } from "@/lib/api";
import { getToken } from "@/lib/session";
import { impersonationHeader } from "@/lib/impersonation";
import type {
  Lead,
  LeadCustomField,
  LeadDetail,
  LeadScoringEvent,
  LeadStats,
  TablePreferences,
} from "@/lib/types";

export type LeadListParams = {
  status?: string;
  temperature?: string;
  verification_grade?: string;
  q?: string;
  limit?: number;
  cursor?: string | null;
};

export async function fetchLeads(params: LeadListParams = {}) {
  const path = `/v1/leads${qs({
    status: params.status,
    temperature: params.temperature,
    verification_grade: params.verification_grade,
    q: params.q,
    limit: params.limit ?? 100,
    cursor: params.cursor,
  })}`;
  return apiPage<Lead[]>(path);
}

export async function fetchLeadStats() {
  return apiRequest<LeadStats>("/v1/leads/stats");
}

export async function fetchLead(id: number, historyLimit = 20) {
  return apiRequest<LeadDetail>(`/v1/leads/${id}?history_limit=${historyLimit}`);
}

export async function fetchLeadScoreHistory(id: number, limit = 50) {
  return apiRequest<LeadScoringEvent[]>(`/v1/leads/${id}/score-history?limit=${limit}`);
}

export async function fetchLeadByConversation(conversationId: string) {
  return apiRequest<Lead>(`/v1/leads/by-conversation/${conversationId}`);
}

export async function fetchCustomFields() {
  return apiRequest<LeadCustomField[]>("/v1/leads/custom-fields");
}

export async function createCustomField(body: {
  field_key: string;
  label: string;
  field_type: string;
  options?: string[];
}) {
  return apiRequest<LeadCustomField>("/v1/leads/custom-fields", { method: "POST", body });
}

export async function deleteCustomField(id: string) {
  return apiRequest<LeadCustomField>(`/v1/leads/custom-fields/${id}`, { method: "DELETE" });
}

export async function fetchTablePreferences() {
  return apiRequest<TablePreferences>("/v1/leads/table-preferences");
}

export async function saveTablePreferences(body: TablePreferences) {
  return apiRequest<TablePreferences>("/v1/leads/table-preferences", {
    method: "PUT",
    body,
  });
}

export async function patchLead(id: number, body: Record<string, unknown>) {
  return apiRequest<Lead>(`/v1/leads/${id}`, { method: "PATCH", body });
}

export async function createLead(body: Record<string, unknown>) {
  return apiRequest<Lead>("/v1/leads", { method: "POST", body });
}

export async function bulkLeads(body: {
  ids: number[];
  action: "status" | "temperature" | "delete" | "follow_up";
  value?: string;
}) {
  return apiRequest<{ updated: number; skipped: number; errors: string[] }>(
    "/v1/leads/bulk",
    { method: "POST", body },
  );
}

export async function fetchFollowUpSettings() {
  return apiRequest<import("@/lib/types").FollowUpSettings>("/v1/leads/follow-up-settings");
}

export async function saveFollowUpSettings(body: Partial<import("@/lib/types").FollowUpSettings>) {
  return apiRequest<import("@/lib/types").FollowUpSettings>("/v1/leads/follow-up-settings", {
    method: "PUT",
    body,
  });
}

export async function sendLeadFollowUp(id: number, body?: { channels?: string[]; subject?: string; body?: string }) {
  return apiRequest<{ lead_id: number; queued: string[]; skipped: string[] }>(
    `/v1/leads/${id}/follow-up`,
    { method: "POST", body: body ?? {} },
  );
}

export async function generateLeadDraft(id: number, tone: string, instruction?: string) {
  return apiRequest<{ subject: string; body: string }>(
    `/v1/leads/${id}/draft-outreach`,
    { method: "POST", body: { tone, instruction } },
  );
}

export async function listLeadFollowUps(id: number) {
  return apiRequest<import("@/lib/types").FollowUpDelivery[]>(`/v1/leads/${id}/follow-ups`);
}

export async function listWaTemplates() {
  try {
    return await apiRequest<import("@/lib/types").WaTemplate[]>("/v1/wa/templates");
  } catch {
    return [];
  }
}

export async function overrideLeadScore(
  id: number,
  body: { score?: number; temperature?: string; reason: string; note?: string },
) {
  return apiRequest<LeadDetail>(`/v1/leads/${id}/score`, { method: "POST", body });
}

export async function exportLeadsCsv(body: {
  columns: { key: string; label: string }[];
  filters: Record<string, unknown>;
}) {
  const token = await getToken();
  const headers: Record<string, string> = {
    Accept: "text/csv",
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  Object.assign(headers, impersonationHeader());

  const res = await fetch(`${API_URL}/v1/leads/export`, {
    method: "POST",
    headers,
    body: JSON.stringify({ ...body, format: "csv" }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Export failed");
  }
  return res.blob();
}
