import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarCheck,
  ShieldCheck,
  CloudLightning,
  CheckCircle2,
  XCircle,
  Clock,
  BookOpen,
  Database,
  Loader2,
  AlertCircle,
  Eye,
  Check,
  RefreshCw,
  Trash2,
  WifiOff,
} from 'lucide-react';
import { StudyPlan, UserTask, PendingCloudRequest } from '../../types';
import {
  prepareStudyPlanPayload,
  PreparedStudyPlanRequest,
  executeCloudStudyPlan,
  saveApprovedTasksToFirestore,
  listPendingRequests,
  deletePendingRequest,
  rePrepareFromPending,
} from '../../services/studyPlanService';
import { PayloadPreviewModal } from './PayloadPreviewModal';

export const PlanView: React.FC = () => {
  const [topicInput, setTopicInput] = useState('Python for Data Analysis & Automation');
  const [experienceLevel, setExperienceLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [privateNamesInput, setPrivateNamesInput] = useState('');

  // Workflow stages
  const [preparedRequest, setPreparedRequest] = useState<PreparedStudyPlanRequest | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<StudyPlan | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Firestore saving stage (Approval Gate 2)
  const [isSavingToFirestore, setIsSavingToFirestore] = useState(false);
  const [savedTasks, setSavedTasks] = useState<UserTask[] | null>(null);
  const [saveRejected, setSaveRejected] = useState(false);

  // Pending offline requests
  const [pendingRequests, setPendingRequests] = useState<PendingCloudRequest[]>([]);
  const [activePendingId, setActivePendingId] = useState<string | null>(null);

  const loadPending = useCallback(async () => {
    try {
      const items = await listPendingRequests();
      setPendingRequests(items);
    } catch (err) {
      console.warn('Failed to load pending requests:', err);
    }
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  // Step 1: Request Plan -> triggers Gate 1 (Sanitization & Preview Modal)
  const handleInitiatePlanRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setActivePendingId(null);
    setGenerationError(null);
    setGeneratedPlan(null);
    setSavedTasks(null);
    setSaveRejected(false);

    const namesList = privateNamesInput
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    const prepared = prepareStudyPlanPayload(topicInput, experienceLevel, {
      privateNames: namesList,
      warnOnFreeTextKeywords: true,
    });

    setPreparedRequest(prepared);
    setShowPreviewModal(true);
  };

  // Step 2: Gate 1 Approved -> Cloud Request Sent & Zod Validated
  const handleApproveGate1 = async () => {
    if (!preparedRequest) return;
    setShowPreviewModal(false);
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const plan = await executeCloudStudyPlan(preparedRequest);
      setGeneratedPlan(plan);
      if (activePendingId) {
        await deletePendingRequest(activePendingId);
        setActivePendingId(null);
        await loadPending();
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setGenerationError(errMsg);
      await loadPending();
    } finally {
      setIsGenerating(false);
    }
  };

  // Retry an offline queued request (Full sanitization & dual approval cycle)
  const handleRetryPending = (req: PendingCloudRequest) => {
    setGenerationError(null);
    setGeneratedPlan(null);
    setSavedTasks(null);
    setSaveRejected(false);
    setActivePendingId(req.id);

    const prepared = rePrepareFromPending(req);
    setPreparedRequest(prepared);
    setShowPreviewModal(true);
  };

  // Discard a pending request
  const handleDiscardPending = async (id: string) => {
    await deletePendingRequest(id);
    await loadPending();
  };

  // Cancel Gate 1 -> Abort cleanly, nothing sent to cloud
  const handleCancelGate1 = () => {
    setShowPreviewModal(false);
    setPreparedRequest(null);
  };

  // Step 3: Gate 2 Approved -> Save tasks to Firestore
  const handleApproveGate2Save = async () => {
    if (!generatedPlan) return;
    setIsSavingToFirestore(true);
    try {
      const tasks = await saveApprovedTasksToFirestore(generatedPlan);
      setSavedTasks(tasks);
    } catch (err) {
      console.error('Failed to save tasks to Firestore:', err);
    } finally {
      setIsSavingToFirestore(false);
    }
  };

  // Reject Gate 2 -> Do not save to Firestore
  const handleRejectGate2Save = () => {
    setSaveRejected(true);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-[#0B0B0B] text-zinc-900 dark:text-white overflow-y-auto p-4 sm:p-8 transition-colors duration-300">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        {/* Module Header */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 space-y-2 shadow-sm">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-[#FF2DA8]" />
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white font-display">
              Guarded 7-Day Cloud Study Planner
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Harness cloud intelligence strictly governed by two human approval gates: (1) inspect and approve sanitized payload before transmission, and (2) approve or reject saving tasks to Firestore.
          </p>
        </div>

        {/* Offline Pending Cloud Requests Queue */}
        {pendingRequests.length > 0 && (
          <div className="p-6 rounded-2xl bg-white dark:bg-[#141416] border border-amber-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WifiOff className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-zinc-900 dark:text-white font-display">
                  Offline Pending Cloud Requests ({pendingRequests.length})
                </h2>
              </div>
              <span className="text-[11px] font-mono uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20">
                Manual Sync Required
              </span>
            </div>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              These requests were queued locally while offline. For your privacy, AIVARION will <strong className="text-zinc-800 dark:text-zinc-200">never automatically transmit</strong> pending requests when connectivity returns. Each retry requires explicit preview inspection and dual human approval.
            </p>
            <div className="space-y-3 pt-2">
              {pendingRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-semibold text-zinc-900 dark:text-white">
                      {req.sanitizedPayload.topic}
                    </div>
                    <div className="text-xs text-zinc-500 flex items-center gap-2 font-mono">
                      <span>{new Date(req.createdAt).toLocaleTimeString()}</span>
                      <span>•</span>
                      <span className="capitalize">{req.sanitizedPayload.experienceLevel} level</span>
                      <span>•</span>
                      <span className="text-[#FF2DA8]">{req.action}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRetryPending(req)}
                      disabled={isGenerating}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#FF2DA8] hover:bg-[#E02094] text-white text-xs font-semibold transition-all shadow-md shadow-[#FF2DA8]/20"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Review & Sync</span>
                    </button>
                    <button
                      onClick={() => handleDiscardPending(req.id)}
                      disabled={isGenerating}
                      className="p-2 rounded-full border border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:text-red-500 text-xs transition-colors"
                      title="Discard queued request"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Input Configuration Form */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#141416] border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-6">
          <form onSubmit={handleInitiatePlanRequest} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Study Topic / Target Focus
              </label>
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="e.g. Python AsyncIO & Networking, Data Engineering Fundamentals..."
                required
                className="w-full bg-zinc-50 dark:bg-[#18181B] text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 rounded-xl px-4 py-3 border border-zinc-200 dark:border-zinc-700/80 focus:outline-none focus:ring-2 focus:ring-[#FF2DA8]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Target Proficiency
                </label>
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                  className="w-full bg-[#18181B] text-sm text-white rounded-xl px-4 py-3 border border-zinc-700/80 focus:outline-none focus:ring-2 focus:ring-[#FF2DA8]"
                >
                  <option value="beginner">Beginner (Foundations)</option>
                  <option value="intermediate">Intermediate (Applied Concepts)</option>
                  <option value="advanced">Advanced (Architectural Mastery)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                  Private Entities to Redact (Optional)
                </label>
                <input
                  type="text"
                  value={privateNamesInput}
                  onChange={(e) => setPrivateNamesInput(e.target.value)}
                  placeholder="e.g. CompanyName, ProjectX, Alice"
                  className="w-full bg-[#18181B] text-sm text-white placeholder-zinc-500 rounded-xl px-4 py-3 border border-zinc-700/80 focus:outline-none focus:ring-2 focus:ring-[#FF2DA8]"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#FF2DA8] hover:bg-[#E02094] text-white text-sm font-semibold transition-all shadow-lg shadow-[#FF2DA8]/25 focus:outline-none focus:ring-2 focus:ring-[#FF2DA8]"
              >
                <Eye className="w-4 h-4" />
                <span>Prepare Sanitized Payload & Preview</span>
              </button>
            </div>
          </form>
        </div>

        {/* Loading Spinner during Generation */}
        {isGenerating && (
          <div className="p-12 rounded-2xl bg-[#141416] border border-zinc-800 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF2DA8]" />
            <div className="text-sm font-bold text-white">Executing Approved Cloud Inference...</div>
            <div className="text-xs text-zinc-500 font-mono">
              Enforcing Zod schema validation on return stream
            </div>
          </div>
        )}

        {/* Error Notification */}
        {generationError && (
          <div className="p-5 rounded-2xl bg-red-950/40 border border-red-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-bold text-red-200">Study Plan Notice</div>
              <p className="text-xs text-red-300/90 leading-relaxed">{generationError}</p>
            </div>
          </div>
        )}

        {/* Generated 7-Day Plan Display & Gate 2 Approval */}
        {generatedPlan && !isGenerating && (
          <div className="p-6 sm:p-8 rounded-2xl bg-[#141416] border border-zinc-800 shadow-2xl space-y-8 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-zinc-800 gap-4">
              <div>
                <span className="text-[11px] font-mono uppercase px-2.5 py-1 rounded bg-[#D4FF3F]/15 text-[#D4FF3F] border border-[#D4FF3F]/30 font-semibold">
                  ZOD SCHEMA VALIDATED
                </span>
                <h2 className="text-2xl font-bold text-white font-display mt-2">
                  {generatedPlan.topic}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
                  {generatedPlan.overview}
                </p>
              </div>

              {/* Approval Gate 2 Buttons */}
              {!savedTasks && !saveRejected && (
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={handleRejectGate2Save}
                    className="px-4 py-2 rounded-full border border-zinc-700 text-zinc-400 hover:text-white text-xs font-semibold transition-colors"
                  >
                    Reject Saving
                  </button>
                  <button
                    onClick={handleApproveGate2Save}
                    disabled={isSavingToFirestore}
                    className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-[#FF2DA8] hover:bg-[#E02094] text-white text-xs font-semibold shadow-md shadow-[#FF2DA8]/25 transition-all"
                  >
                    <Database className="w-3.5 h-3.5" />
                    <span>{isSavingToFirestore ? 'Saving...' : 'Approve & Save to Firestore'}</span>
                  </button>
                </div>
              )}

              {savedTasks && (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-700 text-emerald-300 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Approved & Saved to Firestore ({savedTasks.length} tasks)</span>
                </div>
              )}

              {saveRejected && (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-semibold">
                  <XCircle className="w-4 h-4 text-zinc-500" />
                  <span>Firestore persistence rejected by user</span>
                </div>
              )}
            </div>

            {/* 7 Days Schedule Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {generatedPlan.days.map((day) => (
                <div
                  key={day.day}
                  className="p-5 rounded-xl bg-zinc-900/60 border border-zinc-800/90 space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-[#FF2DA8]">DAY 0{day.day}</span>
                      <span className="text-zinc-500 flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3" />
                        <span>{day.estimatedHours} hrs</span>
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-white">{day.title}</h3>
                    <div className="text-xs text-zinc-400 italic">Focus: {day.focus}</div>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/60 space-y-1.5">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold">
                      Action Items
                    </div>
                    <ul className="space-y-1 text-xs text-zinc-300">
                      {day.tasks.map((task, tidx) => (
                        <li key={tidx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F] mt-1.5 shrink-0" />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Approval Gate 1: Sanitized Payload Preview Modal */}
      {preparedRequest && (
        <PayloadPreviewModal
          isOpen={showPreviewModal}
          payloadObject={preparedRequest.payloadToTransmit}
          sanitizationResult={preparedRequest.sanitizationResult}
          onApprove={handleApproveGate1}
          onCancel={handleCancelGate1}
        />
      )}
    </div>
  );
};

export default PlanView;
