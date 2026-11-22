import { doc, collection, setDoc } from 'firebase/firestore';
import { db, ensureAnonymousAuth, isFirebaseConfigured } from '../firebase/config';
import { StudyPlan, UserTask, SanitizationResult } from '../types';
import { StudyPlanSchema, UserTaskSchema } from '../schemas';
import { sanitizeText, SanitizerOptions } from './sanitizer';
import { executeCloudInference } from './aiService';
import { dbLocal } from '../db';

export interface PreparedStudyPlanRequest {
  rawTopic: string;
  sanitizedTopic: string;
  sanitizationResult: SanitizationResult;
  payloadToTransmit: {
    topic: string;
    goal: string;
    experienceLevel: string;
    daysCount: number;
  };
}

// 1. Prepare sanitized request for the 7-day plan
export function prepareStudyPlanPayload(
  rawTopic: string,
  experienceLevel: string,
  sanitizerOptions?: SanitizerOptions
): PreparedStudyPlanRequest {
  const sanitizationResult = sanitizeText(rawTopic, sanitizerOptions);

  return {
    rawTopic,
    sanitizedTopic: sanitizationResult.sanitizedText,
    sanitizationResult,
    payloadToTransmit: {
      topic: sanitizationResult.sanitizedText.trim() || 'Python Programming Fundamentals',
      goal: 'Mastery of foundational syntax, data structures, and functions',
      experienceLevel,
      daysCount: 7,
    },
  };
}

// 2. Execute cloud inference after user explicitly approves Gate 1
export async function executeCloudStudyPlan(
  prepared: PreparedStudyPlanRequest
): Promise<StudyPlan> {
  // If user is offline, record as pending request in IndexedDB
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    const pendingId = `pending_${Date.now()}`;
    await dbLocal.pendingRequests.add({
      id: pendingId,
      action: 'study_plan',
      createdAt: Date.now(),
      sanitizedPayload: prepared.payloadToTransmit,
      originalPayloadSnippet: prepared.rawTopic.slice(0, 50),
      status: 'pending',
    });
    throw new Error(
      'Device is currently offline. The plan request has been safely queued in your local pending requests. You can manually Sync when connectivity returns.'
    );
  }

  const prompt = `Generate a rigorous 7-day study plan for the following topic: "${prepared.payloadToTransmit.topic}".
Experience level: ${prepared.payloadToTransmit.experienceLevel}.
Respond ONLY with a valid JSON object matching this exact schema:
{
  "id": "plan_${Date.now()}",
  "topic": "${prepared.payloadToTransmit.topic}",
  "createdAt": ${Date.now()},
  "overview": "A comprehensive 7-day structured roadmap.",
  "days": [
    {
      "day": 1,
      "title": "Day 1 Title",
      "focus": "Core concept focus",
      "tasks": ["Task 1", "Task 2"],
      "estimatedHours": 2
    },
    ...days 2 through 7...
  ]
}`;

  let planJson = '';
  try {
    const result = await executeCloudInference(prompt);
    planJson = result.text;
  } catch (err) {
    // If Firebase keys are unconfigured in dev test mode, produce validated mock plan
    if (!isFirebaseConfigured()) {
      return generateOfflineVerifiedMockPlan(prepared.payloadToTransmit.topic);
    }
    // Record as pending request on network failure so user can retry manually
    const pendingId = `pending_${Date.now()}`;
    await dbLocal.pendingRequests.add({
      id: pendingId,
      action: 'study_plan',
      createdAt: Date.now(),
      sanitizedPayload: prepared.payloadToTransmit,
      originalPayloadSnippet: prepared.rawTopic.slice(0, 50),
      status: 'pending',
    });
    throw err;
  }

  // Clean JSON string
  const cleanJson = planJson.replace(/```json/g, '').replace(/```/g, '').trim();
  const parsed = JSON.parse(cleanJson);

  // Validate with Zod
  const validatedPlan = StudyPlanSchema.parse(parsed);
  return validatedPlan;
}

