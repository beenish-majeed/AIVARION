import React from 'react';
import { ArrowRight, ShieldCheck, Sun, Moon } from 'lucide-react';
import iconImg from '../../assets/aivarion-icon.png';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPath = '/', onNavigate }) => {
  const { theme, toggleTheme } = useTheme();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, target: string) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(target);
    } else {
      window.location.href = target;
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-white/90 dark:bg-[#0B0B0B]/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/60 shadow-sm dark:shadow-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Identity / Header Icon Mark */}
        <a
          href="/"
          onClick={(e) => handleNavClick(e, '/')}
          className="flex items-center gap-3 group focus:outline-none focus:ring-2 focus:ring-[#FF2DA8] rounded-lg p-1"
          aria-label="AIVARION Home"
        >
          <img
            src={iconImg}
            alt="AIVARION"
            className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <span className="font-bold text-lg tracking-wider text-zinc-900 dark:text-white font-display hidden sm:inline-block">
            AIVARION
          </span>
        </a>

        {/* Center Navigation Links (Hidden on small mobile) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          <a
            href="#features"
            className="hover:text-zinc-900 dark:hover:text-white transition-colors py-1 focus:outline-none focus:ring-1 focus:ring-[#FF2DA8] rounded"
          >
            Capabilities
          </a>
          <a
            href="#how-it-works"
            className="hover:text-zinc-900 dark:hover:text-white transition-colors py-1 focus:outline-none focus:ring-1 focus:ring-[#FF2DA8] rounded"
          >
            How It Works
          </a>
          <a
            href="#privacy"
            className="hover:text-zinc-900 dark:hover:text-white transition-colors py-1 flex items-center gap-1.5 focus:outline-none focus:ring-1 focus:ring-[#FF2DA8] rounded"
          >
            <ShieldCheck className="w-4 h-4 text-[#D4FF3F]" />
            <span>Privacy Core</span>
          </a>
          <a
            href="#modes"
            className="hover:text-zinc-900 dark:hover:text-white transition-colors py-1 focus:outline-none focus:ring-1 focus:ring-[#FF2DA8] rounded"
          >
            Inference Modes
          </a>
        </nav>

        {/* Right Actions: Theme Toggle + Badge + Try CTA */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-[#D4FF3F] animate-pulse glow-chartreuse-sm" />
            <span>Local AI Ready</span>
          </div>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-2 rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF2DA8] bg-zinc-100 dark:bg-zinc-900/90 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white hover:border-[#FF2DA8]/50 shadow-sm"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-[#FF2DA8] transition-transform hover:-rotate-12" />
            )}
          </button>

          <a
            href="/app"
            onClick={(e) => handleNavClick(e, '/app')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white bg-[#FF2DA8] hover:bg-[#E02094] transition-all duration-300 shadow-lg shadow-[#FF2DA8]/25 hover:shadow-[#FF2DA8]/40 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-[#FF2DA8] focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#0B0B0B]"
            aria-label="Try AIVARION Workspace Application"
          >
            <span>Try AIVARION</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
};
