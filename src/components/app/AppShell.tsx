import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  GraduationCap,
  FileText,
  CalendarCheck,
  Settings,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Shield,
  Wifi,
  WifiOff,
  Cpu,
  ArrowLeft,
  Lock,
} from 'lucide-react';
import logoImg from '../../assets/aivarion-logo.png';
import {
  Conversation,
  AIMode,
  DeviceModelStatus,
} from '../../types';
import {
  getConversations,
  createConversation,
  updateConversationTitle,
  deleteConversation,
  ensureDefaultConversation,
} from '../../db';
import { checkDeviceModelAvailability } from '../../services/aiService';
import { ChatView } from './ChatView';

interface AppShellProps {
  onNavigateHome: () => void;
  initialTab?: 'chat' | 'learn' | 'notes' | 'plan' | 'settings';
}

export const AppShell: React.FC<AppShellProps> = ({
  onNavigateHome,
  initialTab = 'chat',
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'learn' | 'notes' | 'plan' | 'settings'>(initialTab);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [currentMode, setCurrentMode] = useState<AIMode>('private_local');
  const [deviceStatus, setDeviceStatus] = useState<DeviceModelStatus>('ready');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Monitor network online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check of on-device model status
    checkDeviceModelAvailability().then((info) => {
      setDeviceStatus(info.status);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize and load conversations
  useEffect(() => {
    let isMounted = true;
    async function initConversations() {
      const defaultConv = await ensureDefaultConversation();
      const allConvs = await getConversations();
      if (isMounted) {
        setConversations(allConvs);
        setActiveConversation(defaultConv);
      }
    }
    initConversations();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateNewConversation = async () => {
    const newConv = await createConversation(`Conversation ${conversations.length + 1}`);
    const updated = await getConversations();
    setConversations(updated);
    setActiveConversation(newConv);
    setActiveTab('chat');
  };

  const handleStartRename = (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConvId(conv.id);
    setEditTitle(conv.title);
  };

  const handleSaveRename = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      await updateConversationTitle(id, editTitle.trim());
      const updated = await getConversations();
      setConversations(updated);
      if (activeConversation?.id === id) {
        setActiveConversation({ ...activeConversation, title: editTitle.trim() });
      }
    }
    setEditingConvId(null);
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteConversation(id);
    const remaining = await getConversations();
    setConversations(remaining);
    if (activeConversation?.id === id) {
      if (remaining.length > 0) {
        setActiveConversation(remaining[0]);
      } else {
        const fresh = await createConversation('New Conversation');
        setConversations([fresh]);
        setActiveConversation(fresh);
      }
    }
  };

  return (
    <div className="flex h-screen bg-[#0B0B0B] text-white overflow-hidden">
      {/* ChatGPT-style Left Sidebar */}
      <aside className="w-64 bg-[#141416] border-r border-zinc-800 flex flex-col justify-between shrink-0">
        <div className="flex-1 flex flex-col overflow-hidden">
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

          {/* New Conversation Action */}
          <div className="p-3">
            <button
              onClick={handleCreateNewConversation}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#FF2DA8] hover:bg-[#E02094] transition-all duration-200 shadow-md shadow-[#FF2DA8]/20 focus:outline-none focus:ring-2 focus:ring-[#FF2DA8]"
            >
              <Plus className="w-4 h-4" />
              <span>New Conversation</span>
            </button>
          </div>

          {/* Primary Workspace Navigation Tabs */}
          <nav className="px-3 pb-3 border-b border-zinc-800/80 space-y-1">
            <button
              onClick={() => setActiveTab('chat')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'chat'
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <MessageSquare className="w-4 h-4 text-[#FF2DA8]" />
              <span>Chat Assistant</span>
            </button>

            <button
              onClick={() => setActiveTab('learn')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'learn'
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <GraduationCap className="w-4 h-4 text-[#D4FF3F]" />
              <span>Skill Coach (Python)</span>
            </button>

            <button
              onClick={() => setActiveTab('notes')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'notes'
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <FileText className="w-4 h-4 text-zinc-300" />
              <span>Personal Notes</span>
            </button>

            <button
              onClick={() => setActiveTab('plan')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'plan'
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <CalendarCheck className="w-4 h-4 text-[#FF2DA8]" />
              <span>7-Day Cloud Plan</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-zinc-800 text-white border border-zinc-700'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <Settings className="w-4 h-4 text-zinc-400" />
              <span>Settings</span>
            </button>
          </nav>

          {/* Conversation History List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <div className="px-2 py-1 text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
              Recent Chats
            </div>
            {conversations.map((conv) => {
              const isActive = activeConversation?.id === conv.id;
              const isEditing = editingConvId === conv.id;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setActiveConversation(conv);
                    setActiveTab('chat');
                  }}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                    isActive && activeTab === 'chat'
                      ? 'bg-zinc-800/90 text-white border border-zinc-700'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate flex-1">
                    <MessageSquare className="w-3.5 h-3.5 shrink-0 text-zinc-500" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="bg-zinc-900 text-white border border-[#FF2DA8] rounded px-1.5 py-0.5 text-xs w-full focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      <span className="truncate">{conv.title}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                    {isEditing ? (
                      <>
                        <button
                          onClick={(e) => handleSaveRename(conv.id, e)}
                          className="p-1 hover:text-[#D4FF3F]"
                          title="Save"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingConvId(null);
                          }}
                          className="p-1 hover:text-zinc-300"
                          title="Cancel"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => handleStartRename(conv, e)}
                          className="p-1 hover:text-white text-zinc-500"
                          title="Rename"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteConversation(conv.id, e)}
                          className="p-1 hover:text-red-400 text-zinc-500"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar Status Footer */}
        <div className="p-3.5 border-t border-zinc-800 space-y-2.5 bg-[#0F0F10]">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#FF2DA8]" />
              <span className="capitalize">{currentMode.replace('_', ' ')}</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-[#D4FF3F] glow-chartreuse-sm" />
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-zinc-400" />
              <span>On-Device AI</span>
            </span>
            <span className="text-zinc-300 capitalize text-[11px] font-mono">{deviceStatus}</span>
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
            <span className="text-[10px] text-zinc-500 font-mono">Dexie IndexedDB</span>
          </div>
        </div>
      </aside>

      {/* Main Workspace Active View Panel */}
      <main className="flex-1 flex flex-col bg-[#0B0B0B] overflow-hidden">
        {/* Workspace Top Header */}
        <header className="h-16 border-b border-zinc-800/80 px-6 flex items-center justify-between bg-[#141416]/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold capitalize text-white">
              {activeTab === 'chat' && (activeConversation?.title || 'Private Local Chat')}
              {activeTab === 'learn' && 'Python Basics Skill Coach'}
              {activeTab === 'notes' && 'Offline Personal Notes'}
              {activeTab === 'plan' && 'Guarded 7-Day Cloud Plan'}
              {activeTab === 'settings' && 'Workspace & Privacy Settings'}
            </h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
              {currentMode === 'private_local' && 'ONLY_ON_DEVICE'}
              {currentMode === 'hybrid_auto' && 'PREFER_ON_DEVICE'}
              {currentMode === 'cloud' && 'ONLY_IN_CLOUD'}
            </span>
          </div>

          {/* AI Mode Selector Buttons in Header */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-full p-1 text-xs">
              <button
                onClick={() => setCurrentMode('private_local')}
                className={`px-3 py-1 rounded-full font-medium transition-all ${
                  currentMode === 'private_local'
                    ? 'bg-[#FF2DA8] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Private Local
              </button>
              <button
                onClick={() => setCurrentMode('hybrid_auto')}
                className={`px-3 py-1 rounded-full font-medium transition-all ${
                  currentMode === 'hybrid_auto'
                    ? 'bg-[#FF2DA8] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Hybrid Auto
              </button>
              <button
                onClick={() => setCurrentMode('cloud')}
                className={`px-3 py-1 rounded-full font-medium transition-all ${
                  currentMode === 'cloud'
                    ? 'bg-[#FF2DA8] text-white shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Cloud
              </button>
            </div>
          </div>
        </header>

        {/* View Switcher Container */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'chat' && activeConversation && (
            <ChatView
              conversation={activeConversation}
              currentMode={currentMode}
              onRequireCloudApproval={() => {
                setActiveTab('plan');
              }}
            />
          )}

          {activeTab !== 'chat' && (
            <div className="h-full flex items-center justify-center p-6 text-center">
              <div className="max-w-md p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-zinc-800 mx-auto flex items-center justify-center text-[#FF2DA8]">
                  {activeTab === 'learn' && <GraduationCap className="w-6 h-6" />}
                  {activeTab === 'notes' && <FileText className="w-6 h-6" />}
                  {activeTab === 'plan' && <CalendarCheck className="w-6 h-6" />}
                  {activeTab === 'settings' && <Settings className="w-6 h-6" />}
                </div>
                <h3 className="text-xl font-bold text-white capitalize">{activeTab} Module</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Scheduled for Phase 4 (Learn & Notes) and Phase 5 (Sanitized Cloud Plan & Approval Flow).
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AppShell;
