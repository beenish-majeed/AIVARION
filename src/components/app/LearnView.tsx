import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Trophy,
  History,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { QuizQuestion, QuizAttempt } from '../../types';
import {
  generatePythonQuizQuestion,
  recordQuizAttempt,
  getQuizStats,
} from '../../services/quizService';

export const LearnView: React.FC = () => {
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [currentAttempt, setCurrentAttempt] = useState<QuizAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalAttempts: number;
    correctCount: number;
    accuracyRate: number;
    history: QuizAttempt[];
  }>({
    totalAttempts: 0,
    correctCount: 0,
    accuracyRate: 0,
    history: [],
  });

  const loadNewQuestion = async () => {
    setIsLoading(true);
    setLoadError(null);
    setSelectedOption(null);
    setIsAnswered(false);
    setCurrentAttempt(null);

    try {
      const q = await generatePythonQuizQuestion();
      setCurrentQuestion(q);
    } catch (err) {
      setLoadError('Failed to generate Python quiz question. Please click retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStats = async () => {
    const s = await getQuizStats();
    setStats(s);
  };

  useEffect(() => {
    loadNewQuestion();
    refreshStats();
  }, []);

  const handleSubmitAnswer = async () => {
    if (selectedOption === null || !currentQuestion || isAnswered) return;

    // Grade deterministically with code
    const attempt = await recordQuizAttempt(currentQuestion, selectedOption);
    setCurrentAttempt(attempt);
    setIsAnswered(true);
    await refreshStats();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B0B0B] overflow-y-auto p-4 sm:p-8">
      <div className="max-w-4xl mx-auto w-full space-y-8">
        {/* Header with Stats Dashboard */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-zinc-900/60 border border-zinc-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="w-5 h-5 text-[#D4FF3F]" />
              <h1 className="text-xl font-bold text-white font-display">Python Basics Skill Coach</h1>
            </div>
            <p className="text-xs text-zinc-400">
              Generated locally on-device • Deterministic code evaluation • 100% private
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-xs text-zinc-400">Completed</div>
              <div className="text-lg font-bold text-white font-mono">{stats.totalAttempts}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-zinc-400">Correct</div>
              <div className="text-lg font-bold text-[#D4FF3F] font-mono">{stats.correctCount}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-zinc-400">Accuracy</div>
              <div className="text-lg font-bold text-[#FF2DA8] font-mono">{stats.accuracyRate}%</div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-16 rounded-2xl bg-[#141416] border border-zinc-800 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#FF2DA8]" />
            <div className="text-sm font-medium text-white">Synthesizing Python Question on Device...</div>
            <div className="text-xs text-zinc-500 font-mono">Zod Schema Validation Pipeline Active</div>
          </div>
        )}

        {/* Error State with Retry Button */}
        {loadError && (
          <div className="p-6 rounded-2xl bg-red-950/30 border border-red-800 text-center space-y-4">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
            <p className="text-sm text-red-200">{loadError}</p>
            <button
              onClick={loadNewQuestion}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-red-800 hover:bg-red-700 text-white text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry Generation</span>
            </button>
          </div>
        )}

        {/* Active Quiz Card */}
        {!isLoading && !loadError && currentQuestion && (
          <div className="p-6 sm:p-8 rounded-2xl bg-[#141416] border border-zinc-800 shadow-2xl space-y-6">
            {/* Question Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
                <span>QUESTION {stats.totalAttempts + 1}</span>
                <span className="text-[#D4FF3F] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF3F]" />
                  <span>ON_DEVICE_VALIDATED</span>
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
                {currentQuestion.question}
              </h2>
            </div>

            {/* Multiple Choice Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                let optionStyle =
                  'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700 text-zinc-200';

                if (isAnswered) {
                  if (idx === currentQuestion.correctIndex) {
                    optionStyle = 'bg-[#D4FF3F]/15 border-[#D4FF3F] text-[#D4FF3F]';
                  } else if (isSelected && !currentAttempt?.isCorrect) {
                    optionStyle = 'bg-red-950/40 border-red-500 text-red-200';
                  } else {
                    optionStyle = 'bg-zinc-950/50 border-zinc-800 text-zinc-500 opacity-60';
                  }
                } else if (isSelected) {
                  optionStyle = 'bg-[#FF2DA8]/20 border-[#FF2DA8] text-white shadow-md shadow-[#FF2DA8]/10';
                }

                return (
                  <button
                    key={idx}
                    disabled={isAnswered}
                    onClick={() => setSelectedOption(idx)}
                    className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all duration-200 flex items-center justify-between focus:outline-none focus:ring-1 focus:ring-[#FF2DA8] ${optionStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-zinc-800 text-xs font-mono flex items-center justify-center shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                    </div>

                    {isAnswered && idx === currentQuestion.correctIndex && (
                      <CheckCircle2 className="w-5 h-5 text-[#D4FF3F] shrink-0" />
                    )}
                    {isAnswered && isSelected && !currentAttempt?.isCorrect && (
                      <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Submit or Next Action */}
            <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              {!isAnswered ? (
                <button
                  disabled={selectedOption === null}
                  onClick={handleSubmitAnswer}
                  className="w-full sm:w-auto px-8 py-3 rounded-full bg-[#FF2DA8] hover:bg-[#E02094] disabled:opacity-40 text-white font-semibold text-sm transition-all shadow-lg shadow-[#FF2DA8]/20"
                >
                  Submit Answer (Deterministic Code Evaluation)
                </button>
              ) : (
                <button
                  onClick={loadNewQuestion}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-[#FF2DA8] hover:bg-[#E02094] text-white font-semibold text-sm transition-all shadow-lg shadow-[#FF2DA8]/20"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Explanation Card */}
            {isAnswered && currentAttempt && (
              <div
                className={`p-5 rounded-xl border text-sm space-y-2 ${
                  currentAttempt.isCorrect
                    ? 'bg-[#D4FF3F]/10 border-[#D4FF3F]/40 text-white'
                    : 'bg-red-950/20 border-red-800/40 text-white'
                }`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  {currentAttempt.isCorrect ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#D4FF3F]" />
                      <span className="text-[#D4FF3F]">Correct! Deterministically Evaluated</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400">Incorrect. Verified Solution:</span>
                    </>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  {currentQuestion.explanation}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LearnView;
