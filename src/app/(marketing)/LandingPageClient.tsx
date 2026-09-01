'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import FooterSection from './FooterSection';
import ProblemSection from './ProblemSection';
import ProblemConclusion from './ProblemConclusion';
import WhatIsFrostySection from './WhatIsFrostySection';
import CostOfSlowSection from './CostOfSlowSection';
import TwoAgentsSection from './TwoAgentsSection';
import ItActsSection from './ItActsSection';
import IntroducingFrostySection from './IntroducingFrostySection';
import UnifiedChannelsSection from './UnifiedChannelsSection';
import CRMLeadIntelligenceSection from './CRMLeadIntelligenceSection';
import CapabilitiesSection from './CapabilitiesSection';
import DoneForYou from './DoneForYou';
import IndustriesSection from './IndustriesSection';
import PricingSection from './PricingSection';
import CTASection from './CTASection';
import GlassNavbar from '@/components/GlassNavbar';
import './FrostyPage.css';

const FrostyEngineHero = dynamic(() => import('@/components/FrostyEngineHero'), { ssr: false });
import LandingPageAura from '@/components/LandingPageAura';
import { ParallaxStarfield } from '@/components/FrostyEngineHero';

/* ─── useScrollReveal hook ────────────────────────────────────── */
function useScrollReveal() {
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed', 'is-visible', 'is-in');
                    } else {
                        entry.target.classList.remove('revealed', 'is-visible', 'is-in');
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        );
        document
            .querySelectorAll('[data-reveal], .fx-reveal')
            .forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);
}

export default function LandingPageClient() {
    useScrollReveal();

    return (
        <div
            suppressHydrationWarning
            className="frosty-root"
            style={{
                backgroundColor: '#FFFFFF',
                minHeight: '100vh',
                color: '#18181B',
                overflowX: 'hidden',
                position: 'relative',
            }}
        >
            <div className="relative z-10">
                {/* PREMIUM GLASSMORPHISM NAVBAR */}
                <GlassNavbar ready={true} />

                <motion.div style={{ paddingTop: 72, position: 'relative', zIndex: 20 }}>
                    <FrostyEngineHero />
                    <ProblemSection />
                    <CostOfSlowSection />
                    <ProblemConclusion />
                    <IntroducingFrostySection />
                    <WhatIsFrostySection />
                    <UnifiedChannelsSection />
                    <CRMLeadIntelligenceSection />
                    <TwoAgentsSection />
                    <ItActsSection />
                    <CapabilitiesSection />
                    <DoneForYou />
                    <IndustriesSection />
                    <PricingSection />
                    <CTASection />
                    <FooterSection />
                </motion.div>
            </div>
        </div>
    );
}
