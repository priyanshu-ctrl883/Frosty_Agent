'use client';

import { useEffect, useRef } from 'react';

const FPS = 60;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const lerp = (v: number, i0: number, i1: number, o0: number, o1: number, doClamp = true) => {
  let t = (v - i0) / (i1 - i0);
  if (doClamp) t = clamp(t, 0, 1);
  return o0 + t * (o1 - o0);
};

const easeOutExp = (t: number) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
const easeInOutSin = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;

function springV(t: number, d = 10, s = 100) {
  if (t <= 0) return 0;
  const w = Math.sqrt(s), z = d / (2 * Math.sqrt(s));
  if (z < 1) {
    const wd = w * Math.sqrt(1 - z * z);
    return clamp(1 - Math.exp(-z * w * t) * (Math.cos(wd * t) + (z * w / wd) * Math.sin(wd * t)), 0, 2);
  }
  return clamp(1 - Math.exp(-w * t) * (1 + w * t), 0, 1);
}

const sp = (f: number, delay: number, fps: number, cfg = { d: 12, s: 130 }) => {
  return clamp(springV((f - delay) / fps, cfg.d, cfg.s), 0, 1);
};

const SNOW = Array.from({ length: 24 }, (_, i) => ({
  angle: (i * 137.5) * (Math.PI / 180),
  radius: 24 + (i % 5) * 8, 
  size: 1.0 + (i % 3) * .6, 
  speed: .6 + (i % 4) * .2,
  startF: 5 + (i % 20) * 1.5,
  life: 25 + (i % 8) * 3,
  cyan: i % 2 === 0,
}));

function drawArm(cx: CanvasRenderingContext2D, len: number) {
  cx.moveTo(0, 0); cx.lineTo(0, -len);
  [.32, .55, .75].forEach(p => {
    const y = -len * p, b = len * .18 * (1 - p * .4);
    cx.moveTo(0, y); cx.lineTo(b, y - b * .5);
    cx.moveTo(0, y); cx.lineTo(-b, y - b * .5);
  });
}

function drawSnowflake(cx: CanvasRenderingContext2D, x: number, y: number, size: number, rotation: number, glowI: number, alpha: number) {
  cx.save();
  cx.translate(x, y); cx.rotate(rotation); cx.globalAlpha = alpha;
  if (glowI > 0.01) {
    const grad = cx.createRadialGradient(0, 0, 0, 0, 0, size * 1.8);
    grad.addColorStop(0, `rgba(3, 150, 166,${glowI * .25})`);
    grad.addColorStop(.5, `rgba(255, 122, 94,${glowI * .12})`);
    grad.addColorStop(1, 'rgba(3, 150, 166,0)');
    cx.fillStyle = grad;
    cx.fillRect(-size * 2, -size * 2, size * 4, size * 4);
  }
  const sg = cx.createLinearGradient(-size, -size, size, size);
  sg.addColorStop(0, '#0396A6'); sg.addColorStop(.5, '#14B8A6'); sg.addColorStop(1, '#FF7A5E');
  cx.save();
  cx.shadowColor = 'rgba(3, 150, 166,0.3)'; cx.shadowBlur = glowI * 14;
  cx.strokeStyle = 'rgba(3, 150, 166,0.7)';
  cx.lineWidth = size * .036; cx.lineCap = 'round';
  cx.beginPath();
  for (let i = 0; i < 6; i++) { cx.save(); cx.rotate(i * Math.PI / 3); drawArm(cx, size * .48); cx.restore(); }
  cx.stroke(); cx.restore();
  cx.strokeStyle = sg; cx.lineWidth = size * .038; cx.lineCap = 'round';
  cx.beginPath();
  for (let i = 0; i < 6; i++) { cx.save(); cx.rotate(i * Math.PI / 3); drawArm(cx, size * .48); cx.restore(); }
  cx.stroke();
  [0, 60, 120].forEach(a => {
    const rad = a * Math.PI / 180;
    cx.beginPath();
    cx.moveTo(Math.cos(rad) * size * .13, Math.sin(rad) * size * .13);
    cx.lineTo(Math.cos(rad + Math.PI) * size * .13, Math.sin(rad + Math.PI) * size * .13);
    cx.strokeStyle = 'rgba(3, 150, 166,0.5)'; cx.lineWidth = size * .024;
    cx.stroke();
  });
  const cg = cx.createRadialGradient(0, 0, 0, 0, 0, size * .08);
  cg.addColorStop(0, '#ffffff'); cg.addColorStop(.4, '#99F6E4'); cg.addColorStop(1, '#0396A6');
  cx.beginPath(); cx.arc(0, 0, size * .065, 0, Math.PI * 2);
  cx.fillStyle = cg; cx.fill();
  cx.restore();
}

