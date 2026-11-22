import React from 'react';
import { ArrowUpRight, Shield } from 'lucide-react';
import logoImg from '../../assets/aivarion-logo.png';

interface FooterProps {
  onNavigate?: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, target: string) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(target);
    } else {
      window.location.href = target;
    }
  };

  return (
    <footer className="bg-[#0B0B0B] border-t border-zinc-800/80 text-zinc-400 py-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="md:col-span-2 space-y-4">
            <a
              href="/"
              onClick={(e) => handleNavClick(e, '/')}
              className="inline-block focus:outline-none focus:ring-2 focus:ring-[#FF2DA8] rounded p-1"
            >
              <img
                src={logoImg}
                alt="AIVARION"
                className="h-8 w-auto object-contain"
              />
            </a>
            <p className="text-zinc-400 text-sm max-w-md leading-relaxed">
              Private, local-first AI workspace. Execute on-device inference offline, learn Python skills with deterministic evaluation, store encrypted local notes, and interact with the cloud only when you explicitly approve every byte.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <span className="w-2 h-2 rounded-full bg-[#D4FF3F] glow-chartreuse-sm" />
              <span className="text-xs text-zinc-300 font-medium">Deterministic Privacy Engine Active</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Workspace</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href="/app"
                  onClick={(e) => handleNavClick(e, '/app')}
                  className="hover:text-white transition-colors flex items-center gap-1 focus:outline-none focus:underline"
                >
                  <span>Chat Assistant</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
                </a>
              </li>
              <li>
                <a
                  href="/app"
                  onClick={(e) => handleNavClick(e, '/app')}
                  className="hover:text-white transition-colors flex items-center gap-1 focus:outline-none focus:underline"
                >
                  <span>Skill Coach (Python)</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
                </a>
              </li>
              <li>
                <a
                  href="/app"
                  onClick={(e) => handleNavClick(e, '/app')}
                  className="hover:text-white transition-colors flex items-center gap-1 focus:outline-none focus:underline"
                >
                  <span>Personal Notes</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
                </a>
              </li>
              <li>
                <a
                  href="/app"
                  onClick={(e) => handleNavClick(e, '/app')}
                  className="hover:text-white transition-colors flex items-center gap-1 focus:outline-none focus:underline"
                >
                  <span>7-Day Study Planner</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-500" />
                </a>
              </li>
            </ul>
          </div>

          {/* Privacy & Governance */}
          <div>
            <h4 className="text-white text-sm font-semibold uppercase tracking-wider mb-4">Privacy Architecture</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#FF2DA8]" />
                <span className="text-zinc-300">Local-First Storage</span>
              </li>
              <li className="text-zinc-400">Zero Silent Fallbacks</li>
              <li className="text-zinc-400">Deterministic PII Redaction</li>
              <li className="text-zinc-400">Dual-Step Cloud Approval</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} AIVARION. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Client-side IndexedDB Storage</span>
            <span>•</span>
            <span>Offline-Ready Service Worker</span>
            <span>•</span>
            <span className="text-zinc-400 font-mono">v1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
