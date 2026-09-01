"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
} from "lucide-react";
import styles from "../meetings.module.css";

export type KpiCounts = {
  total: number;
  upcoming: number;
  pending: number;
  completed: number;
};

type Props = {
  counts: KpiCounts;
  activeFilter: string;
  onSelectFilter: (filter: "all" | "upcoming" | "pending_approval" | "completed") => void;
};

export function MeetingStats({ counts, activeFilter, onSelectFilter }: Props) {
  const cards = [
    {
      id: "all" as const,
      label: "Total Meetings",
      count: counts.total,
      subtext: "All scheduled bookings",
      icon: <Calendar className="w-5 h-5" />,
      active: activeFilter === "all",
    },
    {
      id: "upcoming" as const,
      label: "Upcoming",
      count: counts.upcoming,
      subtext: "Future active meetings",
      icon: <CalendarClock className="w-5 h-5" />,
      active: activeFilter === "upcoming",
    },
    {
      id: "pending_approval" as const,
      label: "Pending Approval",
      count: counts.pending,
      subtext: "Requires host confirmation",
      icon: <CalendarCheck className="w-5 h-5" />,
      active: activeFilter === "pending_approval",
    },
    {
      id: "completed" as const,
      label: "Completed",
      count: counts.completed,
      subtext: "Successfully finished",
      icon: <CheckCircle2 className="w-5 h-5" />,
      active: activeFilter === "completed",
    },
  ];

  return (
    <div className={styles.kpiGrid}>
      {cards.map((card) => (
        <motion.div
          key={card.id}
          className={card.active ? styles.kpiCardActive : styles.kpiCard}
          onClick={() => onSelectFilter(card.id)}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSelectFilter(card.id);
            }
          }}
          aria-label={`${card.label}: ${card.count} ${card.subtext}`}
        >
          <div className={styles.kpiContent}>
            <div className={styles.kpiLabel}>{card.label}</div>
            <div className={styles.kpiNumberRow}>
              <span className={styles.kpiNumber}>{card.count}</span>
            </div>
            <div className={styles.kpiSubtext}>{card.subtext}</div>
          </div>
          <div className={styles.kpiIconWrapper}>{card.icon}</div>
        </motion.div>
      ))}
    </div>
  );
}
