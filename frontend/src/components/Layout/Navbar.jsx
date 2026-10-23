import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, LogOut, ChevronDown, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
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
    <header className={`navbar-header ${isDark ? 'dark' : 'light'}`}>
      <div className="navbar-container">
        {/* Brand Logo matching Home page */}
        <div className="brand-logo">
          <div className="logo-icon-hex">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <polygon points="11,1 20,5.5 20,16.5 11,21 2,16.5 2,5.5" fill="#6366f1" stroke="#38bdf8" strokeWidth="1.5" />
              <polygon points="11,5 16,8 16,14 11,17 6,14 6,8" fill="white" fillOpacity="0.25" />
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-name">Code<span className="brand-accent">Hive</span></span>
            <span className="brand-badge">WORKSPACE</span>
          </div>
        </div>

        {/* Right Action Items */}
        <div className="navbar-actions">
          {/* Theme Switcher Toggle */}
          <button
            type="button"
            className="nav-theme-toggle-btn"
            onClick={toggleTheme}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme"
          >
            {isDark ? <Sun size={15} className="theme-toggle-icon sun" /> : <Moon size={15} className="theme-toggle-icon moon" />}
            <span className="theme-toggle-text">{isDark ? 'Light' : 'Dark'}</span>
          </button>

          <a
            href="https://firebase.google.com/docs/auth"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-docs-link"
            title="Firebase Documentation"
          >
            <HelpCircle size={16} />
            <span className="nav-docs-text">Docs</span>
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
                  referrerPolicy="no-referrer"
                  onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex'; }}
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
                  <div className="nav-dropdown-avatar">
                    {currentUser?.photoURL ? (
                      <img
                        src={currentUser.photoURL}
                        alt={displayName}
                        className="nav-dropdown-avatar-img"
                        referrerPolicy="no-referrer"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      avatarLetter
                    )}
                  </div>
                  <div className="nav-dropdown-info">
                    <span className="nav-dropdown-name">{displayName}</span>
                    <span className="nav-dropdown-email">{currentUser?.email || 'Demo user'}</span>
                  </div>
                </div>
                <div className="nav-dropdown-divider" />

                {/* Theme toggle option inside dropdown */}
                <button className="nav-dropdown-item nav-theme-toggle-item" onClick={toggleTheme}>
                  {isDark ? <Sun size={15} /> : <Moon size={15} />}
                  <span>{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
                </button>
                <div className="nav-dropdown-divider" />

                {/* Logout */}
                <button className="nav-dropdown-item nav-logout-item" onClick={handleLogout}>
                  <LogOut size={16} />
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
          z-index: 1000 !important;
          padding: 0 24px;
          height: 64px;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
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
          gap: 10px;
          text-decoration: none;
          user-select: none;
          transition: transform 0.2s ease;
        }
        .brand-logo:hover {
          transform: scale(1.02);
        }
        .logo-icon-hex {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #e0e7ff, #e0f2fe);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.12);
        }
        .brand-text {
          display: flex;
          align-items: baseline;
          gap: 8px;
        }
        .brand-name {
          font-family: 'Outfit', sans-serif;
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          color: #111827;
        }
        .brand-accent {
          color: #6366f1;
        }
        .brand-badge {
          font-family: 'Fira Code', monospace;
          font-size: 0.65rem;
          font-weight: 700;
          color: #6366f1;
          background: #e0e7ff;
          padding: 2px 7px;
          border-radius: 6px;
          letter-spacing: 0.05em;
        }
        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .badge-live {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #16a34a;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 600;
        }
        .badge-demo {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #fffbeb;
          border: 1px solid #fde68a;
          color: #b45309;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 600;
        }
        .pulse-dot-amber {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #f59e0b;
          animation: pulse 1.5s infinite;
        }
        .nav-docs-link {
          color: #4b5563;
          text-decoration: none;
          font-size: 0.86rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 50px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          transition: all 0.18s ease;
        }
        .nav-docs-link:hover {
          color: #6366f1;
          border-color: #6366f1;
        }

        /* ── User Menu & Stacking Context Fix ── */
        .nav-user-menu {
          position: relative;
          z-index: 1001 !important;
        }
        .nav-user-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #ffffff;
          border: 1.5px solid #e5e7eb;
          border-radius: 50px;
          padding: 4px 14px 4px 5px;
          cursor: pointer;
          color: #111827;
          transition: all 0.18s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .nav-user-btn:hover {
          border-color: #6366f1;
          box-shadow: 0 2px 8px rgba(99,102,241,0.12);
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
          background: linear-gradient(135deg, #6366f1, #3b82f6);
          color: #ffffff;
          font-size: 0.78rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .nav-display-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: #111827;
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .nav-chevron {
          transition: transform 0.2s ease;
          color: #6b7280;
          flex-shrink: 0;
        }
        .nav-chevron.open {
          transform: rotate(180deg);
        }

        /* Dropdown Overlay: High z-index to stay strictly on top of workspace */
        .nav-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: #ffffff;
          border: 1px solid #f1f5f9;
          border-radius: 18px;
          min-width: 240px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.04);
          overflow: hidden;
          animation: dropdownIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 999999 !important;
        }
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
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
          background: linear-gradient(135deg, #6366f1, #3b82f6);
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
          font-family: 'Outfit', sans-serif;
          font-size: 0.92rem;
          font-weight: 700;
          color: #111827;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .nav-dropdown-email {
          font-size: 0.76rem;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .nav-dropdown-divider {
          height: 1px;
          background: #f1f5f9;
          margin: 0 8px;
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
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: left;
          font-family: inherit;
        }
        .nav-logout-item {
          color: #ef4444;
          border-radius: 12px;
          margin: 4px 6px;
          width: calc(100% - 12px);
        }
        .nav-logout-item:hover {
          background: #fef2f2;
          color: #dc2626;
        }

        /* ── Theme Toggle Pill Button ── */
        .nav-theme-toggle-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          padding: 5px 12px;
          border-radius: 50px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.18s ease;
          box-shadow: 0 1px 2px rgba(0,0,0,0.04);
        }
        .nav-theme-toggle-btn:hover {
          border-color: #6366f1;
          color: #6366f1;
          transform: translateY(-1px);
        }
        .theme-toggle-icon.sun {
          color: #f59e0b;
        }
        .theme-toggle-icon.moon {
          color: #6366f1;
        }
        .nav-theme-toggle-item {
          color: #475569;
          border-radius: 12px;
          margin: 4px 6px;
          width: calc(100% - 12px);
        }
        .nav-theme-toggle-item:hover {
          background: #f1f5f9;
          color: #6366f1;
        }

        /* ── Dark Mode Navbar Overrides ── */
        .navbar-header.dark {
          background: #181818;
          border-bottom: 1px solid #2b2b2b;
        }
        .navbar-header.dark .brand-name {
          color: #f8fafc;
        }
        .navbar-header.dark .brand-badge {
          background: #252526;
          border: 1px solid #333333;
          color: #007acc;
        }
        .navbar-header.dark .logo-icon-hex {
          background: #252526;
          border: 1px solid #333333;
        }
        .navbar-header.dark .badge-live {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #34d399;
        }
        .navbar-header.dark .badge-demo {
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #fbbf24;
        }
        .navbar-header.dark .nav-docs-link {
          background: #252526;
          border-color: #333333;
          color: #cccccc;
        }
        .navbar-header.dark .nav-docs-link:hover {
          border-color: #007acc;
          background: #2d2d2d;
          color: #ffffff;
        }
        .navbar-header.dark .nav-theme-toggle-btn {
          background: #252526;
          border-color: #333333;
          color: #cccccc;
        }
        .navbar-header.dark .nav-theme-toggle-btn:hover {
          border-color: #007acc;
          background: #2d2d2d;
          color: #ffffff;
        }
        .navbar-header.dark .nav-user-btn {
          background: #252526;
          border-color: #333333;
          color: #f1f5f9;
        }
        .navbar-header.dark .nav-user-btn:hover {
          border-color: #007acc;
          background: #2d2d2d;
        }
        .navbar-header.dark .nav-display-name {
          color: #f1f5f9;
        }
        .navbar-header.dark .nav-chevron {
          color: #94a3b8;
        }
        .navbar-header.dark .nav-dropdown {
          background: #252526;
          border: 1px solid #333333;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
        }
        .navbar-header.dark .nav-dropdown-name {
          color: #f8fafc;
        }
        .navbar-header.dark .nav-dropdown-email {
          color: #94a3b8;
        }
        .navbar-header.dark .nav-dropdown-divider {
          background: #2b2b2b;
        }
        .navbar-header.dark .nav-dropdown-item {
          color: #cbd5e1;
        }
        .navbar-header.dark .nav-dropdown-item:hover {
          background: #2d2d2d;
          color: #ffffff;
        }
        .navbar-header.dark .nav-theme-toggle-item:hover {
          background: #2d2d2d;
          color: #007acc;
        }
        .navbar-header.dark .nav-logout-item {
          color: #f87171;
        }
        .navbar-header.dark .nav-logout-item:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }

        /* ── Responsive Adaptations for Screen Resizing ── */
        .badge-text-compact {
          display: none;
        }
        .badge-text-full {
          display: inline;
        }

        @media (max-width: 900px) {
          .brand-badge {
            display: none;
          }
          .badge-text-full {
            display: none;
          }
          .badge-text-compact {
            display: inline;
          }
          .theme-toggle-text {
            display: none;
          }
        }

        @media (max-width: 768px) {
          .navbar-header {
            height: 56px;
            padding: 0 12px;
          }
          .navbar-actions {
            gap: 6px;
          }
          .badge-live, .badge-demo {
            padding: 4px 8px;
            font-size: 0.72rem;
          }
          .badge-text-compact {
            display: none;
          }
          .nav-docs-text {
            display: none;
          }
          .nav-docs-link {
            padding: 5px 8px;
          }
          .nav-theme-toggle-btn {
            padding: 5px 8px;
          }
          .nav-user-btn {
            padding: 3px 8px 3px 4px;
            gap: 5px;
          }
          .nav-display-name {
            max-width: 75px;
          }
        }

        @media (max-width: 580px) {
          .nav-display-name {
            display: none;
          }
          .nav-docs-link {
            display: none;
          }
          .brand-name {
            font-size: 1.15rem;
          }
          .logo-icon-hex {
            width: 30px;
            height: 30px;
          }
          .logo-icon-hex svg {
            width: 18px;
            height: 18px;
          }
        }
      `}</style>
    </header>
  );
};
