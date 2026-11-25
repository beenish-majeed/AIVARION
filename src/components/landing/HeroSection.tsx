import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { ArrowRight } from 'lucide-react';
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
      { threshold: 0.05 }
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
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;

      if (showcaseContainerRef.current && !motionQuery.matches) {
        const panX = currentX * 10;
        const panY = currentY * 8;
        const scrollFactor = Math.min(1, scrollY / 650);
        const opacity = Math.max(0.15, 1 - scrollFactor * 0.85);
        const scale = 1 - scrollFactor * 0.04;

        showcaseContainerRef.current.style.transform = `translate3d(${panX}px, ${panY}px, 0) scale(${scale})`;
        showcaseContainerRef.current.style.opacity = `${opacity}`;
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
      className="hero-full-viewport relative flex items-center justify-center pt-safe pb-safe px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#0B0B0B]"
    >
      {/* 3D Canvas filling the hero completely: position absolute, inset 0, width 100%, height 100% */}
      <div className="absolute inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        {useStaticFallback ? (
          <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-[#0B0B0B]">
            {/* Ambient static radial glows */}
            <div className="absolute w-[600px] h-[600px] rounded-full bg-[#FF2DA8]/15 blur-[120px] pointer-events-none" />
            <div className="absolute w-[350px] h-[350px] rounded-full bg-[#FF2DA8]/25 blur-[60px] pointer-events-none" />
            <svg viewBox="0 0 800 600" className="w-full h-full absolute inset-0 pointer-events-none opacity-60">
              <defs>
                <linearGradient id="fallbackStreakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF2DA8" stopOpacity="0.85" />
                  <stop offset="50%" stopColor="#FF2DA8" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#0B0B0B" stopOpacity="0" />
                </linearGradient>
              </defs>
              <ellipse cx="400" cy="300" rx="320" ry="160" fill="none" stroke="url(#fallbackStreakGrad)" strokeWidth="2.5" strokeDasharray="300 60" transform="rotate(-15 400 300)" />
              <ellipse cx="400" cy="300" rx="280" ry="210" fill="none" stroke="#FF2DA8" strokeOpacity="0.4" strokeWidth="1.8" strokeDasharray="220 70" transform="rotate(35 400 300)" />
              <ellipse cx="400" cy="300" rx="360" ry="120" fill="none" stroke="#FF2DA8" strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="180 80" transform="rotate(-40 400 300)" />
            </svg>
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center pointer-events-none select-none">
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest block">
                STATIC_MODE_ACTIVE
              </span>
              <p className="text-xs text-zinc-500 font-mono tracking-wider mt-0.5">
                [AIVARION On-Device AI Core • Hardware Optimized]
              </p>
            </div>
          </div>
        ) : (
          <WebGLErrorBoundary
            fallback={
              <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-[#0B0B0B]">
                <div className="absolute w-[500px] h-[500px] rounded-full bg-[#FF2DA8]/15 blur-[100px] pointer-events-none" />
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

      {/* Interactive Micro-Particle Field */}
      <ParticleBackground />

      {/* Center Headline, Subheadline, and Button above the 3D Canvas */}
      <div
        ref={showcaseContainerRef}
        className="relative z-10 text-center max-w-4xl mx-auto flex flex-col items-center justify-center space-y-6 sm:space-y-8 pointer-events-auto will-change-transform"
      >
        {/* Subtle Pill Status Badge (Sole Chartreuse token on screen) */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs sm:text-sm text-zinc-300 backdrop-blur-md shadow-xl">
          <span className="w-2 h-2 rounded-full bg-[#D4FF3F] glow-chartreuse-sm" />
          <span className="font-medium">Private, Local-First AI Workspace</span>
          <span className="text-zinc-600">|</span>
          <span className="text-[#FF2DA8] font-semibold">100% Client Sovereignty</span>
        </div>

        {/* Confident, Large Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white font-display leading-[1.04]">
          Intelligence Stays <br />
          <span className="kinetic-gradient-text">On Your Machine.</span>
        </h1>

        {/* Editorial Subtitle with high WCAG AA contrast */}
        <p className="text-base sm:text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto font-normal leading-relaxed backdrop-blur-[2px]">
          The private ChatGPT-style assistant that works offline using on-device AI. Practice Python skills with deterministic grading, store encrypted personal notes, and plan tasks with cloud AI <span className="text-white font-medium underline decoration-[#FF2DA8]/50">only after you approve each step</span>.
        </p>

        {/* Primary Call to Action Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 w-full sm:w-auto">
          <a
            href="/app"
            onClick={handleCtaClick}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full text-base font-semibold text-white bg-[#FF2DA8] hover:bg-[#E02094] transition-all duration-300 shadow-xl shadow-[#FF2DA8]/35 hover:shadow-[#FF2DA8]/55 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#FF2DA8] focus:ring-offset-2 focus:ring-offset-[#0B0B0B]"
            aria-label="Launch AIVARION Workspace"
          >
            <span>Try AIVARION</span>
            <ArrowRight className="w-5 h-5" />
          </a>

          <a
            href="#how-it-works"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full text-base font-medium text-zinc-300 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 hover:text-white transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-zinc-600 backdrop-blur-md"
          >
            <span>Explore 4-Step Privacy</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
