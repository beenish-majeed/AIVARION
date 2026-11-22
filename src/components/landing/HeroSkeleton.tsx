import React from 'react';
import { ArrowRight, Lock, Cpu, Sparkles } from 'lucide-react';
import logoImg from '../../assets/aivarion-logo.png';

interface HeroSkeletonProps {
  onNavigate?: (path: string) => void;
}

export const HeroSkeleton: React.FC<HeroSkeletonProps> = ({ onNavigate }) => {
  const handleCtaClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('/app');
    } else {
      window.location.href = '/app';
    }
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-28 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#0B0B0B]">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF2DA8]/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-[#D4FF3F]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto text-center z-10 space-y-8">
        {/* Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs sm:text-sm text-zinc-300">
          <span className="w-2 h-2 rounded-full bg-[#D4FF3F] glow-chartreuse-sm" />
          <span className="font-medium">Private, Local-First AI Architecture</span>
          <span className="text-zinc-600">|</span>
          <span className="text-[#FF2DA8] font-semibold">Zero Cloud Leaks</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white max-w-4xl mx-auto font-display leading-[1.08]">
          Intelligence Stays <br />
          <span className="bg-gradient-to-r from-white via-zinc-200 to-[#FF2DA8] bg-clip-text text-transparent">
            On Your Machine.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto font-normal leading-relaxed">
          A ChatGPT-style workspace that works offline using on-device AI. Learn skills, manage personal notes with IndexedDB, and plan tasks with cloud AI <span className="text-zinc-200 font-medium">only after you approve each step</span>.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
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
            <span>See How It Works</span>
          </a>
        </div>

        {/* Hero Visual Preview / 3D Orbit Placeholder Container */}
        <div className="relative mt-12 mx-auto max-w-3xl rounded-2xl p-1 bg-gradient-to-b from-zinc-700/50 via-zinc-900/40 to-transparent">
          <div className="relative rounded-xl overflow-hidden bg-[#0F0F10] border border-zinc-800/80 shadow-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between pb-6 border-b border-zinc-800/80">
              <div className="flex items-center gap-3">
                <img src={logoImg} alt="AIVARION" className="h-6 w-auto" />
                <span className="text-xs font-mono text-zinc-500">LOCAL_FIRST_NODE_ACTIVE</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span className="w-2 h-2 rounded-full bg-[#D4FF3F]" />
                <span className="font-mono">GEMINI_NANO_STANDBY</span>
              </div>
            </div>

            {/* 3D Ring Centerpiece Visual Representation */}
            <div className="py-12 flex flex-col items-center justify-center relative">
              <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full border-2 border-[#FF2DA8]/40 border-dashed animate-spin-slow flex items-center justify-center relative">
                <div className="w-36 h-36 rounded-full border border-[#FF2DA8] shadow-[0_0_35px_rgba(255,45,168,0.35)] flex items-center justify-center bg-[#0B0B0B]/80">
                  <div className="w-12 h-12 rounded-full bg-[#D4FF3F] shadow-[0_0_20px_#D4FF3F] flex items-center justify-center">
                    <Cpu className="w-6 h-6 text-[#0B0B0B]" />
                  </div>
                </div>
              </div>
              <p className="mt-6 text-sm text-zinc-400 font-mono tracking-wide">
                [On-Device AI Engine Core • Private Local Execution]
              </p>
            </div>

            {/* Bottom 3 Core Principles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-zinc-800/80 text-left">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/50">
                <Lock className="w-4 h-4 text-[#FF2DA8] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-white">Private Local</div>
                  <div className="text-[11px] text-zinc-400">Zero cloud calls, 100% on-device</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/50">
                <Sparkles className="w-4 h-4 text-[#D4FF3F] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-white">Hybrid Auto</div>
                  <div className="text-[11px] text-zinc-400">Local first, approval before cloud</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/50">
                <Cpu className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-white">Cloud Planner</div>
                  <div className="text-[11px] text-zinc-400">Sanitized preview & dual confirmation</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
