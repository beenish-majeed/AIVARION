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
  const [trackOffset, setTrackOffset] = useState(0);
  const [activeFlippedIndex, setActiveFlippedIndex] = useState<number | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const dragStartXRef = useRef<number | null>(null);
  const dragStartOffsetRef = useRef<number>(0);
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

  // Continuous infinite conveyor movement along curved horizontal arc
  // Moves slowly in one direction: cards exit on the RIGHT and re-enter on the LEFT
  const isPaused = isInteracting || activeFlippedIndex !== null || prefersReducedMotion;

  const updateConveyor = useCallback(
    (time: number) => {
      if (lastTimeRef.current !== null && !isPaused && !isDraggingRef.current) {
        const delta = time - lastTimeRef.current;
        // Smooth slow movement to the right: ~26px per second
        const speed = 0.026; // px per ms
        setTrackOffset((prev) => prev + delta * speed);
      }
      lastTimeRef.current = time;
      animationFrameRef.current = requestAnimationFrame(updateConveyor);
    },
    [isPaused]
  );

  useEffect(() => {
    lastTimeRef.current = performance.now();
    animationFrameRef.current = requestAnimationFrame(updateConveyor);
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateConveyor]);

  // Touch & Mouse Drag Gestures
  const handlePointerDown = (clientX: number) => {
    isDraggingRef.current = true;
    dragStartXRef.current = clientX;
    dragStartOffsetRef.current = trackOffset;
    hasMovedRef.current = false;
    setIsInteracting(true);
  };

  const handlePointerMove = (clientX: number) => {
    if (!isDraggingRef.current || dragStartXRef.current === null) return;
    const diffX = clientX - dragStartXRef.current;
    if (Math.abs(diffX) > 5) {
      hasMovedRef.current = true;
    }
    setTrackOffset(dragStartOffsetRef.current + diffX);
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    dragStartXRef.current = null;
    setIsInteracting(false);
  };

  // Automatic hover flip: smoothly pauses conveyor and flips card 180 degrees
  const handleCardMouseEnter = (index: number) => {
    if (window.matchMedia('(hover: hover)').matches) {
      setActiveFlippedIndex(index);
      setIsInteracting(true);
    }
  };

  // Cursor leave: smoothly flips back to 0 degrees and automatically resumes movement
  const handleCardMouseLeave = (index: number) => {
    if (window.matchMedia('(hover: hover)').matches) {
      if (activeFlippedIndex === index) {
        setActiveFlippedIndex(null);
      }
      setIsInteracting(false);
    }
  };

  // Click / tap handler (for mobile or keyboard activation; ignored during drag)
  const handleCardClick = (index: number) => {
    if (hasMovedRef.current) return;
    setActiveFlippedIndex((prev) => (prev === index ? null : index));
  };

  // Responsive dimensions and horizontal conveyor spacing
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const cardWidth = isMobile ? 220 : 265;
  const cardHeight = isMobile ? 320 : 375;
  const cardGap = isMobile ? 22 : 35;
  const stride = cardWidth + cardGap; // ~300px desktop, ~242px mobile
  const totalSpan = steps.length * stride; // 1200px desktop, 968px mobile
  const halfSpan = totalSpan / 2; // 600px desktop, 484px mobile

  // Arc curvature settings matching reference image
  const arcDropMax = isMobile ? 22 : 36; // px vertical downward offset for outer cards
  const arcDepthMax = isMobile ? 55 : 85; // px recession into depth for outer cards
  const maxAngle = isMobile ? 18 : 22; // degrees inward Y rotation for outer cards

  return (
    <section
      id="how-it-works"
      className="relative py-20 sm:py-28 lg:py-32 px-4 sm:px-6 lg:px-8 border-t border-zinc-200/80 dark:border-zinc-900 bg-zinc-50/70 dark:bg-[#0B0B0B] transition-colors duration-300 overflow-hidden"
    >
      {/* Ambient Depth Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#FF2DA8]/8 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-6xl mx-auto w-full relative z-10 flex flex-col items-center">
        {/* Minimal Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white font-display mb-3">
            How It Works
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            Everyday AI runs entirely on your device. When an online task is needed, it only proceeds with your explicit permission.
          </p>
        </div>

        {/* Horizontal Infinite Conveyor Belt along Smooth Curved Arc */}
        <div
          ref={containerRef}
          onMouseDown={(e) => handlePointerDown(e.clientX)}
          onMouseMove={(e) => handlePointerMove(e.clientX)}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={(e) => handlePointerDown(e.touches[0].clientX)}
          onTouchMove={(e) => handlePointerMove(e.touches[0].clientX)}
          onTouchEnd={handlePointerUp}
          className="relative w-full max-w-6xl h-[420px] sm:h-[450px] md:h-[470px] flex items-center justify-center select-none cursor-grab active:cursor-grabbing overflow-visible"
          style={{
            perspective: '1200px',
            transformStyle: 'preserve-3d',
            maskImage:
              'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
          }}
        >
          {steps.map((stepItem, idx) => {
            // Base slot position for card idx in the 4-card sequence
            const basePos = (idx - 1.5) * stride;
            // Continuous position with track offset
            const rawPos = basePos + trackOffset;

            // Symmetrical modular wrapping in [-halfSpan, halfSpan]
            // As card moves right past +halfSpan, it seamlessly wraps to -halfSpan on the left
            let x = ((rawPos + halfSpan) % totalSpan);
            if (x < 0) x += totalSpan;
            x -= halfSpan;

            // Normalized position ratio u in [-1, 1] relative to center
            const u = x / halfSpan;
            const absU = Math.min(1, Math.abs(u));

            // Curved Arc Geometry matching the reference image:
            // 1. Center cards are highest (translateY = 0); outer cards gradually drop downward along a smooth parabola
            const translateY = Math.pow(absU, 1.8) * arcDropMax;

            // 2. Center cards are closest (translateZ = 0); outer cards gently recede in depth
            const translateZ = -Math.pow(absU, 1.4) * arcDepthMax;

            // 3. Center cards face forward (rotateY = 0); outer cards turn gently inward with 3D perspective
            const rotateY = -u * maxAngle;

            // 4. Center cards are slightly larger (scale 1.0); outer cards scale down slightly
            const scale = 1 - Math.pow(absU, 1.3) * 0.12;

            // Natural edge fade: fully opaque across visible track, smoothly dissolves at boundary
            const edgeFade = absU > 0.82 ? Math.max(0, (1 - absU) / 0.18) : 1;
            const zIndex = Math.round(30 - 20 * absU);

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
                className="absolute rounded-[28px] focus:outline-none focus:ring-2 focus:ring-[#FF2DA8]/50 will-change-transform"
                style={{
                  width: `${cardWidth}px`,
                  height: `${cardHeight}px`,
                  transform: `translate3d(${x}px, ${translateY}px, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                  opacity: edgeFade,
                  zIndex,
                  transformStyle: 'preserve-3d',
                  pointerEvents: edgeFade < 0.2 ? 'none' : 'auto',
                }}
              >
                {/* 3D Flip Card Container */}
                <div
                  className="w-full h-full relative rounded-[28px] transition-transform duration-600 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                >
                  {/* FRONT FACE: Minimal, Elegant Portrait Card */}
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
