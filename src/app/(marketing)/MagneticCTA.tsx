'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface MagneticCTAProps {
  onClick?: () => void;
}

export default function MagneticCTA({ onClick }: MagneticCTAProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics: stiffness 150, damping 15
  const springX = useSpring(mouseX, { stiffness: 150, damping: 15 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 15 });

  // Clamp the magnetic pull distance
  const x = useTransform(springX, (v) => v * 0.4);
  const y = useTransform(springY, (v) => v * 0.4);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // 40px magnetic pull radius (extends beyond the button)
    if (dist < 80) {
      mouseX.set(dx * 0.35);
      mouseY.set(dy * 0.35);
    } else {
      mouseX.set(0);
      mouseY.set(0);
    }
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    setHovered(false);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ display: 'inline-block', padding: 40, margin: -40 }}
    >
      <motion.button
        style={{ x, y }}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        onClick={onClick}
        className="magnetic-cta"
      >
        {/* Liquid fill layer */}
        <motion.div
          className="liquid-fill"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: hovered ? 1 : 0 }}
          transition={{ duration: 0.45, ease: [0.25, 1, 0.5, 1] }}
        />

        {/* Button text */}
        <span style={{ position: 'relative', zIndex: 1 }}>
          Awaken Frosty
        </span>
      </motion.button>

      <style>{`
        .magnetic-cta {
          position: relative;
          overflow: hidden;
          background: #0396A6;
          border: none;
          border-radius: 8px;
          padding: 14px 32px;
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          cursor: pointer;
          Outfit', sans-serif;
          letter-spacing: 0.01em;
          transition: box-shadow 0.3s;
        }
        .magnetic-cta:hover {
          box-shadow: 0 0 30px rgba(0,255,255,0.25), 0 4px 20px rgba(3, 150, 166,0.3);
        }
        .liquid-fill {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 100%;
          background: linear-gradient(0deg, #00FFFF 0%, #06B6D4 40%, #0396A6 100%);
          transform-origin: bottom center;
          border-radius: inherit;
          z-index: 0;
        }
      `}</style>
    </div>
  );
}

