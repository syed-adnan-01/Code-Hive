import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { CodeEditor } from './CodeEditor';
import { TerminalPanel } from './TerminalPanel';
import { StdinPanel } from './StdinPanel';
import { RoomModal } from './RoomModal';
import { SUPPORTED_LANGUAGES, getLanguageById } from '../../config/languages';
import { runCodeAPI, fetchRunHistoryAPI } from '../../services/runService';
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
  Globe,
  History,
  Clock
} from 'lucide-react';

export const WorkspacePreview = () => {
  const { currentUser, isDemoMode } = useAuth();
  const { isDark } = useTheme();

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

  // Execution history state
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Sidebar / Drawer states
  const [activeSidebarTab, setActiveSidebarTab] = useState('');
  const [apiResponse, setApiResponse] = useState(null);
  const [loadingApi, setLoadingApi] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  // Load user execution history from backend GET /api/run/history
  const loadHistory = useCallback(async () => {
    setActiveSidebarTab('history');
    setLoadingHistory(true);
    try {
      let idToken = null;
      if (currentUser) {
        idToken = currentUser.isDemo ? 'demo-bearer-token' : await currentUser.getIdToken();
      }
      const list = await fetchRunHistoryAPI(idToken);
      setHistoryList(list);
    } catch (err) {
      console.error('Failed to load execution history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [currentUser]);

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

      // Observe room metadata for shared execution output, language, and stdin (Architecture Section 6.2 & 7)
      collab.ymeta.observe(() => {
        const lastRun = collab.ymeta.get('lastRunResult');
        if (lastRun) {
          setExecutionResult(lastRun);
        }
        const langId = collab.ymeta.get('language_id');
        if (langId) {
          const l = getLanguageById(langId);
          if (l) setSelectedLanguage(l);
        }
        const sharedStdin = collab.ymeta.get('stdin');
        if (typeof sharedStdin === 'string') {
          setStdin(sharedStdin);
        }
      });

      // Hydrate state from current ymeta values if available
      const existingRun = collab.ymeta.get('lastRunResult');
      if (existingRun) setExecutionResult(existingRun);
      const existingLang = collab.ymeta.get('language_id');
      if (existingLang) {
        const l = getLanguageById(existingLang);
        if (l) setSelectedLanguage(l);
      }
      const existingStdin = collab.ymeta.get('stdin');
      if (typeof existingStdin === 'string') setStdin(existingStdin);

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

  // Handle switching languages (synced to room meta if collaborating)
  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    setIsLangDropdownOpen(false);

    if (collabRef.current?.ymeta && userRole !== 'viewer') {
      collabRef.current.ymeta.set('language_id', lang.id);
      collabRef.current.ymeta.set('language', lang.key);
    } else if (!collabYText) {
      setCode(lang.defaultCode);
    }
    setExecutionResult(null);
  };

  // Handle updating standard input (synced to room meta if collaborating)
  const handleStdinChange = (newStdin) => {
    setStdin(newStdin);
    if (collabRef.current?.ymeta && userRole !== 'viewer') {
      collabRef.current.ymeta.set('stdin', newStdin);
    }
  };

  // Load Stdin template for the current language
  const handleLoadStdinTemplate = () => {
    if (selectedLanguage.stdinTemplate) {
      if (!collabYText) {
        setCode(selectedLanguage.stdinTemplate);
      }
      handleStdinChange('5\n10 20 30 40 50');
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
        // Sync run result to Yjs room meta for instant client-side convergence
        if (collabRef.current?.ymeta) {
          collabRef.current.ymeta.set('lastRunResult', res.submission);
        }
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
    <div className={`workspace-container ${isDark ? 'dark' : 'light'}`}>
      {/* Top Header Bar */}
      <div className={`workspace-header ${isDark ? 'dark' : 'light'}`}>
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
              className={`sidebar-tab-btn ${activeSidebarTab === 'history' ? 'active' : ''}`}
              onClick={() => (activeSidebarTab === 'history' ? setActiveSidebarTab('') : loadHistory())}
              title="Execution History"
            >
              <History size={18} />
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
                                handleStdinChange('5\n10 20 30 40 50');
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

              {activeSidebarTab === 'history' && (
                <div className="drawer-content">
                  <div className="drawer-header">
                    <span className="font-brand drawer-title">SUBMISSION HISTORY</span>
                  </div>
                  <p className="drawer-desc">
                    Your recent code executions and Judge0 run metrics (Architecture Section 5):
                  </p>
                  <button
                    className="btn-mini refresh-history-btn"
                    onClick={loadHistory}
                    disabled={loadingHistory}
                  >
                    {loadingHistory ? 'Refreshing...' : 'Refresh History'}
                  </button>
                  {loadingHistory && historyList.length === 0 ? (
                    <div className="history-empty font-code">Loading history...</div>
                  ) : historyList.length === 0 ? (
                    <div className="history-empty font-code">No execution runs recorded yet. Execute code to view history.</div>
                  ) : (
                    <div className="history-cards-list">
                      {historyList.map((item, idx) => {
                        const isSuccess = item.status?.id === 3;
                        return (
                          <div key={item.id || idx} className="history-card">
                            <div className="history-card-header">
                              <span className="history-lang font-code">{item.language}</span>
                              <span className={`history-status-badge ${isSuccess ? 'success' : 'failed'} font-code`}>
                                {item.status?.description || 'Executed'}
                              </span>
                            </div>
                            <div className="history-meta font-code">
                              <span>⏱️ {item.time || '0.000'}s</span>
                              <span>{item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}</span>
                            </div>
                            <div className="history-actions">
                              <button
                                type="button"
                                className="btn-mini"
                                onClick={() => setExecutionResult(item)}
                                title="View this execution's output in the terminal"
                              >
                                View Output
                              </button>
                              {!isReadOnly && item.code && (
                                <button
                                  type="button"
                                  className="btn-mini"
                                  onClick={() => {
                                    if (collabYText) {
                                      collabYText.delete(0, collabYText.length);
                                      collabYText.insert(0, item.code);
                                    } else {
                                      setCode(item.code);
                                    }
                                  }}
                                  title="Restore code into editor"
                                >
                                  Load Code
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
            onChangeStdin={handleStdinChange}
            isOpen={isStdinOpen}
            onToggleOpen={() => setIsStdinOpen(!isStdinOpen)}
            isReadOnly={isReadOnly}
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
          background: #f8fafc;
          color: #0f172a;
          overflow: hidden;
          position: relative;
        }
        .workspace-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 18px;
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.03);
          position: relative;
          z-index: 10 !important;
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
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          padding: 4px 14px;
          border-radius: 50px;
        }
        .room-active {
          border-color: #d8b4fe;
          background: #f3e8ff;
        }
        .solo-badge {
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
        }
        .solo-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
        }
        .live-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
          animation: pulse 2s infinite;
        }
        .live-indicator.connecting {
          background: #f59e0b;
          box-shadow: 0 0 8px rgba(245, 158, 11, 0.4);
        }
        .live-indicator.disconnected {
          background: #ef4444;
          box-shadow: 0 0 8px rgba(239, 68, 68, 0.4);
        }
        .room-name {
          font-family: 'Outfit', sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          color: #0f172a;
        }
        .room-active .room-name {
          color: #6b21a8;
        }
        .room-id-tag {
          font-size: 0.72rem;
          font-weight: 700;
          color: #6366f1;
          background: #e0e7ff;
          padding: 2px 7px;
          border-radius: 6px;
        }
        .role-pill {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 20px;
          letter-spacing: 0.04em;
        }
        .role-owner {
          background: #f3e8ff;
          color: #7c3aed;
          border: 1px solid #d8b4fe;
        }
        .role-editor {
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #a7f3d0;
        }
        .role-viewer {
          background: #fffbeb;
          color: #b45309;
          border: 1px solid #fde68a;
        }
        .sync-status-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.74rem;
          font-weight: 600;
          color: #475569;
          background: #f8fafc;
          padding: 4px 12px;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
        }
        .sync-radio.synced {
          color: #10b981;
        }
        .sync-radio.pending {
          color: #f59e0b;
        }
        .btn-share-room {
          background: #e0e7ff;
          border: 1.5px solid #c7d2fe;
          color: #4338ca;
          padding: 5px 14px;
          border-radius: 50px;
          font-size: 0.82rem;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.18s ease;
        }
        .btn-share-room:hover {
          background: #6366f1;
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
        }
        .btn-leave-room {
          background: #fef2f2;
          border: 1.5px solid #fecaca;
          color: #dc2626;
          padding: 5px 12px;
          border-radius: 50px;
          font-size: 0.8rem;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: all 0.15s ease;
        }
        .btn-leave-room:hover {
          background: #fee2e2;
        }
        .btn-open-rooms {
          background: #6366f1;
          border: none;
          color: #ffffff;
          padding: 6px 16px;
          border-radius: 50px;
          font-size: 0.82rem;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
          transition: all 0.18s ease;
        }
        .btn-open-rooms:hover {
          background: #4f46e5;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
        }
        .language-selector-wrapper {
          position: relative;
          z-index: 25;
        }
        .btn-language-selector {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          color: #1e293b;
          padding: 5px 14px;
          border-radius: 50px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.18s ease;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
        }
        .btn-language-selector:hover:not(:disabled) {
          border-color: #6366f1;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.12);
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
          color: #64748b;
        }
        .chevron-icon.open {
          transform: rotate(180deg);
        }
        .language-dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          width: 250px;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.02);
          z-index: 500 !important;
          padding: 6px;
          animation: dropdownMenuIn 0.15s ease-out;
        }
        @keyframes dropdownMenuIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dropdown-label {
          font-family: 'Outfit', sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 8px 10px 6px;
          border-bottom: 1px solid #f1f5f9;
          margin-bottom: 4px;
        }
        .language-menu-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 10px;
          border-radius: 10px;
          font-size: 0.82rem;
          color: #334155;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .language-menu-item:hover {
          background: #f1f5f9;
          color: #0f172a;
        }
        .language-menu-item.active {
          background: #e0e7ff;
          color: #4338ca;
          font-weight: 700;
        }
        .lang-item-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .lang-id-badge {
          font-size: 0.68rem;
          color: #64748b;
          background: #f1f5f9;
          padding: 2px 6px;
          border-radius: 6px;
          font-weight: 600;
        }
        .btn-template-switch {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          color: #334155;
          padding: 5px 13px;
          border-radius: 50px;
          font-size: 0.78rem;
          font-weight: 600;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s ease;
        }
        .btn-template-switch:hover {
          background: #f8fafc;
          color: #0f172a;
          border-color: #cbd5e1;
        }
        .btn-stdin-toggle {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          color: #334155;
          padding: 5px 13px;
          border-radius: 50px;
          font-size: 0.78rem;
          font-weight: 600;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.15s ease;
        }
        .btn-stdin-toggle:hover {
          background: #f8fafc;
          color: #0f172a;
          border-color: #cbd5e1;
        }
        .btn-stdin-toggle.active {
          background: #ecfeff;
          border-color: #06b6d4;
          color: #0891b2;
          font-weight: 700;
        }
        .btn-run-main {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border: none;
          color: #ffffff;
          padding: 6px 20px;
          border-radius: 50px;
          font-size: 0.86rem;
          font-weight: 800;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
          transition: all 0.2s ease;
        }
        .btn-run-main:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.45);
          filter: brightness(1.05);
        }
        .btn-run-main:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          background: #94a3b8;
          box-shadow: none;
          transform: none;
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
          font-size: 0.74rem;
          font-weight: 800;
          font-family: 'Outfit', sans-serif;
          color: #ffffff;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
        }
        .avatar-you {
          background: linear-gradient(135deg, #6366f1, #a855f7);
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }
        .workspace-main-content {
          display: flex;
          flex: 1;
          height: calc(100% - 52px);
          overflow: hidden;
        }
        .workspace-sidebar {
          display: flex;
          background: #ffffff;
          border-right: 1px solid #e2e8f0;
          z-index: 15;
        }
        .sidebar-icons {
          width: 50px;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 14px 0;
          gap: 10px;
          border-right: 1px solid #f1f5f9;
        }
        .sidebar-tab-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }
        .sidebar-tab-btn:hover {
          color: #0f172a;
          background: #f1f5f9;
        }
        .sidebar-tab-btn.active {
          color: #6366f1;
          background: #e0e7ff;
        }
        .sidebar-drawer-panel {
          width: 260px;
          background: #ffffff;
          border-right: 1px solid #e2e8f0;
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
          font-family: 'Outfit', sans-serif;
          font-size: 0.82rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          color: #0f172a;
        }
        .drawer-desc {
          font-size: 0.78rem;
          color: #64748b;
          line-height: 1.4;
          margin-bottom: 14px;
        }
        .template-cards-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .template-card {
          padding: 12px;
          border-radius: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .template-card:hover {
          background: #ffffff;
          border-color: #6366f1;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.08);
        }
        .template-card.active {
          background: #f5f3ff;
          border-color: #6366f1;
        }
        .template-card-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .template-card-name {
          font-family: 'Outfit', sans-serif;
          font-size: 0.84rem;
          font-weight: 700;
          color: #0f172a;
        }
        .template-card-actions {
          display: flex;
          gap: 6px;
        }
        .btn-mini {
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 600;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #475569;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-mini:hover {
          background: #f1f5f9;
          color: #0f172a;
          border-color: #cbd5e1;
        }
        .test-api-btn {
          width: 100%;
          padding: 10px;
          font-size: 0.84rem;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          border-radius: 50px;
          background: #111827;
          border: none;
          color: #ffffff;
          cursor: pointer;
          margin-bottom: 12px;
          transition: all 0.18s ease;
          box-shadow: 0 2px 8px rgba(17, 24, 39, 0.15);
        }
        .test-api-btn:hover:not(:disabled) {
          background: #6366f1;
          transform: translateY(-1px);
        }
        .api-response-box {
          background: #0f172a;
          padding: 12px;
          border-radius: 10px;
          border: 1px solid #1e293b;
          font-size: 0.74rem;
          overflow-x: auto;
          color: #38bdf8;
          max-height: 250px;
        }
        .code-tag {
          background: #f1f5f9;
          color: #6366f1;
          padding: 1px 5px;
          border-radius: 4px;
          font-weight: 600;
        }
        .refresh-history-btn {
          margin-bottom: 12px;
          width: 100%;
          padding: 8px;
          background: #111827;
          border: none;
          border-radius: 50px;
          color: #ffffff;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .refresh-history-btn:hover:not(:disabled) {
          background: #6366f1;
          transform: translateY(-1px);
        }
        .history-empty {
          font-size: 0.78rem;
          color: #64748b;
          padding: 14px 0;
          text-align: center;
          line-height: 1.4;
        }
        .history-cards-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .history-card {
          padding: 12px;
          border-radius: 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .history-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .history-lang {
          font-family: 'Outfit', sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          color: #0f172a;
        }
        .history-status-badge {
          font-size: 0.68rem;
          padding: 2px 7px;
          border-radius: 12px;
          font-weight: 700;
        }
        .history-status-badge.success {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }
        .history-status-badge.failed {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }
        .history-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.72rem;
          color: #64748b;
        }
        .history-actions {
          display: flex;
          gap: 6px;
          margin-top: 4px;
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
          background: #fffbeb;
          border-bottom: 1px solid #fde68a;
          color: #b45309;
          padding: 7px 18px;
          font-size: 0.8rem;
          font-weight: 600;
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
          height: 28px;
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          font-size: 0.73rem;
          color: #64748b;
          user-select: none;
        }
        .status-bar-left, .status-bar-right {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .status-indicator-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #cbd5e1;
        }
        .status-indicator-dot.connected {
          background: #10b981;
          box-shadow: 0 0 6px #10b981;
        }
        .bar-separator {
          color: #cbd5e1;
        }
        .kbd-shortcut-hint {
          color: #475569;
          font-weight: 500;
        }
        .kbd-shortcut-hint kbd {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          padding: 1px 6px;
          border-radius: 4px;
          color: #0f172a;
          font-weight: 600;
        }

        /* ── Dark Mode Workspace Theme Overrides ── */
        .workspace-container.dark {
          background: #090d16;
          color: #f1f5f9;
        }
        .workspace-header.dark {
          background: #0d121f;
          border-bottom: 1px solid #1e293b;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
        }
        .workspace-container.dark .room-badge {
          background: #111827;
          border-color: #1f2937;
          color: #f3f4f6;
        }
        .workspace-container.dark .room-active {
          background: rgba(168, 85, 247, 0.15);
          border-color: rgba(168, 85, 247, 0.4);
        }
        .workspace-container.dark .solo-badge {
          background: #111827;
          border-color: #1f2937;
        }
        .workspace-container.dark .room-name {
          color: #f8fafc;
        }
        .workspace-container.dark .room-id-tag {
          background: #1e293b;
          color: #94a3b8;
        }
        .workspace-container.dark .btn-language-selector {
          background: #111827;
          border-color: #1f2937;
          color: #f1f5f9;
        }
        .workspace-container.dark .btn-language-selector:hover {
          border-color: #6366f1;
          background: #1e293b;
        }
        .workspace-container.dark .language-dropdown-menu {
          background: #0d121f;
          border-color: #1e293b;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
        }
        .workspace-container.dark .dropdown-label {
          color: #94a3b8;
          border-bottom-color: #1e293b;
        }
        .workspace-container.dark .language-menu-item {
          color: #cbd5e1;
        }
        .workspace-container.dark .language-menu-item:hover {
          background: rgba(99, 102, 241, 0.15);
          color: #ffffff;
        }
        .workspace-container.dark .language-menu-item.active {
          background: rgba(99, 102, 241, 0.25);
          color: #818cf8;
        }
        .workspace-container.dark .lang-id-badge {
          background: #1e293b;
          color: #64748b;
        }
        .workspace-container.dark .btn-template-switch {
          background: #111827;
          border-color: #1f2937;
          color: #cbd5e1;
        }
        .workspace-container.dark .btn-template-switch:hover {
          border-color: #6366f1;
          color: #ffffff;
        }
        .workspace-container.dark .btn-stdin-toggle {
          background: #111827;
          border-color: #1f2937;
          color: #cbd5e1;
        }
        .workspace-container.dark .btn-stdin-toggle:hover {
          border-color: #6366f1;
        }
        .workspace-container.dark .btn-stdin-toggle.active {
          background: rgba(99, 102, 241, 0.2);
          border-color: #6366f1;
          color: #818cf8;
        }
        .workspace-container.dark .btn-open-rooms,
        .workspace-container.dark .btn-share-room,
        .workspace-container.dark .btn-leave-room {
          background: #111827;
          border-color: #1f2937;
          color: #f1f5f9;
        }
        .workspace-container.dark .btn-open-rooms:hover,
        .workspace-container.dark .btn-share-room:hover,
        .workspace-container.dark .btn-leave-room:hover {
          border-color: #6366f1;
        }
        .workspace-container.dark .workspace-sidebar {
          background: #0d121f;
          border-right-color: #1e293b;
        }
        .workspace-container.dark .sidebar-tab-btn {
          color: #94a3b8;
        }
        .workspace-container.dark .sidebar-tab-btn:hover {
          background: #1e293b;
          color: #f8fafc;
        }
        .workspace-container.dark .sidebar-tab-btn.active {
          background: rgba(99, 102, 241, 0.2);
          color: #818cf8;
        }
        .workspace-container.dark .sidebar-drawer-panel {
          background: #0d121f;
          border-right-color: #1e293b;
          color: #e2e8f0;
        }
        .workspace-container.dark .drawer-header {
          border-bottom-color: #1e293b;
        }
        .workspace-container.dark .drawer-title {
          color: #f8fafc;
        }
        .workspace-container.dark .drawer-desc {
          color: #94a3b8;
        }
        .workspace-container.dark .template-card,
        .workspace-container.dark .history-item-card {
          background: #111827;
          border-color: #1f2937;
        }
        .workspace-container.dark .template-card:hover,
        .workspace-container.dark .history-item-card:hover {
          border-color: #6366f1;
          background: #161f30;
        }
        .workspace-container.dark .template-card-title,
        .workspace-container.dark .history-title {
          color: #f8fafc;
        }
        .workspace-container.dark .template-card-desc,
        .workspace-container.dark .history-meta-sub {
          color: #94a3b8;
        }
        .workspace-container.dark .editor-status-bar {
          background: #0d121f;
          border-top-color: #1e293b;
          color: #94a3b8;
        }
        .workspace-container.dark .bar-separator {
          color: #334155;
        }
        .workspace-container.dark .kbd-shortcut-hint {
          color: #94a3b8;
        }
        .workspace-container.dark .kbd-shortcut-hint kbd {
          background: #1e293b;
          border-color: #334155;
          color: #cbd5e1;
        }
      `}</style>
    </div>
  );
};
