export type AIMode = 'private_local' | 'hybrid_auto' | 'cloud';

export type InferenceSourceType = 'on_device' | 'in_cloud';

export type DeviceModelStatus = 'unavailable' | 'downloading' | 'ready';

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: number;
  inferenceSource?: InferenceSourceType;
  modeUsed: AIMode;
  sanitized?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizAttempt {
  id: string;
  questionId: string;
  question: string;
  selectedOption: number;
  correctOption: number;
  isCorrect: boolean;
  explanation: string;
  timestamp: number;
}

export interface StudyPlanDay {
  day: number;
  title: string;
  focus: string;
  tasks: string[];
  estimatedHours: number;
}

export interface StudyPlan {
  id: string;
  topic: string;
  createdAt: number;
  overview: string;
  days: StudyPlanDay[];
}

export interface UserTask {
  id: string;
  userId: string;
  planId?: string;
  day?: number;
  title: string;
  description?: string;
  status: 'pending' | 'completed';
  createdAt: number;
  approvedAt: number;
}

export interface PendingCloudRequest {
  id: string;
  action: 'study_plan';
  createdAt: number;
  sanitizedPayload: {
    topic: string;
    goal: string;
    experienceLevel: string;
    daysCount: number;
  };
  originalPayloadSnippet: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed';
  error?: string;
}

export interface SanitizationResult {
  sanitizedText: string;
  removedItems: {
    type: 'phone' | 'email' | 'marked_name';
    original: string;
    replacement: string;
  }[];
  warningMessage?: string;
}
