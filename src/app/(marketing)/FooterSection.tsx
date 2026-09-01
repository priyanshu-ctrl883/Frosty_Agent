'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FrostyAgentLogo } from '@/components/FrostyAgentLogo';
import { usePathname } from 'next/navigation';
import { MapPin, ExternalLink } from 'lucide-react';

const FlipText = ({ children, className, style }: { children: React.ReactNode, className?: string, style?: React.CSSProperties }) => (
  <span className={className} style={style}>{children}</span>
);

const NAV_ITEMS = [
  {
    label: 'Products',
    megaMenu: [
      {
        items: [
          { name: 'Frosty Web Agent', href: '/#two-agents' },
          { name: 'Frosty WhatsApp Agent', href: '/#two-agents' },
          { name: 'Unified Channels', href: '/#unified-channels' },
          { name: 'CRM & Lead Intelligence', href: '/#crm' }
        ]
      }
    ]
  },
  {
    label: 'Solutions',
    megaMenu: [
      {
        items: [
          { name: 'Campaign Attribution', href: '/solutions/campaign-attribution/' },
          { name: 'AI Quotations', href: '/solutions/ai-quotations/' },
          { name: 'Lead Re-engagement', href: '/solutions/follow-up-re-engagement/' },
          { name: 'Voice Notes', href: '/solutions/voice-notes/' }
        ]
      }
    ]
  }
];

const COMPANY_INFO = {
  name: "Frostrek",
  address: "4th Floor, Jmd Empire, 455, Golf Course Ext Rd, Sector 62, Gurugram, Haryana 122102, India",
  contact: "Info@frostyagent.com",
  socials: {
    linkedin: "https://www.linkedin.com/company/frostrek/",
    instagram: "https://www.instagram.com/frostrekai",
    whatsapp: "https://wa.me/916399999955",
    facebook: "https://www.facebook.com/people/Frostrek-Ai/pfbid0VrxpmzPP7zNRjztYScYUHgSVp1vYcryckLy7hY2jbe9jRnLXoC2KgSJWDzAD9irWl/",
    youtube: "https://www.youtube.com/@frostrekai"
  }
};

