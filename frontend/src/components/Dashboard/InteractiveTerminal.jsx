import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import { Square, Trash2 } from 'lucide-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const WS_URL = import.meta.env.VITE_WS_URL || BACKEND_URL.replace(/^http/, 'ws');

export const InteractiveTerminal = forwardRef(({
  roomId = 'solo',
  userRole = 'editor',
  isDark = true,
  onRunningChange,
  className = '',
}, ref) => {
  const terminalRef = useRef(null);
  const xtermInstance = useRef(null);
  const fitAddonRef = useRef(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const pendingCommandRef = useRef(null);

  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting' | 'connected' | 'disconnected'
  const [isRunning, setIsRunning] = useState(false);

  const isReadOnly = userRole === 'viewer';

  // Theme palettes for xterm
  const darkTheme = {
    background: '#0d1117',
    foreground: '#e6edf3',
    cursor: '#58a6ff',
    cursorAccent: '#0d1117',
    selectionBackground: 'rgba(56, 139, 253, 0.35)',
    black: '#0d1117',
    red: '#ff7b72',
    green: '#3fb950',
    yellow: '#d29922',
    blue: '#58a6ff',
    magenta: '#bc8cff',
    cyan: '#39c5cf',
    white: '#d0d7de',
    brightBlack: '#484f58',
    brightRed: '#ffa198',
    brightGreen: '#56d364',
    brightYellow: '#e3b341',
    brightBlue: '#79c0ff',
    brightMagenta: '#d2a8ff',
    brightCyan: '#56d4dd',
    brightWhite: '#ffffff',
  };

  const lightTheme = {
    background: '#f8fafc',
    foreground: '#1e293b',
    cursor: '#0284c7',
    cursorAccent: '#ffffff',
    selectionBackground: 'rgba(2, 132, 199, 0.25)',
    black: '#1e293b',
    red: '#ef4444',
    green: '#10b981',
    yellow: '#f59e0b',
    blue: '#0284c7',
    magenta: '#8b5cf6',
    cyan: '#06b6d4',
    white: '#f1f5f9',
    brightBlack: '#64748b',
    brightRed: '#f87171',
    brightGreen: '#34d399',
    brightYellow: '#fbbf24',
    brightBlue: '#38bdf8',
    brightMagenta: '#a78bfa',
    brightCyan: '#22d3ee',
    brightWhite: '#0f172a',
  };

  // Expose imperative methods to parent components
  useImperativeHandle(ref, () => ({
    runInteractiveCode: ({ sourceCode, languageId }) => {
      startExecution(sourceCode, languageId);
    },
    sendInterrupt: () => {
      interruptProcess();
    },
    clearTerminal: () => {
      clearTerminal();
    },
    focus: () => {
      xtermInstance.current?.focus();
    },
    fit: () => {
      try {
        fitAddonRef.current?.fit();
      } catch (_) {}
    },
  }));

  // Update running status and notify parent
  const updateRunning = (running) => {
    setIsRunning(running);
    if (onRunningChange) {
      onRunningChange(running);
    }
  };

  // Start execution helper
  const startExecution = (sourceCode, languageId) => {
    if (isReadOnly) {
      xtermInstance.current?.write('\r\n\x1b[33m[Viewers cannot execute code.]\x1b[0m\r\n');
      return;
    }

    const cols = xtermInstance.current?.cols || 80;
    const rows = xtermInstance.current?.rows || 24;

    const payload = {
      type: 'start',
      sourceCode,
      languageId,
      cols,
      rows,
    };

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
      updateRunning(true);
      xtermInstance.current?.focus();
    } else {
      pendingCommandRef.current = payload;
      connectWebSocket();
    }
  };

  // Send interrupt (Ctrl+C / SIGINT)
  const interruptProcess = () => {
    if (isReadOnly) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'kill' }));
      updateRunning(false);
    }
  };

  // Clear terminal screen and buffer
  const clearTerminal = () => {
    if (xtermInstance.current) {
      xtermInstance.current.clear();
      xtermInstance.current.reset();
    }
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'clear' }));
    }
    xtermInstance.current?.focus();
  };

  // Establish WebSocket connection to backend terminal service
  const connectWebSocket = () => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const endpoint = `${WS_URL}/ws/terminal?roomId=${encodeURIComponent(roomId)}&role=${encodeURIComponent(userRole)}`;
    setConnectionStatus('connecting');

    try {
      const ws = new WebSocket(endpoint);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionStatus('connected');
        // Fit and send terminal dimensions
        if (xtermInstance.current) {
          fitAddonRef.current?.fit();
          const cols = xtermInstance.current.cols;
          const rows = xtermInstance.current.rows;
          ws.send(JSON.stringify({ type: 'resize', cols, rows }));
          xtermInstance.current.focus();
        }

        // Execute queued command if any
        if (pendingCommandRef.current) {
          ws.send(JSON.stringify(pendingCommandRef.current));
          pendingCommandRef.current = null;
          updateRunning(true);
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'output' && xtermInstance.current) {
            xtermInstance.current.write(msg.data);
          } else if (msg.type === 'status') {
            updateRunning(!!msg.running);
          } else if (msg.type === 'exit') {
            updateRunning(false);
          }
        } catch (_) {
          if (xtermInstance.current) {
            xtermInstance.current.write(event.data);
          }
        }
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        updateRunning(false);
        // Clean reconnection with backoff
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 2500);
      };

      ws.onerror = (err) => {
        console.warn('[Terminal] WebSocket error:', err);
        setConnectionStatus('disconnected');
      };
    } catch (err) {
      console.warn('[Terminal] Connection setup failed:', err);
      setConnectionStatus('disconnected');
    }
  };

  // Initialize xterm on mount
  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
      theme: isDark ? darkTheme : lightTheme,
      convertEol: true,
      scrollback: 5000,
      disableStdin: isReadOnly,
      smoothScrollDuration: 80,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);

    term.open(terminalRef.current);

    xtermInstance.current = term;
    fitAddonRef.current = fitAddon;

    // Delayed initial fit and focus after DOM is rendered
    setTimeout(() => {
      try {
        fitAddon.fit();
        term.focus();
      } catch (_) {}
    }, 60);

    // Forward user keystrokes to remote PTY session
    const onDataDisposable = term.onData((data) => {
      if (isReadOnly) return;
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'input', data }));
      }
    });

    // Resize observer to re-fit xterm when panel bounds change
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'resize',
            cols: term.cols,
            rows: term.rows,
          }));
        }
      } catch (_) {}
    });

    resizeObserver.observe(terminalRef.current);

    // Initial connection
    connectWebSocket();

    return () => {
      onDataDisposable.dispose();
      resizeObserver.disconnect();
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      term.dispose();
    };
  }, [roomId, userRole]);

  // Update theme dynamically
  useEffect(() => {
    if (xtermInstance.current) {
      xtermInstance.current.options.theme = isDark ? darkTheme : lightTheme;
    }
  }, [isDark]);

  return (
    <div
      className={`interactive-terminal-wrapper ${className}`}
      onClick={() => {
        xtermInstance.current?.focus();
      }}
    >
      {/* Sub-toolbar for terminal controls */}
      <div className="terminal-subbar">
        <div className="subbar-left">
          <span className={`conn-dot ${connectionStatus}`}></span>
          <span className="conn-status-label font-code">
            {connectionStatus === 'connected' ? (isRunning ? 'Running' : 'Ready') : connectionStatus}
          </span>
          {isReadOnly && (
            <span className="readonly-indicator font-code">View Only</span>
          )}
        </div>

        <div className="subbar-actions">
          {isRunning && !isReadOnly && (
            <button
              type="button"
              className="btn-term-sub btn-term-stop font-brand"
              onClick={(e) => {
                e.stopPropagation();
                interruptProcess();
              }}
              title="Stop running program (Ctrl+C)"
            >
              <Square size={12} className="fill-current" />
              <span>Stop</span>
            </button>
          )}

          <button
            type="button"
            className="btn-term-sub font-brand"
            onClick={(e) => {
              e.stopPropagation();
              clearTerminal();
            }}
            title="Clear terminal screen"
          >
            <Trash2 size={12} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Actual xterm DOM mounting point */}
      <div
        ref={terminalRef}
        className="xterm-container-mount"
        tabIndex={0}
        onFocus={() => xtermInstance.current?.focus()}
      />

      <style>{`
        .interactive-terminal-wrapper {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          min-height: 0;
          background: ${isDark ? '#0d1117' : '#f8fafc'};
          overflow: hidden;
          position: relative;
          cursor: text;
        }
        .terminal-subbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 12px;
          background: ${isDark ? '#161b22' : '#f1f5f9'};
          border-bottom: 1px solid ${isDark ? '#21262d' : '#e2e8f0'};
          font-size: 0.72rem;
          min-height: 28px;
          flex-shrink: 0;
          user-select: none;
        }
        .subbar-left {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .conn-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }
        .conn-dot.connected {
          background: #10b981;
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
        }
        .conn-dot.connecting {
          background: #f59e0b;
        }
        .conn-dot.disconnected {
          background: #ef4444;
        }
        .conn-status-label {
          color: ${isDark ? '#8b949e' : '#64748b'};
          text-transform: capitalize;
          font-weight: 500;
        }
        .readonly-indicator {
          background: ${isDark ? 'rgba(234, 179, 8, 0.15)' : 'rgba(234, 179, 8, 0.2)'};
          color: #eab308;
          border: 1px solid rgba(234, 179, 8, 0.3);
          border-radius: 4px;
          padding: 1px 5px;
          font-size: 0.65rem;
          font-weight: 600;
        }
        .subbar-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .btn-term-sub {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 2px 8px;
          border-radius: 4px;
          border: 1px solid ${isDark ? '#30363d' : '#cbd5e1'};
          background: ${isDark ? '#21262d' : '#ffffff'};
          color: ${isDark ? '#c9d1d9' : '#475569'};
          font-size: 0.7rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-term-sub:hover {
          background: ${isDark ? '#30363d' : '#e2e8f0'};
          color: ${isDark ? '#f0f6fc' : '#1e293b'};
        }
        .btn-term-stop {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.4);
          color: #ef4444;
        }
        .btn-term-stop:hover {
          background: rgba(239, 68, 68, 0.25);
          color: #f87171;
        }
        .xterm-container-mount {
          flex: 1;
          width: 100%;
          height: 100%;
          min-height: 140px;
          overflow: hidden;
          padding: 4px 8px;
          outline: none;
        }
        .xterm-container-mount .xterm {
          height: 100%;
        }
        .xterm-container-mount .xterm-viewport {
          overflow-y: auto !important;
        }
      `}</style>
    </div>
  );
});

InteractiveTerminal.displayName = 'InteractiveTerminal';
