import { notFound } from 'next/navigation';
import { getIndustryBySlugAndMarket, buildHreflangCluster, VALID_LOCALES } from '@/lib/industries';
import type { Metadata } from 'next';
import { IndustryPageContent } from '@/components/industry/IndustryPageContent';

interface Props {
  params: Promise<{ slug: string; locale: string }>;
}

import industriesData from '@/data/industries.json';

export async function generateStaticParams() {
  return industriesData.filter(i => i.market && i.market !== 'neutral').map(i => ({ locale: i.market.toLowerCase(), slug: i.slug || i.industry_slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const { slug, locale } = resolvedParams;

  if (!VALID_LOCALES.includes(locale)) {
    return {
      title: 'Not Found',
    };
  }

  const industry = getIndustryBySlugAndMarket(slug, locale);
  
  if (!industry) {
    return {
      title: 'Industry Not Found',
    };
  }

  const hreflangCluster = buildHreflangCluster(slug);

  // Construct hreflang cluster for Alternate Links
  const alternates: any = {
    canonical: industry.canonical_url || `https://frostyagent.com/${locale}/industries/${industry.slug}/`,
    languages: {}
  };

  if (hreflangCluster && hreflangCluster.length > 0) {
    hreflangCluster.forEach(href => {
      alternates.languages[href.lang] = href.url;
    });
  }

  return {
    title: industry.meta_title || `${industry.name} AI Agent | Frosty`,
    description: industry.meta_description || industry.answer_block || industry.desc,
    alternates,
  };
}

export default async function LocaleIndustryPage({ params }: Props) {
  const resolvedParams = await params;
  const { slug, locale } = resolvedParams;

  if (!VALID_LOCALES.includes(locale)) {
    notFound();
  }

  const rawIndustry = getIndustryBySlugAndMarket(slug, locale);

  if (!rawIndustry) {
    notFound();
  }

  const industry = { ...rawIndustry, icon: undefined as any };

  return <IndustryPageContent industry={industry} />;
}

