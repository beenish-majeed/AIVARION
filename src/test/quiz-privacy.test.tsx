import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuizQuestionSchema } from '../schemas';
import { gradePythonAnswer, recordQuizAttempt, getQuizStats } from '../services/quizService';
import { sanitizeText } from '../services/sanitizer';
import { routeAIRequest } from '../services/privacyRouter';
import { dbLocal, clearAllLocalData } from '../db';
import { Note } from '../types';

describe('AIVARION Phase 4 Quiz, Notes & Privacy Router Tests', () => {
  beforeEach(async () => {
    await clearAllLocalData();
  });

  describe('Zod Quiz Validation & Deterministic Grading', () => {
    it('validates compliant quiz questions with Zod schema', () => {
      const valid = {
        id: 'q1',
        question: 'What keyword defines a function in Python?',
        options: ['func', 'def', 'fn', 'function'],
        correctIndex: 1,
        explanation: 'The def keyword defines a function in Python.',
      };

      const result = QuizQuestionSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('rejects malformed questions with Zod schema errors', () => {
      const invalid = {
        id: 'q_bad',
        question: 'Too short',
        options: ['only one option'], // requires at least 2
        correctIndex: -1,
        explanation: '',
      };

      const result = QuizQuestionSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('grades answers with deterministic code, not an AI model', () => {
      expect(gradePythonAnswer(2, 2)).toBe(true);
      expect(gradePythonAnswer(1, 2)).toBe(false);
      expect(gradePythonAnswer(0, 3)).toBe(false);
    });

    it('records quiz attempts in Dexie and calculates accurate metrics', async () => {
      const q = {
        id: 'q_stat',
        question: 'What is Python?',
        options: ['A language', 'A snake', 'Both', 'Neither'],
        correctIndex: 2,
        explanation: 'Python is a programming language named after Monty Python.',
      };

      await recordQuizAttempt(q, 2); // correct
      await recordQuizAttempt(q, 0); // incorrect

      const stats = await getQuizStats();
      expect(stats.totalAttempts).toBe(2);
      expect(stats.correctCount).toBe(1);
      expect(stats.accuracyRate).toBe(50);
    });
  });

  describe('Deterministic PII Sanitizer', () => {
    it('redacts email addresses and telephone numbers deterministically', () => {
      const raw = 'Contact alice.smith@company.org or call 415-555-0199 for details.';
      const result = sanitizeText(raw);

      expect(result.sanitizedText).toContain('[EMAIL_REDACTED]');
      expect(result.sanitizedText).toContain('[PHONE_REDACTED]');
      expect(result.sanitizedText).not.toContain('alice.smith@company.org');
      expect(result.sanitizedText).not.toContain('415-555-0199');
      expect(result.removedItems.length).toBe(2);
    });

    it('redacts user-marked sensitive names and warns on free-text secrets', () => {
      const raw = 'Meeting with Satoshi Nakamoto regarding password credentials.';
      const result = sanitizeText(raw, {
        privateNames: ['Satoshi Nakamoto'],
      });

      expect(result.sanitizedText).toContain('[NAME_REDACTED]');
      expect(result.sanitizedText).not.toContain('Satoshi Nakamoto');
      expect(result.warningMessage).toContain('sensitive keywords');
    });
  });

  describe('Personal Notes Local Storage', () => {
    it('creates, reads, updates, and deletes personal notes in IndexedDB', async () => {
      const note: Note = {
        id: 'note_123',
        title: 'Python Decorators',
        content: 'Decorators wrap a function to extend its behavior.',
        createdAt: 1000,
        updatedAt: 1000,
      };

      await dbLocal.notes.add(note);
      const found = await dbLocal.notes.get('note_123');
      expect(found?.title).toBe('Python Decorators');

      await dbLocal.notes.update('note_123', { title: 'Advanced Decorators' });
      const updated = await dbLocal.notes.get('note_123');
      expect(updated?.title).toBe('Advanced Decorators');

      await dbLocal.notes.delete('note_123');
      const deleted = await dbLocal.notes.get('note_123');
      expect(deleted).toBeUndefined();
    });
  });

  describe('Privacy Router Modes', () => {
    it('forces Private Local mode to throw immediately when on-device AI is absent', async () => {
      const approvalMock = vi.fn();

      await expect(
        routeAIRequest({
          mode: 'private_local',
          prompt: 'Write Python quicksort',
          onRequireCloudApproval: approvalMock,
        })
      ).rejects.toThrow(/Private Local/i);

      // Must never invoke cloud approval in Private Local mode
      expect(approvalMock).not.toHaveBeenCalled();
    });

    it('routes Hybrid Auto to cloud approval gate when local model is unavailable', async () => {
      const approvalMock = vi.fn();

      const result = await routeAIRequest({
        mode: 'hybrid_auto',
        prompt: 'Study plan for user@gmail.com',
        onRequireCloudApproval: approvalMock,
      });

      expect(result).toBeNull(); // Blocked until user approval
      expect(approvalMock).toHaveBeenCalled();
      const callArg = approvalMock.mock.calls[0][0];
      expect(callArg.sanitizedPrompt).toContain('[EMAIL_REDACTED]');
    });
  });
});
