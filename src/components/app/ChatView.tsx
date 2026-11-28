import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Cpu,
  Copy,
  Check,
  Trash2,
  AlertCircle,
  Loader2,
  CloudLightning,
  Eye,
  XCircle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  ChatMessage,
  Conversation,
  AIMode,
  DeviceModelStatus,
  ContextTurn,
  CloudErrorInfo,
  SanitizationResult,
} from '../../types';
import {
  getMessagesByConversation,
  saveMessage,
  deleteMessage,
} from '../../db';
import {
  executeOnDeviceInference,
  executeHybridInference,
  executeCloudInference,
  initializeOnDeviceModel,
  extractRecentTurns,
  assembleContextPrompt,
  checkDeviceModelAvailability,
  parseCloudError,
  DeviceAvailabilityInfo,
} from '../../services/aiService';
import { sanitizeText } from '../../services/sanitizer';

interface ChatViewProps {
  conversation: Conversation;
  currentMode: AIMode;
  onRequireCloudApproval?: (prompt: string) => void;
  onSwitchMode?: (mode: AIMode) => void;
}

interface CloudApprovalDraft {
  rawPrompt: string;
  sanitizedPrompt: string;
  sanitizationResult: SanitizationResult;
  availableTurns: ContextTurn[];
  selectedTurnIds: string[];
}

