import React from 'react';
import { Keyboard, Trash2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const StdinPanel = ({ stdin, onChangeStdin, isOpen, onToggleOpen, isReadOnly = false }) => {
  const { isDark } = useTheme();

  const handleInsertSample = () => {
    if (isReadOnly) return;
    onChangeStdin('5\n10 20 30 40 50\nTest User Input');
  };

  return (
    <div className={`stdin-container ${isOpen ? 'open' : 'closed'} ${isDark ? 'dark' : 'light'}`}>
      <div className="stdin-header" onClick={onToggleOpen}>
        <div className="stdin-header-title">
          <Keyboard size={14} className="stdin-icon" />
          <span className="font-brand">STANDARD INPUT (STDIN)</span>
          {stdin && <span className="stdin-length-badge font-code">{stdin.length} chars</span>}
        </div>

        <div className="stdin-header-actions" onClick={(e) => e.stopPropagation()}>
          {!isReadOnly && (
            <>
              <button
                type="button"
                className="btn-stdin-tool"
                onClick={handleInsertSample}
                title="Insert Sample Stdin"
              >
                <Sparkles size={12} className="text-amber" />
                <span>Sample Input</span>
              </button>

              {stdin && (
                <button
                  type="button"
                  className="btn-stdin-tool"
                  onClick={() => onChangeStdin('')}
                  title="Clear Stdin"
                >
                  <Trash2 size={12} />
                  <span>Clear</span>
                </button>
              )}
            </>
          )}

          <button
            type="button"
            className="btn-stdin-icon"
            onClick={onToggleOpen}
            title={isOpen ? 'Collapse' : 'Expand'}
          >
            {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="stdin-body">
          <textarea
            className="stdin-textarea font-code"
            placeholder={isReadOnly ? "Standard input is read-only for viewers." : "Enter standard input (stdin) for your program here (e.g. test cases, numbers, arguments)..."}
            value={stdin}
            onChange={(e) => !isReadOnly && onChangeStdin(e.target.value)}
            disabled={isReadOnly}
            spellCheck={false}
          />
        </div>
      )}

      <style>{`
        .stdin-container {
          background: #ffffff;
          border-top: 1px solid #e2e8f0;
          user-select: none;
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }
        .stdin-container.dark {
          background: #181818;
          border-top-color: #2b2b2b;
        }
        .stdin-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 18px;
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          cursor: pointer;
          font-size: 0.76rem;
          color: #475569;
          transition: background-color 0.2s ease, border-color 0.2s ease;
        }
        .stdin-container.dark .stdin-header {
          background: #181818;
          border-bottom-color: #2b2b2b;
          color: #94a3b8;
        }
        .stdin-header-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #1e293b;
        }
        .stdin-container.dark .stdin-header-title {
          color: #f1f5f9;
        }
        .stdin-icon {
          color: #06b6d4;
        }
        .stdin-length-badge {
          background: #ecfeff;
          border: 1px solid #cffafe;
          color: #0891b2;
          padding: 2px 8px;
          border-radius: 20px;
          font-size: 0.7rem;
          font-weight: 600;
        }
        .stdin-container.dark .stdin-length-badge {
          background: rgba(6, 182, 212, 0.15);
          border-color: rgba(6, 182, 212, 0.3);
          color: #22d3ee;
        }
        .stdin-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-stdin-tool {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #475569;
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .stdin-container.dark .btn-stdin-tool {
          background: #252526;
          border-color: #333333;
          color: #cccccc;
        }
        .btn-stdin-tool:hover {
          background: #f1f5f9;
          color: #0f172a;
          border-color: #cbd5e1;
        }
        .stdin-container.dark .btn-stdin-tool:hover {
          background: #2d2d2d;
          border-color: #3e3e42;
          color: #ffffff;
        }
        .btn-stdin-icon {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          color: #64748b;
          cursor: pointer;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }
        .stdin-container.dark .btn-stdin-icon {
          background: #252526;
          border-color: #333333;
          color: #858585;
        }
        .btn-stdin-icon:hover {
          color: #0f172a;
          background: #f1f5f9;
        }
        .stdin-container.dark .btn-stdin-icon:hover {
          color: #ffffff;
          background: #2d2d2d;
          border-color: #3e3e42;
        }
        .stdin-body {
          padding: 10px 18px;
          background: #ffffff;
          transition: background-color 0.2s ease;
        }
        .stdin-container.dark .stdin-body {
          background: #1e1e1e;
        }
        .stdin-textarea {
          width: 100%;
          height: 64px;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px 12px;
          color: #0f172a;
          font-size: 0.82rem;
          line-height: 1.5;
          outline: none;
          resize: none;
          box-sizing: border-box;
          transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;
        }
        .stdin-container.dark .stdin-textarea {
          background: #252526;
          border: 1px solid #333333;
          color: #d4d4d4;
        }
        .stdin-textarea:focus {
          border-color: #6366f1;
        }
        .stdin-container.dark .stdin-textarea:focus {
          border-color: #007acc;
        }
        .stdin-textarea::placeholder {
          color: #94a3b8;
        }
        .stdin-container.dark .stdin-textarea::placeholder {
          color: #858585;
        }
      `}</style>
    </div>
  );
};
