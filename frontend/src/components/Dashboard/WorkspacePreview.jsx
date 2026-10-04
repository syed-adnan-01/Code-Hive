import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as Y from 'yjs';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { CodeEditor } from './CodeEditor';
import { TerminalPanel } from './TerminalPanel';
import { StdinPanel } from './StdinPanel';
import { RoomModal } from './RoomModal';
import { FileExplorer } from './FileExplorer';
import { ChatPanel } from './ChatPanel';
import { AdminPanel } from '../Admin/AdminPanel';
import { AiDebugModal } from './AiDebugModal';
import { CallPanel } from './CallPanel';
import { debugCodeAPI } from '../../services/aiService';
import { SUPPORTED_LANGUAGES, getLanguageById, getLanguageByFilename } from '../../config/languages';
import { runCodeAPI, fetchRunHistoryAPI } from '../../services/runService';
import {
  createRoomAPI,
  getRoomAPI,
  getRoomTicketAPI,
  setupHocuspocusCollab,
  getAuthTokenForRoom,
  markTabRoomAsCreated,
  isTabRoomCreator,
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
  Clock,
  Folder,
  FolderOpen,
  Plus,
  X,
  FileText,
  Code2,
  FileJson,
  MessageSquare,
  Video,
  PhoneCall,
  Mail,
} from 'lucide-react';

