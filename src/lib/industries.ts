import { Heart, Stethoscope, Home, Hotel, Utensils, Scale, Shield, GraduationCap, LucideIcon } from 'lucide-react';
import industriesData from '@/data/industries.json';

const iconMap: Record<string, LucideIcon> = {
  Heart,
  Stethoscope,
  Home,
  Hotel,
  Utensils,
  Scale,
  Shield,
  GraduationCap
};

export interface IndustryHreflang {
  lang: string;
  url: string;
}

export interface IndustryStatSecondary {
  value: string;
  source: string;
  year: string;
}

export interface IndustryStat {
  value: string;
  source: string;
  year: string;
  secondary?: IndustryStatSecondary;
}

export interface Conversation {
  customer_message: string;
  agent_action: string;
  type?: 'voice_note' | 'non_english' | 'existing_customer' | string;
}

export interface Segment {
  name: string;
  description: string;
}

export interface WhyPoint {
  title: string;
  description: string;
}

export interface SetupStep {
  title: string;
  description: string;
}

export interface Faq {
  question: string;
  answer: string;
}

export interface RelatedSolution {
  anchor_text: string;
  url: string;
}

export interface RelatedReading {
  title: string;
  url: string;
}

export interface IndustryImage {
  url: string;
  alt_text: string;
}

export interface Industry {
  // Front matter
  industry_slug: string;
  slug: string; // alias for industry_slug used across the app
  name: string; // required for navbar
  desc: string; // required for navbar
  iconName: string; // required for navbar
  icon?: LucideIcon;
  
  market?: string;
  canonical_url?: string;
  hreflang_cluster?: IndustryHreflang[];
  primary_keyword?: string;
  secondary_keywords?: string[];
  meta_title?: string;
  meta_description?: string;
  
  // Section 1 - Hero
  hero_h1?: string;
  answer_block?: string;
  hero_cta?: string;
  hero_image?: IndustryImage;
  
  // Section 2 - The problem
  problem_heading?: string;
  problem_intro?: string;
  problem_points?: string[];
  problem_stat?: IndustryStat;
  
  // Section 3 - What Frosty does
  capabilities_heading?: string;
  capabilities_intro?: string;
  capabilities_presale?: string[];
  capabilities_aftersale?: string[];
  capabilities_leadmgmt?: string[];
  capabilities_language?: string;
  languages?: string[];
  
  // Section 4 - Real conversations
  conversations_heading?: string;
  conversations_intro?: string;
  conversations?: Conversation[];
  
  // Section 5 - Built for
  builtfor_heading?: string;
  segments?: Segment[];
  why_points?: WhyPoint[];
  
  // Section 6 - Proof
  proof_render?: boolean;
  proof_heading?: string | null;
  proof_type?: string | null;
  proof_body?: string | null;
  proof_source?: string | null;
  
  // Section 7 - Getting started
  started_heading?: string;
  setup_steps?: SetupStep[];
  pricing_summary?: string;
  pricing_link?: string;
  
  // Section 8 - FAQ
  faq_heading?: string;
  faqs?: Faq[];
  
  // Section 9 - Related
  related_solutions?: RelatedSolution[];
  related_reading?: RelatedReading[];
  
  images?: IndustryImage[];
  schema_types?: string[];
  published_date?: string;
  updated_date?: string;
}

export const VALID_LOCALES = ['en-in', 'en-us', 'en-gb', 'en-ae'];

export function getIndustries(): Industry[] {
  return (industriesData as any[]).map((ind) => ({
    ...ind,
    slug: ind.industry_slug || ind.slug,
    icon: iconMap[ind.iconName] || Heart // fallback icon
  }));
}

export function getUniqueIndustries(): Industry[] {
  const all = getIndustries();
  const unique: Industry[] = [];
  const seen = new Set<string>();
  
  for (const ind of all) {
    if (!seen.has(ind.slug)) {
      seen.add(ind.slug);
      unique.push(ind);
    }
  }
  
  return unique;
}

export function getIndustryBySlugAndMarket(slug: string, market: string): Industry | undefined {
  return getIndustries().find((ind) => ind.slug === slug && ind.market === market);
}

export function getIndustryBySlug(slug: string): Industry | undefined {
  return getIndustryBySlugAndMarket(slug, 'neutral');
}

export function buildHreflangCluster(slug: string): IndustryHreflang[] {
  const matchingIndustries = getIndustries().filter(ind => ind.slug === slug && ind.canonical_url);
  
  return matchingIndustries.map(ind => {
    return {
      lang: ind.market === 'neutral' ? 'x-default' : ind.market!,
      url: ind.canonical_url!
    };
  });
}
