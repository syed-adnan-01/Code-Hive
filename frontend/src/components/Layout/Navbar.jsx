import React from 'react';
import { Hexagon, Sparkles, ShieldCheck, Terminal, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const { isDemoMode } = useAuth();

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Brand Logo */}
        <div className="brand-logo">
          <div className="logo-icon-wrapper">
            <Hexagon className="logo-icon" size={28} />
            <Sparkles className="logo-sparkle" size={14} />
          </div>
          <div className="brand-text">
            <span className="brand-name font-brand">Code<span className="gradient-text">Hive</span></span>
            <span className="brand-subtext">Collaborative Workspace</span>
          </div>
        </div>

        {/* Right Action Items */}
        <div className="navbar-actions">
          {isDemoMode ? (
            <div className="badge-demo">
              <span className="pulse-dot"></span>
              Demo Auth Active
            </div>
          ) : (
            <div className="badge-live">
              <ShieldCheck size={14} />
              Firebase Auth Live
            </div>
          )}

          <a
            href="https://firebase.google.com/docs/auth"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-link"
            title="Firebase Documentation"
          >
            <HelpCircle size={18} />
            <span>Docs</span>
          </a>
        </div>
      </div>

      <style>{`
        .navbar-header {
          position: relative;
          z-index: 10;
          padding: 20px 32px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .navbar-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .brand-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }
        .logo-icon-wrapper {
          position: relative;
          width: 42px;
          height: 42px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2));
          border: 1px solid rgba(168, 85, 247, 0.4);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-cyan);
          box-shadow: 0 0 15px rgba(6, 182, 212, 0.3);
        }
        .logo-sparkle {
          position: absolute;
          top: -2px;
          right: -2px;
          color: var(--accent-pink);
        }
        .brand-text {
          display: flex;
          flex-direction: column;
        }
        .brand-name {
          font-size: 1.4rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #ffffff;
        }
        .brand-subtext {
          font-size: 0.72rem;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .nav-link {
          color: var(--text-secondary);
          text-decoration: none;
          font-size: 0.88rem;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: color 0.2s ease;
        }
        .nav-link:hover {
          color: var(--accent-indigo);
        }
      `}</style>
    </header>
  );
};
