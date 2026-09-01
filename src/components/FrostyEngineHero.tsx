"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Zap, Target, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import LiveProductTour from './LiveProductTour';

/* ─── ParallaxStarfield (Subtle background depth) ─────────────────── */
export function ParallaxStarfield() {
  return null;
}

const EASE = [0.23, 1, 0.32, 1] as const;
const PURPLE = '#0396A6';
const CORAL_ORANGE = '#FF7A5E';

/* ─── Hand-Drawn Animated Two-Stroke SVG Underline Curve ────────── */
function HandDrawnCurve() {
  return (
    <svg
      viewBox="0 0 270 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="absolute -bottom-3 left-0 w-full overflow-visible pointer-events-none"
      style={{ height: '16px' }}
    >
      <motion.path
        d="M 2 16 C 55 4, 140 2, 205 8 C 235 11, 258 14, 268 6"
        stroke={PURPLE}
        strokeWidth="3.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.3, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{
          filter: 'drop-shadow(0 2px 8px rgba(3, 150, 166, 0.35))',
        }}
      />
      <motion.path
        d="M 16 20 C 85 12, 175 11, 258 15"
        stroke={PURPLE}
        strokeWidth="1.9"
        strokeLinecap="round"
        opacity={0.35}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
      />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   SIX (6) DIVERSE INDUSTRY CONFIGURATIONS
   ═══════════════════════════════════════════════════════════════════ */

interface IndustryConfig {
  id: string;
  name: string;
  url: string;
  brand: string;
  domainSuffix: string;
  tagline: string;
  brandColor: string;
  chat: {
    q: string;
    a: string;
  };
}

const INDUSTRY_DATA: IndustryConfig[] = [
  /* 1. ECOMMERCE — TechMart */
  {
    id: 'techmart',
    name: 'E-commerce',
    url: 'www.techmart.in',
    brand: 'TechMart',
    domainSuffix: '.in',
    tagline: 'Electronics & Audio Gear',
    brandColor: '#FF7A5E',
    chat: {
      q: 'Do you have these headphones in black?',
      a: 'Yes! The Sony WH-1000XM5 is available in Matte Black with same-day express delivery and 1-year official warranty.',
    },
  },

  /* 2. EDTECH — Learnova */
  {
    id: 'learnova',
    name: 'EdTech / Education',
    url: 'www.learnova.in',
    brand: 'Learnova',
    domainSuffix: '.in',
    tagline: 'Modern Tech Academy',
    brandColor: '#FF7A5E',
    chat: {
      q: 'Which course should I take for Data Science?',
      a: "For beginners, I recommend Data Science Foundations by Dr. Emily Chen (4.9★, 14.2k learners). It covers Python, statistics, and machine learning.",
    },
  },

  /* 3. HEALTHCARE — CarePlus */
  {
    id: 'careplus',
    name: 'Healthcare / Telehealth',
    url: 'www.careplus.in',
    brand: 'CarePlus',
    domainSuffix: '.in',
    tagline: 'Specialist Clinic & Doctors',
    brandColor: '#0D9488',
    chat: {
      q: 'Can I book a cardiology appointment tomorrow?',
      a: 'Yes! Dr. Sarah Mehta has open video and in-clinic consultation slots tomorrow at 10:30 AM and 4:30 PM.',
    },
  },

  /* 4. FINTECH — Finora */
  {
    id: 'finora',
    name: 'Finance / FinTech',
    url: 'www.finora.in',
    brand: 'Finora',
    domainSuffix: '.in',
    tagline: 'Smart Banking & Wealth OS',
    brandColor: '#10B981',
    chat: {
      q: 'Which loan has the lowest interest rate?',
      a: 'Our Prime Personal Loan offers the lowest rate at 11.5% APR with flexible repayment, zero prepayment penalties, and instant disbursement.',
    },
  },

  /* 5. FOOD & RESTAURANT — BiteHouse */
  {
    id: 'bitehouse',
    name: 'Food & Dining',
    url: 'www.bitehouse.in',
    brand: 'BiteHouse',
    domainSuffix: '.in',
    tagline: 'Artisanal Kitchen & Bakery',
    brandColor: '#EA580C',
    chat: {
      q: 'What are your best vegetarian options?',
      a: 'Our top vegetarian favorites are the Smoked Burrata Bowl and the Truffle Wild Mushroom Sourdough Pizza! Both are freshly made.',
    },
  },

  /* 6. REAL ESTATE — Nestora */
  {
    id: 'nestora',
    name: 'Real Estate Marketplace',
    url: 'www.nestora.in',
    brand: 'Nestora',
    domainSuffix: '.in',
    tagline: 'Verified Urban Residences',
    brandColor: '#CA8A04',
    chat: {
      q: 'Show me 2BHK apartments.',
      a: 'We have the Sunlit 2 BHK Garden Flat in Indiranagar listed at ₹48 lakh, featuring 1,240 sq ft, east-facing balconies, and pool amenities.',
    },
  },
];

/* ═══════════════════════════════════════════════════════════════════
   1. ECOMMERCE WEBSITE UI (TechMart)
   ═══════════════════════════════════════════════════════════════════ */
