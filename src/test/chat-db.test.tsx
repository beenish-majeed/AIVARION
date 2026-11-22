import { describe, it, expect, beforeEach } from 'vitest';
import {
  createConversation,
  getConversations,
  updateConversationTitle,
  deleteConversation,
  saveMessage,
  getMessagesByConversation,
  clearAllLocalData,
} from '../db';
import {
  formatConversationContext,
  executeOnDeviceInference,
} from '../services/aiService';
import { ChatMessage } from '../types';

describe('AIVARION Phase 3 Database & AI Routing Tests', () => {
  beforeEach(async () => {
    await clearAllLocalData();
  });

  it('creates, renames, and retrieves conversations in IndexedDB', async () => {
    const conv = await createConversation('Test Workspace');
    expect(conv.id).toBeDefined();
    expect(conv.title).toBe('Test Workspace');

    await updateConversationTitle(conv.id, 'Updated Workspace Title');
    const all = await getConversations();
    expect(all.length).toBe(1);
    expect(all[0].title).toBe('Updated Workspace Title');
  });

  it('saves and queries chat messages linked to a conversation with inference source tag', async () => {
    const conv = await createConversation('Chat Test');

    const message: ChatMessage = {
      id: 'msg_test_1',
      conversationId: conv.id,
      role: 'assistant',
      content: 'This reply ran 100% on-device.',
      createdAt: Date.now(),
      inferenceSource: 'on_device',
      modeUsed: 'private_local',
    };

    await saveMessage(message);
    const msgs = await getMessagesByConversation(conv.id);

    expect(msgs.length).toBe(1);
    expect(msgs[0].content).toBe('This reply ran 100% on-device.');
    expect(msgs[0].inferenceSource).toBe('on_device');
    expect(msgs[0].modeUsed).toBe('private_local');
  });

  it('deleting a conversation cascades and deletes all associated messages', async () => {
    const conv = await createConversation('To Delete');
    await saveMessage({
      id: 'msg_del_1',
      conversationId: conv.id,
      role: 'user',
      content: 'Hello local world',
      createdAt: Date.now(),
      modeUsed: 'private_local',
    });

    await deleteConversation(conv.id);

    const remainingConvs = await getConversations();
    const remainingMsgs = await getMessagesByConversation(conv.id);

    expect(remainingConvs.find((c) => c.id === conv.id)).toBeUndefined();
    expect(remainingMsgs.length).toBe(0);
  });

  it('formats conversation context into single-turn prompt correctly', () => {
    const history: ChatMessage[] = [
      {
        id: '1',
        conversationId: 'c1',
        role: 'user',
        content: 'What is Python list comprehension?',
        createdAt: 1000,
        modeUsed: 'private_local',
      },
      {
        id: '2',
        conversationId: 'c1',
        role: 'assistant',
        content: 'It is a concise syntax for creating lists.',
        createdAt: 2000,
        inferenceSource: 'on_device',
        modeUsed: 'private_local',
      },
    ];

    const formatted = formatConversationContext(history, 'Give me an example');

    expect(formatted).toContain('What is Python list comprehension?');
    expect(formatted).toContain('It is a concise syntax for creating lists.');
    expect(formatted).toContain('User: Give me an example');
    expect(formatted).toContain('Assistant:');
  });

  it('strictly enforces Private Local mode and throws without silent cloud fallback', async () => {
    // When on-device AI is not available in test runner environment
    await expect(
      executeOnDeviceInference('Test prompt')
    ).rejects.toThrow(/Private Local/i);
  });
});
