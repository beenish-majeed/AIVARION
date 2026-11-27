import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/landing/LandingPage';
import { AppShell } from './components/app/AppShell';
import { LiquidTransition } from './components/layout/LiquidTransition';
import { ThemeProvider } from './context/ThemeContext';

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const hash = window.location.hash.replace('#', '');
      if (pathname === '/app' || hash === '/app' || hash === 'app') {
        return '/app';
      }
    }
    return '/';
  });

  useEffect(() => {
    const handlePopState = () => {
      const pathname = window.location.pathname;
      const hash = window.location.hash.replace('#', '');
      if (pathname === '/app' || hash === '/app' || hash === 'app') {
        setCurrentPath('/app');
      } else {
        setCurrentPath('/');
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  const navigateTo = (path: string) => {
    setCurrentPath(path);
    if (window.location.protocol === 'file:') {
      window.location.hash = path;
    } else {
      window.history.pushState({}, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <ThemeProvider>
      <LiquidTransition currentPath={currentPath} />
      {currentPath === '/app' ? (
        <AppShell onNavigateHome={() => navigateTo('/')} />
      ) : (
        <LandingPage onNavigate={navigateTo} />
      )}
    </ThemeProvider>
  );
};

export default App;
