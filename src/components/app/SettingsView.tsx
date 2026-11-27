import React, { useState, useEffect } from 'react';
import {
  Settings,
  Shield,
  Cpu,
  Wifi,
  WifiOff,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Lock,
  DownloadCloud,
  RefreshCw,
} from 'lucide-react';
import { AIMode, DeviceModelStatus } from '../../types';
import { checkDeviceModelAvailability, DeviceAvailabilityInfo } from '../../services/aiService';
import { clearAllLocalData } from '../../db';

interface SettingsViewProps {
  currentMode: AIMode;
  onChangeMode: (mode: AIMode) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentMode,
  onChangeMode,
}) => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceAvailabilityInfo>({
    status: 'ready',
    engineName: 'Checking...',
    details: 'Inspecting client machine capabilities...',
  });
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [clearing, setClearing] = useState(false);
  const [clearedMessage, setClearedMessage] = useState(false);

  const refreshStatus = async () => {
    const info = await checkDeviceModelAvailability();
    setDeviceInfo(info);
    setIsOnline(navigator.onLine);
  };

  useEffect(() => {
    refreshStatus();
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleClearData = async () => {
    if (window.confirm('Are you sure you want to permanently clear all local chats, notes, and quiz results stored on this device?')) {
      setClearing(true);
      await clearAllLocalData();
      setClearing(false);
      setClearedMessage(true);
      setTimeout(() => setClearedMessage(false), 3000);
    }
  };

  return (
    <div className="flex-1 h-full bg-zinc-50 dark:bg-[#0B0B0B] text-zinc-900 dark:text-white overflow-y-auto p-4 sm:p-8 transition-colors duration-300">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white font-display">Workspace & Privacy Settings</h1>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              Configure on-device AI execution, view hardware capabilities, and manage local storage.
            </p>
          </div>
          <button
            onClick={refreshStatus}
            className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors shadow-sm"
            title="Refresh Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: AI Mode Selection */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Active AI Execution Mode
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Private Local */}
            <button
              onClick={() => onChangeMode('private_local')}
              className={`text-left p-5 rounded-2xl border transition-all ${
                currentMode === 'private_local'
                  ? 'bg-white dark:bg-zinc-900 border-[#FF2DA8] shadow-md shadow-[#FF2DA8]/15'
                  : 'bg-white dark:bg-[#141416] border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <Lock className="w-4 h-4 text-[#FF2DA8]" />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  ONLY_ON_DEVICE
                </span>
              </div>
              <div className="font-bold text-sm text-zinc-900 dark:text-white mb-1">Private Local</div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                100% on-device inference. Guaranteed zero data leaves your machine. No silent fallback.
              </p>
            </button>

            {/* Hybrid Auto */}
            <button
              onClick={() => onChangeMode('hybrid_auto')}
              className={`text-left p-5 rounded-2xl border transition-all ${
                currentMode === 'hybrid_auto'
                  ? 'bg-white dark:bg-zinc-900 border-[#FF2DA8] shadow-md shadow-[#FF2DA8]/15'
                  : 'bg-white dark:bg-[#141416] border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <Shield className="w-4 h-4 text-[#D4FF3F]" />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  PREFER_ON_DEVICE
                </span>
              </div>
              <div className="font-bold text-sm text-zinc-900 dark:text-white mb-1">Hybrid Auto</div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Attempts on-device first. If unavailable, sanitizes payload and requests explicit user approval.
              </p>
            </button>

            {/* Cloud */}
            <button
              onClick={() => onChangeMode('cloud')}
              className={`text-left p-5 rounded-2xl border transition-all ${
                currentMode === 'cloud'
                  ? 'bg-white dark:bg-zinc-900 border-[#FF2DA8] shadow-md shadow-[#FF2DA8]/15'
                  : 'bg-white dark:bg-[#141416] border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <DownloadCloud className="w-4 h-4 text-zinc-400" />
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  ONLY_IN_CLOUD
                </span>
              </div>
              <div className="font-bold text-sm text-zinc-900 dark:text-white mb-1">Guarded Cloud</div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Reserved for 7-day planning. Runs only after deterministic PII sanitation and user inspection.
              </p>
            </button>
          </div>
        </div>

        {/* Section 2: Hardware & On-Device AI Availability */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#141416] border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#FF2DA8]" />
            <span>On-Device Model Diagnostics</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <div className="text-xs text-zinc-500">Status</div>
              <div className="flex items-center gap-2 text-sm font-bold capitalize text-zinc-900 dark:text-white">
                <span
                  className={`w-2 h-2 rounded-full ${
                    deviceInfo.status === 'ready'
                      ? 'bg-[#D4FF3F]'
                      : deviceInfo.status === 'downloading'
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-zinc-400 dark:bg-zinc-600'
                  }`}
                />
                <span>{deviceInfo.status}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <div className="text-xs text-zinc-500">Detected Engine</div>
              <div className="text-sm font-bold text-zinc-900 dark:text-white font-mono">{deviceInfo.engineName}</div>
            </div>
          </div>

          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed pt-1">
            {deviceInfo.details}
          </p>
        </div>

        {/* Section 3: Network & Offline Status */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#141416] border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-[#D4FF3F]" />
            ) : (
              <WifiOff className="w-4 h-4 text-amber-500" />
            )}
            <span>Connectivity & PWA Caching</span>
          </h2>

          <div className="flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300">
            <span>Real Network Status:</span>
            <span
              className={`font-semibold px-2.5 py-1 rounded-full ${
                isOnline
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
              }`}
            >
              {isOnline ? 'Online (Synchronized)' : 'Offline (Local-First Active)'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300">
            <span>Service Worker Application Cache:</span>
            <span className="font-mono text-zinc-500 dark:text-zinc-400">Vite-PWA Cache Enabled</span>
          </div>
        </div>

        {/* Section 4: Data Management & Privacy Guarantee */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#141416] border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-red-500" />
            <span>Local Data Sovereignty</span>
          </h2>

          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            All your chat messages, personal notes, and Python quiz attempts reside inside your browser’s IndexedDB database. You can purge all stored data at any time.
          </p>

          <div className="pt-2 flex items-center gap-4">
            <button
              onClick={handleClearData}
              disabled={clearing}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-950/80 dark:hover:bg-red-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 text-xs font-semibold transition-all disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{clearing ? 'Clearing...' : 'Clear All Local Data'}</span>
            </button>

            {clearedMessage && (
              <span className="text-xs text-[#D4FF3F] flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>All local records purged.</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
