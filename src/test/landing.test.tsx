import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { LandingPage } from '../components/landing/LandingPage';
import { HowItWorksSection } from '../components/landing/HowItWorksSection';
import { HeroSection } from '../components/landing/HeroSection';

describe('AIVARION Phase 2 Landing Page Tests', () => {
  it('renders the complete four-step privacy sequence in How It Works', () => {
    render(<HowItWorksSection />);

    expect(screen.getAllByText('Local Answer').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Privacy Check').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('User Approval').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Saved Result').length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText('Runs on your device')).toBeInTheDocument();
    expect(screen.getByText('Automatic protection')).toBeInTheDocument();
    expect(screen.getByText('Your explicit permission')).toBeInTheDocument();
    expect(screen.getByText('Stored in your vault')).toBeInTheDocument();
  });

  it('allows clicking and hovering cards to inspect their verified rules and descriptions', () => {
    render(<HowItWorksSection />);

    // All 4 badges exist on back faces
    expect(screen.getAllByText(/ONLY_ON_DEVICE/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/PII_REDACTOR_ACTIVE/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/EXPLICIT_APPROVAL_REQUIRED/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/ZOD_VALIDATED_WRITE/i).length).toBeGreaterThanOrEqual(1);

    // Card 2: Privacy Check
    const card2 = screen.getByRole('button', { name: /Privacy Check/i });
    expect(card2).toBeInTheDocument();

    // Click/tap toggles flip
    fireEvent.click(card2);
    expect(screen.getByText(/Before you choose to run any online task/i)).toBeInTheDocument();

    // Click/tap again flips back
    fireEvent.click(card2);

    // Card 3: User Approval
    const card3 = screen.getByRole('button', { name: /User Approval/i });
    fireEvent.click(card3);
    expect(screen.getByText(/Nothing gets sent without your permission/i)).toBeInTheDocument();
  });

  it('supports drag gestures on the 3D circular carousel container', () => {
    const { container } = render(<HowItWorksSection />);
    const stage = container.querySelector('.cursor-grab');
    expect(stage).toBeInTheDocument();

    if (stage) {
      // Simulate pointer drag gesture
      fireEvent.mouseDown(stage, { clientX: 200 });
      fireEvent.mouseMove(stage, { clientX: 120 });
      fireEvent.mouseUp(stage);
    }
  });

  it('activates static hero fallback when prefers-reduced-motion is requested', () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { container } = render(<HeroSection />);

    expect(screen.getByText(/STATIC_MODE_ACTIVE/i)).toBeInTheDocument();
    expect(screen.getByText(/AIVARION On-Device AI Core/i)).toBeInTheDocument();
    expect(container.querySelectorAll('.hero-petal').length).toBe(0);
    expect(container.querySelector('.hero-full-viewport')).toBeInTheDocument();
  });

  it('navigates to /app when CTA buttons are clicked', () => {
    const handleNavigate = vi.fn();
    render(<LandingPage onNavigate={handleNavigate} />);

    const navTryButton = screen.getByRole('link', { name: /Try AIVARION Workspace Application/i });
    expect(navTryButton).toBeInTheDocument();

    fireEvent.click(navTryButton);
    expect(handleNavigate).toHaveBeenCalledWith('/app');
  });
});
