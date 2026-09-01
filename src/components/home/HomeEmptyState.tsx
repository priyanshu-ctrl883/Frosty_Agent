"use client";

import Link from "next/link";
import { Code, BookOpen, FlaskConical, Rocket } from "lucide-react";

type Props = {
  /** True when there is essentially no traffic yet in the selected window. */
  isEmpty: boolean;
  /** Hide the trial/plans card when the merchant already subscribed or is trialing. */
  hideTrialCard?: boolean;
};

/**
 * Day-0 / empty Home guidance — peers always give a first-win path.
 */
export function HomeEmptyState({ isEmpty, hideTrialCard = false }: Props) {
  if (!isEmpty) return null;

  const cards = [
    {
      href: "/widget",
      icon: Code,
      title: "Install the widget",
      desc: "Paste the embed snippet on your site so visitors can chat.",
    },
    {
      href: "/knowledge",
      icon: BookOpen,
      title: "Add knowledge",
      desc: "Upload docs or FAQs so answers stay grounded.",
    },
    {
      href: "/website?tab=settings&subtab=sandbox",
      icon: FlaskConical,
      title: "Test in sandbox",
      desc: "Preview draft replies before you publish.",
    },
    {
      href: "/billing/plans",
      icon: Rocket,
      title: "Activate trial & plans",
      desc: "Start your 7-day trial and unlock live deployment.",
    },
  ].filter((c) => !(hideTrialCard && c.href === "/billing/plans"));

  return (
    <div className="mb-8 rounded-2xl border border-dashed border-[var(--line-strong)] bg-[var(--surf-1)]/60 p-6 sm:p-8">
      <h3 className="text-base font-bold text-foreground font-display">
        No visitor traffic in this window yet
      </h3>
      <p className="text-xs text-muted-foreground mt-1 max-w-xl leading-relaxed">
        Charts and KPIs fill in as conversations arrive. Start with install and a published agent —
        that is the path peers expect on day one.
      </p>
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.href}
              href={c.href}
              className="group p-4 rounded-xl border border-[var(--line)] bg-card hover:border-[#0396A6]/40 hover:shadow-sm transition-all"
            >
              <Icon className="w-5 h-5 text-[#0396A6] mb-2" />
              <p className="text-xs font-bold text-foreground group-hover:text-[#0396A6] transition-colors">{c.title}</p>
              <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{c.desc}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
