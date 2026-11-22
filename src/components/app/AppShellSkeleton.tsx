import React, { useState } from 'react';
import {
  MessageSquare,
  GraduationCap,
  FileText,
  CalendarCheck,
  Settings,
  Shield,
  Wifi,
  WifiOff,
  Cpu,
  ArrowLeft,
} from 'lucide-react';
import logoImg from '../../assets/aivarion-logo.png';
import { AIMode, DeviceModelStatus } from '../../types';

interface AppShellSkeletonProps {
  onNavigateHome: () => void;
}

export const AppShellSkeleton: React.FC<AppShellSkeletonProps> = ({ onNavigateHome }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'learn' | 'notes' | 'plan' | 'settings'>('chat');
  const [selectedMode] = useState<AIMode>('private_local');
  const [modelStatus] = useState<DeviceModelStatus>('ready');
  const isOnline = navigator.onLine;

  return (
    <div className="flex h-screen bg-[#0B0B0B] text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#141414] border-r border-zinc-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand header */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2 text-left group focus:outline-none"
              title="Return to Landing Page"
            >
              <img src={logoImg} alt="AIVARION" className="h-7 w-auto object-contain" />
            </button>
            <button
              onClick={onNavigateHome}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Back to Landing Page"
              aria-label="Back to Landing Page"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-[#FF2DA8] text-white shadow-lg shadow-[#FF2DA8]/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat</span>
            </button>

            <button
              onClick={() => setActiveTab('learn')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'learn'
                  ? 'bg-[#FF2DA8] text-white shadow-lg shadow-[#FF2DA8]/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Learn (Python)</span>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'notes'
                  ? 'bg-[#FF2DA8] text-white shadow-lg shadow-[#FF2DA8]/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Notes</span>
            </button>

            <button
              onClick={() => setActiveTab('plan')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'plan'
                  ? 'bg-[#FF2DA8] text-white shadow-lg shadow-[#FF2DA8]/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Plan (Cloud)</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === 'settings'
                  ? 'bg-[#FF2DA8] text-white shadow-lg shadow-[#FF2DA8]/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Status Footer */}
        <div className="p-4 border-t border-zinc-800 space-y-3 bg-[#0F0F10]">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#FF2DA8]" />
              <span className="capitalize">{selectedMode.replace('_', ' ')}</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-[#D4FF3F] glow-chartreuse-sm" />
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-zinc-400" />
              <span>On-Device AI</span>
            </span>
            <span className="text-zinc-300 capitalize text-[11px] font-mono">{modelStatus}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 pt-1 border-t border-zinc-800/60">
            <span className="flex items-center gap-1.5">
              {isOnline ? (
                <Wifi className="w-3.5 h-3.5 text-[#D4FF3F]" />
              ) : (
                <WifiOff className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span>{isOnline ? 'Online' : 'Offline'}</span>
            </span>
            <span className="text-[10px] text-zinc-500 font-mono">Dexie Storage</span>
          </div>
        </div>
      </aside>

      {/* Main workspace container */}
      <main className="flex-1 flex flex-col bg-[#0B0B0B] overflow-hidden">
        {/* Workspace Top Header */}
        <header className="h-16 border-b border-zinc-800/80 px-6 flex items-center justify-between bg-[#141414]/50">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold capitalize text-white">
              {activeTab === 'chat' && 'Private Local Chat'}
              {activeTab === 'learn' && 'Python Basics Skill Coach'}
              {activeTab === 'notes' && 'Offline Personal Notes'}
              {activeTab === 'plan' && 'Guarded 7-Day Cloud Plan'}
              {activeTab === 'settings' && 'Workspace & Privacy Settings'}
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 text-zinc-400 border border-zinc-700">
              LOCAL_FIRST
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
              <span>Verified On-Device Session</span>
            </div>
          </div>
        </header>

        {/* View Content Placeholder (Ready for Phase 3/4/5 full integration) */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-4xl mx-auto h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
            <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#FF2DA8] mb-4 shadow-lg shadow-[#FF2DA8]/10">
              {activeTab === 'chat' && <MessageSquare className="w-8 h-8" />}
              {activeTab === 'learn' && <GraduationCap className="w-8 h-8" />}
              {activeTab === 'notes' && <FileText className="w-8 h-8" />}
              {activeTab === 'plan' && <CalendarCheck className="w-8 h-8" />}
              {activeTab === 'settings' && <Settings className="w-8 h-8" />}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              AIVARION {activeTab.toUpperCase()} Module
            </h3>
            <p className="text-sm text-zinc-400 max-w-md">
              Application shell initialized with local state, Dexie schema binding, and Firebase AI Logic connector.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};
