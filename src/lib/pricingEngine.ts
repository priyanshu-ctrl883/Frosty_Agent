// ─── Types ───────────────────────────────────────────────────────────────────────────────────
export type Region = 'IN' | 'INTL';
export type PlanFamily = 'core' | 'commerce' | 'addons';
export type CoreBillingTerm = 'annual' | 'biannual' | 'quarterly' | 'monthly';
export type CommerceBillingTerm = 'annual' | 'biannual' | 'trimonthly';
export type BillingTerm = CoreBillingTerm | CommerceBillingTerm;

export interface TierPricing {
    price: string;
    rawPrice: number;
    period: string;
    billingNote: string;
    savings?: string;
    totalBilled: number;
    strikethroughPrice: string;
}

export interface PlanDetails {
    tag: string;
    name: string;
    conversations: string;
    monthlyConvosNum: number;
    seats: string;
    seatsNum: number;
    webChannels: number;
    waChannels: number;
    overage: string;
    cta: string;
    ctaLink: string;
    highlighted?: boolean;
    strikethroughPrice: string;
    showLaunchBadge: boolean;
    pricing: Record<string, TierPricing>;
}

export interface AddonItem {
    id: string;
    tag: string;
    name: string;
    badge: string;
    price: string;
    period: string;
    billingNote: string;
    desc: string;
    bullets: string[];
    cta: string;
    ctaLink: string;
    strikethroughPrice: string;
    showLaunchBadge: boolean;
}

export interface BillingTermOption {
    id: string;
    label: string;
    months: number;
    discountBadge?: string | null;
}

// Raw CSV strings — populated at runtime from the API route
// (This makes every browser refresh read the latest CSV from disk)
export interface PricingCSVBundle {
    plans: string;
    discounts: string;
    addons: string;
}

export const DEFAULT_PRICING_CSV_BUNDLE: PricingCSVBundle = {
    plans: `plan,category,is_popular,convos,overage_inr,overage_usd,seats,web_channels,wa_channels,base_inr,base_usd,inr_annual,inr_biannual,inr_quarterly,usd_annual,usd_biannual,usd_quarterly,inr_strikethrough,usd_strikethrough
Starter,core,false,300,₹26,$0.80,2,1,1,6599,199,5299,5599,6299,159,179,189,9499,
Growth,core,true,600,₹20,$0.70,3,1,1,9899,349,7899,8399,9399,279,319,329,13999,
Scale,core,false,1600,₹16,$0.52,4,1,1,21999,699,17599,18699,20899,559,629,669,30999,
Max,core,false,4000,₹15,$0.44,7,1,1,50599,1479,40499,42999,47999,1179,1329,1409,71999,
Starter,commerce,false,500,₹24,$0.81,2,1,1,9999,339,7999,8999,9999,269,309,339,13999,
Growth,commerce,true,1000,₹22,$0.72,3,1,1,17999,599,14399,16199,17999,479,539,599,24999,
Scale,commerce,false,2000,₹18,$0.56,4,1,1,29999,929,23999,26999,29999,739,839,929,41999,
Max,commerce,false,5000,₹16,$0.47,7,1,1,67499,1979,53999,60799,67499,1579,1779,1979,94999,`,
    discounts: `category,term,label,months,discount_percent,badge
core,annual,Annual,12,20,Save 20%
core,biannual,6 Months,6,15,Save 15%
core,quarterly,Quarterly,3,5,Save 5%
core,monthly,Monthly,1,0,
commerce,annual,Annual,12,20,Save 20%
commerce,biannual,6 Months,6,10,Save 10%
commerce,trimonthly,3 Months,3,0,Min Term · List Price`,
    addons: `id,tag,name,badge,inr_price,usd_price,inr_strikethrough,usd_strikethrough,period,billing_note,desc,bullet1,bullet2,bullet3,cta,cta_link
seats,TEAM EXPANSION,Additional Team Seats,Flexible Scale,999,19.99,1899,,/mo,Billed monthly with active plan,Expand your live dashboard access. Included seats are specified per tier (2 to 7 seats).,Full RBAC permissions (Owner Manager Agent),Live conversation takeover & whisper notes,Individual performance & response audit logs,Add to Plan,/login
website,CHANNEL ADD-ON,Additional Website Channel,+50 Free Convos,2999,85,3999,,/mo,Includes 50 free conversations / mo,Deploy Frosty AI on an additional website domain or landing page with unified lead memory.,50 extra monthly conversations included,Custom embed widget & brand theme styling,Unified contextual memory across channels,Add Website Channel,/login
whatsapp,CHANNEL ADD-ON,Additional WhatsApp Channel,+50 Free Convos,2999,85,3999,,/mo,Includes 50 free conversations / mo,Add a dedicated WhatsApp Business number for a separate brand department or territory.,50 extra monthly conversations included,Official WhatsApp Cloud API verification support,Independent business profile & catalog link,Add WhatsApp Channel,/login
custom,ENGINEERING,Custom Integration & Webhooks,Custom Scope,,,,,,Custom scope & quote,Custom webhook CRM bi-directional sync or bespoke ERP connector built by our engineers.,Scoped delivered & tested within 5 business days,Includes 30 days post-launch warranty,Direct Slack/Teams engineer bridge,Request Integration,https://www.frostrek.ai/contact`
};


