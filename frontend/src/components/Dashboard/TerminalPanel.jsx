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
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const TerminalPanel = ({
  executionResult,
  isRunning,
  onRunCode,
  onClearOutput,
  onExplainError,
  isAiAnalyzing = false,
}) => {
  const { isDark } = useTheme();
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
    <div className={`terminal-panel ${isMinimized ? 'minimized' : ''} ${isDark ? 'dark' : 'light'}`}>
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
          {executionResult && (executionResult.stderr || executionResult.compile_output || (executionResult.status && executionResult.status.id !== 3)) && (
            <button
              type="button"
              className="btn-terminal-ai-explain font-brand"
              onClick={onExplainError}
              disabled={isAiAnalyzing}
              title="Ask CodeHive AI to diagnose error and generate diff fix"
            >
              <Sparkles size={13} className="text-amber" />
              <span>{isAiAnalyzing ? 'AI Analyzing...' : 'Explain with AI'}</span>
            </button>
          )}

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
                    <button
                      type="button"
                      className="btn-inline-ai-explain"
                      onClick={onExplainError}
                      disabled={isAiAnalyzing}
                    >
                      <Sparkles size={12} className="text-amber" />
                      <span>{isAiAnalyzing ? 'Analyzing...' : 'Explain with AI'}</span>
                    </button>
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
                    <button
                      type="button"
                      className="btn-inline-ai-explain"
                      onClick={onExplainError}
                      disabled={isAiAnalyzing}
                    >
                      <Sparkles size={12} className="text-amber" />
                      <span>{isAiAnalyzing ? 'Analyzing...' : 'Explain with AI'}</span>
                    </button>
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
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          height: 240px;
          min-height: 44px;
          transition: height 0.2s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease, border-color 0.2s ease;
          z-index: 10;
        }
        .terminal-panel.dark {
          background: #0a0c10;
          border-top-color: rgba(255, 255, 255, 0.08);
        }
        .terminal-panel.minimized {
          height: 44px;
        }
        .terminal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 18px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          user-select: none;
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }
        .terminal-panel.dark .terminal-header {
          background: #0d1017;
          border-bottom-color: rgba(255, 255, 255, 0.08);
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
        }
        .terminal-title {
          font-family: 'Outfit', sans-serif;
          font-size: 0.8rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          color: #1e293b;
        }
        .terminal-panel.dark .terminal-title {
          color: #f1f5f9;
        }
        .running-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.76rem;
          color: #0891b2;
          background: #ecfeff;
          border: 1px solid #cffafe;
          padding: 3px 10px;
          border-radius: 20px;
          font-weight: 600;
        }
        .terminal-panel.dark .running-indicator {
          color: #22d3ee;
          background: rgba(6, 182, 212, 0.15);
          border-color: rgba(6, 182, 212, 0.3);
        }
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 0.74rem;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 20px;
        }
        .status-success {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #bbf7d0;
        }
        .status-warning {
          background: #fffbeb;
          color: #b45309;
          border: 1px solid #fde68a;
        }
        .status-error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }
        .meta-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 0.72rem;
          color: #64748b;
          background: #ffffff;
          padding: 3px 10px;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          font-weight: 600;
        }
        .terminal-panel.dark .meta-badge {
          background: #11141d;
          border-color: rgba(255, 255, 255, 0.08);
          color: #94a3b8;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-terminal-run {
          background: #10b981;
          border: none;
          color: #ffffff;
          padding: 4px 14px;
          border-radius: 50px;
          font-size: 0.8rem;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.25);
          transition: all 0.18s ease;
        }
        .btn-terminal-run:hover:not(:disabled) {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
        }
        .btn-terminal-run:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        .btn-terminal-icon {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #64748b;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }
        .terminal-panel.dark .btn-terminal-icon {
          background: #11141d;
          border-color: rgba(255, 255, 255, 0.08);
          color: #94a3b8;
        }
        .btn-terminal-icon:hover:not(:disabled) {
          background: #f1f5f9;
          color: #0f172a;
          border-color: #cbd5e1;
        }
        .terminal-panel.dark .btn-terminal-icon:hover:not(:disabled) {
          background: #1e293b;
          color: #ffffff;
        }
        .btn-terminal-icon:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }
        .terminal-body {
          flex: 1;
          padding: 14px 18px;
          overflow-y: auto;
          font-size: 0.86rem;
          line-height: 1.6;
          background: #ffffff;
          color: #0f172a;
          transition: background-color 0.2s ease, color 0.2s ease;
        }
        .terminal-panel.dark .terminal-body {
          background: #090d16;
          color: #f8fafc;
        }
        .terminal-empty {
          color: #64748b;
          font-size: 0.84rem;
          padding: 12px 0;
        }
        .terminal-panel.dark .terminal-empty {
          color: #94a3b8;
        }
        .terminal-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          height: 100%;
          color: #64748b;
          font-size: 0.85rem;
        }
        .terminal-panel.dark .terminal-loading {
          color: #94a3b8;
        }
        .kbd {
          background: #f1f5f9;
          color: #0f172a;
          padding: 2px 7px;
          border-radius: 6px;
          font-size: 0.78rem;
          border: 1px solid #e2e8f0;
          font-weight: 600;
        }
        .terminal-panel.dark .kbd {
          background: rgba(255, 255, 255, 0.1);
          color: #38bdf8;
          border-color: rgba(255, 255, 255, 0.15);
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
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          display: flex;
          align-items: center;
          gap: 6px;
          color: #475569;
        }
        .terminal-panel.dark .section-title {
          color: #94a3b8;
        }
        .compile-error-section .section-title {
          color: #dc2626;
        }
        .terminal-panel.dark .compile-error-section .section-title {
          color: #f87171;
        }
        .stderr-section .section-title {
          color: #dc2626;
        }
        .terminal-panel.dark .stderr-section .section-title {
          color: #f87171;
        }
        .output-pre {
          margin: 0;
          font-family: inherit;
          white-space: pre-wrap;
          word-break: break-all;
          padding: 10px 14px;
          border-radius: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #0f172a;
        }
        .terminal-panel.dark .output-pre {
          background: rgba(17, 24, 39, 0.75);
          border-color: rgba(255, 255, 255, 0.08);
          color: #f8fafc;
        }
        .stdout-section .output-pre {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #15803d;
          font-weight: 500;
        }
        .terminal-panel.dark .stdout-section .output-pre {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.25);
          color: #34d399;
        }
        .stderr-section .output-pre, .compile-error-section .output-pre {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          font-weight: 500;
        }
        .terminal-panel.dark .stderr-section .output-pre,
        .terminal-panel.dark .compile-error-section .output-pre {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.25);
          color: #fca5a5;
        }
        .spin-fast {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .fill-emerald {
          fill: currentColor;
        }
        .btn-terminal-ai-explain {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 6px;
          border: 1px solid rgba(245, 158, 11, 0.4);
          background: rgba(245, 158, 11, 0.12);
          color: #d97706;
          font-size: 0.76rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }
        .terminal-panel.dark .btn-terminal-ai-explain {
          background: rgba(245, 158, 11, 0.18);
          color: #fbbf24;
          border-color: rgba(245, 158, 11, 0.5);
        }
        .btn-terminal-ai-explain:hover:not(:disabled) {
          background: #f59e0b;
          color: #ffffff;
          transform: translateY(-1px);
        }
        .btn-terminal-ai-explain:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-inline-ai-explain {
          margin-left: auto;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 9px;
          border-radius: 6px;
          border: 1px solid rgba(245, 158, 11, 0.3);
          background: rgba(245, 158, 11, 0.1);
          color: #d97706;
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s;
        }
        .terminal-panel.dark .btn-inline-ai-explain {
          color: #fbbf24;
          border-color: rgba(245, 158, 11, 0.4);
        }
        .btn-inline-ai-explain:hover:not(:disabled) {
          background: #f59e0b;
          color: white;
        }
      `}</style>
    </div>
  );
};
