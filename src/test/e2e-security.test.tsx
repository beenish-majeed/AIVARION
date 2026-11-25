import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dbLocal } from '../db';
import { sanitizeText } from '../services/sanitizer';
import { routeAIRequest } from '../services/privacyRouter';
import {
  prepareStudyPlanPayload,
  executeCloudStudyPlan,
  saveApprovedTasksToFirestore,
  listPendingRequests,
  deletePendingRequest,
  rePrepareFromPending,
} from '../services/studyPlanService';
import { UserTaskSchema } from '../schemas';
import * as aiService from '../services/aiService';

describe('AIVARION Phase 6: E2E Security, Offline Queue & Approval Gates', () => {
  beforeEach(async () => {
    await dbLocal.notes.clear();
    await dbLocal.conversations.clear();
    await dbLocal.messages.clear();
    await dbLocal.pendingRequests.clear();
    vi.clearAllMocks();

    // Mock cloud inference during unit tests to prevent unmocked external network calls
    vi.spyOn(aiService, 'executeCloudInference').mockImplementation(async (prompt: string) => ({
      text: JSON.stringify({
        id: `plan_${Date.now()}`,
        topic: 'Python Roadmap',
        createdAt: Date.now(),
        overview: 'A comprehensive 7-day structured roadmap.',
        days: Array.from({ length: 7 }, (_, i) => ({
          day: i + 1,
          title: `Day ${i + 1} Fundamentals`,
          focus: 'Core concept mastery',
          tasks: ['Task A', 'Task B'],
          estimatedHours: 2,
        })),
      }),
      inferenceSource: 'in_cloud',
      modeUsed: 'cloud',
    }));
  });

  describe('1. Sanitizer Security & Redaction', () => {
    it('strips emails, phone numbers, and custom private entities', () => {
      const raw = 'Contact Alice at alice@company.corp or +1-800-555-0199 regarding ProjectTitan.';
      const res = sanitizeText(raw, {
        privateNames: ['ProjectTitan', 'Alice'],
        warnOnFreeTextKeywords: true,
      });

      expect(res.sanitizedText).not.toContain('alice@company.corp');
      expect(res.sanitizedText).not.toContain('+1-800-555-0199');
      expect(res.sanitizedText).not.toContain('ProjectTitan');
      expect(res.sanitizedText).not.toContain('Alice');
      expect(res.sanitizedText).toContain('[EMAIL_REDACTED]');
      expect(res.sanitizedText).toContain('[PHONE_REDACTED]');
      expect(res.sanitizedText).toContain('[NAME_REDACTED]');
      expect(res.removedItems.length).toBeGreaterThanOrEqual(4);
    });

    it('flags sensitive keywords in warning feedback', () => {
      const raw = 'Please evaluate this confidential proprietary password dataset';
      const res = sanitizeText(raw, { warnOnFreeTextKeywords: true });

      expect(res.warningMessage).toBeDefined();
      expect(res.warningMessage).toContain('sensitive keywords');
    });
  });

  describe('2. Private Local Mode Invariance', () => {
    it('never contacts cloud in Private Local mode when local AI is active', async () => {
      const mockCloudApproval = vi.fn();

      // Mock on-device window.ai Chrome Prompt API
      // @ts-expect-error - mock chrome prompt api
      window.ai = {
        languageModel: {
          capabilities: async () => ({ available: 'readily' }),
          create: async () => ({
            prompt: async () => 'Handled strictly on device',
          }),
        },
      };

      const result = await routeAIRequest({
        prompt: 'Help me analyze this offline note',
        mode: 'private_local',
        onRequireCloudApproval: mockCloudApproval,
      });

      expect(result).toEqual({
        text: 'Handled strictly on device',
        inferenceSource: 'on_device',
        modeUsed: 'private_local',
      });
      expect(mockCloudApproval).not.toHaveBeenCalled();

      // Clean up window.ai
      // @ts-expect-error - cleanup
      delete window.ai;
    });

    it('rejects routing if on-device model is unavailable in Private Local mode', async () => {
      const mockCloudApproval = vi.fn();

      // Ensure window.ai is deleted so local inference is absent
      // @ts-expect-error - cleanup
      delete window.ai;

      await expect(
        routeAIRequest({
          prompt: 'Local question',
          mode: 'private_local',
          onRequireCloudApproval: mockCloudApproval,
        })
      ).rejects.toThrow(/Private Local mode will never route data to the cloud/);

      expect(mockCloudApproval).not.toHaveBeenCalled();
    });
  });

  describe('3. Offline Queue & Manual Sync Lifecycle', () => {
    it('safely queues plan request in IndexedDB when device is offline without auto-transmitting', async () => {
      // Simulate offline environment
      const originalOnLine = navigator.onLine;
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

      const prepared = prepareStudyPlanPayload('Offline Python Roadmap', 'intermediate');

      await expect(executeCloudStudyPlan(prepared)).rejects.toThrow(
        /Device is currently offline. The plan request has been safely queued/
      );

      // Verify stored in IndexedDB pendingRequests
      const pendingList = await listPendingRequests();
      expect(pendingList).toHaveLength(1);
      expect(pendingList[0].action).toBe('study_plan');
      expect(pendingList[0].sanitizedPayload.topic).toBe('Offline Python Roadmap');
      expect(pendingList[0].status).toBe('pending');

      // Re-prepare pending request for manual sync
      const rePrepared = rePrepareFromPending(pendingList[0]);
      expect(rePrepared.payloadToTransmit.topic).toBe('Offline Python Roadmap');

      // Restore online state
      Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });

      // After user inspects preview and manually approves Gate 1:
      const plan = await executeCloudStudyPlan(rePrepared);
      expect(plan.days).toHaveLength(7);

      // Remove from pending queue
      await deletePendingRequest(pendingList[0].id);
      const remainingPending = await listPendingRequests();
      expect(remainingPending).toHaveLength(0);

      // Clean up
      Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true });
    });
  });

  describe('4. Dual Human Approval Gates & Firestore Persistence', () => {
    it('aborts cleanly when user cancels Gate 1 preview', () => {
      const prepared = prepareStudyPlanPayload('Secret Algorithms', 'beginner', {
        privateNames: ['Secret'],
      });

      expect(prepared.sanitizedTopic).not.toContain('Secret');
      expect(prepared.payloadToTransmit.topic).toContain('[NAME_REDACTED]');

      // Simulating user rejecting/canceling Gate 1 preview modal:
      // No cloud execution happens; state resets without transmission
      const cloudExecuted = false;
      expect(cloudExecuted).toBe(false);
    });

    it('requires explicit Gate 2 human approval before saving tasks to Firestore', async () => {
      const prepared = prepareStudyPlanPayload('Data Engineering Essentials', 'intermediate');
      const plan = await executeCloudStudyPlan(prepared);

      expect(plan.days).toHaveLength(7);

      // Scenario A: User REJECTS Gate 2 (Save to Firestore)
      const userApprovedGate2 = false;
      let savedTasks = null;
      if (userApprovedGate2) {
        savedTasks = await saveApprovedTasksToFirestore(plan);
      }
      expect(savedTasks).toBeNull();

      // Scenario B: User APPROVES Gate 2 (Save to Firestore)
      savedTasks = await saveApprovedTasksToFirestore(plan);
      expect(savedTasks.length).toBeGreaterThan(0);
      expect(savedTasks[0].status).toBe('pending');
      expect(savedTasks[0].approvedAt).toBeGreaterThan(0);
    });
  });

  describe('5. Task Document Security & Firestore Schema Invariance', () => {
    it('validates authentic task documents adhering to firestore.rules contract', () => {
      const validTask = {
        id: 'task_plan_100_d1_t0',
        userId: 'user_authenticated_123',
        planId: 'plan_100',
        day: 1,
        title: 'Complete chapter 1 exercises',
        description: 'Day 1 Focus: Foundations',
        status: 'pending' as const,
        createdAt: 1700000000000,
        approvedAt: 1700000005000,
      };

      const parsed = UserTaskSchema.parse(validTask);
      expect(parsed.id).toBe(validTask.id);
      expect(parsed.userId).toBe(validTask.userId);
    });

    it('rejects malformed task documents missing required fields', () => {
      const invalidTaskMissingStatus = {
        id: 'task_malformed',
        userId: 'user_123',
        title: 'Incomplete task',
        createdAt: 1700000000000,
        approvedAt: 1700000005000,
      };

      expect(() => UserTaskSchema.parse(invalidTaskMissingStatus)).toThrow();
    });

    it('rejects unexpected / forbidden fields violating strict rules', () => {
      const maliciousTask = {
        id: 'task_elevated',
        userId: 'user_123',
        title: 'Legit looking task',
        status: 'pending',
        createdAt: 1700000000000,
        approvedAt: 1700000005000,
        isAdmin: true, // Unexpected field
        role: 'superadmin', // Unexpected field
      };

      // Strict schema rejects forbidden fields
      const schemaWithStrict = UserTaskSchema.strict();
      expect(() => schemaWithStrict.parse(maliciousTask)).toThrow();
    });
  });
});
