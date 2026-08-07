import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Code,
  Users,
  LogOut,
  Terminal as TerminalIcon,
  Play,
  Share2,
  Cpu,
  CheckCircle2,
  Server,
  Zap,
  Globe
} from 'lucide-react';

export const WorkspacePreview = () => {
  const { currentUser, logout, isDemoMode } = useAuth();
  const [activeTab, setActiveTab] = useState('App.jsx');
  const [apiResponse, setApiResponse] = useState(null);
  const [loadingApi, setLoadingApi] = useState(false);

  const codeSnippets = {
    'App.jsx': `import React, { useState, useEffect } from 'react';
import { CodeHiveRoom } from '@codehive/collaboration';

// 🐝 Welcome to CodeHive Workspace Room: #hive-alpha
export default function CollaborativeWorkspace() {
  const [peers, setPeers] = useState(['Alex', 'Sarah', 'You']);
  
  useEffect(() => {
    const room = CodeHiveRoom.join('hive-alpha');
    room.on('cursorChange', (cursor) => {
      console.log('Peer cursor moved:', cursor);
    });
  }, []);

  return (
    <div className="hive-editor-container">
      <h1>CodeHive Live Collaboration Active 🚀</h1>
    </div>
  );
}`,
    'server.js': `import express from 'express';
import { verifyFirebaseToken } from './authMiddleware.js';

const app = express();

app.get('/api/workspace/stream', verifyFirebaseToken, (req, res) => {
  res.json({
    status: 'connected',
    user: req.user.email,
    workspace: 'Hive Alpha',
    latencyMs: 12
  });
});`,
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
    <div className="workspace-wrapper">
      {/* Workspace Top Navigation Bar */}
      <div className="workspace-topbar glass-card">
        <div className="topbar-left">
          <div className="room-badge">
            <span className="live-indicator"></span>
            <span className="room-name">#hive-alpha-workspace</span>
          </div>

          <div className="latency-badge">
            <Zap size={13} className="text-cyan" />
            <span>12ms Latency</span>
          </div>
        </div>

        <div className="topbar-right">
          {/* Active Collaborator Avatars */}
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
            <span className="collaborator-count">+3 active</span>
          </div>

          <button className="btn-vibrant share-btn">
            <Share2 size={16} />
            <span>Share Room</span>
          </button>

          <button className="btn-secondary logout-btn" onClick={logout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="workspace-main-grid">
        {/* Left Code Editor Area */}
        <div className="editor-container glass-card">
          {/* File Tabs Header */}
          <div className="editor-tabs-bar">
            <div className="tabs-left">
              {Object.keys(codeSnippets).map((filename) => (
                <button
                  key={filename}
                  className={`file-tab ${activeTab === filename ? 'active' : ''}`}
                  onClick={() => setActiveTab(filename)}
                >
                  <Code size={14} />
                  <span>{filename}</span>
                </button>
              ))}
            </div>
            <div className="tabs-right">
              <button className="btn-run">
                <Play size={13} />
                <span>Run Code</span>
              </button>
            </div>
          </div>

          {/* Editor Body */}
          <div className="editor-code-body font-code">
            {/* Live Cursor Overlays */}
            <div className="cursor-tag cursor-alex" style={{ top: '140px', left: '260px' }}>
              <span className="cursor-pointer"></span>
              <span className="cursor-label">Alex (typing...)</span>
            </div>

            <div className="cursor-tag cursor-sarah" style={{ top: '220px', left: '180px' }}>
              <span className="cursor-pointer"></span>
              <span className="cursor-label">Sarah (viewing)</span>
            </div>

            <pre className="code-content">
              <code>{codeSnippets[activeTab]}</code>
            </pre>
          </div>
        </div>

        {/* Right Sidebar Details */}
        <div className="workspace-sidebar">
          {/* Account Profile Card */}
          <div className="sidebar-card glass-card">
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

          {/* Backend API Verification Box */}
          <div className="sidebar-card glass-card">
            <div className="card-title-row">
              <Server size={18} className="text-cyan" />
              <h4>Express Backend Integration</h4>
            </div>

            <p className="card-desc">
              Test token verification against the separated Express API server (`/api/auth/me`).
            </p>

            <button
              className="btn-secondary test-api-btn"
              onClick={handleTestBackendAPI}
              disabled={loadingApi}
            >
              {loadingApi ? 'Calling API...' : 'Fetch Protected User Profile'}
            </button>

            {apiResponse && (
              <div className="api-response-box font-code">
                <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .workspace-wrapper {
          max-width: 1300px;
          margin: 0 auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .workspace-topbar {
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .topbar-left, .topbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .room-badge {
          display: flex;
          align-items: center;
          gap: 10px;
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
          font-weight: 600;
          font-size: 0.9rem;
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
          gap: 6px;
        }
        .avatar-pill {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.78rem;
          font-weight: 700;
          color: #ffffff;
          border: 2px solid var(--bg-primary);
        }
        .avatar-1 { background: #ec4899; }
        .avatar-2 { background: #a855f7; }
        .avatar-you { background: #6366f1; overflow: hidden; }
        .avatar-img { width: 100%; height: 100%; object-fit: cover; }
        .collaborator-count {
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-left: 4px;
        }
        .share-btn { padding: 8px 16px; font-size: 0.85rem; }
        .logout-btn { padding: 8px 16px; font-size: 0.85rem; }
        .workspace-main-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 960px) {
          .workspace-main-grid {
            grid-template-columns: 1.6fr 0.9fr;
          }
        }
        .editor-container {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-height: 480px;
        }
        .editor-tabs-bar {
          background: rgba(15, 18, 26, 0.9);
          border-bottom: 1px solid var(--border-subtle);
          padding: 8px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .tabs-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .file-tab {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.84rem;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
        }
        .file-tab.active {
          background: rgba(99, 102, 241, 0.2);
          color: #ffffff;
          border: 1px solid rgba(99, 102, 241, 0.3);
        }
        .btn-run {
          background: rgba(16, 185, 129, 0.2);
          border: 1px solid rgba(16, 185, 129, 0.4);
          color: #10b981;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .editor-code-body {
          position: relative;
          padding: 20px;
          flex: 1;
          background: rgba(10, 12, 16, 0.95);
          overflow-x: auto;
        }
        .code-content {
          font-size: 0.88rem;
          color: #e2e8f0;
          line-height: 1.6;
        }
        .cursor-tag {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 4px;
          z-index: 5;
          pointer-events: none;
        }
        .cursor-pointer {
          width: 2px;
          height: 18px;
        }
        .cursor-alex .cursor-pointer { background: #ec4899; }
        .cursor-sarah .cursor-pointer { background: #a855f7; }
        .cursor-label {
          font-size: 0.68rem;
          padding: 2px 6px;
          border-radius: 4px;
          color: #ffffff;
          font-weight: 600;
        }
        .cursor-alex .cursor-label { background: #ec4899; }
        .cursor-sarah .cursor-label { background: #a855f7; }
        .workspace-sidebar {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .sidebar-card {
          padding: 24px;
        }
        .user-profile-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .user-avatar-lg {
          width: 54px;
          height: 54px;
          border-radius: 50%;
          background: var(--gradient-brand);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          font-weight: 800;
          color: #ffffff;
          overflow: hidden;
        }
        .user-avatar-lg img { width: 100%; height: 100%; object-fit: cover; }
        .user-name { font-size: 1.1rem; font-weight: 700; color: #ffffff; }
        .user-email { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 6px; }
        .user-badge {
          font-size: 0.72rem;
          color: var(--accent-cyan);
          background: rgba(6, 182, 212, 0.12);
          padding: 3px 8px;
          border-radius: 6px;
          width: fit-content;
        }
        .card-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
          color: #ffffff;
        }
        .card-desc { font-size: 0.86rem; color: var(--text-secondary); margin-bottom: 16px; }
        .test-api-btn { width: 100%; font-size: 0.88rem; padding: 10px; }
        .api-response-box {
          margin-top: 14px;
          padding: 12px;
          background: rgba(10, 12, 16, 0.8);
          border: 1px solid var(--border-subtle);
          border-radius: 8px;
          font-size: 0.78rem;
          color: var(--accent-emerald);
          max-height: 180px;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
};
