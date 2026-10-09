import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { Navbar } from './components/Layout/Navbar';
import { AuthContainer } from './components/Auth/AuthContainer';
import { WorkspacePreview } from './components/Dashboard/WorkspacePreview';
import { LandingPage } from './components/Landing/LandingPage';
import { Hexagon, Sun, Moon } from 'lucide-react';

const AppContent = () => {
  const { currentUser, loading } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();
  // 'landing' | 'auth'
  const [view, setView] = useState('landing');

  if (loading) {
    return (
      <div className={`app-loading-screen ${isDark ? 'dark' : ''}`}>
        <div className="loading-icon-wrapper">
          <Hexagon size={48} className="spinner-hexagon" />
        </div>
        <p className="loading-text font-brand">Initializing CodeHive Engine...</p>

        <style>{`
          .app-loading-screen {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 20px;
            background: #ffffff;
            transition: background 0.2s ease;
          }
          .app-loading-screen.dark {
            background: #0a0c10;
          }
          .loading-icon-wrapper {
            position: relative;
            color: #6366f1;
          }
          .spinner-hexagon {
            animation: spinPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          @keyframes spinPulse {
            0%   { transform: rotate(0deg) scale(1);    opacity: 0.7; }
            50%  { transform: rotate(180deg) scale(1.15); opacity: 1; color: #06b6d4; }
            100% { transform: rotate(360deg) scale(1);  opacity: 0.7; }
          }
          .loading-text {
            font-size: 1.1rem;
            color: #6b7280;
            letter-spacing: -0.01em;
            font-family: 'Outfit', sans-serif;
          }
          .app-loading-screen.dark .loading-text {
            color: #94a3b8;
          }
        `}</style>
      </div>
    );
  }

  // If the user is authenticated, jump straight into the workspace
  if (currentUser) {
    return (
      <div className={`app-main-layout ${isDark ? 'dark' : ''}`}>
        {/* Background Ambient Glowing Orbs */}
        <div className="ambient-background">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>

        <Navbar />

        <main className="app-body">
          <WorkspacePreview />
        </main>

        <style>{`
          .app-main-layout {
            height: 100vh;
            width: 100vw;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
            background: #ffffff;
            transition: background-color 0.2s ease;
          }
          .app-main-layout.dark {
            background: #0a0c10;
          }
          .app-main-layout > header,
          .navbar-header {
            position: relative;
            z-index: 1000 !important;
          }
          .app-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            width: 100%;
            overflow: hidden;
            position: relative;
            z-index: 1;
          }
        `}</style>
      </div>
    );
  }

  // Not authenticated — show landing or auth
  if (view === 'landing') {
    return (
      <LandingPage
        onGetStarted={() => setView('auth')}
        onLogin={() => setView('auth')}
      />
    );
  }

  // Auth view
  return (
    <div className={`auth-full-page ${isDark ? 'dark' : ''}`}>
      {/* Polished top nav matching landing page */}
      <header className="auth-nav">
        <div className="auth-nav-inner">
          <div className="auth-logo" onClick={() => setView('landing')} style={{ cursor: 'pointer' }}>
            <div className="auth-logo-hex">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <polygon points="11,1 20,5.5 20,16.5 11,21 2,16.5 2,5.5" fill="#6366f1" stroke="#38bdf8" strokeWidth="1.5" />
                <polygon points="11,5 16,8 16,14 11,17 6,14 6,8" fill="white" fillOpacity="0.25" />
              </svg>
            </div>
            <span className="auth-logo-name">Code<span className="auth-logo-accent">Hive</span></span>
          </div>

          <div className="auth-nav-actions">
            <button
              className="auth-theme-toggle"
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun size={17} className="auth-sun-icon" /> : <Moon size={17} className="auth-moon-icon" />}
            </button>

            <button className="auth-back-btn" onClick={() => setView('landing')}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13 8H3M7 12l-4-4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>Back to home</span>
            </button>
          </div>
        </div>
      </header>

      <main className="auth-body-container">
        <AuthContainer onBackToHome={() => setView('landing')} />
      </main>

      <style>{`
        .auth-full-page {
          min-height: 100vh;
          width: 100vw;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          position: relative;
          overflow-x: hidden;
          transition: background-color 0.2s ease;
        }
        .auth-full-page.dark {
          background: #0a0c10;
        }
        .auth-nav {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid #f1f5f9;
          transition: all 0.2s ease;
        }
        .auth-full-page.dark .auth-nav {
          background: rgba(10, 12, 16, 0.9);
          border-bottom-color: rgba(255, 255, 255, 0.08);
        }
        .auth-nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .auth-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          user-select: none;
          transition: transform 0.2s ease;
        }
        .auth-logo:hover {
          transform: scale(1.03);
        }
        .auth-logo-hex {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #e0e7ff, #e0f2fe);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: box-shadow 0.2s ease;
        }
        .auth-logo:hover .auth-logo-hex {
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
        }
        .auth-logo-name {
          font-family: 'Outfit', sans-serif;
          font-size: 1.4rem;
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.03em;
          transition: color 0.2s ease;
        }
        .auth-full-page.dark .auth-logo-name {
          color: #ffffff;
        }
        .auth-logo-accent {
          color: #6366f1;
        }
        .auth-nav-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .auth-theme-toggle {
          background: #ffffff;
          border: 1.5px solid #e5e7eb;
          color: #4b5563;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.18s ease;
        }
        .auth-full-page.dark .auth-theme-toggle {
          background: #11141d;
          border-color: rgba(255, 255, 255, 0.12);
          color: #fbbf24;
        }
        .auth-theme-toggle:hover {
          border-color: #6366f1;
          transform: rotate(15deg);
        }
        .auth-back-btn {
          background: #ffffff;
          border: 1.5px solid #e5e7eb;
          color: #374151;
          padding: 8px 18px;
          border-radius: 50px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: all 0.18s ease;
        }
        .auth-full-page.dark .auth-back-btn {
          background: #11141d;
          border-color: rgba(255, 255, 255, 0.12);
          color: #cbd5e1;
        }
        .auth-back-btn:hover {
          border-color: #6366f1;
          color: #6366f1;
          transform: translateX(-3px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
        }
        .auth-body-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          position: relative;
        }
      `}</style>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

