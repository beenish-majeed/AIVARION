import { AIMode, SanitizationResult } from '../types';
import {
  executeOnDeviceInference,
  executeHybridInference,
  executeCloudInference,
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

  // 1. Private Local Mode (InferenceMode.ONLY_ON_DEVICE - strictly zero cloud transmission)
  if (mode === 'private_local') {
    return await executeOnDeviceInference(prompt);
  }

  // 2. Smart Hybrid Mode (InferenceMode.PREFER_ON_DEVICE - on-device first, cloud fallback only with approval)
  if (mode === 'hybrid_auto') {
    try {
      // Step A: Attempt local on-device inference without cloud permission
      const localResult = await executeHybridInference(prompt, false);
      return localResult;
    } catch (localErr) {
      console.warn('Local inference unavailable in Smart Hybrid; engaging privacy approval gate:', localErr);

      // Step B: Prepare deterministic sanitized payload
      const sanitizationResult = sanitizeText(prompt, sanitizerOptions);

      // Step C & D: Block request and invoke human approval gate
      onRequireCloudApproval({
        sanitizedPrompt: sanitizationResult.sanitizedText,
        sanitizationResult,
        executeAfterApproval: async () => {
          // Step E: Only executed after explicit user approval with PREFER_ON_DEVICE / cloud fallback allowed
          return await executeHybridInference(sanitizationResult.sanitizedText, true);
        },
      });

      return null;
    }
  }

  // 3. Cloud Mode (InferenceMode.ONLY_IN_CLOUD - Guarded with Explicit Approval)
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