export const WorkspacePreview = () => {
  const { currentUser, isDemoMode } = useAuth();
  const { isDark } = useTheme();

  // Multi-file Workspace state (IDE Extension Plan Section 3)
  const [files, setFiles] = useState({
    main: {
      id: 'main',
      name: `main.${SUPPORTED_LANGUAGES[0].extension || 'js'}`,
      text: SUPPORTED_LANGUAGES[0].defaultCode,
    },
  });
  const [activeFileId, setActiveFileId] = useState('main');

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
  const isReadOnly = userRole === 'viewer';
  const [collabStatus, setCollabStatus] = useState('solo'); // 'solo' | 'connecting' | 'connected' | 'disconnected'
  const [activePeers, setActivePeers] = useState([]);
  const [selectedPeer, setSelectedPeer] = useState(null);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isShareCopied, setIsShareCopied] = useState(false);
  const [roomActionLoading, setRoomActionLoading] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // WebRTC Audio/Video Call state (Week D)
  const [isCallPanelOpen, setIsCallPanelOpen] = useState(false);

  // AI Assistant & Debugger state (Week C)
  const [isAiDebugModalOpen, setIsAiDebugModalOpen] = useState(false);
  const [aiDebugResult, setAiDebugResult] = useState(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [enableAiSuggestions, setEnableAiSuggestions] = useState(true);
  const [userToken, setUserToken] = useState(null);

  useEffect(() => {
    let isMounted = true;
    getAuthTokenForRoom(currentRoom?.id, currentUser).then((tok) => {
      if (isMounted) setUserToken(tok);
    });
    return () => {
      isMounted = false;
    };
  }, [currentRoom, currentUser]);

  // Yjs Collaboration References
  const collabRef = useRef(null);
  const [collabYText, setCollabYText] = useState(null);
  const [collabProvider, setCollabProvider] = useState(null);

  // Execution history state
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Sidebar / Drawer states (Defaults to 'files' for instant explorer access)
  const [activeSidebarTab, setActiveSidebarTab] = useState('files');
  const [apiResponse, setApiResponse] = useState(null);
  const [loadingApi, setLoadingApi] = useState(false);
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  // Load user execution history from backend GET /api/run/history
  const loadHistory = useCallback(async () => {
    setActiveSidebarTab('history');
    setLoadingHistory(true);
    try {
      const idToken = await getAuthTokenForRoom(currentRoom?.id, currentUser);
      const list = await fetchRunHistoryAPI(idToken);
      setHistoryList(list);
    } catch (err) {
      console.error('Failed to load execution history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [currentRoom, currentUser]);

  // Helper to get tab icon for files
  const getTabFileIcon = (filename) => {
    if (!filename) return <FileText size={14} className="tab-icon text-cyan" />;
    const lower = filename.toLowerCase();
    if (lower.endsWith('.jsx') || lower.endsWith('.tsx') || lower.endsWith('.js') || lower.endsWith('.ts')) {
      return <FileCode size={14} className="tab-icon text-indigo" />;
    }
    if (lower.endsWith('.py')) {
      return <FileCode size={14} className="tab-icon text-amber" />;
    }
    if (lower.endsWith('.cpp') || lower.endsWith('.cc') || lower.endsWith('.c') || lower.endsWith('.h')) {
      return <Code2 size={14} className="tab-icon text-blue" />;
    }
    if (lower.endsWith('.java')) {
      return <FileCode size={14} className="tab-icon text-red" />;
    }
    if (lower.endsWith('.go') || lower.endsWith('.rs')) {
      return <Code2 size={14} className="tab-icon text-emerald" />;
    }
    if (lower.endsWith('.css') || lower.endsWith('.scss')) {
      return <Code2 size={14} className="tab-icon text-pink" />;
    }
    if (lower.endsWith('.json')) {
      return <FileJson size={14} className="tab-icon text-amber" />;
    }
    return <FileText size={14} className="tab-icon text-cyan" />;
  };

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

    // Reset files to solo single file with current selected language
    setFiles({
      main: {
        id: 'main',
        name: `main.${selectedLanguage.extension || 'js'}`,
        text: code,
      },
    });
    setActiveFileId('main');

    // Clear URL query param if present
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.replaceState({}, '', url.toString());
  }, [code, selectedLanguage]);

  // Connect to a collaboration room
  const connectToRoom = useCallback(async (roomId) => {
    setRoomActionLoading(true);
    leaveRoom();

    try {
      const idToken = await getAuthTokenForRoom(roomId, currentUser);

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

      // 4. Hydrate files from Y.Doc filesMap and observe changes
      const syncFilesFromYDoc = () => {
        const nextFiles = {};
        collab.filesMap.forEach((val, key) => {
          if (val && typeof val.get === 'function') {
            const id = val.get('id') || key;
            const name = val.get('name') || `file_${key}`;
            const textObj = val.get('text');
            nextFiles[key] = {
              id,
              name,
              text: textObj ? textObj.toString() : '',
              ytext: textObj,
            };
          }
        });

        if (Object.keys(nextFiles).length > 0) {
          setFiles(nextFiles);
          setActiveFileId((currentActiveId) => {
            const targetId = nextFiles[currentActiveId] ? currentActiveId : Object.keys(nextFiles)[0];
            const targetFile = nextFiles[targetId];
            if (targetFile) {
              setCollabYText(targetFile.ytext || collab.ytext);
              const lang = getLanguageByFilename(targetFile.name);
              if (lang) setSelectedLanguage(lang);
            }
            return targetId;
          });
        }
      };

      collab.filesMap.observeDeep(syncFilesFromYDoc);
      syncFilesFromYDoc();

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
    const idToken = await getAuthTokenForRoom(null, currentUser);

    const room = await createRoomAPI({
      name,
      language_id,
      linkAccess,
      idToken,
    });

    markTabRoomAsCreated(room.id);
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

  // Handle file selection
  const handleSelectFile = useCallback((fileId) => {
    setActiveFileId(fileId);
    const targetFile = files[fileId];
    if (targetFile) {
      if (collabRef.current) {
        setCollabYText(targetFile.ytext || collabRef.current.ytext);
        if (collabRef.current.provider) {
          const isOwner = userRole === 'owner';
          const roleLabel = isOwner ? 'Owner' : (userRole === 'viewer' ? 'Viewer' : 'Collaborator');
          const baseName = currentUser?.displayName || currentUser?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'Hive Developer');
          collabRef.current.provider.setAwarenessField('user', {
            name: `${baseName} (${roleLabel})`,
            email: currentUser?.email || '',
            photoURL: currentUser?.photoURL || null,
            uid: currentUser?.uid || null,
            role: userRole,
            activeFile: fileId,
          });
        }
      } else {
        setCode(targetFile.text || '');
      }
      const lang = getLanguageByFilename(targetFile.name);
      if (lang) setSelectedLanguage(lang);
    }
  }, [currentUser, files, userRole]);

  // Handle adding a new file (limit 20 files)
  const handleAddFile = useCallback((fileName) => {
    if (userRole === 'viewer') return;
    const trimmed = fileName?.trim();
    if (!trimmed) return;
    const lang = getLanguageByFilename(trimmed);
    const defaultContent = lang?.defaultCode || `// ${trimmed}\n`;

    if (collabRef.current?.filesMap) {
      const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const fileMap = new Y.Map();
      fileMap.set('id', fileId);
      fileMap.set('name', trimmed);
      const text = new Y.Text();
      text.insert(0, defaultContent);
      fileMap.set('text', text);
      fileMap.set('createdAt', Date.now());
      fileMap.set('updatedAt', Date.now());

      collabRef.current.filesMap.set(fileId, fileMap);
      setActiveFileId(fileId);
      setCollabYText(text);
      if (lang) setSelectedLanguage(lang);
    } else {
      const fileId = `file_${Date.now()}`;
      setFiles((prev) => ({
        ...prev,
        [fileId]: {
          id: fileId,
          name: trimmed,
          text: defaultContent,
        },
      }));
      setActiveFileId(fileId);
      setCode(defaultContent);
      if (lang) setSelectedLanguage(lang);
    }
  }, [userRole]);

  // Handle renaming a file
  const handleRenameFile = useCallback((fileId, newName) => {
    if (userRole === 'viewer') return;
    const trimmed = newName?.trim();
    if (!trimmed) return;

    if (collabRef.current?.filesMap) {
      const fileMap = collabRef.current.filesMap.get(fileId);
      if (fileMap && typeof fileMap.set === 'function') {
        fileMap.set('name', trimmed);
        fileMap.set('updatedAt', Date.now());
      }
    } else {
      setFiles((prev) => {
        if (!prev[fileId]) return prev;
        return {
          ...prev,
          [fileId]: {
            ...prev[fileId],
            name: trimmed,
          },
        };
      });
    }

    if (fileId === activeFileId) {
      const lang = getLanguageByFilename(trimmed);
      if (lang) setSelectedLanguage(lang);
    }
  }, [activeFileId, userRole]);

  // Handle deleting a file
  const handleDeleteFile = useCallback((fileId) => {
    if (userRole === 'viewer') return;
    const remainingKeys = Object.keys(files).filter((id) => id !== fileId);
    if (remainingKeys.length === 0) return;

    if (collabRef.current?.filesMap) {
      collabRef.current.filesMap.delete(fileId);
    } else {
      setFiles((prev) => {
        const next = { ...prev };
        delete next[fileId];
        return next;
      });
    }

    if (activeFileId === fileId) {
      const nextId = remainingKeys[0];
      handleSelectFile(nextId);
    }
  }, [activeFileId, files, handleSelectFile, userRole]);

  // Handle uploading a file
  const handleUploadFile = useCallback((name, content) => {
    if (userRole === 'viewer') return;
    const lang = getLanguageByFilename(name);

    if (collabRef.current?.filesMap) {
      const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const fileMap = new Y.Map();
      fileMap.set('id', fileId);
      fileMap.set('name', name);
      const text = new Y.Text();
      text.insert(0, content);
      fileMap.set('text', text);
      fileMap.set('createdAt', Date.now());
      fileMap.set('updatedAt', Date.now());

      collabRef.current.filesMap.set(fileId, fileMap);
      setActiveFileId(fileId);
      setCollabYText(text);
      if (lang) setSelectedLanguage(lang);
    } else {
      const fileId = `file_${Date.now()}`;
      setFiles((prev) => ({
        ...prev,
        [fileId]: {
          id: fileId,
          name,
          text: content,
        },
      }));
      setActiveFileId(fileId);
      setCode(content);
      if (lang) setSelectedLanguage(lang);
    }
  }, [userRole]);

  // Handle local code editor changes (solo mode)
  const handleCodeChange = useCallback((newCode) => {
    setCode(newCode);
    if (!collabRef.current) {
      setFiles((prev) => {
        if (!prev[activeFileId]) return prev;
        return {
          ...prev,
          [activeFileId]: {
            ...prev[activeFileId],
            text: newCode,
          },
        };
      });
    }
  }, [activeFileId]);

  // Handle switching languages (synced to room meta if collaborating)
  const handleLanguageChange = (lang) => {
    setSelectedLanguage(lang);
    setIsLangDropdownOpen(false);

    if (collabRef.current?.ymeta && userRole !== 'viewer') {
      collabRef.current.ymeta.set('language_id', lang.id);
      collabRef.current.ymeta.set('language', lang.key);
    } else if (!collabRef.current) {
      // In solo mode, update active file's extension & default template
      if (files[activeFileId]) {
        const currentName = files[activeFileId].name;
        const baseName = currentName.includes('.') ? currentName.substring(0, currentName.lastIndexOf('.')) : currentName;
        const newName = `${baseName}.${lang.extension || 'txt'}`;
        setFiles((prev) => ({
          ...prev,
          [activeFileId]: {
            ...prev[activeFileId],
            name: newName,
            text: lang.defaultCode,
          },
        }));
      }
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

  // Execute Code via Judge0 backend API (supporting live room doc per Architecture Section 6.2 & Extension Plan Section 3)
  const handleRunCode = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);

    try {
      const idToken = await getAuthTokenForRoom(currentRoom?.id, currentUser);

      const activeFile = files[activeFileId] || Object.values(files)[0];
      const activeCode = collabYText ? collabYText.toString() : (activeFile?.text || code);

      // Execute active file with Judge0 backend API
      const res = await runCodeAPI({
        source_code: activeCode,
        language_id: selectedLanguage.id,
        stdin,
        roomId: currentRoom ? currentRoom.id : undefined,
        fileId: currentRoom ? activeFileId : undefined,
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
  }, [activeFileId, code, collabYText, currentRoom, currentUser, files, isRunning, selectedLanguage, stdin]);

  // AI Error Diagnosis & Diff Fix generation (Week C - Section 6.2)
  const handleExplainError = useCallback(async () => {
    if (isAiAnalyzing) return;
    setIsAiAnalyzing(true);
    try {
      const idToken = await getAuthTokenForRoom(currentRoom?.id, currentUser);
      const activeFile = files[activeFileId] || Object.values(files)[0];
      const currentCode = collabYText ? collabYText.toString() : (activeFile?.text || code);
      const errorText = executionResult?.stderr || executionResult?.compile_output || (executionResult?.status?.description ? `Status: ${executionResult.status.description}` : 'Execution failed');

      const res = await debugCodeAPI({
        code: currentCode,
        language: selectedLanguage.key || selectedLanguage.monaco,
        error: errorText,
        idToken,
      });

      setAiDebugResult(res);
      setIsAiDebugModalOpen(true);
    } catch (err) {
      console.error('AI Debugging request failed:', err);
      alert(`AI Debugger error: ${err.message}`);
    } finally {
      setIsAiAnalyzing(false);
    }
  }, [activeFileId, code, collabYText, currentUser, executionResult, files, isAiAnalyzing, selectedLanguage, userToken]);

  // Apply AI Fix to editor and sync across collaborators
  const handleApplyAiFix = useCallback((fixedCode) => {
    if (isReadOnly || !fixedCode) return;
    if (collabYText) {
      collabYText.delete(0, collabYText.length);
      collabYText.insert(0, fixedCode);
    } else {
      setCode(fixedCode);
      setFiles((prev) => {
        if (!prev[activeFileId]) return prev;
        return {
          ...prev,
          [activeFileId]: {
            ...prev[activeFileId],
            text: fixedCode,
          },
        };
      });
    }
    setIsAiDebugModalOpen(false);
  }, [activeFileId, collabYText, isReadOnly]);

  // Test Firebase ID token verification against Express API
  const handleTestBackendAPI = async () => {
    setLoadingApi(true);
    setApiResponse(null);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const token = await getAuthTokenForRoom(currentRoom?.id, currentUser);

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

          {/* AI Suggestions Toggle Button */}
          {!isReadOnly && (
            <button
              type="button"
              className={`btn-ai-toggle font-brand ${enableAiSuggestions ? 'active' : ''}`}
              onClick={() => setEnableAiSuggestions(!enableAiSuggestions)}
              title={enableAiSuggestions ? 'AI Inline Suggestions Enabled (Tab to accept)' : 'AI Inline Suggestions Disabled'}
            >
              <Sparkles size={13} className={enableAiSuggestions ? 'text-amber animate-pulse' : 'text-slate'} />
              <span>AI {enableAiSuggestions ? 'ON' : 'OFF'}</span>
            </button>
          )}

          {/* WebRTC Voice & Video Call Toggle */}
          {currentRoom && (
            <button
              type="button"
              className={`btn-call-toggle font-brand ${isCallPanelOpen ? 'active' : ''}`}
              onClick={() => setIsCallPanelOpen(!isCallPanelOpen)}
              title="Open Room Voice & Video Call (WebRTC mesh up to 4 participants)"
            >
              <Video size={13} className={isCallPanelOpen ? 'text-emerald animate-pulse' : 'text-slate'} />
              <span>Call</span>
            </button>
          )}

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
          <div className="collaborator-avatars" title="Connected Collaborators (Click to view profile)">
            {activePeers.length > 0 ? (
              activePeers.map((peer, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`avatar-pill ${selectedPeer?.email === peer.email || (selectedPeer?.name === peer.name && selectedPeer?.color === peer.color) ? 'avatar-active' : ''}`}
                  style={{ borderColor: peer.color || '#6366f1' }}
                  onClick={() => setSelectedPeer(selectedPeer?.email === peer.email ? null : peer)}
                  title={`Click to view details for ${peer.name} (${peer.role || 'editor'})`}
                  aria-label={`Collaborator ${peer.name}`}
                >
                  {peer.photoURL ? (
                    <img
                      src={peer.photoURL}
                      alt={peer.name}
                      className="avatar-peer-photo"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextSibling) {
                          e.currentTarget.nextSibling.style.display = 'flex';
                        }
                      }}
                    />
                  ) : null}
                  <span
                    className="avatar-peer-fallback font-code"
                    style={{
                      backgroundColor: peer.color || '#6366f1',
                      display: peer.photoURL ? 'none' : 'flex',
                    }}
                  >
                    {peer.name ? peer.name.slice(0, 2).toUpperCase() : 'PE'}
                  </span>
                  <span className={`peer-badge-dot role-dot-${peer.role || 'editor'}`} />
                </button>
              ))
            ) : (
              <button
                type="button"
                className="avatar-pill avatar-you avatar-clickable font-code"
                onClick={() => setSelectedPeer({
                  name: currentUser?.displayName || 'You',
                  email: currentUser?.email || 'Logged in user',
                  photoURL: currentUser?.photoURL || null,
                  role: userRole || 'owner',
                  activeFile: activeFileId,
                  color: '#6366f1',
                  isSelf: true,
                })}
                title="You (Click to view profile)"
              >
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt="You"
                    className="avatar-peer-photo"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextSibling) {
                        e.currentTarget.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <span
                  className="avatar-peer-fallback font-code"
                  style={{
                    backgroundColor: '#6366f1',
                    display: currentUser?.photoURL ? 'none' : 'flex',
                  }}
                >
                  YOU
                </span>
                <span className="peer-badge-dot role-dot-owner" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Clickable Collaborator Profile Card Modal */}
      {selectedPeer && (
        <div className="peer-popover-overlay" onClick={() => setSelectedPeer(null)}>
          <div
            className={`peer-popover-card ${isDark ? 'dark' : 'light'}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              borderColor: selectedPeer.color || '#6366f1',
            }}
          >
            <div
              className="peer-card-header"
              style={{
                background: `linear-gradient(135deg, ${selectedPeer.color || '#6366f1'}22, transparent)`,
              }}
            >
              <div className="peer-card-avatar-wrap" style={{ borderColor: selectedPeer.color || '#6366f1' }}>
                {selectedPeer.photoURL ? (
                  <img
                    src={selectedPeer.photoURL}
                    alt={selectedPeer.name}
                    className="peer-card-img"
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      if (e.currentTarget.nextSibling) {
                        e.currentTarget.nextSibling.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div
                  className="peer-card-initials font-brand"
                  style={{
                    backgroundColor: selectedPeer.color || '#6366f1',
                    display: selectedPeer.photoURL ? 'none' : 'flex',
                  }}
                >
                  {selectedPeer.name ? selectedPeer.name.slice(0, 2).toUpperCase() : 'PE'}
                </div>
                <span className={`peer-card-role-dot role-dot-${selectedPeer.role || 'editor'}`} />
              </div>

              <div className="peer-card-titles">
                <div className="peer-card-name-row">
                  <h4 className="peer-card-name font-brand">{selectedPeer.name || 'Collaborator'}</h4>
                  <span className={`role-pill role-${selectedPeer.role || 'editor'}`}>
                    {selectedPeer.role === 'viewer' ? <Lock size={11} /> : <Globe size={11} />}
                    <span>{(selectedPeer.role || 'editor').toUpperCase()}</span>
                  </span>
                </div>
                <div className="peer-card-email font-code">
                  <Mail size={12} className="peer-email-icon" />
                  <span>{selectedPeer.email || 'No email provided'}</span>
                </div>
              </div>

              <button
                type="button"
                className="peer-card-close"
                onClick={() => setSelectedPeer(null)}
                aria-label="Close peer details"
              >
                ✕
              </button>
            </div>

            <div className="peer-card-body font-brand">
              <div className="peer-card-meta-grid">
                <div className="peer-meta-item">
                  <span className="peer-meta-label">Session Status</span>
                  <div className="peer-status-val">
                    <span className="peer-online-pulse" />
                    <span>Live in Hive Session</span>
                  </div>
                </div>

                <div className="peer-meta-item">
                  <span className="peer-meta-label">Active Document</span>
                  <span className="peer-file-name font-code">
                    📄 {files[selectedPeer.activeFile]?.name || selectedPeer.activeFile || 'main.js'}
                  </span>
                </div>
              </div>

              <div className="peer-card-actions">
                {selectedPeer.activeFile && files[selectedPeer.activeFile] && (
                  <button
                    type="button"
                    className="btn-peer-action btn-peer-jump font-brand"
                    onClick={() => {
                      handleSelectFile(selectedPeer.activeFile);
                      setSelectedPeer(null);
                    }}
                  >
                    <FileCode size={14} />
                    <span>Switch to Their File ({files[selectedPeer.activeFile]?.name || selectedPeer.activeFile})</span>
                  </button>
                )}

                <button
                  type="button"
                  className="btn-peer-action btn-peer-chat font-brand"
                  onClick={() => {
                    setActiveSidebarTab('chat');
                    setSelectedPeer(null);
                  }}
                >
                  <MessageSquare size={14} />
                  <span>Open Room Chat</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="workspace-main-content">
        {/* Left Sidebar Tools */}
        <aside className="workspace-sidebar">
          <div className="sidebar-icons">
            <button
              className={`sidebar-tab-btn ${activeSidebarTab === 'files' ? 'active' : ''}`}
              onClick={() => setActiveSidebarTab(activeSidebarTab === 'files' ? '' : 'files')}
              title="Workspace Files Explorer"
            >
              {activeSidebarTab === 'files' ? <FolderOpen size={18} /> : <Folder size={18} />}
            </button>
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
              className={`sidebar-tab-btn ${activeSidebarTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveSidebarTab(activeSidebarTab === 'chat' ? '' : 'chat')}
              title="Room Live Chat"
            >
              <MessageSquare size={18} />
            </button>
            {currentRoom && (
              <button
                className={`sidebar-tab-btn ${isCallPanelOpen ? 'active' : ''}`}
                onClick={() => setIsCallPanelOpen(!isCallPanelOpen)}
                title="Room Voice & Video Call"
              >
                <Video size={18} className={isCallPanelOpen ? 'text-emerald' : ''} />
              </button>
            )}
            <button
              className={`sidebar-tab-btn ${activeSidebarTab === 'rooms' ? 'active' : ''}`}
              onClick={() => setIsRoomModalOpen(true)}
              title="Create or Join Live Rooms"
            >
              <Users2 size={18} />
            </button>
            <button
              className="sidebar-tab-btn admin-sidebar-tab"
              onClick={() => setIsAdminModalOpen(true)}
              title="CodeHive Administration Console"
            >
              <ShieldCheck size={18} className="text-indigo" />
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
              {activeSidebarTab === 'files' && (
                <FileExplorer
                  files={files}
                  activeFileId={activeFileId}
                  onSelectFile={handleSelectFile}
                  onAddFile={handleAddFile}
                  onRenameFile={handleRenameFile}
                  onDeleteFile={handleDeleteFile}
                  onUploadFile={handleUploadFile}
                  isReadOnly={isReadOnly}
                />
              )}

              {activeSidebarTab === 'chat' && (
                <ChatPanel
                  roomId={currentRoom?.id}
                  userRole={userRole}
                  onOpenRoomModal={() => setIsRoomModalOpen(true)}
                />
              )}

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

          {/* Multi-File Tab Bar */}
          <div className="workspace-tabs-bar">
            <div className="tabs-list">
              {Object.values(files).map((f) => {
                const isActive = f.id === activeFileId;
                const filePeers = activePeers.filter((p) => p.activeFile === f.id);
                return (
                  <div
                    key={f.id}
                    className={`editor-tab ${isActive ? 'active' : ''}`}
                    onClick={() => handleSelectFile(f.id)}
                    title={f.name}
                  >
                    {getTabFileIcon(f.name)}
                    <span className="tab-name font-code">{f.name}</span>

                    {filePeers.length > 0 && (
                      <div className="tab-peer-dots" title={`Collaborators viewing ${f.name}`}>
                        {filePeers.slice(0, 3).map((peer, i) => (
                          <span
                            key={i}
                            className="tab-peer-dot"
                            style={{ backgroundColor: peer.color || '#6366f1' }}
                            title={peer.name}
                          />
                        ))}
                      </div>
                    )}

                    {Object.keys(files).length > 1 && !isReadOnly && (
                      <button
                        type="button"
                        className="tab-close-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(f.id);
                        }}
                        title={`Close ${f.name}`}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {!isReadOnly && Object.keys(files).length < 20 && (
              <button
                type="button"
                className="tab-add-btn"
                onClick={() => {
                  const ext = selectedLanguage.extension || 'js';
                  const newName = `file_${Object.keys(files).length + 1}.${ext}`;
                  handleAddFile(newName);
                }}
                title="Create new file (+)"
              >
                <Plus size={14} />
              </button>
            )}
          </div>

          {/* Monaco Editor Container */}
          <div className="editor-wrapper">
            <CodeEditor
              code={code}
              language={selectedLanguage.monaco}
              onChange={handleCodeChange}
              onCursorChange={setCursorStats}
              onRunCode={handleRunCode}
              isReadOnly={isReadOnly}
              ytext={collabYText}
              provider={collabProvider}
              activeFileName={files[activeFileId]?.name || ''}
              enableAiSuggestions={enableAiSuggestions}
              idToken={userToken}
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

          {/* Terminal / Output Console with AI Diagnosis */}
          <TerminalPanel
            executionResult={executionResult}
            isRunning={isRunning}
            onRunCode={handleRunCode}
            onClearOutput={() => setExecutionResult(null)}
            onExplainError={handleExplainError}
            isAiAnalyzing={isAiAnalyzing}
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

      {/* CodeHive Administration Console */}
      {isAdminModalOpen && (
        <AdminPanel onClose={() => setIsAdminModalOpen(false)} />
      )}

      {/* AI Debugger Diff Modal (IDE Extension Plan Section 6.2) */}
      <AiDebugModal
        isOpen={isAiDebugModalOpen}
        onClose={() => setIsAiDebugModalOpen(false)}
        debugResult={aiDebugResult}
        originalCode={collabYText ? collabYText.toString() : (files[activeFileId]?.text || code)}
        language={selectedLanguage.monaco}
        onApplyFix={handleApplyAiFix}
        isReadOnly={isReadOnly}
      />

      {/* WebRTC Audio & Video Call Panel (IDE Extension Plan Section 7) */}
      <CallPanel
        roomId={currentRoom?.id}
        currentUser={currentUser}
        idToken={userToken}
        userRole={userRole}
        isOpen={isCallPanelOpen}
        onClose={() => setIsCallPanelOpen(false)}
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
        .btn-ai-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 50px;
          font-size: 0.78rem;
          font-weight: 700;
          border: 1.5px solid #e2e8f0;
          background: #ffffff;
          color: #64748b;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .btn-ai-toggle.active {
          background: #fef3c7;
          border-color: #fde68a;
          color: #b45309;
          box-shadow: 0 1px 4px rgba(245, 158, 11, 0.15);
        }
        .btn-ai-toggle:hover {
          border-color: #cbd5e1;
        }
        .btn-ai-toggle.active:hover {
          background: #fde68a;
        }
        .btn-call-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 50px;
          font-size: 0.78rem;
          font-weight: 700;
          border: 1.5px solid #e2e8f0;
          background: #ffffff;
          color: #475569;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .btn-call-toggle:hover {
          border-color: #cbd5e1;
          color: #0f172a;
        }
        .btn-call-toggle.active {
          background: #ecfdf5;
          border-color: #a7f3d0;
          color: #059669;
          box-shadow: 0 1px 4px rgba(16, 185, 129, 0.15);
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
          gap: 6px;
        }
        .avatar-pill {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 0;
          background: transparent;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
          cursor: pointer;
          transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: visible;
        }
        .avatar-pill:hover,
        .avatar-pill.avatar-active {
          transform: translateY(-2px) scale(1.1);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
          z-index: 10;
        }
        .avatar-peer-photo {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          display: block;
        }
        .avatar-peer-fallback {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.74rem;
          font-weight: 800;
          font-family: 'Outfit', sans-serif;
          color: #ffffff;
        }
        .avatar-you {
          background: linear-gradient(135deg, #6366f1, #a855f7);
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
        }
        .peer-badge-dot {
          position: absolute;
          bottom: -1px;
          right: -1px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          border: 2px solid #ffffff;
        }
        .role-dot-owner {
          background: #6366f1;
        }
        .role-dot-editor {
          background: #10b981;
        }
        .role-dot-viewer {
          background: #f59e0b;
        }

        /* Clickable Collaborator Profile Card Popover */
        .peer-popover-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: peerFadeIn 0.15s ease-out;
        }
        @keyframes peerFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .peer-popover-card {
          width: 90%;
          max-width: 380px;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.28);
          border: 1.5px solid;
          overflow: hidden;
          animation: peerPopIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes peerPopIn {
          from { transform: scale(0.94) translateY(8px); opacity: 0; }
          to { transform: scale(1) translateY(0); opacity: 1; }
        }
        .peer-popover-card.light {
          background: #ffffff;
          color: #0f172a;
        }
        .peer-popover-card.dark {
          background: #1e1e2e;
          color: #f8fafc;
        }
        .peer-card-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 20px;
          position: relative;
          border-bottom: 1px solid rgba(148, 163, 184, 0.15);
        }
        .peer-card-avatar-wrap {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          position: relative;
          border: 2.5px solid;
          flex-shrink: 0;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.15);
        }
        .peer-card-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          display: block;
        }
        .peer-card-initials {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.15rem;
          font-weight: 800;
          color: #ffffff;
        }
        .peer-card-role-dot {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 13px;
          height: 13px;
          border-radius: 50%;
          border: 2.5px solid #ffffff;
        }
        .peer-card-titles {
          flex: 1;
          min-width: 0;
        }
        .peer-card-name-row {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 4px;
        }
        .peer-card-name {
          font-size: 1.05rem;
          font-weight: 700;
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .peer-card-email {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.76rem;
          color: #64748b;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .peer-card-close {
          position: absolute;
          top: 14px;
          right: 14px;
          background: rgba(148, 163, 184, 0.12);
          border: none;
          color: inherit;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.8rem;
          transition: background 0.15s;
        }
        .peer-card-close:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
        .peer-card-body {
          padding: 18px 20px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .peer-card-meta-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          padding: 10px 12px;
          border-radius: 10px;
          background: rgba(148, 163, 184, 0.08);
        }
        .peer-meta-item {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .peer-meta-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          font-weight: 600;
        }
        .peer-status-val {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #10b981;
        }
        .peer-online-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          animation: peerPulse 1.8s infinite;
        }
        @keyframes peerPulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .peer-file-name {
          font-size: 0.82rem;
          font-weight: 600;
          color: #6366f1;
        }
        .peer-card-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 4px;
        }
        .btn-peer-action {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 9px 14px;
          border-radius: 9px;
          font-size: 0.84rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.16s ease;
        }
        .btn-peer-jump {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.25);
        }
        .btn-peer-jump:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        }
        .btn-peer-chat {
          background: rgba(148, 163, 184, 0.12);
          color: inherit;
        }
        .btn-peer-chat:hover {
          background: rgba(148, 163, 184, 0.22);
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
        /* Multi-file Tab Bar Styles */
        .workspace-tabs-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f1f5f9;
          border-bottom: 1px solid #e2e8f0;
          height: 38px;
          padding: 0 8px;
          overflow-x: auto;
          scrollbar-width: thin;
        }
        .tabs-list {
          display: flex;
          align-items: center;
          gap: 4px;
          overflow-x: auto;
          flex: 1;
        }
        .editor-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          font-size: 0.78rem;
          border-radius: 6px 6px 0 0;
          background: #e2e8f0;
          color: #64748b;
          cursor: pointer;
          border-top: 2px solid transparent;
          user-select: none;
          transition: all 0.15s ease;
          white-space: nowrap;
        }
        .editor-tab:hover {
          background: #cbd5e1;
          color: #0f172a;
        }
        .editor-tab.active {
          background: #ffffff;
          color: #0f172a;
          border-top-color: #6366f1;
          font-weight: 600;
          box-shadow: 0 -2px 4px rgba(0, 0, 0, 0.02);
        }
        .tab-name {
          font-size: 0.76rem;
        }
        .tab-peer-dots {
          display: flex;
          align-items: center;
          gap: 3px;
          margin-left: 2px;
        }
        .tab-peer-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          box-shadow: 0 0 4px rgba(0, 0, 0, 0.2);
        }
        .tab-close-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          padding: 2px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .tab-close-btn:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }
        .tab-add-btn {
          background: transparent;
          border: 1px dashed #cbd5e1;
          color: #64748b;
          width: 26px;
          height: 26px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          margin-left: 8px;
          transition: all 0.15s ease;
          flex-shrink: 0;
        }
        .tab-add-btn:hover {
          border-color: #6366f1;
          color: #6366f1;
          background: rgba(99, 102, 241, 0.05);
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
        .workspace-container.dark .workspace-tabs-bar {
          background: #0d121f;
          border-bottom-color: #1e293b;
        }
        .workspace-container.dark .editor-tab {
          background: #141c2e;
          color: #94a3b8;
        }
        .workspace-container.dark .editor-tab:hover {
          background: #1e293b;
          color: #f8fafc;
        }
        .workspace-container.dark .editor-tab.active {
          background: #0a0c10;
          color: #f8fafc;
          border-top-color: #06b6d4;
        }
        .workspace-container.dark .tab-add-btn {
          border-color: #334155;
          color: #94a3b8;
        }
        .workspace-container.dark .tab-add-btn:hover {
          border-color: #06b6d4;
          color: #06b6d4;
          background: rgba(6, 182, 212, 0.08);
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
