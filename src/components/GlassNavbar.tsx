'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLogo from '@/components/BrandLogo';
import { ChevronDown, ArrowRight } from 'lucide-react';
import { getUniqueIndustries } from '@/lib/industries';

interface GlassNavbarProps {
  ready?: boolean;
  solidBg?: boolean;
}

export default function GlassNavbar({ ready = true, solidBg = false }: GlassNavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on scroll
  useEffect(() => {
    if (mobileMenuOpen) {
      const handleScrollClose = () => setMobileMenuOpen(false);
      window.addEventListener('scroll', handleScrollClose, { once: true });
      return () => window.removeEventListener('scroll', handleScrollClose);
    }
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: 'Product', href: '/#what-is-frosty' },
    { 
      name: 'Solutions', 
      href: '#',
      hasDropdown: true,
      dropdownItems: getUniqueIndustries().slice(0, 10)
    },
    { name: 'How It Works', href: '/#how' },
    { name: 'Resources', href: '/resources' },
    { name: 'About', href: '/about' },
    { name: 'Pricing', href: '/#pricing' },
    { name: 'FAQ', href: '/faq' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 w-full transition-colors duration-300 ${
        solidBg ? 'bg-white border-b border-slate-200/90 shadow-xs' : ''
      }`}
    >
      <nav
        className="w-full flex items-center justify-between px-3.5 sm:px-6 lg:px-8 py-2.5 md:py-3 relative"
        style={{
          background: solidBg ? '#FFFFFF' : 'transparent',
          backdropFilter: solidBg ? 'none' : 'blur(8px)',
          WebkitBackdropFilter: solidBg ? 'none' : 'blur(8px)',
          borderBottom: solidBg ? 'none' : '1px solid rgba(28, 25, 23, 0.04)',
        }}
      >
        {/* ── Left: Brand Logo ── */}
        <div className="flex flex-1 justify-start min-w-0">
        <Link
          href="/"
          className="flex items-center group cursor-pointer focus:outline-none"
          aria-label="Frosty Homepage"
        >
          <BrandLogo ready={ready} />
          </Link>
        </div>

        {/* ── Center: Desktop Navigation Links ── */}
        <div className="hidden md:flex flex-none items-center justify-center gap-1 lg:gap-2">
          {navLinks.map((link) => (
            link.hasDropdown ? (
              <div key={link.name} className="relative group">
                <button
                  className="flex items-center gap-1 text-[14px] lg:text-[15px] font-medium text-stone-700 hover:text-stone-950 px-4 py-2 rounded-full hover:bg-black/[0.04] transition-all duration-200"
                >
                  {link.name}
                  <ChevronDown className="w-4 h-4 text-stone-500 group-hover:text-stone-900 transition-transform duration-200 group-hover:rotate-180" />
                </button>
                
                {/* Dropdown Menu */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="bg-white rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] border border-stone-200/60 p-4 w-[480px] flex flex-col gap-1 relative before:absolute before:-top-[1px] before:left-1/2 before:-translate-x-1/2 before:w-6 before:h-6 before:bg-white before:rotate-45 before:-z-10 before:border-l before:border-t before:border-stone-200/60">
                    <div className="px-3 pb-2 pt-1 border-b border-stone-100 mb-2">
                      <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">By Industry</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                      {link.dropdownItems?.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.slug + '-' + (item.market || 'neutral')}
                            href={`/industries/${item.slug}`}
                            className="flex items-start gap-3 p-3 rounded-xl hover:bg-stone-50 transition-colors group/item"
                          >
                            <div className="w-9 h-9 rounded-lg bg-[#0396A6]/10 flex items-center justify-center shrink-0 mt-0.5">
                              {Icon && <Icon className="w-4 h-4 text-[#0396A6]" />}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[14px] font-semibold text-stone-800 group-hover/item:text-[#0396A6] transition-colors">{item.name}</span>
                              <span className="text-[12px] text-stone-500 line-clamp-1">{item.desc}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                    <div className="mt-2 pt-2 border-t border-stone-100">
                      <Link href="/industries" className="flex items-center justify-center gap-2 text-sm font-semibold text-[#0396A6] hover:text-[#027D8A] p-2 transition-colors">
                        View all 50+ industries <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={link.name}
                href={link.href}
                className="text-[14px] lg:text-[15px] font-medium text-stone-700 hover:text-stone-950 px-4 py-2 rounded-full hover:bg-black/[0.04] transition-all duration-200"
              >
                {link.name}
              </Link>
            )
          ))}
        </div>

        {/* ── Right: Auth & CTA Buttons ── */}
        <div className="hidden md:flex flex-1 justify-end items-center gap-3">
          <Link
            href="/login"
            className="text-[14px] lg:text-[15px] font-semibold text-stone-800 hover:text-[#0396A6] px-4 py-2 rounded-full hover:bg-black/[0.04] transition-all duration-200"
          >
            Log in
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center text-[14px] lg:text-[15px] font-semibold !text-white px-5 py-2.5 rounded-full transition-all duration-300 hover:scale-[1.03] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #027D8A 0%, #0396A6 100%)',
              boxShadow: '0 4px 14px rgba(3, 150, 166, 0.25)',
            }}
          >
            Start free trial
          </Link>
        </div>

        {/* ── Mobile Hamburger Button ── */}
        <button
          className="flex md:hidden flex-col justify-center items-center gap-[5px] rounded-full transition-all duration-200 shrink-0 ml-2"
          style={{
            width: '36px',
            height: '36px',
            minWidth: '36px',
            minHeight: '36px',
            maxWidth: '36px',
            maxHeight: '36px',
            borderRadius: '9999px',
            aspectRatio: '1 / 1',
            flexShrink: 0,
            background: 'rgba(28, 25, 23, 0.04)',
            border: '1px solid rgba(28, 25, 23, 0.08)',
          }}
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileMenuOpen}
        >
          <span
            style={{
              width: 18,
              height: 2,
              background: '#18181B',
              borderRadius: 2,
              display: 'block',
              transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), margin 0.3s',
              transform: mobileMenuOpen ? 'rotate(45deg) translate(2.5px, 2.5px)' : 'none',
            }}
          />
          <span
            style={{
              width: 18,
              height: 2,
              background: '#18181B',
              borderRadius: 2,
              display: 'block',
              transition: 'opacity 0.25s',
              opacity: mobileMenuOpen ? 0 : 1,
            }}
          />
          <span
            style={{
              width: 18,
              height: 2,
              background: '#18181B',
              borderRadius: 2,
              display: 'block',
              transition: 'transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), margin 0.3s',
              transform: mobileMenuOpen ? 'rotate(-45deg) translate(2.5px, -2.5px)' : 'none',
            }}
          />
        </button>
      </nav>

      {/* ── Mobile Menu Floating Drawer ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="md:hidden pointer-events-auto absolute left-3 right-3 sm:left-4 sm:right-4 top-full mt-2"
            style={{
              background: 'rgba(255, 255, 255, 0.96)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              borderRadius: '20px',
              border: '1px solid rgba(28, 25, 23, 0.08)',
              boxShadow: '0 20px 40px -10px rgba(28, 25, 23, 0.1)',
              padding: '18px 20px 22px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              maxHeight: 'calc(100vh - 80px)',
              overflowY: 'auto',
            }}
          >
            {navLinks.map((link) => (
              link.hasDropdown ? (
                <div key={link.name} className="flex flex-col">
                  <div className="text-[16px] font-semibold text-stone-800 px-4 py-2.5">
                    {link.name}
                  </div>
                  <div className="flex flex-col pl-4 gap-1 border-l-2 border-stone-100 ml-4 mb-2">
                    {link.dropdownItems?.map((item) => {
                      const Icon = item.icon;
                      return (
                      <Link
                            key={item.slug + '-' + (item.market || 'neutral')}
                        href={`/industries/${item.slug}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-[15px] font-medium text-stone-600 hover:text-[#0396A6] px-4 py-2 rounded-xl hover:bg-black/[0.04] transition-colors flex items-center gap-2"
                      >
                        {Icon && <Icon className="w-4 h-4 opacity-50" />}
                        {item.name}
                      </Link>
                    )})}
                    <Link
                      href="/industries"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-[14px] font-semibold text-[#0396A6] px-4 py-2 rounded-xl hover:bg-black/[0.04] transition-colors flex items-center gap-1 mt-1"
                    >
                      View all 50+ industries <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ) : (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-[16px] font-medium text-stone-800 hover:text-[#0396A6] px-4 py-2.5 rounded-xl hover:bg-black/[0.04] transition-colors"
                >
                  {link.name}
                </Link>
              )
            ))}

            <div className="h-px bg-stone-200/80 my-1" />

            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-[15px] font-semibold text-stone-800 hover:text-[#0396A6] px-4 py-2.5 rounded-xl bg-black/[0.03] text-center"
            >
              Log in
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-[15px] font-semibold !text-white px-4 py-2.5 rounded-xl text-center shadow-md shadow-[#0396A6]/25 transition-transform active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #027D8A 0%, #0396A6 100%)',
              }}
            >
              Start free trial
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
