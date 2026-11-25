import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { ArrowRight, Lock, Sparkles, Cpu } from 'lucide-react';
import iconImg from '../../assets/aivarion-icon.png';
import { ParticleBackground } from './ParticleBackground';

// Lazy-load the 3D WebGL bundle
const Hero3DScene = lazy(() => import('./Hero3DScene'));

interface HeroSectionProps {
  onNavigate?: (path: string) => void;
}

interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class WebGLErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate }) => {
  const heroRef = useRef<HTMLElement>(null);
  const showcaseContainerRef = useRef<HTMLDivElement>(null);
  const ambientGlowRef = useRef<HTMLDivElement>(null);
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

    // 2. Detect small mobile width or WebGL availability
    if (window.innerWidth < 640 || !isWebGLSupported()) {
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

    // 4. Hero pointer and scroll response dynamics
    let animId: number;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let scrollY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (motionQuery.matches) return;
      const { innerWidth, innerHeight } = window;
      targetX = (e.clientX / innerWidth - 0.5) * 2;
      targetY = (e.clientY / innerHeight - 0.5) * 2;
    };

    const handleScroll = () => {
      scrollY = window.scrollY;
    };

    const updateFrame = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      if (showcaseContainerRef.current && !motionQuery.matches) {
        const tiltX = -currentY * 3.5;
        const tiltY = currentX * 4.5;
        const panX = currentX * 8;
        const panY = currentY * 6;
        const scrollFactor = Math.min(1, scrollY / 650);
        const scale = 1 - scrollFactor * 0.04;
        const opacity = Math.max(0.45, 1 - scrollFactor * 0.65);

        showcaseContainerRef.current.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translate3d(${panX}px, ${panY}px, 0) scale(${scale})`;
        showcaseContainerRef.current.style.opacity = `${opacity}`;
      }

      if (ambientGlowRef.current && !motionQuery.matches) {
        ambientGlowRef.current.style.transform = `translate3d(calc(-50% + ${currentX * 28}px), calc(-50% + ${currentY * 22}px), 0)`;
      }

      animId = requestAnimationFrame(updateFrame);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    animId = requestAnimationFrame(updateFrame);

    return () => {
      motionQuery.removeEventListener('change', checkMotionPreference);
      observer.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animId);
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
      className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center pt-24 pb-14 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#0B0B0B]"
    >
      {/* Interactive Micro-Particle Field */}
      <ParticleBackground />

      {/* Background radial ambient glows (strictly brand Hot Pink & Jet Black) */}
      <div
        ref={ambientGlowRef}
        className="absolute top-1/4 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-[#FF2DA8]/10 rounded-full blur-[140px] pointer-events-none transition-transform duration-200 ease-out"
      />

      <div className="relative max-w-7xl mx-auto z-10 w-full">
        <div className="hero-responsive-grid">
          {/* Left Column: Pill Status, Headline, Subheadline, CTA Buttons */}
          <div className="text-left space-y-6">
            {/* Subtle Pill Status Badge (Sole Chartreuse token on screen) */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs sm:text-sm text-zinc-300 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-[#D4FF3F] glow-chartreuse-sm" />
              <span className="font-medium">Private, Local-First AI Workspace</span>
              <span className="text-zinc-600">|</span>
              <span className="text-[#FF2DA8] font-semibold">100% Client Sovereignty</span>
            </div>

            {/* Confident, Large Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white font-display leading-[1.06]">
              Intelligence Stays <br />
              <span className="kinetic-gradient-text">
                On Your Machine.
              </span>
            </h1>

            {/* Editorial Subtitle with high WCAG AA contrast */}
            <p className="text-base sm:text-lg text-zinc-300 max-w-xl font-normal leading-relaxed">
              The private ChatGPT-style assistant that works offline using on-device AI. Practice Python skills with deterministic grading, store encrypted personal notes, and plan tasks with cloud AI <span className="text-white font-medium underline decoration-[#FF2DA8]/50">only after you approve each step</span>.
            </p>

            {/* Primary Call to Action Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <a
                href="/app"
                onClick={handleCtaClick}
                className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full text-base font-semibold text-white bg-[#FF2DA8] hover:bg-[#E02094] transition-all duration-300 shadow-xl shadow-[#FF2DA8]/30 hover:shadow-[#FF2DA8]/50 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#FF2DA8] focus:ring-offset-2 focus:ring-offset-[#0B0B0B]"
                aria-label="Launch AIVARION Workspace"
              >
                <span>Try AIVARION</span>
                <ArrowRight className="w-5 h-5" />
              </a>

              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full text-base font-medium text-zinc-300 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:text-white transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-zinc-600"
              >
                <span>Explore 4-Step Privacy</span>
              </a>
            </div>
          </div>

          {/* Right Column: 3D Visual Centerpiece or Static Fallback */}
          <div
            ref={showcaseContainerRef}
            className="relative w-full rounded-2xl p-1 bg-gradient-to-b from-zinc-700/40 via-zinc-900/30 to-transparent will-change-transform"
          >
            <div className="relative rounded-xl overflow-hidden bg-[#0D0D0E] border border-zinc-800/80 shadow-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between pb-3.5 border-b border-zinc-800/80">
                <div className="flex items-center gap-3">
                  <img src={iconImg} alt="AIVARION" className="h-6 w-auto object-contain" />
                  <span className="text-xs font-mono text-zinc-400">CORE_ORBIT_ENGINE</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <span className="w-2 h-2 rounded-full bg-[#FF2DA8]" />
                  <span className="font-mono">
                    {useStaticFallback ? 'STATIC_MODE_ACTIVE' : isOffscreen ? 'SCENE_PAUSED' : 'WEBGL_ACTIVE'}
                  </span>
                </div>
              </div>

              {/* 3D Scene Viewport or Static Hero Fallback */}
              <div className="w-full h-[320px] sm:h-[380px] flex items-center justify-center relative overflow-hidden">
                {useStaticFallback ? (
                  <div className="flex flex-col items-center justify-center text-center space-y-4">
                    <div className="relative w-36 h-36 rounded-full border-2 border-[#FF2DA8]/30 flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full border border-[#FF2DA8] shadow-[0_0_30px_rgba(255,45,168,0.25)] flex items-center justify-center bg-[#0B0B0B]">
                        <div className="w-9 h-9 rounded-full bg-[#FF2DA8] shadow-[0_0_15px_#FF2DA8] flex items-center justify-center">
                          <Cpu className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-400 font-mono tracking-wider">
                      [AIVARION On-Device AI Core • Hardware Optimized]
                    </p>
                  </div>
                ) : (
                  <WebGLErrorBoundary
                    fallback={
                      <div className="flex flex-col items-center justify-center text-center space-y-4">
                        <div className="relative w-36 h-36 rounded-full border-2 border-[#FF2DA8]/30 flex items-center justify-center">
                          <div className="w-24 h-24 rounded-full border border-[#FF2DA8] flex items-center justify-center bg-[#0B0B0B]">
                            <Cpu className="w-5 h-5 text-[#FF2DA8]" />
                          </div>
                        </div>
                        <p className="text-xs text-zinc-400 font-mono tracking-wider">
                          [WebGL Fallback • Static Mode]
                        </p>
                      </div>
                    }
                  >
                    <Suspense
                      fallback={
                        <div className="flex items-center justify-center h-full text-zinc-500 font-mono text-xs">
                          <span className="animate-pulse">INITIALIZING_3D_CORE...</span>
                        </div>
                      }
                    >
                      <Hero3DScene isPaused={isOffscreen} />
                    </Suspense>
                  </WebGLErrorBoundary>
                )}
              </div>

              {/* Bottom 3 Capability Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3.5 border-t border-zinc-800/80 text-left">
                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/40">
                  <Lock className="w-3.5 h-3.5 text-[#FF2DA8] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-white">Private Local</div>
                    <div className="text-[10px] text-zinc-400">Zero cloud calls</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/40">
                  <Sparkles className="w-3.5 h-3.5 text-[#FF2DA8] shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-white">Hybrid Auto</div>
                    <div className="text-[10px] text-zinc-400">Gated approval</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/40">
                  <Cpu className="w-3.5 h-3.5 text-zinc-300 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-white">Guarded Cloud</div>
                    <div className="text-[10px] text-zinc-400">Dual verification</div>
                  </div>
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
