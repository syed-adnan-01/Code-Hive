import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CodeEditor } from './CodeEditor';
import { TerminalPanel } from './TerminalPanel';
import { StdinPanel } from './StdinPanel';
import { SUPPORTED_LANGUAGES } from '../../config/languages';
import { runCodeAPI } from '../../services/runService';
import {
  Code,
  Play,
  Share2,
  Zap,
  Server,
  Sparkles,
  ChevronDown,
  Terminal,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Users2,
  RotateCcw
} from 'lucide-react';

export const WorkspacePreview = () => {
  const { currentUser, logout, isDemoMode } = useAuth();

  // Active language and code state
  const [selectedLanguage, setSelectedLanguage] = useState(SUPPORTED_LANGUAGES[0]);
  const [code, setCode] = useState(SUPPORTED_LANGUAGES[0].defaultCode);
  const [stdin, setStdin] = useState('');
  const [isStdinOpen, setIsStdinOpen] = useState(false);

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [cursorStats, setCursorStats] = useState({ line: 1, col: 1 });

  // Sidebar / Drawer states
  const [activeSidebarTab, setActiveSidebarTab] = useState('templates'); // 'templates' | 'api' | 'profile'
  const [apiResponse, setApiResponse] = useState(null);
  const [loadingApi, setLoadingApi] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  // Handle switching languages
  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    setIsLangDropdownOpen(false);

    // If current code matches default code of previous language or is empty, load new language template
    setCode(lang.defaultCode);
    setExecutionResult(null);
  };

  // Load Stdin template for the current language
  const handleLoadStdinTemplate = () => {
    if (selectedLanguage.stdinTemplate) {
      setCode(selectedLanguage.stdinTemplate);
      setStdin('5\n10 20 30 40 50');
      setIsStdinOpen(true);
      setExecutionResult(null);
    }
  };

  // Reset to default Hello World template
  const handleResetTemplate = () => {
    setCode(selectedLanguage.defaultCode);
    setExecutionResult(null);
  };

  // Execute Code via Judge0 backend API
  const handleRunCode = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);

    try {
      let idToken = null;
      if (currentUser) {
        idToken = currentUser.isDemo ? 'demo-bearer-token' : await currentUser.getIdToken();
      }

      const res = await runCodeAPI({
        source_code: code,
        language_id: selectedLanguage.id,
        stdin,
        idToken,
      });

      if (res.success && res.submission) {
        setExecutionResult(res.submission);
      } else {
        throw new Error(res.error || 'Execution returned unexpected response.');
      }
    } catch (err) {
      setExecutionResult({
        status: { id: 11, description: 'Execution Failed' },
        stderr: err.message,
        stdout: null,
        compile_output: null,
        time: '0.000',
        memory: 0,
      });
    } finally {
      setIsRunning(false);
    }
  }, [code, selectedLanguage, stdin, currentUser, isRunning]);

  // Test Firebase ID token verification against Express API
  const handleTestBackendAPI = async () => {
    setLoadingApi(true);
    setApiResponse(null);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const token = currentUser?.isDemo ? 'demo-bearer-token' : await currentUser?.getIdToken();

      const res = await fetch(`${backendUrl}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      setApiResponse(data);
    } catch (err) {
      setApiResponse({
        error: 'Backend API connection offline or not running yet',
        details: err.message,
      });
    } finally {
      setLoadingApi(false);
    }
  };

  return (
    <div className="workspace-container">
      {/* Top Header Bar */}
      <div className="workspace-header">
        <div className="header-left">
          <div className="room-badge">
            <span className="live-indicator"></span>
            <span className="room-name font-brand">#hive-alpha-workspace</span>
          </div>

          {/* Language Selector Dropdown */}
          <div className="language-selector-wrapper">
            <button
              type="button"
              className="btn-language-selector font-code"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
            >
              <span className="lang-color-dot" style={{ backgroundColor: selectedLanguage.badgeColor }}></span>
              <span className="lang-name">{selectedLanguage.name}</span>
              <ChevronDown size={14} className={`chevron-icon ${isLangDropdownOpen ? 'open' : ''}`} />
            </button>

            {isLangDropdownOpen && (
              <div className="language-dropdown-menu font-code">
                <div className="dropdown-label">Select Compiler / Runtime</div>
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <div
                    key={lang.id}
                    className={`language-menu-item ${selectedLanguage.id === lang.id ? 'active' : ''}`}
                    onClick={() => handleLanguageChange(lang)}
                  >
                    <div className="lang-item-left">
                      <span className="lang-color-dot" style={{ backgroundColor: lang.badgeColor }}></span>
                      <span>{lang.name}</span>
                    </div>
                    <span className="lang-id-badge">ID: {lang.id}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="latency-badge">
            <Zap size={13} className="text-cyan" />
            <span>Judge0 Sandboxed</span>
          </div>
        </div>

        <div className="header-right">
          {/* Quick Template Switchers */}
          <button
            type="button"
            className="btn-template-switch"
            onClick={handleResetTemplate}
            title="Reset to Hello World template"
          >
            <RotateCcw size={13} />
            <span>Hello World</span>
          </button>

          <button
            type="button"
            className="btn-template-switch"
            onClick={handleLoadStdinTemplate}
            title="Load Stdin example program"
          >
            <Sparkles size={13} className="text-amber" />
            <span>Stdin Example</span>
          </button>

          {/* Stdin Toggle Button */}
          <button
            type="button"
            className={`btn-stdin-toggle ${isStdinOpen ? 'active' : ''}`}
            onClick={() => setIsStdinOpen(!isStdinOpen)}
            title="Toggle Standard Input (stdin) Panel"
          >
            <Terminal size={14} />
            <span>Stdin {stdin ? `(${stdin.length}c)` : ''}</span>
          </button>

          {/* Primary Run Code Button */}
          <button
            className="btn-run-main"
            onClick={handleRunCode}
            disabled={isRunning}
            title="Run Code via Judge0 API (Ctrl + Enter)"
          >
            <Play size={14} className="fill-current" />
            <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>

          {/* Collaborator Avatars Preview */}
          <div className="collaborator-avatars" title="Room Members">
            <div className="avatar-pill avatar-you font-code">YOU</div>
          </div>
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="workspace-main-content">
        {/* Left Sidebar Tools */}
        <aside className="workspace-sidebar">
          <div className="sidebar-icons">
            <button
              className={`sidebar-tab-btn ${activeSidebarTab === 'templates' ? 'active' : ''}`}
              onClick={() => setActiveSidebarTab(activeSidebarTab === 'templates' ? '' : 'templates')}
              title="Language Templates & Snippets"
            >
              <FileCode size={18} />
            </button>
            <button
              className={`sidebar-tab-btn ${activeSidebarTab === 'api' ? 'active' : ''}`}
              onClick={() => setActiveSidebarTab(activeSidebarTab === 'api' ? '' : 'api')}
              title="Test Backend Firebase Auth Endpoint"
            >
              <Server size={18} />
            </button>
          </div>

          {/* Collapsible Sidebar Drawer */}
          {activeSidebarTab && (
            <div className="sidebar-drawer-panel">
              {activeSidebarTab === 'templates' && (
                <div className="drawer-content">
                  <div className="drawer-header">
                    <span className="font-brand drawer-title">PROGRAM TEMPLATES</span>
                  </div>
                  <p className="drawer-desc">
                    Switch language or load starter snippets for testing multi-language execution and stdin:
                  </p>
                  <div className="template-cards-list">
                    {SUPPORTED_LANGUAGES.map((lang) => (
                      <div
                        key={lang.id}
                        className={`template-card ${selectedLanguage.id === lang.id ? 'active' : ''}`}
                        onClick={() => handleLanguageChange(lang)}
                      >
                        <div className="template-card-header">
                          <span className="lang-color-dot" style={{ backgroundColor: lang.badgeColor }}></span>
                          <span className="template-card-name font-code">{lang.name}</span>
                        </div>
                        <div className="template-card-actions">
                          <button
                            type="button"
                            className="btn-mini"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLanguageChange(lang);
                            }}
                          >
                            Hello World
                          </button>
                          <button
                            type="button"
                            className="btn-mini"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLanguage(lang);
                              if (lang.stdinTemplate) {
                                setCode(lang.stdinTemplate);
                                setStdin('5\n10 20 30 40 50');
                                setIsStdinOpen(true);
                              }
                            }}
                          >
                            Stdin
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSidebarTab === 'api' && (
                <div className="drawer-content">
                  <div className="drawer-header">
                    <span className="font-brand drawer-title">BACKEND API TEST</span>
                  </div>
                  <p className="drawer-desc">
                    Test Firebase ID token verification against Express API endpoint (<code className="code-tag">/api/auth/me</code>).
                  </p>
                  <button
                    className="btn-secondary test-api-btn"
                    onClick={handleTestBackendAPI}
                    disabled={loadingApi}
                  >
                    {loadingApi ? 'Calling API...' : 'Test Backend Auth Endpoint'}
                  </button>

                  {apiResponse && (
                    <div className="api-response-box font-code">
                      <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </aside>

        {/* Center: Monaco Code Editor + Stdin + Output Panel */}
        <div className="editor-central-column">
          {/* Monaco Editor Container */}
          <div className="editor-wrapper">
            <CodeEditor
              code={code}
              language={selectedLanguage.monaco}
              onChange={setCode}
              onCursorChange={setCursorStats}
              onRunCode={handleRunCode}
            />
          </div>

          {/* Standard Input Panel */}
          <StdinPanel
            stdin={stdin}
            onChangeStdin={setStdin}
            isOpen={isStdinOpen}
            onToggleOpen={() => setIsStdinOpen(!isStdinOpen)}
          />

          {/* Terminal / Output Console */}
          <TerminalPanel
            executionResult={executionResult}
            isRunning={isRunning}
            onRunCode={handleRunCode}
            onClearOutput={() => setExecutionResult(null)}
          />

          {/* Bottom Editor Status Bar */}
          <div className="editor-status-bar font-code">
            <div className="status-bar-left">
              <span className="status-indicator-dot"></span>
              <span>Language: {selectedLanguage.name}</span>
              <span className="bar-separator">|</span>
              <span>Judge0 ID: {selectedLanguage.id}</span>
              <span className="bar-separator">|</span>
              <span>Ln {cursorStats.line}, Col {cursorStats.col}</span>
            </div>

            <div className="status-bar-right">
              <span className="kbd-shortcut-hint">Press <kbd>Ctrl+Enter</kbd> to Run</span>
              <span className="bar-separator">|</span>
              <span>UTF-8</span>
              <span className="bar-separator">|</span>
              <span>Spaces: 2</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .workspace-container {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 65px);
          width: 100vw;
          background: #0a0c10;
          color: #f8fafc;
          overflow: hidden;
          position: relative;
        }
        .workspace-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 18px;
          background: rgba(13, 16, 23, 0.98);
          border-bottom: 1px solid var(--border-subtle);
          z-index: 20;
          height: 52px;
          box-sizing: border-box;
        }
        .header-left, .header-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .room-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 5px 12px;
          border-radius: 20px;
        }
        .live-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-emerald);
          box-shadow: 0 0 10px var(--accent-emerald);
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.8; }
        }
        .room-name {
          font-size: 0.82rem;
          font-weight: 600;
          color: #ffffff;
        }
        .language-selector-wrapper {
          position: relative;
        }
        .btn-language-selector {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: #ffffff;
          padding: 5px 12px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .btn-language-selector:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: var(--accent-indigo);
        }
        .lang-color-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
        }
        .chevron-icon {
          transition: transform 0.2s ease;
          color: var(--text-muted);
        }
        .chevron-icon.open {
          transform: rotate(180deg);
        }
        .language-dropdown-menu {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          width: 240px;
          background: #11141d;
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 10px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.7);
          z-index: 100;
          padding: 6px;
          backdrop-filter: blur(12px);
        }
        .dropdown-label {
          font-size: 0.68rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          padding: 6px 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          margin-bottom: 4px;
        }
        .language-menu-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 7px 10px;
          border-radius: 6px;
          font-size: 0.82rem;
          color: var(--text-secondary);
          cursor: pointer;
          transition: all 0.15s;
        }
        .language-menu-item:hover {
          background: rgba(99, 102, 241, 0.15);
          color: #ffffff;
        }
        .language-menu-item.active {
          background: rgba(99, 102, 241, 0.25);
          color: #ffffff;
          font-weight: 600;
        }
        .lang-item-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .lang-id-badge {
          font-size: 0.68rem;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.05);
          padding: 1px 6px;
          border-radius: 4px;
        }
        .latency-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.74rem;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.04);
          padding: 4px 10px;
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .btn-template-switch {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--text-secondary);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .btn-template-switch:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }
        .btn-stdin-toggle {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--text-secondary);
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .btn-stdin-toggle:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }
        .btn-stdin-toggle.active {
          background: rgba(6, 182, 212, 0.15);
          border-color: rgba(6, 182, 212, 0.35);
          color: var(--accent-cyan);
        }
        .btn-run-main {
          background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
          border: none;
          color: #ffffff;
          padding: 6px 16px;
          border-radius: 8px;
          font-size: 0.84rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
          transition: all 0.2s;
        }
        .btn-run-main:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 0 20px rgba(16, 185, 129, 0.5);
        }
        .btn-run-main:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .collaborator-avatars {
          display: flex;
          align-items: center;
        }
        .avatar-pill {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .avatar-you {
          background: linear-gradient(135deg, var(--accent-indigo), var(--accent-purple));
          color: #ffffff;
          border: 2px solid rgba(255, 255, 255, 0.15);
        }
        .workspace-main-content {
          display: flex;
          flex: 1;
          height: calc(100% - 52px);
          overflow: hidden;
        }
        .workspace-sidebar {
          display: flex;
          background: #0d1017;
          border-right: 1px solid var(--border-subtle);
          z-index: 15;
        }
        .sidebar-icons {
          width: 48px;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 0;
          gap: 12px;
          border-right: 1px solid rgba(255, 255, 255, 0.05);
        }
        .sidebar-tab-btn {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .sidebar-tab-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.06);
        }
        .sidebar-tab-btn.active {
          color: var(--accent-cyan);
          background: rgba(6, 182, 212, 0.15);
        }
        .sidebar-drawer-panel {
          width: 250px;
          background: #11141d;
          border-right: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }
        .drawer-content {
          padding: 16px;
        }
        .drawer-header {
          margin-bottom: 8px;
        }
        .drawer-title {
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: var(--text-secondary);
        }
        .drawer-desc {
          font-size: 0.78rem;
          color: var(--text-muted);
          line-height: 1.4;
          margin-bottom: 12px;
        }
        .template-cards-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .template-card {
          padding: 10px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          cursor: pointer;
          transition: all 0.15s;
        }
        .template-card:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: var(--accent-indigo);
        }
        .template-card.active {
          background: rgba(99, 102, 241, 0.12);
          border-color: rgba(99, 102, 241, 0.35);
        }
        .template-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 6px;
        }
        .template-card-name {
          font-size: 0.8rem;
          font-weight: 600;
          color: #f1f5f9;
        }
        .template-card-actions {
          display: flex;
          gap: 6px;
        }
        .btn-mini {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          background: rgba(255, 255, 255, 0.08);
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          transition: background 0.15s;
        }
        .btn-mini:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }
        .test-api-btn {
          width: 100%;
          padding: 8px;
          font-size: 0.8rem;
          border-radius: 6px;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
          color: #ffffff;
          cursor: pointer;
          margin-bottom: 12px;
        }
        .test-api-btn:hover:not(:disabled) {
          background: rgba(99, 102, 241, 0.25);
        }
        .api-response-box {
          background: #0a0c10;
          padding: 10px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 0.72rem;
          overflow-x: auto;
          color: var(--accent-cyan);
          max-height: 250px;
        }
        .code-tag {
          background: rgba(255, 255, 255, 0.1);
          padding: 1px 4px;
          border-radius: 3px;
        }
        .editor-central-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          background: #0a0c10;
        }
        .editor-wrapper {
          flex: 1;
          height: 100%;
          overflow: hidden;
          position: relative;
        }
        .editor-status-bar {
          height: 26px;
          background: #0d1017;
          border-top: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          font-size: 0.72rem;
          color: var(--text-muted);
          user-select: none;
        }
        .status-bar-left, .status-bar-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .status-indicator-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent-cyan);
        }
        .bar-separator {
          color: rgba(255, 255, 255, 0.12);
        }
        .kbd-shortcut-hint {
          color: var(--text-secondary);
        }
        .kbd-shortcut-hint kbd {
          background: rgba(255, 255, 255, 0.1);
          padding: 1px 5px;
          border-radius: 3px;
          color: #ffffff;
        }
      `}</style>
    </div>
  );
};
