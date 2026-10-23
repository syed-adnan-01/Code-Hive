import React, { useState, useRef, useEffect } from 'react';
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
  Square,
  Maximize2,
  Minimize2,
  FileText,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { InteractiveTerminal } from './InteractiveTerminal';

export const TerminalPanel = ({
  executionResult,
  isRunning,
  onRunCode,
  onClearOutput,
  onExplainError,
  isAiAnalyzing = false,
  roomId = 'solo',
  userRole = 'editor',
  selectedLanguage,
  activeCode = '',
  interactiveTermRef = null,
}) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('terminal'); // 'terminal' | 'console'
  const [copied, setCopied] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPtyRunning, setIsPtyRunning] = useState(false);

  const internalTermRef = useRef(null);
  const termRef = interactiveTermRef || internalTermRef;

  const isReadOnly = userRole === 'viewer';

  // Automatically switch to console tab if batch execution starts or finishes
  useEffect(() => {
    if (isRunning) {
      setActiveTab('console');
      setIsMinimized(false);
    }
  }, [isRunning]);

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

  const handleRunInTerminal = () => {
    if (isReadOnly) return;
    setIsMinimized(false);
    setActiveTab('terminal');
    if (termRef.current) {
      termRef.current.runInteractiveCode({
        sourceCode: activeCode,
        languageId: selectedLanguage?.id || 63,
      });
    }
  };

  const handleStopTerminal = () => {
    if (termRef.current) {
      termRef.current.sendInterrupt();
    }
  };

  const handleClearTerminal = () => {
    if (termRef.current) {
      termRef.current.clearTerminal();
    }
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
    <div
      className={`terminal-panel ${isMinimized ? 'minimized' : ''} ${isExpanded ? 'expanded' : ''} ${
        isDark ? 'dark' : 'light'
      }`}
    >
      {/* Terminal Bar Header with IDE Tabs */}
      <div className="terminal-header">
        <div className="header-left">
          {/* Navigation Tabs */}
          <div className="terminal-tabs font-brand">
            <button
              type="button"
              className={`terminal-tab ${activeTab === 'terminal' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('terminal');
                setIsMinimized(false);
                setTimeout(() => {
                  termRef.current?.fit();
                  termRef.current?.focus();
                }, 50);
              }}
              title="Interactive PTY Shell (Live stdin/stdout & CLI prompts)"
            >
              <TerminalIcon size={14} className={activeTab === 'terminal' ? 'text-emerald' : ''} />
              <span>Terminal</span>
              {isPtyRunning && <span className="tab-running-dot" title="Process active"></span>}
            </button>

            <button
              type="button"
              className={`terminal-tab ${activeTab === 'console' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('console');
                setIsMinimized(false);
              }}
              title="Batch Output Console (Judge0 sandbox & AI diagnosis)"
            >
              <FileText size={14} className={activeTab === 'console' ? 'text-cyan' : ''} />
              <span>Output Console</span>
              {isRunning && <Loader2 size={11} className="spin-fast text-cyan" />}
            </button>
          </div>

          {/* Status indicators */}
          {activeTab === 'terminal' && isPtyRunning && (
            <div className="running-indicator font-code">
              <span className="pulse-indicator"></span>
              <span>Running...</span>
            </div>
          )}

          {activeTab === 'console' && (
            <>
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
            </>
          )}
        </div>

        {/* Header Action Buttons */}
        <div className="header-actions">
          {activeTab === 'terminal' ? (
            <>
              {isPtyRunning && !isReadOnly && (
                <button
                  type="button"
                  className="btn-terminal-action btn-term-stop font-brand"
                  onClick={handleStopTerminal}
                  title="Stop Running Process (Ctrl+C)"
                >
                  <Square size={13} className="fill-current" />
                  <span>Stop</span>
                </button>
              )}

              {!isReadOnly && (
                <button
                  type="button"
                  className="btn-terminal-run font-brand"
                  onClick={handleRunInTerminal}
                  title="Run code interactively in terminal"
                >
                  <Play size={13} className="text-emerald fill-emerald" />
                  <span>Run in Terminal</span>
                </button>
              )}

              <button
                type="button"
                className="btn-terminal-icon"
                onClick={handleClearTerminal}
                title="Clear Terminal Screen"
              >
                <Trash2 size={14} />
              </button>
            </>
          ) : (
            <>
              {executionResult &&
                (executionResult.stderr ||
                  executionResult.compile_output ||
                  (executionResult.status && executionResult.status.id !== 3)) && (
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
                className="btn-terminal-run font-brand"
                onClick={onRunCode}
                disabled={isRunning || isReadOnly}
                title="Execute Code on Judge0 (Ctrl + Enter)"
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
            </>
          )}

          {/* Maximize / Restore Toggle */}
          <button
            type="button"
            className="btn-terminal-icon"
            onClick={() => {
              if (isMinimized) setIsMinimized(false);
              setIsExpanded(!isExpanded);
            }}
            title={isExpanded ? 'Restore Panel Height' : 'Maximize Terminal'}
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          {/* Minimize / Expand Toggle */}
          <button
            type="button"
            className="btn-terminal-icon"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand Panel' : 'Collapse Panel'}
          >
            {isMinimized ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Terminal / Console Body */}
      {!isMinimized && (
        <div className="terminal-body-wrapper">
          <div
            className="tab-panel-container"
            style={{
              display: activeTab === 'terminal' ? 'flex' : 'none',
              flex: 1,
              minHeight: 0,
              height: '100%',
              width: '100%',
            }}
          >
            <InteractiveTerminal
              ref={termRef}
              roomId={roomId}
              userRole={userRole}
              isDark={isDark}
              onRunningChange={setIsPtyRunning}
              className="flex-1"
            />
          </div>

          <div
            className="tab-panel-container terminal-body font-code"
            style={{
              display: activeTab === 'console' ? 'flex' : 'none',
              flex: 1,
              flexDirection: 'column',
              minHeight: 0,
              height: '100%',
              width: '100%',
              overflowY: 'auto',
            }}
          >
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
        </div>
      )}

      <style>{`
        .terminal-panel {
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          height: 250px;
          min-height: 44px;
          transition: height 0.2s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease, border-color 0.2s ease;
          z-index: 10;
        }
        .terminal-panel.dark {
          background: #0d1117;
          border-top-color: #2b2b2b;
        }
        .terminal-panel.expanded {
          height: 440px;
          max-height: 75vh;
        }
        .terminal-panel.minimized {
          height: 44px;
        }
        .terminal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px clamp(8px, 1.2vw, 16px);
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          user-select: none;
          transition: background-color 0.2s ease, border-color 0.2s ease;
          min-width: 0;
          overflow-x: auto;
          overflow-y: hidden;
          scrollbar-width: none;
          min-height: 42px;
        }
        .terminal-header::-webkit-scrollbar {
          display: none;
        }
        .terminal-panel.dark .terminal-header {
          background: #161b22;
          border-bottom-color: #21262d;
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: clamp(8px, 1.2vw, 16px);
          flex-shrink: 0;
          min-width: 0;
        }
        .terminal-tabs {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .terminal-tab {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          border-radius: 6px;
          border: 1px solid transparent;
          background: transparent;
          font-family: 'Outfit', sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          color: #64748b;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .terminal-panel.dark .terminal-tab {
          color: #8b949e;
        }
        .terminal-tab:hover {
          color: #0f172a;
          background: #f1f5f9;
        }
        .terminal-panel.dark .terminal-tab:hover {
          color: #f0f6fc;
          background: #21262d;
        }
        .terminal-tab.active {
          color: #0f172a;
          background: #ffffff;
          border-color: #cbd5e1;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        .terminal-panel.dark .terminal-tab.active {
          color: #f0f6fc;
          background: #0d1117;
          border-color: #30363d;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        .tab-running-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          animation: pulse 1.5s infinite;
        }
        .pulse-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 6px rgba(16, 185, 129, 0.6);
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.3); }
        }
        .running-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.74rem;
          color: #0891b2;
          background: #ecfeff;
          border: 1px solid #cffafe;
          padding: 3px 9px;
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
          background: #f1f5f9;
          padding: 3px 8px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
        }
        .terminal-panel.dark .meta-badge {
          color: #94a3b8;
          background: #21262d;
          border-color: #30363d;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }
        .btn-terminal-run {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #10b981;
          color: #ffffff;
          border: none;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 0.76rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-terminal-run:hover:not(:disabled) {
          background: #059669;
          transform: translateY(-1px);
        }
        .btn-terminal-run:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-terminal-action {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.76rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-term-stop {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #ef4444;
        }
        .btn-term-stop:hover {
          background: rgba(239, 68, 68, 0.25);
          color: #f87171;
        }
        .btn-terminal-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: #64748b;
          width: 26px;
          height: 26px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .terminal-panel.dark .btn-terminal-icon {
          color: #8b949e;
        }
        .btn-terminal-icon:hover:not(:disabled) {
          background: #e2e8f0;
          color: #0f172a;
        }
        .terminal-panel.dark .btn-terminal-icon:hover:not(:disabled) {
          background: #21262d;
          color: #f0f6fc;
        }
        .btn-terminal-icon:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .terminal-body-wrapper {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }
        .terminal-body {
          flex: 1;
          padding: 12px 18px;
          overflow-y: auto;
          min-height: 0;
          font-size: 0.84rem;
          line-height: 1.5;
        }
        .terminal-empty {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          text-align: center;
        }
        .terminal-panel.dark .terminal-empty {
          color: #64748b;
        }
        .kbd {
          background: #e2e8f0;
          color: #334155;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 600;
          font-size: 0.78rem;
          border: 1px solid #cbd5e1;
        }
        .terminal-panel.dark .kbd {
          background: #21262d;
          color: #cbd5e1;
          border-color: #30363d;
        }
        .terminal-loading {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #64748b;
        }
        .terminal-panel.dark .terminal-loading {
          color: #94a3b8;
        }
        .terminal-output-container {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .output-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .section-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.74rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .stdout-section .section-title {
          color: #16a34a;
        }
        .compile-error-section .section-title,
        .terminal-panel.dark .compile-error-section .section-title {
          color: #f87171;
        }
        .stderr-section .section-title,
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
          background: #161b22;
          border-color: #21262d;
          color: #c9d1d9;
        }
        .stdout-section .output-pre {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #15803d;
          font-weight: 500;
        }
        .terminal-panel.dark .stdout-section .output-pre {
          background: rgba(16, 185, 129, 0.08);
          border-color: rgba(16, 185, 129, 0.2);
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
          background: rgba(239, 68, 68, 0.08);
          border-color: rgba(239, 68, 68, 0.2);
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
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid rgba(245, 158, 11, 0.4);
          background: rgba(245, 158, 11, 0.12);
          color: #d97706;
          font-size: 0.74rem;
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

        @media (max-width: 900px) {
          .meta-badge {
            display: none;
          }
          .btn-terminal-run span {
            display: none;
          }
          .btn-terminal-ai-explain span {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};
