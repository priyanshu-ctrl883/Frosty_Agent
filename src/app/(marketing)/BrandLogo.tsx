'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { FrostyAgentLogo } from '@/components/FrostyAgentLogo';

gsap.registerPlugin(useGSAP);

export default function BrandLogo({ ready = true, collapsed = false, forceLight = false }: { ready?: boolean, collapsed?: boolean, forceLight?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!ready) return;

    gsap.fromTo('.brand-logo-inner',
      { opacity: 0, y: 6, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 0.7, ease: 'power3.out', delay: 0.1 }
    );

    const logo = containerRef.current;
    if (!logo) return;

    const onEnter = () => {
      gsap.to('.brand-logo-inner', { scale: 1.03, duration: 0.4, ease: 'power2.out' });
    };
    const onLeave = () => {
      gsap.to('.brand-logo-inner', { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
    };

    logo.addEventListener('mouseenter', onEnter);
    logo.addEventListener('mouseleave', onLeave);

    return () => {
      logo.removeEventListener('mouseenter', onEnter);
      logo.removeEventListener('mouseleave', onLeave);
    };
  }, { dependencies: [ready, collapsed, forceLight], scope: containerRef });

  return (
    <div ref={containerRef} className="flex items-center cursor-pointer group select-none">
      <div className="brand-logo-inner" style={{ opacity: 0 }}>
        <FrostyAgentLogo
          height={32}
          variant={collapsed ? 'icon' : 'full'}
          forceLight={forceLight}
        />
      </div>
    </div>
  );
}
