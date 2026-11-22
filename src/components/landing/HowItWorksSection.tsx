import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  ShieldCheck,
  Eye,
  CheckCircle2,
  Lock,
  ArrowRight,
  Code2,
  AlertTriangle,
  Terminal,
} from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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
    subtitle: 'Browser-Engine Execution',
    badge: 'ONLY_ON_DEVICE',
    badgeColor: '#D4FF3F',
    description:
      'Queries, Python quiz generation, and conversation turns execute entirely on your machine via Chrome Prompt API and Gemini Nano. No prompt data leaves your network.',
    codeSnippet: `// 1. Single-turn on-device inference
const model = getGenerativeModel(ai, {
  model: 'gemini-nano',
  mode: InferenceMode.ONLY_ON_DEVICE
});
const result = await model.generateContent(prompt);
// Output source: "on_device"`,
    details: [
      'Zero round-trip latency to external cloud servers',
      'Encrypted client storage in IndexedDB via Dexie',
      'Strict execution gate: throws rather than silent fallback',
    ],
  },
  {
    step: '02',
    title: 'Privacy Check',
    subtitle: 'Deterministic Sanitization',
    badge: 'PII_REDACTOR_ACTIVE',
    badgeColor: '#FF2DA8',
    description:
      'Before any request can even be prepared for the cloud planner, a deterministic rule engine strips telephone numbers, email addresses, and user-marked personal entities.',
    codeSnippet: `// 2. Deterministic Regex & Dictionary Redaction
const sanitized = sanitizePayload({
  rawTopic: "Python study plan for alice@example.com (555-0199)",
  forbiddenPatterns: [REGEX_EMAIL, REGEX_PHONE, USER_NAMES]
});
// Redacted: "Python study plan for [EMAIL_REDACTED] ([PHONE_REDACTED])"`,
    details: [
      'Rules-based, deterministic engine — never AI hallucinated',
      'Warning alerts on ambiguous unstructured notes',
      '100% auditable client-side transform',
    ],
  },
  {
    step: '03',
    title: 'User Approval',
    subtitle: 'Human-in-the-Loop Gate',
    badge: 'EXPLICIT_APPROVAL_REQUIRED',
    badgeColor: '#D4FF3F',
    description:
      'A modal displays the exact sanitized JSON payload. You inspect every byte before transmission. The cloud request is strictly blocked until you click Approve.',
    codeSnippet: `// 3. Mandatory Human Approval Gate
const isApproved = await requestUserApprovalModal({
  targetUrl: "https://generativelanguage.googleapis.com/...",
  payload: sanitizedPayload,
  action: "Generate 7-Day Study Plan"
});
if (!isApproved) return; // Request aborted cleanly`,
    details: [
      'Full payload transparency with syntax highlighting',
      'One-click Cancel instantly aborts without transmission',
      'Pending queue for offline requests with manual Sync',
    ],
  },
  {
    step: '04',
    title: 'Saved Result',
    subtitle: 'Dual-Gated Firestore Storage',
    badge: 'ZOD_VALIDATED_WRITE',
    badgeColor: '#FF2DA8',
    description:
      'Cloud response is validated against strict Zod schemas. Once rendered, you review the tasks and approve or reject saving them to Firestore under your anonymous user ID.',
    codeSnippet: `// 4. Schema validation and second approval gate
const validatedPlan = StudyPlanSchema.parse(cloudResponse);
const saveApproved = await confirmFirestoreSave(validatedPlan);
if (saveApproved) {
  await setDoc(doc(db, 'tasks', taskId), { ...task, userId: auth.currentUser.uid });
}`,
    details: [
      'Separate approvals for generation vs. cloud database persistence',
      'Strict Firestore security rules: users access only their own ID',
      'Client verification of all schema properties',
    ],
  },
];

export const HowItWorksSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      // Animate header entrance
      gsap.from('.how-header', {
        scrollTrigger: {
          trigger: '.how-header',
          start: 'top 85%',
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
      });

      // Animate step cards reveal
      gsap.from('.step-nav-item', {
        scrollTrigger: {
          trigger: '.steps-container',
          start: 'top 80%',
        },
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.15,
        ease: 'power2.out',
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const currentStep = steps[activeStepIndex];

  return (
    <section
      ref={sectionRef}
      id="how-it-works"
      className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-zinc-900 bg-[#0B0B0B] relative"
    >
      <div className="max-w-7xl mx-auto steps-container">
        {/* Section Header */}
        <div className="how-header text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-[#D4FF3F] glow-chartreuse-sm" />
            <span>The AIVARION Security Standard</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-display">
            How It Works
          </h2>
          <p className="text-zinc-400 text-base sm:text-lg max-w-2xl mx-auto">
            A transparent four-step sequence guaranteeing that on-device models do the thinking, and cloud APIs act only with your signed consent.
          </p>
        </div>

        {/* Interactive Step Switcher Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {steps.map((s, idx) => {
            const isActive = activeStepIndex === idx;
            return (
              <button
                key={s.step}
                onClick={() => setActiveStepIndex(idx)}
                className={`step-nav-item text-left p-4 rounded-xl border transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-[#FF2DA8] ${
                  isActive
                    ? 'bg-zinc-900/90 border-[#FF2DA8] shadow-lg shadow-[#FF2DA8]/15'
                    : 'bg-zinc-950/50 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`font-mono text-sm font-bold ${
                      isActive ? 'text-[#FF2DA8]' : 'text-zinc-500'
                    }`}
                  >
                    {s.step}
                  </span>
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-[#D4FF3F] glow-chartreuse-sm" />
                  )}
                </div>
                <div className="font-semibold text-white text-sm sm:text-base">{s.title}</div>
                <div className="text-xs text-zinc-400 truncate">{s.subtitle}</div>
              </button>
            );
          })}
        </div>

        {/* Active Step Detailed Interactive Showcase Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#101012] border border-zinc-800 rounded-2xl p-6 sm:p-10 shadow-2xl">
          {/* Left: Description & Rules */}
          <div className="lg:col-span-6 space-y-6">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-zinc-900 border border-zinc-700 text-white">
                Step {currentStep.step} of 04
              </span>
              <span
                className="px-2.5 py-0.5 rounded text-[11px] font-mono border"
                style={{
                  borderColor: currentStep.badgeColor,
                  color: currentStep.badgeColor,
                }}
              >
                {currentStep.badge}
              </span>
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white font-display mb-2">
                {currentStep.title}
              </h3>
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                {currentStep.description}
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                Guaranteed Implementation Rules
              </h4>
              <ul className="space-y-2">
                {currentStep.details.map((detail, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-zinc-300">
                    <CheckCircle2 className="w-4 h-4 text-[#D4FF3F] shrink-0" />
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: Code & Architecture Simulation */}
          <div className="lg:col-span-6">
            <div className="rounded-xl overflow-hidden bg-[#0A0A0B] border border-zinc-800/90 shadow-xl font-mono text-xs">
              <div className="px-4 py-3 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between text-zinc-400">
                <div className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-[#FF2DA8]" />
                  <span>aivarion_privacy_kernel.ts</span>
                </div>
                <span className="text-[10px] text-zinc-500">CLIENT_SANDBOX</span>
              </div>
              <pre className="p-4 sm:p-6 overflow-x-auto text-zinc-300 leading-relaxed selection:bg-[#FF2DA8] selection:text-white">
                <code>{currentStep.codeSnippet}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
