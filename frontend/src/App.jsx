import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Layout/Navbar';
import { AuthContainer } from './components/Auth/AuthContainer';
import { WorkspacePreview } from './components/Dashboard/WorkspacePreview';
import { LandingPage } from './components/Landing/LandingPage';
import { Hexagon } from 'lucide-react';

const AppContent = () => {
  const { currentUser, loading } = useAuth();
  // 'landing' | 'auth'
  const [view, setView] = useState('landing');

  if (loading) {
    return (
      <div className="app-loading-screen">
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
        `}</style>
      </div>
    );
  }

  // If the user is authenticated, jump straight into the workspace
  if (currentUser) {
    return (
      <div className="app-main-layout">
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
          }
          .app-body {
            flex: 1;
            display: flex;
            flex-direction: column;
            width: 100%;
            overflow: hidden;
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
    <div className="app-main-layout">
      <div className="ambient-background">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>

      {/* Minimal nav with back-to-landing link */}
      <header className="auth-mini-nav">
        <button className="auth-back-btn" onClick={() => setView('landing')}>
          ← Back to home
        </button>
      </header>

      <main className="app-body">
        <AuthContainer />
      </main>

      <style>{`
        .app-main-layout {
          height: 100vh;
          width: 100vw;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }
        .app-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          width: 100%;
          overflow: auto;
        }
        .auth-mini-nav {
          position: relative;
          z-index: 10;
          padding: 12px 24px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          background: rgba(10,12,16,0.6);
          backdrop-filter: blur(12px);
        }
        .auth-back-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 0.88rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: color 0.2s;
          font-family: 'Inter', sans-serif;
        }
        .auth-back-btn:hover { color: #6366f1; }
      `}</style>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
