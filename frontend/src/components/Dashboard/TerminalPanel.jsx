import React, { useState } from 'react';
import { Terminal as TerminalIcon, Trash2, Copy, Check, ChevronUp, ChevronDown, Play } from 'lucide-react';

export const TerminalPanel = ({ logs = [], onClearLogs, onRunCode, isRunning }) => {
  const [copied, setCopied] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleCopy = () => {
    if (!logs.length) return;
    const text = logs.map(l => `[${l.type.toUpperCase()}] ${l.message}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`terminal-panel ${isMinimized ? 'minimized' : ''}`}>
      {/* Terminal Bar Header */}
      <div className="terminal-header">
        <div className="header-left" onClick={() => setIsMinimized(!isMinimized)}>
          <TerminalIcon size={14} className="text-emerald" />
          <span className="terminal-title font-brand">OUTPUT CONSOLE</span>
          <span className="log-count font-code">{logs.length} entries</span>
        </div>

        <div className="header-actions">
          <button
            className="btn-terminal-action"
            onClick={onRunCode}
            disabled={isRunning}
            title="Execute Active File (Ctrl+Enter)"
          >
            <Play size={12} className="text-emerald" />
            <span>{isRunning ? 'Running...' : 'Run'}</span>
          </button>

          <button
            className="btn-terminal-icon"
            onClick={handleCopy}
            title="Copy Output"
            disabled={logs.length === 0}
          >
            {copied ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}
          </button>

          <button
            className="btn-terminal-icon"
            onClick={onClearLogs}
            title="Clear Console"
            disabled={logs.length === 0}
          >
            <Trash2 size={13} />
          </button>

          <button
            className="btn-terminal-icon"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand' : 'Collapse'}
          >
            {isMinimized ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Terminal Console Logs */}
      {!isMinimized && (
        <div className="terminal-body font-code">
          {logs.length === 0 ? (
            <div className="terminal-empty font-code">
              <p>Press <span className="kbd">Run Code</span> or <span className="kbd">Ctrl + Enter</span> to execute current snippet.</p>
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className={`log-row log-${log.type}`}>
                <span className="log-timestamp">{log.timestamp}</span>
                <span className="log-prefix">[{log.type.toUpperCase()}]</span>
                <pre className="log-text">{log.message}</pre>
              </div>
            ))
          )}
        </div>
      )}

      <style>{`
        .terminal-panel {
          background: rgba(10, 12, 16, 0.95);
          border-top: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          max-height: 220px;
          min-height: 40px;
          transition: all 0.2s ease;
        }
        .terminal-panel.minimized {
          max-height: 40px;
          min-height: 40px;
        }
        .terminal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          background: rgba(15, 18, 26, 0.95);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          user-select: none;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        .terminal-title {
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: var(--text-secondary);
        }
        .log-count {
          font-size: 0.7rem;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.06);
          padding: 2px 6px;
          border-radius: 4px;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-terminal-action {
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: var(--accent-emerald);
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: background 0.2s;
        }
        .btn-terminal-action:hover:not(:disabled) {
          background: rgba(16, 185, 129, 0.25);
        }
        .btn-terminal-icon {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 4px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, color 0.2s;
        }
        .btn-terminal-icon:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
        }
        .btn-terminal-icon:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .terminal-body {
          flex: 1;
          padding: 12px 16px;
          overflow-y: auto;
          font-size: 0.82rem;
          line-height: 1.5;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .terminal-empty {
          color: var(--text-muted);
          font-size: 0.8rem;
          padding: 12px 0;
        }
        .kbd {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.75rem;
          border: 1px solid rgba(255, 255, 255, 0.15);
        }
        .log-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          word-break: break-all;
        }
        .log-timestamp {
          color: var(--text-muted);
          font-size: 0.72rem;
        }
        .log-prefix {
          font-weight: 600;
          font-size: 0.75rem;
        }
        .log-text {
          margin: 0;
          font-family: inherit;
          white-space: pre-wrap;
          color: var(--text-primary);
        }
        .log-info .log-prefix { color: var(--accent-cyan); }
        .log-success .log-prefix { color: var(--accent-emerald); }
        .log-error .log-prefix { color: #ef4444; }
        .log-error .log-text { color: #fca5a5; }
        .log-warn .log-prefix { color: var(--accent-amber); }
        .text-emerald { color: var(--accent-emerald); }
      `}</style>
    </div>
  );
};
