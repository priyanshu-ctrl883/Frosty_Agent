"use client";

import Link from "next/link";
import { Suspense, useEffect, useState, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { SUPABASE_CONFIGURED } from "@/lib/constants";
import { signUp } from "@/lib/session";
import type { InvitePreview } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { LegalFooter } from "@/components/legal/LegalFooter";
import styles from "../auth.module.css";

function JoinForm() {
  const params = useSearchParams();
  const token = params.get("token")?.trim() || "";
  
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(Boolean(token));
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [confirmEmailMode, setConfirmEmailMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [acceptedLegal, setAcceptedLegal] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoadingPreview(false);
      setPreviewError("This link has no invite token. Ask an owner for a fresh one.");
      return;
    }

    // --- MOCKS FOR UI PREVIEW ---
    if (token === "mock") {
      setPreview({
        company_name: "The Artisan Bakery Co.",
        invited_email: "hello@artisanbakery.com",
        expires_at: new Date(Date.now() + 86400000).toISOString()
      });
      setLoadingPreview(false);
      return;
    }
    if (token === "expired") {
      setPreviewError("This invitation link has expired or is no longer valid.");
      setLoadingPreview(false);
      return;
    }
    // ----------------------------

    let cancelled = false;
    apiRequest<InvitePreview>(`/v1/public/invites/${encodeURIComponent(token)}`)
      .then((data) => {
        if (!cancelled) {
          setPreview(data);
          setPreviewError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setPreviewError(
            err instanceof Error && err.message
              ? err.message
              : "This invite is not valid any more."
          );
          setPreview(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingPreview(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  function getPasswordStrength(p: string) {
    if (!p) return null;
    let score = 0;
    if (p.length >= 8) score++;
    if (p.length >= 12) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^a-zA-Z0-9]/.test(p)) score++;
    
    if (score < 2) return { text: "Weak", color: "var(--error)" };
    if (score < 4) return { text: "Good", color: "var(--warning)" };
    return { text: "Strong", color: "var(--success)" };
  }
  const strength = getPasswordStrength(password);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!preview) return;

    if (email.trim().toLowerCase() !== preview.invited_email.trim().toLowerCase()) {
      setError("Please use the email address that the invite was sent to.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!acceptedLegal) {
      setError("Accept the Privacy notice and Terms to create an account.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (token === "mock") {
        await new Promise((resolve) => setTimeout(resolve, 800));
        window.location.assign("/home");
        return;
      }

      const { session } = await signUp(email, password);
      if (!session) {
        setConfirmEmailMode(true);
        setLoading(false);
        return;
      }
      
      // Successfully signed in; redirect back to invite flow to accept
      window.location.assign(`/invite?token=${encodeURIComponent(token)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create your account");
      setLoading(false);
    }
  }

  if (loadingPreview) {
    return (
      <div className={styles.wrap}>
        <div className={styles.foot}>Loading invite details…</div>
      </div>
    );
  }

  if (previewError || !preview) {
    return (
      <div className={styles.wrap}>
        <section className={`${styles.panel} rise`}>
          <div className={styles.brand} style={{ gap: "1rem" }}>
            <div className={styles.brandIcon} style={{ background: "var(--error-container)", color: "var(--error)", borderRadius: "50%", width: "56px", height: "56px", marginBottom: "0.5rem" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "28px" }}>history</span>
            </div>
            <h1 style={{ fontSize: "24px" }}>Invite Unavailable</h1>
            <p style={{ fontSize: "14px", lineHeight: "1.5", color: "var(--on-surface-variant)" }}>
              {previewError}
            </p>
          </div>
          <div className={styles.form}>
            <Link href="/login" style={{ display: "block" }}>
              <Button variant="ghost" style={{ width: "100%" }}>Return to Login</Button>
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <section className={`${styles.panel} ${styles.signupPanel} rise`}>
        <div className={`${styles.brand} ${styles.brandCompact}`}>
          <h1>Join {preview.company_name}</h1>
          <p>Create your account to accept the invite</p>
        </div>
        <form className={styles.form} onSubmit={onSubmit}>
          <Field
            label="Email Address"
            name="email"
            type="email"
            value={email}
            onChange={setEmail}
            placeholder={preview.invited_email}
            autoComplete="email"
            startIcon="mail"
            required
            disabled={confirmEmailMode}
          />
          <Field
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            autoComplete="new-password"
            startIcon="lock"
            required
            disabled={confirmEmailMode}
            labelAction={
              strength ? (
                <span style={{ fontSize: "12px", color: strength.color, fontWeight: 500 }}>
                  {strength.text}
                </span>
              ) : null
            }
            endAction={
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--on-surface-variant)"
                }}
              >
                <span 
                  className="material-symbols-outlined"
                  style={{
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform: showPassword ? "rotate(180deg) scale(1.1)" : "rotate(0deg) scale(1)",
                    opacity: showPassword ? 1 : 0.7
                  }}
                >
                  {showPassword ? "visibility" : "visibility_off"}
                </span>
              </button>
            }
          />
          <Field
            label="Confirm Password"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="••••••••"
            autoComplete="new-password"
            startIcon="lock"
            required
            disabled={confirmEmailMode}
            labelAction={
              confirmPassword.length > 0 ? (
                password === confirmPassword ? (
                  <span style={{ fontSize: "12px", color: "var(--success)", fontWeight: 500, display: "flex", alignItems: "center", gap: "2px" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>check_circle</span>
                    Match
                  </span>
                ) : (
                  <span style={{ fontSize: "12px", color: "var(--error)", fontWeight: 500 }}>
                    No match
                  </span>
                )
              ) : null
            }
            endAction={
              <button
                type="button"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                onClick={() => setShowConfirmPassword((v) => !v)}
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--on-surface-variant)"
                }}
              >
                <span 
                  className="material-symbols-outlined"
                  style={{
                    transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                    transform: showConfirmPassword ? "rotate(180deg) scale(1.1)" : "rotate(0deg) scale(1)",
                    opacity: showConfirmPassword ? 1 : 0.7
                  }}
                >
                  {showConfirmPassword ? "visibility" : "visibility_off"}
                </span>
              </button>
            }
          />

          {!SUPABASE_CONFIGURED ? (
            <p className={styles.error}>
              Sign-up is not configured for this build. Set NEXT_PUBLIC_SUPABASE_URL and
              NEXT_PUBLIC_SUPABASE_ANON_KEY.
            </p>
          ) : null}

          {confirmEmailMode ? (
            <aside className={styles.callout}>
              <span className="material-symbols-outlined" aria-hidden>
                mark_email_read
              </span>
              <div>
                <strong>Confirm your email first</strong>
                <p>
                  We have sent {email} a confirmation link. Open it to verify your address, then you can sign in and accept this invite.
                </p>
              </div>
            </aside>
          ) : null}
          
          {error ? <p className={styles.error}>{error}</p> : null}

          <label style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", fontSize: 12, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={acceptedLegal}
              onChange={(e) => setAcceptedLegal(e.target.checked)}
            />
            <span>
              I agree to the{" "}
              <Link href="/terms">Terms</Link> and{" "}
              <Link href="/privacy">Privacy Policy</Link>.
            </span>
          </label>
          
          {!confirmEmailMode && (
            <Button type="submit" loading={loading} disabled={!SUPABASE_CONFIGURED || !acceptedLegal}>
              Create Account
              <span className="material-symbols-outlined">arrow_forward</span>
            </Button>
          )}
        </form>
        <p className={styles.foot}>
          Already have an account?
          <Link href={`/login?next=${encodeURIComponent(`/invite?token=${token}`)}`}>Log in</Link>
        </p>
        <LegalFooter showCopyright />
      </section>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<div className={styles.wrap}>Loading…</div>}>
      <JoinForm />
    </Suspense>
  );
}
