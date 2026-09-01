import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FrostyIcon from '@/components/FrostyIcon';
import { Cpu, Database, Users } from 'lucide-react';

/* ---------- Under the Hood — Interactive Isometric Platform ---------- */

interface TileData {
    icon: React.ReactNode;
    label: string;
    desc: string;
    x: number;   // % from left
    y: number;   // % from top
    lineX: number; // SVG coord for connecting line end
    lineY: number;
}

const TILES: TileData[] = [
    {
        label: 'AI Core',
        desc: 'Proprietary reasoning engine built for enterprise logic and secure execution.',
        x: 84, y: 22,
        lineX: 348, lineY: 220, // Points to AI Core
        icon: <Cpu size={26} strokeWidth={2} color="#00ACC1" />,
    },
    {
        label: 'Knowledge Layer',
        desc: 'Vector-embedded company data. Your agent knows everything you do.',
        x: 6, y: 55,
        lineX: 175, lineY: 300, // Points to Knowledge Layer
        icon: <Database size={26} strokeWidth={2} color="#0396A6" />,
    },
    {
        label: 'CRM Sync',
        desc: 'Deep integrations. Reads from and writes directly to your database.',
        x: 90, y: 78,
        lineX: 348, lineY: 380, // Points to CRM
        icon: <Users size={26} strokeWidth={2} color="#0D5C75" />,
    },
];

type ThemeColor = 'gray' | 'green' | 'blue' | 'purple';

const THEMES: Record<ThemeColor, { top: [string, string], right: [string, string], left: [string, string], stroke: string, text: string }> = {
    gray: {
        top: ['#FFFFFF', '#E6FAF8'], 
        right: ['#80DEEA', '#4DD0E1'], 
        left: ['#B2EBF2', '#80DEEA'], 
        stroke: 'rgba(3,150,166,0.35)', 
        text: '#0A1A2F'
    },
    green: { // AI Core - Luminous Aqua-Teal
        top: ['#E0F7F6', '#B2EBF2'], 
        right: ['#00ACC1', '#0097A7'], 
        left: ['#26C6DA', '#00ACC1'], 
        stroke: 'rgba(0,151,167,0.4)', 
        text: '#006064'
    },
    blue: { // Knowledge Layer - Frostrek Signature Brand Teal
        top: ['#CCFBF1', '#99F6E4'], 
        right: ['#027D8A', '#0D5C75'], 
        left: ['#0396A6', '#027D8A'], 
        stroke: 'rgba(3,150,166,0.5)', 
        text: '#042F2E'
    },
    purple: { // CRM - Deep Oceanic Foundation Teal
        top: ['#99F6E4', '#5EEAD4'], 
        right: ['#0D5C75', '#083344'], 
        left: ['#0E7490', '#0D5C75'], 
        stroke: 'rgba(13,92,117,0.5)', 
        text: '#082F49'
    }
};