function EcommerceLayout() {
  const products = [
    {
      title: 'Sony WH-1000XM5 ANC',
      sub: 'Matte Black · 30hr Battery',
      price: '₹24,990',
      oldPrice: '₹29,990',
      rating: 4.9,
      reviews: '2.8k',
      badge: '-17% OFF',
      image: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=500&q=80',
    },
    {
      title: 'Galaxy Watch Ultra',
      sub: 'Titanium · Dual GPS eSIM',
      price: '₹44,999',
      oldPrice: '₹49,999',
      rating: 4.7,
      reviews: '1.2k',
      badge: 'NEW',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=500&q=80',
    },
    {
      title: 'Marshall Stanmore III',
      sub: 'Vintage Bluetooth Acoustic',
      price: '₹39,999',
      oldPrice: '₹44,999',
      rating: 4.8,
      reviews: '950',
      badge: 'HOT',
      image: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=500&q=80',
    },
    {
      title: 'Canon EOS R6 Mark II',
      sub: '4K60 Pro Mirrorless Body',
      price: '₹1,69,990',
      oldPrice: '₹1,85,000',
      rating: 4.9,
      reviews: '410',
      badge: 'PRO',
      image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=500&q=80',
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#FAFAFA', fontSize: 11, fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#0F172A', color: '#FFF', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#FF7A5E' }}>⚡</span> TechMart
        </div>
        <div style={{ flex: 1, background: '#FFFFFF', borderRadius: 4, padding: '2.5px 7px', display: 'flex', alignItems: 'center', gap: 4, maxWidth: 190 }}>
          <span style={{ color: '#94A3B8', fontSize: 7.5 }}>🔍 Search electronics...</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 7.5 }}>
          <span style={{ color: '#E2E8F0' }}>Deals</span>
          <div style={{ background: '#FF7A5E', color: '#FFF', borderRadius: '50%', width: 14, height: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 7 }}>
            2
          </div>
        </div>
      </div>

      {/* Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg, #FF7A5E 0%, #0396A6 100%)', color: '#FFF', padding: '5px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 800 }}>Everything you need. One smarter store.</div>
          <div style={{ fontSize: 7, opacity: 0.9 }}>Flash Sale ⏳ · Free Express 24h Shipping</div>
        </div>
        <span style={{ fontSize: 14 }}>🎧</span>
      </div>

      {/* 2x2 Dense Product Grid */}
      <div style={{ flex: 1, padding: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 6, overflow: 'hidden' }}>
        {products.map((p) => (
          <div key={p.title} style={{ background: '#FFFFFF', borderRadius: 7, border: '1px solid #E2E8F0', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ position: 'relative', flex: '1 1 auto', minHeight: 105, width: '100%', overflow: 'hidden' }}>
              <img src={p.image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
              <div style={{ position: 'absolute', top: 4, left: 4, background: p.badge.includes('OFF') ? '#DC2626' : '#FF7A5E', color: '#FFF', fontSize: 6.5, fontWeight: 800, padding: '1.5px 5px', borderRadius: 2 }}>
                {p.badge}
              </div>
              <div style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', color: '#FFD700', fontSize: 6.5, fontWeight: 700, padding: '1.5px 5px', borderRadius: 2 }}>
                ★ {p.rating}
              </div>
            </div>
            <div style={{ padding: '5px 7px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0, borderTop: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 8.5, fontWeight: 700, color: '#0F172A', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
                <div style={{ fontSize: 7, color: '#64748B', flexShrink: 0 }}>({p.reviews})</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: 9.5, fontWeight: 800, color: '#0F172A' }}>{p.price}</span>
                  <span style={{ fontSize: 6.5, color: '#94A3B8', textDecoration: 'line-through', marginLeft: 3 }}>{p.oldPrice}</span>
                </div>
                <div style={{ background: '#FF7A5E', color: '#FFF', padding: '2.5px 7px', borderRadius: 3, fontSize: 6.5, fontWeight: 700 }}>
                  Add to Cart
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   2. EDTECH WEBSITE UI (Learnova)
   ═══════════════════════════════════════════════════════════════════ */
function EdTechLayout() {
  const courses = [
    {
      title: 'Data Science Foundations',
      instructor: 'Dr. Emily Chen · Stanford Fellow',
      meta: '42 hrs · 14.2k learners',
      rating: 4.9,
      badge: 'Bestseller ⭐',
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=500&q=80',
    },
    {
      title: 'Python for AI & Deep Learning',
      instructor: 'Alex Rivera · Staff Architect',
      meta: '36 hrs · 18.5k learners',
      rating: 4.9,
      badge: 'Popular 🚀',
      image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=500&q=80',
    },
    {
      title: 'Fullstack Next.js 15 & Cloud',
      instructor: 'Marcus Vance · Tech Lead',
      meta: '28 hrs · 9.4k learners',
      rating: 4.8,
      badge: 'Interactive 💻',
      image: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=500&q=80',
    },
    {
      title: 'UI/UX Design Systems & Figma',
      instructor: 'Elena Rostova · Principal Designer',
      meta: '22 hrs · 11.1k learners',
      rating: 4.9,
      badge: 'Top Rated 🎨',
      image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=500&q=80',
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#F8FAFC', fontSize: 11, fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#0A1A2F', color: '#FFF', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#38BDF8', fontSize: 13 }}>🎓</span> Learnova
        </div>
        <div style={{ display: 'flex', gap: 8, fontSize: 8, color: '#CBD5E1', marginLeft: 4 }}>
          <span style={{ color: '#38BDF8', fontWeight: 700 }}>Courses</span>
          <span>Programs</span>
          <span>For Teams</span>
        </div>
        <div style={{ marginLeft: 'auto', background: '#FF7A5E', color: '#FFF', padding: '2px 7px', borderRadius: 4, fontSize: 7.5, fontWeight: 700 }}>
          Explore Catalog
        </div>
      </div>

      {/* Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0A1A2F 0%, #0A1A2F 100%)', color: '#FFF', padding: '5px 12px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 800 }}>Build skills that move your career forward.</div>
          <div style={{ fontSize: 7, color: '#FFB09F' }}>2,500+ verified courses in Data Science, AI & Fullstack</div>
        </div>
        <span style={{ background: 'rgba(255,255,255,0.12)', color: '#38BDF8', padding: '1.5px 5px', borderRadius: 3, fontSize: 6.5, fontWeight: 700 }}>
          Certified
        </span>
      </div>

      {/* 2x2 Dense Course Grid */}
      <div style={{ flex: 1, padding: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 6, overflow: 'hidden' }}>
        {courses.map((c) => (
          <div key={c.title} style={{ background: '#FFFFFF', borderRadius: 7, border: '1px solid #E2E8F0', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ position: 'relative', flex: '1 1 auto', minHeight: 105, width: '100%', overflow: 'hidden' }}>
              <img src={c.image} alt={c.title} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
              <div style={{ position: 'absolute', top: 4, left: 4, background: '#FF7A5E', color: '#FFF', fontSize: 6.5, fontWeight: 800, padding: '1.5px 5px', borderRadius: 2 }}>
                {c.badge}
              </div>
              <div style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', color: '#FFD700', fontSize: 6.5, fontWeight: 700, padding: '1.5px 5px', borderRadius: 2 }}>
                ★ {c.rating}
              </div>
            </div>
            <div style={{ padding: '5px 7px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0, borderTop: '1px solid #F1F5F9' }}>
              <div style={{ fontSize: 8.5, fontWeight: 700, color: '#0F172A', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 6.8, color: '#64748B' }}>{c.meta}</span>
                <span style={{ background: '#FF7A5E', color: '#FFF', padding: '2.5px 7px', borderRadius: 3, fontSize: 6.5, fontWeight: 700 }}>
                  Start Learning
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   3. HEALTHCARE WEBSITE UI (CarePlus)
   ═══════════════════════════════════════════════════════════════════ */
function HealthcareLayout() {
  const doctors = [
    {
      name: 'Dr. Sarah Mehta, MD',
      specialty: 'Cardiologist · 16 Yrs Exp',
      hospital: 'Heart & Vascular Center',
      rating: 4.9,
      slot: 'Today · 10:30 AM, 4:30 PM',
      photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=500&q=80',
    },
    {
      name: 'Dr. Arvind Sen, MD',
      specialty: 'Neurologist · 14 Yrs Exp',
      hospital: 'Brain & Spine Institute',
      rating: 4.8,
      slot: 'Today · 11:30 AM, 3:00 PM',
      photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=500&q=80',
    },
    {
      name: 'Dr. Meera Patel, MD',
      specialty: 'Dermatologist · 11 Yrs Exp',
      hospital: 'Aesthetic Skin Clinic',
      rating: 4.9,
      slot: 'Tomorrow · 2:00 PM, 5:30 PM',
      photo: 'https://images.unsplash.com/photo-1594824813589-980753041935?auto=format&fit=crop&w=500&q=80',
    },
    {
      name: 'Dr. Rajesh Khanna, MD',
      specialty: 'Pediatrician · 18 Yrs Exp',
      hospital: 'Child Care Wing',
      rating: 4.9,
      slot: 'Today · 12:00 PM, 6:00 PM',
      photo: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=500&q=80',
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#F0FDFA', fontSize: 11, fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#042F2E', color: '#FFF', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#2DD4BF', fontSize: 13 }}>✚</span> CarePlus Health
        </div>
        <div style={{ display: 'flex', gap: 8, fontSize: 8, color: '#CCFBF1', marginLeft: 4 }}>
          <span style={{ color: '#2DD4BF', fontWeight: 700 }}>Find Doctor</span>
          <span>Specialties</span>
          <span>Video Consult</span>
        </div>
        <div style={{ marginLeft: 'auto', background: '#0D9488', color: '#FFF', padding: '2px 7px', borderRadius: 4, fontSize: 7.5, fontWeight: 700 }}>
          Emergency 24/7
        </div>
      </div>

      {/* Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg, #042F2E 0%, #115E59 100%)', color: '#FFF', padding: '5px 12px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 800 }}>Better care starts with the right doctor.</div>
          <div style={{ fontSize: 7, color: '#99F6E4' }}>Instant video and in-clinic consultation bookings</div>
        </div>
        <span style={{ background: '#2DD4BF22', color: '#2DD4BF', padding: '1.5px 5px', borderRadius: 3, fontSize: 6.5, fontWeight: 700 }}>
          Specialists
        </span>
      </div>

      {/* 2x2 Dense Doctor Grid */}
      <div style={{ flex: 1, padding: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 6, overflow: 'hidden' }}>
        {doctors.map((d) => (
          <div key={d.name} style={{ background: '#FFFFFF', borderRadius: 7, border: '1px solid #CCFBF1', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ position: 'relative', flex: '1 1 auto', minHeight: 105, width: '100%', overflow: 'hidden' }}>
              <img src={d.photo} alt={d.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%' }} />
              <div style={{ position: 'absolute', top: 4, left: 4, background: '#0D9488', color: '#FFF', fontSize: 6.5, fontWeight: 800, padding: '1.5px 5px', borderRadius: 2 }}>
                ★ {d.rating}
              </div>
              <div style={{ position: 'absolute', bottom: 4, left: 4, background: 'rgba(4, 47, 46, 0.85)', backdropFilter: 'blur(4px)', color: '#2DD4BF', fontSize: 6.5, fontWeight: 700, padding: '1.5px 5px', borderRadius: 2 }}>
                {d.specialty}
              </div>
            </div>
            <div style={{ padding: '5px 7px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0, borderTop: '1px solid #CCFBF1' }}>
              <div style={{ fontSize: 8.5, fontWeight: 700, color: '#042F2E', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 6.5, color: '#0F766E', fontWeight: 600 }}>🟢 {d.slot.split('·')[0]}</span>
                <span style={{ background: '#0D9488', color: '#FFF', padding: '2.5px 7px', borderRadius: 3, fontSize: 6.5, fontWeight: 700 }}>
                  Book Slot
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   4. FINTECH WEBSITE UI (Finora)
   ═══════════════════════════════════════════════════════════════════ */
function FinTechLayout() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#0B132B', color: '#FFF', fontSize: 11, fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#1C2541', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #2B3A67', flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#10B981', fontSize: 13 }}>◈</span> Finora Wealth
        </div>
        <div style={{ display: 'flex', gap: 8, fontSize: 8, color: '#A0AEC0', marginLeft: 4 }}>
          <span style={{ color: '#10B981', fontWeight: 700 }}>Dashboard</span>
          <span>Investments</span>
          <span>Loans</span>
        </div>
        <div style={{ marginLeft: 'auto', background: '#10B981', color: '#0B132B', padding: '2px 7px', borderRadius: 4, fontSize: 7.5, fontWeight: 800 }}>
          Verified ✓
        </div>
      </div>

      {/* Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1C2541 0%, #2B3A67 100%)', padding: '5px 12px', borderBottom: '1px solid #3A4E7A', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: '#FFF' }}>Make smarter decisions with your money.</div>
          <div style={{ fontSize: 7, color: '#A0AEC0' }}>Automated portfolio wealth & pre-approved loans</div>
        </div>
        <span style={{ background: '#10B98122', color: '#10B981', padding: '1.5px 5px', borderRadius: 3, fontSize: 6.5, fontWeight: 700 }}>
          NIFTY ▲ +1.4%
        </span>
      </div>

      {/* 2x2 Dense Financial Cards */}
      <div style={{ flex: 1, padding: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 6, overflow: 'hidden' }}>
        {/* Card 1: Portfolio */}
        <div style={{ background: '#1C2541', borderRadius: 7, border: '1px solid #2B3A67', padding: '7px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 7.5, color: '#A0AEC0', fontWeight: 600 }}>Total Portfolio</span>
            <span style={{ background: '#10B98122', color: '#10B981', fontSize: 6.5, fontWeight: 800, padding: '1.5px 4px', borderRadius: 2 }}>
              +12.8% this yr
            </span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF' }}>₹8,42,500</div>
          <div style={{ height: 35, width: '100%', margin: '1px 0' }}>
            <svg viewBox="0 0 160 35" fill="none" style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="finGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0 28 Q 40 22, 80 14 T 160 5 L 160 35 L 0 35 Z" fill="url(#finGrad)" />
              <path d="M0 28 Q 40 22, 80 14 T 160 5" stroke="#10B981" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 7, color: '#A0AEC0', paddingTop: 3, borderTop: '1px solid #2B3A67' }}>
            <span>Mutual Funds (65%)</span>
            <span style={{ color: '#10B981', fontWeight: 700 }}>Manage →</span>
          </div>
        </div>

        {/* Card 2: Credit Score */}
        <div style={{ background: '#1C2541', borderRadius: 7, border: '1px solid #2B3A67', padding: '7px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 7.5, color: '#A0AEC0', fontWeight: 600 }}>Credit Score</span>
            <span style={{ background: '#FF7A5E22', color: '#60A5FA', fontSize: 6.5, fontWeight: 800, padding: '1.5px 4px', borderRadius: 2 }}>
              Excellent
            </span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#60A5FA' }}>782</div>
          <div style={{ fontSize: 7, color: '#CBD5E1' }}>Pre-Approved: ₹5,00,000 limit</div>
          <div style={{ display: 'flex', gap: 3 }}>
            <span style={{ background: '#2B3A67', color: '#E2E8F0', padding: '1.5px 4px', borderRadius: 2, fontSize: 6.5 }}>✓ Instant KYC</span>
            <span style={{ background: '#2B3A67', color: '#E2E8F0', padding: '1.5px 4px', borderRadius: 2, fontSize: 6.5 }}>✓ 0% Fee</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 7, color: '#A0AEC0', paddingTop: 3, borderTop: '1px solid #2B3A67' }}>
            <span>CIBIL Verified</span>
            <span style={{ color: '#60A5FA', fontWeight: 700 }}>View Report</span>
          </div>
        </div>

        {/* Card 3: Personal Loan */}
        <div style={{ background: '#1C2541', borderRadius: 7, border: '1px solid #2B3A67', padding: '7px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 7.5, color: '#A0AEC0', fontWeight: 600 }}>Prime Loan</span>
            <span style={{ background: '#10B98122', color: '#10B981', fontSize: 6.5, fontWeight: 800, padding: '1.5px 4px', borderRadius: 2 }}>
              Lowest APR
            </span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#10B981' }}>11.5% APR</div>
          <div style={{ fontSize: 7, color: '#CBD5E1' }}>Flexible EMI from ₹2,450/mo · 0% prepayment</div>
          <div style={{ paddingTop: 3, borderTop: '1px solid #2B3A67' }}>
            <div style={{ background: '#10B981', color: '#0B132B', textAlign: 'center', padding: '2.5px 0', borderRadius: 3, fontSize: 7, fontWeight: 800 }}>
              Compare Plans
            </div>
          </div>
        </div>

        {/* Card 4: High-Yield FD */}
        <div style={{ background: '#1C2541', borderRadius: 7, border: '1px solid #2B3A67', padding: '7px 8px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 7.5, color: '#A0AEC0', fontWeight: 600 }}>Smart Fixed Deposit</span>
            <span style={{ background: '#F59E0B22', color: '#FBBF24', fontSize: 6.5, fontWeight: 800, padding: '1.5px 4px', borderRadius: 2 }}>
              High Yield
            </span>
          </div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#FBBF24' }}>+8.40% p.a.</div>
          <div style={{ fontSize: 7, color: '#CBD5E1' }}>RBI Insured up to ₹5L · Instant exit anytime</div>
          <div style={{ paddingTop: 3, borderTop: '1px solid #2B3A67' }}>
            <div style={{ background: '#2B3A67', color: '#FFF', textAlign: 'center', padding: '2.5px 0', borderRadius: 3, fontSize: 7, fontWeight: 700 }}>
              Invest Now
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   5. FOOD & RESTAURANT WEBSITE UI (BiteHouse)
   ═══════════════════════════════════════════════════════════════════ */
function FoodLayout() {
  const dishes = [
    {
      name: 'Truffle Mushroom Pizza',
      desc: 'Wild porcini · mozzarella · truffle oil',
      meta: '★★★★★ 4.8 · ⏱ 20m',
      badge: 'Chef Special ⭐',
      price: '₹620',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80',
    },
    {
      name: 'Smoked Burrata Bowl',
      desc: 'Heirloom tomatoes · basil pesto · glaze',
      meta: '★★★★★ 4.9 · ⏱ 15m',
      badge: 'Bestseller 🌿',
      price: '₹480',
      image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=500&q=80',
    },
    {
      name: 'Hand-Rolled Tagliatelle',
      desc: 'San Marzano slow-cooked tomato sauce',
      meta: '★★★★★ 4.7 · ⏱ 22m',
      badge: 'Handmade 🍝',
      price: '₹540',
      image: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281699?auto=format&fit=crop&w=500&q=80',
    },
    {
      name: 'Sicilian Pistachio Gelato',
      desc: 'Roasted pistachio & almond cream',
      meta: '★★★★★ 4.8 · ⏱ 10m',
      badge: 'Popular 🍨',
      price: '₹320',
      image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=500&q=80',
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#FFFDF9', fontSize: 11, fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#431407', color: '#FFF', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#F97316' }}>🍕</span> BiteHouse Kitchen
        </div>
        <div style={{ display: 'flex', gap: 8, fontSize: 8, color: '#FED7AA', marginLeft: 4 }}>
          <span style={{ color: '#F97316', fontWeight: 700 }}>Menu</span>
          <span>Pizzas</span>
          <span>Pastas</span>
        </div>
        <div style={{ marginLeft: 'auto', background: '#EA580C', padding: '2px 7px', borderRadius: 4, fontSize: 7.5, fontWeight: 700 }}>
          Cart 🛒 (2)
        </div>
      </div>

      {/* Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg, #FFEDD5 0%, #FED7AA 100%)', padding: '5px 12px', borderBottom: '1px solid #FDBA74', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 800, color: '#431407' }}>Handcrafted food, delivered fresh.</div>
          <div style={{ fontSize: 7, color: '#7C2D12' }}>Live Kitchen: 20–25 mins delivery 🛵 · 100% Organic</div>
        </div>
        <span style={{ background: '#15803D22', color: '#15803D', padding: '1.5px 5px', borderRadius: 3, fontSize: 6.5, fontWeight: 800 }}>
          Pure Veg 🟢
        </span>
      </div>

      {/* 2x2 Dense Food Grid */}
      <div style={{ flex: 1, padding: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 6, overflow: 'hidden' }}>
        {dishes.map((d) => (
          <div key={d.name} style={{ background: '#FFFFFF', borderRadius: 7, border: '1px solid #FED7AA', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ position: 'relative', flex: '1 1 auto', minHeight: 105, width: '100%', overflow: 'hidden' }}>
              <img src={d.image} alt={d.name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
              <div style={{ position: 'absolute', top: 4, left: 4, background: '#15803D', color: '#FFF', fontSize: 6.5, fontWeight: 800, padding: '1.5px 5px', borderRadius: 2 }}>
                {d.badge}
              </div>
            </div>
            <div style={{ padding: '5px 7px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0, borderTop: '1px solid #FED7AA' }}>
              <div style={{ fontSize: 8.5, fontWeight: 700, color: '#431407', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 9.5, fontWeight: 800, color: '#EA580C' }}>{d.price}</span>
                <span style={{ background: '#EA580C', color: '#FFF', padding: '2.5px 7px', borderRadius: 3, fontSize: 6.5, fontWeight: 700 }}>
                  Add to Order
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   6. REAL ESTATE WEBSITE UI (Nestora)
   ═══════════════════════════════════════════════════════════════════ */
function RealEstateLayout() {
  const properties = [
    {
      title: 'Modern 3 BHK Apartment',
      location: 'Gurgaon, Sector 54',
      specs: '3 Beds · 3 Baths · 1,850 sq ft',
      price: '₹1.85 Cr',
      image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=500&q=80',
    },
    {
      title: 'Sunlit 2 BHK Garden Flat',
      location: 'Indiranagar, Bangalore',
      specs: '2 Beds · 2 Baths · 1,240 sq ft',
      price: '₹48 Lakh',
      image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=500&q=80',
    },
    {
      title: 'Luxury 4 BHK Skyline Villa',
      location: 'Whitefield Gated Enclave',
      specs: '4 Beds · 4 Baths · 2,800 sq ft',
      price: '₹1.45 Cr',
      image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=500&q=80',
    },
    {
      title: 'Penthouse with Terrace',
      location: 'Koramangala, Bangalore',
      specs: '3 Beds · 3 Baths · 2,200 sq ft',
      price: '₹1.20 Cr',
      image: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=500&q=80',
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#FAFAFA', fontSize: 11, fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#18181B', color: '#FFF', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ color: '#EAB308', fontSize: 13 }}>⌂</span> Nestora
        </div>
        <div style={{ display: 'flex', gap: 8, fontSize: 8, color: '#A1A1AA', marginLeft: 4 }}>
          <span style={{ color: '#EAB308', fontWeight: 700 }}>Buy</span>
          <span>Rent</span>
          <span>Villas</span>
        </div>
        <div style={{ marginLeft: 'auto', background: '#CA8A04', color: '#FFF', padding: '2px 7px', borderRadius: 4, fontSize: 7.5, fontWeight: 700 }}>
          Schedule Visit
        </div>
      </div>

      {/* Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg, #18181B 0%, #27272A 100%)', color: '#FFF', padding: '5px 12px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 800 }}>Find a place that feels like home.</div>
          <div style={{ fontSize: 7, color: '#A1A1AA' }}>Verified luxury residences & villas — Zero Brokerage</div>
        </div>
        <div style={{ display: 'flex', gap: 3 }}>
          <span style={{ background: '#CA8A04', color: '#FFF', padding: '1.5px 5px', borderRadius: 3, fontSize: 6.5, fontWeight: 700 }}>Buy</span>
          <span style={{ background: 'rgba(255,255,255,0.1)', color: '#A1A1AA', padding: '1.5px 5px', borderRadius: 3, fontSize: 6.5 }}>Rent</span>
        </div>
      </div>

      {/* 2x2 Dense Property Grid */}
      <div style={{ flex: 1, padding: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', gap: 6, overflow: 'hidden' }}>
        {properties.map((p) => (
          <div key={p.title} style={{ background: '#FFFFFF', borderRadius: 7, border: '1px solid #E4E4E7', overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
            <div style={{ position: 'relative', flex: '1 1 auto', minHeight: 105, width: '100%', overflow: 'hidden' }}>
              <img src={p.image} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
              <div style={{ position: 'absolute', top: 4, left: 4, background: '#16A34A', color: '#FFF', fontSize: 6.5, fontWeight: 800, padding: '1.5px 5px', borderRadius: 2 }}>
                Verified ✓
              </div>
            </div>
            <div style={{ padding: '5px 7px', background: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0, borderTop: '1px solid #F4F4F5' }}>
              <div style={{ fontSize: 8.5, fontWeight: 700, color: '#18181B', lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 9.5, fontWeight: 800, color: '#CA8A04' }}>{p.price}</span>
                <span style={{ background: '#18181B', color: '#FFF', padding: '2.5px 7px', borderRadius: 3, fontSize: 6.5, fontWeight: 700 }}>
                  View Property
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   WEBSITE VIEWPORT SWITCHER
   ═══════════════════════════════════════════════════════════════════ */
function ActiveIndustryViewport({ industryId }: { industryId: string }) {
  switch (industryId) {
    case 'learnova':
      return <EdTechLayout />;
    case 'careplus':
      return <HealthcareLayout />;
    case 'finora':
      return <FinTechLayout />;
    case 'bitehouse':
      return <FoodLayout />;
    case 'nestora':
      return <RealEstateLayout />;
    case 'techmart':
    default:
      return <EcommerceLayout />;
  }
}

/* ─── Targeted Precision Cursor ─────────────────────────────────── */
function DirectCursor({
  pos,
  isClicking,
  isVisible,
}: {
  pos: { x: string; y: string };
  isClicking: boolean;
  isVisible: boolean;
}) {
  return (
    <motion.div
      animate={{ left: pos.x, top: pos.y, opacity: isVisible ? 1 : 0 }}
      transition={{
        left: { duration: 0.85, ease: EASE },
        top: { duration: 0.85, ease: EASE },
        opacity: { duration: 0.2 },
      }}
      style={{
        position: 'absolute',
        zIndex: 150,
        pointerEvents: 'none',
        width: 24,
        height: 24,
        transform: 'translate(-2px, -2px)',
      }}
    >
      <motion.svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        animate={{ scale: isClicking ? 0.76 : 1 }}
        transition={{ duration: 0.12 }}
      >
        <path
          d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.45 0 .67-.54.35-.85L5.85 2.36a.5.5 0 0 0-.35.85z"
          fill="#0F172A"
          stroke="#FFFFFF"
          strokeWidth="1.8"
        />
      </motion.svg>
      <AnimatePresence>
        {isClicking && (
          <motion.div
            key="click-pulse"
            initial={{ scale: 0, opacity: 0.7 }}
            animate={{ scale: 3.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.45 }}
            style={{
              position: 'absolute',
              top: 2,
              left: 2,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: 'rgba(3, 150, 166, 0.45)',
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Address Bar URL Typing Character-by-Character ───────────── */
function AddressBarUrlTyping({
  targetUrl,
  isTyping,
  onComplete,
}: {
  targetUrl: string;
  isTyping: boolean;
  onComplete: () => void;
}) {
  const [typedText, setTypedText] = useState('');
  const completedRef = useRef(false);

  useEffect(() => {
    if (!isTyping) {
      setTypedText('');
      completedRef.current = false;
      return;
    }

    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTypedText(targetUrl.slice(0, i));
      if (i >= targetUrl.length) {
        clearInterval(interval);
        if (!completedRef.current) {
          completedRef.current = true;
          setTimeout(onComplete, 260);
        }
      }
    }, 40 + Math.random() * 18);

    return () => clearInterval(interval);
  }, [isTyping, targetUrl, onComplete]);

  return (
    <span style={{ color: '#0F172A', fontWeight: 600, fontSize: 10 }}>
      {typedText}
      {isTyping && typedText.length < targetUrl.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.45, repeat: Infinity }}
          style={{
            display: 'inline-block',
            width: 1.5,
            height: 11,
            background: PURPLE,
            marginLeft: 1,
            verticalAlign: 'text-bottom',
          }}
        />
      )}
    </span>
  );
}

/* ─── Streamed Response Text with Word-by-Word Reveal ───────────── */
function StreamedText({
  content,
  onWordTick,
}: {
  content: string;
  onWordTick: () => void;
}) {
  const [renderedWords, setRenderedWords] = useState<string[]>([]);
  const words = content.split(' ');

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index++;
      setRenderedWords(words.slice(0, index));
      onWordTick();
      if (index >= words.length) {
        clearInterval(interval);
      }
    }, 38 + Math.random() * 18);

    return () => clearInterval(interval);
  }, [content, onWordTick]);

  return <span>{renderedWords.join(' ')}</span>;
}

/* ─── Isolated Chat Overlay with TALL VERTICAL HEIGHT ───────────── */
function FrostyIsolatedChat({
  isOpen,
  chatPhase,
  inputFieldValue,
  store,
  scrollRef,
  onAutoScroll,
}: {
  isOpen: boolean;
  chatPhase: number;
  inputFieldValue: string;
  store: IndustryConfig;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onAutoScroll: () => void;
}) {
  // STRICT LOCAL SCROLL: Only scrolls internal chat container, never window or page!
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatPhase, scrollRef]);

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.75, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 15 }}
            transition={{ duration: 0.4, ease: EASE }}
            style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              width: 260,
              maxWidth: 'calc(100% - 24px)',
              height: 355, // VERTICALLY BIG & TALL
              borderRadius: 14,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 90,
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(3, 150, 166, 0.18)',
              boxShadow:
                '0 24px 60px rgba(3, 150, 166, 0.25), 0 8px 24px rgba(0,0,0,0.1)',
            }}
          >
            {/* Header */}
            <div
              style={{
                background: `linear-gradient(135deg, ${PURPLE} 0%, #0396A6 100%)`,
                color: '#FFFFFF',
                padding: '9px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.22)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                }}
              >
                ❄️
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '-0.01em' }}>
                  Frosty AI
                </div>
                <div
                  style={{
                    fontSize: 7.5,
                    opacity: 0.9,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3.5,
                  }}
                >
                  <span
                    style={{
                      width: 4.5,
                      height: 4.5,
                      borderRadius: '50%',
                      background: '#34D399',
                    }}
                  />
                  Synced with {store.brand}
                </div>
              </div>
            </div>

            {/* Strictly Isolated Internal Scroll Container (Tall viewport) */}
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                padding: '11px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                overflowY: 'auto',
                scrollBehavior: 'smooth',
                maxHeight: 255,
              }}
            >
              {/* Welcome Message */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  alignSelf: 'flex-start',
                  maxWidth: '90%',
                  padding: '8px 12px',
                  borderRadius: '12px 12px 12px 3px',
                  background: '#F1F5F9',
                  color: '#1E293B',
                  fontSize: 9.5,
                  lineHeight: 1.4,
                  fontWeight: 500,
                }}
              >
                Hi! 👋 I'm Frosty. Ask me anything about {store.brand}!
              </motion.div>

              {/* User Question */}
              {chatPhase >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    alignSelf: 'flex-end',
                    maxWidth: '90%',
                    padding: '8px 12px',
                    borderRadius: '12px 12px 3px 12px',
                    background: PURPLE,
                    color: '#FFFFFF',
                    fontSize: 9.5,
                    lineHeight: 1.4,
                    fontWeight: 500,
                  }}
                >
                  {store.chat.q}
                </motion.div>
              )}

              {/* Bot Typing Dots */}
              {chatPhase === 3 && (
                <div
                  style={{
                    alignSelf: 'flex-start',
                    padding: '7px 12px',
                    borderRadius: '12px 12px 12px 3px',
                    background: '#F1F5F9',
                    display: 'flex',
                    gap: 3.5,
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 0.45, repeat: Infinity, delay: i * 0.12 }}
                      style={{ width: 4, height: 4, borderRadius: '50%', background: '#94A3B8' }}
                    />
                  ))}
                </div>
              )}

              {/* Bot Response Stream */}
              {chatPhase >= 4 && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    alignSelf: 'flex-start',
                    maxWidth: '90%',
                    padding: '8px 12px',
                    borderRadius: '12px 12px 12px 3px',
                    background: '#F1F5F9',
                    color: '#1E293B',
                    fontSize: 9.5,
                    lineHeight: 1.4,
                    fontWeight: 500,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                  }}
                >
                  <StreamedText content={store.chat.a} onWordTick={onAutoScroll} />
                </motion.div>
              )}
            </div>

            {/* Input Bar with Character Typing */}
            <div
              style={{
                padding: '7px 10px',
                borderTop: '1px solid rgba(0,0,0,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#FFFFFF',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  flex: 1,
                  background: inputFieldValue ? '#F1F5F9' : '#F8FAFC',
                  borderRadius: 6,
                  padding: '5.5px 9px',
                  fontSize: 9,
                  color: inputFieldValue ? '#0F172A' : '#94A3B8',
                  fontWeight: inputFieldValue ? 500 : 400,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  border: inputFieldValue ? `1px solid ${PURPLE}30` : '1px solid transparent',
                }}
              >
                {inputFieldValue || 'Ask Frosty a question...'}
                {inputFieldValue && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.45, repeat: Infinity }}
                    style={{
                      display: 'inline-block',
                      width: 1.5,
                      height: 9,
                      background: PURPLE,
                      marginLeft: 2,
                      verticalAlign: 'middle',
                    }}
                  />
                )}
              </div>
              <motion.div
                animate={{ scale: inputFieldValue ? 1.05 : 1 }}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: PURPLE,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Frosty Logo Button */}
      <motion.div
        animate={{
          boxShadow: [
            `0 4px 18px ${PURPLE}35, 0 0 0 0px ${PURPLE}20`,
            `0 4px 18px ${PURPLE}35, 0 0 0 7px ${PURPLE}06`,
            `0 4px 18px ${PURPLE}35, 0 0 0 0px ${PURPLE}20`,
          ],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          width: 38,
          height: 38,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${PURPLE} 0%, #0396A6 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 95,
        }}
      >
        <span style={{ fontSize: 17, lineHeight: 1 }}>❄️</span>
      </motion.div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DOMINANT INTERACTIVE BROWSER DEMO
   ═══════════════════════════════════════════════════════════════════ */
function DominantInteractiveBrowser() {
  const [storeIndex, setStoreIndex] = useState(0);
  const currentIndustry: IndustryConfig = INDUSTRY_DATA[storeIndex] || INDUSTRY_DATA[0]!;

  const [phase, setPhase] = useState(0);
  const [isUrlTyping, setIsUrlTyping] = useState(false);
  const [isSiteLoaded, setIsSiteLoaded] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatPhase, setChatPhase] = useState(0);
  const [inputFieldText, setInputFieldText] = useState('');

  // Targeted single cursor
  const [cursorPos, setCursorPos] = useState({ x: '30%', y: '4.5%' });
  const [cursorVisible, setCursorVisible] = useState(false);
  const [clicking, setClicking] = useState(false);
  const [loopKey, setLoopKey] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const timerPool = useRef<NodeJS.Timeout[]>([]);

  // Local scroll only
  const strictlyScrollInternalChat = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const clearAllTimers = useCallback(() => {
    timerPool.current.forEach((t) => clearTimeout(t));
    timerPool.current = [];
  }, []);

  const queueTimer = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timerPool.current.push(t);
  }, []);

  const onUrlFinished = useCallback(() => {
    queueTimer(() => setPhase(2), 150); // Enter pressed -> loading
    queueTimer(() => {
      setIsSiteLoaded(true);
      setPhase(3); // Website enters smoothly
    }, 700);
  }, [queueTimer]);

  const simulateCustomerTypingInInput = useCallback((fullText: string, onDone: () => void) => {
    let charIdx = 0;
    const interval = setInterval(() => {
      charIdx++;
      setInputFieldText(fullText.slice(0, charIdx));
      if (charIdx >= fullText.length) {
        clearInterval(interval);
        setTimeout(() => {
          onDone();
        }, 280);
      }
    }, 36 + Math.random() * 18);
  }, []);

  const runAnimationCycle = useCallback(() => {
    clearAllTimers();

    // 0. Reset to clean tab state
    setPhase(0);
    setIsUrlTyping(false);
    setIsSiteLoaded(false);
    setChatOpen(false);
    setChatPhase(0);
    setInputFieldText('');
    setCursorPos({ x: '25%', y: '4.5%' });
    setCursorVisible(false);
    setClicking(false);

    // 1. Cursor moves into address bar
    queueTimer(() => {
      setCursorVisible(true);
      setCursorPos({ x: '22%', y: '4.5%' });
    }, 300);

    // 2. Click address bar and start typing URL character-by-character
    queueTimer(() => setClicking(true), 850);
    queueTimer(() => {
      setClicking(false);
      setIsUrlTyping(true);
      setPhase(1);
    }, 1000);

    // 3. Website loads at ~2.1s
    // 4. Cursor moves DIRECTLY onto the Frosty widget button at bottom-right!
    queueTimer(() => {
      setCursorPos({ x: '94.5%', y: '93.5%' });
    }, 2900);

    // 5. Cursor lands precisely on Frosty logo & performs click
    queueTimer(() => setClicking(true), 3800);
    queueTimer(() => {
      setClicking(false);
      setChatOpen(true);
    }, 3950);

    // 6. Cursor moves to chat input field
    queueTimer(() => {
      setCursorPos({ x: '75%', y: '94%' });
    }, 4400);

    queueTimer(() => setClicking(true), 4900);
    queueTimer(() => setClicking(false), 5050);

    // 7. Customer Message typing in input box
    queueTimer(() => {
      setChatPhase(1); // input active
      simulateCustomerTypingInInput(currentIndustry.chat.q, () => {
        setInputFieldText('');
        setChatPhase(2); // message in stream
        strictlyScrollInternalChat();

        // 8. Frosty typing indicator
        queueTimer(() => {
          setChatPhase(3);
          strictlyScrollInternalChat();
        }, 650);

        // 9. Frosty streams response
        queueTimer(() => {
          setChatPhase(4);
          strictlyScrollInternalChat();
        }, 1500);
      });
    }, 5200);

    // 10. Hold completed dialog for viewer to absorb -> loop to next industry!
    queueTimer(() => {
      setChatOpen(false);
      setChatPhase(0);
      setCursorVisible(false);
    }, 14500);

    queueTimer(() => {
      setStoreIndex((prev) => (prev + 1) % INDUSTRY_DATA.length);
      setLoopKey((k) => k + 1);
    }, 15600);
  }, [clearAllTimers, currentIndustry, queueTimer, simulateCustomerTypingInInput, strictlyScrollInternalChat]);

  useEffect(() => {
    runAnimationCycle();
    return clearAllTimers;
  }, [loopKey, runAnimationCycle, clearAllTimers]);

  return (
    <motion.div
      animate={{ y: [0, -3.5, 0] }}
      transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      style={{ position: 'relative', width: '100%', maxWidth: 670 }}
      className="mx-auto lg:mx-0"
    >
      {/* Outer Browser Shell */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, delay: 0.2, ease: EASE }}
        style={{
          borderRadius: 16,
          overflow: 'hidden',
          background: '#FFFFFF',
          boxShadow:
            '0 32px 84px rgba(3, 150, 166, 0.13), 0 12px 32px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 0, 0, 0.06)',
          position: 'relative',
        }}
      >
        {/* Window Chrome */}
        <div
          style={{
            background: '#F1F3F5',
            borderBottom: '1px solid #E2E5E9',
            padding: '7px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {/* Traffic light dots */}
          <div style={{ display: 'flex', gap: 5 }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#FF5F56' }} />
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#FFBD2E' }} />
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#27C93F' }} />
          </div>

          {/* Active Tab */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '7px 7px 0 0',
              padding: '3.5px 14px',
              fontSize: 9.5,
              fontWeight: 700,
              color: '#1E293B',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: '1px solid #E2E5E9',
              borderBottom: '1px solid #FFFFFF',
              marginBottom: -1,
              position: 'relative',
              zIndex: 1,
            }}
          >
            <span>{isSiteLoaded ? '🌐' : '⏳'}</span>
            <span>
              {isSiteLoaded ? `${currentIndustry.brand} — ${currentIndustry.tagline}` : 'New Tab'}
            </span>
          </div>
        </div>

        {/* Address Bar Toolbar */}
        <div
          style={{
            background: '#FFFFFF',
            borderBottom: '1px solid #E9ECEF',
            padding: '5.5px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <div style={{ display: 'flex', gap: 5, opacity: 0.35 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#475569" strokeWidth="2.2">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </div>

          {/* URL Input */}
          <div
            style={{
              flex: 1,
              background: isUrlTyping || isSiteLoaded ? '#F4F4F6' : '#F1F3F5',
              borderRadius: 7,
              padding: '4px 12px',
              fontSize: 10,
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: isUrlTyping ? `1.5px solid ${PURPLE}` : '1px solid #E2E5E9',
              transition: 'border-color 0.2s, background 0.2s',
            }}
          >
            {isSiteLoaded ? (
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            ) : (
              <span style={{ fontSize: 9, opacity: 0.5 }}>🔒</span>
            )}
            <AddressBarUrlTyping
              targetUrl={currentIndustry.url}
              isTyping={isUrlTyping}
              onComplete={onUrlFinished}
            />
          </div>

          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.6">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>

        {/* Viewport Interior (490px height) */}
        <div style={{ height: 490, position: 'relative', overflow: 'hidden' }}>
          {/* 1. Blank New Tab */}
          {phase < 2 && (
            <div
              style={{
                width: '100%',
                height: '100%',
                background: '#FAFAFA',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <div style={{ fontSize: 26, opacity: 0.45 }}>🌐</div>
              <div style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 500 }}>
                Connecting to {currentIndustry.url}...
              </div>
            </div>
          )}

          {/* 2. Loading State */}
          {phase === 2 && !isSiteLoaded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'absolute',
                inset: 0,
                background: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                zIndex: 60,
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.75, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: 18,
                  height: 18,
                  border: `2.5px solid ${PURPLE}20`,
                  borderTop: `2.5px solid ${PURPLE}`,
                  borderRadius: '50%',
                }}
              />
              <span style={{ fontSize: 9.5, color: '#94A3B8', fontWeight: 500 }}>
                Loading {currentIndustry.brand}...
              </span>
            </motion.div>
          )}

          {/* 3. Fully Rendered Industry Website */}
          {isSiteLoaded && (
            <motion.div
              key={currentIndustry.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.45 }}
              style={{ width: '100%', height: '100%' }}
            >
              <ActiveIndustryViewport industryId={currentIndustry.id} />
            </motion.div>
          )}

          {/* 4. Frosty Chat Overlay */}
          {isSiteLoaded && (
            <FrostyIsolatedChat
              isOpen={chatOpen}
              chatPhase={chatPhase}
              inputFieldValue={inputFieldText}
              store={currentIndustry}
              scrollRef={scrollRef}
              onAutoScroll={strictlyScrollInternalChat}
            />
          )}

          {/* 5. Targeted Single Cursor */}
          <DirectCursor pos={cursorPos} isClicking={clicking} isVisible={cursorVisible} />
        </div>
      </motion.div>

      {/* Atmospheric Glow */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '120%',
          height: '120%',
          background: 'radial-gradient(ellipse at center, rgba(3, 150, 166, 0.08) 0%, transparent 65%)',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HERO ROOT SECTION
   ═══════════════════════════════════════════════════════════════════ */
export default function FrostyEngineHero() {
  const [inputUrl, setInputUrl] = useState('');
  return (
    <motion.section
      className="relative w-full overflow-hidden z-0"
      style={{
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
        padding: '24px 0 28px',
      }}
    >


      {/* Two-Column Responsive Grid */}
      <div
        className="relative z-10 w-full mx-auto px-4 sm:px-6 lg:px-10 xl:px-12"
        style={{ maxWidth: 1440 }}
      >
        <div className="frosty-hero-grid items-center">
          {/* ── LEFT SIDE: Crisp Headline & Value Proposition ── */}
          <motion.div
            initial="initial"
            animate="animate"
            variants={{
              initial: { opacity: 0 },
              animate: {
                opacity: 1,
                transition: { staggerChildren: 0.1, delayChildren: 0.05 },
              },
            }}
            className="text-center lg:text-left mx-auto lg:mx-0 flex flex-col items-center lg:items-start w-full -mt-4 lg:-mt-8 xl:-mt-12"
            style={{ maxWidth: 580 }}
          >
            {/* Eyebrow / Positioning */}
            <motion.div
              variants={{
                initial: { opacity: 0, y: 12 },
                animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 11,
                fontWeight: 700,
                color: PURPLE,
                background: 'rgba(3, 150, 166, 0.08)',
                border: '1px solid rgba(3, 150, 166, 0.2)',
                padding: '4px 12px',
                borderRadius: 999,
                marginBottom: 12,
              }}
            >
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: PURPLE }} />
              Intelligence That Moves Business Forward
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              variants={{
                initial: { opacity: 0 },
                animate: {
                  opacity: 1,
                  transition: { staggerChildren: 0.1, delayChildren: 0.1 },
                },
              }}
              className="font-serif font-bold text-[#0F172A] tracking-tight"
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 'clamp(28px, 6.2vw, 62px)',
                fontWeight: 700,
                lineHeight: 1.08,
                margin: '0 0 14px',
              }}
            >
              <motion.span
                style={{ display: 'block' }}
                variants={{
                  initial: { opacity: 0, y: 18, filter: 'blur(6px)' },
                  animate: {
                    opacity: 1,
                    y: 0,
                    filter: 'blur(0px)',
                    transition: { duration: 0.9, ease: EASE },
                  },
                }}
              >
                Every enquiry answered.
              </motion.span>
              <motion.span
                style={{ display: 'block', position: 'relative' }}
                className="whitespace-normal sm:whitespace-nowrap"
                variants={{
                  initial: { opacity: 0, y: 18, filter: 'blur(6px)' },
                  animate: {
                    opacity: 1,
                    y: 0,
                    filter: 'blur(0px)',
                    transition: { duration: 0.9, ease: EASE },
                  },
                }}
              >
                Before {' '}
                <span
                  style={{
                    color: PURPLE,
                    position: 'relative',
                    display: 'inline-block',
                  }}
                >
                  and after <span style={{ color: CORAL_ORANGE }}>sale.</span>
                  <HandDrawnCurve />
                </span>
              </motion.span>
            </motion.h1>

            {/* Concise Supporting Copy */}
            <motion.p
              variants={{
                initial: { opacity: 0, y: 14 },
                animate: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.8, delay: 0.2 },
                },
              }}
              className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-[48ch]"
              style={{ marginBottom: 16 }}
            >
              Frosty Agent answers your website and WhatsApp enquiries in seconds, qualifies leads, sends quotes, and looks after your existing customers too. Voice notes, Hinglish, 16 languages. One agent, one memory, 24/7.
            </motion.p>

            {/* Live Demo URL Input Pill */}
            <motion.div
              variants={{
                initial: { opacity: 0, y: 12 },
                animate: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.8, delay: 0.35 },
                },
              }}
              className="w-full max-w-[480px] mb-4"
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const raw = (inputUrl || '').trim();
                  if (!raw) return;
                  let normalized = raw;
                  if (!/^https?:\/\//i.test(normalized)) {
                    normalized = `https://${normalized}`;
                  }
                  window.location.href = `/experience?url=${encodeURIComponent(normalized)}`;
                }}
                className="w-full p-1 sm:p-1.5 pl-2.5 sm:pl-4 bg-white/95 backdrop-blur-md rounded-full border border-slate-200/90 shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_36px_rgba(3,150,166,0.12)] hover:border-[#0396A6]/60 focus-within:border-[#0396A6] focus-within:ring-2 focus-within:ring-[#0396A6]/20 focus-within:shadow-[0_12px_36px_rgba(3,150,166,0.18)] transition-all duration-300 flex items-center gap-1.5 sm:gap-2"
              >
                <input
                  type="text"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://yourbrand.com"
                  className="flex-1 min-w-0 bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 text-slate-800 placeholder:text-slate-400 font-sans text-[12.5px] sm:text-[14.5px] px-1.5 sm:px-2 py-1.5 sm:py-2 rounded-l-full shadow-none"
                  style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                />
                <button
                  type="submit"
                  className="shrink-0 px-3.5 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r from-[#0396A6] to-[#028494] hover:from-[#028494] hover:to-[#026c7a] text-white text-[12px] sm:text-[14px] font-bold font-sans flex items-center gap-1 sm:gap-1.5 shadow-[0_4px_14px_rgba(3,150,166,0.35)] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer border-none"
                >
                  <span>Live Demo</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2.2} />
                </button>
              </form>
            </motion.div>

            {/* Premium Trust / Proof Row */}
            <motion.div
              variants={{
                initial: { opacity: 0 },
                animate: {
                  opacity: 1,
                  transition: { duration: 0.8, delay: 0.5 },
                },
              }}
              style={{
                paddingTop: 12,
                borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px 18px',
                alignItems: 'center',
                color: '#64748B',
                fontSize: 12,
                fontWeight: 600,
              }}
              className="justify-center lg:justify-start"
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ color: PURPLE }}><CheckCircle2 size={14} strokeWidth={2.5} /></span>
                Trusted by <strong style={{ color: '#0A1A2F' }}>500+</strong> businesses
              </span>
              <span style={{ opacity: 0.25 }}>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ color: PURPLE }}><Zap size={14} strokeWidth={2.5} /></span>
                <strong style={{ color: '#0A1A2F' }}>24/7</strong> automated
              </span>
              <span style={{ opacity: 0.25 }}>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ color: PURPLE }}><Clock size={14} strokeWidth={2.5} /></span>
                Setup in <strong style={{ color: '#0A1A2F' }}>5 min</strong>
              </span>
            </motion.div>
          </motion.div>

          {/* ── RIGHT SIDE: Dense 2x2 Interactive Browser Demo ── */}
          <motion.div
            initial={{ opacity: 0, x: 35, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1.15, delay: 0.2, ease: EASE }}
            className="flex justify-center lg:justify-end w-full"
          >
            <LiveProductTour />
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
