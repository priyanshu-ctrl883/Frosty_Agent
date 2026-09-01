"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { Me, MerchantMe } from "@/lib/types";
import { Check, ChevronDown, Store } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

type Props = { me: Me };

type Row = { merchant_id: string; role: string | null; is_owner: boolean; name: string };

export function MerchantSwitcher({ me }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [names, setNames] = useState<Record<string, string>>({});

  const memberships = me.memberships.filter(
    (m): m is { merchant_id: string; role: string | null; is_owner: boolean } =>
      m.merchant_id !== null,
  );

  useEffect(() => {
    if (!me.active_merchant_id) return;
    let cancelled = false;
    apiRequest<MerchantMe>("/v1/merchants/me")
      .then((m) => {
        if (!cancelled && m.company_name) {
          setNames((prev) => ({ ...prev, [m.id]: m.company_name as string }));
        }
      })
      .catch(() => { });
    return () => {
      cancelled = true;
    };
  }, [me.active_merchant_id]);

  if (memberships.length <= 1) return null;

  const rows: Row[] = memberships.map((m) => ({
    ...m,
    name: names[m.merchant_id] || `Workspace ${m.merchant_id.slice(0, 8)}`,
  }));
  const active = rows.find((r) => r.merchant_id === me.active_merchant_id);

  async function switchTo(merchantId: string) {
    if (merchantId === me.active_merchant_id) return;
    setBusy(true);
    setError(null);
    try {
      await apiRequest("/v1/me/active-merchant", {
        method: "POST",
        body: { merchant_id: merchantId }
      });
      window.location.assign("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not switch workspace");
      setBusy(false);
    }
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/20 px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground hover:border-border transition-all max-w-[200px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="truncate">{active?.name || "Switch workspace"}</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-50 shrink-0" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-50 min-w-[240px] max-w-sm overflow-hidden rounded-xl border border-border/60 bg-background/95 backdrop-blur-xl p-1 shadow-xl animate-in fade-in-80 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2"
          align="end"
          sideOffset={8}
        >
          <div className="px-2 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
            Your workspaces
          </div>

          {error && <div className="px-2 py-1 text-xs text-red-500 font-medium">{error}</div>}

          <div className="flex flex-col gap-0.5 max-h-[300px] overflow-y-auto">
            {rows.map((r) => {
              const selected = r.merchant_id === me.active_merchant_id;
              return (
                <DropdownMenu.Item
                  key={r.merchant_id}
                  disabled={busy}
                  onClick={() => void switchTo(r.merchant_id)}
                  className={`relative flex cursor-pointer select-none items-center gap-3 rounded-md px-2 py-2 text-sm outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${selected ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-accent hover:text-foreground font-medium"
                    }`}
                >
                  <div className={`flex items-center justify-center w-8 h-8 rounded-md shrink-0 border ${selected ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-background border-border text-muted-foreground"}`}>
                    <Store className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col flex-1 truncate text-left">
                    <span className="truncate text-[13px] leading-tight">{r.name}</span>
                    <span className="text-[10px] opacity-70 mt-0.5 leading-none font-medium">
                      {r.is_owner ? "Owner" : r.role || "No role"}
                    </span>
                  </div>
                  {selected && <Check className="w-4 h-4 ml-auto text-primary" />}
                </DropdownMenu.Item>
              );
            })}
          </div>

          <DropdownMenu.Separator className="h-px bg-border/50 my-2" />
          <div className="px-2 pb-1.5 pt-0.5 text-[11px] leading-snug text-muted-foreground text-center">
            A new workspace comes from an invitation — one account can own only one.
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
