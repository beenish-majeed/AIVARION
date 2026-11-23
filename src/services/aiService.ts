import {
  aiService,
  isFirebaseConfigured,
} from '../firebase/config';
import {
  getGenerativeModel,
  InferenceMode,
  InferenceSource,
} from 'firebase/ai';
import {
  AIMode,
  DeviceModelStatus,
  InferenceSourceType,
  ChatMessage,
  ContextTurn,
  CloudErrorInfo,
} from '../types';

export type { ContextTurn, CloudErrorInfo };

export interface AIResponseResult {
  text: string;
  inferenceSource: InferenceSourceType;
  modeUsed: AIMode;
}

export interface DeviceAvailabilityInfo {
  status: DeviceModelStatus;
  downloadProgress?: number;
  engineName: string;
  details: string;
}

// Check Chrome Prompt API and Firebase AI Logic device model availability
export async function checkDeviceModelAvailability(): Promise<DeviceAvailabilityInfo> {
  // Check Chrome Prompt API (Gemini Nano) directly if available in browser
  if (typeof window !== 'undefined') {
    // @ts-expect-error - Chrome Built-in AI Prompt API
    const aiApi = window.ai || (window as unknown as { ChromeAI?: unknown }).ChromeAI;

    if (aiApi?.languageModel) {
      try {
        const capabilities = await aiApi.languageModel.capabilities();
        if (capabilities?.available === 'readily') {
          return {
            status: 'ready',
            engineName: 'Chrome Gemini Nano (On-Device)',
            details: 'Model is downloaded and ready for zero-latency local inference.',
          };
        } else if (capabilities?.available === 'after-download') {
          return {
            status: 'downloading',
            engineName: 'Chrome Gemini Nano (On-Device)',
            details: 'Device model download in progress via browser components.',
          };
        }
      } catch (err) {
        console.warn('Error reading Chrome AI languageModel capabilities:', err);
      }
    }
  }

  // Check Firebase AI Logic initializeDeviceModel
  if (aiService && typeof (aiService as unknown as { initializeDeviceModel?: unknown }).initializeDeviceModel === 'function') {
    try {
      // @ts-expect-error - Firebase AI Logic device init
      await aiService.initializeDeviceModel();
      return {
        status: 'ready',
        engineName: 'Firebase AI Logic (On-Device)',
        details: 'On-device model initialized and ready.',
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      if (errMsg.includes('download')) {
        return {
          status: 'downloading',
          engineName: 'Firebase AI Logic',
          details: 'Model downloading onto client device.',
        };
      }
    }
  }

  // If no on-device model found
  return {
    status: 'unavailable',
    engineName: 'Chrome Prompt API (Gemini Nano)',
    details: 'On-device Gemini Nano requires Chrome Desktop 139+ with Prompt API enabled (chrome://flags/#prompt-api-for-gemini-nano).',
  };
}

// Extract recent turns for explicit user review and approval
export function extractRecentTurns(
  messages: ChatMessage[],
  maxTurns = 4
): ContextTurn[] {
  if (!messages || messages.length === 0) return [];
  return messages.slice(-maxTurns).map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content.trim(),
  }));
}

