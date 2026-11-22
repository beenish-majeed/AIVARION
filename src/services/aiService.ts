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
} from '../types';

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
    // Check window.ai / self.ai / chrome.ai
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
    engineName: 'None Detected',
    details: 'On-device Gemini Nano requires Chrome Desktop 139+ with Prompt API enabled.',
  };
}

// Single-turn context formatter: formats recent conversation turns into the prompt
export function formatConversationContext(
  messages: ChatMessage[],
  currentPrompt: string,
  maxTurns = 4
): string {
  if (!messages || messages.length === 0) {
    return currentPrompt;
  }

  // Take the most recent turns excluding welcome message if too long
  const recent = messages.slice(-maxTurns);
  const formattedHistory = recent
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.trim()}`)
    .join('\n\n');

  return `Here is the recent conversation context for continuity:\n\n${formattedHistory}\n\nUser: ${currentPrompt.trim()}\n\nAssistant:`;
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

  // If Firebase AI Logic is available
  if (aiService) {
    try {
      const model = getGenerativeModel(aiService, {
        model: 'gemini-1.5-flash',
        mode: InferenceMode.ONLY_ON_DEVICE,
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