// ─── Formatting Helpers ──────────────────────────────────────────────────────────────────────

export function formatCurrencyAmount(amount: number, region: Region): string {
    if (region === 'IN') {
        return `₹${Math.round(amount).toLocaleString('en-IN')}`;
    }
    return `$${Math.round(amount).toLocaleString('en-US')}`;
}

// ─── CSV Parser ──────────────────────────────────────────────────────────────────────────────

export function parseCSV(csvString: string): Record<string, string>[] {
    const lines = csvString.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return [];
    const headerLine = lines[0];
    if (!headerLine) return [];
    const headers = headerLine.split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
        const values: string[] = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        const record: Record<string, string> = {};
        headers.forEach((h, idx) => { record[h] = values[idx] ?? ''; });
        return record;
    });
}

// ─── Computed Plan Builder ───────────────────────────────────────────────────────────────────

export function getComputedPlans(rawPlansCsv: string, region: Region, category: 'core' | 'commerce'): PlanDetails[] {
    const records = parseCSV(rawPlansCsv).filter(r => r.category === category);

    return records.map(r => {
        const basePrice = region === 'IN' ? parseFloat(r.base_inr || '0') : parseFloat(r.base_usd || '0');
        const pricing: Record<string, TierPricing> = {};

        // Fixed Strikethrough from CSV:
        // For IN: comes from inr_strikethrough column (e.g. 9499 -> ₹9,499)
        // For INTL: comes from usd_strikethrough (empty by default for US clients -> no strikethrough, no launch badge)
        const strikethroughRaw = region === 'IN' ? (r.inr_strikethrough || '') : (r.usd_strikethrough || '');
        const strikethroughNum = parseFloat(strikethroughRaw);
        const strikethroughPrice = (!isNaN(strikethroughNum) && strikethroughNum > 0) ? formatCurrencyAmount(strikethroughNum, region) : '';
        const showLaunchBadge = region === 'IN' && Boolean(strikethroughPrice);

        // Savings Benchmark: If fixed strikethrough standard price is given, savings is calculated against the standard price;
        // otherwise (e.g. USD) savings is calculated against the monthly base list price.
        const benchmarkPrice = (!isNaN(strikethroughNum) && strikethroughNum > 0) ? strikethroughNum : basePrice;

        if (category === 'core') {
            // Core Terms: annual, biannual, quarterly, monthly
            const annualPrice = parseFloat(region === 'IN' ? (r.inr_annual || '0') : (r.usd_annual || '0')) || Math.round(basePrice * 0.80);
            const biannualPrice = parseFloat(region === 'IN' ? (r.inr_biannual || '0') : (r.usd_biannual || '0')) || Math.round(basePrice * 0.85);
            const quarterlyPrice = parseFloat(region === 'IN' ? (r.inr_quarterly || '0') : (r.usd_quarterly || '0')) || Math.round(basePrice * 0.955);
            const monthlyPrice = basePrice;

            // Annualized Savings: (benchmark - termPrice) × 12
            const annualBilled = annualPrice * 12;
            const annualSavings = (benchmarkPrice - annualPrice) * 12;
            pricing['annual'] = {
                price: formatCurrencyAmount(annualPrice, region),
                rawPrice: annualPrice,
                period: '/mo',
                billingNote: `Billed annually (${formatCurrencyAmount(annualBilled, region)})`,
                savings: annualSavings > 0 ? `Save ${formatCurrencyAmount(annualSavings, region)}/yr` : undefined,
                totalBilled: annualBilled,
                strikethroughPrice
            };

            const biannualBilled = biannualPrice * 6;
            const biannualSavings = (benchmarkPrice - biannualPrice) * 12;
            pricing['biannual'] = {
                price: formatCurrencyAmount(biannualPrice, region),
                rawPrice: biannualPrice,
                period: '/mo',
                billingNote: `Billed 6 months (${formatCurrencyAmount(biannualBilled, region)})`,
                savings: biannualSavings > 0 ? `Save ${formatCurrencyAmount(biannualSavings, region)}/yr` : undefined,
                totalBilled: biannualBilled,
                strikethroughPrice
            };

            const quarterlyBilled = quarterlyPrice * 3;
            const quarterlySavings = (benchmarkPrice - quarterlyPrice) * 12;
            pricing['quarterly'] = {
                price: formatCurrencyAmount(quarterlyPrice, region),
                rawPrice: quarterlyPrice,
                period: '/mo',
                billingNote: `Billed quarterly (${formatCurrencyAmount(quarterlyBilled, region)})`,
                savings: quarterlySavings > 0 ? `Save ${formatCurrencyAmount(quarterlySavings, region)}/yr` : undefined,
                totalBilled: quarterlyBilled,
                strikethroughPrice
            };

            const monthlySavings = (benchmarkPrice - monthlyPrice) * 12;
            pricing['monthly'] = {
                price: formatCurrencyAmount(monthlyPrice, region),
                rawPrice: monthlyPrice,
                period: '/mo',
                billingNote: 'Billed monthly',
                savings: monthlySavings > 0 ? `Save ${formatCurrencyAmount(monthlySavings, region)}/yr` : undefined,
                totalBilled: monthlyPrice,
                strikethroughPrice
            };

        } else {
            // Commerce: annual, biannual, trimonthly (min 3 months = base price)
            const annualPrice = parseFloat(region === 'IN' ? (r.inr_annual || '0') : (r.usd_annual || '0')) || Math.round(basePrice * 0.80);
            const biannualPrice = parseFloat(region === 'IN' ? (r.inr_biannual || '0') : (r.usd_biannual || '0')) || Math.round(basePrice * 0.90);
            const trimonthlyPrice = basePrice;

            // Annualized Savings: (benchmark - termPrice) × 12
            const annualBilled = annualPrice * 12;
            const annualSavings = (benchmarkPrice - annualPrice) * 12;
            pricing['annual'] = {
                price: formatCurrencyAmount(annualPrice, region),
                rawPrice: annualPrice,
                period: '/mo',
                billingNote: `Billed annually (${formatCurrencyAmount(annualBilled, region)})`,
                savings: annualSavings > 0 ? `Save ${formatCurrencyAmount(annualSavings, region)}/yr` : undefined,
                totalBilled: annualBilled,
                strikethroughPrice
            };

            const biannualBilled = biannualPrice * 6;
            const biannualSavings = (benchmarkPrice - biannualPrice) * 12;
            pricing['biannual'] = {
                price: formatCurrencyAmount(biannualPrice, region),
                rawPrice: biannualPrice,
                period: '/mo',
                billingNote: `Billed 6 months (${formatCurrencyAmount(biannualBilled, region)})`,
                savings: biannualSavings > 0 ? `Save ${formatCurrencyAmount(biannualSavings, region)}/yr` : undefined,
                totalBilled: biannualBilled,
                strikethroughPrice
            };

            const trimonthlyBilled = trimonthlyPrice * 3;
            const trimonthlySavings = (benchmarkPrice - trimonthlyPrice) * 12;
            pricing['trimonthly'] = {
                price: formatCurrencyAmount(trimonthlyPrice, region),
                rawPrice: trimonthlyPrice,
                period: '/mo',
                billingNote: `Billed 3 months (${formatCurrencyAmount(trimonthlyBilled, region)}) · Min Term`,
                savings: trimonthlySavings > 0 ? `Save ${formatCurrencyAmount(trimonthlySavings, region)}/yr` : undefined,
                totalBilled: trimonthlyBilled,
                strikethroughPrice
            };
        }

        const planName = r.plan || '';
        return {
            tag: planName.toUpperCase(),
            name: planName,
            conversations: `${(parseInt(r.convos || '0', 10) || 0).toLocaleString()} conversations`,
            monthlyConvosNum: parseInt(r.convos || '0', 10) || 0,
            seats: `${parseInt(r.seats || '1', 10) || 1} team seats`,
            seatsNum: parseInt(r.seats || '1', 10) || 1,
            webChannels: parseInt(r.web_channels || '1', 10) || 1,
            waChannels: parseInt(r.wa_channels || '1', 10) || 1,
            overage: region === 'IN' ? (r.overage_inr || '') : (r.overage_usd || ''),
            cta: 'Start 7-Day Free Trial',
            ctaLink: '/login',
            highlighted: r.is_popular === 'true' || r.is_popular === '1',
            strikethroughPrice,
            showLaunchBadge,
            pricing
        };
    });
}

