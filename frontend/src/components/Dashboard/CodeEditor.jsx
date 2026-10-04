import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { MonacoBinding } from 'y-monaco';
import { Hexagon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const CodeEditor = ({
  code,
  language = 'javascript',
  onChange,
  onCursorChange,
  onRunCode,
  isReadOnly = false,
  ytext = null,
  provider = null,
  activeFileName = '',
}) => {
  const { isDark } = useTheme();
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const bindingRef = useRef(null);

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // 1. Define CodeHive customized dark theme
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
        'editorGutter.background': '#0a0c10',
      },
    });

    // 2. Define CodeHive customized light theme
    monaco.editor.defineTheme('codehive-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '94a3b8', fontStyle: 'italic' },
        { token: 'keyword', foreground: '6366f1', fontStyle: 'bold' },
        { token: 'string', foreground: '059669' },
        { token: 'number', foreground: 'd97706' },
        { token: 'type', foreground: '0284c7' },
        { token: 'function', foreground: '4f46e5' },
      ],
      colors: {
        'editor.background': '#ffffff',
        'editor.foreground': '#0f172a',
        'editorCursor.foreground': '#6366f1',
        'editor.lineHighlightBackground': '#f8fafc',
        'editorLineNumber.foreground': '#94a3b8',
        'editorLineNumber.activeForeground': '#6366f1',
        'editor.selectionBackground': '#e0e7ff',
        'editor.inactiveSelectionBackground': '#f1f5f9',
        'editorGutter.background': '#ffffff',
      },
    });

    monaco.editor.setTheme(isDark ? 'codehive-dark' : 'codehive-light');

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

    // If Yjs collaborative document is present, bind Monaco to active file's Y.Text
    if (ytext && provider) {
      if (bindingRef.current) {
        bindingRef.current.destroy();
      }
      bindingRef.current = new MonacoBinding(
        ytext,
        editor.getModel(),
        new Set([editor]),
        provider.awareness
      );
    }
  };

  // Switch Monaco theme on the fly when user toggles light/dark mode
  useEffect(() => {
    if (monacoRef.current) {
      monacoRef.current.editor.setTheme(isDark ? 'codehive-dark' : 'codehive-light');
    }
  }, [isDark]);

  // Dynamic file model & language switching per file without memory leaks (IDE Extension Plan Section 3)
  useEffect(() => {
    if (editorRef.current && monacoRef.current) {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }

      const model = editorRef.current.getModel();
      if (model && language) {
        monacoRef.current.editor.setModelLanguage(model, language);
      }

      if (ytext && provider && model) {
        bindingRef.current = new MonacoBinding(
          ytext,
          model,
          new Set([editorRef.current]),
          provider.awareness
        );
      }
    }

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [ytext, provider, language, activeFileName]);

  return (
    <div className={`monaco-editor-container ${isDark ? 'dark' : 'light'}`}>
      <Editor
        height="100%"
        language={language}
        value={ytext ? undefined : code}
        onChange={(val) => {
          if (!ytext && onChange) {
            onChange(val || '');
          }
        }}
        onMount={handleEditorDidMount}
        theme={isDark ? 'codehive-dark' : 'codehive-light'}
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
          background: #ffffff;
          position: relative;
          overflow: hidden;
          transition: background-color 0.2s ease;
        }
        .monaco-editor-container.dark {
          background: #0a0c10;
        }
        .monaco-loading-spinner {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          color: #475569;
          font-size: 0.95rem;
          background: #ffffff;
        }
        .monaco-editor-container.dark .monaco-loading-spinner {
          background: #0a0c10;
          color: #94a3b8;
        }
        .monaco-spin-icon {
          color: #6366f1;
          animation: spin 2s linear infinite;
        }
        @keyframes spin {
          0%   { transform: rotate(0deg);   color: #6366f1; }
          50%  { transform: rotate(180deg); color: #06b6d4; }
          100% { transform: rotate(360deg); color: #6366f1; }
        }
      `}</style>
    </div>
  );
};
