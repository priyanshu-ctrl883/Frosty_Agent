/** Target number of x-axis labels for a given reporting window. */
export const chartAxisMaxTicks = (days: number): number => {
  if (days <= 7) return 7;
  if (days <= 14) return 6;
  if (days <= 30) return 5;
  if (days <= 90) return 10;
  return 12;
};

/** Step between x-axis labels (show every Nth label, always include last). */
export const chartLabelStep = (dataLength: number, days?: number): number => {
  if (dataLength <= 1) return 1;
  const maxTicks =
    days != null ? chartAxisMaxTicks(days) : Math.min(7, dataLength);
  return Math.max(1, Math.ceil(dataLength / maxTicks));
};

/** Pick evenly spaced tick labels for Recharts `ticks` prop. */
export const chartAxisTicks = <T,>(
  data: T[],
  days: number,
  key: keyof T,
): string[] => {
  if (data.length === 0) return [];
  const maxTicks = chartAxisMaxTicks(days);
  if (data.length <= maxTicks) {
    return data.map((row) => String(row[key] ?? ""));
  }
  const step = Math.ceil((data.length - 1) / (maxTicks - 1));
  const ticks: string[] = [];
  for (let i = 0; i < data.length; i += step) {
    const label = String(data[i]?.[key] ?? "");
    if (label) ticks.push(label);
  }
  const last = String(data[data.length - 1]?.[key] ?? "");
  if (last && ticks[ticks.length - 1] !== last) ticks.push(last);
  return ticks;
};