export const ChatView: React.FC<ChatViewProps> = ({
  conversation,
  currentMode,
  onRequireCloudApproval,
  onSwitchMode,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Device model status
  const [deviceInfo, setDeviceInfo] = useState<DeviceAvailabilityInfo>({
    status: 'ready',
    engineName: 'On-Device AI',
    details: 'Checking engine capabilities...',
  });

  // Device model download progress (0-100)
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  // Non-dead-end status for on-device unavailability
  const [localUnavailableAlert, setLocalUnavailableAlert] = useState<{
    status: DeviceModelStatus;
    details: string;
    pendingPrompt?: string;
  } | null>(null);

  // Explicit Cloud approval preview modal draft
  const [approvalDraft, setApprovalDraft] = useState<CloudApprovalDraft | null>(null);

  // Cloud failure diagnostic info
  const [cloudError, setCloudError] = useState<CloudErrorInfo | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation messages and check device status
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const msgs = await getMessagesByConversation(conversation.id);
        if (isMounted) {
          setMessages(msgs);
          setCloudError(null);
          setLocalUnavailableAlert(null);
        }
      } catch (err) {
        console.error('Failed to load conversation messages:', err);
      }
    }
    loadData();

    checkDeviceModelAvailability().then((info) => {
      if (isMounted) {
        setDeviceInfo(info);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [conversation.id]);

  // Scroll to bottom on updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, approvalDraft, localUnavailableAlert, cloudError]);

  // Open the Cloud Approval Preview Modal with prompt and recent context turns
  const stageCloudApproval = (rawPrompt: string) => {
    const sanitizationResult = sanitizeText(rawPrompt);
    const availableTurns = extractRecentTurns(messages, 4);
    const selectedTurnIds = availableTurns.map((t) => t.id);

    setApprovalDraft({
      rawPrompt,
      sanitizedPrompt: sanitizationResult.sanitizedText,
      sanitizationResult,
      availableTurns,
      selectedTurnIds,
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = inputText.trim();
    if (!prompt || isLoading) return;

    setInputText('');
    setCloudError(null);
    setLocalUnavailableAlert(null);

    // Save user message locally
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

    // Mode-based execution flow
    if (currentMode === 'private_local') {
      setIsLoading(true);
      try {
        const availability = await checkDeviceModelAvailability();
        if (availability.status === 'downloading') {
          await initializeOnDeviceModel((prog) => setDownloadProgress(prog));
        } else if (availability.status !== 'ready') {
          // Do NOT show a dead-end message: show reason & offer switch to Cloud mode
          setLocalUnavailableAlert({
            status: availability.status,
            details: availability.details,
            pendingPrompt: prompt,
          });
          setIsLoading(false);
          return;
        }

        const recentTurns = extractRecentTurns(messages, 4);
        const formattedPrompt = assembleContextPrompt(recentTurns, prompt);
        const result = await executeOnDeviceInference(
          formattedPrompt,
          (prog) => setDownloadProgress(prog)
        );

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
        // Capture failure without dead end
        const errorText = err instanceof Error ? err.message : String(err);
        setLocalUnavailableAlert({
          status: 'unavailable',
          details: errorText,
          pendingPrompt: prompt,
        });
      } finally {
        setIsLoading(false);
      }
    } else if (currentMode === 'hybrid_auto') {
      setIsLoading(true);
      try {
        const recentTurns = extractRecentTurns(messages, 4);
        const formattedPrompt = assembleContextPrompt(recentTurns, prompt);
        // Step 1: Try on-device inference first with cloud fallback disabled
        const result = await executeHybridInference(
          formattedPrompt,
          false,
          (prog) => setDownloadProgress(prog)
        );

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
      } catch (err: unknown) {
        // Step 2: On-device failed or unavailable: stage preview approval gate for cloud fallback
        console.warn('Smart Hybrid local attempt failed; requesting user permission for cloud fallback:', err);
        stageCloudApproval(prompt);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Cloud mode: do not send anything until user approves in preview
      stageCloudApproval(prompt);
    }
  };

  // Toggle selection of conversation turns in preview
  const handleToggleTurn = (turnId: string) => {
    if (!approvalDraft) return;
    const isSelected = approvalDraft.selectedTurnIds.includes(turnId);
    setApprovalDraft({
      ...approvalDraft,
      selectedTurnIds: isSelected
        ? approvalDraft.selectedTurnIds.filter((id) => id !== turnId)
        : [...approvalDraft.selectedTurnIds, turnId],
    });
  };

  // Execute cloud transmission only after explicit user approval
  const handleApproveCloudTransmission = async () => {
    if (!approvalDraft) return;

    // Filter approved turns only
    const approvedTurns = approvalDraft.availableTurns.filter((t) =>
      approvalDraft.selectedTurnIds.includes(t.id)
    );
    const finalPrompt = assembleContextPrompt(approvedTurns, approvalDraft.sanitizedPrompt);

    setApprovalDraft(null);
    setIsLoading(true);
    setCloudError(null);

    try {
      const result =
        currentMode === 'hybrid_auto'
          ? await executeHybridInference(finalPrompt, true)
          : await executeCloudInference(finalPrompt);

      const assistantMsg: ChatMessage = {
        id: `msg_a_${Date.now()}`,
        conversationId: conversation.id,
        role: 'assistant',
        content: result.text,
        createdAt: Date.now(),
        // Real inference source returned by the SDK
        inferenceSource: result.inferenceSource,
        modeUsed: currentMode,
        sanitized: true,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      await saveMessage(assistantMsg);
    } catch (err: unknown) {
      // Do NOT generate a fake reply on error. Show exact error and fix guide.
      const parsed = parseCloudError(err);
      setCloudError(parsed);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelApproval = () => {
    setApprovalDraft(null);
  };

  // Switch to cloud mode when on-device AI is unavailable
  const handleSwitchToCloud = (promptToSend?: string) => {
    setLocalUnavailableAlert(null);
    if (onSwitchMode) {
      onSwitchMode('cloud');
    }
    if (promptToSend) {
      stageCloudApproval(promptToSend);
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
    <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-[#0B0B0B] text-zinc-900 dark:text-white overflow-hidden relative transition-colors duration-300">
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
                    : 'bg-white dark:bg-[#18181B] text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800 rounded-bl-none shadow-sm dark:shadow-lg'
                }`}
              >
                {/* Message Body */}
                <div className="whitespace-pre-wrap">{msg.content}</div>

                {/* Inference Source & Metadata Footer */}
                <div className="mt-3 pt-2.5 border-t border-zinc-200 dark:border-zinc-700/50 flex items-center justify-between gap-4 text-[11px] text-zinc-500 dark:text-zinc-400">
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
                  ? 'COMPUTING_ON_DEVICE (ZERO_NETWORK)...'
                  : 'PROCESSING_REQUEST_WITH_CLOUD_AI...'}
              </span>
            </div>
          </div>
        )}

        {/* Model Download Progress Indicator */}
        {(downloadProgress !== null || deviceInfo.status === 'downloading') && (
          <div
            className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 text-xs shadow-md space-y-2"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                <span>Downloading On-Device Gemini Nano Model</span>
              </div>
              <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400">
                {downloadProgress !== null ? `${downloadProgress}%` : 'In Progress...'}
              </span>
            </div>
            <div className="w-full bg-amber-200/50 dark:bg-amber-950/60 rounded-full h-2 overflow-hidden border border-amber-500/20">
              <div
                className="bg-amber-500 h-full transition-all duration-300"
                style={{ width: `${downloadProgress ?? 15}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400">
              Browser component download managed by Chrome. Please keep this tab open during download.
            </p>
          </div>
        )}

        {/* 1. On-Device Unavailable Non-Dead-End Notification */}
        {localUnavailableAlert && (
          <div
            className="p-5 rounded-2xl bg-[#141417] border border-amber-500/40 shadow-xl space-y-3"
            role="alert"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
                <Cpu className="w-4 h-4" />
                <span>
                  On-Device AI Engine Status: {localUnavailableAlert.status.toUpperCase()}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                CLIENT_AI
              </span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              {localUnavailableAlert.details}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-zinc-800/80">
              <div className="text-[11px] text-zinc-500 font-mono">
                No cloud data has been transmitted. Your draft is ready for review.
              </div>

              <button
                onClick={() => handleSwitchToCloud(localUnavailableAlert.pendingPrompt)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2 rounded-full text-xs font-semibold text-white bg-[#FF2DA8] hover:bg-[#E02094] transition-all shadow-md shadow-[#FF2DA8]/20 focus:outline-none focus:ring-2 focus:ring-[#FF2DA8]"
              >
                <CloudLightning className="w-3.5 h-3.5" />
                <span>Switch to Cloud mode</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 2. Real Cloud Error Alert Box (No Fake Replies) */}
        {cloudError && (
          <div
            className="p-5 rounded-2xl bg-red-950/30 border border-red-800/80 shadow-2xl space-y-3"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{cloudError.title}</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-900/40 text-red-300 border border-red-700/50 uppercase">
                {cloudError.errorCategory}
              </span>
            </div>

            {/* Exact Raw Error */}
            <div className="bg-black/60 rounded-xl p-3 border border-red-900/40 font-mono text-xs text-red-300/90 overflow-x-auto">
              <code>{cloudError.rawError}</code>
            </div>

            {/* Actionable Fix Guide */}
            <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-300 space-y-1.5">
              <div className="font-semibold text-white flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-[#FF2DA8]" />
                <span>How to resolve this:</span>
              </div>
              <p className="leading-relaxed text-zinc-300">{cloudError.fixGuide}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                onClick={() => setCloudError(null)}
                className="px-4 py-1.5 rounded-full text-xs font-medium text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700"
              >
                Dismiss
              </button>
              {onSwitchMode && (
                <button
                  onClick={() => {
                    setCloudError(null);
                    onSwitchMode('private_local');
                  }}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
                >
                  Switch to Local mode
                </button>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 3. Cloud Chat Preview Approval Modal */}
      {approvalDraft && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cloud-approval-title"
        >
          <div className="bg-[#121214] border border-zinc-700/80 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#FF2DA8]/15 border border-[#FF2DA8]/30 flex items-center justify-center text-[#FF2DA8]">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="cloud-approval-title" className="text-sm font-bold text-white font-display">
                    Review Payload Before Cloud Transmission
                  </h3>
                  <div className="text-[11px] text-zinc-400 font-mono">
                    TARGET: Google Cloud / Firebase AI Logic (gemini-3.8-flash)
                  </div>
                </div>
              </div>

              <button
                onClick={handleCancelApproval}
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Cancel"
                aria-label="Cancel"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              {/* Sanitization Report */}
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#D4FF3F]" />
                    <span>Deterministic PII Sanitization Completed</span>
                  </span>
                  <span className="font-mono text-zinc-400">
                    {approvalDraft.sanitizationResult.removedItems.length} items redacted
                  </span>
                </div>

                {approvalDraft.sanitizationResult.removedItems.length > 0 && (
                  <div className="text-zinc-400 space-y-1 pt-1">
                    {approvalDraft.sanitizationResult.removedItems.map((item, i) => (
                      <div key={i} className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 uppercase">
                          {item.type}
                        </span>
                        <span className="line-through text-red-400">{item.original}</span>
                        <span className="text-zinc-600">→</span>
                        <span className="text-[#D4FF3F]">{item.replacement}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Exact Approved Prompt */}
              <div className="space-y-1.5">
                <div className="font-mono text-zinc-400 flex items-center justify-between">
                  <span>EXACT PROMPT TO TRANSMIT:</span>
                  <span className="text-zinc-500 font-mono text-[10px]">VERIFIED</span>
                </div>
                <div className="p-3 bg-[#0A0A0B] border border-zinc-800 rounded-xl text-zinc-200 font-mono">
                  {approvalDraft.sanitizedPrompt}
                </div>
              </div>

              {/* Recent Conversation Turns to Approve */}
              {approvalDraft.availableTurns.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="font-mono text-zinc-400 flex items-center justify-between">
                    <span>APPROVE CONVERSATION CONTEXT TURNS TO INCLUDE:</span>
                    <span className="text-zinc-500 text-[10px]">
                      {approvalDraft.selectedTurnIds.length} of {approvalDraft.availableTurns.length} approved
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {approvalDraft.availableTurns.map((turn) => {
                      const isSelected = approvalDraft.selectedTurnIds.includes(turn.id);
                      return (
                        <label
                          key={turn.id}
                          className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-zinc-800/80 border-[#FF2DA8]/40 text-zinc-200'
                              : 'bg-zinc-900/40 border-zinc-800 text-zinc-500'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleTurn(turn.id)}
                            className="mt-0.5 rounded border-zinc-700 text-[#FF2DA8] focus:ring-[#FF2DA8]"
                          />
                          <div className="flex-1 truncate">
                            <span className="font-mono uppercase font-semibold text-[10px] mr-2 text-[#FF2DA8]">
                              {turn.role}:
                            </span>
                            <span className="truncate">{turn.content}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-5 border-t border-zinc-800 bg-[#0F0F10] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-[11px] text-zinc-400 font-mono">
                Zero transmission until you approve this exact preview.
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handleCancelApproval}
                  className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white text-xs font-semibold transition-all focus:outline-none"
                >
                  Cancel (Send Nothing)
                </button>

                <button
                  onClick={handleApproveCloudTransmission}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#FF2DA8] hover:bg-[#E02094] text-white text-xs font-semibold transition-all shadow-lg shadow-[#FF2DA8]/25 focus:outline-none focus:ring-2 focus:ring-[#FF2DA8]"
                >
                  <CloudLightning className="w-3.5 h-3.5" />
                  <span>Approve & Transmit</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Bar Form */}
      <div className="p-4 bg-white dark:bg-[#121214] border-t border-zinc-200 dark:border-zinc-800/80 transition-colors">
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
                  : currentMode === 'hybrid_auto'
                  ? 'Ask anything (local-first with preview approval gate)...'
                  : 'Ask anything (preview approval required before transmission)...'
              }
              disabled={isLoading}
              className="w-full bg-zinc-100 dark:bg-[#18181B] text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 rounded-full py-3.5 pl-5 pr-12 text-sm border border-zinc-200 dark:border-zinc-700/80 focus:outline-none focus:ring-2 focus:ring-[#FF2DA8] focus:border-transparent transition-all disabled:opacity-50"
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
          {currentMode === 'private_local' && 'Private Local active • Zero cloud data transmission'}
          {currentMode === 'hybrid_auto' && 'Hybrid Auto active • Local-first inference with human preview gate'}
          {currentMode === 'cloud' && 'Cloud mode active • Explicit human approval required before sending'}
        </div>
      </div>
    </div>
  );
};

export default ChatView;
