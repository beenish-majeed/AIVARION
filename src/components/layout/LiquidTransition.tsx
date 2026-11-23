import React, { useEffect, useState } from 'react';

interface LiquidTransitionProps {
  currentPath: string;
}

export const LiquidTransition: React.FC<LiquidTransitionProps> = ({ currentPath }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    setIsAnimating(true);
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 750);

    return () => clearTimeout(timer);
  }, [currentPath]);

  if (!isAnimating) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[10000] pointer-events-none overflow-hidden"
    >
      <svg
        className="w-full h-full text-[#0B0B0B] fill-current animate-liquidWipe filter drop-shadow-[0_0_40px_rgba(255,45,168,0.35)]"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path d="M 0 0 C 35 18 65 18 100 0 L 100 100 C 65 82 35 82 0 100 Z" />
      </svg>
      {/* Brand pink fluid edge highlight */}
      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#FF2DA8] to-transparent pointer-events-none" />
    </div>
  );
};

export default LiquidTransition;
