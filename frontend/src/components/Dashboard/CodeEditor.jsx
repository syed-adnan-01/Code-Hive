import React, { useRef, useEffect, useState, useCallback } from 'react';

export const CodeEditor = ({
  code,
  onChange,
  onCursorChange,
  onRunCode
}) => {
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const [activeLine, setActiveLine] = useState(1);

  // Split code into lines for gutter
  const lines = code.split('\n');
  const lineCount = lines.length;

  const handleScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const updateCursorStats = useCallback(() => {
    if (!textareaRef.current) return;
    const selectionStart = textareaRef.current.selectionStart;
    const textBeforeCursor = code.substring(0, selectionStart);
    const linesBefore = textBeforeCursor.split('\n');
    const currentLine = linesBefore.length;
    const currentCol = linesBefore[linesBefore.length - 1].length + 1;

    setActiveLine(currentLine);
    if (onCursorChange) {
      onCursorChange({ line: currentLine, col: currentCol });
    }
  }, [code, onCursorChange]);

  const handleKeyDown = (e) => {
    // Handle Ctrl+Enter / Cmd+Enter to Run Code
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (onRunCode) onRunCode();
      return;
    }

    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      const { selectionStart, selectionEnd } = textarea;

      if (e.shiftKey) {
        // Unindenting logic
        const lineStartPos = code.lastIndexOf('\n', selectionStart - 1) + 1;
        if (code.substring(lineStartPos, lineStartPos + 2) === '  ') {
          const newCode = code.substring(0, lineStartPos) + code.substring(lineStartPos + 2);
          onChange(newCode);
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = Math.max(lineStartPos, selectionStart - 2);
          }, 0);
        }
      } else {
        // Indenting logic (2 spaces)
        const indent = '  ';
        const newCode = code.substring(0, selectionStart) + indent + code.substring(selectionEnd);
        onChange(newCode);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + indent.length;
          updateCursorStats();
        }, 0);
      }
    }
  };

  useEffect(() => {
    updateCursorStats();
  }, [updateCursorStats]);

  return (
    <div className="code-editor-layout font-code">
      {/* Line Numbers Gutter */}
      <div className="line-numbers-gutter" ref={lineNumbersRef}>
        {Array.from({ length: lineCount }).map((_, i) => {
          const lineNumber = i + 1;
          const isActive = lineNumber === activeLine;
          return (
            <div
              key={lineNumber}
              className={`line-number ${isActive ? 'active-line-num' : ''}`}
            >
              {lineNumber}
            </div>
          );
        })}
      </div>

      {/* Code Textarea Area */}
      <div className="textarea-wrapper">
        {/* Simulated Peer Cursors */}
        <div className="peer-cursor peer-alex" style={{ top: '135px', left: '240px' }}>
          <span className="peer-pointer"></span>
          <span className="peer-label">Alex (typing...)</span>
        </div>

        <div className="peer-cursor peer-sarah" style={{ top: '215px', left: '160px' }}>
          <span className="peer-pointer"></span>
          <span className="peer-label">Sarah</span>
        </div>

        <textarea
          ref={textareaRef}
          className="code-textarea font-code"
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onScroll={handleScroll}
          onClick={updateCursorStats}
          onKeyUp={updateCursorStats}
          onKeyDown={handleKeyDown}
          placeholder="// Type your code here..."
          spellCheck={false}
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
        />
      </div>

      <style>{`
        .code-editor-layout {
          display: flex;
          flex: 1;
          background: rgba(10, 12, 16, 0.95);
          position: relative;
          overflow: hidden;
          height: 100%;
        }
        .line-numbers-gutter {
          width: 52px;
          background: rgba(13, 16, 23, 0.95);
          border-right: 1px solid var(--border-subtle);
          padding: 16px 0;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          padding-right: 12px;
          user-select: none;
          overflow: hidden;
          color: var(--text-muted);
          font-size: 0.86rem;
          line-height: 1.6;
        }
        .line-number {
          height: 1.6em;
          display: flex;
          align-items: center;
          transition: color 0.15s;
        }
        .line-number.active-line-num {
          color: var(--accent-cyan);
          font-weight: 600;
        }
        .textarea-wrapper {
          position: relative;
          flex: 1;
          display: flex;
        }
        .code-textarea {
          width: 100%;
          height: 100%;
          background: transparent;
          border: none;
          color: #e2e8f0;
          font-size: 0.88rem;
          line-height: 1.6;
          padding: 16px 20px;
          outline: none;
          resize: none;
          white-space: pre;
          overflow-wrap: normal;
          overflow-x: auto;
          tab-size: 2;
          caret-color: var(--accent-cyan);
        }
        .code-textarea::selection {
          background: rgba(99, 102, 241, 0.35);
        }
        .peer-cursor {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 4px;
          z-index: 5;
          pointer-events: none;
          opacity: 0.85;
          transition: transform 0.3s ease;
        }
        .peer-pointer {
          width: 2px;
          height: 18px;
        }
        .peer-alex .peer-pointer { background: #ec4899; box-shadow: 0 0 8px #ec4899; }
        .peer-sarah .peer-pointer { background: #a855f7; box-shadow: 0 0 8px #a855f7; }
        .peer-label {
          font-size: 0.68rem;
          padding: 2px 6px;
          border-radius: 4px;
          color: #ffffff;
          font-weight: 600;
        }
        .peer-alex .peer-label { background: #ec4899; }
        .peer-sarah .peer-label { background: #a855f7; }
      `}</style>
    </div>
  );
};
