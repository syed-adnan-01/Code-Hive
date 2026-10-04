import React, { useRef } from 'react';
import Editor from '@monaco-editor/react';
import { Hexagon } from 'lucide-react';

export const CodeEditor = ({
  code,
  language = 'javascript',
  onChange,
  onCursorChange,
  onRunCode,
  isReadOnly = false,
}) => {
  const editorRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define CodeHive customized dark theme for Monaco
    monaco.editor.defineTheme('codehive-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'a855f7', fontStyle: 'bold' },
        { token: 'string', foreground: '10b981' },
        { token: 'number', foreground: 'f59e0b' },
        { token: 'type', foreground: '06b6d4' },
        { token: 'function', foreground: '6366f1' },
      ],
      colors: {
        'editor.background': '#0a0c10',
        'editor.foreground': '#f8fafc',
        'editorCursor.foreground': '#06b6d4',
        'editor.lineHighlightBackground': '#14182455',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#06b6d4',
        'editor.selectionBackground': '#6366f133',
        'editor.inactiveSelectionBackground': '#6366f120',
      },
    });

    monaco.editor.setTheme('codehive-dark');

    // Track cursor movements
    editor.onDidChangeCursorPosition((e) => {
      if (onCursorChange) {
        onCursorChange({
          line: e.position.lineNumber,
          col: e.position.column,
        });
      }
    });

    // Keyboard shortcut: Ctrl+Enter or Cmd+Enter to Run Code
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (onRunCode) {
        onRunCode();
      }
    });
  };

  return (
    <div className="monaco-editor-container">
      <Editor
        height="100%"
        language={language}
        value={code}
        onChange={(val) => onChange(val || '')}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          readOnly: isReadOnly,
          fontSize: 14,
          fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
          fontLigatures: true,
          minimap: { enabled: true, maxColumn: 80, scale: 0.8 },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          automaticLayout: true,
          tabSize: 2,
          padding: { top: 16, bottom: 16 },
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          renderLineHighlight: 'all',
          bracketPairColorization: { enabled: true },
          lineNumbersMinChars: 3,
        }}
        loading={
          <div className="monaco-loading-spinner font-brand">
            <Hexagon size={32} className="monaco-spin-icon" />
            <span>Loading Monaco Editor Engine...</span>
          </div>
        }
      />

      <style>{`
        .monaco-editor-container {
          flex: 1;
          height: 100%;
          width: 100%;
          background: #0a0c10;
          position: relative;
          overflow: hidden;
        }
        .monaco-loading-spinner {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: var(--text-secondary);
          font-size: 0.95rem;
          background: #0a0c10;
        }
        .monaco-spin-icon {
          color: var(--accent-indigo);
          animation: spin 2s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); color: var(--accent-indigo); }
          50% { transform: rotate(180deg); color: var(--accent-cyan); }
          100% { transform: rotate(360deg); color: var(--accent-indigo); }
        }
      `}</style>
    </div>
  );
};
