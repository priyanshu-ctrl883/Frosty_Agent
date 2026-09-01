import { notFound } from 'next/navigation';
import { getIndustryBySlugAndMarket, buildHreflangCluster } from '@/lib/industries';
import type { Metadata } from 'next';
import { IndustryPageContent } from '@/components/industry/IndustryPageContent';

interface Props {
  params: Promise<{ slug: string }>;
}

import industriesData from '@/data/industries.json';

export async function generateStaticParams() {
  return industriesData.filter(i => !i.market || i.market === 'neutral').map(i => ({ slug: i.slug || i.industry_slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const industry = getIndustryBySlugAndMarket(resolvedParams.slug, 'neutral');
  
  if (!industry) {
    return {
      title: 'Industry Not Found',
    };
  }

  const hreflangCluster = buildHreflangCluster(resolvedParams.slug);

  // Construct hreflang cluster for Alternate Links
  const alternates: any = {
    canonical: industry.canonical_url || `https://frostyagent.com/industries/${industry.slug}/`,
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

export default async function IndustryPage({ params }: Props) {
  const resolvedParams = await params;
  const rawIndustry = getIndustryBySlugAndMarket(resolvedParams.slug, 'neutral');

  if (!rawIndustry) {
    notFound();
  }

  const industry = { ...rawIndustry, icon: undefined as any };

  return <IndustryPageContent industry={industry} />;
}