// Isometric platform layer with gradients
function Platform({ cx, cy, w, h, depth, delay, label, theme = 'gray', isHovered = false, isDull = false, textOffsetY = 0, hasLoaded = false, onMouseEnter, onMouseLeave }: {
    cx: number; cy: number; w: number; h: number; depth: number; delay: number; label?: string; theme?: ThemeColor; isHovered?: boolean; isDull?: boolean; textOffsetY?: number; hasLoaded?: boolean; onMouseEnter?: () => void; onMouseLeave?: () => void;
}) {
    const hw = w / 2, hh = h / 2;
    const topFace = `${cx},${cy - hh} ${cx + hw},${cy} ${cx},${cy + hh} ${cx - hw},${cy}`;
    const rightFace = `${cx + hw},${cy} ${cx},${cy + hh} ${cx},${cy + hh + depth} ${cx + hw},${cy + depth}`;
    const leftFace = `${cx - hw},${cy} ${cx},${cy + hh} ${cx},${cy + hh + depth} ${cx - hw},${cy + depth}`;
    const topId = `top-${cy}`, rightId = `right-${cy}`, leftId = `left-${cy}`;
    
    const colors = THEMES[theme];

    return (
        <motion.g
            initial={{ opacity: 0, x: -120, y: 60, scale: 0.7 }}
            whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            animate={
                isHovered ? { y: -12, filter: 'brightness(1.08) grayscale(0)', opacity: 1, scale: 1 } 
                : isDull ? { y: 0, filter: 'brightness(0.9) grayscale(1)', opacity: 0.4, scale: 1 }
                : { y: 0, filter: 'brightness(1) grayscale(0)', opacity: 1, scale: 1 }
            }
            viewport={{ once: true, margin: "-100px" }}
            transition={{ 
                x: { type: 'spring', stiffness: 300, damping: 25 },
                y: { type: 'spring', stiffness: 300, damping: 25 },
                scale: { type: 'spring', stiffness: 200, damping: 20 },
                default: { duration: 0.5, delay: hasLoaded ? 0 : delay, ease: 'easeOut' }
            }}
            style={{ transformOrigin: `${cx}px ${cy}px`, cursor: 'pointer' }}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <defs>
                <linearGradient id={topId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={colors.top[0]} />
                    <stop offset="100%" stopColor={colors.top[1]} />
                </linearGradient>
                <linearGradient id={rightId} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={colors.right[0]} />
                    <stop offset="100%" stopColor={colors.right[1]} />
                </linearGradient>
                <linearGradient id={leftId} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={colors.left[0]} />
                    <stop offset="100%" stopColor={colors.left[1]} />
                </linearGradient>
            </defs>
            <polygon points={leftFace} fill={`url(#${leftId})`} />
            <polygon points={rightFace} fill={`url(#${rightId})`} />
            <polygon points={topFace} fill={`url(#${topId})`}
                stroke={colors.stroke} strokeWidth="0.8" />
            
            {/* Isometric Label Text */}
            {label && (
                <text
                    x={cx} y={cy + textOffsetY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={Math.max(13.5, w * 0.052)}
                    fontWeight="700"
                    fill={colors.text}
                    style={{ letterSpacing: '0.04em', fontFamily: 'var(--font-sans, "Inter", sans-serif)', pointerEvents: 'none' }}
                    transform={`translate(0, ${cy + textOffsetY}) scale(1, 0.58) translate(0, -${cy + textOffsetY})`}
                >
                    {label}
                </text>
            )}

            <line x1={cx} y1={cy - hh} x2={cx + hw} y2={cy} stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" />
            <line x1={cx} y1={cy - hh} x2={cx - hw} y2={cy} stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
            {theme !== 'gray' && (
                <polygon
                    points={`${cx},${cy - hh + 12} ${cx + hw - 18},${cy} ${cx},${cy + hh - 12} ${cx - hw + 18},${cy}`}
                    fill="none" stroke={colors.stroke} strokeWidth="0.5"
                />
            )}
        </motion.g>
    );
}

// Animated particles
function Dots() {
    const pts: [number, number][] = [
        [50, 55], [470, 50], [485, 230], [65, 360], [430, 380],
        [35, 200], [255, 25], [490, 320], [155, 410], [365, 30],
        [20, 290], [475, 145], [215, 420], [385, 410], [95, 105],
        [320, 15], [500, 270],
    ];
    return (
        <>
            {pts.map(([x, y], i) => (
                <motion.circle
                    key={i} cx={x} cy={y} r={2 + (i % 3)} fill="#0396A6"
                    animate={{ opacity: [0.1, 0.35, 0.1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.25 }}
                />
            ))}
        </>
    );
}

export default function IsometricPlatform() {
    const [hovered, setHovered] = useState<number | null>(null);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    React.useEffect(() => {
        const t = setTimeout(() => setHasLoaded(true), 1500);
        return () => clearTimeout(t);
    }, []);

    return (
        <motion.div 
            onClick={() => setIsExpanded(!isExpanded)}
            animate={{ scale: isExpanded ? 1.2 : 1 }}
            whileHover={{ scale: isExpanded ? 1.2 : 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`w-full max-w-[640px] aspect-[52/46] mx-auto relative cursor-pointer ${isExpanded ? 'z-50' : 'z-10'}`}
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
        >
            {/* Mobile-only invisible overlay to intercept clicks and prevent SVG pointer-events from swallowing the tap */}
            <div 
                className="absolute inset-0 z-50 lg:hidden" 
                onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                }} 
            />

            {/* SVG layer — platforms, dots, connecting lines */}
            <svg viewBox="0 0 520 500" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}>
                <defs>
                    <filter id="platformShadow" x="-15%" y="-10%" width="130%" height="140%">
                        <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#1a3d2e" floodOpacity="0.08" />
                    </filter>
                    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="18" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                    </filter>
                    <radialGradient id="bgGlow" cx="50%" cy="55%" r="40%">
                        <stop offset="0%" stopColor="#2D6A4F" stopOpacity="0.04" />
                        <stop offset="100%" stopColor="#2D6A4F" stopOpacity="0" />
                    </radialGradient>
                </defs>

                <ellipse cx="260" cy="280" rx="220" ry="180" fill="url(#bgGlow)" />
                <Dots />
                <ellipse cx="260" cy="425" rx="160" ry="24" fill="rgba(45,106,79,0.05)" />

                {/* Connecting lines — highlight on hover */}
                {TILES.map((t, i) => {
                    const tileCx = (t.x / 100) * 520 + 30; // updated offset for larger tile size
                    const tileCy = (t.y / 100) * 460 + 30; // updated offset for larger tile size
                    return (
                        <motion.line key={`line-${i}`}
                            className="hidden lg:block"
                            x1={tileCx} y1={tileCy} x2={t.lineX} y2={t.lineY}
                            stroke={hovered === i ? "#0396A6" : "#CBD5E1"} strokeWidth={hovered === i ? 1.5 : 1}
                            strokeDasharray="4 4"
                            opacity={hovered === i ? 0.9 : 0.6}
                            style={{ transition: 'opacity 0.3s, stroke-width 0.3s' }}
                            animate={{
                                strokeDashoffset: hovered === i ? [0, -24] : 0
                            }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                                ease: 'linear'
                            }}
                        />
                    );
                })}

                {/* Platforms */}
                <g filter="url(#platformShadow)">
                    <Platform cx={260} cy={380} w={340} h={135} depth={20} delay={0.08} label="CRM" theme="purple" isHovered={hovered === 2} isDull={hovered !== null && hovered !== 2 && hovered !== 3} textOffsetY={25} hasLoaded={hasLoaded} onMouseEnter={() => setHovered(2)} onMouseLeave={() => setHovered(null)} />
                </g>
                <g filter="url(#platformShadow)">
                    <Platform cx={260} cy={300} w={285} h={115} depth={18} delay={0.2} label="Knowledge Layer" theme="blue" isHovered={hovered === 1} isDull={hovered !== null && hovered !== 1 && hovered !== 3} hasLoaded={hasLoaded} onMouseEnter={() => setHovered(1)} onMouseLeave={() => setHovered(null)} />
                </g>
                <g filter="url(#platformShadow)">
                    <Platform cx={260} cy={220} w={230} h={95} depth={15} delay={0.35} label="AI Core" theme="green" isHovered={hovered === 0} isDull={hovered !== null && hovered !== 0 && hovered !== 3} hasLoaded={hasLoaded} onMouseEnter={() => setHovered(0)} onMouseLeave={() => setHovered(null)} />
                </g>
                <g filter="url(#platformShadow)">
                    {/* Top Logo platform dims when another layer is active */}
                    <Platform cx={260} cy={140} w={175} h={75} depth={13} delay={0.6} theme="gray" isHovered={false} isDull={hovered !== null && hovered !== 3} hasLoaded={hasLoaded} onMouseEnter={() => setHovered(3)} onMouseLeave={() => setHovered(null)} />
                    
                    {/* SVG Logo perfectly positioned on the top platform - Initial reveal matches the platform */}
                    <motion.g 
                        initial={{ opacity: 0, x: -120, y: 60, scale: 0.7 }}
                        whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                        animate={hovered !== null && hovered !== 3 ? { opacity: 0.35, filter: 'grayscale(1)' } : { opacity: 1, filter: 'grayscale(0)' }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ 
                            x: { type: 'spring', stiffness: 300, damping: 25 },
                            y: { type: 'spring', stiffness: 300, damping: 25 },
                            scale: { type: 'spring', stiffness: 200, damping: 20 },
                            default: { duration: 0.4, ease: 'easeOut' }
                        }}
                        style={{ transformOrigin: `260px 140px`, pointerEvents: 'none' }}
                    >
                        <foreignObject 
                            x={260 - 26} 
                            y={140 - 26} 
                            width={52} 
                            height={52} 
                            style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))' }}
                        >
                            <div className="w-full h-full flex items-center justify-center brightness-[0.3] saturate-150">
                                <FrostyIcon size={40} glow={0} />
                            </div>
                        </foreignObject>
                    </motion.g>
                </g>

                {/* Top tile glow */}
                <motion.ellipse cx={260} cy={140} rx={45} ry={25} fill="#2D6A4F" opacity={0}
                    initial={{ opacity: 0 }} whileInView={{ opacity: 0.1 }} viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.9 }} filter="url(#glow)" />
            </svg>

            {/* HTML Overlays for interactive tiles */}
            {TILES.map((t, i) => (
                <motion.div
                    key={i}
                    className="hidden lg:block"
                    initial={{ opacity: 0, x: -60, y: 30, scale: 0.5 }}
                    whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                    animate={{ 
                        opacity: hovered !== null && hovered !== i && hovered !== 3 ? 0.25 : 1,
                        scale: hovered !== null && hovered !== i && hovered !== 3 ? 0.95 : 1,
                        filter: hovered !== null && hovered !== i && hovered !== 3 ? 'grayscale(1)' : 'grayscale(0)'
                    }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ 
                        x: { type: 'spring', stiffness: 300, damping: 25 },
                        y: { type: 'spring', stiffness: 300, damping: 25 },
                        scale: { type: 'spring', stiffness: 200, damping: 20 },
                        // Sequence tiles from bottom to top: CRM (index 2) -> Knowledge (1) -> AI Core (0)
                        default: { duration: 0.5, delay: hasLoaded ? 0 : (2 - i) * 0.15 + 0.2, ease: 'easeOut' }
                    }}
                    style={{
                        position: 'absolute',
                        left: `${t.x}%`,
                        top: `${t.y}%`,
                        zIndex: 10,
                    }}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                >
                    <motion.div
                        animate={{ y: hovered === i ? -4 : [0, -6, 0] }}
                        transition={{ 
                            y: hovered === i 
                                ? { type: "spring", stiffness: 300, damping: 20 }
                                : { duration: 4 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }
                        }}
                        className="relative group cursor-pointer"
                    >
                        {/* Tile */}
                        <motion.div 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                width: 60,
                                height: 60,
                                borderRadius: 18,
                                backgroundColor: hovered === i ? '#0396A6' : 'white',
                                boxShadow: hovered === i ? '0 16px 32px rgba(3, 150, 166,0.25)' : '0 8px 24px rgba(0,0,0,0.06)',
                                border: `1px solid ${hovered === i ? '#0396A6' : 'rgba(0,0,0,0.08)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'background-color 0.3s ease, box-shadow 0.3s ease, border 0.3s ease',
                            }}
                        >
                            {/* SVG color handled via CSS invert filter trick when hovered */}
                            <div style={{
                                filter: hovered === i ? 'brightness(0) invert(1)' : 'none',
                                transition: 'filter 0.3s ease'
                            }}>
                                {t.icon}
                            </div>
                        </motion.div>

                        {/* Tooltip */}
                        <AnimatePresence>
                            {hovered === i && (
                                <motion.div
                                    initial={{ opacity: 0, y: t.y > 50 ? -10 : 10, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: t.y > 50 ? -6 : 6, scale: 0.9 }}
                                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                    style={{
                                        position: 'absolute',
                                        bottom: t.y > 50 ? 'auto' : 'calc(100% + 14px)',
                                        top: t.y > 50 ? 'calc(100% + 14px)' : 'auto',
                                        left: t.x < 50 ? '-16px' : 'auto',
                                        right: t.x > 50 ? '-16px' : 'auto',
                                        transformOrigin: `${t.x < 50 ? '24px' : 'calc(100% - 24px)'} ${t.y > 50 ? 'top' : 'bottom'}`,
                                        width: 220,
                                        padding: '14px 16px',
                                        borderRadius: 12,
                                        background: 'rgba(255, 255, 255, 0.95)',
                                        backdropFilter: 'blur(12px)',
                                        WebkitBackdropFilter: 'blur(12px)',
                                        boxShadow: t.y > 50 
                                            ? '0 20px 30px -4px rgba(0,0,0,0.15)' 
                                            : '0 12px 30px -4px rgba(0,0,0,0.15)',
                                        border: '1px solid #f3f4f6',
                                        zIndex: 20,
                                        pointerEvents: 'none',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        textAlign: 'left',
                                    }}
                                >
                                    {/* Arrow */}
                                    <div style={{
                                        position: 'absolute',
                                        bottom: t.y > 50 ? 'auto' : -6,
                                        top: t.y > 50 ? -6 : 'auto',
                                        left: t.x < 50 ? '32px' : 'auto',
                                        right: t.x > 50 ? '32px' : 'auto',
                                        transform: 'rotate(45deg)',
                                        width: 12,
                                        height: 12,
                                        background: '#ffffff',
                                        borderBottom: t.y > 50 ? 'none' : '1px solid #f3f4f6',
                                        borderRight: t.y > 50 ? 'none' : '1px solid #f3f4f6',
                                        borderTop: t.y > 50 ? '1px solid #f3f4f6' : 'none',
                                        borderLeft: t.y > 50 ? '1px solid #f3f4f6' : 'none',
                                    }} />
                                    <div style={{
                                        fontSize: 13.5,
                                        fontWeight: 700,
                                        color: '#111827', // text-white
                                        marginBottom: 4,
                                        letterSpacing: '-0.01em',
                                    }}>
                                        {t.label}
                                    </div>
                                    <div style={{
                                        fontSize: 12,
                                        color: '#6B7280', // text-slate-500
                                        lineHeight: 1.45,
                                    }}>
                                        {t.desc}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </motion.div>
            ))}
        </motion.div>
    );
}
