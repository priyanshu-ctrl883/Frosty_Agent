"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { apiRequest } from "@/lib/api";
import { getToken } from "@/lib/session";
import type { InviteAccepted, InvitePreview } from "@/lib/types";
import { LegalFooter } from "@/components/legal/LegalFooter";
import styles from "../auth.module.css";

/**
 * Accept an invitation to join a workspace.
 *
 * ⚠️ THEIR VERSION TAKES A NAME AND A PASSWORD HERE AND CREATES THE ACCOUNT INLINE. Ours cannot, and
 * the refusal is the server's rather than this screen's choice: `POST /v1/public/invites/accept` is
 * `require_principal` — an AUTHENTICATED caller — and it resolves the invitee's internal `users.id`
 * from their verified Supabase auth uid before it will touch the invite. Its own error says so
 * ("Finish creating your account before accepting this invitation"), and the reason is D54's
 * finding: the membership binds to the identity that actually authenticated, not to the email the
 * invite carried, which is what stops a forwarded invite landing in the wrong account.
 *
 * So this is a THREE-state flow rather than a form:
 *   1. preview the invite — unauthenticated, the token IS the credential;
 *   2. not signed in → send them to sign in or sign up, carrying the invite back in `?next=`;
 *   3. signed in → one POST, then into the workspace.
 *
 * ⚠️ THE TOKEN IS SINGLE-USE and the accept call burns it, so the button is disabled while the
 * request is in flight. D54 fixed the server-side half: the identity is resolved BEFORE the invite
 * is claimed, so an unresolvable caller can no longer consume a good token.
 */