// ─── Addons ──────────────────────────────────────────────────────────────────────────────────

export function getComputedAddons(rawAddonsCsv: string, region: Region): AddonItem[] {
    const records = parseCSV(rawAddonsCsv);
    return records.map(r => {
        const inrPrice = r.inr_price || '';
        const usdPrice = r.usd_price || '';
        const rawNumeric = region === 'IN' ? parseFloat(inrPrice) : parseFloat(usdPrice);
        const formattedPrice = isNaN(rawNumeric) ? (inrPrice || usdPrice || 'Custom') : formatCurrencyAmount(rawNumeric, region);

        const strikethroughRaw = region === 'IN' ? (r.inr_strikethrough || '') : (r.usd_strikethrough || '');
        const strikethroughNum = parseFloat(strikethroughRaw);
        const strikethroughPrice = (!isNaN(strikethroughNum) && strikethroughNum > 0) ? formatCurrencyAmount(strikethroughNum, region) : '';
        const showLaunchBadge = region === 'IN' && Boolean(strikethroughPrice);

        return {
            id: r.id || '',
            tag: r.tag || '',
            name: r.name || '',
            badge: r.badge || '',
            price: formattedPrice,
            period: formattedPrice !== 'Custom' ? (r.period || '') : '',
            billingNote: r.billing_note || '',
            desc: r.desc || '',
            bullets: [r.bullet1 || '', r.bullet2 || '', r.bullet3 || ''].filter(Boolean),
            cta: r.cta || '',
            ctaLink: r.cta_link || '/login',
            strikethroughPrice,
            showLaunchBadge
        };
    });
}

// ─── Billing Toggle Options ───────────────────────────────────────────────────────────────────

export function getBillingDiscounts(rawDiscountsCsv: string, category: 'core' | 'commerce'): BillingTermOption[] {
    const records = parseCSV(rawDiscountsCsv).filter(r => r.category === category);
    return records.map(r => ({
        id: r.term || '',
        label: r.label || '',
        months: parseInt(r.months || '1', 10) || 1,
        discountBadge: r.badge || null
    }));
}
