const envCreditsPerRupee = Number(process.env.NEXT_PUBLIC_CREDITS_PER_RUPEE);

export const DEFAULT_CREDITS_PER_RUPEE =
  Number.isFinite(envCreditsPerRupee) && envCreditsPerRupee > 0
    ? envCreditsPerRupee
    : 10;

export function creditsToRupees(
  credits: number,
  creditsPerRupee: number = DEFAULT_CREDITS_PER_RUPEE
): number {
  const safeRate = Number.isFinite(creditsPerRupee) && creditsPerRupee > 0
    ? creditsPerRupee
    : DEFAULT_CREDITS_PER_RUPEE;
  const safeCredits = Number.isFinite(credits) ? credits : 0;
  return safeCredits / safeRate;
}

export function formatCreditsAsRupees(
  credits: number,
  options?: {
    creditsPerRupee?: number;
    signed?: boolean;
    approx?: boolean;
  }
): string {
  const rupees = creditsToRupees(Math.abs(credits), options?.creditsPerRupee);
  const sign = options?.signed
    ? credits > 0
      ? '+'
      : credits < 0
        ? '-'
        : ''
    : '';
  const approx = options?.approx === false ? '' : '≈ ';

  return `${approx}${sign}₹${rupees.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
