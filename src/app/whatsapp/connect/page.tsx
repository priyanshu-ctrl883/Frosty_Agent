"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/PageState";
import { useWorkspace } from "@/lib/workspace";
import { WhatsAppConnectionView } from "@/components/whatsapp/WhatsAppConnectionView";
import { ArrowLeft } from "lucide-react";

function WhatsappConnectInner() {
  const searchParams = useSearchParams();
  const preferredAgent = searchParams?.get("agent") || "";
  const { me, merchant } = useWorkspace();
  const tenantId = merchant?.id ?? me?.active_merchant_id ?? "";

  return (
    <AppShell
      title="WhatsApp Cloud Connection"
      subtitle="Link a Meta WhatsApp Phone Number ID to one of your WhatsApp or Unified agents."
      requires="agent:config"
      workspace
      actions={
        <Link href={preferredAgent ? `/whatsapp?agent=${preferredAgent}` : "/whatsapp"}>
          <Button variant="ghost" className="flex items-center gap-1.5 font-bold">
            <ArrowLeft size={15} />
            <span>Back to WhatsApp</span>
          </Button>
        </Link>
      }
    >
      <div className="pt-4 px-3 sm:px-6 pb-8">
        <WhatsAppConnectionView
          tenantId={tenantId}
          waAgentId={preferredAgent || null}
        />
      </div>
    </AppShell>
  );
}

export default function WhatsappConnectPage() {
  return (
    <Suspense fallback={<Loading label="Loading WhatsApp Connection…" />}>
      <WhatsappConnectInner />
    </Suspense>
  );
}

