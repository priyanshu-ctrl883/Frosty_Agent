import React from 'react';
import GlassNavbar from '@/components/GlassNavbar';
import FooterSection from '@/app/(marketing)/FooterSection';

// The 9 Sections
import { IndustryHero } from '@/components/industry/IndustryHero';
import { IndustryProblem } from '@/components/industry/IndustryProblem';
import { IndustryCapabilities } from '@/components/industry/IndustryCapabilities';
import { GlassChatDemo } from '@/components/industry/GlassChatDemo';
import { IndustrySegments } from '@/components/industry/IndustrySegments';
import { IndustryProof } from '@/components/industry/IndustryProof';
import { IndustryGettingStarted } from '@/components/industry/IndustryGettingStarted';
import { GlassFAQ } from '@/components/industry/GlassFAQ';
import { IndustryRelated } from '@/components/industry/IndustryRelated';

import { Industry } from '@/lib/industries';

interface Props {
  industry: Industry;
}

export function IndustryPageContent({ industry }: Props) {
  // JSON-LD Generation
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": industry.name,
    "serviceType": `AI Agent for ${industry.name}`,
    "description": industry.meta_description || industry.desc,
    "provider": {
      "@type": "Organization",
      "name": "Frosty Agent",
      "url": "https://frostyagent.com"
    },
    "areaServed": "Worldwide"
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": industry.faqs?.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    })) || []
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://frostyagent.com/"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Industries",
        "item": "https://frostyagent.com/industries/"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": industry.name,
        "item": industry.canonical_url || `https://frostyagent.com/industries/${industry.slug}/`
      }
    ]
  };

  return (
    <div className="frosty-root relative" style={{ backgroundColor: '#FAFAFA', minHeight: '100vh', color: '#18181B' }}>
      
      {/* Inject JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <GlassNavbar ready={true} solidBg={true} />
      
      <main className="flex flex-col">
        {/* Section 1 */}
        <IndustryHero industry={industry} />
        
        {/* Section 2 */}
        <IndustryProblem industry={industry} />
        
        {/* Section 3 */}
        <IndustryCapabilities industry={industry} />
        
        {/* Section 4 */}
        <GlassChatDemo 
          heading={industry.conversations_heading}
          intro={industry.conversations_intro}
          conversations={industry.conversations}
        />
        
        {/* Section 5 */}
        <IndustrySegments industry={industry} />
        
        {/* Section 6 */}
        <IndustryProof industry={industry} />
        
        {/* Section 7 */}
        <IndustryGettingStarted industry={industry} />
        
        {/* Section 8 */}
        <GlassFAQ industry={industry} />
        
        {/* Section 9 */}
        <IndustryRelated industry={industry} />
      </main>

      <FooterSection />
    </div>
  );
}
