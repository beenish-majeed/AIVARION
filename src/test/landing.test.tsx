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
  });

  it('allows clicking different steps to inspect their rules and code payload simulation', () => {
    render(<HowItWorksSection />);

    // Default step is Step 1 (Local Answer)
    expect(screen.getAllByText(/ONLY_ON_DEVICE/i).length).toBeGreaterThanOrEqual(1);

    // Click Step 2: Privacy Check
    const step2Button = screen.getByRole('button', { name: /Privacy Check/i });
    fireEvent.click(step2Button);
    expect(screen.getAllByText(/PII_REDACTOR_ACTIVE/i).length).toBeGreaterThanOrEqual(1);

    // Click Step 3: User Approval
    const step3Button = screen.getByRole('button', { name: /User Approval/i });
    fireEvent.click(step3Button);
    expect(screen.getAllByText(/EXPLICIT_APPROVAL_REQUIRED/i).length).toBeGreaterThanOrEqual(1);

    // Click Step 4: Saved Result
    const step4Button = screen.getByRole('button', { name: /Saved Result/i });
    fireEvent.click(step4Button);
    expect(screen.getAllByText(/ZOD_VALIDATED_WRITE/i).length).toBeGreaterThanOrEqual(1);
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
