'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    alpha: number;
    state: 'funnel' | 'falling' | 'settling';
    settleLife: number;
    slideDir: number;
}

// 100% Brand Teal & Glowing Cyan Palette for falling sand grains
const TEAL_SAND_COLORS = [
    '#0396A6', // Primary Brand Teal
    '#06B6D4', // Vibrant Cyan
    '#22D3EE', // Bright Turquoise
    '#0891B2', // Deep Teal Cyan
    '#67E8F9', // Light Glow Cyan
    '#A5F3FC', // Specular Quartz Speck
    '#0E7490', // Rich Depth Teal
];

export default function HourglassSandCanvas() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d', { alpha: true });
        if (!ctx) return;

        let animationFrameId: number;
        let isRunning = true;

        const updateDimensions = () => {
            const w = canvas.clientWidth || canvas.offsetWidth || 300;
            const h = canvas.clientHeight || canvas.offsetHeight || 440;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            canvas.width = w * dpr;
            canvas.height = h * dpr;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);
        };

        updateDimensions();

        const resizeObserver = new ResizeObserver(() => {
            updateDimensions();
        });
        resizeObserver.observe(canvas);

        // Precise dynamic geometry calibrated to cover the full stream in glowing_hourglass2.png
        const getGeom = () => {
            const w = canvas.clientWidth || canvas.offsetWidth || 300;
            const h = canvas.clientHeight || canvas.offsetHeight || 440;
            const imgAspect = 1405 / 1119;

            let renderW = w;
            let renderH = w / imgAspect;
            if (renderH > h) {
                renderH = h;
                renderW = h * imgAspect;
            }

            const offsetX = (w - renderW) / 2;
            const offsetY = (h - renderH) / 2;
            const cx = w / 2;

            // Geometry fully covering the stream path from funnel to sand tip:
            const funnelTopY = offsetY + 0.425 * renderH;
            const neckY = offsetY + 0.495 * renderH;
            // The exact tip of the orange mound where the stream connects:
            const apexY = offsetY + 0.736 * renderH;
            // Width wide enough to seamlessly cover the background stream line:
            const neckHalfW = Math.max(1.6, 0.0075 * renderW);

            return { w, h, renderW, renderH, offsetX, offsetY, cx, neckY, apexY, funnelTopY, neckHalfW };
        };

        const createParticle = (spawnInFunnel = true): Particle => {
            const { cx, neckY, funnelTopY, neckHalfW, renderW } = getGeom();
            // Ultra-fine micro grains
            const size = 0.3 + Math.random() * 0.45;
            const color = TEAL_SAND_COLORS[Math.floor(Math.random() * TEAL_SAND_COLORS.length)] || '#0396A6';

            if (spawnInFunnel) {
                // Spawn in top teal chamber
                const y = funnelTopY + Math.random() * (neckY - funnelTopY);
                const progress = (y - funnelTopY) / Math.max(neckY - funnelTopY, 1);
                const currentMaxHalfW = (1 - progress) * (renderW * 0.038) + neckHalfW;
                const x = cx + (Math.random() - 0.5) * 2 * currentMaxHalfW;

                return {
                    x,
                    y,
                    vx: (cx - x) * 0.04,
                    vy: 0.2 + Math.random() * 0.3,
                    size,
                    color,
                    alpha: 0.45 + Math.random() * 0.45,
                    state: 'funnel',
                    settleLife: 0,
                    slideDir: Math.random() > 0.5 ? 1 : -1,
                };
            } else {
                // Spawn directly in the falling stream
                const x = cx + (Math.random() - 0.5) * neckHalfW * 1.5;
                return {
                    x,
                    y: neckY + Math.random() * 3,
                    vx: (Math.random() - 0.5) * 0.1,
                    vy: 1.1 + Math.random() * 0.6,
                    size,
                    color,
                    alpha: 0.7 + Math.random() * 0.3,
                    state: 'falling',
                    settleLife: 0,
                    slideDir: Math.random() > 0.5 ? 1 : -1,
                };
            }
        };

        const particles: Particle[] = [];
        const MAX_PARTICLES = 160;

        for (let i = 0; i < MAX_PARTICLES; i++) {
            particles.push(createParticle(Math.random() > 0.4));
        }

        let lastTime = performance.now();

        const render = (time: number) => {
            if (!isRunning) return;
            const dt = Math.min((time - lastTime) / 1000, 0.05);
            lastTime = time;

            const { w, h, cx, neckY, apexY, funnelTopY, neckHalfW, renderW } = getGeom();

            ctx.clearRect(0, 0, w, h);

            // 1. Continuous smooth glowing Teal/Cyan trickling sand stream covering background line
            const streamGrad = ctx.createLinearGradient(cx, neckY, cx, apexY);
            streamGrad.addColorStop(0, 'rgba(34, 211, 238, 0.95)');   // Bright Cyan at neck
            streamGrad.addColorStop(0.35, 'rgba(3, 150, 166, 0.9)');   // Primary Brand Teal
            streamGrad.addColorStop(0.85, 'rgba(8, 145, 178, 0.85)');  // Deep Teal
            streamGrad.addColorStop(1, 'rgba(6, 182, 212, 0.95)');    // Crisp connection right at sand tip

            ctx.save();
            ctx.beginPath();
            const waver = Math.sin(time * 0.005) * 0.2;
            // Slightly wider stream to completely cover underlying static image line
            ctx.moveTo(cx - 0.9 + waver, neckY);
            ctx.lineTo(cx + 0.9 + waver, neckY);
            ctx.lineTo(cx + 1.2 + waver, apexY);
            ctx.lineTo(cx - 1.2 + waver, apexY);
            ctx.closePath();
            ctx.fillStyle = streamGrad;
            ctx.fill();

            // Specular bright center core
            ctx.beginPath();
            ctx.moveTo(cx + waver, neckY);
            ctx.lineTo(cx + waver, apexY);
            ctx.strokeStyle = 'rgba(165, 243, 252, 0.9)';
            ctx.lineWidth = 0.45;
            ctx.stroke();
            ctx.restore();

            // 2. Micro-particles update & rendering (100% Teal)
            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];
                if (!p) continue;

                if (p.state === 'funnel') {
                    const dx = cx - p.x;
                    p.vx = dx * 0.045 + (Math.random() - 0.5) * 0.06;
                    p.vy += 0.025;
                    p.x += p.vx;
                    p.y += p.vy;

                    const progress = (p.y - funnelTopY) / Math.max(neckY - funnelTopY, 1);
                    const currentMaxHalfW = (1 - progress) * (renderW * 0.038) + neckHalfW;
                    if (Math.abs(p.x - cx) > currentMaxHalfW) {
                        p.x = cx + Math.sign(p.x - cx) * currentMaxHalfW;
                    }

                    if (p.y >= neckY) {
                        p.state = 'falling';
                        p.x = cx + (Math.random() - 0.5) * neckHalfW * 1.4;
                        p.vy = 1.2 + Math.random() * 0.6;
                        p.alpha = 0.8 + Math.random() * 0.2;
                    }
                } else if (p.state === 'falling') {
                    p.vy += 0.18;
                    p.vx += (Math.random() - 0.5) * 0.06;
                    p.vx *= 0.92;
                    p.x += p.vx;
                    p.y += p.vy;

                    // Fully cover the stream width
                    if (Math.abs(p.x - cx) > neckHalfW * 1.5) {
                        p.x = cx + Math.sign(p.x - cx) * neckHalfW * 1.5;
                    }

                    // Hits the exact tip of the sand cone
                    if (p.y >= apexY) {
                        p.state = 'settling';
                        p.y = apexY;
                        p.vx = p.slideDir * (0.15 + Math.random() * 0.25);
                        p.vy = 0.05 + Math.random() * 0.1;
                        p.settleLife = 1.0;
                    }
                } else if (p.state === 'settling') {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.vx *= 0.82;
                    p.vy *= 0.85;
                    p.settleLife -= dt * 6.0;
                    p.alpha = Math.max(0, p.settleLife * 0.5);

                    if (p.settleLife <= 0 || p.y > apexY + renderW * 0.01) {
                        Object.assign(p, createParticle(Math.random() > 0.4));
                    }
                }

                // Draw ultra-fine micro-particle
                if (p.alpha > 0.02) {
                    ctx.save();
                    ctx.globalAlpha = p.alpha;
                    ctx.fillStyle = p.color;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                }
            }

            // 3. Natural Subtle Neck Glow
            ctx.save();
            const neckGlow = ctx.createRadialGradient(cx, neckY, 0, cx, neckY, 3.5);
            neckGlow.addColorStop(0, 'rgba(34, 211, 238, 0.6)');
            neckGlow.addColorStop(0.6, 'rgba(3, 150, 166, 0.2)');
            neckGlow.addColorStop(1, 'rgba(3, 150, 166, 0)');
            ctx.fillStyle = neckGlow;
            ctx.beginPath();
            ctx.arc(cx, neckY, 3.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            animationFrameId = requestAnimationFrame(render);
        };

        animationFrameId = requestAnimationFrame(render);

        const handleResize = () => {
            updateDimensions();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            isRunning = false;
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
            resizeObserver.disconnect();
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />
    );
}
