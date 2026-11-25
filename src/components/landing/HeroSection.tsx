import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { ArrowRight } from 'lucide-react';
import { ParticleBackground } from './ParticleBackground';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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
  const [pullProgress, setPullProgress] = useState(0);

  useEffect(() => {
    let st: ScrollTrigger | null = null;
    let tl: gsap.core.Timeline | null = null;

    // 1. Detect prefers-reduced-motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const checkMotionPreference = () => {
      if (motionQuery.matches) {
        setUseStaticFallback(true);
        if (st) {
          st.kill();
          st = null;
          ScrollTrigger.refresh();
        }
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

    // 4. Subtle pointer response
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
      currentX += (targetX - currentX) * 0.06;
      currentY += (targetY - currentY) * 0.06;

      if (showcaseContainerRef.current && !motionQuery.matches && pullProgress === 0) {
        const panX = currentX * 10;
        const panY = currentY * 8;
        showcaseContainerRef.current.style.transform = `translate3d(${panX}px, ${panY}px, 0)`;
      }

      animId = requestAnimationFrame(updateFrame);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    animId = requestAnimationFrame(updateFrame);

    // 5. Pinned Black Hole Pull with GSAP ScrollTrigger (5-6s desktop, ~2s mobile)
    if (!motionQuery.matches && heroRef.current) {
      const isMobile = window.innerWidth < 768;
      const pinDistance = isMobile ? 1200 : 3400; // ~2s mobile, 5-6s desktop scroll distance

      tl = gsap.timeline({
        defaults: { ease: 'none' },
      });

      // Central headline gently scales up and dissolves overhead as user walks forward
      tl.to(
        showcaseContainerRef.current,
        {
          scale: 1.15,
          y: -70,
          opacity: 0,
          duration: 0.35,
          ease: 'power1.out',
        },
        0
      );

      // Drive 3D walk progress (0 to 1) over the full 5-6 second scroll distance
      const walkState = { val: 0 };
      tl.to(
        walkState,
        {
          val: 1,
          duration: 1,
          onUpdate: () => {
            setPullProgress(walkState.val);
          },
        },
        0
      );

      st = ScrollTrigger.create({
        trigger: heroRef.current,
        start: 'top top',
        end: `+=${pinDistance}`,
        pin: true,
        scrub: 0.8,
        animation: tl,
        invalidateOnRefresh: true,
      });
    }

    const handleResize = () => {
      ScrollTrigger.refresh();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      st?.kill();
      tl?.kill();
      motionQuery.removeEventListener('change', checkMotionPreference);
      observer.disconnect();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <section
      ref={heroRef}
      className="hero-full-viewport relative flex flex-col items-center justify-start pt-20 sm:pt-24 md:pt-28 pb-safe px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#0B0B0B]"
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
              <Hero3DScene isPaused={isOffscreen} pullProgress={pullProgress} />
            </Suspense>
          </WebGLErrorBoundary>
        )}
      </div>

      {/* Interactive Micro-Particle Field */}
      <ParticleBackground />

      {/* Center Headline: Clean single short line above the 3D visual */}
      <div
        ref={showcaseContainerRef}
        className="relative z-10 text-center max-w-4xl mx-auto flex flex-col items-center justify-start pointer-events-auto will-change-transform mt-8 sm:mt-14 md:mt-20 px-4"
      >
        <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-light tracking-tight text-white font-serif leading-[1.2] max-w-3xl mx-auto select-none drop-shadow-[0_2px_18px_rgba(0,0,0,0.85)]">
          Your thoughts are yours. <br />
          <span className="font-normal italic text-zinc-100">Your data should be, too.</span>
        </h1>
      </div>
    </section>
  );
};

export default HeroSection;
