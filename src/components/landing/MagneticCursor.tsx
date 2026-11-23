import React, { useEffect, useRef, useState } from 'react';

export const MagneticCursor: React.FC = () => {
  const cursorDotRef = useRef<HTMLDivElement>(null);
  const cursorRingRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only enable on desktop pointer devices
    if (typeof window === 'undefined') return;
    const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!hasFinePointer || prefersReducedMotion) return;

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;
    let animId: number;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!isVisible) setIsVisible(true);

      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`;
      }

      // Check if hovering over interactive elements
      const target = e.target as HTMLElement | null;
      if (target && target.closest('a, button, [data-cursor="expand"], .glass-surface-interactive')) {
        setIsHovered(true);
      } else {
        setIsHovered(false);
      }
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };

    // Smooth lerp loop for the outer ring
    const render = () => {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;

      if (cursorRingRef.current) {
        cursorRingRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`;
      }
      animId = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      cancelAnimationFrame(animId);
    };
  }, [isVisible]);

  return (
    <>
      {/* Inner precise dot */}
      <div
        ref={cursorDotRef}
        aria-hidden="true"
        className={`fixed top-0 left-0 -ml-1 -mt-1 w-2 h-2 rounded-full bg-[#FF2DA8] pointer-events-none z-[9999] transition-opacity duration-300 hidden md:block ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {/* Outer magnetic trailing ring */}
      <div
        ref={cursorRingRef}
        aria-hidden="true"
        className={`fixed top-0 left-0 -ml-4 -mt-4 rounded-full pointer-events-none z-[9998] transition-all duration-200 hidden md:block ${
          isVisible ? 'opacity-100' : 'opacity-0'
        } ${
          isHovered
            ? 'w-12 h-12 -ml-6 -mt-6 border-2 border-[#FF2DA8] bg-[#FF2DA8]/10 scale-110 shadow-[0_0_20px_rgba(255,45,168,0.35)]'
            : 'w-8 h-8 border border-white/30 scale-100'
        }`}
      />
    </>
  );
};

export default MagneticCursor;
