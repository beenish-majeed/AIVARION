import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';

interface StepData {
  step: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  description: string;
  details: string[];
}

const steps: StepData[] = [
  {
    step: '01',
    title: 'Local Answer',
    subtitle: 'Runs on your device',
    badge: 'ONLY_ON_DEVICE',
    badgeColor: '#FF2DA8',
    description:
      'Your questions, notes, and quiz practice run directly on your computer. Nothing is sent over the internet.',
    details: [
      'Runs locally with zero lag and works offline',
      'Saved strictly to your private browser space',
      'Zero tracking and zero background analytics',
    ],
  },
  {
    step: '02',
    title: 'Privacy Check',
    subtitle: 'Automatic protection',
    badge: 'PII_REDACTOR_ACTIVE',
    badgeColor: '#FF2DA8',
    description:
      'Before you choose to run any online task, personal details like names, emails, and numbers are cleaned automatically.',
    details: [
      'Cleans sensitive personal details before transit',
      'Shows all redacted elements in preview',
      'Keeps your identity completely shielded',
    ],
  },
  {
    step: '03',
    title: 'User Approval',
    subtitle: 'Your explicit permission',
    badge: 'EXPLICIT_APPROVAL_REQUIRED',
    badgeColor: '#FF2DA8',
    description:
      'Nothing gets sent without your permission. You inspect the exact preview first and approve it with one click.',
    details: [
      'Nothing leaves your machine without your click',
      'Review exact payload before it touches cloud',
      'Cancel instantly at any time with zero data sent',
    ],
  },
  {
    step: '04',
    title: 'Saved Result',
    subtitle: 'Stored in your vault',
    badge: 'ZOD_VALIDATED_WRITE',
    badgeColor: '#FF2DA8',
    description:
      'Online responses are verified and structured on your device, then saved directly to your private local space.',
    details: [
      'Verified with strict schema for safety',
      'Stored in your private browser database',
      'Full freedom to export, edit, or delete',
    ],
  },
];

