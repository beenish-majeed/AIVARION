import Dexie, { Table } from 'dexie';
import {
  Conversation,
  ChatMessage,
  Note,
  QuizAttempt,
  PendingCloudRequest,
  AIMode,
  DeviceModelStatus,
} from '../types';

export interface UserPreference {
  key: string;
  value: string | number | boolean | object;
}

export class AivarionDatabase extends Dexie {
  conversations!: Table<Conversation, string>;
  messages!: Table<ChatMessage, string>;
  notes!: Table<Note, string>;
  quizAttempts!: Table<QuizAttempt, string>;
  pendingRequests!: Table<PendingCloudRequest, string>;
  preferences!: Table<UserPreference, string>;

  constructor() {
    super('aivarion_private_db');

    // Schema definition for Dexie v4
    this.version(1).stores({
      conversations: 'id, createdAt, updatedAt',
      messages: 'id, conversationId, createdAt, role, modeUsed',
      notes: 'id, createdAt, updatedAt',
      quizAttempts: 'id, questionId, timestamp, isCorrect',
      pendingRequests: 'id, action, createdAt, status',
      preferences: 'key',
    });
  }
}

export const dbLocal = new AivarionDatabase();

// Database Helper Functions

export async function getConversations(): Promise<Conversation[]> {
  return await dbLocal.conversations.orderBy('updatedAt').reverse().toArray();
}

export async function createConversation(title = 'New Conversation'): Promise<Conversation> {
  const newConv: Conversation = {
    id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await dbLocal.conversations.add(newConv);
  return newConv;
}

export async function updateConversationTitle(id: string, title: string): Promise<void> {
  await dbLocal.conversations.update(id, { title, updatedAt: Date.now() });
}

export async function deleteConversation(id: string): Promise<void> {
  await dbLocal.transaction('rw', dbLocal.conversations, dbLocal.messages, async () => {
    await dbLocal.messages.where({ conversationId: id }).delete();
    await dbLocal.conversations.delete(id);
  });
}

export async function getMessagesByConversation(conversationId: string): Promise<ChatMessage[]> {
  return await dbLocal.messages
    .where({ conversationId })
    .sortBy('createdAt');
}

export async function saveMessage(message: ChatMessage): Promise<void> {
  await dbLocal.transaction('rw', dbLocal.messages, dbLocal.conversations, async () => {
    await dbLocal.messages.put(message);
    await dbLocal.conversations.update(message.conversationId, {
      updatedAt: Date.now(),
    });
  });
}

export async function deleteMessage(id: string): Promise<void> {
  await dbLocal.messages.delete(id);
}

// Ensure at least one initial conversation exists
export async function ensureDefaultConversation(): Promise<Conversation> {
  const count = await dbLocal.conversations.count();
  if (count === 0) {
    const conv = await createConversation('Welcome to AIVARION');
    const welcomeMsg: ChatMessage = {
      id: `msg_welcome_${Date.now()}`,
      conversationId: conv.id,
      role: 'assistant',
      content:
        'Welcome to AIVARION. I am your private, local-first assistant. In Private Local mode, our conversation runs on your device and never leaves your browser. How can I assist your workflow today?',
      createdAt: Date.now(),
      inferenceSource: 'on_device',
      modeUsed: 'private_local',
      sanitized: false,
    };
    await dbLocal.messages.add(welcomeMsg);
    return conv;
  }
  const all = await getConversations();
  return all[0];
}

// Clear all local data (as required in Settings)
export async function clearAllLocalData(): Promise<void> {
  await dbLocal.transaction(
    'rw',
    [
      dbLocal.conversations,
      dbLocal.messages,
      dbLocal.notes,
      dbLocal.quizAttempts,
      dbLocal.pendingRequests,
      dbLocal.preferences,
    ],
    async () => {
      await dbLocal.conversations.clear();
      await dbLocal.messages.clear();
      await dbLocal.notes.clear();
      await dbLocal.quizAttempts.clear();
      await dbLocal.pendingRequests.clear();
      await dbLocal.preferences.clear();
    }
  );
}