export default function SplashScreen({ isLoading = true, onComplete }: { isLoading?: boolean; onComplete?: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const loadingRef = useRef(isLoading);
  
  useEffect(() => {
    loadingRef.current = isLoading;
    // Lock scroll
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLoading]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const handleResize = () => {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    const cx = canvas.getContext('2d');
    if (!cx) return;
    let frame = 0;
    let time = 0;
    let raf: number;
    const render = (f: number, t: number) => {
      cx.clearRect(0, 0, canvas.width, canvas.height);
      cx.save();
      cx.scale(window.devicePixelRatio, window.devicePixelRatio);
      const W = window.innerWidth;
      const H = window.innerHeight;
      
      const bgG = cx.createRadialGradient(W / 2, H * .44, 0, W / 2, H * .44, Math.sqrt(W * W + H * H) * .5);
      bgG.addColorStop(0, '#FFFFFF'); bgG.addColorStop(.55, '#FFFFFF'); bgG.addColorStop(1, '#F8F7F4');
      
      const amb = lerp(f, 0, 20, 0, 1) * lerp(f, 40, 60, 1, 0); 
      
      const aG1 = cx.createRadialGradient(W * .38, H * .5, 0, W * .38, H * .5, W * .38);
      aG1.addColorStop(0, `rgba(3, 150, 166,${.06 + amb * .05})`);
      aG1.addColorStop(1, 'rgba(3, 150, 166,0)'); 
      cx.fillStyle = aG1; cx.fillRect(0, 0, W, H);
      const aG2 = cx.createRadialGradient(W * .72, H * .52, 0, W * .72, H * .52, W * .35);
      aG2.addColorStop(0, `rgba(255, 122, 94,${.04 + amb * .04})`);
      aG2.addColorStop(1, 'rgba(255, 122, 94,0)');
      cx.fillStyle = aG2; cx.fillRect(0, 0, W, H);
      const sfSize = 56; 
      const textHeight = 48; 
      const divGap = 24;
      
      cx.font = `700 ${textHeight}px "Inter", "Segoe UI", sans-serif`;
      const chars = 'frosty'.split('');
      const lsProgress = lerp(f, 10, 30, 0, 1) * easeOutExp(lerp(f, 10, 30, 0, 1));
      const extraSpacing = lerp(lsProgress, 0, 1, -5, 4);
      let textStrW = 0;
      chars.forEach(ch => { textStrW += cx.measureText(ch).width + extraSpacing; });
      const totalW = sfSize + divGap + 2 + divGap + textStrW;
      const startX = W / 2 - totalW / 2;
      const cy2 = H / 2;
      const parallax = lerp(f, 0, 40, -15, 0);
      const sfX = startX + sfSize / 2 + parallax;
      const sfY = cy2;
      
      const exitProgress = lerp(f, 40, 60, 0, 1);
      const exitScale = 1 + Math.pow(exitProgress, 3) * 5; 
      const exitOp = 1 - Math.pow(exitProgress, 2); 
      const blurAmount = exitProgress * 18; 
      
      cx.save();
      cx.globalAlpha = 1 - exitProgress;
      cx.fillStyle = bgG; cx.fillRect(0, 0, W, H);
      cx.globalAlpha = 1;
      
      if (blurAmount > 0.1) {
        canvas.style.filter = `blur(${blurAmount}px)`;
      } else {
        canvas.style.filter = 'none';
      }
      
      cx.translate(W / 2, H / 2); cx.scale(exitScale, exitScale); cx.translate(-W / 2, -H / 2);
      const introOP = lerp(f, 0, 15, 0, 1) * exitOp;
      const introSP = sp(f, 0, FPS, { d: 18, s: 200 });
      
      const rotation = lerp(f, 0, 25, 0, Math.PI * 2, true) * easeInOutSin(lerp(f, 0, 25, 0, 1));
      const glowSpin = lerp(f, 0, 20, 0, 1) * lerp(f, 20, 40, .6, 0.2) + .15;
      const glowPulse = glowSpin + Math.sin(t * .08) * .08;
      const breathe = 1 + Math.sin(Math.max(0, t - 40) * .05) * .015;
      
      if (introSP > .01) {
        SNOW.forEach(p => {
          if (f < p.startF || f >= p.startF + p.life) return;
          const age = f - p.startF, progress = age / p.life;
          const r = p.radius * progress;
          const ang = p.angle + rotation * .3;
          const px = sfX + Math.cos(ang) * r, py = sfY + Math.sin(ang) * r;
          
          let mop;
          if (progress < .2) mop = lerp(progress, 0, .2, 0, .9);
          else if (progress < .8) mop = .9;
          else mop = lerp(progress, .8, 1, .7, 0);
          
          cx.beginPath(); cx.arc(px, py, p.size * (1 - progress * .3), 0, Math.PI * 2);
          cx.fillStyle = p.cyan ? `rgba(3, 150, 166,${mop * introOP * 0.7})` : `rgba(255, 122, 94,${mop * introOP * 0.7})`;
          cx.fill();
        });
      }
      
      cx.save();
      cx.globalAlpha = introOP;
      cx.translate(sfX, sfY); cx.scale((.85 + introSP * .15) * breathe, (.85 + introSP * .15) * breathe); cx.translate(-sfX, -sfY);
      drawSnowflake(cx, sfX, sfY, sfSize, rotation, glowPulse, 1);
      cx.restore();
      
      const divX = sfX + sfSize / 2 + divGap + parallax * .3;
      const divH = lerp(f, 10, 25, 0, 70) * easeOutExp(lerp(f, 10, 25, 0, 1));
      const divOp = lerp(f, 10, 20, 0, .5) * exitOp;
      if (divH > 0) {
        const dg = cx.createLinearGradient(0, cy2 - divH / 2, 0, cy2 + divH / 2);
        dg.addColorStop(0, 'rgba(3, 150, 166,0)'); 
        dg.addColorStop(.5, 'rgba(3, 150, 166,0.8)'); 
        dg.addColorStop(1, 'rgba(3, 150, 166,0)'); 
        cx.fillStyle = dg; cx.globalAlpha = divOp; cx.fillRect(divX, cy2 - divH / 2, 1.5, divH); cx.globalAlpha = 1;
      }
      
      const textX = divX + divGap + parallax * .15;
      const textY = cy2 + textHeight * .35; 
      cx.save();
      cx.translate(textX, textY);
      
      let charX = 0;
      chars.forEach((ch, idx) => {
        const charStart = 10 + idx * 2; 
        const cSP = sp(f, charStart, FPS, { d: 24, s: 220 });
        const cOp = lerp(f, charStart, charStart + 8, 0, 1) * exitOp;
        const cY = lerp(cSP, 0, 1, 30, 0);
        if (cOp > 0) {
          cx.save();
          cx.globalAlpha = cOp;
          cx.font = `700 ${textHeight}px "Inter", "Segoe UI", sans-serif`;
          const charGrad = cx.createLinearGradient(-charX, -textHeight, textStrW - charX, 0);
          charGrad.addColorStop(0, '#0F172A');
          charGrad.addColorStop(.35, '#0396A6');
          charGrad.addColorStop(.7, '#FF7A5E');
          charGrad.addColorStop(1, '#0F172A');
          cx.fillStyle = charGrad;
          cx.fillText(ch, charX, cY - 2);
          cx.restore();
        }
        charX += cx.measureText(ch).width + extraSpacing;
      });
      
      const shimP = lerp(f, 25, 45, 0, 1);
      if (shimP > 0 && shimP < 1) {
        const shimX = lerp(shimP, 0, 1, -80, textStrW + 80);
        cx.save();
        cx.globalAlpha = exitOp;
        const sg2 = cx.createLinearGradient(shimX - 100, 0, shimX + 100, 0);
        sg2.addColorStop(0, 'rgba(3, 150, 166,0)');
        sg2.addColorStop(.35, 'rgba(3, 150, 166,0)');
        sg2.addColorStop(.5, 'rgba(3, 150, 166,0.15)'); 
        sg2.addColorStop(.65, 'rgba(3, 150, 166,0)');
        sg2.addColorStop(1, 'rgba(3, 150, 166,0)');
        cx.fillStyle = sg2;
        cx.fillRect(-10, -textHeight - 10, textStrW + 20, textHeight + 20);
        cx.restore();
      }
      
      const ulW = lerp(f, 25, 40, 0, textStrW) * easeOutExp(lerp(f, 25, 40, 0, 1));
      if (ulW > 0) {
        const ulg = cx.createLinearGradient(0, 12, ulW, 12);
        ulg.addColorStop(0, '#0396A6'); 
        ulg.addColorStop(.6, 'rgba(255, 122, 94,.5)'); 
        ulg.addColorStop(1, 'rgba(255, 122, 94,0)');
        cx.fillStyle = ulg; cx.globalAlpha = exitOp; cx.fillRect(0, 12, ulW, 1.5); cx.globalAlpha = 1;
      }
      cx.restore(); 
      cx.restore(); 
      cx.restore(); 
    };
    
    let startTime: number | null = null;
    const tick = (now: DOMHighResTimeStamp) => {
      if (!startTime) startTime = now;
      time++;
      const elapsed = now - startTime;
      frame = (elapsed / 1500) * 60; 
      render(frame, time);
      if (frame <= 60) {
        raf = requestAnimationFrame(tick);
      } else {
        onComplete?.();
      }
    };
    
    if (document.fonts) {
      document.fonts.ready.then(() => { raf = requestAnimationFrame(tick); });
    } else {
      raf = requestAnimationFrame(tick);
    }
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
    };
  }, [onComplete]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#FFFFFF' }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          pointerEvents: 'none' }}
      />
    </div>
  );
}
