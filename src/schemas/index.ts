import { z } from 'zod';

// Python Skill Coach Quiz Question Schema
export const QuizQuestionSchema = z.object({
  id: z.string(),
  question: z.string().min(5, 'Question must be at least 5 characters long'),
  options: z
    .array(z.string().min(1, 'Option cannot be empty'))
    .min(2, 'At least 2 options required')
    .max(5, 'Maximum 5 options permitted'),
  correctIndex: z.number().int().min(0, 'correctIndex must be non-negative'),
  explanation: z.string().min(5, 'Explanation must be at least 5 characters long'),
});

export type QuizQuestionZod = z.infer<typeof QuizQuestionSchema>;

// Study Plan 7-Day Day Schema
export const StudyPlanDaySchema = z.object({
  day: z.number().int().min(1).max(7),
  title: z.string().min(3),
  focus: z.string().min(3),
  tasks: z.array(z.string().min(3)).min(1),
  estimatedHours: z.number().min(0.5).max(12),
});

// Cloud 7-Day Study Plan Full Schema
export const StudyPlanSchema = z.object({
  id: z.string(),
  topic: z.string().min(2),
  createdAt: z.number(),
  overview: z.string().min(10),
  days: z.array(StudyPlanDaySchema).min(7).max(7),
});

export type StudyPlanZod = z.infer<typeof StudyPlanSchema>;

// Firestore User Task Schema
export const UserTaskSchema = z.object({
  id: z.string(),
  userId: z.string().min(1),
  planId: z.string().optional(),
  day: z.number().optional(),
  title: z.string().min(2),
  description: z.string().optional(),
  status: z.enum(['pending', 'completed']),
  createdAt: z.number(),
  approvedAt: z.number(),
});

export type UserTaskZod = z.infer<typeof UserTaskSchema>;
