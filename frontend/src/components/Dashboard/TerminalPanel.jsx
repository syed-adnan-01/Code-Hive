import React, { useState } from 'react';
import {
  Terminal as TerminalIcon,
  Trash2,
  Copy,
  Check,
  ChevronUp,
  ChevronDown,
  Play,
  Clock,
  Cpu,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2
} from 'lucide-react';

export const TerminalPanel = ({
  executionResult,
  isRunning,
  onRunCode,
  onClearOutput,
}) => {
  const [copied, setCopied] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const handleCopy = () => {
    if (!executionResult) return;
    const textParts = [];
    if (executionResult.stdout) textParts.push(`--- STDOUT ---\n${executionResult.stdout}`);
    if (executionResult.stderr) textParts.push(`--- STDERR ---\n${executionResult.stderr}`);
    if (executionResult.compile_output) textParts.push(`--- COMPILE OUTPUT ---\n${executionResult.compile_output}`);
    const text = textParts.join('\n\n') || 'No output.';
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusBadge = (status) => {
    if (!status) return null;
    const id = status.id;
    if (id === 3) {
      return (
        <span className="status-pill status-success">
          <CheckCircle2 size={13} />
          <span>{status.description || 'Accepted'}</span>
        </span>
      );
    }
    if (id === 5) {
      return (
        <span className="status-pill status-warning">
          <AlertCircle size={13} />
          <span>{status.description || 'Time Limit Exceeded'}</span>
        </span>
      );
    }
    if (id === 6) {
      return (
        <span className="status-pill status-error">
          <XCircle size={13} />
          <span>{status.description || 'Compilation Error'}</span>
        </span>
      );
    }
    return (
      <span className="status-pill status-error">
        <XCircle size={13} />
        <span>{status.description || 'Runtime Error'}</span>
      </span>
    );
  };

  return (
    <div className={`terminal-panel ${isMinimized ? 'minimized' : ''}`}>
      {/* Terminal Bar Header */}
      <div className="terminal-header">
        <div className="header-left" onClick={() => setIsMinimized(!isMinimized)}>
          <TerminalIcon size={15} className="text-emerald" />
          <span className="terminal-title font-brand">OUTPUT CONSOLE</span>

          {isRunning && (
            <div className="running-indicator font-code">
              <Loader2 size={13} className="spin-fast" />
              <span>Executing on Judge0...</span>
            </div>
          )}

          {!isRunning && executionResult && getStatusBadge(executionResult.status)}

          {!isRunning && executionResult?.time && (
            <div className="meta-badge font-code">
              <Clock size={12} className="text-cyan" />
              <span>{executionResult.time}s</span>
            </div>
          )}

          {!isRunning && executionResult?.memory && (
            <div className="meta-badge font-code">
              <Cpu size={12} className="text-purple" />
              <span>{executionResult.memory} KB</span>
            </div>
          )}
        </div>

        <div className="header-actions">
          <button
            className="btn-terminal-run"
            onClick={onRunCode}
            disabled={isRunning}
            title="Execute Code (Ctrl + Enter)"
          >
            {isRunning ? (
              <Loader2 size={13} className="spin-fast" />
            ) : (
              <Play size={13} className="text-emerald fill-emerald" />
            )}
            <span>{isRunning ? 'Running...' : 'Run Code'}</span>
          </button>

          <button
            className="btn-terminal-icon"
            onClick={handleCopy}
            title="Copy Output"
            disabled={!executionResult || isRunning}
          >
            {copied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
          </button>

          <button
            className="btn-terminal-icon"
            onClick={onClearOutput}
            title="Clear Console"
            disabled={!executionResult || isRunning}
          >
            <Trash2 size={14} />
          </button>

          <button
            className="btn-terminal-icon"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand' : 'Collapse'}
          >
            {isMinimized ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Terminal Output Body */}
      {!isMinimized && (
        <div className="terminal-body font-code">
          {isRunning ? (
            <div className="terminal-loading">
              <Loader2 size={24} className="spin-fast text-cyan" />
              <p>Submitting source code to sandboxed Judge0 runner...</p>
            </div>
          ) : !executionResult ? (
            <div className="terminal-empty">
              <p>
                Press <span className="kbd">Run Code</span> or press{' '}
                <span className="kbd">Ctrl + Enter</span> to execute against the Judge0 sandbox.
              </p>
            </div>
          ) : (
            <div className="terminal-output-container">
              {/* Compile Output (if any) */}
              {executionResult.compile_output && (
                <div className="output-section compile-error-section">
                  <div className="section-title">
                    <XCircle size={14} />
                    <span>Compilation Output</span>
                  </div>
                  <pre className="output-pre text-error">{executionResult.compile_output}</pre>
                </div>
              )}

              {/* Standard Error (if any) */}
              {executionResult.stderr && (
                <div className="output-section stderr-section">
                  <div className="section-title">
                    <AlertCircle size={14} />
                    <span>Standard Error (stderr)</span>
                  </div>
                  <pre className="output-pre text-error">{executionResult.stderr}</pre>
                </div>
              )}

              {/* Standard Output */}
              {executionResult.stdout && (
                <div className="output-section stdout-section">
                  <div className="section-title">
                    <CheckCircle2 size={14} className="text-emerald" />
                    <span>Standard Output (stdout)</span>
                  </div>
                  <pre className="output-pre text-stdout">{executionResult.stdout}</pre>
                </div>
              )}

              {/* In case no output was produced */}
              {!executionResult.stdout && !executionResult.stderr && !executionResult.compile_output && (
                <div className="output-section">
                  <pre className="output-pre text-muted">[Program finished with no output.]</pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        .terminal-panel {
          background: rgba(10, 12, 16, 0.98);
          border-top: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          height: 240px;
          min-height: 44px;
          transition: height 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 10;
        }
        .terminal-panel.minimized {
          height: 44px;
        }
        .terminal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          background: rgba(15, 18, 26, 0.95);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          user-select: none;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }
        .terminal-title {
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--text-secondary);
        }
        .running-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.76rem;
          color: var(--accent-cyan);
          background: rgba(6, 182, 212, 0.1);
          padding: 3px 8px;
          border-radius: 4px;
        }
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.74rem;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 12px;
        }
        .status-success {
          background: rgba(16, 185, 129, 0.15);
          color: var(--accent-emerald);
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .status-warning {
          background: rgba(245, 158, 11, 0.15);
          color: var(--accent-amber);
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
        .status-error {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .meta-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.72rem;
          color: var(--text-muted);
          background: rgba(255, 255, 255, 0.04);
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-terminal-run {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2));
          border: 1px solid rgba(16, 185, 129, 0.4);
          color: #ffffff;
          padding: 5px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }
        .btn-terminal-run:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.35), rgba(6, 182, 212, 0.35));
          border-color: var(--accent-emerald);
          box-shadow: 0 0 12px rgba(16, 185, 129, 0.3);
        }
        .btn-terminal-run:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-terminal-icon {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 5px;
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
          opacity: 0.3;
          cursor: not-allowed;
        }
        .terminal-body {
          flex: 1;
          padding: 14px 18px;
          overflow-y: auto;
          font-size: 0.86rem;
          line-height: 1.6;
          background: #0a0c10;
        }
        .terminal-empty {
          color: var(--text-muted);
          font-size: 0.82rem;
          padding: 10px 0;
        }
        .terminal-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          height: 100%;
          color: var(--text-secondary);
          font-size: 0.85rem;
        }
        .kbd {
          background: rgba(255, 255, 255, 0.08);
          color: var(--accent-cyan);
          padding: 2px 7px;
          border-radius: 4px;
          font-size: 0.78rem;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .terminal-output-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .output-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .section-title {
          font-size: 0.74rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-muted);
        }
        .compile-error-section .section-title {
          color: #ef4444;
        }
        .stderr-section .section-title {
          color: #f87171;
        }
        .output-pre {
          margin: 0;
          font-family: inherit;
          white-space: pre-wrap;
          word-break: break-all;
          padding: 10px 14px;
          border-radius: 6px;
          background: rgba(17, 20, 29, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .text-stdout {
          color: #f1f5f9;
        }
        .text-error {
          color: #fca5a5;
          background: rgba(239, 68, 68, 0.05);
          border-color: rgba(239, 68, 68, 0.2);
        }
        .spin-fast {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .fill-emerald {
          fill: currentColor;
        }
      `}</style>
    </div>
  );
};