function InviteFlow() {
  const params = useSearchParams();
  const token = params.get("token")?.trim() || "";

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (token === "mock") return; // Handled by the other effect

    void getToken().then((t) => {
      if (!cancelled) setSignedIn(Boolean(t));
    });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError("This link has no invite token. Ask an owner for a fresh one.");
      return;
    }

    // --- MOCKS FOR UI PREVIEW ---
    if (token === "mock") {
      setPreview({
        company_name: "The Artisan Bakery Co.",
        invited_email: "hello@artisanbakery.com",
        expires_at: new Date(Date.now() + 86400000).toISOString()
      });
      setSignedIn(false);
      setLoading(false);
      return;
    }
    if (token === "expired") {
      setError("This invitation link has expired or is no longer valid.");
      setLoading(false);
      return;
    }
    // ----------------------------

    let cancelled = false;
    apiRequest<InvitePreview>(`/v1/public/invites/${encodeURIComponent(token)}`)
      .then((data) => {
        if (!cancelled) {
          setPreview(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          // Expired, revoked, already used and never-existed are ONE answer from the server, on
          // purpose — distinguishing them would tell a stranger that a given invite existed, and
          // for which company. So this copy must not guess which it was either.
          setError(
            err instanceof Error && err.message
              ? err.message
              : "This invite is not valid any more.",
          );
          setPreview(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function accept() {
    setBusy(true);
    setError(null);
    try {
      if (token === "mock") {
        await new Promise((resolve) => setTimeout(resolve, 800)); // simulate network delay
        window.location.assign("/home");
        return;
      }

      await apiRequest<InviteAccepted>("/v1/public/invites/accept", {
        method: "POST",
        body: { token },
      });
      // A full assign: the membership this just created is what `resolve_membership` reads during
      // authentication, so the NEXT request is the first one that can see the workspace.
      window.location.assign("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not accept this invite");
      setBusy(false);
    }
  }

  const back = `/invite?token=${encodeURIComponent(token)}`;

  return (
    <div className={styles.wrap}>
      <div style={{ position: "absolute", top: "1.5rem", left: "2rem" }}>
        <h1 style={{ color: "var(--primary)", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "1.5rem" }}>Frosty</h1>
      </div>

      <section className={`${styles.panel} rise`}>
        {error && !preview && !loading ? (
          <div className={styles.brand} style={{ gap: "1rem" }}>
            <div className={styles.brandIcon} style={{ background: "var(--error-container)", color: "var(--error)", borderRadius: "50%", width: "56px", height: "56px", marginBottom: "0.5rem" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>history</span>
            </div>
            <h1 style={{ fontSize: "24px" }}>Invite Expired</h1>
            <p style={{ fontSize: "14px", lineHeight: "1.5", color: "var(--on-surface-variant)" }}>
              This invitation link has expired or is no longer valid.
              <br />
              Please contact the merchant administrator for a new link.
            </p>
          </div>
        ) : (
          <div className={`${styles.brand} ${styles.brandCompact}`} style={{ gap: "1rem" }}>
            <div className={styles.brandIcon} style={{ background: "var(--primary-container)", color: "var(--primary)", borderRadius: "50%", width: "56px", height: "56px", marginBottom: "0.5rem" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>storefront</span>
            </div>
            <h1 style={{ fontSize: "24px" }}>You've been invited</h1>
            <p style={{ fontSize: "14px", lineHeight: "1.5", color: "var(--on-surface-variant)" }}>
              {preview ? (
                <>Someone has invited you to join <strong>{preview.company_name}</strong> on Frosty.</>
              ) : (
                "Join a Frosty workspace"
              )}
            </p>
          </div>
        )}

        {loading ? <p className={styles.foot}>Checking invite…</p> : null}

        {error && !preview && !loading ? (
          <div className={styles.form}>
            <Link href="/login" style={{ display: "block" }}>
              <Button variant="ghost" style={{ width: "100%" }}>Return to Login</Button>
            </Link>
          </div>
        ) : null}

        {preview ? (
          <div className={styles.form}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              padding: "1rem",
              background: "color-mix(in srgb, var(--primary) 4%, var(--surface-container-lowest))",
              borderRadius: "var(--radius-lg, 12px)",
              border: "1px solid color-mix(in srgb, var(--primary) 15%, transparent)",
            }}>
              <div style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "var(--warm-soft)",
                color: "var(--ink)",
                display: "grid",
                placeItems: "center",
                fontWeight: 600,
                fontSize: "14px",
                flexShrink: 0
              }}>
                {preview.company_name.substring(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", textAlign: "left" }}>
                <strong style={{ fontSize: "14px", color: "var(--on-surface)" }}>{preview.company_name}</strong>
                <span style={{ fontSize: "12px", color: "var(--on-surface-variant)" }}>Merchant Account</span>
              </div>
              <span className="material-symbols-outlined" style={{ color: "var(--primary)", fontSize: "20px" }}>
                check_circle
              </span>
            </div>

            {error ? <p className={styles.error}>{error}</p> : null}

            {signedIn === null ? (
              <p className={styles.foot}>Checking your session…</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "0.5rem" }}>
                {signedIn ? (
                  error === "You are already a member of this team." ? (
                    <Link href="/home" style={{ display: "block" }}>
                      <Button type="button" style={{ width: "100%" }}>
                        Open Dashboard
                        <span className="material-symbols-outlined" style={{ marginLeft: "4px" }}>arrow_forward</span>
                      </Button>
                    </Link>
                  ) : (
                    <Button type="button" loading={busy} disabled={busy || error === "You are already a member of this team."} onClick={() => void accept()}>
                      Join Merchant
                      <span className="material-symbols-outlined" style={{ marginLeft: "4px" }}>arrow_forward</span>
                    </Button>
                  )
                ) : (
                  <Link href={`/join?token=${encodeURIComponent(token)}`} style={{ display: "block" }}>
                    <Button type="button" style={{ width: "100%" }}>
                      Join Merchant
                      <span className="material-symbols-outlined" style={{ marginLeft: "4px" }}>arrow_forward</span>
                    </Button>
                  </Link>
                )}
                
                <Link href="/login" style={{ display: "block" }}>
                  <Button variant="ghost" type="button" disabled={busy} style={{ width: "100%" }}>
                    Decline
                  </Button>
                </Link>
                <p className={styles.foot} style={{ fontSize: "12px", borderTop: "none", paddingTop: "0.5rem" }}>
                  By joining, you agree to Frosty&apos;s{" "}
                  <Link href="/terms">Terms</Link> and{" "}
                  <Link href="/privacy">Privacy Policy</Link>.
                </p>
                <LegalFooter showCopyright />
              </div>
            )}
          </div>
        ) : null}
      </section>
    </div>
  );
}

export default function InvitePage() {
  return (
    <Suspense fallback={<div className={styles.wrap}>Loading invite…</div>}>
      <InviteFlow />
    </Suspense>
  );
}
