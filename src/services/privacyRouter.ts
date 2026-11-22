import { AIMode, SanitizationResult } from '../types';
import {
  executeOnDeviceInference,
  executeCloudInference,
  checkDeviceModelAvailability,
  AIResponseResult,
} from './aiService';
import { sanitizeText, SanitizerOptions } from './sanitizer';

export interface RouteRequestParams {
  mode: AIMode;
  prompt: string;
  sanitizerOptions?: SanitizerOptions;
  onRequireCloudApproval: (preparedPayload: {
    sanitizedPrompt: string;
    sanitizationResult: SanitizationResult;
    executeAfterApproval: () => Promise<AIResponseResult>;
  }) => void;
}

/**
 * The AIVARION Privacy Router enforces the three official AI modes
 * and strictly prohibits silent cloud fallbacks.
 */
export async function routeAIRequest(
  params: RouteRequestParams
): Promise<AIResponseResult | null> {
  const { mode, prompt, sanitizerOptions, onRequireCloudApproval } = params;

  // 1. Private Local Mode
  if (mode === 'private_local') {
    // Strictly execute on-device. Throws immediately on failure with NO cloud fallback.
    return await executeOnDeviceInference(prompt);
  }

  // 2. Hybrid Auto Mode (Local-First with Explicit Approval Fallback)
  if (mode === 'hybrid_auto') {
    try {
      // Step A: Attempt local on-device inference
      const localResult = await executeOnDeviceInference(prompt);
      return localResult;
    } catch (localErr) {
      console.warn('Local inference unavailable in Hybrid Auto; engaging privacy gate:', localErr);

      // Step B: Prepare deterministic sanitized payload
      const sanitizationResult = sanitizeText(prompt, sanitizerOptions);

      // Step C & D: Block request and invoke approval gate
      onRequireCloudApproval({
        sanitizedPrompt: sanitizationResult.sanitizedText,
        sanitizationResult,
        executeAfterApproval: async () => {
          // Step E: Only executed after explicit user approval
          return await executeCloudInference(sanitizationResult.sanitizedText);
        },
      });

      return null;
    }
  }

  // 3. Cloud Mode (Guarded with Explicit Approval)
  if (mode === 'cloud') {
    const sanitizationResult = sanitizeText(prompt, sanitizerOptions);

    onRequireCloudApproval({
      sanitizedPrompt: sanitizationResult.sanitizedText,
      sanitizationResult,
      executeAfterApproval: async () => {
        return await executeCloudInference(sanitizationResult.sanitizedText);
      },
    });

    return null;
  }

  throw new Error(`Unrecognized AI mode: ${mode}`);
}
