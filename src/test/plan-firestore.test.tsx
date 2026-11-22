import { describe, it, expect, beforeEach } from 'vitest';
import {
  prepareStudyPlanPayload,
  executeCloudStudyPlan,
  saveApprovedTasksToFirestore,
  generateOfflineVerifiedMockPlan,
} from '../services/studyPlanService';
import { StudyPlanSchema, UserTaskSchema } from '../schemas';
import { dbLocal, clearAllLocalData } from '../db';

describe('AIVARION Phase 5 Cloud Study Plan & Dual Approval Tests', () => {
  beforeEach(async () => {
    await clearAllLocalData();
  });

  describe('Sanitized Payload Preparation (Gate 1)', () => {
    it('sanitizes user input deterministically before preparing cloud transmission', () => {
      const prepared = prepareStudyPlanPayload(
        'Python study for bob@domain.com and (800) 555-0100',
        'intermediate',
        { privateNames: ['Bob'] }
      );

      expect(prepared.sanitizedTopic).toContain('[EMAIL_REDACTED]');
      expect(prepared.sanitizedTopic).toContain('[PHONE_REDACTED]');
      expect(prepared.sanitizedTopic).not.toContain('bob@domain.com');
      expect(prepared.payloadToTransmit.daysCount).toBe(7);
      expect(prepared.payloadToTransmit.experienceLevel).toBe('intermediate');
      expect(prepared.sanitizationResult.removedItems.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Study Plan Zod Validation', () => {
    it('validates a complete 7-day study plan strictly with Zod', () => {
      const plan = generateOfflineVerifiedMockPlan('Python AsyncIO');
      const result = StudyPlanSchema.safeParse(plan);

      expect(result.success).toBe(true);
      expect(plan.days.length).toBe(7);
      expect(plan.days[0].day).toBe(1);
      expect(plan.days[6].day).toBe(7);
    });

    it('rejects an invalid study plan with fewer than 7 days', () => {
      const invalid = {
        id: 'plan_short',
        topic: 'Python',
        createdAt: 1000,
        overview: 'Incomplete plan with only 3 days',
        days: [
          { day: 1, title: 'Day 1', focus: 'Basics', tasks: ['Task 1'], estimatedHours: 2 },
          { day: 2, title: 'Day 2', focus: 'Basics', tasks: ['Task 2'], estimatedHours: 2 },
          { day: 3, title: 'Day 3', focus: 'Basics', tasks: ['Task 3'], estimatedHours: 2 },
        ],
      };

      const result = StudyPlanSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });

  describe('Firestore Task Generation (Gate 2)', () => {
    it('generates validated user tasks with user ID, timestamps, and pending status', async () => {
      const plan = generateOfflineVerifiedMockPlan('Python OOP');
      const approvedTasks = await saveApprovedTasksToFirestore(plan);

      expect(approvedTasks.length).toBeGreaterThanOrEqual(7);
      const firstTask = approvedTasks[0];

      expect(firstTask.userId).toBeDefined();
      expect(firstTask.planId).toBe(plan.id);
      expect(firstTask.status).toBe('pending');
      expect(firstTask.createdAt).toBe(plan.createdAt);
      expect(firstTask.approvedAt).toBeGreaterThan(0);

      // Verify each task conforms to UserTaskSchema
      const taskValidation = UserTaskSchema.safeParse(firstTask);
      expect(taskValidation.success).toBe(true);
    });
  });

  describe('Offline Pending Request Queuing', () => {
    it('queues plan requests into IndexedDB pending requests table when offline', async () => {
      // Mock navigator.onLine as false
      const originalOnLine = navigator.onLine;
      Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });

      const prepared = prepareStudyPlanPayload('Python Django', 'beginner');

      await expect(executeCloudStudyPlan(prepared)).rejects.toThrow(
        /Device is currently offline/i
      );

      const pending = await dbLocal.pendingRequests.toArray();
      expect(pending.length).toBe(1);
      expect(pending[0].action).toBe('study_plan');
      expect(pending[0].sanitizedPayload.topic).toBe('Python Django');
      expect(pending[0].status).toBe('pending');

      // Restore onLine
      Object.defineProperty(navigator, 'onLine', { value: originalOnLine, configurable: true });
    });
  });
});
