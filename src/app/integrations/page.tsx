"use client";

import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { EntitlementGate } from "@/components/entitlements/EntitlementGate";
import { Button } from "@/components/ui/Button";
import { helpGuideHref } from "@/lib/help/catalog";
import styles from "./integrations.module.css";

/**
 * Merchant-facing CRM hub. Frosty does not OAuth into Zoho (or any CRM) yet.
 * Production path: signed webhooks + Zapier/Make, which is how Calendly/Typeform
 * ship CRM connect before a native connector exists.
 */
export default function IntegrationsPage() {
  return (
    <AppShell
      title="Integrations"
      subtitle="Send leads, meetings, and quotes to your CRM. Frosty stays the place they were captured."
      requires="webhooks:manage"
      actions={
        <Link href={helpGuideHref("connect-crm")}>
          <Button variant="ghost">Zoho in 5 minutes</Button>
        </Link>
      }
    >
      <EntitlementGate feature="webhooks">
        <div className={styles.page}>
          <p className={styles.intro}>
            We copy events out — we do not empty your Leads screen. Most teams connect Zoho,
            HubSpot, or Salesforce through Zapier in a few minutes. Developers can take the
            same events on a signed HTTPS URL.
          </p>

          <div className={styles.grid}>
            <article className={`${styles.card} ${styles.featured}`}>
              <div className={styles.head}>
                <div className={styles.logo} aria-hidden>
                  <span className="material-symbols-outlined">handshake</span>
                </div>
                <div className={styles.titleBlock}>
                  <h2 className={styles.title}>Zoho CRM</h2>
                  <p className={styles.meta}>Live today — via Zapier</p>
                </div>
              </div>
              <p className={styles.body}>
                When Frosty files a lead, Zapier creates the matching Zoho Lead. This is the
                production path: no OAuth button that posts JSON Zoho cannot read.
              </p>
              <ol className={styles.steps}>
                <li>In Zapier, create a Zap. Trigger: Webhooks by Zapier → Catch Hook. Copy the URL.</li>
                <li>In Frosty Webhooks, event New lead, paste that URL, save, copy the signing secret once.</li>
                <li>Zapier action: Zoho CRM → Create/Update Module Entry (Leads). Map name, email, phone from the data object.</li>
                <li>Turn the Zap on. Create a test lead here, then confirm it in Zoho.</li>
              </ol>
              <div className={styles.actions}>
                <Link href={helpGuideHref("connect-crm")}>
                  <Button>Open the guide</Button>
                </Link>
                <Link href="/webhooks">
                  <Button variant="ghost">Open Webhooks</Button>
                </Link>
                <a href="https://zapier.com/app/editor" target="_blank" rel="noreferrer">
                  <Button variant="ghost">Create a Zap</Button>
                </a>
              </div>
            </article>

            <article className={styles.card}>
              <div className={styles.head}>
                <div className={styles.logo} aria-hidden>
                  <span className="material-symbols-outlined">hub</span>
                </div>
                <div className={styles.titleBlock}>
                  <h2 className={styles.title}>HubSpot, Salesforce, and others</h2>
                  <p className={styles.meta}>Same Zapier (or Make) path</p>
                </div>
              </div>
              <p className={styles.body}>
                Catch the same lead.created webhook, then pick the CRM action in Zapier or Make.
                We do not ship a native connector per CRM — each one is its own OAuth product.
              </p>
              <div className={styles.others} aria-label="Supported via Zapier">
                <span className={styles.pill}>HubSpot</span>
                <span className={styles.pill}>Salesforce</span>
                <span className={styles.pill}>Pipedrive</span>
                <span className={styles.pill}>Freshsales</span>
                <span className={styles.pill}>LeadSquared</span>
                <span className={styles.pill}>Make.com</span>
              </div>
              <div className={styles.actions}>
                <Link href={helpGuideHref("connect-crm")}>
                  <Button variant="ghost">Field mapping</Button>
                </Link>
              </div>
            </article>

            <article className={styles.card}>
              <div className={styles.head}>
                <div className={styles.logo} aria-hidden>
                  <span className="material-symbols-outlined">webhook</span>
                </div>
                <div className={styles.titleBlock}>
                  <h2 className={styles.title}>Signed webhooks</h2>
                  <p className={styles.meta}>For your own backend</p>
                </div>
              </div>
              <p className={styles.body}>
                We POST JSON, signed like Stripe (X-Frosty-Signature). Ping, pause, rotate the
                secret, and retry failed deliveries from the Webhooks screen.
              </p>
              <div className={styles.actions}>
                <Link href="/webhooks">
                  <Button>Manage endpoints</Button>
                </Link>
                <Link href={helpGuideHref("webhooks")}>
                  <Button variant="ghost">Signing docs</Button>
                </Link>
              </div>
            </article>

            <article className={styles.card}>
              <div className={styles.head}>
                <div className={styles.logo} aria-hidden>
                  <span className="material-symbols-outlined">lock</span>
                </div>
                <div className={styles.titleBlock}>
                  <h2 className={styles.title}>Direct Zoho login</h2>
                  <p className={`${styles.meta} ${styles.soon}`}>Not built — Zapier is the supported path</p>
                </div>
              </div>
              <p className={styles.body}>
                A first-party Zoho OAuth app (India vs global accounts, Leads vs Contacts, field
                mapping, token refresh) is a separate product. We will not show a Connect button
                that cannot create a Zoho Lead. Use Zapier until that ships.
              </p>
            </article>
          </div>

          <p className={styles.note}>
            <strong>Frosty stays the source of capture.</strong> Your Leads, Meetings, and Quotes
            screens keep the records. The CRM receives a copy. Two-way sync (edits in Zoho coming
            back here) is not offered.
          </p>
        </div>
      </EntitlementGate>
    </AppShell>
  );
}
