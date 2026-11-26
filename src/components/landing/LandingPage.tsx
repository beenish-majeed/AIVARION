import React, { useEffect, useRef } from 'react';
import { Navbar } from '../layout/Navbar';
import { Footer } from '../layout/Footer';
import { HeroSection } from './HeroSection';
import { HowItWorksSection } from './HowItWorksSection';
import { CursorSpotlight } from './CursorSpotlight';
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

      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => {
        lenis?.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);

      function raf(time: number) {
        lenis?.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }

    const refreshTimer1 = setTimeout(() => ScrollTrigger.refresh(), 250);
    const refreshTimer2 = setTimeout(() => ScrollTrigger.refresh(), 800);

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
          setRotateY(relX * 6);
          setRotateX(-relY * 6);
          card.style.setProperty('--card-mouse-x', `${(e.clientX - rect.left).toFixed(1)}px`);
          card.style.setProperty('--card-mouse-y', `${(e.clientY - rect.top).toFixed(1)}px`);
          setScale(1.01);
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
      clearTimeout(refreshTimer1);
      clearTimeout(refreshTimer2);
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
      {/* Soft Pointer Spotlight (CSS Radial Gradient) */}
      <CursorSpotlight />

      {/* Brand Header */}
      <Navbar currentPath="/" onNavigate={onNavigate} />

      <main className="flex-1">
        {/* 3D Orbit Hero Section */}
        <HeroSection onNavigate={onNavigate} />

        {/* Kinetic Typography Marquee Ticker */}
        <div className="py-3 border-y border-zinc-900/80 bg-black/40 backdrop-blur-md overflow-hidden relative select-none">
          <div className="kinetic-marquee-track text-xs font-mono tracking-wider uppercase text-zinc-400 font-medium">
            <span className="mx-8 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF2DA8]" />
              <span>Intelligence Stays On Your Machine</span>
            </span>
            <span className="mx-8 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
              <span>Local-First AI Processing</span>
            </span>
            <span className="mx-8 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF2DA8]" />
              <span>Online Tasks Only With Your Approval</span>
            </span>
            <span className="mx-8 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
              <span>Private Browser-Based Storage</span>
            </span>
            <span className="mx-8 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF2DA8]" />
              <span>Human Approval Before External Actions</span>
            </span>
            <span className="mx-8 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
              <span>Nothing Sent Without Your Permission</span>
            </span>
            {/* Duplicated for seamless continuous marquee loop */}
            <span className="mx-8 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF2DA8]" />
              <span>Local-First AI Processing</span>
            </span>
            <span className="mx-8 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
              <span>Online Tasks Only With Your Approval</span>
            </span>
            <span className="mx-8 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF2DA8]" />
              <span>Private Browser-Based Storage</span>
            </span>
            <span className="mx-8 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
              <span>Human Approval Before External Actions</span>
            </span>
            <span className="mx-8 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF2DA8]" />
              <span>Nothing Sent Without Your Permission</span>
            </span>
            <span className="mx-8 flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
              <span>Clear Local and Cloud Boundaries</span>
            </span>
          </div>
        </div>

        {/* 4-Step Interactive Sequence */}
        <HowItWorksSection />

        {/* Section: Capabilities */}
        <section id="features" className="py-28 sm:py-36 px-4 sm:px-6 lg:px-8 border-t border-zinc-900 bg-[#0E0E10]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20 space-y-3.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-badge text-xs font-medium text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
                <span>Private Architecture Modules</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-display">
                Four Workspaces. <span className="kinetic-gradient-text">Zero Surveillance.</span>
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
                Four dedicated workspaces designed for offline reliability, complete privacy, and your direct control.
              </p>
            </div>

            {/* Bento Grid Architecture: Balanced 2x2 Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              {/* Bento 1: Private Chat */}
              <div className="reveal-card glass-surface glass-surface-interactive rounded-2xl p-7 sm:p-9 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[#FF2DA8]/10 border border-[#FF2DA8]/25 flex items-center justify-center text-[#FF2DA8]">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-[#FF2DA8]/10 border border-[#FF2DA8]/30 text-[#FF2DA8] font-semibold">
                      LATENCY &lt; 1ms
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 font-display">Private Local Chat</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                    Direct on-device conversation. Responses generate on your machine with zero background telemetry.
                  </p>
                  {/* Interactive Micro Mockup */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-black/45 border border-zinc-800/80 font-mono text-xs space-y-2 mb-6">
                    <div className="text-zinc-400 flex items-center justify-between">
                      <span>&gt; "Explain async IO in Python"</span>
                      <span className="text-[#FF2DA8] text-[10px]">ON_DEVICE</span>
                    </div>
                    <div className="text-zinc-200 text-[11px] border-l-2 border-[#FF2DA8] pl-2.5 py-0.5">
                      "AsyncIO enables cooperative multitasking using an event loop..."
                    </div>
                  </div>
                </div>
                <div className="pt-4 border-t border-zinc-800/70 flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FF2DA8]" />
                    <span>On-device model status</span>
                  </span>
                  <span className="font-mono text-zinc-500">Local Cache</span>
                </div>
              </div>

              {/* Bento 2: Python Skill Coach */}
              <div className="reveal-card glass-surface glass-surface-interactive rounded-2xl p-7 sm:p-9 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800/70 border border-zinc-700/70 flex items-center justify-center text-white">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-zinc-800/80 border border-zinc-700 text-zinc-300 font-semibold">
                      DETERMINISTIC
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 font-display">Python Skill Coach</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                    Interactive Python practice evaluated by code logic—never by hallucinating cloud models.
                  </p>
                  <div className="p-3.5 sm:p-4 rounded-xl bg-black/45 border border-zinc-800/80 font-mono text-[11px] text-zinc-300 space-y-1.5 mb-6">
                    <div className="text-[#FF2DA8]">✓ assert user_answer === correct_index</div>
                    <div className="text-zinc-500"># Evaluated locally with zero cloud dependence</div>
                  </div>
                </div>
                <div className="pt-4 border-t border-zinc-800/70 flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#FF2DA8]" />
                    <span>Instant local feedback</span>
                  </span>
                  <span className="font-mono text-zinc-500">100% Offline</span>
                </div>
              </div>

              {/* Bento 3: Offline Personal Notes */}
              <div className="reveal-card glass-surface glass-surface-interactive rounded-2xl p-7 sm:p-9 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-10 h-10 rounded-xl bg-zinc-800/70 border border-zinc-700/70 flex items-center justify-center text-white">
                      <FileText className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-zinc-800/80 border border-zinc-700 text-zinc-300 font-semibold">
                      AIR-GAPPED
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 font-display">Offline Personal Notes</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                    Encrypted notebook saved locally in your browser. Stays private on your machine without cloud sync.
                  </p>
                  <div className="p-3.5 sm:p-4 rounded-xl bg-black/45 border border-zinc-800/80 font-mono text-[11px] text-zinc-400 flex items-center justify-between mb-6">
                    <span>Index: notes (title, tags, content)</span>
                    <span className="text-[#FF2DA8]">PRIVATE_LOCAL</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-zinc-800/70 flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-[#FF2DA8]" />
                    <span>Encrypted browser storage</span>
                  </span>
                  <span className="font-mono text-zinc-500">Zero Cloud Sync</span>
                </div>
              </div>

              {/* Bento 4: Guarded 7-Day Study Planner */}
              <div className="reveal-card glass-surface glass-surface-interactive rounded-2xl p-7 sm:p-9 flex flex-col justify-between group">
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[#FF2DA8]/10 border border-[#FF2DA8]/25 flex items-center justify-center text-[#FF2DA8]">
                      <CloudLightning className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-[#FF2DA8]/10 border border-[#FF2DA8]/30 text-[#FF2DA8] font-semibold">
                      DUAL PERMISSIONS
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2 font-display">Guarded 7-Day Study Planner</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                    Structured learning roadmaps planned with cloud AI only after you inspect and approve every step.
                  </p>
                  <div className="p-3.5 sm:p-4 rounded-xl bg-black/45 border border-zinc-800/80 font-mono text-[11px] flex flex-wrap items-center gap-2 text-zinc-300 mb-6">
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">Clean Identity</span>
                    <span className="text-zinc-600">→</span>
                    <span className="px-2 py-0.5 rounded bg-[#FF2DA8]/20 text-[#FF2DA8]">Inspect & Approve</span>
                    <span className="text-zinc-600">→</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">Cloud AI</span>
                    <span className="text-zinc-600">→</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">Confirm Save</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-zinc-800/70 flex items-center justify-between text-xs text-zinc-400">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#FF2DA8]" />
                    <span>Explicit approval before sending</span>
                  </span>
                  <span className="font-mono text-zinc-500">Protected</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Three AI Modes */}
        <section id="modes" className="py-28 sm:py-36 px-4 sm:px-6 lg:px-8 border-t border-zinc-900 bg-[#0B0B0B]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16 sm:mb-20 space-y-3.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-badge text-xs font-medium text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
                <span>Transparent Routing Architecture</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-display">
                Three Explicit AI Modes
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
                Full transparency over where computation executes and how your data is handled.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {/* Private Local */}
              <div className="reveal-card glass-surface glass-surface-interactive glass-surface-active rounded-2xl p-7 sm:p-8 relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="px-2.5 py-1 rounded-full bg-[#FF2DA8]/15 text-[#FF2DA8] text-xs font-semibold">
                      Maximum Privacy
                    </span>
                    <Lock className="w-4 h-4 text-[#FF2DA8]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2.5 font-display">Private Local</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                    Uses on-device inference only. Guaranteed never to make cloud calls or fall back silently without notice.
                  </p>
                </div>
                <div className="pt-4 border-t border-zinc-800/70 text-xs font-mono text-zinc-400 flex items-center justify-between">
                  <span>Routing Policy</span>
                  <span className="text-[#FF2DA8]">ONLY_ON_DEVICE</span>
                </div>
              </div>

              {/* Hybrid Auto */}
              <div className="reveal-card glass-surface glass-surface-interactive rounded-2xl p-7 sm:p-8 relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="px-2.5 py-1 rounded-full glass-badge text-zinc-300 text-xs font-semibold">
                      Local-First Fallback
                    </span>
                    <Sparkles className="w-4 h-4 text-[#FF2DA8]" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2.5 font-display">Hybrid Auto</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                    Attempts local inference first. If an external model is requested, it halts for your approval before connecting.
                  </p>
                </div>
                <div className="pt-4 border-t border-zinc-800/70 text-xs font-mono text-zinc-400 flex items-center justify-between">
                  <span>Routing Policy</span>
                  <span className="text-[#D4FF3F]">PREFER_ON_DEVICE</span>
                </div>
              </div>

              {/* Cloud Guarded */}
              <div className="reveal-card glass-surface glass-surface-interactive rounded-2xl p-7 sm:p-8 relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="px-2.5 py-1 rounded-full glass-badge text-zinc-300 text-xs font-semibold">
                      Explicit Cloud
                    </span>
                    <CloudLightning className="w-4 h-4 text-zinc-400" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-2.5 font-display">Cloud Guarded</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                    Reserved exclusively for complex planning tasks after identity removal and your explicit preview confirmation.
                  </p>
                </div>
                <div className="pt-4 border-t border-zinc-800/70 text-xs font-mono text-zinc-400 flex items-center justify-between">
                  <span>Routing Policy</span>
                  <span className="text-zinc-300">ONLY_IN_CLOUD</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Call to Action */}
        <section className="py-32 sm:py-36 px-4 sm:px-6 lg:px-8 border-t border-zinc-900 bg-gradient-to-b from-[#0B0B0B] via-[#140610] to-[#0B0B0B] relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6 sm:space-y-8 glass-surface p-10 sm:p-16 rounded-3xl border border-zinc-800/80 shadow-[0_0_60px_rgba(255,45,168,0.1)]">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F] glow-chartreuse-sm" />
              <span>Ready for Immediate Offline Use</span>
            </div>
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white font-display tracking-tight leading-tight">
              Ready to <span className="kinetic-gradient-text">Own Your Intelligence?</span>
            </h2>
            <p className="text-zinc-300 text-base sm:text-lg max-w-lg mx-auto leading-relaxed">
              Launch your private local AI workspace right now. Works offline, leaves zero trace, and never leaks your thoughts.
            </p>
            <div className="pt-3">
              <MagneticButton
                href="/app"
                onClick={handleTryClick}
                className="inline-flex items-center gap-3 px-9 py-4 sm:px-10 sm:py-4.5 rounded-full text-base sm:text-lg font-semibold text-white bg-[#FF2DA8] hover:bg-[#E02094] transition-all duration-300 shadow-xl shadow-[#FF2DA8]/30 hover:shadow-[#FF2DA8]/50 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#FF2DA8]"
              >
                <span>Launch AIVARION Workspace</span>
                <ArrowRight className="w-5 h-5" />
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
