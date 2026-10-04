import React from 'react';
import { DiffEditor } from '@monaco-editor/react';
import {
  Sparkles,
  Check,
  X,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Shield,
  FileCode,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const AiDebugModal = ({
  isOpen,
  onClose,
  debugResult,
  originalCode,
  language = 'javascript',
  onApplyFix,
  isReadOnly = false,
}) => {
  const { isDark } = useTheme();

  if (!isOpen || !debugResult) return null;

  return (
    <div className={`ai-modal-overlay ${isDark ? 'dark' : 'light'}`}>
      <div className="ai-modal-card">
        {/* Header */}
        <div className="ai-modal-header">
          <div className="ai-header-left">
            <div className="ai-icon-badge">
              <Sparkles size={20} className="text-amber animate-pulse" />
            </div>
            <div>
              <div className="ai-title-row">
                <h3 className="ai-modal-title font-brand">CodeHive AI Debugger</h3>
                <span className="ai-provider-badge font-code">
                  {debugResult.provider || 'Gemini 1.5 Flash'}
                </span>
              </div>
              <p className="ai-modal-subtitle">
                Automated error analysis, root cause diagnosis, and Monaco visual code diff
              </p>
            </div>
          </div>

          <button className="btn-close-ai" onClick={onClose} title="Close AI Debugger">
            <X size={18} />
          </button>
        </div>

        {/* Security & Data Privacy Notice */}
        <div className="ai-privacy-banner font-code">
          <Shield size={14} className="text-indigo" />
          <span>
            Code is sent securely to the AI reasoning engine. Suggested changes are never applied without your confirmation.
          </span>
        </div>

        {/* Diagnosis & Cause Panel */}
        <div className="ai-diagnosis-container">
          <div className="diagnosis-summary-box">
            <div className="summary-header">
              <AlertTriangle size={16} className="text-amber" />
              <span className="summary-title font-brand">{debugResult.summary}</span>
              {debugResult.errorLines?.length > 0 && (
                <div className="error-line-pills">
                  {debugResult.errorLines.map((ln) => (
                    <span key={ln} className="error-line-pill font-code">
                      Line {ln}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <p className="diagnosis-cause">{debugResult.cause}</p>
          </div>

          {debugResult.steps && debugResult.steps.length > 0 && (
            <div className="diagnosis-steps-box">
              <div className="steps-title font-brand">
                <Lightbulb size={15} className="text-cyan" />
                <span>Fix Methodology</span>
              </div>
              <ul className="steps-list">
                {debugResult.steps.map((step, idx) => (
                  <li key={idx} className="step-item">
                    <ArrowRight size={13} className="step-arrow" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Monaco Diff Viewer */}
        <div className="ai-diff-container">
          <div className="diff-header-bar font-code">
            <div className="diff-col-title">
              <span className="dot dot-red" />
              <span>Current Code (With Error)</span>
            </div>
            <div className="diff-col-title">
              <span className="dot dot-emerald" />
              <span>AI Suggested Fix (Corrected)</span>
            </div>
          </div>

          <div className="diff-editor-wrapper">
            <DiffEditor
              height="100%"
              original={originalCode || ''}
              modified={debugResult.fixedCode || ''}
              language={language.toLowerCase()}
              theme={isDark ? 'vs-dark' : 'light'}
              options={{
                readOnly: true,
                renderSideBySide: true,
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                automaticLayout: true,
                folding: true,
                diffWordWrap: 'on',
              }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="ai-modal-footer">
          <button className="btn-cancel font-brand" onClick={onClose}>
            Close
          </button>

          <button
            className="btn-apply-fix font-brand"
            disabled={isReadOnly}
            onClick={() => {
              onApplyFix(debugResult.fixedCode);
              onClose();
            }}
            title={isReadOnly ? 'Viewers cannot apply fixes' : 'Apply AI fix directly into Monaco editor'}
          >
            <Check size={16} />
            <span>{isReadOnly ? 'View Only (Cannot Apply)' : 'Apply Fix to Editor'}</span>
          </button>
        </div>
      </div>

      <style>{`
        .ai-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .ai-modal-card {
          width: 100%;
          max-width: 980px;
          height: 88vh;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .ai-modal-overlay.dark .ai-modal-card {
          background: #0d1117;
          border-color: rgba(255, 255, 255, 0.1);
          color: #f0f6fc;
        }
        .ai-modal-header {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .ai-modal-overlay.dark .ai-modal-header {
          background: #090d16;
          border-bottom-color: rgba(255, 255, 255, 0.08);
        }
        .ai-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .ai-icon-badge {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(245, 158, 11, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ai-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ai-modal-title {
          font-size: 1.15rem;
          font-weight: 700;
          margin: 0;
        }
        .ai-provider-badge {
          font-size: 0.68rem;
          padding: 2px 7px;
          border-radius: 9999px;
          background: rgba(99, 102, 241, 0.15);
          color: #6366f1;
          font-weight: 700;
        }
        .ai-modal-subtitle {
          font-size: 0.8rem;
          color: #64748b;
          margin: 2px 0 0 0;
        }
        .btn-close-ai {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 6px;
          border-radius: 6px;
          transition: all 0.15s;
        }
        .btn-close-ai:hover {
          background: rgba(0, 0, 0, 0.06);
          color: #0f172a;
        }
        .ai-modal-overlay.dark .btn-close-ai:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #ffffff;
        }
        .ai-privacy-banner {
          padding: 8px 20px;
          background: rgba(99, 102, 241, 0.06);
          border-bottom: 1px solid rgba(99, 102, 241, 0.1);
          font-size: 0.76rem;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .ai-diagnosis-container {
          padding: 14px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          border-bottom: 1px solid #e2e8f0;
          background: #ffffff;
        }
        .ai-modal-overlay.dark .ai-diagnosis-container {
          background: #0d1117;
          border-bottom-color: rgba(255, 255, 255, 0.08);
        }
        .diagnosis-summary-box {
          border-radius: 8px;
          padding: 10px 14px;
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.2);
        }
        .summary-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .summary-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: #d97706;
        }
        .error-line-pills {
          display: flex;
          gap: 6px;
          margin-left: auto;
        }
        .error-line-pill {
          background: #ef4444;
          color: white;
          padding: 1px 7px;
          border-radius: 9999px;
          font-size: 0.7rem;
          font-weight: 700;
        }
        .diagnosis-cause {
          font-size: 0.83rem;
          color: #475569;
          margin: 0;
          line-height: 1.45;
        }
        .ai-modal-overlay.dark .diagnosis-cause {
          color: #cbd5e1;
        }
        .diagnosis-steps-box {
          padding: 8px 12px;
          border-radius: 8px;
          background: rgba(6, 182, 212, 0.06);
          border: 1px solid rgba(6, 182, 212, 0.15);
        }
        .steps-title {
          font-size: 0.8rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
          color: #0891b2;
        }
        .steps-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .step-item {
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          gap: 6px;
          color: #475569;
        }
        .ai-modal-overlay.dark .step-item {
          color: #94a3b8;
        }
        .step-arrow {
          color: #06b6d4;
          flex-shrink: 0;
        }
        .ai-diff-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .diff-header-bar {
          display: flex;
          justify-content: space-around;
          padding: 6px 14px;
          background: #f1f5f9;
          border-bottom: 1px solid #e2e8f0;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .ai-modal-overlay.dark .diff-header-bar {
          background: #090d16;
          border-bottom-color: rgba(255, 255, 255, 0.08);
          color: #94a3b8;
        }
        .diff-col-title {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }
        .dot-red { background: #ef4444; }
        .dot-emerald { background: #10b981; }
        .diff-editor-wrapper {
          flex: 1;
          min-height: 220px;
        }
        .ai-modal-footer {
          padding: 12px 20px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          background: #f8fafc;
        }
        .ai-modal-overlay.dark .ai-modal-footer {
          background: #090d16;
          border-top-color: rgba(255, 255, 255, 0.08);
        }
        .btn-cancel {
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: transparent;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          color: inherit;
        }
        .btn-apply-fix {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          border-radius: 8px;
          border: none;
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          font-size: 0.85rem;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
          transition: all 0.15s;
        }
        .btn-apply-fix:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-apply-fix:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.35);
        }
      `}</style>
    </div>
  );
};
