import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FileExplorer } from './FileExplorer';
import { CodeEditor } from './CodeEditor';
import { TerminalPanel } from './TerminalPanel';
import {
  Code,
  LogOut,
  Play,
  Share2,
  Zap,
  Server,
  X,
  FolderTree,
  User,
  CheckCircle2
} from 'lucide-react';

const INITIAL_FILES = {
  'App.jsx': `import React, { useState, useEffect } from 'react';

// 🐝 Welcome to CodeHive Workspace Room: #hive-alpha
export default function CodeHiveApp() {
  const [peers, setPeers] = useState(['Alex', 'Sarah', 'You']);
  const [status, setStatus] = useState('Syncing code changes live...');

  const handleExecute = () => {
    console.log('🐝 Executing CodeHive Live Application...');
    return 'Hive engine active across 3 peers!';
  };

  return (
    <div className="hive-workspace">
      <h1>CodeHive Live Collaboration Room 🚀</h1>
      <p>{status}</p>
    </div>
  );
}`,
  'server.js': `import express from 'express';
import { verifyFirebaseToken } from './authMiddleware.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.get('/api/workspace/stream', verifyFirebaseToken, (req, res) => {
  res.json({
    status: 'connected',
    user: req.user.email,
    workspace: 'Hive Alpha',
    latencyMs: 12
  });
});

console.log(\`Server initialized on port \${PORT}\`);`,
  'styles.css': `/* CodeHive Workspace Theme Variables */
.hive-workspace {
  background: rgba(15, 18, 26, 0.95);
  color: #f8fafc;
  padding: 24px;
  border-radius: 16px;
  border: 1px solid rgba(99, 102, 241, 0.3);
}`,
  'utils.js': `// Helper functions for CodeHive collaboration
export const calculateLatency = (t1, t2) => Math.abs(t2 - t1);

export const formatUserInitials = (name) => {
  if (!name) return 'U';
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};`
};

