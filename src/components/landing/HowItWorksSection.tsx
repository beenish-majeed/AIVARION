import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  CheckCircle2,
  Terminal,
  ChevronLeft,
  ChevronRight,
  RotateCw,
} from 'lucide-react';

interface StepData {
  step: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  description: string;
  codeSnippet: string;
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
    codeSnippet: `// 1. Instant on-device execution
const model = getGenerativeModel(ai, {
  model: 'gemini-nano',
  mode: InferenceMode.ONLY_ON_DEVICE
});
const result = await model.generateContent(prompt);
// Output source: "on_device"`,
    details: [
      'Runs locally with zero lag and works offline',
      'Saved strictly to your private browser space',
      'Never tracks activity or sends background analytics',
    ],
  },
  {
    step: '02',
    title: 'Privacy Check',
    subtitle: 'Automatic protection',
    badge: 'PII_REDACTOR_ACTIVE',
    badgeColor: '#FF2DA8',
    description:
      'Before you choose to run any online task, personal details like names, emails, and phone numbers are automatically cleaned.',
    codeSnippet: `// 2. Automatic personal info protection
const sanitized = sanitizePayload({
  rawTopic: "Python study plan for user@example.com (555-0199)",
  forbiddenPatterns: [REGEX_EMAIL, REGEX_PHONE, USER_NAMES]
});
// Redacted: "Python study plan for [EMAIL_REDACTED] ([PHONE_REDACTED])"`,
    details: [
      'Automatically cleans sensitive personal details',
      'Highlights any identified items before sending',
      'Keeps your identity shielded and secure',
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
    codeSnippet: `// 3. Clear human permission gate
const isApproved = await requestUserApprovalModal({
  targetUrl: "https://generativelanguage.googleapis.com/...",
  payload: sanitizedPayload,
  action: "Generate 7-Day Study Plan"
});
if (!isApproved) return; // Request aborted cleanly`,
    details: [
      'Nothing leaves your computer without your click',
      'Review the exact cleaned text before it goes online',
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
    codeSnippet: `// 4. Safe structure check and private save
const validatedPlan = StudyPlanSchema.parse(cloudResponse);
const saveApproved = await confirmFirestoreSave(validatedPlan);
if (saveApproved) {
  await setDoc(doc(db, 'tasks', taskId), { ...task, userId: auth.currentUser.uid });
}`,
    details: [
      'Verified and organized cleanly for high reliability',
      'Stored securely in your private browser database',
      'Full freedom to keep, edit, or delete at any time',
    ],
  },
];

export const HowItWorksSection: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const totalSteps = steps.length;

  const goToStep = useCallback((idx: number) => {
    setActiveIndex((idx + totalSteps) % totalSteps);
    setIsFlipped(false);
  }, [totalSteps]);

  const handleNext = useCallback(() => {
    goToStep(activeIndex + 1);
  }, [activeIndex, goToStep]);

  const handlePrev = useCallback(() => {
    goToStep(activeIndex - 1);
  }, [activeIndex, goToStep]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  // Touch and mouse drag gestures for smooth carousel rotation
  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragStartX === null) return;
    const diff = e.changedTouches[0].clientX - dragStartX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handlePrev();
      else handleNext();
    }
    setDragStartX(null);
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragStartX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragStartX === null) return;
    const diff = e.clientX - dragStartX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) handlePrev();
      else handleNext();
    }
    setDragStartX(null);
    setIsDragging(false);
  };

  return (
    <section
      id="how-it-works"
      className="relative py-24 sm:py-32 lg:py-36 px-4 sm:px-6 lg:px-8 border-t border-zinc-200/80 dark:border-zinc-900 bg-zinc-50/70 dark:bg-[#0B0B0B] transition-colors duration-300 overflow-hidden"
    >
      {/* Ambient Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF2DA8]/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto w-full relative z-10">
        {/* Section Header */}
        <div className="how-header text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900 text-xs font-medium text-zinc-700 dark:text-zinc-300 shadow-sm mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF2DA8]" />
            <span>Interactive 3D Pipeline</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-zinc-900 dark:text-white font-display mb-3">
            How It Works
          </h2>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base leading-relaxed max-w-xl mx-auto">
            Everyday AI runs entirely on your device. When an online task is needed, it only proceeds with your explicit permission.
          </p>
        </div>

        {/* Step Quick Selector Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8 sm:mb-12">
          {steps.map((s, idx) => {
            const isActive = activeIndex === idx;
            return (
              <button
                key={s.step}
                onClick={() => goToStep(idx)}
                className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-[#FF2DA8] ${
                  isActive
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border border-[#FF2DA8] shadow-md shadow-[#FF2DA8]/20 scale-105'
                    : 'bg-white/80 dark:bg-zinc-950/60 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800/80 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <span className={`font-mono text-xs ${isActive ? 'text-[#FF2DA8]' : 'text-zinc-400 dark:text-zinc-500'}`}>
                  {s.step}
                </span>
                <span>{s.title}</span>
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F] glow-chartreuse-sm" />
                )}
              </button>
            );
          })}
        </div>

        {/* 3D Circular Orbit Carousel Stage */}
        <div
          ref={carouselRef}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          className="relative w-full max-w-4xl mx-auto h-[460px] sm:h-[490px] md:h-[520px] flex items-center justify-center select-none"
          style={{ perspective: '1400px' }}
        >
          {steps.map((stepItem, idx) => {
            const rawOffset = idx - activeIndex;
            const offset = ((((rawOffset % 4) + 4) + 2) % 4) - 2;
            const isActive = offset === 0;
            const isLeft = offset === -1;
            const isRight = offset === 1;
            const isBack = !isActive && !isLeft && !isRight;

            const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
            const wingX = isMobile ? 115 : 240;
            const translateX = isActive || isBack ? 0 : isLeft ? -wingX : wingX;
            const translateZ = isActive ? 80 : isBack ? -220 : -90;
            const rotateY = isActive ? 0 : isBack ? 180 : isLeft ? 28 : -28;
            const scale = isActive ? 1.04 : isBack ? 0.72 : 0.86;
            const opacity = isActive ? 1 : isBack ? 0.18 : 0.58;
            const zIndex = isActive ? 30 : isBack ? 10 : 20;
            const isCardFlipped = isActive && isFlipped;

            return (
              <div
                key={stepItem.step}
                onClick={() => { if (!isActive) goToStep(idx); }}
                className={`absolute w-[305px] sm:w-[380px] md:w-[440px] h-[390px] sm:h-[410px] md:h-[430px] rounded-3xl cursor-pointer transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isActive ? 'cursor-default' : 'hover:opacity-80'
                }`}
                style={{
                  transform: `translate3d(${translateX}px, 0px, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                  opacity,
                  zIndex,
                  transformStyle: 'preserve-3d',
                  pointerEvents: isBack ? 'none' : 'auto',
                }}
              >
                {/* 3D Flip Container */}
                <div
                  className="w-full h-full relative transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                >
                  {/* FRONT FACE: Step Overview & Visual Benefit */}
                  <div
                    className={`absolute inset-0 w-full h-full rounded-3xl p-6 sm:p-7 flex flex-col justify-between glass-surface border shadow-2xl overflow-hidden [backface-visibility:hidden] ${
                      isActive
                        ? 'border-[#FF2DA8]/60 shadow-[0_0_40px_rgba(255,45,168,0.18)] dark:bg-[#121215]/95 bg-white/95'
                        : 'border-zinc-200 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80'
                    }`}
                  >
                    {/* Top Pill & Badge Bar */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="w-8 h-8 rounded-xl bg-[#FF2DA8]/10 border border-[#FF2DA8]/20 flex items-center justify-center font-mono font-bold text-xs text-[#FF2DA8]">
                            {stepItem.step}
                          </span>
                          <span
                            className="px-2.5 py-0.5 rounded text-[11px] font-mono border"
                            style={{
                              borderColor: stepItem.badgeColor,
                              color: stepItem.badgeColor,
                            }}
                          >
                            {stepItem.badge}
                          </span>
                        </div>
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-[#D4FF3F] glow-chartreuse-sm" />
                        )}
                      </div>

                      {/* Title & Subtitle */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isActive) goToStep(idx);
                        }}
                        className="text-left w-full cursor-pointer"
                      >
                        <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white font-display mb-1">
                          {stepItem.title}
                        </h3>
                        <p className="text-xs font-medium text-[#FF2DA8] mb-3">
                          {stepItem.subtitle}
                        </p>
                      </div>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed mb-4">
                        {stepItem.description}
                      </p>

                      {/* Privacy Details Checklist */}
                      <ul className="space-y-2">
                        {stepItem.details.map((detail, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#FF2DA8] shrink-0" />
                            <span className="truncate">{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Bottom Action: Flip to Code & Architecture */}
                    <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
                      {isActive ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsFlipped(true);
                          }}
                          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-[#FF2DA8]/10 hover:bg-[#FF2DA8] text-[#FF2DA8] hover:text-white transition-all duration-300 border border-[#FF2DA8]/30 shadow-sm"
                        >
                          <Terminal className="w-3.5 h-3.5" />
                          <span>Flip to Inspect Code & Sandbox</span>
                          <RotateCw className="w-3 h-3 ml-1" />
                        </button>
                      ) : (
                        <div className="w-full text-center text-[11px] font-mono text-zinc-400">
                          Click to bring to center
                        </div>
                      )}
                    </div>
                  </div>

                  {/* BACK FACE: Detailed Code Terminal & Simulation */}
                  <div
                    className={`absolute inset-0 w-full h-full rounded-3xl p-5 sm:p-6 flex flex-col justify-between glass-surface border shadow-2xl overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)] ${
                      isActive
                        ? 'border-[#FF2DA8]/60 shadow-[0_0_40px_rgba(255,45,168,0.18)] dark:bg-[#0E0E12] bg-zinc-900 text-white'
                        : 'border-zinc-800 bg-[#0E0E12] text-white'
                    }`}
                  >
                    <div>
                      {/* Back Header */}
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
                        <div className="flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-[#FF2DA8]" />
                          <span className="font-mono text-xs font-semibold text-zinc-200">
                            aivarion_kernel_step_{stepItem.step}.ts
                          </span>
                        </div>
                        <span className="text-[10px] font-mono text-[#D4FF3F] bg-[#D4FF3F]/10 px-2 py-0.5 rounded border border-[#D4FF3F]/20">
                          VERIFIED
                        </span>
                      </div>

                      {/* Code Snippet Box */}
                      <div className="rounded-xl overflow-hidden bg-[#050507] border border-zinc-800/90 shadow-inner font-mono text-[11px] sm:text-xs">
                        <pre className="p-3.5 sm:p-4 overflow-x-auto text-zinc-300 leading-relaxed max-h-[200px] sm:max-h-[220px] overflow-y-auto selection:bg-[#FF2DA8] selection:text-white">
                          <code>{stepItem.codeSnippet}</code>
                        </pre>
                      </div>

                      {/* Architecture rule footer */}
                      <div className="mt-3 text-[11px] text-zinc-400 flex items-center justify-between font-mono">
                        <span>Rule: {stepItem.badge}</span>
                        <span className="text-[#D4FF3F]">100% Deterministic</span>
                      </div>
                    </div>

                    {/* Back Button */}
                    <div className="pt-3 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsFlipped(false);
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-all border border-zinc-700"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        <span>Flip Back to Step Overview</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel Bottom Controls & Synchronized Progress Bar */}
        <div className="mt-8 flex flex-col items-center justify-center gap-4">
          {/* Previous / Next Circular Buttons */}
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrev}
              className="p-3 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 hover:border-[#FF2DA8] hover:text-[#FF2DA8] text-zinc-700 dark:text-zinc-300 transition-all duration-300 shadow-md focus:outline-none focus:ring-1 focus:ring-[#FF2DA8]"
              aria-label="Previous step"
              title="Previous step"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Step Counter Indicator */}
            <div className="font-mono text-xs font-semibold text-zinc-600 dark:text-zinc-400 px-3">
              Step <span className="text-[#FF2DA8] font-bold">{steps[activeIndex].step}</span> of 04
            </div>

            <button
              onClick={handleNext}
              className="p-3 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 hover:border-[#FF2DA8] hover:text-[#FF2DA8] text-zinc-700 dark:text-zinc-300 transition-all duration-300 shadow-md focus:outline-none focus:ring-1 focus:ring-[#FF2DA8]"
              aria-label="Next step"
              title="Next step"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Synchronized Progress Track: 25% -> 50% -> 75% -> 100% */}
          <div className="w-48 sm:w-64 bg-zinc-200/80 dark:bg-zinc-900/80 rounded-full h-1.5 overflow-hidden relative border border-zinc-300/80 dark:border-zinc-800/80">
            <div
              className="h-full bg-[#FF2DA8] transition-all duration-500 ease-out shadow-[0_0_12px_rgba(255,45,168,0.5)]"
              style={{ width: `${(activeIndex + 1) * 25}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;