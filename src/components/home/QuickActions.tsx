"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Inbox, Book, FlaskConical, UserPlus, ArrowRight } from "lucide-react";

export function QuickActions() {
  const actions = [
    {
      label: "Open Inbox",
      href: "/inbox",
      icon: <Inbox className="w-5 h-5 text-sky-500 dark:text-sky-400" />,
      iconBg: "bg-sky-500/10 border-sky-500/20 text-sky-500 shadow-[0_0_12px_rgba(14,165,233,0.15)]",
      hoverBorder: "hover:border-sky-500/35 hover:shadow-[0_10px_30px_rgba(14,165,233,0.1)]",
      textColor: "group-hover:text-sky-500 dark:group-hover:text-sky-400",
      arrowColor: "text-sky-500",
      desc: "Chat with live users in real-time",
    },
    {
      label: "Add Knowledge",
      href: "/knowledge",
      icon: <Book className="w-5 h-5 text-violet-500 dark:text-violet-400" />,
      iconBg: "bg-violet-500/10 border-violet-500/20 text-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.15)]",
      hoverBorder: "hover:border-violet-500/35 hover:shadow-[0_10px_30px_rgba(139,92,246,0.1)]",
      textColor: "group-hover:text-violet-500 dark:group-hover:text-violet-400",
      arrowColor: "text-violet-500",
      desc: "Train your AI with documents & URLs",
    },
    {
      label: "Open Sandbox",
      href: "/website?tab=settings&subtab=sandbox",
      icon: <FlaskConical className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />,
      iconBg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
      hoverBorder: "hover:border-emerald-500/35 hover:shadow-[0_10px_30px_rgba(16,185,129,0.1)]",
      textColor: "group-hover:text-emerald-500 dark:group-hover:text-emerald-400",
      arrowColor: "text-emerald-500",
      desc: "Test & debug AI agent responses safely",
    },
    {
      label: "Invite Team",
      href: "/team",
      icon: <UserPlus className="w-5 h-5 text-amber-500 dark:text-amber-400" />,
      iconBg: "bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.15)]",
      hoverBorder: "hover:border-amber-500/35 hover:shadow-[0_10px_30px_rgba(245,158,11,0.1)]",
      textColor: "group-hover:text-amber-500 dark:group-hover:text-amber-400",
      arrowColor: "text-amber-500",
      desc: "Collaborate together with your team",
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 12 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 },
    },
  };

  return (
    <div className="w-full">
      <h3 className="text-base sm:text-lg font-extrabold font-sans text-foreground mb-5 sm:mb-6">
        Quick Actions
      </h3>
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5"
      >
        {actions.map((action, idx) => (
          <motion.div key={idx} variants={item}>
            <Link href={action.href} className="group block h-full">
              <div
                className={`relative overflow-hidden h-full p-5 sm:p-6 rounded-[22px] sm:rounded-[24px] border border-[var(--line)] bg-[var(--surf-1)]/40 hover:bg-card ${action.hoverBorder} transition-all duration-300`}
              >
                <div
                  className={`mb-3.5 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center border transition-all duration-300 group-hover:scale-105 ${action.iconBg}`}
                >
                  {action.icon}
                </div>
                <h4
                  className={`text-xs sm:text-sm font-bold font-sans text-foreground ${action.textColor} transition-colors flex items-center gap-1.5`}
                >
                  {action.label}
                  <ArrowRight
                    className={`w-3.5 h-3.5 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all duration-300 ${action.arrowColor}`}
                  />
                </h4>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 leading-relaxed">
                  {action.desc}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
