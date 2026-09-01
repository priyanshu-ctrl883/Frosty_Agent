"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import {
  LayoutDashboard, LineChart, Bot, BookOpen, Blocks, MessageCircle, Layers, Inbox,
  UsersRound, CalendarCheck, FileText, CreditCard, Users, Webhook, History, Settings, Search, Store,
  FlaskConical, SlidersHorizontal,
} from "lucide-react";
import { MERCHANT_NAV } from "@/lib/nav";

const iconMap: Record<string, any> = {
  "dashboard": LayoutDashboard,
  "insights": LineChart,
  "smart_toy": Bot,
  "science": FlaskConical,
  "menu_book": BookOpen,
  "widgets": Blocks,
  "chat": MessageCircle,
  "dynamic_feed": Layers,
  "inbox": Inbox,
  "person_search": UsersRound,
  "event_available": CalendarCheck,
  "request_quote": FileText,
  "payments": CreditCard,
  "group": Users,
  "webhook": Webhook,
  "sliders": SlidersHorizontal,
  "history": History,
  "settings": Settings,
};

export function CommandMenu({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, setOpen]);

  useEffect(() => {
    if (!open) {
      setSearch("");
      setSelectedIndex(-1);
    }
  }, [open]);

  const filteredItems = MERCHANT_NAV.filter((item) => {
    const hay = `${item.label} ${(item.keywords ?? []).join(" ")}`.toLowerCase();
    return hay.includes(search.toLowerCase());
  });

  const handleNavigate = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === "Enter" && selectedIndex >= 0 && filteredItems[selectedIndex]) {
      e.preventDefault();
      handleNavigate(filteredItems[selectedIndex].href);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0" />
        <Dialog.Content 
          className="fixed top-[20%] left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-xl border border-white/10 bg-[#161324] backdrop-blur-2xl shadow-2xl animate-in fade-in-0 zoom-in-95 outline-none text-white"
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-center border-b border-white/10 px-4">
            <Search className="mr-3 h-5 w-5 shrink-0 text-white/40" />
            <input
              autoFocus
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedIndex(-1);
              }}
              placeholder="Type a command or search..."
              className="flex h-14 w-full rounded-md bg-transparent py-3 text-sm placeholder:text-white/40 text-white outline-none border-none focus:outline-none focus:ring-0"
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto p-2 no-scrollbar">
            {filteredItems.length === 0 ? (
              <div className="py-10 text-center text-sm font-medium text-white/50">
                No results found.
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="px-3 py-2 text-xs font-semibold text-white/50">
                  Navigation
                </div>
                {filteredItems.map((item, idx) => {
                  const Icon = iconMap[item.icon] || Store;
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={item.href}
                      type="button"
                      onClick={() => handleNavigate(item.href)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors text-left outline-none cursor-pointer ${
                        isSelected
                          ? "bg-[var(--sidebar-active-bg,rgba(255,255,255,0.15))] text-white font-semibold"
                          : "text-white/75 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon className="mr-3 h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
