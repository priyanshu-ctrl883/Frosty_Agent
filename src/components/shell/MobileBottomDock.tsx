"use client";

import React from "react";
import { MobileBottomNav, type MobileBottomNavTab } from "./MobileBottomNav";

export type MobileDockItem = {
  id: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  badge?: number | string;
};

type Props = {
  tabs: readonly MobileDockItem[] | MobileDockItem[];
  activeTab: string;
  onTabChange: (id: any) => void;
  centerIndex?: number;
};

export function MobileBottomDock({ tabs, activeTab, onTabChange }: Props) {
  return (
    <MobileBottomNav
      tabs={tabs as MobileBottomNavTab[]}
      activeTab={activeTab}
      onTabChange={onTabChange}
    />
  );
}
