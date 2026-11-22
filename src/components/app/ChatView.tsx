import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Cpu,
  Copy,
  Check,
  Trash2,
  AlertCircle,
  Sparkles,
  ShieldAlert,
  Loader2,
  Lock,
} from 'lucide-react';
import {
  ChatMessage,
  Conversation,
  AIMode,
  DeviceModelStatus,
} from '../../types';
import {
  getMessagesByConversation,
  saveMessage,
  deleteMessage,
} from '../../db';
import {
  executeOnDeviceInference,
  formatConversationContext,
  checkDeviceModelAvailability,
} from '../../services/aiService';

interface ChatViewProps {
  conversation: Conversation;
  currentMode: AIMode;
  onRequireCloudApproval?: (prompt: string) => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  conversation,
  currentMode,
  onRequireCloudApproval,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceModelStatus>('ready');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages for current conversation
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const msgs = await getMessagesByConversation(conversation.id);
        if (isMounted) {
          setMessages(msgs);
          setErrorMessage(null);
        }
      } catch (err) {
        console.error('Failed to load conversation messages:', err);
      }
    }
    loadData();

    // Check device model status
    checkDeviceModelAvailability().then((info) => {
      if (isMounted) setDeviceStatus(info.status);
    });

    return () => {
      isMounted = false;
    };
  }, [conversation.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = inputText.trim();
    if (!prompt || isLoading) return;

    setInputText('');
    setErrorMessage(null);

    // 1. Create and save user message locally
    const userMsg: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      conversationId: conversation.id,
      role: 'user',
      content: prompt,
      createdAt: Date.now(),
      modeUsed: currentMode,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    await saveMessage(userMsg);

    // 2. Handle inference based on active AI mode
    if (currentMode === 'private_local') {
      setIsLoading(true);
      try {
        // Enforce strict local execution: no cloud fallback
        const formattedPrompt = formatConversationContext(messages, prompt);
        const result = await executeOnDeviceInference(formattedPrompt);

        const assistantMsg: ChatMessage = {
          id: `msg_a_${Date.now()}`,
          conversationId: conversation.id,
          role: 'assistant',
          content: result.text,
          createdAt: Date.now(),
          inferenceSource: result.inferenceSource,
          modeUsed: 'private_local',
        };

        setMessages((prev) => [...prev, assistantMsg]);
        await saveMessage(assistantMsg);
      } catch (err: unknown) {
        const errorText = err instanceof Error ? err.message : String(err);
        setErrorMessage(errorText);
      } finally {
        setIsLoading(false);
      }
    } else if (currentMode === 'hybrid_auto') {
      // In Hybrid Auto mode: attempt local first, or trigger approval gate
      setIsLoading(true);
      try {
        const formattedPrompt = formatConversationContext(messages, prompt);
        const result = await executeOnDeviceInference(formattedPrompt);

        const assistantMsg: ChatMessage = {
          id: `msg_a_${Date.now()}`,
          conversationId: conversation.id,
          role: 'assistant',
          content: result.text,
          createdAt: Date.now(),
          inferenceSource: result.inferenceSource,
          modeUsed: 'hybrid_auto',
        };

        setMessages((prev) => [...prev, assistantMsg]);
        await saveMessage(assistantMsg);
      } catch {
        // Local inference failed or unavailable: trigger sanitized cloud approval gate
        if (onRequireCloudApproval) {
          onRequireCloudApproval(prompt);
        } else {
          setErrorMessage(
            'Local inference unavailable. Cloud execution requires explicit approval in the Plan tab.'
          );
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      // Cloud mode: routed through approval preview
      if (onRequireCloudApproval) {
        onRequireCloudApproval(prompt);
      } else {
        setErrorMessage(
          'Cloud requests require deterministic sanitization and explicit preview approval.'
        );
      }
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteMsg = async (id: string) => {
    await deleteMessage(id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B0B0B] overflow-hidden">
      {/* Messages Thread Container */}
      <div
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6"
        role="log"
        aria-live="polite"
        aria-label="Conversation message history"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
            >
              <div
                className={`max-w-2xl rounded-2xl p-4 sm:p-5 transition-all text-sm leading-relaxed ${
                  isUser
                    ? 'bg-[#FF2DA8] text-white rounded-br-none shadow-md shadow-[#FF2DA8]/20'
                    : 'bg-[#18181B] text-zinc-100 border border-zinc-800 rounded-bl-none shadow-lg'
                }`}
              >
                {/* Message Body */}
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Inference Source & Metadata Footer */}
                <div className="mt-3 pt-2.5 border-t border-zinc-700/50 flex items-center justify-between gap-4 text-[11px] text-zinc-400">
                  <div className="flex items-center gap-2">
                    {msg.inferenceSource ? (
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-mono text-[10px] font-semibold ${
                          msg.inferenceSource === 'on_device'
                            ? 'bg-[#D4FF3F]/15 text-[#D4FF3F] border border-[#D4FF3F]/30'
                            : 'bg-[#FF2DA8]/15 text-[#FF2DA8] border border-[#FF2DA8]/30'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        <span>
                          {msg.inferenceSource === 'on_device'
                            ? 'SOURCE: ON-DEVICE (LOCAL)'
                            : 'SOURCE: CLOUD'}
                        </span>
                      </span>
                    ) : (
                      <span className="font-mono text-zinc-400">CLIENT</span>
                    )}

                    <span className="text-zinc-400">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {/* Actions (Copy / Delete) */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="p-1 rounded hover:bg-zinc-700/60 text-zinc-400 hover:text-white transition-colors"
                      title="Copy content"
                      aria-label="Copy message"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-[#D4FF3F]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteMsg(msg.id)}
                      className="p-1 rounded hover:bg-zinc-700/60 text-zinc-400 hover:text-red-400 transition-colors"
                      title="Delete message"
                      aria-label="Delete message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start">
            <div className="bg-[#18181B] border border-zinc-800 rounded-2xl rounded-bl-none p-4 flex items-center gap-3 text-zinc-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin text-[#FF2DA8]" />
              <span className="font-mono text-xs">
                {currentMode === 'private_local'
                  ? 'COMPUTING_ON_DEVICE...'
                  : 'PROCESSING_REQUEST...'}
              </span>
            </div>
          </div>
        )}

        {/* Error Alert Box */}
        {errorMessage && (
          <div
            className="p-4 rounded-xl bg-red-950/40 border border-red-800/80 text-red-200 text-sm flex items-start gap-3"
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-red-300">Inference Notification</div>
              <p className="text-xs text-red-200/90 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar Form */}
      <div className="p-4 bg-[#121214] border-t border-zinc-800/80">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              aria-label="Message prompt input"
              placeholder={
                currentMode === 'private_local'
                  ? 'Ask anything (100% on-device private computation)...'
                  : 'Ask anything (hybrid auto-orchestrated)...'
              }
              disabled={isLoading}
              className="w-full bg-[#18181B] text-white placeholder-zinc-500 rounded-full py-3.5 pl-5 pr-12 text-sm border border-zinc-700/80 focus:outline-none focus:ring-2 focus:ring-[#FF2DA8] focus:border-transparent transition-all disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-3.5 rounded-full bg-[#FF2DA8] hover:bg-[#E02094] text-white disabled:opacity-40 disabled:hover:bg-[#FF2DA8] transition-all duration-200 shadow-lg shadow-[#FF2DA8]/20 focus:outline-none focus:ring-2 focus:ring-[#FF2DA8]"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-2 text-center text-[11px] text-zinc-500 font-mono">
          Private Local active • Zero cloud data transmission • Single-turn context preserved
        </div>
      </div>
    </div>
  );
};

export default ChatView;
