import React from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Eye,
  AlertTriangle,
  Lock,
  CloudLightning,
} from 'lucide-react';
import { SanitizationResult } from '../../types';

interface PayloadPreviewModalProps {
  isOpen: boolean;
  title?: string;
  payloadObject: object;
  sanitizationResult: SanitizationResult;
  targetEndpoint?: string;
  onApprove: () => void;
  onCancel: () => void;
}

export const PayloadPreviewModal: React.FC<PayloadPreviewModalProps> = ({
  isOpen,
  title = 'Privacy Gate: Review Payload Before Cloud Transmission',
  payloadObject,
  sanitizationResult,
  targetEndpoint = 'https://generativelanguage.googleapis.com (Firebase AI Logic)',
  onApprove,
  onCancel,
}) => {
  if (!isOpen) return null;

  const payloadString = JSON.stringify(payloadObject, null, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#121214] border border-zinc-700/80 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Top Header */}
        <div className="p-5 border-b border-zinc-800 bg-zinc-900/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FF2DA8]/15 border border-[#FF2DA8]/30 flex items-center justify-center text-[#FF2DA8]">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-display">
                {title}
              </h3>
              <div className="text-[11px] text-zinc-400 font-mono">
                TARGET: {targetEndpoint}
              </div>
            </div>
          </div>

          <button
            onClick={onCancel}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors"
            title="Cancel"
            aria-label="Cancel"
          >
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Sanitization Report Banner */}
          <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D4FF3F]" />
                <span>Deterministic PII Sanitization Completed</span>
              </span>
              <span className="font-mono text-zinc-400">
                {sanitizationResult.removedItems.length} items redacted
              </span>
            </div>

            {sanitizationResult.removedItems.length > 0 && (
              <div className="text-xs text-zinc-400 space-y-1 pt-1">
                {sanitizationResult.removedItems.map((item, i) => (
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

          {/* Warning Message if any */}
          {sanitizationResult.warningMessage && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{sanitizationResult.warningMessage}</p>
            </div>
          )}

          {/* Exact Payload Inspection Box */}
          <div className="space-y-1.5">
            <div className="text-xs font-mono text-zinc-400 flex items-center justify-between">
              <span>EXACT PAYLOAD INSPECTION (JSON):</span>
              <span className="text-[10px] text-zinc-500">READ-ONLY AUDIT</span>
            </div>
            <div className="rounded-xl overflow-hidden bg-[#0A0A0B] border border-zinc-800 font-mono text-xs">
              <pre className="p-4 overflow-x-auto text-zinc-200 leading-relaxed selection:bg-[#FF2DA8] selection:text-white max-h-60">
                <code>{payloadString}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-5 border-t border-zinc-800 bg-[#0F0F10] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-zinc-400 font-mono">
            Zero background requests • Action blocked until approval
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onCancel}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-full border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white text-xs font-semibold transition-all focus:outline-none focus:ring-1 focus:ring-zinc-500"
            >
              Cancel (Abort Request)
            </button>

            <button
              onClick={onApprove}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-[#FF2DA8] hover:bg-[#E02094] text-white text-xs font-semibold transition-all shadow-lg shadow-[#FF2DA8]/25 focus:outline-none focus:ring-2 focus:ring-[#FF2DA8]"
            >
              <CloudLightning className="w-3.5 h-3.5" />
              <span>Approve & Transmit</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayloadPreviewModal;
