import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ChatView } from '../components/app/ChatView';
import {
  clearAllLocalData,
  createConversation,
  saveMessage,
  getMessagesByConversation,
} from '../db';
import {
  extractRecentTurns,
  assembleContextPrompt,
  parseCloudError,
  checkDeviceModelAvailability,
} from '../services/aiService';
import * as aiServiceModule from '../services/aiService';
import { Conversation, ChatMessage } from '../types';

describe('AIVARION End-to-End Chat Modes, Approval Gates & Error Diagnostics', () => {
  let testConv: Conversation;

  beforeEach(async () => {
    await clearAllLocalData();
    testConv = await createConversation('End-to-End Chat Test');
    vi.clearAllMocks();
  });

  describe('1. On-Device AI Availability & Non-Dead-End Handling', () => {
    it('detects on-device status and details accurately', async () => {
      const info = await checkDeviceModelAvailability();
      expect(['ready', 'downloading', 'unavailable']).toContain(info.status);
      expect(info.details).toBeDefined();
    });

    it('shows non-dead-end banner with reason and Switch to Cloud button when local AI is unavailable', async () => {
      const handleSwitchMode = vi.fn();

      render(
        <ChatView
          conversation={testConv}
          currentMode="private_local"
          onSwitchMode={handleSwitchMode}
        />
      );

      const input = screen.getByLabelText(/Message prompt input/i);
      const sendBtn = screen.getByLabelText(/Send message/i);

      fireEvent.change(input, { target: { value: 'Explain Python generators' } });
      fireEvent.click(sendBtn);

      // Verify the banner appears with status and details, NOT a dead end
      await waitFor(() => {
        expect(screen.getByText(/On-Device AI Engine Status:/i)).toBeInTheDocument();
      });

      // Shows action button to switch to Cloud mode
      const switchBtn = screen.getByRole('button', { name: /Switch to Cloud mode/i });
      expect(switchBtn).toBeInTheDocument();

      // Clicking switch calls onSwitchMode('cloud') and stages prompt into preview modal
      fireEvent.click(switchBtn);
      expect(handleSwitchMode).toHaveBeenCalledWith('cloud');

      // The preview approval modal must open: nothing sent until user approves
      await waitFor(() => {
        expect(screen.getByText(/Review Payload Before Cloud Transmission/i)).toBeInTheDocument();
      });
      expect(screen.getByText('Explain Python generators')).toBeInTheDocument();
    });
  });

  describe('2. Cloud Chat Approval Gate & Selective Turn Transmission', () => {
    it('extracts recent turns and assembles prompt deterministically', () => {
      const msgs: ChatMessage[] = [
        {
          id: 'm1',
          conversationId: 'c1',
          role: 'user',
          content: 'What is a decorator?',
          createdAt: 1000,
          modeUsed: 'cloud',
        },
        {
          id: 'm2',
          conversationId: 'c1',
          role: 'assistant',
          content: 'A decorator is a callable that modifies a function.',
          createdAt: 2000,
          inferenceSource: 'in_cloud',
          modeUsed: 'cloud',
        },
      ];

      const turns = extractRecentTurns(msgs, 4);
      expect(turns).toHaveLength(2);
      expect(turns[0].content).toBe('What is a decorator?');

      const assembled = assembleContextPrompt([turns[0]], 'Can you show syntax?');
      expect(assembled).toContain('User: What is a decorator?');
      expect(assembled).not.toContain('A decorator is a callable');
      expect(assembled).toContain('User: Can you show syntax?');
    });

    it('cloud chat does not send anything until preview is explicitly approved', async () => {
      render(
        <ChatView
          conversation={testConv}
          currentMode="cloud"
        />
      );

      const input = screen.getByLabelText(/Message prompt input/i);
      const sendBtn = screen.getByLabelText(/Send message/i);

      fireEvent.change(input, { target: { value: 'Write a Python unit test' } });
      fireEvent.click(sendBtn);

      // Verify preview modal is open
      const cancelBtn = await screen.findByRole('button', { name: /Cancel \(Send Nothing\)/i });
      expect(screen.getByText(/Review Payload Before Cloud Transmission/i)).toBeInTheDocument();
      expect(screen.getByText('Write a Python unit test')).toBeInTheDocument();

      // Canceling closes the modal and aborts transmission
      fireEvent.click(cancelBtn);

      await waitFor(() => {
        expect(screen.queryByText(/Review Payload Before Cloud Transmission/i)).not.toBeInTheDocument();
      });
    });

    it('transmits approved text and displays the real inference source from the SDK', async () => {
      // Mock executeCloudInference to return real SDK inference source
      const executeCloudSpy = vi
        .spyOn(aiServiceModule, 'executeCloudInference')
        .mockResolvedValueOnce({
          text: 'Here is your Python unit test using pytest.',
          inferenceSource: 'in_cloud',
          modeUsed: 'cloud',
        });

      render(
        <ChatView
          conversation={testConv}
          currentMode="cloud"
        />
      );

      const input = screen.getByLabelText(/Message prompt input/i);
      const sendBtn = screen.getByLabelText(/Send message/i);

      fireEvent.change(input, { target: { value: 'Create pytest fixture' } });
      fireEvent.click(sendBtn);

      // Approve & Transmit
      const approveBtn = await screen.findByRole('button', { name: /Approve & Transmit/i });
      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(screen.getByText('Here is your Python unit test using pytest.')).toBeInTheDocument();
      });

      // Verify real inference source badge from SDK
      expect(screen.getByText(/SOURCE: CLOUD/i)).toBeInTheDocument();
      expect(executeCloudSpy).toHaveBeenCalledTimes(1);

      // Verify persisted to IndexedDB
      const saved = await getMessagesByConversation(testConv.id);
      expect(saved.some((m) => m.content.includes('Here is your Python unit test'))).toBe(true);
    });
  });

  describe('3. Cloud Error Diagnostics (No Fake Replies)', () => {
    it('classifies missing Firebase credentials with actionable fix guide and raw error', () => {
      const err = new Error('Cloud inference requires Firebase API configuration in .env.local.');
      const parsed = parseCloudError(err);

      expect(parsed.errorCategory).toBe('no_config');
      expect(parsed.title).toContain('Firebase Project Credentials Missing');
      expect(parsed.fixGuide).toContain('VITE_FIREBASE_API_KEY');
      expect(parsed.rawError).toBe(err.message);
    });

    it('classifies App Check verification failure with debug token guide', () => {
      const err = new Error('FirebaseError: AppCheck: Requests are blocked by App Check.');
      const parsed = parseCloudError(err);

      expect(parsed.errorCategory).toBe('app_check');
      expect(parsed.title).toContain('App Check Verification Failed');
      expect(parsed.fixGuide).toContain('Manage debug tokens');
    });

    it('classifies offline network failures accurately', () => {
      const err = new Error('TypeError: Failed to fetch (network error)');
      const parsed = parseCloudError(err);

      expect(parsed.errorCategory).toBe('network');
      expect(parsed.title).toContain('Network / Offline Connection Failure');
      expect(parsed.fixGuide).toContain('Private Local mode');
    });

    it('displays error card and does NOT generate a fake assistant reply when cloud fails', async () => {
      vi.spyOn(aiServiceModule, 'executeCloudInference').mockRejectedValueOnce(
        new Error('FirebaseError: AppCheck: Requests are blocked by App Check.')
      );

      render(
        <ChatView
          conversation={testConv}
          currentMode="cloud"
        />
      );

      const input = screen.getByLabelText(/Message prompt input/i);
      const sendBtn = screen.getByLabelText(/Send message/i);

      fireEvent.change(input, { target: { value: 'Analyze this algorithm' } });
      fireEvent.click(sendBtn);

      const approveBtn = await screen.findByRole('button', { name: /Approve & Transmit/i });
      fireEvent.click(approveBtn);

      await waitFor(() => {
        expect(screen.getByText(/Firebase App Check Verification Failed/i)).toBeInTheDocument();
      });

      // Verify fix guide is displayed
      expect(screen.getByText(/Manage debug tokens/i)).toBeInTheDocument();

      // Assert NO fake assistant reply was generated
      const messagesInDb = await getMessagesByConversation(testConv.id);
      const assistantMessages = messagesInDb.filter((m) => m.role === 'assistant');
      expect(assistantMessages).toHaveLength(0);
    });
  });

  describe('4. Conversation Memory, Copy & Delete Actions', () => {
    it('allows copying message content to clipboard', async () => {
      const mockClipboard = {
        writeText: vi.fn().mockResolvedValue(undefined),
      };
      Object.defineProperty(navigator, 'clipboard', {
        value: mockClipboard,
        configurable: true,
        writable: true,
      });

      await saveMessage({
        id: 'msg_to_copy',
        conversationId: testConv.id,
        role: 'user',
        content: 'Copy this secret prompt',
        createdAt: Date.now(),
        modeUsed: 'private_local',
      });

      render(
        <ChatView
          conversation={testConv}
          currentMode="private_local"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Copy this secret prompt')).toBeInTheDocument();
      });

      const copyBtn = screen.getByRole('button', { name: /Copy message/i });
      fireEvent.click(copyBtn);

      expect(mockClipboard.writeText).toHaveBeenCalledWith('Copy this secret prompt');
    });

    it('allows deleting individual messages from chat memory and IndexedDB', async () => {
      await saveMessage({
        id: 'msg_to_delete',
        conversationId: testConv.id,
        role: 'user',
        content: 'Delete me soon',
        createdAt: Date.now(),
        modeUsed: 'private_local',
      });

      render(
        <ChatView
          conversation={testConv}
          currentMode="private_local"
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Delete me soon')).toBeInTheDocument();
      });

      const deleteBtn = screen.getByRole('button', { name: /Delete message/i });
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(screen.queryByText('Delete me soon')).not.toBeInTheDocument();
      });

      const remaining = await getMessagesByConversation(testConv.id);
      expect(remaining.find((m) => m.id === 'msg_to_delete')).toBeUndefined();
    });
  });
});