// Assemble prompt from approved context turns and user input
export function assembleContextPrompt(
  approvedTurns: ContextTurn[],
  currentPrompt: string
): string {
  if (!approvedTurns || approvedTurns.length === 0) {
    return currentPrompt.trim();
  }

  const formattedHistory = approvedTurns
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.trim()}`)
    .join('\n\n');

  return `Here is the recent conversation context for continuity:\n\n${formattedHistory}\n\nUser: ${currentPrompt.trim()}\n\nAssistant:`;
}

// Single-turn context formatter: formats recent conversation turns into the prompt
export function formatConversationContext(
  messages: ChatMessage[],
  currentPrompt: string,
  maxTurns = 4
): string {
  const turns = extractRecentTurns(messages, maxTurns);
  return assembleContextPrompt(turns, currentPrompt);
}

// Classify and diagnose any cloud error with actionable remediation steps
export function parseCloudError(err: unknown): CloudErrorInfo {
  const rawError = err instanceof Error ? err.message : String(err);
  const lower = rawError.toLowerCase();

  if (
    !isFirebaseConfigured() ||
    lower.includes('requires firebase api configuration') ||
    lower.includes('mock_dev_key') ||
    lower.includes('mock_dev_api_key')
  ) {
    return {
      title: 'Firebase Project Credentials Missing',
      rawError,
      fixGuide:
        'Cloud chat requires active Firebase project configuration. In .env.local, set your real Firebase credentials: VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, and VITE_FIREBASE_APP_ID. Restart the dev server after updating .env.local.',
      errorCategory: 'no_config',
    };
  }

  if (
    lower.includes('appcheck') ||
    lower.includes('app-check') ||
    lower.includes('recaptcha') ||
    lower.includes('app check')
  ) {
    return {
      title: 'Firebase App Check Verification Failed',
      rawError,
      fixGuide:
        'Firebase App Check rejected the request. Ensure you have registered your debug token in the Firebase Console (Firebase Console -> App Check -> Apps -> Manage debug tokens), or configured VITE_FIREBASE_APP_CHECK_DEBUG_TOKEN in .env.local.',
      errorCategory: 'app_check',
    };
  }

  if (
    lower.includes('network') ||
    lower.includes('failed to fetch') ||
    lower.includes('offline') ||
    (typeof navigator !== 'undefined' && !navigator.onLine)
  ) {
    return {
      title: 'Network / Offline Connection Failure',
      rawError,
      fixGuide:
        'Unable to reach cloud servers. Check your internet connection. In offline environments, switch to Private Local mode for zero-network on-device computation.',
      errorCategory: 'network',
    };
  }

  if (
    lower.includes('api_key_invalid') ||
    lower.includes('api key not valid') ||
    lower.includes('permission_denied') ||
    lower.includes('unauthenticated') ||
    lower.includes('401') ||
    lower.includes('403')
  ) {
    return {
      title: 'Firebase Authentication or API Permission Denied',
      rawError,
      fixGuide:
        'Google Cloud rejected the API request. Verify that your VITE_FIREBASE_API_KEY is active and that the Gemini API / Firebase AI Logic is enabled for your Google Cloud project in the Google Cloud Console.',
      errorCategory: 'auth_permission',
    };
  }

  if (
    lower.includes('resource_exhausted') ||
    lower.includes('quota') ||
    lower.includes('429')
  ) {
    return {
      title: 'API Quota Exceeded',
      rawError,
      fixGuide:
        'The cloud AI request hit Google Cloud / Gemini rate limits or quota. Wait a few moments or upgrade your project quota in Google Cloud Console.',
      errorCategory: 'quota',
    };
  }

  return {
    title: 'Cloud Inference Error',
    rawError,
    fixGuide:
      'The cloud model request could not be completed. Check browser console logs and verify Firebase AI Logic service status in Firebase Console.',
    errorCategory: 'unknown',
  };
}

// On-device direct inference executor
export async function executeOnDeviceInference(
  formattedPrompt: string
): Promise<AIResponseResult> {
  // Check Chrome Prompt API first
  if (typeof window !== 'undefined') {
    // @ts-expect-error - Chrome Built-in AI Prompt API
    const aiApi = window.ai;
    if (aiApi?.languageModel) {
      const session = await aiApi.languageModel.create({
        systemPrompt:
          'You are AIVARION, a helpful, private, local AI assistant. Keep responses clear, helpful, and concise.',
      });
      const responseText = await session.prompt(formattedPrompt);
      return {
        text: responseText,
        inferenceSource: 'on_device',
        modeUsed: 'private_local',
      };
    }
  }

  // Check if device model is ready via availability check
  const availability = await checkDeviceModelAvailability();
  if (availability.status === 'unavailable') {
    throw new Error(
      'On-device AI engine is currently unavailable on this device. Private Local mode will never route data to the cloud.'
    );
  }

  // If Firebase AI Logic is available and device model is ready
  if (aiService) {
    try {
      const model = getGenerativeModel(aiService, {
        mode: InferenceMode.ONLY_ON_DEVICE,
        inCloudParams: { model: 'gemini-1.5-flash' },
      });

      const result = await model.generateContent(formattedPrompt);
      const text = result.response.text();

      // Read exact inference source from response metadata
      const rawSource = result.response.inferenceSource;
      const inferenceSource: InferenceSourceType =
        rawSource === InferenceSource.ON_DEVICE ? 'on_device' : 'in_cloud';

      return {
        text,
        inferenceSource,
        modeUsed: 'private_local',
      };
    } catch (err: unknown) {
      throw new Error(
        `On-device inference failed in Private Local mode: ${
          err instanceof Error ? err.message : String(err)
        }. No cloud fallback is permitted in Private Local mode.`
      );
    }
  }

  throw new Error(
    'On-device AI engine is currently unavailable on this device. Private Local mode will never route data to the cloud.'
  );
}

// Cloud inference executor (used ONLY after explicit user approval)
export async function executeCloudInference(
  formattedPrompt: string
): Promise<AIResponseResult> {
  if (!isFirebaseConfigured() || !aiService) {
    throw new Error(
      'Cloud inference requires Firebase API configuration in .env.local. Please configure your Firebase project credentials.'
    );
  }

  try {
    const model = getGenerativeModel(aiService, {
      model: 'gemini-1.5-flash',
      mode: InferenceMode.ONLY_IN_CLOUD,
    });

    const result = await model.generateContent(formattedPrompt);
    const text = result.response.text();

    const rawSource = result.response.inferenceSource;
    const inferenceSource: InferenceSourceType =
      rawSource === InferenceSource.ON_DEVICE ? 'on_device' : 'in_cloud';

    return {
      text,
      inferenceSource,
      modeUsed: 'cloud',
    };
  } catch (err: unknown) {
    throw new Error(
      `Cloud inference error: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}
