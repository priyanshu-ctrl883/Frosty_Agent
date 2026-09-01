"use client";

import { API_URL } from "./constants";
import { getToken } from "./session";
import { impersonationHeaders, isImpersonating } from "@/lib/impersonation";
import type { ApiEnvelope } from "./types";

/** Re-exported so callers can build absolute URLs (e.g. catalog CSV export links). */
export { API_URL };

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

async function handleUnauthorized(): Promise<void> {
  if (isImpersonating() || typeof window === "undefined") return;
  const { signOut } = await import("./session");
  await signOut();
  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = "/login";
  }
}

type RequestOpts = {
  method?: string;
  body?: unknown;
  /** Retries apply to TRANSPORT failures only — never to a response the server actually sent. */
  retries?: number;
  signal?: AbortSignal;
  /** Override the auto-resolved token (used by signup to pass the token obtained from signUp directly). */
  token?: string;
  /** Internal: keep the `{data, meta}` envelope instead of unwrapping. Use `apiPage`, not this. */
  _withMeta?: boolean;
  /** Internal: skip global 401 session teardown (login/signup flows). */
  _skipAuthRedirect?: boolean;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries: number,
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetch(url, init);
    } catch (err) {
      // Re-throw immediately on abort — don't retry an intentionally cancelled request.
      if (err instanceof Error && err.name === "AbortError") throw err;
      lastErr = err;
      if (attempt < retries) {
        await sleep(350 * (attempt + 1));
        continue;
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("network_error");
}

export async function apiRequest<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const method = (opts.method || "GET").toUpperCase();
  const idempotent = method === "GET" || method === "HEAD";
  const headers: Record<string, string> = { Accept: "application/json" };
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  if (isImpersonating()) {
    Object.assign(headers, impersonationHeaders());
  } else {
    const token = opts.token ?? await getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let res: Response;
  try {
    res = await fetchWithRetry(
      `${API_URL}${path}`,
      {
        method,
        headers,
        body:
          opts.body !== undefined
            ? typeof opts.body === "string"
              ? opts.body
              : JSON.stringify(opts.body)
            : undefined,
        signal: opts.signal,
      },

      opts.retries ?? (idempotent ? 2 : 0),
    );
  } catch (err) {
    // Broaden abort check: some runtimes throw a plain Error (not DOMException) on abort.
    if (err instanceof Error && err.name === "AbortError") throw err;
    throw new ApiClientError(
      "network_error",
      `Cannot reach the API at ${API_URL}.`,
      0,
    );
  }
  return parseApiResponse<T>(res, opts._withMeta, opts._skipAuthRedirect);
}

/** Multipart upload call for FormData (e.g. CSV upload). Automatically attaches Auth headers. */
export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = await getToken();
  if (isImpersonating()) {
    Object.assign(headers, impersonationHeaders());
  } else if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers,
      body: formData,
    });
  } catch (err) {
    throw new ApiClientError("network_error", `Cannot reach the API at ${API_URL}.`, 0);
  }
  return parseApiResponse<T>(res);
}

async function parseApiResponse<T>(
  res: Response,
  withMeta = false,
  skipAuthRedirect = false,
): Promise<T> {
  const raw = await res.text();
  let json: ApiEnvelope<T> | null = null;
  try {
    json = raw ? (JSON.parse(raw) as ApiEnvelope<T>) : null;
  } catch {
    throw new ApiClientError(
      "bad_response",
      raw.slice(0, 180).replace(/\s+/g, " ") || `Request failed (${res.status})`,
      res.status,
    );
  }

  if (json && json.error) {
    if (res.status === 401 && !skipAuthRedirect) {
      void handleUnauthorized();
    }
    let msg = json.error.message;
    if (
      (json.error.code === "validation_failed" || json.error.code === "validation_error") &&
      (json.error.details as any)?.errors
    ) {
      try {
        const fieldErrors = ((json.error.details as any).errors as any[])
          .map((e) => {
            const field = Array.isArray(e.loc) ? String(e.loc[e.loc.length - 1]) : "field";
            return `${field}: ${e.msg}`;
          })
          .join(", ");
        if (fieldErrors) msg += ` (${fieldErrors})`;
      } catch (e) {
        // Fallback to original message if details format is unexpected
      }
    }
    throw new ApiClientError(json.error.code, msg, res.status);
  }
  if (!res.ok) {
    if (res.status === 401 && !skipAuthRedirect) {
      void handleUnauthorized();
    }
    throw new ApiClientError("http_error", res.statusText || "Request failed", res.status);
  }
  // 204 No Content (and any empty successful body) — e.g. DELETE /v1/agents/{id}.
  // Parsing `.data` on null throws and makes a successful delete look like a failure.
  if (res.status === 204 || json == null) {
    return undefined as T;
  }
  if (withMeta) {
    const env = json as ApiEnvelope<T>;
    return { data: env.data, meta: env.meta ?? {} } as unknown as T;
  }
  return json.data as T;
}

export async function apiPage<T>(
  path: string,
  opts: RequestOpts = {},
): Promise<{ data: T; meta: { next_cursor?: string | null; prev_cursor?: string | null } }> {
  const envelope = await apiRequest<T>(path, { ...opts, _withMeta: true } as RequestOpts);
  return envelope as unknown as { data: T; meta: { next_cursor?: string | null } };
}

export function qs(params: Record<string, string | number | boolean | null | undefined>): string {
  const out = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined || v === "") continue;
    out.set(k, String(v));
  }
  const s = out.toString();
  return s ? `?${s}` : "";
}
