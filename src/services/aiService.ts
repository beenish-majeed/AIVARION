import {
  aiService,
  isFirebaseConfigured,
  ensureAnonymousAuth,
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

// Detect Chrome Desktop 139 or newer
export function isChromeDesktop139OrNewer(): {
  isChrome: boolean;
  isVersion139Plus: boolean;
  version?: number;
} {
  if (typeof navigator === 'undefined') {
    return { isChrome: false, isVersion139Plus: false };
  }
  const ua = navigator.userAgent;
  const chromeMatch = /Chrome\/([0-9]+)/.exec(ua);
  if (!chromeMatch) {
    return { isChrome: false, isVersion139Plus: false };
  }
  const version = parseInt(chromeMatch[1], 10);
  return {
    isChrome: true,
    isVersion139Plus: version >= 139,
    version,
  };
}

// Check Chrome Prompt API and Firebase AI Logic device model availability
export async function checkDeviceModelAvailability(): Promise<DeviceAvailabilityInfo> {
  // 1. Check Chrome Prompt API (Gemini Nano) directly if available in browser
  if (typeof window !== 'undefined') {
    // @ts-expect-error - Chrome Built-in AI Prompt API
    const aiApi = window.ai || (window as unknown as { ChromeAI?: unknown }).ChromeAI;

    if (aiApi?.languageModel) {
      try {
        if (typeof aiApi.languageModel.capabilities === 'function') {
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
        }
        if (typeof aiApi.languageModel.availability === 'function') {
          const avail = await aiApi.languageModel.availability();
          if (avail === 'readily' || avail === 'available') {
            return {
              status: 'ready',
              engineName: 'Chrome Gemini Nano (On-Device)',
              details: 'Model is downloaded and ready for zero-latency local inference.',
            };
          } else if (
            avail === 'after-download' ||
            avail === 'downloadable' ||
            avail === 'downloading'
          ) {
            return {
              status: 'downloading',
              engineName: 'Chrome Gemini Nano (On-Device)',
              details: 'Device model download required or in progress.',
            };
          }
        }
      } catch (err) {
        console.warn('Error reading Chrome AI languageModel capabilities:', err);
      }
    }
  }

  // 2. Check if running in Chrome Desktop 139+
  const chromeCheck = isChromeDesktop139OrNewer();
  let details =
    'On-device Gemini Nano requires Chrome Desktop 139+ with Prompt API enabled (chrome://flags/#prompt-api-for-gemini-nano).';
  if (!chromeCheck.isChrome) {
    details =
      'Unsupported browser for on-device inference. Please use Google Chrome Desktop version 139 or newer.';
  } else if (!chromeCheck.isVersion139Plus) {
    details = `Chrome version ${chromeCheck.version ?? 'detected'} is older than version 139. Please update Google Chrome Desktop.`;
  }

  return {
    status: 'unavailable',
    engineName: 'Chrome Prompt API (Gemini Nano)',
    details,
  };
}

// Explicit on-device model initialization with progress monitoring
export async function initializeOnDeviceModel(
  onProgress?: (progressValue: number) => void
): Promise<void> {
  // 1. Direct Chrome Prompt API download monitor (Chrome 139+)
  if (typeof window !== 'undefined') {
    // @ts-expect-error - Chrome Prompt API
    const aiApi = window.ai;
    if (aiApi?.languageModel?.create) {
      try {
        const session = await aiApi.languageModel.create({
          monitor(m: EventTarget) {
            m.addEventListener('downloadprogress', (e: Event) => {
              const pe = e as ProgressEvent;
              if (pe.total && onProgress) {
                onProgress(Math.round((pe.loaded / pe.total) * 100));
              }
            });
          },
        });
        session.destroy?.();
        return;
      } catch (chromeErr) {
        console.warn('Chrome Prompt API initialization note:', chromeErr);
        throw chromeErr;
      }
    }
  }

  // 2. Firebase AI Logic model initialization
  if (aiService) {
    try {
      const model = getGenerativeModel(aiService, {
        mode: InferenceMode.ONLY_ON_DEVICE,
      });
      if (typeof model.initializeDeviceModel === 'function') {
        await model.initializeDeviceModel((val: number) => {
          const percent = val <= 1 ? Math.round(val * 100) : Math.round(val);
          onProgress?.(percent);
        });
        return;
      }
    } catch (err) {
      console.warn('Firebase AI Logic device model initialization note:', err);
      throw err;
    }
  }
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

// Assemble prompt from approved context turns and user input (single-turn client composition)
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
    lower.includes('requires firebase api configuration') ||
    lower.includes('mock_dev_key') ||
    lower.includes('mock_dev_api_key') ||
    lower.includes('credentials missing') ||
    lower.includes('configure your firebase project credentials') ||
    lower.includes('project credentials in .env.local')
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

  if (!isFirebaseConfigured()) {
    return {
      title: 'Firebase Project Credentials Missing',
      rawError,
      fixGuide:
        'Cloud chat requires active Firebase project configuration. In .env.local, set your real Firebase credentials: VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, and VITE_FIREBASE_APP_ID. Restart the dev server after updating .env.local.',
      errorCategory: 'no_config',
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

// On-device direct inference executor (ONLY_ON_DEVICE - strictly zero cloud transmission)
export async function executeOnDeviceInference(
  formattedPrompt: string,
  onProgress?: (progressValue: number) => void
): Promise<AIResponseResult> {
  const availability = await checkDeviceModelAvailability();
  if (availability.status === 'unavailable') {
    throw new Error(
      'On-device AI engine is currently unavailable on this device. Private Local mode will never route data to the cloud.'
    );
  }

  // 1. Check Chrome Prompt API (Gemini Nano) directly if available
  if (typeof window !== 'undefined') {
    // @ts-expect-error - Chrome Built-in AI Prompt API
    const aiApi = window.ai || (window as unknown as { ChromeAI?: unknown }).ChromeAI;
    if (aiApi?.languageModel) {
      try {
        const session = await aiApi.languageModel.create({
          systemPrompt:
            'You are AIVARION, a helpful, private, local AI assistant. Keep responses clear, helpful, and concise.',
          monitor(m: EventTarget) {
            m.addEventListener('downloadprogress', (e: Event) => {
              const pe = e as ProgressEvent;
              if (pe.total && onProgress) {
                onProgress(Math.round((pe.loaded / pe.total) * 100));
              }
            });
          },
        });
        const responseText = await session.prompt(formattedPrompt);
        session.destroy?.();
        return {
          text: responseText,
          inferenceSource: 'on_device',
          modeUsed: 'private_local',
        };
      } catch (chromeErr) {
        console.warn('Direct Chrome Prompt API attempt note:', chromeErr);
      }
    }
  }

  // 2. Firebase AI Logic on-device execution
  if (aiService) {
    try {
      const model = getGenerativeModel(aiService, {
        mode: InferenceMode.ONLY_ON_DEVICE,
      });

      // Call initializeDeviceModel after user interaction before generateContent
      if (typeof model.initializeDeviceModel === 'function') {
        await model.initializeDeviceModel((val: number) => {
          const percent = val <= 1 ? Math.round(val * 100) : Math.round(val);
          onProgress?.(percent);
        });
      }

      const result = await model.generateContent(formattedPrompt);
      const text = result.response.text();

      // Read exact inference source from response metadata
      const rawSource = result.response.inferenceSource;
      const inferenceSource: InferenceSourceType =
        rawSource === InferenceSource.IN_CLOUD ? 'in_cloud' : 'on_device';

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

// Smart Hybrid inference executor (PREFER_ON_DEVICE - cloud fallback only with explicit user permission)
export async function executeHybridInference(
  formattedPrompt: string,
  allowCloudFallback: boolean,
  onProgress?: (progressValue: number) => void
): Promise<AIResponseResult> {
  // If cloud fallback is not allowed, must attempt local on-device inference first
  if (!allowCloudFallback) {
    const availability = await checkDeviceModelAvailability();
    if (availability.status === 'unavailable') {
      throw new Error(
        'On-device AI engine is currently unavailable on this device. Cloud fallback requires explicit user approval.'
      );
    }
    const localResult = await aiExecutionEngine.executeOnDeviceInference(
      formattedPrompt,
      onProgress
    );
    return {
      ...localResult,
      modeUsed: 'hybrid_auto',
    };
  }

  // User explicitly granted cloud fallback permission:
  // Check if local on-device model is ready first
  const availability = await checkDeviceModelAvailability();
  if (availability.status === 'ready') {
    try {
      const localResult = await aiExecutionEngine.executeOnDeviceInference(
        formattedPrompt,
        onProgress
      );
      return {
        ...localResult,
        modeUsed: 'hybrid_auto',
      };
    } catch (hybridErr) {
      console.warn('Local inference attempt note, falling back to cloud:', hybridErr);
    }
  }

  // Cloud fallback granted explicitly by user
  const cloudRes = await aiExecutionEngine.executeCloudInference(formattedPrompt);
  return {
    ...cloudRes,
    modeUsed: 'hybrid_auto',
  };
}

// Cloud inference executor (ONLY_IN_CLOUD - used ONLY after explicit user approval)
export async function executeCloudInference(
  formattedPrompt: string
): Promise<AIResponseResult> {
  if (!isFirebaseConfigured() || !aiService) {
    throw new Error(
      'Cloud inference requires Firebase API configuration in .env.local. Please configure your Firebase project credentials.'
    );
  }

  // Ensure anonymous auth session is active
  await ensureAnonymousAuth();

  const candidateModels = [
    'gemini-3.5-flash-lite',
    'gemini-3.8-flash',
  ];

  let lastError: unknown;
  for (const modelName of candidateModels) {
    try {
      const model = getGenerativeModel(aiService, {
        mode: InferenceMode.ONLY_IN_CLOUD,
        inCloudParams: { model: modelName },
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
      lastError = err;
      const errMsg = err instanceof Error ? err.message : String(err);
      if (
        errMsg.includes('404') ||
        errMsg.includes('retired') ||
        errMsg.includes('no longer available') ||
        errMsg.includes('503') ||
        errMsg.includes('overloaded')
      ) {
        console.warn(`Model ${modelName} returned temporary error; trying next candidate:`, errMsg);
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('All candidate cloud models failed to respond.');
}

export const aiExecutionEngine = {
  executeCloudInference,
  executeOnDeviceInference,
};
