import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  executeOnDeviceInference,
  executeCloudInference,
  executeHybridInference,
  initializeOnDeviceModel,
  isChromeDesktop139OrNewer,
  checkDeviceModelAvailability,
  formatConversationContext,
  parseCloudError,
} from '../services/aiService';
import * as aiServiceModule from '../services/aiService';

describe('Firebase AI Logic Hybrid Inference & Chrome Desktop 139+ Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-expect-error - reset window.ai
    delete (window as Record<string, unknown>).ai;
    // @ts-expect-error - reset window.ai
    window.ai = undefined;
  });

  describe('1. Chrome Desktop 139+ Detection & Compatibility', () => {
    it('accurately identifies Chrome Desktop version 139 or newer', () => {
      // Mock navigator.userAgent for Chrome 139
      const originalUa = navigator.userAgent;
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
        configurable: true,
      });

      const res139 = isChromeDesktop139OrNewer();
      expect(res139.isChrome).toBe(true);
      expect(res139.isVersion139Plus).toBe(true);
      expect(res139.version).toBe(139);

      // Mock older Chrome 120
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        configurable: true,
      });

      const res120 = isChromeDesktop139OrNewer();
      expect(res120.isChrome).toBe(true);
      expect(res120.isVersion139Plus).toBe(false);

      // Restore
      Object.defineProperty(navigator, 'userAgent', {
        value: originalUa,
        configurable: true,
      });
    });

    it('gracefully reports unavailable with instructions when not running in Chrome 139+', async () => {
      const avail = await checkDeviceModelAvailability();
      expect(['ready', 'downloading', 'unavailable']).toContain(avail.status);
      expect(avail.engineName).toBeDefined();
      expect(avail.details).toBeDefined();
    });
  });

  describe('2. Single-Turn Text Generation Context Composition', () => {
    it('composes multi-turn history into single-turn text prompt without unsupported local multi-turn sessions', () => {
      const messages = [
        {
          id: '1',
          conversationId: 'c1',
          role: 'user' as const,
          content: 'What is WebAssembly?',
          createdAt: 1000,
          modeUsed: 'private_local' as const,
        },
        {
          id: '2',
          conversationId: 'c1',
          role: 'assistant' as const,
          content: 'WebAssembly is a binary instruction format for a stack-based virtual machine.',
          createdAt: 2000,
          inferenceSource: 'on_device' as const,
          modeUsed: 'private_local' as const,
        },
      ];

      const singleTurnPrompt = formatConversationContext(messages, 'What languages compile to it?');
      expect(singleTurnPrompt).toContain('What is WebAssembly?');
      expect(singleTurnPrompt).toContain('What languages compile to it?');
      expect(singleTurnPrompt).toContain('Assistant:');
    });
  });

  describe('3. Private Local Mode (InferenceMode.ONLY_ON_DEVICE)', () => {
    it('runs on-device with zero network and returns inferenceSource on_device', async () => {
      // Mock window.ai with Chrome Prompt API session
      const promptMock = vi.fn().mockResolvedValue('Local private answer: Python decorators wrap functions.');
      const destroyMock = vi.fn();

      // @ts-expect-error - Mock Chrome AI
      window.ai = {
        languageModel: {
          capabilities: vi.fn().mockResolvedValue({ available: 'readily' }),
          create: vi.fn().mockResolvedValue({
            prompt: promptMock,
            destroy: destroyMock,
          }),
        },
      };

      const result = await executeOnDeviceInference('Explain decorators');
      expect(result.text).toBe('Local private answer: Python decorators wrap functions.');
      expect(result.inferenceSource).toBe('on_device');
      expect(result.modeUsed).toBe('private_local');
      expect(promptMock).toHaveBeenCalledWith('Explain decorators');
      expect(destroyMock).toHaveBeenCalled();

      // Clean up window.ai
      // @ts-expect-error - Clean up
      delete window.ai;
    });

    it('works offline with internet disconnected after model download', async () => {
      const promptMock = vi.fn().mockResolvedValue('Offline local calculation result: 42');
      // @ts-expect-error - Mock Chrome AI
      window.ai = {
        languageModel: {
          capabilities: vi.fn().mockResolvedValue({ available: 'readily' }),
          create: vi.fn().mockResolvedValue({
            prompt: promptMock,
            destroy: vi.fn(),
          }),
        },
      };

      // Disconnect internet
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

      const result = await executeOnDeviceInference('Compute 6 * 7 offline');
      expect(result.text).toBe('Offline local calculation result: 42');
      expect(result.inferenceSource).toBe('on_device');

      // Restore
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
      // @ts-expect-error - Clean up
      delete window.ai;
    });

    it('never falls back to cloud when local inference fails in Private Local mode', async () => {
      // With no window.ai, Private Local must throw rather than silently routing to cloud
      await expect(executeOnDeviceInference('Private secret query')).rejects.toThrow(
        /No cloud fallback is permitted in Private Local mode|Private Local mode will never route data to the cloud/i
      );
    });
  });

  describe('4. Smart Hybrid Mode (InferenceMode.PREFER_ON_DEVICE)', () => {
    it('tries on-device first when local model is ready', async () => {
      const promptMock = vi.fn().mockResolvedValue('Fast local response in hybrid mode.');
      // @ts-expect-error - Mock Chrome AI
      window.ai = {
        languageModel: {
          capabilities: vi.fn().mockResolvedValue({ available: 'readily' }),
          create: vi.fn().mockResolvedValue({
            prompt: promptMock,
            destroy: vi.fn(),
          }),
        },
      };

      // When allowCloudFallback is false (without user permission)
      const resWithoutPerm = await executeHybridInference('Hybrid test query', false);
      expect(resWithoutPerm.inferenceSource).toBe('on_device');
      expect(resWithoutPerm.modeUsed).toBe('hybrid_auto');
      expect(resWithoutPerm.text).toBe('Fast local response in hybrid mode.');

      // @ts-expect-error - Clean up
      delete window.ai;
    });

    it('refuses cloud fallback without explicit user permission', async () => {
      // Without window.ai and allowCloudFallback = false
      await expect(executeHybridInference('Sensitive local query', false)).rejects.toThrow(
        /Cloud fallback requires explicit user approval/i
      );
    });

    it('falls back to cloud only when user explicitly grants permission', async () => {
      // Mock executeCloudInference
      const cloudSpy = vi
        .spyOn(aiServiceModule.aiExecutionEngine, 'executeCloudInference')
        .mockResolvedValueOnce({
          text: 'Verified cloud response via Gemini 2.5 Flash.',
          inferenceSource: 'in_cloud',
          modeUsed: 'cloud',
        });

      // With permission granted (allowCloudFallback = true)
      const resWithPerm = await executeHybridInference('Cloud fallback query', true);
      expect(resWithPerm.inferenceSource).toBe('in_cloud');
      expect(resWithPerm.modeUsed).toBe('hybrid_auto');
      expect(resWithPerm.text).toBe('Verified cloud response via Gemini 2.5 Flash.');
      expect(cloudSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('5. On-Device Model Initialization & Download Progress', () => {
    it('invokes download progress monitor callback during initialization', async () => {
      const progressValues: number[] = [];

      // @ts-expect-error - Mock Chrome AI with monitor event
      window.ai = {
        languageModel: {
          capabilities: vi.fn().mockResolvedValue({ available: 'after-download' }),
          create: vi.fn().mockImplementation(async (options) => {
            if (options?.monitor) {
              const emitter = new EventTarget();
              options.monitor(emitter);
              const progressEvent = new Event('downloadprogress') as ProgressEvent;
              Object.defineProperty(progressEvent, 'loaded', { value: 50 });
              Object.defineProperty(progressEvent, 'total', { value: 100 });
              emitter.dispatchEvent(progressEvent);
            }
            return {
              destroy: vi.fn(),
            };
          }),
        },
      };

      await initializeOnDeviceModel((progress) => {
        progressValues.push(progress);
      });

      expect(progressValues).toContain(50);

      // @ts-expect-error - Clean up
      delete window.ai;
    });
  });

  describe('6. Firebase App Check & Diagnostic Enforcement', () => {
    it('diagnoses App Check verification failure with debug token guidance', () => {
      const appCheckErr = new Error('FirebaseError: AppCheck: Requests are blocked by App Check.');
      const parsed = parseCloudError(appCheckErr);

      expect(parsed.errorCategory).toBe('app_check');
      expect(parsed.title).toContain('App Check Verification Failed');
      expect(parsed.fixGuide).toContain('Manage debug tokens');
    });

    it('diagnoses offline network status without crashing', () => {
      const networkErr = new Error('TypeError: Failed to fetch');
      const parsed = parseCloudError(networkErr);

      expect(parsed.errorCategory).toBe('network');
      expect(parsed.title).toContain('Network / Offline Connection Failure');
      expect(parsed.fixGuide).toContain('Private Local mode');
    });
  });
});
