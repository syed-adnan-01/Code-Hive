import React from 'react';
import { Keyboard, Trash2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

export const StdinPanel = ({ stdin, onChangeStdin, isOpen, onToggleOpen }) => {
  const handleInsertSample = () => {
    onChangeStdin('5\n10 20 30 40 50\nTest User Input');
  };

  return (
    <div className={`stdin-container ${isOpen ? 'open' : 'closed'}`}>
      <div className="stdin-header" onClick={onToggleOpen}>
        <div className="stdin-header-title">
          <Keyboard size={14} className="text-cyan" />
          <span className="font-brand">STANDARD INPUT (STDIN)</span>
          {stdin && <span className="stdin-length-badge font-code">{stdin.length} chars</span>}
        </div>

        <div className="stdin-header-actions" onClick={(e) => e.stopPropagation()}>
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
            placeholder="Enter standard input (stdin) for your program here (e.g. test cases, numbers, arguments)..."
            value={stdin}
            onChange={(e) => onChangeStdin(e.target.value)}
            spellCheck={false}
          />
        </div>
      )}

      <style>{`
        .stdin-container {
          background: rgba(13, 16, 23, 0.95);
          border-top: 1px solid var(--border-subtle);
          user-select: none;
        }
        .stdin-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 16px;
          background: rgba(17, 20, 29, 0.9);
          cursor: pointer;
          font-size: 0.76rem;
          color: var(--text-secondary);
        }
        .stdin-header-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          letter-spacing: 0.06em;
        }
        .stdin-length-badge {
          background: rgba(6, 182, 212, 0.15);
          color: var(--accent-cyan);
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 0.7rem;
        }
        .stdin-header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-stdin-tool {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          color: var(--text-secondary);
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.72rem;
          display: flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .btn-stdin-tool:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }
        .btn-stdin-icon {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 2px 4px;
          display: flex;
          align-items: center;
        }
        .stdin-body {
          padding: 8px 16px;
          background: #0a0c10;
        }
        .stdin-textarea {
          width: 100%;
          height: 64px;
          background: rgba(17, 20, 29, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 6px;
          padding: 8px 12px;
          color: #f1f5f9;
          font-size: 0.82rem;
          line-height: 1.5;
          outline: none;
          resize: none;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }
        .stdin-textarea:focus {
          border-color: var(--accent-cyan);
        }
        .stdin-textarea::placeholder {
          color: var(--text-muted);
        }
      `}</style>
    </div>
  );
};
