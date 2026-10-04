import React, { useState, useRef, useEffect } from 'react';
import { Hexagon, Sparkles, ShieldCheck, Terminal, HelpCircle, LogOut, ChevronDown, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar = () => {
  const { isDemoMode, currentUser, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  /* Close dropdown when clicking outside */
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
  };

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Developer';
  const avatarLetter = displayName[0]?.toUpperCase() || 'D';

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
              <span className="pulse-dot" />
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

          {/* User avatar + dropdown */}
          <div className="nav-user-menu" ref={dropdownRef}>
            <button
              className="nav-user-btn"
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-label="User menu"
              aria-expanded={dropdownOpen}
            >
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={displayName}
                  className="nav-avatar-img"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <span className="nav-avatar-fallback" style={{ display: currentUser?.photoURL ? 'none' : 'flex' }}>
                {avatarLetter}
              </span>
              <span className="nav-display-name">{displayName}</span>
              <ChevronDown size={14} className={`nav-chevron ${dropdownOpen ? 'open' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="nav-dropdown">
                {/* User info row */}
                <div className="nav-dropdown-user">
                  <div className="nav-dropdown-avatar">{avatarLetter}</div>
                  <div className="nav-dropdown-info">
                    <span className="nav-dropdown-name">{displayName}</span>
                    <span className="nav-dropdown-email">{currentUser?.email || 'Demo user'}</span>
                  </div>
                </div>
                <div className="nav-dropdown-divider" />

                {/* Logout */}
                <button className="nav-dropdown-item nav-logout-item" onClick={handleLogout}>
                  <LogOut size={15} />
                  <span>Log out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .navbar-header {
          position: relative;
          z-index: 10;
          padding: 12px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(10, 12, 16, 0.6);
          backdrop-filter: blur(12px);
        }
        .navbar-container {
          width: 100%;
          max-width: 100%;
          margin: 0;
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

        /* ── User menu ── */
        .nav-user-menu {
          position: relative;
        }
        .nav-user-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 50px;
          padding: 5px 12px 5px 5px;
          cursor: pointer;
          color: #ffffff;
          transition: background 0.2s, border-color 0.2s;
        }
        .nav-user-btn:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(99,102,241,0.5);
        }
        .nav-avatar-img {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          object-fit: cover;
        }
        .nav-avatar-fallback {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 700;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .nav-display-name {
          font-size: 0.85rem;
          font-weight: 600;
          max-width: 120px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .nav-chevron {
          transition: transform 0.2s ease;
          color: var(--text-muted);
          flex-shrink: 0;
        }
        .nav-chevron.open {
          transform: rotate(180deg);
        }

        /* Dropdown */
        .nav-dropdown {
          position: absolute;
          top: calc(100% + 10px);
          right: 0;
          background: #1a1d2e;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          min-width: 220px;
          box-shadow: 0 16px 48px rgba(0,0,0,0.5);
          overflow: hidden;
          animation: dropdownIn 0.15s ease;
          z-index: 100;
        }
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
        .nav-dropdown-user {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
        }
        .nav-dropdown-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          color: #ffffff;
          font-size: 0.9rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .nav-dropdown-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }
        .nav-dropdown-name {
          font-size: 0.88rem;
          font-weight: 600;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .nav-dropdown-email {
          font-size: 0.75rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .nav-dropdown-divider {
          height: 1px;
          background: rgba(255,255,255,0.07);
          margin: 0 12px;
        }
        .nav-dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          background: transparent;
          border: none;
          padding: 11px 16px;
          font-size: 0.88rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.15s;
          text-align: left;
          color: var(--text-secondary);
          font-family: 'Inter', sans-serif;
        }
        .nav-dropdown-item:hover {
          background: rgba(255,255,255,0.06);
          color: #ffffff;
        }
        .nav-logout-item {
          color: #f87171;
          margin-bottom: 4px;
        }
        .nav-logout-item:hover {
          background: rgba(248,113,113,0.1);
          color: #f87171;
        }
      `}</style>
    </header>
  );
};
