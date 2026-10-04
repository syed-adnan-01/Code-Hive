import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
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
  Code2,
  Edit2,
  Upload,
  Download,
  Archive,
  Check,
  X,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { getLanguageByFilename } from '../../config/languages';

const MAX_FILES = 20;
const MAX_FILE_SIZE_BYTES = 100 * 1024; // 100 KB

export const FileExplorer = ({
  files = {},
  activeFileId,
  onSelectFile,
  onAddFile,
  onRenameFile,
  onDeleteFile,
  onUploadFile,
  isReadOnly = false,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isFolderExpanded, setIsFolderExpanded] = useState(true);
  const [explorerError, setExplorerError] = useState(null);
  const [isZipping, setIsZipping] = useState(false);

  const fileInputRef = useRef(null);

  const fileList = Object.values(files);
  const fileCount = fileList.length;

  const showError = (msg) => {
    setExplorerError(msg);
    setTimeout(() => setExplorerError(null), 4000);
  };

  const getFileIcon = (filename) => {
    if (!filename) return <FileText size={15} className="file-icon text-cyan" />;
    const lower = filename.toLowerCase();
    if (lower.endsWith('.jsx') || lower.endsWith('.tsx') || lower.endsWith('.js') || lower.endsWith('.ts')) {
      return <FileCode size={15} className="file-icon text-indigo" />;
    }
    if (lower.endsWith('.py')) {
      return <FileCode size={15} className="file-icon text-amber" />;
    }
    if (lower.endsWith('.cpp') || lower.endsWith('.cc') || lower.endsWith('.c') || lower.endsWith('.h')) {
      return <Code2 size={15} className="file-icon text-blue" />;
    }
    if (lower.endsWith('.java')) {
      return <FileCode size={15} className="file-icon text-red" />;
    }
    if (lower.endsWith('.go') || lower.endsWith('.rs')) {
      return <Code2 size={15} className="file-icon text-emerald" />;
    }
    if (lower.endsWith('.css') || lower.endsWith('.scss')) {
      return <Code2 size={15} className="file-icon text-pink" />;
    }
    if (lower.endsWith('.json')) {
      return <FileJson size={15} className="file-icon text-amber" />;
    }
    return <FileText size={15} className="file-icon text-cyan" />;
  };

  // 1. Create File Handler
  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const trimmed = newFileName.trim();
    if (!trimmed) {
      setIsCreating(false);
      return;
    }

    if (fileCount >= MAX_FILES) {
      showError(`Room reached max limit of ${MAX_FILES} files.`);
      setIsCreating(false);
      return;
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
      showError('File name may only contain letters, numbers, dots, dashes, and underscores.');
      return;
    }

    if (trimmed.includes('..') || trimmed.startsWith('.') || trimmed.endsWith('.')) {
      showError('Invalid file name format (cannot start/end with dot or contain "..").');
      return;
    }

    let finalName = trimmed;
    if (!finalName.includes('.')) {
      finalName += '.js';
    }

    // Check duplicate
    const exists = fileList.some((f) => f.name.toLowerCase() === finalName.toLowerCase());
    if (exists) {
      showError(`A file named "${finalName}" already exists.`);
      return;
    }

    onAddFile(finalName);
    setNewFileName('');
    setIsCreating(false);
  };

  // 2. Rename File Handler
  const startRenaming = (file, e) => {
    e.stopPropagation();
    if (isReadOnly) return;
    setRenamingId(file.id);
    setRenameValue(file.name);
  };

  const submitRename = (fileId, e) => {
    if (e) e.preventDefault();
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenamingId(null);
      return;
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
      showError('Invalid characters in file name.');
      return;
    }

    let finalName = trimmed;
    if (!finalName.includes('.')) {
      finalName += '.js';
    }

    const currentFile = files[fileId];
    if (currentFile && currentFile.name !== finalName) {
      const exists = fileList.some((f) => f.id !== fileId && f.name.toLowerCase() === finalName.toLowerCase());
      if (exists) {
        showError(`A file named "${finalName}" already exists.`);
        return;
      }
      onRenameFile(fileId, finalName);
    }

    setRenamingId(null);
  };

  // 3. Delete File Handler
  const handleDeleteClick = (fileId, e) => {
    e.stopPropagation();
    if (isReadOnly) return;
    if (fileCount <= 1) {
      showError('Workspace must have at least one file.');
      return;
    }
    setDeleteConfirmId(fileId);
  };

  const confirmDelete = (fileId, e) => {
    e.stopPropagation();
    onDeleteFile(fileId);
    setDeleteConfirmId(null);
  };

  // 4. Upload File Handler
  const handleUploadClick = () => {
    if (isReadOnly) return;
    if (fileCount >= MAX_FILES) {
      showError(`Cannot upload: Room limit of ${MAX_FILES} files reached.`);
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    if (uploadedFile.size > MAX_FILE_SIZE_BYTES) {
      showError(`File exceeds maximum allowed size of ${MAX_FILE_SIZE_BYTES / 1024} KB.`);
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result || '';
      let cleanName = uploadedFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      if (!cleanName.includes('.')) cleanName += '.txt';

      let candidateName = cleanName;
      let counter = 1;
      while (fileList.some((f) => f.name.toLowerCase() === candidateName.toLowerCase())) {
        const parts = cleanName.split('.');
        const ext = parts.pop();
        candidateName = `${parts.join('.')}_${counter}.${ext}`;
        counter++;
      }

      onUploadFile(candidateName, content);
      e.target.value = '';
    };

    reader.onerror = () => {
      showError('Failed to read uploaded file.');
      e.target.value = '';
    };

    reader.readAsText(uploadedFile);
  };

  // 5. Download Single File
  const handleDownloadSingle = (file, e) => {
    e.stopPropagation();
    const content = file.text || '';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 6. Download All Files as ZIP (JSZip)
  const handleDownloadZip = async () => {
    if (fileCount === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      fileList.forEach((file) => {
        zip.file(file.name, file.text || '');
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'codehive-workspace.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error creating ZIP:', err);
      showError('Failed to generate workspace ZIP.');
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="file-explorer-sidebar">
      {/* Hidden file input for uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        style={{ display: 'none' }}
        accept=".js,.jsx,.ts,.tsx,.py,.cpp,.c,.h,.hpp,.java,.go,.rs,.json,.css,.html,.txt"
      />

      {/* Explorer Header */}
      <div className="explorer-header">
        <div className="explorer-title-box">
          <span className="explorer-title font-brand">FILES</span>
          <span className="file-badge-count font-code">{fileCount}/{MAX_FILES}</span>
        </div>

        <div className="explorer-header-actions">
          {!isReadOnly && (
            <>
              <button
                className="btn-icon-sm"
                onClick={() => setIsCreating(true)}
                title="New File (Letters, numbers, dot, dash)"
                disabled={fileCount >= MAX_FILES}
              >
                <Plus size={15} />
              </button>
              <button
                className="btn-icon-sm"
                onClick={handleUploadClick}
                title="Upload Text File (<100 KB)"
                disabled={fileCount >= MAX_FILES}
              >
                <Upload size={14} />
              </button>
            </>
          )}

          <button
            className="btn-icon-sm"
            onClick={handleDownloadZip}
            title="Download Workspace as ZIP"
            disabled={isZipping || fileCount === 0}
          >
            <Archive size={14} className={isZipping ? 'animate-pulse text-indigo' : ''} />
          </button>
        </div>
      </div>

      {/* Error alert toast */}
      {explorerError && (
        <div className="explorer-error-banner font-sans">
          <AlertCircle size={14} className="shrink-0" />
          <span>{explorerError}</span>
        </div>
      )}

      {/* Workspace Folder Tree */}
      <div className="folder-item">
        <div
          className="folder-header"
          onClick={() => setIsFolderExpanded(!isFolderExpanded)}
        >
          {isFolderExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          {isFolderExpanded ? <FolderOpen size={15} className="folder-icon" /> : <Folder size={15} className="folder-icon" />}
          <span className="folder-name font-code">workspace</span>
        </div>

        {isFolderExpanded && (
          <div className="file-list">
            {fileList.map((file) => {
              const isActive = activeFileId === file.id;
              const isRenaming = renamingId === file.id;
              const isDeleting = deleteConfirmId === file.id;

              return (
                <div
                  key={file.id}
                  className={`file-item ${isActive ? 'active' : ''}`}
                  onClick={() => onSelectFile(file.id)}
                  title={`${file.name} - Click to switch active file`}
                >
                  {isRenaming ? (
                    <form
                      onSubmit={(e) => submitRename(file.id, e)}
                      className="rename-inline-form"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        className="rename-input font-code"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        autoFocus
                        onBlur={(e) => submitRename(file.id, e)}
                      />
                      <button type="submit" className="btn-icon-micro" title="Save">
                        <Check size={12} className="text-emerald" />
                      </button>
                      <button
                        type="button"
                        className="btn-icon-micro"
                        onClick={() => setRenamingId(null)}
                        title="Cancel"
                      >
                        <X size={12} className="text-muted" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="file-item-left">
                        {getFileIcon(file.name)}
                        <span className="file-name font-code">{file.name}</span>
                      </div>

                      <div className="file-item-actions">
                        <button
                          className="file-action-btn"
                          onClick={(e) => handleDownloadSingle(file, e)}
                          title="Download File"
                        >
                          <Download size={12} />
                        </button>

                        {!isReadOnly && (
                          <>
                            <button
                              className="file-action-btn"
                              onClick={(e) => startRenaming(file, e)}
                              title="Rename File"
                            >
                              <Edit2 size={12} />
                            </button>

                            {fileCount > 1 && (
                              <button
                                className="file-action-btn hover-danger"
                                onClick={(e) => handleDeleteClick(file.id, e)}
                                title="Delete File"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </>
                  )}

                  {/* Inline Delete Confirmation Popover */}
                  {isDeleting && (
                    <div
                      className="delete-confirm-popover"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="delete-confirm-text">Delete {file.name}?</span>
                      <div className="delete-confirm-actions">
                        <button
                          className="btn-delete-confirm font-brand"
                          onClick={(e) => confirmDelete(file.id, e)}
                        >
                          Delete
                        </button>
                        <button
                          className="btn-delete-cancel"
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Inline New File Form */}
            {isCreating && (
              <form onSubmit={handleCreateSubmit} className="new-file-form">
                <FileCode size={14} className="text-cyan shrink-0" />
                <input
                  type="text"
                  className="new-file-input font-code"
                  placeholder="name.js / main.py"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  autoFocus
                  onBlur={() => {
                    if (!newFileName.trim()) setIsCreating(false);
                  }}
                />
                <button type="submit" className="btn-icon-micro" title="Add">
                  <Check size={12} className="text-emerald" />
                </button>
                <button
                  type="button"
                  className="btn-icon-micro"
                  onClick={() => setIsCreating(false)}
                  title="Cancel"
                >
                  <X size={12} />
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {isReadOnly && (
        <div className="viewer-readonly-badge font-sans">
          <span>Read-only viewer</span>
        </div>
      )}

      <style>{`
        .file-explorer-sidebar {
          background: rgba(10, 13, 20, 0.98);
          border-right: 1px solid var(--border-subtle);
          display: flex;
          flex-direction: column;
          user-select: none;
          padding: 10px 8px;
          min-width: 220px;
          width: 220px;
          height: 100%;
          overflow-y: auto;
        }
        .explorer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 8px 10px 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          margin-bottom: 8px;
        }
        .explorer-title-box {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .explorer-title {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.09em;
          color: var(--text-muted);
        }
        .file-badge-count {
          font-size: 0.68rem;
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-secondary);
          padding: 1px 6px;
          border-radius: 9999px;
        }
        .explorer-header-actions {
          display: flex;
          align-items: center;
          gap: 3px;
        }
        .btn-icon-sm {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 5px;
          border-radius: 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, color 0.15s;
        }
        .btn-icon-sm:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          color: var(--accent-cyan);
        }
        .btn-icon-sm:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .explorer-error-banner {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 8px;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.35);
          border-radius: 6px;
          color: #fca5a5;
          font-size: 0.73rem;
          margin-bottom: 8px;
          line-height: 1.25;
        }
        .folder-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 5px 8px;
          border-radius: 6px;
          cursor: pointer;
          color: var(--text-secondary);
          font-size: 0.82rem;
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
          padding-left: 10px;
          margin-top: 4px;
        }
        .file-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 5px 8px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.82rem;
          color: var(--text-secondary);
          position: relative;
          transition: background 0.15s, color 0.15s;
        }
        .file-item-left {
          display: flex;
          align-items: center;
          gap: 7px;
          overflow: hidden;
          min-width: 0;
        }
        .file-item:hover {
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-primary);
        }
        .file-item.active {
          background: rgba(99, 102, 241, 0.22);
          color: #ffffff;
          font-weight: 500;
          border-left: 2px solid var(--accent-indigo);
        }
        .file-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .file-item-actions {
          display: flex;
          align-items: center;
          gap: 2px;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .file-item:hover .file-item-actions {
          opacity: 1;
        }
        .file-action-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 3px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s, background 0.15s;
        }
        .file-action-btn:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.1);
        }
        .file-action-btn.hover-danger:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.15);
        }
        .rename-inline-form {
          display: flex;
          align-items: center;
          gap: 4px;
          width: 100%;
        }
        .rename-input {
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid var(--accent-indigo);
          border-radius: 4px;
          color: #fff;
          font-size: 0.78rem;
          padding: 2px 5px;
          width: 100%;
          outline: none;
        }
        .btn-icon-micro {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .new-file-form {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 6px;
          background: rgba(15, 23, 42, 0.95);
          border: 1px solid var(--accent-indigo);
          border-radius: 6px;
          margin-top: 3px;
        }
        .new-file-input {
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 0.78rem;
          width: 100%;
          outline: none;
        }
        .delete-confirm-popover {
          position: absolute;
          top: 100%;
          right: 0;
          z-index: 50;
          background: #111827;
          border: 1px solid rgba(239, 68, 68, 0.4);
          padding: 8px 10px;
          border-radius: 6px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 150px;
        }
        .delete-confirm-text {
          font-size: 0.73rem;
          color: #fca5a5;
        }
        .delete-confirm-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          justify-content: flex-end;
        }
        .btn-delete-confirm {
          background: #ef4444;
          border: none;
          color: #fff;
          font-size: 0.7rem;
          padding: 2px 8px;
          border-radius: 4px;
          cursor: pointer;
        }
        .btn-delete-cancel {
          background: transparent;
          border: 1px solid var(--border-subtle);
          color: var(--text-secondary);
          font-size: 0.7rem;
          padding: 2px 6px;
          border-radius: 4px;
          cursor: pointer;
        }
        .viewer-readonly-badge {
          margin-top: auto;
          padding: 6px 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 6px;
          text-align: center;
          font-size: 0.72rem;
          color: var(--text-muted);
        }
        .text-indigo { color: var(--accent-indigo); }
        .text-pink { color: var(--accent-pink); }
        .text-amber { color: var(--accent-amber); }
        .text-cyan { color: var(--accent-cyan); }
        .text-blue { color: #3b82f6; }
        .text-red { color: #ef4444; }
        .text-emerald { color: #10b981; }
        .text-muted { color: var(--text-muted); }
      `}</style>
    </div>
  );
};
