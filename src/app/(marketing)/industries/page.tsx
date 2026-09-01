import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getIndustries } from '@/lib/industries';
import GlassNavbar from '@/components/GlassNavbar';
import FooterSection from '@/app/(marketing)/FooterSection';

export const metadata: Metadata = {
  title: 'Industries | Frosty Agent',
  description: 'See how Frosty Agent automates lead qualification and customer support for over 35 industries.',
  openGraph: {
    title: 'Industries | Frosty Agent',
    description: 'See how Frosty Agent automates lead qualification and customer support for over 35 industries.',
    type: 'website',
  },
};

export default function IndustriesHubPage() {
  const allIndustries = getIndustries();
  
  const grouped = new Map();
  allIndustries.forEach(ind => {
    const slug = ind.slug || ind.industry_slug;
    if (!grouped.has(slug)) grouped.set(slug, []);
    grouped.get(slug).push(ind);
  });

  const displayIndustries: any[] = [];
  grouped.forEach((entries, slug) => {
    const neutral = entries.find((e: any) => e.market === 'neutral');
    if (neutral) {
      displayIndustries.push({ ...neutral, displayName: neutral.name });
    } else {
      const regional = entries[0];
      let countryLabel = '';
      if (regional.market === 'en-in') countryLabel = ' (India)';
      else if (regional.market === 'en-us') countryLabel = ' (US)';
      else if (regional.market === 'en-gb') countryLabel = ' (UK)';
      else if (regional.market === 'en-ae') countryLabel = ' (UAE)';
      
      displayIndustries.push({ ...regional, displayName: `${regional.name}${countryLabel}` });
    }
  });

  return (
    <>
      <GlassNavbar ready={true} solidBg={true} />
      <main className="min-h-screen bg-stone-50 pb-24 pt-32 selection:bg-[#0396A6]/20">
        {/* Hero Section */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20 text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#0396A6]/5 blur-[120px] rounded-full pointer-events-none -z-10" />
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-stone-900 mb-6">
            Built for <span className="text-[#0396A6]">Your Industry</span>
          </h1>
          <p className="text-lg md:text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed">
            Discover how Frosty Agent handles complex workflows, qualifies high-ticket leads, and books appointments across specific sectors.
          </p>
        </section>

        {/* Grid Section */}
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayIndustries.map((ind) => {
              const Icon = ind.icon;
              const slug = ind.slug || ind.industry_slug;
              return (
                <Link
                  key={slug}
                  href={`/industries/${slug}`}
                  className="group relative flex flex-col bg-white p-8 rounded-3xl border border-stone-200/60 shadow-sm hover:shadow-xl hover:shadow-[#0396A6]/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0396A6]/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="w-14 h-14 rounded-2xl bg-[#0396A6]/10 flex items-center justify-center mb-6 text-[#0396A6] group-hover:scale-110 group-hover:bg-[#0396A6] group-hover:text-white transition-all duration-300 relative z-10">
                    {Icon ? (
                      <Icon className="w-7 h-7" />
                    ) : (
                      <div className="w-7 h-7 bg-current rounded-sm opacity-50" />
                    )}
                  </div>
                  
                  <h2 className="text-xl font-bold text-stone-900 mb-3 relative z-10 group-hover:text-[#0396A6] transition-colors">
                    {ind.displayName}
                  </h2>
                  
                  <p className="text-stone-500 mb-8 flex-grow relative z-10 leading-relaxed text-[15px]">
                    {ind.desc}
                  </p>
                  
                  <div className="flex items-center text-[#0396A6] font-semibold text-sm relative z-10 group/btn">
                    Explore solution 
                    <ArrowRight className="w-4 h-4 ml-1.5 group-hover/btn:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <FooterSection />
    </>
  );
}
