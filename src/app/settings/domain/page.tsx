"use client";

import Link from "next/link";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { StepVerifyDomain } from "@/app/onboarding/components/StepVerifyDomain";

/**
 * Domain ownership verification (D200) — kept out of onboarding so first-run
 * is not blocked on DNS/meta. API: /v1/settings/domain-verification.
 */
export default function SettingsDomainPage() {
  return (
    <AppShell
      title="Domain verification"
      subtitle="Optional brand ownership via meta tag or DNS TXT. Does not block the website widget."
      requires="agent:config"
      actions={
        <Link href="/settings?tab=developer">
          <Button variant="ghost">Back to Settings</Button>
        </Link>
      }
    >
      <div className="max-w-xl">
        <StepVerifyDomain />
      </div>
    </AppShell>
  );
}
