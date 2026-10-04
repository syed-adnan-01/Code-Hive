import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CodeEditor } from './CodeEditor';
import { TerminalPanel } from './TerminalPanel';
import { StdinPanel } from './StdinPanel';
import { RoomModal } from './RoomModal';
import { SUPPORTED_LANGUAGES, getLanguageById } from '../../config/languages';
import { runCodeAPI } from '../../services/runService';
import {
  createRoomAPI,
  getRoomAPI,
  getRoomTicketAPI,
  setupHocuspocusCollab,
} from '../../services/collabService';
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
  RotateCcw,
  Check,
  Copy,
  LogOut,
  Radio,
  Lock,
  Globe
} from 'lucide-react';

export const WorkspacePreview = () => {
  const { currentUser, isDemoMode } = useAuth();

  // Active language and code state (Solo mode defaults)
  const [selectedLanguage, setSelectedLanguage] = useState(SUPPORTED_LANGUAGES[0]);
  const [code, setCode] = useState(SUPPORTED_LANGUAGES[0].defaultCode);
  const [stdin, setStdin] = useState('');
  const [isStdinOpen, setIsStdinOpen] = useState(false);

  // Execution state
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [cursorStats, setCursorStats] = useState({ line: 1, col: 1 });

  // Collaboration Room states
  const [currentRoom, setCurrentRoom] = useState(null);
  const [userRole, setUserRole] = useState('editor'); // 'owner' | 'editor' | 'viewer'
  const [collabStatus, setCollabStatus] = useState('solo'); // 'solo' | 'connecting' | 'connected' | 'disconnected'
  const [activePeers, setActivePeers] = useState([]);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isShareCopied, setIsShareCopied] = useState(false);
  const [roomActionLoading, setRoomActionLoading] = useState(false);

  // Yjs Collaboration References
  const collabRef = useRef(null);
  const [collabYText, setCollabYText] = useState(null);
  const [collabProvider, setCollabProvider] = useState(null);

  // Sidebar / Drawer states
  const [activeSidebarTab, setActiveSidebarTab] = useState('');
  const [apiResponse, setApiResponse] = useState(null);
  const [loadingApi, setLoadingApi] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  // Clean up collaboration session
  const leaveRoom = useCallback(() => {
    if (collabRef.current) {
      collabRef.current.destroy();
      collabRef.current = null;
    }
    setCollabYText(null);
    setCollabProvider(null);
    setCurrentRoom(null);
    setUserRole('editor');
    setCollabStatus('solo');
    setActivePeers([]);

    // Clear URL query param if present
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.replaceState({}, '', url.toString());
  }, []);

  // Connect to a collaboration room
  const connectToRoom = useCallback(async (roomId) => {
    setRoomActionLoading(true);
    leaveRoom();

    try {
      let idToken = null;
      if (currentUser) {
        idToken = currentUser.isDemo ? 'demo-bearer-token' : await currentUser.getIdToken();
      }

      // 1. Fetch Room metadata
      const room = await getRoomAPI(roomId, idToken);
      setCurrentRoom(room);
      setUserRole(room.userRole || 'editor');

      // Update active language if room has a preferred language
      if (room.language_id) {
        const lang = getLanguageById(room.language_id);
        setSelectedLanguage(lang);
      }

      // 2. Obtain short-lived single-use ticket (Architecture Section 6.1)
      const ticketRes = await getRoomTicketAPI(roomId, idToken);
      const ticket = ticketRes.ticket;

      setCollabStatus('connecting');

      // 3. Connect to Hocuspocus with Ticket
      const collab = setupHocuspocusCollab({
        roomId,
        ticket,
        user: currentUser,
        role: room.userRole || 'editor',
        onStatusChange: (status) => {
          setCollabStatus(status);
        },
        onPeersChange: (peers) => {
          setActivePeers(peers);
        },
        onSynced: () => {
          setCollabStatus('connected');
        },
      });

      collabRef.current = collab;
      setCollabYText(collab.ytext);
      setCollabProvider(collab.provider);

      // Update URL query param so user can refresh or share easily
      const url = new URL(window.location.href);
      url.searchParams.set('room', roomId);
      window.history.replaceState({}, '', url.toString());
    } catch (err) {
      console.error('Error connecting to room:', err);
      alert(`Could not join room: ${err.message}`);
      leaveRoom();
    } finally {
      setRoomActionLoading(false);
    }
  }, [currentUser, leaveRoom]);

  // Handle Create Room
  const handleCreateRoom = async ({ name, language_id, linkAccess }) => {
    let idToken = null;
    if (currentUser) {
      idToken = currentUser.isDemo ? 'demo-bearer-token' : await currentUser.getIdToken();
    }

    const room = await createRoomAPI({
      name,
      language_id,
      linkAccess,
      idToken,
    });

    await connectToRoom(room.id);
  };

  // Handle Share Room link copy
  const handleCopyShareLink = () => {
    if (!currentRoom) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?room=${currentRoom.id}`;
    navigator.clipboard.writeText(shareUrl);
    setIsShareCopied(true);
    setTimeout(() => setIsShareCopied(false), 2500);
  };

  // Check URL query on initial load for room invitation (?room=hive-xxxx)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam && !currentRoom) {
      connectToRoom(roomParam);
    }
  }, [connectToRoom, currentRoom]);

  // Handle switching languages
  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    setIsLangDropdownOpen(false);

    if (!collabYText) {
      setCode(lang.defaultCode);
    }
    setExecutionResult(null);
  };

  // Load Stdin template for the current language
  const handleLoadStdinTemplate = () => {
    if (selectedLanguage.stdinTemplate) {
      if (!collabYText) {
        setCode(selectedLanguage.stdinTemplate);
      }
      setStdin('5\n10 20 30 40 50');
      setIsStdinOpen(true);
      setExecutionResult(null);
    }
  };

  // Reset to default Hello World template
  const handleResetTemplate = () => {
    if (!collabYText) {
      setCode(selectedLanguage.defaultCode);
    }
    setExecutionResult(null);
  };

  // Execute Code via Judge0 backend API (supporting live room doc per Architecture Section 6.2)
  const handleRunCode = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);

    try {
      let idToken = null;
      if (currentUser) {
        idToken = currentUser.isDemo ? 'demo-bearer-token' : await currentUser.getIdToken();
      }

      // If in collaborative room, execute server's copy of room document
      const res = await runCodeAPI({
        source_code: collabYText ? collabYText.toString() : code,
        language_id: selectedLanguage.id,
        stdin,
        roomId: currentRoom ? currentRoom.id : undefined,
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
  }, [code, collabYText, currentRoom, selectedLanguage, stdin, currentUser, isRunning]);

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

  const isReadOnly = userRole === 'viewer';

  return (
    <div className="workspace-container">
      {/* Top Header Bar */}
      <div className="workspace-header">
        <div className="header-left">
          {/* Room / Mode Badge */}
          {currentRoom ? (
            <div className="room-badge room-active">
              <span className={`live-indicator ${collabStatus}`}></span>
              <span className="room-name font-brand">{currentRoom.name}</span>
              <span className="room-id-tag font-code">#{currentRoom.id}</span>

              {/* Role Badge */}
              <span className={`role-pill role-${userRole}`}>
                {userRole === 'viewer' ? <Lock size={11} /> : <Globe size={11} />}
                <span>{userRole.toUpperCase()}</span>
              </span>
            </div>
          ) : (
            <div className="room-badge solo-badge">
              <span className="solo-dot"></span>
              <span className="room-name font-brand">Solo Playground</span>
            </div>
          )}

          {/* Language Selector Dropdown */}
          <div className="language-selector-wrapper">
            <button
              type="button"
              className="btn-language-selector font-code"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              disabled={isReadOnly}
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

          {/* Room Sync Status Indicator */}
          {currentRoom && (
            <div className="sync-status-indicator font-code">
              <Radio size={13} className={`sync-radio ${collabStatus === 'connected' ? 'synced' : 'pending'}`} />
              <span>{collabStatus === 'connected' ? 'Live Synced' : collabStatus === 'connecting' ? 'Syncing...' : 'Disconnected'}</span>
            </div>
          )}
        </div>

        <div className="header-right">
          {/* Room Actions */}
          {currentRoom ? (
            <>
              <button
                type="button"
                className="btn-share-room font-brand"
                onClick={handleCopyShareLink}
                title="Copy Room Invitation Link"
              >
                {isShareCopied ? <Check size={14} className="text-emerald" /> : <Share2 size={14} />}
                <span>{isShareCopied ? 'Link Copied!' : 'Share Room'}</span>
              </button>

              <button
                type="button"
                className="btn-leave-room font-brand"
                onClick={leaveRoom}
                title="Leave Collaboration Room"
              >
                <LogOut size={13} />
                <span>Leave</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              className="btn-open-rooms font-brand"
              onClick={() => setIsRoomModalOpen(true)}
              title="Collaborate with peers in real time"
            >
              <Users2 size={14} />
              <span>Rooms / Collaborate</span>
            </button>
          )}

          {/* Quick Template Switchers (Solo mode or editable) */}
          {!isReadOnly && !currentRoom && (
            <>
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
            </>
          )}

          {/* Stdin Drawer Toggle */}
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
            disabled={isRunning || isReadOnly}
            title={isReadOnly ? 'Viewers cannot execute code' : 'Run Code via Judge0 API (Ctrl + Enter)'}
          >
            <Play size={14} className="fill-current" />
            <span>{isRunning ? 'Running...' : isReadOnly ? 'View Only' : 'Run Code'}</span>
          </button>

          {/* Collaborator Avatars */}
          <div className="collaborator-avatars" title="Connected Collaborators">
            {activePeers.length > 0 ? (
              activePeers.map((peer, idx) => (
                <div
                  key={idx}
                  className="avatar-pill font-code"
                  style={{ backgroundColor: peer.color || '#6366f1' }}
                  title={`${peer.name} (${peer.role || 'editor'})`}
                >
                  {peer.name ? peer.name.slice(0, 2).toUpperCase() : 'PE'}
                </div>
              ))
            ) : (
              <div className="avatar-pill avatar-you font-code" title="You">YOU</div>
            )}
          </div>
        </div>
      </div>

      {/* Main Workspace Layout */}
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
              className={`sidebar-tab-btn ${activeSidebarTab === 'rooms' ? 'active' : ''}`}
              onClick={() => setIsRoomModalOpen(true)}
              title="Create or Join Live Rooms"
            >
              <Users2 size={18} />
            </button>
            <button
              className={`sidebar-tab-btn ${activeSidebarTab === 'api' ? 'active' : ''}`}
              onClick={() => setActiveSidebarTab(activeSidebarTab === 'api' ? '' : 'api')}
              title="Test Backend Auth Token Verification"
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
                                if (!collabYText) setCode(lang.stdinTemplate);
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

        {/* Center: Monaco Editor + Stdin + Output Panel */}
        <div className="editor-central-column">
          {/* Read-Only Viewer Warning Banner */}
          {isReadOnly && (
            <div className="viewer-warning-banner">
              <Lock size={14} />
              <span>You have connected as a Viewer (Read-only). Edits and execution are restricted to room editors.</span>
            </div>
          )}

          {/* Monaco Editor Container */}
          <div className="editor-wrapper">
            <CodeEditor
              code={code}
              language={selectedLanguage.monaco}
              onChange={setCode}
              onCursorChange={setCursorStats}
              onRunCode={handleRunCode}
              isReadOnly={isReadOnly}
              ytext={collabYText}
              provider={collabProvider}
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
              <span className={`status-indicator-dot ${collabStatus === 'connected' ? 'connected' : ''}`}></span>
              <span>{currentRoom ? `Room: ${currentRoom.id} (${userRole})` : 'Solo Mode'}</span>
              <span className="bar-separator">|</span>
              <span>Language: {selectedLanguage.name}</span>
              <span className="bar-separator">|</span>
              <span>Ln {cursorStats.line}, Col {cursorStats.col}</span>
            </div>

            <div className="status-bar-right">
              <span className="kbd-shortcut-hint">
                {isReadOnly ? 'Viewer Mode' : <>Press <kbd>Ctrl+Enter</kbd> to Run</>}
              </span>
              <span className="bar-separator">|</span>
              <span>Yjs CRDT</span>
              <span className="bar-separator">|</span>
              <span>UTF-8</span>
            </div>
          </div>
        </div>
      </div>

      {/* Room Modal (Create / Join) */}
      <RoomModal
        isOpen={isRoomModalOpen}
        onClose={() => setIsRoomModalOpen(false)}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={connectToRoom}
        loading={roomActionLoading}
      />

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
          padding: 4px 12px;
          border-radius: 20px;
        }
        .room-active {
          border-color: rgba(99, 102, 241, 0.4);
          background: rgba(99, 102, 241, 0.1);
        }
        .solo-badge {
          background: rgba(255, 255, 255, 0.03);
        }
        .solo-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--text-muted);
        }
        .live-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-emerald);
          box-shadow: 0 0 10px var(--accent-emerald);
          animation: pulse 2s infinite;
        }
        .live-indicator.connecting {
          background: var(--accent-amber);
          box-shadow: 0 0 10px var(--accent-amber);
        }
        .live-indicator.disconnected {
          background: #ef4444;
          box-shadow: 0 0 10px #ef4444;
        }
        .room-name {
          font-size: 0.82rem;
          font-weight: 600;
          color: #ffffff;
        }
        .room-id-tag {
          font-size: 0.72rem;
          color: var(--accent-cyan);
          background: rgba(6, 182, 212, 0.15);
          padding: 1px 6px;
          border-radius: 4px;
        }
        .role-pill {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 10px;
          letter-spacing: 0.04em;
        }
        .role-owner {
          background: rgba(168, 85, 247, 0.2);
          color: var(--accent-purple);
          border: 1px solid rgba(168, 85, 247, 0.35);
        }
        .role-editor {
          background: rgba(16, 185, 129, 0.2);
          color: var(--accent-emerald);
          border: 1px solid rgba(16, 185, 129, 0.35);
        }
        .role-viewer {
          background: rgba(245, 158, 11, 0.2);
          color: var(--accent-amber);
          border: 1px solid rgba(245, 158, 11, 0.35);
        }
        .sync-status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.74rem;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.04);
          padding: 4px 10px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .sync-radio.synced {
          color: var(--accent-emerald);
        }
        .sync-radio.pending {
          color: var(--accent-amber);
        }
        .btn-share-room {
          background: rgba(99, 102, 241, 0.18);
          border: 1px solid rgba(99, 102, 241, 0.4);
          color: #ffffff;
          padding: 5px 12px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .btn-share-room:hover {
          background: rgba(99, 102, 241, 0.3);
          box-shadow: 0 0 12px rgba(99, 102, 241, 0.3);
        }
        .btn-leave-room {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.25);
          color: #fca5a5;
          padding: 5px 10px;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: all 0.15s;
        }
        .btn-leave-room:hover {
          background: rgba(239, 68, 68, 0.22);
        }
        .btn-open-rooms {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2));
          border: 1px solid rgba(99, 102, 241, 0.35);
          color: #ffffff;
          padding: 5px 12px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .btn-open-rooms:hover {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.35), rgba(168, 85, 247, 0.35));
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.3);
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
        .btn-language-selector:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          border-color: var(--accent-indigo);
        }
        .btn-language-selector:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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
          background: #475569;
          box-shadow: none;
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
          font-size: 0.72rem;
          font-weight: 700;
          color: #ffffff;
          border: 2px solid rgba(255, 255, 255, 0.18);
          box-shadow: 0 0 8px rgba(0, 0, 0, 0.4);
        }
        .avatar-you {
          background: linear-gradient(135deg, var(--accent-indigo), var(--accent-purple));
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
        .viewer-warning-banner {
          background: rgba(245, 158, 11, 0.12);
          border-bottom: 1px solid rgba(245, 158, 11, 0.3);
          color: var(--accent-amber);
          padding: 6px 16px;
          font-size: 0.78rem;
          display: flex;
          align-items: center;
          gap: 8px;
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
          background: var(--text-muted);
        }
        .status-indicator-dot.connected {
          background: var(--accent-emerald);
          box-shadow: 0 0 6px var(--accent-emerald);
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