const FooterSection = () => {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();
  const [isVisible, setIsVisible] = useState(false);

  const footerRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  const handleLocationClick = () => {
    window.open('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(COMPANY_INFO.address), '_blank');
  };

  return (
    <>
      <style>{`
        @keyframes footerReveal { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes underlineExpand { from { width: 0; } to { width: 100%; } }
        @keyframes linkFadeIn { from { opacity: 0; transform: translateX(-4px); } to { opacity: 1; transform: translateX(0); } }

        .footer-revealed { animation: footerReveal 300ms ease-out forwards; }
        .section-title { position: relative; display: inline-block; }
        .section-title::after { content: ''; position: absolute; bottom: -3px; left: 0; height: 2px; background: #0396A6; width: 0; }
        .footer-revealed .section-title::after { animation: underlineExpand 400ms ease-out 150ms forwards; }
        .footer-link { position: relative; display: inline-block; transition: color 150ms ease-out; }
        .footer-link::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 100%; height: 1px; background: currentColor; transform: scaleX(0); transform-origin: left; transition: transform 200ms ease-out; }
        .footer-link:hover::after { transform: scaleX(1); }
        .footer-revealed .footer-link { animation: linkFadeIn 300ms ease-out forwards; }
      `}</style>

      <footer
        ref={footerRef}
        className={`border-t pt-5 pb-2.5 transition-colors duration-300 font-sans ${isVisible ? 'footer-revealed' : 'opacity-0'} bg-white/70 backdrop-blur-md border-slate-200 relative z-10`}
      >
        <div className="container mx-auto px-4 md:px-6 max-w-[1400px]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-5 mb-3 items-start">

            {/* Left Brand + Certifications + Socials */}
            <div className="lg:col-span-3 flex flex-col space-y-3">
              <div className="flex flex-col items-start gap-0.5 group">
                <Link href="/" className="flex items-center cursor-pointer">
                  <div className="transition-transform group-hover:scale-105 -ml-1">
                    <FrostyAgentLogo height={44} variant="full" />
                  </div>
                </Link>
                <div className="flex flex-col justify-center pl-1">
                  <a
                    href="https://www.frostrek.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-medium !text-slate-500 hover:!text-[#0396A6] mt-0.5 transition-colors relative z-20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Powered by Frostrek
                  </a>
                </div>
              </div>

              <div className="flex flex-col w-full max-w-[320px] gap-2.5">
                {/* 1. Upper Row: ISO / Compliance Certifications */}
                <div className="flex items-center gap-2.5">
                  <div
                    aria-label="ISO 27001:2022 Certified"
                    className="w-8 h-8 rounded-full bg-white/90 border border-slate-200/80 hover:bg-[#0070BA]/10 hover:border-[#0070BA]/50 hover:shadow-[0_0_12px_rgba(0,112,186,0.35)] shadow-2xs flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5 hover:scale-110 active:scale-95 cursor-pointer group shrink-0"
                  >
                    <img
                      src="/ISO 27001.png"
                      alt="ISO 27001"
                      className="w-5 h-5 object-contain transition-transform duration-300 group-hover:scale-110 shrink-0"
                      loading="lazy"
                    />
                  </div>

                  <div
                    aria-label="GDPR-ready"
                    className="w-8 h-8 rounded-full bg-white/90 border border-slate-200/80 hover:bg-[#003399]/10 hover:border-[#003399]/50 hover:shadow-[0_0_12px_rgba(0,51,153,0.35)] shadow-2xs flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5 hover:scale-110 active:scale-95 cursor-pointer group shrink-0"
                  >
                    <img
                      src="/gdpr logo.jpg"
                      alt="GDPR-ready"
                      className="w-5 h-5 object-cover rounded-full transition-transform duration-300 group-hover:scale-110 shrink-0"
                      loading="lazy"
                    />
                  </div>

                  <div
                    aria-label="ISO 9001:2015 Certified"
                    className="w-8 h-8 rounded-full bg-white/90 border border-slate-200/80 hover:bg-[#0070BA]/10 hover:border-[#0070BA]/50 hover:shadow-[0_0_12px_rgba(0,112,186,0.35)] shadow-2xs flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5 hover:scale-110 active:scale-95 cursor-pointer group shrink-0"
                  >
                    <img
                      src="/ISO_9001-2015.svg.webp"
                      alt="ISO 9001"
                      className="w-5 h-5 object-contain transition-transform duration-300 group-hover:scale-110 shrink-0"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* 2. Bottom Row: Social Links in exact order: mail -> phone -> whatsapp -> linkedin -> insta -> fb */}
                <div className="flex items-center gap-2.5">
                  {/* 1. Mail */}
                  <a
                    href={`mailto:${COMPANY_INFO.contact}`}
                    aria-label="Email"
                    className="w-8 h-8 rounded-full bg-white/90 border border-slate-200/80 hover:bg-[#EA4335]/10 hover:border-[#EA4335]/50 hover:shadow-[0_0_12px_rgba(234,67,53,0.35)] shadow-2xs flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5 hover:scale-110 active:scale-95 group shrink-0"
                  >
                    <img src="/gmail.png" alt="Gmail" className="w-4.5 h-4.5 object-contain transition-transform duration-300 group-hover:scale-110" loading="lazy" width={512} height={512} />
                  </a>

                  {/* 2. Phone */}
                  <a
                    href="tel:+916399999955"
                    aria-label="Call us"
                    className="w-8 h-8 rounded-full bg-white/90 border border-slate-200/80 hover:bg-[#1877F2]/10 hover:border-[#1877F2]/50 hover:shadow-[0_0_12px_rgba(24,119,242,0.35)] shadow-2xs flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5 hover:scale-110 active:scale-95 group shrink-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" className="transition-transform duration-300 group-hover:scale-110">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="#1877F2" />
                    </svg>
                  </a>

                  {/* 3. WhatsApp */}
                  <a
                    href={COMPANY_INFO.socials.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp"
                    className="w-8 h-8 rounded-full bg-white/90 border border-slate-200/80 hover:bg-[#25D366]/10 hover:border-[#25D366]/50 hover:shadow-[0_0_12px_rgba(37,211,102,0.35)] shadow-2xs flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5 hover:scale-110 active:scale-95 group shrink-0"
                  >
                    <img src="/whatsapp.png" alt="WhatsApp" className="w-4.5 h-4.5 object-contain transition-transform duration-300 group-hover:scale-110" loading="lazy" width={512} height={512} />
                  </a>

                  {/* 4. LinkedIn */}
                  <a
                    href={COMPANY_INFO.socials.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="LinkedIn"
                    className="w-8 h-8 rounded-full bg-white/90 border border-slate-200/80 hover:bg-[#0077B5]/10 hover:border-[#0077B5]/50 hover:shadow-[0_0_12px_rgba(0,119,181,0.35)] shadow-2xs flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5 hover:scale-110 active:scale-95 group shrink-0"
                  >
                    <img src="/linkedin.png" alt="Linkedin" className="w-4.5 h-4.5 object-contain transition-transform duration-300 group-hover:scale-110" loading="lazy" width={512} height={512} />
                  </a>

                  {/* 5. Instagram */}
                  <a
                    href={COMPANY_INFO.socials.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    className="w-8 h-8 rounded-full bg-white/90 border border-slate-200/80 hover:bg-[#E4405F]/10 hover:border-[#E4405F]/50 hover:shadow-[0_0_12px_rgba(228,64,95,0.35)] shadow-2xs flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5 hover:scale-110 active:scale-95 group shrink-0"
                  >
                    <img src="/instagram.png" alt="Instagram" className="w-4.5 h-4.5 object-contain transition-transform duration-300 group-hover:scale-110" loading="lazy" width={512} height={512} />
                  </a>

                  {/* 6. Facebook */}
                  <a
                    href={COMPANY_INFO.socials.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="w-8 h-8 rounded-full bg-white/90 border border-slate-200/80 hover:bg-[#1877F2]/10 hover:border-[#1877F2]/50 hover:shadow-[0_0_12px_rgba(24,119,242,0.35)] shadow-2xs flex items-center justify-center transition-all duration-300 hover:-translate-y-0.5 hover:scale-110 active:scale-95 group shrink-0"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="15" height="15" className="transition-transform duration-300 group-hover:scale-110">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>

            {/* Right Links & Map: 4 columns */}
            <div className="lg:col-span-9 grid grid-cols-2 md:grid-cols-4 gap-5 items-start">
              {/* Products (4 items) */}
              <div className="space-y-1.5">
                <h3 className="section-title font-bold text-[10px] uppercase tracking-widest text-[#0396A6]">Products</h3>
                <ul className="space-y-1 pt-0.5">
                  {NAV_ITEMS.find(n => n.label === 'Products')?.megaMenu?.flatMap(s => s.items).slice(0, 4).map(item => (
                    <li key={item.name}>
                      <Link href={item.href} className="footer-link text-[12.5px] font-medium text-slate-600 hover:text-[#0396A6] group">
                        <FlipText>{item.name}</FlipText>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Solutions (4 items) */}
              <div className="space-y-1.5">
                <h3 className="section-title font-bold text-[10px] uppercase tracking-widest text-[#0396A6]">Solutions</h3>
                <ul className="space-y-1 pt-0.5">
                  {NAV_ITEMS.find(n => n.label === 'Solutions')?.megaMenu?.flatMap(s => s.items).map(item => (
                    <li key={item.name}>
                      <Link href={item.href} className="footer-link text-[12.5px] font-medium text-slate-600 hover:text-[#0396A6] group">
                        <FlipText>{item.name}</FlipText>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Company (4 items) */}
              <div className="space-y-1.5">
                <h3 className="section-title font-bold text-[10px] uppercase tracking-widest text-[#0396A6]">Company</h3>
                <ul className="space-y-1 pt-0.5">
                  <li><Link href="/about" className="footer-link text-[12.5px] font-medium text-slate-600 hover:text-[#0396A6] group"><FlipText>About Us</FlipText></Link></li>
                  <li><Link href="/experience" className="footer-link text-[12.5px] font-medium text-slate-600 hover:text-[#0396A6] group"><FlipText>Experience</FlipText></Link></li>
                  <li><Link href="/faq" className="footer-link text-[12.5px] font-medium text-slate-600 hover:text-[#0396A6] group"><FlipText>FAQ</FlipText></Link></li>
                  <li><Link href="/contact" className="footer-link text-[12.5px] font-medium text-slate-600 hover:text-[#0396A6] group"><FlipText>Book Demo & Contact</FlipText></Link></li>
                </ul>
              </div>

              {/* Location Map Widget (Compact 4-row height) */}
              <div className="space-y-1.5">
                <div className="text-left">
                  <h3 className="section-title font-bold text-[10px] uppercase tracking-widest text-[#0396A6]">Location</h3>
                </div>
                <div
                  ref={locationRef}
                  onClick={handleLocationClick}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleLocationClick(); }}
                  className="relative w-full h-[110px] rounded-xl overflow-hidden shadow-2xs border border-slate-200 bg-slate-50 cursor-pointer transition-all duration-300 group hover:border-[#0396A6]/40 select-none mt-0.5"
                >
                  <svg className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-300" viewBox="0 0 400 200" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
                    <rect width="400" height="200" fill="#F8FAFC" />
                    <path d="M-20 60 C80 90, 160 30, 240 70 C320 110, 380 40, 420 80 L420 220 L-20 220 Z" fill="#EEF2F6" />
                    <path d="M-10 40 L410 160" stroke="#CBD5E1" strokeWidth="6" strokeLinecap="round" />
                    <path d="M120 -10 L190 210" stroke="#CBD5E1" strokeWidth="8" strokeLinecap="round" />
                    <path d="M-10 130 L410 70" stroke="#E2E8F0" strokeWidth="4" />
                    <path d="M280 -10 L250 210" stroke="#E2E8F0" strokeWidth="5" />
                    <path d="M-10 95 L410 115" stroke="#94A3B8" strokeWidth="3" strokeDasharray="4 4" />
                    <rect x="140" y="70" width="35" height="25" rx="3" fill="#0396A6" fillOpacity="0.1" />
                    <rect x="210" y="55" width="28" height="40" rx="3" fill="#0396A6" fillOpacity="0.1" />
                    <rect x="150" y="110" width="45" height="30" rx="3" fill="#0396A6" fillOpacity="0.1" />
                  </svg>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none -mt-2">
                    <span className="absolute w-9 h-9 rounded-full bg-[#0396A6]/20 animate-ping" />
                    <span className="absolute w-5 h-5 rounded-full bg-[#0396A6]/30" />
                    <div className="relative z-10 w-7 h-7 rounded-full bg-[#0396A6] text-white flex items-center justify-center shadow-[0_3px_8px_rgba(3,150,166,0.4)] transform group-hover:scale-110 transition-transform duration-300">
                      <MapPin size={14} className="text-white fill-white" />
                    </div>
                  </div>
                  <div className="absolute top-1.5 right-1.5 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold text-white bg-[#0396A6] px-1.5 py-0.5 rounded shadow-sm">
                      Map <ExternalLink size={8} />
                    </span>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 z-20">
                    <div className="px-2 py-1 rounded-md shadow-2xs backdrop-blur-md bg-white/95 border border-slate-200 text-slate-800 flex items-center gap-1 group-hover:border-[#0396A6]/50 transition-colors">
                      <MapPin size={10} className="text-[#0396A6] shrink-0" />
                      <span className="text-[10px] font-semibold truncate">JMD Empire, Sec 62, Gurugram</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11px] font-medium text-slate-400">
            <div>
              &copy; {currentYear} {COMPANY_INFO.name}. All rights reserved.
            </div>
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-slate-500">
              <Link href="/privacy" className="hover:text-[#0396A6] transition-colors">
                Privacy Policy
              </Link>
              <span className="text-slate-300" aria-hidden>·</span>
              <Link href="/terms" className="hover:text-[#0396A6] transition-colors">
                Terms of Service
              </Link>
              <span className="text-slate-300" aria-hidden>·</span>
              <Link href="/acceptable-use" className="hover:text-[#0396A6] transition-colors">
                Acceptable Use Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default FooterSection;
