import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export const VortexTransition: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const vortexGroupRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const petalsRef = useRef<HTMLDivElement>(null);
  const introTextRef = useRef<HTMLDivElement>(null);
  const revealPortalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const isMobile = window.innerWidth < 768;

    const ctx = gsap.context(() => {
      const petals = gsap.utils.toArray<HTMLElement>('.vortex-petal');
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
      });

      // Phase 1: Inward Pull / Petal Spiral (0% -> 40%)
      // Petals rotate inward, scale down towards black hole core
      tl.to(
        petals,
        {
          scale: 0.22,
          rotation: (index) => index * 60 + 360,
          opacity: 0.9,
          stagger: 0.02,
          duration: 0.4,
        },
        0
      )
        .to(
          vortexGroupRef.current,
          {
            rotation: 240,
            duration: 0.4,
          },
          0
        )
        .to(
          introTextRef.current,
          {
            opacity: 0,
            scale: 0.8,
            duration: 0.25,
          },
          0.05
        )
        // Phase 2: Compression & Hold Beat (40% -> 65%)
        // Content holds tightly compressed in vortex eye for ~2 to 2.5s scroll distance
        .to(
          coreRef.current,
          {
            scale: 1.25,
            duration: 0.25,
            ease: 'sine.inOut',
          },
          0.4
        )
        .to(
          vortexGroupRef.current,
          {
            rotation: 360,
            duration: 0.25,
          },
          0.4
        )
        // Phase 3: Outward Burst & Reveal (65% -> 100%)
        // Petals accelerate and explode outward into the next section
        .to(
          petals,
          {
            scale: isMobile ? 3.5 : 5.5,
            rotation: (index) => index * 60 + 720,
            opacity: 0,
            stagger: 0.015,
            duration: 0.35,
            ease: 'power3.in',
          },
          0.65
        )
        .to(
          vortexGroupRef.current,
          {
            rotation: 540,
            duration: 0.35,
          },
          0.65
        )
        .to(
          coreRef.current,
          {
            scale: 20,
            opacity: 0,
            duration: 0.35,
            ease: 'power2.in',
          },
          0.65
        )
        .to(
          revealPortalRef.current,
          {
            opacity: 1,
            scale: 1,
            duration: 0.3,
            ease: 'power2.out',
          },
          0.7
        );

      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top top',
        end: isMobile ? '+=1200' : '+=1800', // ~2-2.5s scroll distance
        pin: true,
        scrub: 0.7,
        animation: tl,
        invalidateOnRefresh: true,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // 6 petals arranged radially mimicking the organic ribbon loops of the brand logo
  const petalAngles = [0, 60, 120, 180, 240, 300];

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden bg-[#0B0B0B] flex items-center justify-center select-none"
      aria-label="Vortex Transition"
    >
      {/* Background Starfield / Singularity Shadow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#140610_0%,#0B0B0B_75%)] pointer-events-none" />

      {/* Intro prompt before spiral */}
      <div
        ref={introTextRef}
        className="absolute z-20 text-center max-w-lg px-4 pointer-events-none transition-transform will-change-transform"
      >
        <span className="font-mono text-xs text-[#FF2DA8] tracking-widest uppercase block mb-2">
          Gravitational Core
        </span>
        <h3 className="text-2xl sm:text-4xl font-bold text-white font-display">
          Compressing into <br />
          <span className="text-[#FF2DA8]">Zero-Knowledge Privacy</span>
        </h3>
        <p className="text-zinc-500 text-xs sm:text-sm mt-2 font-mono">
          [Scroll down to enter the verification gates]
        </p>
      </div>

      {/* Rotating Petal Vortex Group */}
      <div
        ref={vortexGroupRef}
        className="relative w-[340px] h-[340px] sm:w-[500px] sm:h-[500px] flex items-center justify-center pointer-events-none will-change-transform"
      >
        <div ref={petalsRef} className="absolute inset-0 flex items-center justify-center">
          {petalAngles.map((angle, idx) => (
            <div
              key={idx}
              className="vortex-petal absolute w-36 h-56 sm:w-52 sm:h-80 origin-bottom will-change-transform"
              style={{
                transform: `rotate(${angle}deg) translateY(-30%) scale(1.1)`,
              }}
            >
              <svg
                viewBox="0 0 100 160"
                className="w-full h-full drop-shadow-[0_0_20px_rgba(255,45,168,0.35)]"
                fill="none"
              >
                <defs>
                  <linearGradient id={`petal-grad-${idx}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF2DA8" stopOpacity="0.85" />
                    <stop offset="45%" stopColor="#FF2DA8" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#0B0B0B" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
                {/* Curved petal ribbon geometry */}
                <path
                  d="M50 0 C75 30 95 80 85 130 C75 160 50 160 50 160 C50 160 25 160 15 130 C5 80 25 30 50 0 Z"
                  fill={`url(#petal-grad-${idx})`}
                  stroke="#FF2DA8"
                  strokeWidth="1.2"
                  strokeOpacity="0.6"
                />
              </svg>
            </div>
          ))}
        </div>

        {/* Singularity Black-Hole Core */}
        <div
          ref={coreRef}
          className="relative z-10 w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-[#0B0B0B] border-2 border-[#FF2DA8] shadow-[0_0_50px_rgba(255,45,168,0.5)] flex items-center justify-center will-change-transform"
        >
          {/* Internal shadow aperture */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black border border-white/10 flex items-center justify-center shadow-inner">
            {/* Single Chartreuse status dot at the exact center of the vortex */}
            <span className="w-2.5 h-2.5 rounded-full bg-[#D4FF3F] glow-chartreuse-sm" />
          </div>
        </div>
      </div>

      {/* Outward Burst Reveal Portal (Fades in as petals burst outward) */}
      <div
        ref={revealPortalRef}
        className="absolute z-20 text-center max-w-xl px-4 pointer-events-none opacity-0 scale-90 will-change-transform"
      >
        <span className="font-mono text-xs text-[#FF2DA8] tracking-widest uppercase block mb-3">
          4-Step Sovereign Architecture
        </span>
        <h3 className="text-3xl sm:text-5xl font-bold text-white font-display leading-tight">
          How AIVARION <br />
          <span className="kinetic-gradient-text">Guards Every Turn</span>
        </h3>
        <p className="text-zinc-400 text-sm mt-3">
          From deterministic on-device inference to human-inspected cloud planning.
        </p>
      </div>
    </div>
  );
};

export default VortexTransition;
