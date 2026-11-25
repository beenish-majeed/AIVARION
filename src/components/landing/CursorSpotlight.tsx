import React, { useEffect, useRef } from 'react';

export const CursorSpotlight: React.FC = () => {
  const spotlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Enable only for pointer devices (pointer: fine) and disable for touch or reduced-motion
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!isFinePointer || prefersReducedMotion) return;

    let targetX = -1000;
    let targetY = -1000;
    let currentX = -1000;
    let currentY = -1000;
    let isMoving = false;
    let animId: number;

    const onMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!isMoving) {
        isMoving = true;
        currentX = targetX;
        currentY = targetY;
        spotlightRef.current?.classList.add('is-active');
      }
    };

    const onMouseLeave = () => {
      spotlightRef.current?.classList.remove('is-active');
      isMoving = false;
    };

    // Update CSS variables inside requestAnimationFrame without re-rendering React
    const render = () => {
      if (isMoving && spotlightRef.current) {
        currentX += (targetX - currentX) * 0.15;
        currentY += (targetY - currentY) * 0.15;
        spotlightRef.current.style.setProperty('--spotlight-x', `${currentX.toFixed(1)}px`);
        spotlightRef.current.style.setProperty('--spotlight-y', `${currentY.toFixed(1)}px`);
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
  }, []);

  return (
    <div
      ref={spotlightRef}
      aria-hidden="true"
      className="pointer-spotlight pointer-events-none fixed inset-0 z-20"
    />
  );
};

export default CursorSpotlight;
