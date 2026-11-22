import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { ArrowRight, Lock, Sparkles, Cpu } from 'lucide-react';
import logoImg from '../../assets/aivarion-logo.png';

// Lazy-load the heavy 3D WebGL bundle
const Hero3DScene = lazy(() => import('./Hero3DScene'));

interface HeroSectionProps {
  onNavigate?: (path: string) => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate }) => {
  const heroRef = useRef<HTMLElement>(null);
  const [isOffscreen, setIsOffscreen] = useState(false);
  const [useStaticFallback, setUseStaticFallback] = useState(false);

  useEffect(() => {
    // 1. Detect prefers-reduced-motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const checkMotionPreference = () => {
      if (motionQuery.matches) {
        setUseStaticFallback(true);
      }
    };
    checkMotionPreference();
    motionQuery.addEventListener('change', checkMotionPreference);

    // 2. Detect small mobile width or low memory if available
    if (window.innerWidth < 640) {
      // Mobile screen: optimize by rendering lighter static/CSS animated visual
      setUseStaticFallback(true);
    }

    // 3. Pause 3D scene when scrolled out of view using IntersectionObserver
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsOffscreen(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => {
      motionQuery.removeEventListener('change', checkMotionPreference);
      observer.disconnect();
    };
  }, []);

  const handleCtaClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('/app');
    } else {
      window.location.href = '/app';
    }
  };

  return (
    <section
      ref={heroRef}
      className="relative min-h-[95vh] flex items-center justify-center pt-28 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#0B0B0B]"
    >
      {/* Background radial ambient glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#FF2DA8]/12 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-[#D4FF3F]/5 rounded-full blur-[130px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto text-center z-10 space-y-8">
        {/* Subtle Pill Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs sm:text-sm text-zinc-300 backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-[#D4FF3F] glow-chartreuse-sm" />
          <span className="font-medium">Private, Local-First AI Workspace</span>
          <span className="text-zinc-600">|</span>
          <span className="text-[#FF2DA8] font-semibold">100% Client Sovereignty</span>
        </div>

        {/* Confident, Large Headline matching Gladeye-inspired bold typography */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white max-w-5xl mx-auto font-display leading-[1.04]">
          Intelligence Stays <br />
          <span className="bg-gradient-to-r from-white via-zinc-200 to-[#FF2DA8] bg-clip-text text-transparent">
            On Your Machine.
          </span>
        </h1>

        {/* Editorial Subtitle with high WCAG AA contrast */}
        <p className="text-lg sm:text-xl text-zinc-300 max-w-2xl mx-auto font-normal leading-relaxed">
          The private ChatGPT-style assistant that works offline using on-device AI. Practice Python skills with deterministic grading, store encrypted personal notes, and plan tasks with cloud AI <span className="text-white font-medium underline decoration-[#FF2DA8]/50">only after you approve each step</span>.
        </p>

        {/* Primary Call to Action Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <a
            href="/app"
            onClick={handleCtaClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full text-base font-semibold text-white bg-[#FF2DA8] hover:bg-[#E02094] transition-all duration-300 shadow-xl shadow-[#FF2DA8]/30 hover:shadow-[#FF2DA8]/50 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#FF2DA8] focus:ring-offset-2 focus:ring-offset-[#0B0B0B]"
            aria-label="Launch AIVARION Workspace"
          >
            <span>Try AIVARION</span>
            <ArrowRight className="w-5 h-5" />
          </a>

          <a
            href="#how-it-works"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full text-base font-medium text-zinc-300 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:text-white transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          >
            <span>Explore 4-Step Privacy</span>
          </a>
        </div>

        {/* 3D Visual Centerpiece or Static Fallback Container */}
        <div className="relative mt-8 mx-auto max-w-3xl rounded-2xl p-1 bg-gradient-to-b from-zinc-700/40 via-zinc-900/30 to-transparent">
          <div className="relative rounded-xl overflow-hidden bg-[#0D0D0E] border border-zinc-800/80 shadow-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
              <div className="flex items-center gap-3">
                <img src={logoImg} alt="AIVARION" className="h-6 w-auto object-contain" />
                <span className="text-xs font-mono text-zinc-400">CORE_ORBIT_ENGINE</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-[#D4FF3F]" />
                <span className="font-mono">
                  {useStaticFallback ? 'STATIC_MODE_ACTIVE' : isOffscreen ? 'SCENE_PAUSED' : 'WEBGL_ACTIVE'}
                </span>
              </div>
            </div>

            {/* 3D Scene Viewport or Static Hero Fallback */}
            <div className="w-full h-[360px] sm:h-[420px] flex items-center justify-center relative overflow-hidden">
              {useStaticFallback ? (
                /* Static accessible fallback for prefers-reduced-motion, mobile, and low-power hardware */
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="relative w-44 h-44 rounded-full border-2 border-[#FF2DA8]/30 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full border border-[#FF2DA8] shadow-[0_0_30px_rgba(255,45,168,0.25)] flex items-center justify-center bg-[#0B0B0B]">
                      <div className="w-10 h-10 rounded-full bg-[#D4FF3F] shadow-[0_0_15px_#D4FF3F] flex items-center justify-center">
                        <Cpu className="w-5 h-5 text-[#0B0B0B]" />
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono tracking-wider">
                    [AIVARION On-Device AI Core • Hardware Optimized]
                  </p>
                </div>
              ) : (
                /* Lazy-loaded 3D Scene */
                <Suspense
                  fallback={
                    <div className="flex items-center justify-center h-full text-zinc-500 font-mono text-xs">
                      <span className="animate-pulse">INITIALIZING_3D_CORE...</span>
                    </div>
                  }
                >
                  <Hero3DScene isPaused={isOffscreen} />
                </Suspense>
              )}
            </div>

            {/* Bottom 3 Capability Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-zinc-800/80 text-left">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/40">
                <Lock className="w-4 h-4 text-[#FF2DA8] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-white">Private Local</div>
                  <div className="text-[11px] text-zinc-400">Zero cloud calls, offline AI logic</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/40">
                <Sparkles className="w-4 h-4 text-[#D4FF3F] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-white">Hybrid Auto</div>
                  <div className="text-[11px] text-zinc-400">Local-first, sanitized approval gate</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800/40">
                <Cpu className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-white">Guarded Cloud</div>
                  <div className="text-[11px] text-zinc-400">Strict preview & dual human approval</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
