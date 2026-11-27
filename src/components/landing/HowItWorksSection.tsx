import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  Terminal,
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
  const containerRef = useRef<HTMLElement>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motionQuery.matches);

    const onMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    motionQuery.addEventListener('change', onMotionChange);

    if (motionQuery.matches) {
      return () => motionQuery.removeEventListener('change', onMotionChange);
    }

    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const topOffset = 80; // height of fixed navbar

        // While user has not reached the sticky position, lock strictly to Step 1
        if (rect.top > topOffset) {
          setActiveStepIndex(0);
          return;
        }

        const stickyHeight = window.innerHeight - topOffset;
        const scrollableDist = rect.height - stickyHeight;
        if (scrollableDist <= 0) return;

        const scrolled = topOffset - rect.top;
        const fraction = Math.max(0, Math.min(1, scrolled / scrollableDist));

        // Sync steps across 4 equal scroll segments:
        // [0.00, 0.25) -> Step 0 (Step 1 active, 25% progress)
        // [0.25, 0.50) -> Step 1 (Step 2 active, 50% progress)
        // [0.50, 0.75) -> Step 2 (Step 3 active, 75% progress)
        // [0.75, 1.00] -> Step 3 (Step 4 active, 100% progress)
        const step = Math.min(3, Math.floor(fraction * 3.99));
        setActiveStepIndex(step);
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    return () => {
      motionQuery.removeEventListener('change', onMotionChange);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  const handleStepClick = (idx: number) => {
    setActiveStepIndex(idx);
    if (!containerRef.current || reducedMotion) return;
    const rect = containerRef.current.getBoundingClientRect();
    const topOffset = 80;
    const stickyHeight = window.innerHeight - topOffset;
    const scrollableDist = rect.height - stickyHeight;
    if (scrollableDist <= 0) return;

    // Scroll to the midpoint of the selected step's runway
    const stepCenterFraction = (idx + 0.5) / 4;
    const targetScrollY = window.scrollY + rect.top - topOffset + (stepCenterFraction * scrollableDist);
    window.scrollTo({ top: targetScrollY, behavior: 'smooth' });
  };

  const currentStep = steps[activeStepIndex];

  return (
    <section
      ref={containerRef}
      id="how-it-works"
      className="relative bg-zinc-50/60 dark:bg-[#0B0B0B] border-t border-zinc-200/80 dark:border-zinc-900 transition-colors duration-300"
      style={{ height: reducedMotion ? 'auto' : '340vh' }}
    >
      {/* Sticky Viewport Container: stays centered and fully visible in view */}
      <div
        className={
          reducedMotion
            ? 'py-16 sm:py-24 px-4 sm:px-6 lg:px-8'
            : 'sticky top-20 min-h-[calc(100vh-80px)] flex flex-col justify-center py-4 sm:py-6 px-4 sm:px-6 lg:px-8 z-10'
        }
      >
        <div className="max-w-6xl mx-auto w-full flex flex-col justify-center">
          {/* Section Header */}
          <div className="how-header text-center max-w-2xl mx-auto mb-3 sm:mb-4">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white font-display mb-1.5">
              How It Works
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-xs sm:text-sm max-w-xl mx-auto leading-relaxed">
              Everyday AI runs entirely on your device. When an online task is needed, it only proceeds with your explicit permission.
            </p>
          </div>

          {/* Interactive Step Switcher Bar */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-2.5 sm:mb-3">
            {steps.map((s, idx) => {
              const isActive = activeStepIndex === idx;
              return (
                <button
                  key={s.step}
                  onClick={() => handleStepClick(idx)}
                  className={`step-nav-item text-left p-2 sm:p-3 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-[#FF2DA8] ${
                    isActive
                      ? 'bg-white dark:bg-zinc-900/90 border-[#FF2DA8] shadow-md shadow-[#FF2DA8]/15'
                      : 'bg-white/80 dark:bg-zinc-950/50 border-zinc-200/90 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 hover:-translate-y-0.5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`font-mono text-xs sm:text-sm font-bold ${
                        isActive ? 'text-[#FF2DA8]' : 'text-zinc-400 dark:text-zinc-500'
                      }`}
                    >
                      {s.step}
                    </span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F] glow-chartreuse-sm" />
                    )}
                  </div>
                  <div className="font-semibold text-zinc-900 dark:text-white text-xs sm:text-sm truncate">{s.title}</div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate hidden sm:block mt-0.5">{s.subtitle}</div>
                </button>
              );
            })}
          </div>

          {/* Synchronized Progress Track: 25% -> 50% -> 75% -> 100% */}
          <div className="w-full bg-zinc-200/80 dark:bg-zinc-900/80 rounded-full h-1.5 mb-3 sm:mb-4 overflow-hidden relative border border-zinc-300/80 dark:border-zinc-800/80">
            <div
              className="h-full bg-[#FF2DA8] transition-all duration-500 ease-out shadow-[0_0_12px_rgba(255,45,168,0.5)]"
              style={{ width: `${(activeStepIndex + 1) * 25}%` }}
            />
          </div>

          {/* Active Step Detailed Interactive Showcase Panel: fits comfortably without cutting off */}
          <div
            key={activeStepIndex}
            className="animate-stepFadeIn grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-center glass-surface rounded-2xl p-4 sm:p-5 lg:p-6 shadow-xl relative overflow-hidden"
          >
            {/* Ambient Radial Glow */}
            <div className="absolute -right-20 -bottom-20 w-72 h-72 bg-[#FF2DA8]/10 rounded-full blur-[90px] pointer-events-none" />

            {/* Left: Description & Rules */}
            <div className="lg:col-span-6 space-y-2.5 sm:space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white">
                  Step {currentStep.step} of 04
                </span>
                <span
                  className="px-2 py-0.5 rounded text-[11px] font-mono border"
                  style={{
                    borderColor: currentStep.badgeColor,
                    color: currentStep.badgeColor,
                  }}
                >
                  {currentStep.badge}
                </span>
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white font-display mb-1.5">
                  {currentStep.title}
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {currentStep.description}
                </p>
              </div>

              <div className="space-y-1.5 pt-0.5">
                <h4 className="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold mb-1">
                  Guaranteed Privacy Protections
                </h4>
                <ul className="space-y-1">
                  {currentStep.details.map((detail, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#FF2DA8] shrink-0" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right: Code & Architecture Simulation */}
            <div className="lg:col-span-6">
              <div className="rounded-xl overflow-hidden bg-[#0A0A0B] border border-zinc-800/90 shadow-xl font-mono text-[11px] sm:text-xs">
                <div className="px-3 py-1.5 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-[#FF2DA8]" />
                    <span>aivarion_privacy_kernel.ts</span>
                  </div>
                  <span className="text-[10px] text-zinc-500">CLIENT_SANDBOX</span>
                </div>
                <pre className="p-3 sm:p-3.5 overflow-x-auto text-zinc-300 leading-relaxed selection:bg-[#FF2DA8] selection:text-white max-h-[130px] sm:max-h-[150px] lg:max-h-[175px] overflow-y-auto">
                  <code>{currentStep.codeSnippet}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;