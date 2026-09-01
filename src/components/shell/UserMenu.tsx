"use client";

import { useState } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Cookie, LogOut, Settings, Shield } from "lucide-react";
import { openConsentPreferencesModal } from "@/lib/useConsentGate";
import { signOut } from "@/lib/session";
import { useRouter } from "next/navigation";
import type { Me } from "@/lib/types";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

export function UserMenu({ me }: { me: Me }) {
  const router = useRouter();
  const [showConfirmLogout, setShowConfirmLogout] = useState(false);
  const name = me.display_name || me.email || "You";
  const initial = name.charAt(0).toUpperCase();

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            className="flex items-center justify-center w-8 h-8 rounded-full font-semibold text-[13px] transition-colors focus-visible:outline-none shadow-sm"
            style={{
              border: '1px solid var(--lt-border)',
              background: 'var(--lt-surface)',
              color: 'var(--lt-text-primary)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--lt-card-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--lt-surface)')}
          >
            {initial}
          </button>
        </DropdownMenu.Trigger>
        
        <DropdownMenu.Portal>
          <DropdownMenu.Content 
            className="z-50 min-w-[220px] overflow-hidden rounded-xl p-1.5 shadow-2xl animate-in fade-in-80 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2"
            align="end"
            sideOffset={8}
            style={{
              border: '1px solid var(--lt-border)',
              background: 'var(--lt-card)',
            }}
          >
            <div className="flex flex-col space-y-1 p-2 pb-3 mb-1" style={{ borderBottom: '1px solid var(--lt-border)' }}>
              <p className="text-sm font-semibold leading-none" style={{ color: 'var(--lt-text-primary)' }}>{name}</p>
              <p className="text-xs font-medium leading-none mt-1 truncate" style={{ color: 'var(--lt-text-muted)' }}>{me.email}</p>
            </div>
            
            <DropdownMenu.Item 
              onClick={() => router.push("/settings")}
              className="relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-sm font-medium outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              style={{ color: 'var(--lt-text-primary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(3,150,166,0.06)'; e.currentTarget.style.color = 'var(--lt-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--lt-text-primary)'; }}
            >
              <Settings className="mr-2.5 h-4 w-4" style={{ color: 'var(--lt-text-muted)' }} />
              <span>Settings</span>
            </DropdownMenu.Item>

            <DropdownMenu.Item 
              onClick={() => router.push("/privacy")}
              className="relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-sm font-medium outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              style={{ color: 'var(--lt-text-primary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(3,150,166,0.06)'; e.currentTarget.style.color = 'var(--lt-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--lt-text-primary)'; }}
            >
              <Shield className="mr-2.5 h-4 w-4" style={{ color: 'var(--lt-text-muted)' }} />
              <span>Privacy &amp; legal</span>
            </DropdownMenu.Item>

            <DropdownMenu.Item
              onSelect={() => openConsentPreferencesModal()}
              className="relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-sm font-medium outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              style={{ color: 'var(--lt-text-primary)' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(3,150,166,0.06)'; e.currentTarget.style.color = 'var(--lt-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--lt-text-primary)'; }}
            >
              <Cookie className="mr-2.5 h-4 w-4" style={{ color: 'var(--lt-text-muted)' }} />
              <span>Cookie preferences</span>
            </DropdownMenu.Item>
            
            <DropdownMenu.Separator className="h-px my-1" style={{ background: 'var(--lt-border)' }} />
            
            <DropdownMenu.Item 
              onSelect={(e) => {
                e.preventDefault();
                setShowConfirmLogout(true);
              }}
              className="relative flex cursor-pointer select-none items-center rounded-md px-2.5 py-2 text-sm font-medium outline-none transition-colors data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
              style={{ color: 'var(--lt-error)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(217,100,100,0.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <LogOut className="mr-2.5 h-4 w-4" style={{ color: 'var(--lt-error)' }} />
              <span>Log out</span>
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <ConfirmModal
        show={showConfirmLogout}
        icon={<LogOut size={20} />}
        tone="danger"
        title="Log Out"
        message="Are you sure you want to log out of your merchant workspace?"
        confirmText="Log Out"
        cancelText="Cancel"
        onConfirm={async () => {
          setShowConfirmLogout(false);
          await signOut();
          router.replace("/login");
        }}
        onCancel={() => setShowConfirmLogout(false)}
      />
    </>
  );
}
