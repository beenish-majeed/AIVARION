import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { ArrowRight, Lock, Sparkles, Cpu } from 'lucide-react';
import iconImg from '../../assets/aivarion-icon.png';
import { ParticleBackground } from './ParticleBackground';

// Lazy-load the abstract 3D particle field WebGL bundle
const Hero3DScene = lazy(() => import('./Hero3DScene'));

interface HeroSectionProps {
  onNavigate?: (path: string) => void;
  pullProgress?: number;
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

export const HeroSection: React.FC<HeroSectionProps> = ({ onNavigate, pullProgress = 0 }) => {
  const heroRef = useRef<HTMLElement>(null);
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

    // 4. Subtle pointer parallax
    let animId: number;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      if (motionQuery.matches) return;
      const { innerWidth, innerHeight } = window;
      targetX = (e.clientX / innerWidth - 0.5) * 2;
      targetY = (e.clientY / innerHeight - 0.5) * 2;
    };

    const updateFrame = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      if (ambientGlowRef.current && !motionQuery.matches) {
        ambientGlowRef.current.style.transform = `translate3d(calc(-50% + ${currentX * 24}px), calc(-50% + ${currentY * 18}px), 0)`;
      }

      animId = requestAnimationFrame(updateFrame);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    animId = requestAnimationFrame(updateFrame);

    return () => {
      motionQuery.removeEventListener('change', checkMotionPreference);
      observer.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
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
      className="relative min-h-[92vh] flex items-center justify-center pt-24 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#0B0B0B]"
    >
      {/* Interactive Micro-Particle Field */}
      <ParticleBackground />

      {/* Background ambient radial glow in brand Hot Pink */}
      <div
        ref={ambientGlowRef}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-[#FF2DA8]/12 rounded-full blur-[160px] pointer-events-none transition-transform duration-300 ease-out will-change-transform"
      />

      {/* Abstract 3D Glowing Particle Wave in the Centre of the Hero */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
        {useStaticFallback ? (
          /* Static fallback for reduced motion and low-power devices */
          <div className="relative w-full h-full max-w-4xl flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 600 340" className="w-full h-full opacity-60">
              <defs>
                <linearGradient id="staticWaveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF2DA8" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.6" />
                  <stop offset="100%" stopColor="#FF2DA8" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <path
                d="M 50 170 Q 180 80 300 170 T 550 170"
                fill="none"
                stroke="url(#staticWaveGrad)"
                strokeWidth="2.5"
                strokeDasharray="6 4"
              />
              {[
                [100, 150, 3], [160, 110, 2], [220, 130, 2.5], [280, 170, 3.5],
                [340, 200, 2], [400, 180, 3], [460, 160, 2.5], [520, 175, 2],
                [140, 140, 1.5], [200, 115, 2], [320, 185, 2.2], [380, 195, 1.8],
                [250, 150, 4], [300, 165, 3]
              ].map(([cx, cy, r], i) => (
                <circle key={i} cx={cx} cy={cy} r={r} fill={i % 3 === 0 ? '#FFFFFF' : '#FF2DA8'} opacity={0.85} />
              ))}
            </svg>
            <div className="absolute bottom-6 font-mono text-[11px] text-zinc-500 bg-black/60 px-3 py-1 rounded-full border border-zinc-800">
              [STATIC_MODE_ACTIVE • AIVARION On-Device AI Core]
            </div>
          </div>
        ) : (
          <WebGLErrorBoundary
            fallback={
              <div className="flex flex-col items-center justify-center text-center space-y-2">
                <div className="w-16 h-16 rounded-full border border-[#FF2DA8]/40 flex items-center justify-center bg-[#0B0B0B]">
                  <Cpu className="w-6 h-6 text-[#FF2DA8]" />
                </div>
                <p className="text-[11px] font-mono text-zinc-500">
                  [STATIC_MODE_ACTIVE • AIVARION On-Device AI Core]
                </p>
              </div>
            }
          >
            <Suspense
              fallback={
                <div className="flex items-center justify-center h-full text-zinc-500 font-mono text-xs">
                  <span className="animate-pulse">INITIALIZING_GLOW_FIELD...</span>
                </div>
              }
            >
              <Hero3DScene isPaused={isOffscreen} pullProgress={pullProgress} />
            </Suspense>
          </WebGLErrorBoundary>
        )}
      </div>

      {/* Headline, Badge, Subtitle & CTA on top of the glowing field */}
      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-7 pointer-events-auto">
        {/* Subtle Pill Status Badge (Sole Chartreuse token on screen) */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs sm:text-sm text-zinc-300 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-[#D4FF3F] glow-chartreuse-sm" />
          <span className="font-medium">Private, Local-First AI Workspace</span>
          <span className="text-zinc-600">|</span>
          <span className="text-[#FF2DA8] font-semibold">100% Client Sovereignty</span>
        </div>

        {/* Confident Large Headline with One Italic Emphasis Word */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white font-display leading-[1.04]">
          Intelligence Stays <br />
          On Your <span className="italic font-display font-light kinetic-gradient-text">Machine.</span>
        </h1>

        {/* Editorial Subtitle with high WCAG AA contrast */}
        <p className="text-base sm:text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto font-normal leading-relaxed">
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
      </div>
    </section>
  );
};

export default HeroSection;
