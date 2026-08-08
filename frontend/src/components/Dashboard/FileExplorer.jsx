import React, { useState } from 'react';
import {
  FileCode,
  FileText,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  FileJson,
  Code2
} from 'lucide-react';

export const FileExplorer = ({
  files,
  activeFile,
  onSelectFile,
  onAddFile,
  onDeleteFile
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [isFolderExpanded, setIsFolderExpanded] = useState(true);

  const getFileIcon = (filename) => {
    if (filename.endsWith('.jsx') || filename.endsWith('.tsx') || filename.endsWith('.js') || filename.endsWith('.ts')) {
      return <FileCode size={15} className="file-icon text-indigo" />;
    }
    if (filename.endsWith('.css') || filename.endsWith('.scss')) {
      return <Code2 size={15} className="file-icon text-pink" />;
    }
    if (filename.endsWith('.json')) {
      return <FileJson size={15} className="file-icon text-amber" />;
    }
    return <FileText size={15} className="file-icon text-cyan" />;
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    let name = newFileName.trim();
    if (!name.includes('.')) {
      name += '.js';
    }
    onAddFile(name);
    setNewFileName('');
    setIsCreating(false);
  };

  return (
    <div className="file-explorer-sidebar">
      {/* Explorer Header */}
      <div className="explorer-header">
        <span className="explorer-title font-brand">EXPLORER</span>
        <button
          className="btn-icon-sm"
          onClick={() => setIsCreating(true)}
          title="Create New File"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Project Tree Folder */}
      <div className="folder-item">
        <div
          className="folder-header"
          onClick={() => setIsFolderExpanded(!isFolderExpanded)}
        >
          {isFolderExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {isFolderExpanded ? <FolderOpen size={16} className="folder-icon" /> : <Folder size={16} className="folder-icon" />}
          <span className="folder-name font-code">src/workspace</span>
        </div>

        {isFolderExpanded && (
          <div className="file-list">
            {Object.keys(files).map((filename) => (
              <div
                key={filename}
                className={`file-item ${activeFile === filename ? 'active' : ''}`}
                onClick={() => onSelectFile(filename)}
              >
                <div className="file-item-left">
                  {getFileIcon(filename)}
                  <span className="file-name font-code">{filename}</span>
                </div>

                {Object.keys(files).length > 1 && (
                  <button
                    className="file-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(filename);
                    }}
                    title="Delete File"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}

            {isCreating && (
              <form onSubmit={handleCreateSubmit} className="new-file-form">
                <FileCode size={14} className="text-cyan" />
                <input
                  type="text"
                  className="new-file-input font-code"
                  placeholder="e.g. utils.js"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  autoFocus
                  onBlur={() => {
                    if (!newFileName.trim()) setIsCreating(false);
                  }}
                />
              </form>
            )}
          </div>
        )}
      </div>

      <style>{`
        .file-explorer-sidebar {
          background: rgba(13, 16, 23, 0.95);
          border-right: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          user-select: none;
          padding: 12px 8px;
          min-width: 210px;
        }
        .explorer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 8px 12px 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          margin-bottom: 10px;
        }
        .explorer-title {
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--text-muted);
        }
        .btn-icon-sm {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.2s, color 0.2s;
        }
        .btn-icon-sm:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--accent-cyan);
        }
        .folder-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 8px;
          border-radius: 6px;
          cursor: pointer;
          color: var(--text-secondary);
          font-size: 0.85rem;
          transition: background 0.15s;
        }
        .folder-header:hover {
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-primary);
        }
        .folder-icon {
          color: var(--accent-amber);
        }
        .file-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding-left: 14px;
          margin-top: 4px;
        }
        .file-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 10px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.84rem;
          color: var(--text-secondary);
          transition: background 0.15s, color 0.15s;
        }
        .file-item-left {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow: hidden;
        }
        .file-item:hover {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
        }
        .file-item.active {
          background: rgba(99, 102, 241, 0.2);
          color: #ffffff;
          font-weight: 500;
        }
        .file-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .text-indigo { color: var(--accent-indigo); }
        .text-pink { color: var(--accent-pink); }
        .text-amber { color: var(--accent-amber); }
        .text-cyan { color: var(--accent-cyan); }
        .file-delete-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 2px 4px;
          border-radius: 4px;
          opacity: 0;
          transition: opacity 0.15s, color 0.15s;
        }
        .file-item:hover .file-delete-btn {
          opacity: 1;
        }
        .file-delete-btn:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.15);
        }
        .new-file-form {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          background: rgba(15, 18, 26, 0.9);
          border: 1px solid var(--accent-indigo);
          border-radius: 6px;
          margin-top: 4px;
        }
        .new-file-input {
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 0.8rem;
          width: 100%;
          outline: none;
        }
      `}</style>
    </div>
  );
};