// 3. Save tasks to Cloud Firestore after user explicitly approves Gate 2
export async function saveApprovedTasksToFirestore(
  plan: StudyPlan
): Promise<UserTask[]> {
  const user = await ensureAnonymousAuth();
  const userId = user ? user.uid : 'anon_local_user';
  const approvedTasks: UserTask[] = [];

  for (const day of plan.days) {
    for (let tIndex = 0; tIndex < day.tasks.length; tIndex++) {
      const taskTitle = day.tasks[tIndex];
      const task: UserTask = {
        id: `task_${plan.id}_d${day.day}_t${tIndex}`,
        userId,
        planId: plan.id,
        day: day.day,
        title: taskTitle,
        description: `Day ${day.day} Focus: ${day.focus}`,
        status: 'pending',
        createdAt: plan.createdAt,
        approvedAt: Date.now(),
      };

      // Validate each task with Zod
      const validatedTask = UserTaskSchema.parse(task);
      approvedTasks.push(validatedTask);

      // Write to Firestore if configured
      if (isFirebaseConfigured() && user) {
        try {
          const taskDocRef = doc(db, 'tasks', validatedTask.id);
          await setDoc(taskDocRef, validatedTask);
        } catch (err) {
          console.warn('Firestore write warning:', err);
        }
      }
    }
  }

  return approvedTasks;
}

// Helper for deterministic offline verified mock plan
export function generateOfflineVerifiedMockPlan(topic: string): StudyPlan {
  const days = [
    {
      day: 1,
      title: 'Python Syntax & Environment Setup',
      focus: 'Variables, primitive types, and REPL setup',
      tasks: ['Install Python 3 & set up virtual environment', 'Practice variable assignment & string operations'],
      estimatedHours: 2,
    },
    {
      day: 2,
      title: 'Control Flow & Logic',
      focus: 'Conditional statements and boolean logic',
      tasks: ['Implement if/elif/else branching logic', 'Build a simple number guessing game'],
      estimatedHours: 2.5,
    },
    {
      day: 3,
      title: 'Loops & Iterables',
      focus: 'For loops, while loops, range()',
      tasks: ['Iterate through lists with enumerate()', 'Solve iteration challenge problems'],
      estimatedHours: 3,
    },
    {
      day: 4,
      title: 'Functions & Scopes',
      focus: 'def, arguments, return values, docstrings',
      tasks: ['Write reusable helper functions with type hints', 'Understand local vs global scope'],
      estimatedHours: 2.5,
    },
    {
      day: 5,
      title: 'Data Structures (Lists & Dictionaries)',
      focus: 'List comprehensions, dict operations, sets',
      tasks: ['Build a contact dictionary management tool', 'Filter collections with list comprehensions'],
      estimatedHours: 3,
    },
    {
      day: 6,
      title: 'File I/O & Exception Handling',
      focus: 'with open() context manager, try/except/finally',
      tasks: ['Parse a local JSON and CSV file', 'Handle FileNotFoundError and ValueError cleanly'],
      estimatedHours: 2,
    },
    {
      day: 7,
      title: 'Capstone Mini-Project & Review',
      focus: 'Synthesizing all learned Python concepts',
      tasks: ['Build a local CLI personal task manager', 'Write basic unit assertions to test logic'],
      estimatedHours: 3.5,
    },
  ];

  return StudyPlanSchema.parse({
    id: `plan_verified_${Date.now()}`,
    topic: topic || 'Python Basics',
    createdAt: Date.now(),
    overview: `A structured 7-day curriculum designed for accelerated mastery of ${topic}.`,
    days,
  });
}

// 4. Offline Pending Requests helpers
export async function listPendingRequests(): Promise<PendingCloudRequest[]> {
  return await dbLocal.pendingRequests.orderBy('createdAt').reverse().toArray();
}

export async function deletePendingRequest(id: string): Promise<void> {
  await dbLocal.pendingRequests.delete(id);
}

export function rePrepareFromPending(
  pending: PendingCloudRequest
): PreparedStudyPlanRequest {
  const sanitizationResult = sanitizeText(pending.sanitizedPayload.topic);
  return {
    rawTopic: pending.sanitizedPayload.topic,
    sanitizedTopic: sanitizationResult.sanitizedText,
    sanitizationResult,
    payloadToTransmit: {
      topic: sanitizationResult.sanitizedText.trim() || 'Python Programming Fundamentals',
      goal: pending.sanitizedPayload.goal || 'Mastery of foundational syntax',
      experienceLevel: pending.sanitizedPayload.experienceLevel || 'beginner',
      daysCount: pending.sanitizedPayload.daysCount || 7,
    },
  };
}

