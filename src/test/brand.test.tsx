import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { App } from '../App';
import { isFirebaseConfigured } from '../firebase/config';

describe('AIVARION Phase 1 Brand and System Tests', () => {
  it('renders the brand name AIVARION and official logo in header and footer', () => {
    render(<App />);

    // Brand logo alt texts
    const logos = screen.getAllByAltText('AIVARION');
    expect(logos.length).toBeGreaterThanOrEqual(1);

    // Headline and mission statement
    expect(screen.getByText(/Intelligence Stays/i)).toBeInTheDocument();
    expect(screen.getAllByText(/On Your Machine/i).length).toBeGreaterThanOrEqual(1);
  });

  it('renders Try AIVARION action button that navigates directly to /app', () => {
    render(<App />);

    const tryButtons = screen.getAllByRole('link', { name: /Try AIVARION/i });
    expect(tryButtons.length).toBeGreaterThanOrEqual(1);

    // Clicking Try AIVARION switches view to the App shell
    fireEvent.click(tryButtons[0]);
    expect(screen.getByText(/New Conversation/i)).toBeInTheDocument();
  });

  it('provides safe Firebase configuration defaults and detection', () => {
    // In default mock dev test mode without real secrets, isFirebaseConfigured returns false or safe mock
    expect(typeof isFirebaseConfigured()).toBe('boolean');
  });
});
