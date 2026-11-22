import React from 'react';
import { Navbar } from '../layout/Navbar';
import { Footer } from '../layout/Footer';
import { HeroSkeleton } from './HeroSkeleton';
import {
  ShieldCheck,
  CheckCircle2,
  Database,
  ArrowRight,
  FileText,
  GraduationCap,
  Sparkles,
  Lock,
  Eye,
  Send,
  CloudLightning,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const handleTryClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    onNavigate('/app');
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col selection:bg-[#FF2DA8] selection:text-white">
      {/* Brand Header */}
      <Navbar currentPath="/" onNavigate={onNavigate} />

      <main className="flex-1">
        {/* Hero Section */}
        <HeroSkeleton onNavigate={onNavigate} />

        {/* Section: How It Works (The 4-Step Sequence) */}
        <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-zinc-900 bg-[#0B0B0B]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-400">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
                <span>Deterministic Privacy Pipeline</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-display">
                Four Steps. Zero Silent Leaks.
              </h2>
              <p className="text-zinc-400 text-base sm:text-lg">
                Unlike cloud-dependent assistants that transmit your thoughts unchecked, AIVARION guarantees your privacy through transparent, human-in-the-loop verification.
              </p>
            </div>

            {/* 4 Steps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Step 1: Local Answer */}
              <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-[#FF2DA8]/40 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-[#FF2DA8] font-mono font-bold text-lg mb-5">
                    01
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Local Answer</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Queries and skill practice are processed directly inside your browser with on-device AI. Single-turn conversation history stays local.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center gap-2 text-xs text-zinc-500 font-mono">
                  <span className="w-2 h-2 rounded-full bg-[#D4FF3F]" />
                  <span>ONLY_ON_DEVICE</span>
                </div>
              </div>

              {/* Step 2: Privacy Check */}
              <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-[#FF2DA8]/40 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-[#FF2DA8] font-mono font-bold text-lg mb-5">
                    02
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Privacy Check</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Before any cloud assistance is prepared, a deterministic sanitization engine strips emails, telephone numbers, and tagged private entities.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center gap-2 text-xs text-zinc-500 font-mono">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FF2DA8]" />
                  <span>DETERMINISTIC_PII_FILTER</span>
                </div>
              </div>

              {/* Step 3: User Approval */}
              <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-[#FF2DA8]/40 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-[#FF2DA8] font-mono font-bold text-lg mb-5">
                    03
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">User Approval</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    You inspect the exact JSON payload before transmission. You click Approve or Cancel. No background requests ever leave without explicit consent.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center gap-2 text-xs text-zinc-500 font-mono">
                  <Eye className="w-3.5 h-3.5 text-[#D4FF3F]" />
                  <span>HUMAN_GATE_CONFIRMATION</span>
                </div>
              </div>

              {/* Step 4: Saved Result */}
              <div className="p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-[#FF2DA8]/40 transition-all duration-300 flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-zinc-800/80 border border-zinc-700/60 flex items-center justify-center text-[#FF2DA8] font-mono font-bold text-lg mb-5">
                    04
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Saved Result</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">
                    Cloud plans are validated strictly with Zod schemas. A second approval is required before saving tasks to Firestore with your anonymous ID.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-800/60 flex items-center gap-2 text-xs text-zinc-500 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#D4FF3F]" />
                  <span>ZOD_VALIDATED_STORAGE</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Capabilities */}
        <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-zinc-900 bg-[#0F0F10]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-display">
                Engineered for Complete Autonomy
              </h2>
              <p className="text-zinc-400 text-base sm:text-lg">
                Four core modules designed to replace opaque cloud chat apps with a local-first, offline-capable workspace.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Feature 1: Private Chat */}
              <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/90 hover:border-zinc-700 transition-all">
                <div className="w-12 h-12 rounded-xl bg-[#FF2DA8]/10 border border-[#FF2DA8]/30 flex items-center justify-center text-[#FF2DA8] mb-6">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Private Local Chat</h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  Conversation history stored in IndexedDB. Every reply clearly displays its verified inference source—so you always know when an answer came from on-device AI versus the cloud.
                </p>
                <ul className="space-y-2 text-sm text-zinc-300">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
                    <span>Real-time inference source tag on every response</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
                    <span>Offline message management and conversation exports</span>
                  </li>
                </ul>
              </div>

              {/* Feature 2: Python Skill Coach */}
              <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/90 hover:border-zinc-700 transition-all">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white mb-6">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Python Skill Coach</h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  Practice Python fundamentals one question at a time generated locally on your device. Answers are graded deterministically by code—not hallucinated by an LLM.
                </p>
                <ul className="space-y-2 text-sm text-zinc-300">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
                    <span>Deterministic scoring algorithm and Zod schema safety</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
                    <span>Local progress tracking with zero telemetry</span>
                  </li>
                </ul>
              </div>

              {/* Feature 3: Personal Notes */}
              <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/90 hover:border-zinc-700 transition-all">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white mb-6">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Zero-Cloud Personal Notes</h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  Draft confidential notes, code snippets, and research locally. IndexedDB through Dexie ensures instant load times and complete offline operability.
                </p>
                <ul className="space-y-2 text-sm text-zinc-300">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
                    <span>Direct IndexedDB read/write without server intermediaries</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
                    <span>Never synchronized to the cloud without explicit action</span>
                  </li>
                </ul>
              </div>

              {/* Feature 4: Cloud 7-Day Study Planner */}
              <div className="p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800/90 hover:border-zinc-700 transition-all">
                <div className="w-12 h-12 rounded-xl bg-[#FF2DA8]/10 border border-[#FF2DA8]/30 flex items-center justify-center text-[#FF2DA8] mb-6">
                  <CloudLightning className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Guarded 7-Day Study Planner</h3>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  Harness Gemini cloud capabilities exclusively for structured long-term roadmaps, governed by preview inspectability and dual approval gates.
                </p>
                <ul className="space-y-2 text-sm text-zinc-300">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
                    <span>Exact sanitized JSON preview before sending</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
                    <span>Second approval gate before saving to Firestore</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Three AI Modes */}
        <section id="modes" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-zinc-900 bg-[#0B0B0B]">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-display">
                Transparent Inference Modes
              </h2>
              <p className="text-zinc-400 text-base sm:text-lg">
                You hold absolute control over which models execute and where your computation runs.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Private Local */}
              <div className="p-6 rounded-2xl bg-zinc-900/50 border-2 border-[#FF2DA8]/30 relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-1 rounded-full bg-[#FF2DA8]/10 text-[#FF2DA8] text-xs font-semibold">
                      Maximum Privacy
                    </span>
                    <Lock className="w-4 h-4 text-[#FF2DA8]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Private Local</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                    Uses on-device inference only. Throws if the local model is unavailable. Guaranteed never to make cloud calls or fall back silently.
                  </p>
                </div>
                <div className="pt-4 border-t border-zinc-800 text-xs font-mono text-zinc-500">
                  mode: ONLY_ON_DEVICE
                </div>
              </div>

              {/* Hybrid Auto */}
              <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-semibold">
                      Local-First Fallback
                    </span>
                    <Sparkles className="w-4 h-4 text-[#D4FF3F]" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Hybrid Auto</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                    Attempts local inference first. If unavailable, sanitizes payload and presents an approval dialog before any cloud call.
                  </p>
                </div>
                <div className="pt-4 border-t border-zinc-800 text-xs font-mono text-zinc-500">
                  mode: PREFER_ON_DEVICE (with approval gate)
                </div>
              </div>

              {/* Cloud Guarded */}
              <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-semibold">
                      Explicit Cloud
                    </span>
                    <CloudLightning className="w-4 h-4 text-zinc-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Cloud Guarded</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                    Cloud inference reserved for complex planning tasks. Operates only after deterministic PII sanitation and user inspection.
                  </p>
                </div>
                <div className="pt-4 border-t border-zinc-800 text-xs font-mono text-zinc-500">
                  mode: ONLY_IN_CLOUD (sanitized payload)
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Call to Action */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 border-t border-zinc-900 bg-gradient-to-b from-[#0B0B0B] via-[#12050E] to-[#0B0B0B] relative overflow-hidden">
          <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
            <h2 className="text-4xl sm:text-5xl font-bold text-white font-display tracking-tight">
              Experience Private AI on Your Own Hardware.
            </h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">
              No account required. Try the complete local-first workspace in your browser right now.
            </p>
            <div className="pt-2">
              <a
                href="/app"
                onClick={handleTryClick}
                className="inline-flex items-center gap-3 px-9 py-4 rounded-full text-base font-semibold text-white bg-[#FF2DA8] hover:bg-[#E02094] transition-all duration-300 shadow-2xl shadow-[#FF2DA8]/30 hover:shadow-[#FF2DA8]/50 hover:-translate-y-1 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#FF2DA8]"
              >
                <span>Launch AIVARION Workspace</span>
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Brand Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
};