export const WorkspacePreview = () => {
  const { currentUser, logout } = useAuth();
  const [files, setFiles] = useState(INITIAL_FILES);
  const [activeFile, setActiveFile] = useState('App.jsx');
  const [openTabs, setOpenTabs] = useState(['App.jsx', 'server.js']);
  const [dirtyFiles, setDirtyFiles] = useState(new Set());
  const [logs, setLogs] = useState([
    {
      type: 'info',
      message: 'CodeHive IDE Engine initialized successfully. Ready for live editing.',
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [cursorStats, setCursorStats] = useState({ line: 1, col: 1 });
  const [sidebarTab, setSidebarTab] = useState('explorer'); // 'explorer' | 'profile' | 'api'
  const [apiResponse, setApiResponse] = useState(null);
  const [loadingApi, setLoadingApi] = useState(false);

  // File Management
  const handleSelectFile = (filename) => {
    setActiveFile(filename);
    if (!openTabs.includes(filename)) {
      setOpenTabs([...openTabs, filename]);
    }
  };

  const handleCloseTab = (filename, e) => {
    e.stopPropagation();
    const filtered = openTabs.filter(t => t !== filename);
    setOpenTabs(filtered);
    if (activeFile === filename && filtered.length > 0) {
      setActiveFile(filtered[filtered.length - 1]);
    }
  };

  const handleAddFile = (newFilename) => {
    if (files[newFilename]) return;
    setFiles({
      ...files,
      [newFilename]: `// New file: ${newFilename}\n\nconsole.log("Hello from ${newFilename}");`
    });
    setOpenTabs([...openTabs, newFilename]);
    setActiveFile(newFilename);
    setLogs(prev => [
      ...prev,
      {
        type: 'info',
        message: `Created new file: ${newFilename}`,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  const handleDeleteFile = (filename) => {
    if (Object.keys(files).length <= 1) return;
    const remaining = { ...files };
    delete remaining[filename];
    setFiles(remaining);
    const filteredTabs = openTabs.filter(t => t !== filename);
    setOpenTabs(filteredTabs);
    if (activeFile === filename && filteredTabs.length > 0) {
      setActiveFile(filteredTabs[0]);
    }
  };

  const handleCodeChange = (newCode) => {
    setFiles({
      ...files,
      [activeFile]: newCode
    });
    if (!dirtyFiles.has(activeFile)) {
      setDirtyFiles(new Set(dirtyFiles).add(activeFile));
    }
  };

  // Code Execution Runner
  const handleRunCode = () => {
    setIsRunning(true);
    const startTime = performance.now();
    const currentCode = files[activeFile];
    const timestamp = new Date().toLocaleTimeString();

    // Clear saved dirty state on run
    const updatedDirty = new Set(dirtyFiles);
    updatedDirty.delete(activeFile);
    setDirtyFiles(updatedDirty);

    setTimeout(() => {
      try {
        const capturedLogs = [];
        // Safe evaluation / log capture simulation
        const customConsole = {
          log: (...args) => capturedLogs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')),
          warn: (...args) => capturedLogs.push(`[WARN] ${args.join(' ')}`),
          error: (...args) => capturedLogs.push(`[ERROR] ${args.join(' ')}`)
        };

        // If JS/JSX, try extracting console statements or evaluating simple expressions safely
        if (activeFile.endsWith('.js') || activeFile.endsWith('.jsx')) {
          const fn = new Function('console', currentCode);
          fn(customConsole);
        }

        const endTime = performance.now();
        const duration = (endTime - startTime).toFixed(1);

        const newEntries = [];
        if (capturedLogs.length > 0) {
          capturedLogs.forEach(msg => {
            newEntries.push({ type: 'info', message: msg, timestamp });
          });
        }
        newEntries.push({
          type: 'success',
          message: `Executed ${activeFile} successfully in ${duration}ms`,
          timestamp
        });

        setLogs(prev => [...prev, ...newEntries]);
      } catch (err) {
        setLogs(prev => [
          ...prev,
          {
            type: 'error',
            message: `Runtime Error in ${activeFile}: ${err.message}`,
            timestamp
          }
        ]);
      } finally {
        setIsRunning(false);
      }
    }, 250);
  };

  const handleTestBackendAPI = async () => {
    setLoadingApi(true);
    setApiResponse(null);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const token = currentUser.isDemo ? 'demo-bearer-token' : await currentUser.getIdToken();

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
      {/* Top Bar Header */}
      <div className="workspace-header glass-card">
        <div className="header-left">
          <div className="room-badge">
            <span className="live-indicator"></span>
            <span className="room-name font-brand">#hive-alpha-workspace</span>
          </div>

          <div className="latency-badge">
            <Zap size={13} className="text-cyan" />
            <span>12ms Latency</span>
          </div>
        </div>

        <div className="header-right">
          {/* Active Collaborators */}
          <div className="collaborator-avatars">
            <div className="avatar-pill avatar-1" title="Alex (Active)">AM</div>
            <div className="avatar-pill avatar-2" title="Sarah (Active)">SK</div>
            <div className="avatar-pill avatar-you" title="You">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="User" className="avatar-img" />
              ) : (
                (currentUser?.displayName || currentUser?.email || 'U')[0].toUpperCase()
              )}
            </div>
            <span className="collaborator-count">+3 live</span>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="sidebar-tabs">
            <button
              className={`sidebar-tab-btn ${sidebarTab === 'explorer' ? 'active' : ''}`}
              onClick={() => setSidebarTab('explorer')}
              title="File Explorer"
            >
              <FolderTree size={15} />
              <span>Files</span>
            </button>
            <button
              className={`sidebar-tab-btn ${sidebarTab === 'profile' ? 'active' : ''}`}
              onClick={() => setSidebarTab('profile')}
              title="User Account"
            >
              <User size={15} />
              <span>Profile</span>
            </button>
            <button
              className={`sidebar-tab-btn ${sidebarTab === 'api' ? 'active' : ''}`}
              onClick={() => setSidebarTab('api')}
              title="Express API Integration"
            >
              <Server size={15} />
              <span>Backend API</span>
            </button>
          </div>

          <button className="btn-vibrant share-btn">
            <Share2 size={15} />
            <span>Share Room</span>
          </button>

          <button className="btn-secondary logout-btn" onClick={logout}>
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main IDE Body Layout */}
      <div className="ide-layout-grid glass-card">
        {/* Left Sidebar Section */}
        <div className="ide-sidebar">
          {sidebarTab === 'explorer' && (
            <FileExplorer
              files={files}
              activeFile={activeFile}
              onSelectFile={handleSelectFile}
              onAddFile={handleAddFile}
              onDeleteFile={handleDeleteFile}
            />
          )}

          {sidebarTab === 'profile' && (
            <div className="sidebar-profile-card">
              <div className="user-profile-header">
                <div className="user-avatar-lg">
                  {currentUser?.photoURL ? (
                    <img src={currentUser.photoURL} alt="User" />
                  ) : (
                    (currentUser?.displayName || currentUser?.email || 'U')[0].toUpperCase()
                  )}
                </div>
                <div className="user-info">
                  <h3 className="user-name">{currentUser?.displayName || 'CodeHive Engineer'}</h3>
                  <p className="user-email">{currentUser?.email}</p>
                  <div className="user-badge">
                    {currentUser?.isDemo ? 'Demo Session User' : 'Authenticated via Firebase'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {sidebarTab === 'api' && (
            <div className="sidebar-api-card">
              <div className="card-title-row">
                <Server size={18} className="text-cyan" />
                <h4>Express Backend API</h4>
              </div>
              <p className="card-desc">
                Test Firebase ID token verification against Express API endpoint (`/api/auth/me`).
              </p>
              <button
                className="btn-secondary test-api-btn"
                onClick={handleTestBackendAPI}
                disabled={loadingApi}
              >
                {loadingApi ? 'Calling API...' : 'Test Backend Endpoint'}
              </button>
              {apiResponse && (
                <div className="api-response-box font-code">
                  <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Center/Main Code Editor Window */}
        <div className="ide-main-window">
          {/* File Tabs Header */}
          <div className="editor-tabs-bar">
            <div className="tabs-scroll-area">
              {openTabs.map((filename) => (
                <div
                  key={filename}
                  className={`editor-tab ${activeFile === filename ? 'active' : ''}`}
                  onClick={() => setActiveFile(filename)}
                >
                  <Code size={14} className="tab-icon text-indigo" />
                  <span className="tab-filename font-code">{filename}</span>
                  {dirtyFiles.has(filename) && <span className="dirty-dot">•</span>}
                  {openTabs.length > 1 && (
                    <button
                      className="tab-close-btn"
                      onClick={(e) => handleCloseTab(filename, e)}
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="tabs-actions">
              <button
                className="btn-run-code"
                onClick={handleRunCode}
                disabled={isRunning}
              >
                <Play size={13} />
                <span>{isRunning ? 'Running...' : 'Run Code'}</span>
              </button>
            </div>
          </div>

          {/* Interactive Code Editor */}
          <CodeEditor
            code={files[activeFile] || ''}
            onChange={handleCodeChange}
            onCursorChange={setCursorStats}
            onRunCode={handleRunCode}
            filename={activeFile}
          />

          {/* Console Output Drawer */}
          <TerminalPanel
            logs={logs}
            onClearLogs={() => setLogs([])}
            onRunCode={handleRunCode}
            isRunning={isRunning}
          />

          {/* Status Bar */}
          <div className="editor-status-bar font-code">
            <div className="status-left">
              <span>Ln {cursorStats.line}, Col {cursorStats.col}</span>
              <span className="status-divider">|</span>
              <span>Spaces: 2</span>
              <span className="status-divider">|</span>
              <span>UTF-8</span>
            </div>

            <div className="status-right">
              <span className="status-lang">
                {activeFile.endsWith('.jsx') ? 'JavaScript (JSX)' : activeFile.endsWith('.css') ? 'CSS3' : 'JavaScript'}
              </span>
              <span className="status-divider">|</span>
              <span className="status-ready text-emerald">
                <CheckCircle2 size={12} /> Ready
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .workspace-container {
          width: 100%;
          height: calc(100vh - 67px);
          padding: 12px 16px 16px 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          box-sizing: border-box;
          overflow: hidden;
        }
        .workspace-header {
          padding: 10px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          border-radius: 16px;
        }
        .header-left, .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .room-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
          padding: 6px 14px;
          border-radius: 20px;
        }
        .live-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 10px #10b981;
        }
        .room-name {
          font-weight: 700;
          font-size: 0.88rem;
          color: #ffffff;
        }
        .latency-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }
        .collaborator-avatars {
          display: flex;
          align-items: center;
          gap: 4px;
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
          color: #ffffff;
          border: 2px solid var(--bg-primary);
        }
        .avatar-1 { background: #ec4899; }
        .avatar-2 { background: #a855f7; }
        .avatar-you { background: #6366f1; overflow: hidden; }
        .avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .collaborator-count {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-left: 4px;
        }
        .sidebar-tabs {
          display: flex;
          background: rgba(15, 18, 26, 0.8);
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
          padding: 3px;
          gap: 2px;
        }
        .sidebar-tab-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 6px 12px;
          font-size: 0.8rem;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }
        .sidebar-tab-btn:hover {
          color: var(--text-primary);
        }
        .sidebar-tab-btn.active {
          background: rgba(99, 102, 241, 0.25);
          color: #ffffff;
          border: 1px solid rgba(99, 102, 241, 0.4);
        }
        .share-btn { padding: 8px 16px; font-size: 0.85rem; }
        .logout-btn { padding: 8px 16px; font-size: 0.85rem; }

        /* Main IDE Grid */
        .ide-layout-grid {
          display: grid;
          grid-template-columns: 240px 1fr;
          overflow: hidden;
          flex: 1;
          height: 100%;
          border-radius: 16px;
        }
        @media (max-width: 860px) {
          .ide-layout-grid {
            grid-template-columns: 1fr;
          }
        }
        .ide-sidebar {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        .sidebar-profile-card, .sidebar-api-card {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .user-profile-header {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .user-avatar-lg {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: var(--gradient-brand);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          font-weight: 800;
          color: #ffffff;
          overflow: hidden;
        }
        .user-avatar-lg img { width: 100%; height: 100%; object-fit: cover; }
        .user-name { font-size: 1rem; font-weight: 700; color: #ffffff; }
        .user-email { font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 4px; }
        .user-badge {
          font-size: 0.7rem;
          color: var(--accent-cyan);
          background: rgba(6, 182, 212, 0.12);
          padding: 3px 8px;
          border-radius: 6px;
          width: fit-content;
        }
        .card-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #ffffff;
        }
        .card-desc { font-size: 0.82rem; color: var(--text-secondary); }
        .test-api-btn { width: 100%; font-size: 0.85rem; padding: 8px; }
        .api-response-box {
          padding: 10px;
          background: rgba(10, 12, 16, 0.85);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          font-size: 0.75rem;
          color: var(--accent-emerald);
          max-height: 180px;
          overflow-y: auto;
        }

        /* IDE Main Window */
        .ide-main-window {
          display: flex;
          flex-direction: column;
          background: rgba(10, 12, 16, 0.95);
          overflow: hidden;
          flex: 1;
          height: 100%;
        }
        .editor-tabs-bar {
          background: rgba(15, 18, 26, 0.95);
          border-bottom: 1px solid var(--border-subtle);
          padding: 0 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 42px;
        }
        .tabs-scroll-area {
          display: flex;
          align-items: center;
          gap: 4px;
          overflow-x: auto;
        }
        .editor-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: rgba(255, 255, 255, 0.02);
          border-right: 1px solid rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
          font-size: 0.82rem;
          cursor: pointer;
          border-top: 2px solid transparent;
          transition: background 0.15s, color 0.15s;
        }
        .editor-tab:hover {
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-primary);
        }
        .editor-tab.active {
          background: rgba(10, 12, 16, 0.95);
          color: #ffffff;
          border-top-color: var(--accent-indigo);
          font-weight: 500;
        }
        .dirty-dot {
          color: var(--accent-cyan);
          font-size: 1.2rem;
          line-height: 0;
        }
        .tab-close-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 2px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, color 0.15s;
        }
        .tab-close-btn:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }
        .tabs-actions {
          display: flex;
          align-items: center;
        }
        .btn-run-code {
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.4);
          color: #10b981;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background 0.2s, transform 0.1s;
        }
        .btn-run-code:hover:not(:disabled) {
          background: rgba(16, 185, 129, 0.3);
          transform: translateY(-1px);
        }

        /* Status Bar */
        .editor-status-bar {
          background: rgba(15, 18, 26, 0.95);
          border-top: 1px solid var(--border-subtle);
          padding: 4px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.74rem;
          color: var(--text-muted);
          user-select: none;
        }
        .status-left, .status-right {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .status-divider {
          opacity: 0.3;
        }
        .status-ready {
          display: flex;
          align-items: center;
          gap: 4px;
          font-weight: 600;
        }
        .text-cyan { color: var(--accent-cyan); }
        .text-emerald { color: var(--accent-emerald); }
        .text-indigo { color: var(--accent-indigo); }
      `}</style>
    </div>
  );
};
