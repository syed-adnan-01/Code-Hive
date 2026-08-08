import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Layout/Navbar';
import { AuthContainer } from './components/Auth/AuthContainer';
import { WorkspacePreview } from './components/Dashboard/WorkspacePreview';
import { Hexagon } from 'lucide-react';

const AppContent = () => {
  const { currentUser, loading } = useAuth();

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
            background: var(--bg-primary);
          }
          .loading-icon-wrapper {
            position: relative;
            color: var(--accent-indigo);
          }
          .spinner-hexagon {
            animation: spinPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          @keyframes spinPulse {
            0% { transform: rotate(0deg) scale(1); opacity: 0.7; }
            50% { transform: rotate(180deg) scale(1.15); opacity: 1; color: var(--accent-cyan); }
            100% { transform: rotate(360deg) scale(1); opacity: 0.7; }
          }
          .loading-text {
            font-size: 1.1rem;
            color: var(--text-secondary);
            letter-spacing: -0.01em;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app-main-layout">
      {/* Background Ambient Glowing Orbs */}
      <div className="ambient-background">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <Navbar />

      <main className="app-body">
        {currentUser ? <WorkspacePreview /> : <AuthContainer />}
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
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
