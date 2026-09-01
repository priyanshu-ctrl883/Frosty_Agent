"use client";

import { useEffect } from "react";
import { safeNextPath } from "@/lib/authPaths";
import { SUPABASE_CONFIGURED } from "@/lib/constants";
import { waitForSession } from "@/lib/session";
import styles from "../../auth.module.css";

/**
 * Google (and email-confirm) return here with `?code=`. PKCE is exchanged by the
 * browser client (`detectSessionInUrl`), not a Node route handler — the server
 * route 500'd on the testing standalone image (nginx then surfaced 502).
 *
 * Recovery links stay on `/reset-password`.
 */
export default function AuthCallbackPage() {
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) {
      window.location.replace("/login");
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const next = safeNextPath(params.get("next"), "/signup/google");
    void waitForSession(12000)
      .then((token) => {
        window.location.replace(token ? next : "/login");
      })
      .catch(() => {
        window.location.replace("/login");
      });
  }, []);

  return (
    <div className={styles.wrap}>
      <section className={`${styles.panel} rise`}>
        <div className={styles.brand}>
          <div className={styles.brandIcon} aria-hidden>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              storefront
            </span>
          </div>
          <h1>Frosty</h1>
        </div>
        <p style={{ textAlign: "center", color: "var(--on-surface-variant)", margin: 0 }}>
          Signing you in…
        </p>
      </section>
    </div>
  );
}
