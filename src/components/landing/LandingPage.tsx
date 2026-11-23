import React, { useEffect, useRef } from 'react';
import { Navbar } from '../layout/Navbar';
import { Footer } from '../layout/Footer';
import { HeroSection } from './HeroSection';
import { HowItWorksSection } from './HowItWorksSection';
import { MagneticCursor } from './MagneticCursor';
import { MagneticButton } from './MagneticButton';
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  FileText,
  GraduationCap,
  Sparkles,
  Lock,
  CloudLightning,
  Database,
} from 'lucide-react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Lenis Smooth Scrolling (disabled if prefers-reduced-motion)
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let lenis: Lenis | null = null;

    if (!prefersReducedMotion) {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true,
      });

      function raf(time: number) {
        lenis?.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }

    // 2. GSAP ScrollTrigger Entrance animations and interactive micro-interactions
    const ctx = gsap.context(() => {
      if (prefersReducedMotion) return;

      gsap.utils.toArray<HTMLElement>('.reveal-card').forEach((card) => {
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
          },
          y: 40,
          opacity: 0,
          duration: 0.7,
          ease: 'power3.out',
        });
      });

      // 3D Card tilt and hover micro-interactions
      const cleanupFns: Array<() => void> = [];
      const interactiveCards = gsap.utils.toArray<HTMLElement>('.glass-surface-interactive');
      interactiveCards.forEach((card) => {
        gsap.set(card, { transformPerspective: 900, transformStyle: 'preserve-3d' });
        const setRotateX = gsap.quickTo(card, 'rotationX', { duration: 0.35, ease: 'power2.out' });
        const setRotateY = gsap.quickTo(card, 'rotationY', { duration: 0.35, ease: 'power2.out' });
        const setScale = gsap.quickTo(card, 'scale', { duration: 0.35, ease: 'power2.out' });

        const onCardMove = (e: MouseEvent) => {
          const rect = card.getBoundingClientRect();
          const relX = (e.clientX - rect.left) / rect.width - 0.5;
          const relY = (e.clientY - rect.top) / rect.height - 0.5;
          setRotateY(relX * 8);
          setRotateX(-relY * 8);
          setScale(1.015);
        };

        const onCardLeave = () => {
          setRotateX(0);
          setRotateY(0);
          setScale(1);
        };

        card.addEventListener('mousemove', onCardMove);
        card.addEventListener('mouseleave', onCardLeave);
        cleanupFns.push(() => {
          card.removeEventListener('mousemove', onCardMove);
          card.removeEventListener('mouseleave', onCardLeave);
        });
      });

      return () => {
        cleanupFns.forEach((fn) => fn());
      };
    }, containerRef);

    return () => {
      lenis?.destroy();
      ctx.revert();
    };
  }, []);

  const handleTryClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onNavigate('/app');
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#0B0B0B] text-white flex flex-col selection:bg-[#FF2DA8] selection:text-white">
      {/* Magnetic Cursor Follower */}
      <MagneticCursor />

      {/* Brand Header */}
      <Navbar currentPath="/" onNavigate={onNavigate} />

      <main className="flex-1">
        {/* 3D Orbit Hero Section */}
        <HeroSection onNavigate={onNavigate} />

        {/* Kinetic Typography Marquee Ticker */}
        <div className="py-3.5 border-y border-zinc-900 bg-black/60 overflow-hidden relative select-none">
          <div className="kinetic-marquee-track text-xs font-mono tracking-widest uppercase text-zinc-400">
            <span className="mx-6 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF2DA8]" />
              <span>100% On-Device Inference</span>
            </span>
            <span className="mx-6 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
              <span>Zero Cloud Surveillance</span>
            </span>
            <span className="mx-6 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF2DA8]" />
              <span>Deterministic Python Skill Coach</span>
            </span>
            <span className="mx-6 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
              <span>Client-Encrypted IndexedDB Notes</span>
            </span>
            <span className="mx-6 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF2DA8]" />
              <span>Dual Human Approval Gates</span>
            </span>
            <span className="mx-6 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
              <span>Zod Schema Validated</span>
            </span>
            {/* Duplicated for seamless continuous marquee loop */}
            <span className="mx-6 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF2DA8]" />
              <span>100% On-Device Inference</span>
            </span>
            <span className="mx-6 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
              <span>Zero Cloud Surveillance</span>
            </span>
            <span className="mx-6 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF2DA8]" />
              <span>Deterministic Python Skill Coach</span>
            </span>
            <span className="mx-6 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
              <span>Client-Encrypted IndexedDB Notes</span>
            </span>
            <span className="mx-6 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF2DA8]" />
              <span>Dual Human Approval Gates</span>
            </span>
            <span className="mx-6 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
              <span>Zod Schema Validated</span>
            </span>
          </div>
        </div>

        {/* 4-Step Interactive Sequence */}
        <HowItWorksSection />

        {/* Section: Capabilities */}
        <section id="features" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-zinc-900 bg-[#0E0E10]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-badge text-xs font-medium text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
                <span>Private Architecture Modules</span>
              </div>
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-display">
                Four Workspaces. <span className="kinetic-gradient-text">Zero Surveillance.</span>
              </h2>
              <p className="text-zinc-400 text-base sm:text-lg">
                Engineered to replace opaque cloud chat apps with deterministic local storage, offline AI, and human-gated cloud workflows.
              </p>
            </div>

            {/* Bento Grid Architecture */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
              {/* Bento 1: Private Chat (Large, 7 cols) */}
              <div className="reveal-card lg:col-span-7 glass-surface glass-surface-interactive rounded-2xl p-8 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#FF2DA8]/10 border border-[#FF2DA8]/30 flex items-center justify-center text-[#FF2DA8]">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-[#FF2DA8]/10 border border-[#FF2DA8]/30 text-[#FF2DA8] font-semibold">
                      LATENCY &lt; 1ms
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Private Local Chat</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                    Single-turn on-device inference with conversation history cached in browser IndexedDB. Every reply explicitly displays its runtime SDK source tag.
                  </p>
                  {/* Interactive Micro Mockup */}
                  <div className="p-3.5 rounded-xl bg-black/50 border border-zinc-800/80 font-mono text-xs space-y-2 mb-4">
                    <div className="text-zinc-400 flex items-center justify-between">
                      <span>&gt; prompt: "Explain async IO in Python"</span>
                      <span className="text-[#D4FF3F] text-[10px]">ON_DEVICE</span>
                    </div>
                    <div className="text-zinc-200 text-[11px] border-l-2 border-[#FF2DA8] pl-2 py-0.5">
                      "AsyncIO enables cooperative multitasking using an event loop..."
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#D4FF3F]" />
                    <span>Real-time SDK source indicator</span>
                  </span>
                  <span className="font-mono text-zinc-500">Dexie.js</span>
                </div>
              </div>

              {/* Bento 2: Python Skill Coach (Compact, 5 cols) */}
              <div className="reveal-card lg:col-span-5 glass-surface glass-surface-interactive rounded-2xl p-8 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center text-white">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-[#D4FF3F]/10 border border-[#D4FF3F]/30 text-[#D4FF3F] font-semibold">
                      DETERMINISTIC
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Python Skill Coach</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                    Interactive Python practice generated locally on-device. Answers are evaluated deterministically by deterministic code—never hallucinated by an LLM.
                  </p>
                  <div className="p-3.5 rounded-xl bg-black/50 border border-zinc-800/80 font-mono text-[11px] text-zinc-300 space-y-1 mb-4">
                    <div className="text-[#D4FF3F]">✓ assert user_answer === correct_index</div>
                    <div className="text-zinc-500"># 0 LLM grading error rate</div>
                  </div>
                </div>
                <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#D4FF3F]" />
                    <span>Zod schema validated questions</span>
                  </span>
                  <span className="font-mono text-zinc-500">100% Local</span>
                </div>
              </div>

              {/* Bento 3: Offline Personal Notes (Compact, 5 cols) */}
              <div className="reveal-card lg:col-span-5 glass-surface glass-surface-interactive rounded-2xl p-8 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center text-white">
                      <FileText className="w-6 h-6" />
                    </div>
                    <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 font-semibold">
                      AIR-GAPPED
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Offline Personal Notes</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                    Store confidential thoughts and code snippets directly inside your client browser. Notes are never synchronized to the cloud without explicit action.
                  </p>
                  <div className="p-3.5 rounded-xl bg-black/50 border border-zinc-800/80 font-mono text-[11px] text-zinc-400 flex items-center justify-between mb-4">
                    <span>Index: notes (title, tags, body)</span>
                    <span className="text-[#FF2DA8]">NO_TELEMETRY</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#FF2DA8]" />
                    <span>IndexedDB client read/write</span>
                  </span>
                  <span className="font-mono text-zinc-500">Zero Cloud Sync</span>
                </div>
              </div>

              {/* Bento 4: Guarded 7-Day Study Planner (Large, 7 cols) */}
              <div className="reveal-card lg:col-span-7 glass-surface glass-surface-interactive rounded-2xl p-8 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-12 h-12 rounded-xl bg-[#FF2DA8]/10 border border-[#FF2DA8]/30 flex items-center justify-center text-[#FF2DA8]">
                      <CloudLightning className="w-6 h-6" />
                    </div>
                    <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-[#D4FF3F]/10 border border-[#D4FF3F]/30 text-[#D4FF3F] font-semibold">
                      DUAL APPROVAL GATES
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Guarded 7-Day Study Planner</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                    Harness Gemini cloud capabilities exclusively for complex task planning, governed by sanitized preview inspectability and dual approval gates.
                  </p>
                  <div className="p-3.5 rounded-xl bg-black/50 border border-zinc-800/80 font-mono text-[11px] flex flex-wrap items-center gap-2 text-zinc-300 mb-4">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">PII Scrubber</span>
                    <span className="text-zinc-600">→</span>
                    <span className="px-2 py-0.5 rounded bg-[#FF2DA8]/20 text-[#FF2DA8]">Gate 1: Preview</span>
                    <span className="text-zinc-600">→</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">Cloud AI</span>
                    <span className="text-zinc-600">→</span>
                    <span className="px-2 py-0.5 rounded bg-[#D4FF3F]/20 text-[#D4FF3F]">Gate 2: Firestore</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#D4FF3F]" />
                    <span>Dual human confirmation gates</span>
                  </span>
                  <span className="font-mono text-zinc-500">App Check Secure</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Three AI Modes */}
        <section id="modes" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-t border-zinc-900 bg-[#0B0B0B]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-display">
                Three Explicit AI Modes
              </h2>
              <p className="text-zinc-400 text-base sm:text-lg">
                Absolute transparency over where computation executes and how your data is routed.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Private Local */}
              <div className="reveal-card glass-surface glass-surface-interactive glass-surface-active rounded-2xl p-7 relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-1 rounded-full bg-[#FF2DA8]/15 text-[#FF2DA8] text-xs font-semibold">
                      Maximum Privacy
                    </span>
                    <Lock className="w-4 h-4 text-[#FF2DA8]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Private Local</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                    Uses on-device inference only. Throws if the local model is unavailable. Guaranteed never to make cloud calls or fall back silently.
                  </p>
                </div>
                <div className="pt-4 border-t border-zinc-800/80 text-xs font-mono text-zinc-400 flex items-center justify-between">
                  <span>Firebase AI Logic</span>
                  <span className="text-[#FF2DA8]">ONLY_ON_DEVICE</span>
                </div>
              </div>

              {/* Hybrid Auto */}
              <div className="reveal-card glass-surface glass-surface-interactive rounded-2xl p-7 relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-1 rounded-full glass-badge text-zinc-300 text-xs font-semibold">
                      Local-First Fallback
                    </span>
                    <Sparkles className="w-4 h-4 text-[#D4FF3F]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Hybrid Auto</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                    Attempts local inference first. If unavailable, sanitizes payload and halts until you approve transmission before executing cloud inference.
                  </p>
                </div>
                <div className="pt-4 border-t border-zinc-800/80 text-xs font-mono text-zinc-400 flex items-center justify-between">
                  <span>Approval Gate</span>
                  <span className="text-[#D4FF3F]">PREFER_ON_DEVICE</span>
                </div>
              </div>

              {/* Cloud Guarded */}
              <div className="reveal-card glass-surface glass-surface-interactive rounded-2xl p-7 relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-1 rounded-full glass-badge text-zinc-300 text-xs font-semibold">
                      Explicit Cloud
                    </span>
                    <CloudLightning className="w-4 h-4 text-zinc-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Cloud Guarded</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                    Reserved exclusively for complex 7-day study planning tasks after deterministic PII removal and explicit payload inspection.
                  </p>
                </div>
                <div className="pt-4 border-t border-zinc-800/80 text-xs font-mono text-zinc-400 flex items-center justify-between">
                  <span>Sanitized Preview</span>
                  <span className="text-zinc-300">ONLY_IN_CLOUD</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Call to Action */}
        <section className="py-28 px-4 sm:px-6 lg:px-8 border-t border-zinc-900 bg-gradient-to-b from-[#0B0B0B] via-[#140610] to-[#0B0B0B] relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8 glass-surface p-10 sm:p-16 rounded-3xl">
            <h2 className="text-4xl sm:text-6xl font-bold text-white font-display tracking-tight">
              Ready to <span className="kinetic-gradient-text">Own Your Intelligence?</span>
            </h2>
            <p className="text-zinc-300 text-lg sm:text-xl max-w-xl mx-auto">
              Launch your private local AI workspace right now. Works offline, leaves zero trace, and never leaks your thoughts.
            </p>
            <div className="pt-4">
              <MagneticButton
                href="/app"
                onClick={handleTryClick}
                className="inline-flex items-center gap-3 px-10 py-5 rounded-full text-lg font-semibold text-white bg-[#FF2DA8] hover:bg-[#E02094] transition-all duration-300 shadow-2xl shadow-[#FF2DA8]/35 hover:shadow-[#FF2DA8]/55 hover:-translate-y-1 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#FF2DA8]"
              >
                <span>Launch AIVARION Workspace</span>
                <ArrowRight className="w-6 h-6" />
              </MagneticButton>
            </div>
          </div>
        </section>
      </main>

      {/* Brand Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default LandingPage;