export const HowItWorksSection: React.FC = () => {
  const [rotationAngle, setRotationAngle] = useState(0);
  const [activeFlippedIndex, setActiveFlippedIndex] = useState<number | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const dragStartXRef = useRef<number | null>(null);
  const dragStartAngleRef = useRef<number>(0);
  const hasMovedRef = useRef<boolean>(false);
  const isDraggingRef = useRef(false);

  // Check reduced motion preference
  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(motionQuery.matches);

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    motionQuery.addEventListener('change', handleMotionChange);
    return () => motionQuery.removeEventListener('change', handleMotionChange);
  }, []);

  // Continuous infinite circular rotation (right to left)
  const isPaused = isInteracting || activeFlippedIndex !== null || prefersReducedMotion;

  const updateOrbit = useCallback(
    (time: number) => {
      if (lastTimeRef.current !== null && !isPaused && !isDraggingRef.current) {
        const delta = time - lastTimeRef.current;
        // Smooth continuous right-to-left rotation: ~9 degrees per second (~40s full cycle)
        const speed = 0.01; // deg per ms
        setRotationAngle((prev) => (prev - delta * speed) % 360);
      }
      lastTimeRef.current = time;
      animationFrameRef.current = requestAnimationFrame(updateOrbit);
    },
    [isPaused]
  );

  useEffect(() => {
    lastTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(updateOrbit);
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateOrbit]);

  // Touch & Mouse Drag Gestures with threshold to distinguish swipe from tap
  const handlePointerDown = (clientX: number) => {
    isDraggingRef.current = true;
    dragStartXRef.current = clientX;
    dragStartAngleRef.current = rotationAngle;
    hasMovedRef.current = false;
    setIsInteracting(true);
  };

  const handlePointerMove = (clientX: number) => {
    if (!isDraggingRef.current || dragStartXRef.current === null) return;
    const diffX = clientX - dragStartXRef.current;
    if (Math.abs(diffX) > 5) {
      hasMovedRef.current = true;
    }
    // Map drag distance in pixels to carousel orbital angle
    setRotationAngle((dragStartAngleRef.current + diffX * 0.35) % 360);
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    dragStartXRef.current = null;
    setIsInteracting(false);
  };

  // Automatic hover flip on desktop: smoothly flips 180 degrees and pauses rotation
  const handleCardMouseEnter = (index: number) => {
    if (window.matchMedia('(hover: hover)').matches) {
      setActiveFlippedIndex(index);
      setIsInteracting(true);
    }
  };

  // Cursor leave: smoothly flips back to 0 degrees and automatically resumes rotation
  const handleCardMouseLeave = (index: number) => {
    if (window.matchMedia('(hover: hover)').matches) {
      if (activeFlippedIndex === index) {
        setActiveFlippedIndex(null);
      }
      setIsInteracting(false);
    }
  };

  // Click / tap handler (for mobile or keyboard activation; ignored if dragging)
  const handleCardClick = (index: number) => {
    if (hasMovedRef.current) return;
    setActiveFlippedIndex((prev) => (prev === index ? null : index));
  };

  const totalCards = steps.length;
  const angleStep = 360 / totalCards; // 90 deg spacing for 4 cards

  return (
    <section
      id="how-it-works"
      className="relative py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8 border-t border-zinc-200/80 dark:border-zinc-900 bg-zinc-50/70 dark:bg-[#0B0B0B] transition-colors duration-300 overflow-hidden"
    >
      {/* Ambient Depth Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#FF2DA8]/8 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-6xl mx-auto w-full relative z-10 flex flex-col items-center">
        {/* Minimal Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white font-display mb-3">
            How It Works
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            Everyday AI runs entirely on your device. When an online task is needed, it only proceeds with your explicit permission.
          </p>
        </div>

        {/* 3D Infinite Circular Carousel Orbit */}
        <div
          ref={containerRef}
          onMouseDown={(e) => handlePointerDown(e.clientX)}
          onMouseMove={(e) => handlePointerMove(e.clientX)}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={(e) => handlePointerDown(e.touches[0].clientX)}
          onTouchMove={(e) => handlePointerMove(e.touches[0].clientX)}
          onTouchEnd={handlePointerUp}
          className="relative w-full max-w-5xl h-[420px] sm:h-[450px] md:h-[470px] flex items-center justify-center select-none cursor-grab active:cursor-grabbing"
          style={{
            perspective: '1200px',
            transformStyle: 'preserve-3d',
          }}
        >
          {steps.map((stepItem, idx) => {
            // Orbital angle along circular path
            const cardAngle = (rotationAngle + idx * angleStep) % 360;
            // Normalize to [-180, 180] degrees
            const normAngle = ((cardAngle + 540) % 360) - 180;
            const rad = (normAngle * Math.PI) / 180;

            // Carousel radius tuned for desktop and mobile viewport
            const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
            const radius = isMobile ? 220 : 340;

            // Cylindrical coordinates: X along width, Z into depth
            const translateX = radius * Math.sin(rad);
            const translateZ = radius * Math.cos(rad) - radius; // 0 in front, -2*radius in back
            // Subtle rotation angle matching curved perspective ribbon
            const rotateY = -normAngle * 0.7;

            // Depth calculation: 1.0 at front (normAngle = 0), 0.0 at back (normAngle = +/-180)
            const depthFactor = (Math.cos(rad) + 1) / 2;
            const scale = 0.8 + 0.24 * depthFactor; // 1.04 in front, 0.80 at back

            // Natural fade: fully visible in front hemisphere, disappearing smoothly around back
            const opacity = Math.max(0.12, Math.pow(depthFactor, 1.4));
            const zIndex = Math.round(10 + 30 * depthFactor);

            const isCardFlipped = activeFlippedIndex === idx;

            return (
              <div
                key={stepItem.step}
                role="button"
                tabIndex={0}
                aria-label={`${stepItem.step} ${stepItem.title} — ${stepItem.subtitle}`}
                onMouseEnter={() => handleCardMouseEnter(idx)}
                onMouseLeave={() => handleCardMouseLeave(idx)}
                onClick={() => handleCardClick(idx)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCardClick(idx);
                  }
                }}
                className="absolute w-[235px] sm:w-[265px] md:w-[280px] h-[340px] sm:h-[370px] md:h-[390px] rounded-[28px] focus:outline-none focus:ring-2 focus:ring-[#FF2DA8]/50 will-change-transform"
                style={{
                  transform: `translate3d(${translateX}px, 0px, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                  opacity,
                  zIndex,
                  transformStyle: 'preserve-3d',
                  pointerEvents: depthFactor < 0.2 ? 'none' : 'auto',
                  transition: isDraggingRef.current
                    ? 'none'
                    : 'transform 0.15s ease-out, opacity 0.2s ease-out',
                }}
              >
                {/* 3D Flip Card Container */}
                <div
                  className="w-full h-full relative rounded-[28px] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                >
                  {/* FRONT FACE: Minimal, Portrait Card matching second reference image proportions */}
                  <div
                    className={`absolute inset-0 w-full h-full rounded-[28px] p-6 sm:p-7 flex flex-col justify-between border backdrop-blur-xl shadow-xl transition-colors duration-300 overflow-hidden [backface-visibility:hidden] ${
                      isCardFlipped
                        ? 'border-[#FF2DA8]/70 shadow-[0_0_35px_rgba(255,45,168,0.2)] bg-white/95 dark:bg-[#121216]/95'
                        : 'border-zinc-200/90 dark:border-zinc-800/80 bg-white/85 dark:bg-[#111115]/85 hover:border-[#FF2DA8]/50 dark:hover:border-[#FF2DA8]/50'
                    }`}
                  >
                    {/* Top Row: Step Number & Dot */}
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#FF2DA8] tracking-widest px-2.5 py-1 rounded-full bg-[#FF2DA8]/10 border border-[#FF2DA8]/20">
                        {stepItem.step}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-[#D4FF3F] glow-chartreuse-sm" />
                    </div>

                    {/* Middle: Clean Minimal Typography */}
                    <div className="my-auto py-2">
                      <div className="w-8 h-1 rounded-full bg-zinc-200 dark:bg-zinc-800 mb-6" />
                      <h3 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white font-display tracking-tight leading-tight mb-2">
                        {stepItem.title}
                      </h3>
                      <p className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400">
                        {stepItem.subtitle}
                      </p>
                    </div>

                    {/* Bottom Indicator */}
                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-[11px] font-mono text-zinc-400 dark:text-zinc-500">
                      <span>Hover to flip</span>
                      <span className="text-[#FF2DA8] font-bold text-xs">→</span>
                    </div>
                  </div>

                  {/* BACK FACE: Detailed Information Revealed on Hover */}
                  <div className="absolute inset-0 w-full h-full rounded-[28px] p-6 sm:p-7 flex flex-col justify-between border border-[#FF2DA8]/60 backdrop-blur-xl shadow-2xl overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)] bg-white/95 dark:bg-[#0E0E12]/95 text-zinc-900 dark:text-white">
                    <div>
                      {/* Back Header */}
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-200/80 dark:border-zinc-800">
                        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-[#FF2DA8]/30 bg-[#FF2DA8]/10 text-[#FF2DA8]">
                          {stepItem.badge}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] font-mono text-[#D4FF3F]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>VERIFIED</span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs sm:text-[13px] text-zinc-600 dark:text-zinc-300 leading-relaxed mb-4">
                        {stepItem.description}
                      </p>

                      {/* Bullet points */}
                      <ul className="space-y-2">
                        {stepItem.details.map((detail, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300 leading-snug"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#FF2DA8] shrink-0 mt-0.5" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Back Footer */}
                    <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800 flex items-center justify-between text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                      <span>AIVARION Core</span>
                      <span className="text-[#D4FF3F]">100% Deterministic</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
