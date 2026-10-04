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
import { useTheme } from '../../context/ThemeContext';

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
  const { isDark } = useTheme();
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
    <div className={`file-explorer-sidebar ${isDark ? 'dark' : 'light'}`}>
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
          display: flex;
          flex-direction: column;
          user-select: none;
          padding: 10px 8px;
          width: 100%;
          min-width: 100%;
          height: 100%;
          overflow-y: auto;
          box-sizing: border-box;
          transition: background-color 0.2s ease, color 0.2s ease;
        }

        /* Light Mode (Crisp, High Contrast, Perfectly Visible) */
        .file-explorer-sidebar.light,
        .workspace-container.light .file-explorer-sidebar {
          background: #ffffff;
          color: #0f172a;
        }

        /* Dark Mode */
        .file-explorer-sidebar.dark,
        .workspace-container.dark .file-explorer-sidebar {
          background: #0d121f;
          color: #f1f5f9;
        }

        .explorer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 8px 10px 8px;
          margin-bottom: 8px;
          border-bottom: 1px solid #e2e8f0;
          transition: border-color 0.2s ease;
        }
        .file-explorer-sidebar.dark .explorer-header,
        .workspace-container.dark .explorer-header {
          border-bottom-color: rgba(255, 255, 255, 0.08);
        }

        .explorer-title-box {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .explorer-title {
          font-size: 0.74rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: #334155;
        }
        .file-explorer-sidebar.dark .explorer-title,
        .workspace-container.dark .explorer-title {
          color: #94a3b8;
        }

        .file-badge-count {
          font-size: 0.68rem;
          font-weight: 600;
          padding: 1px 7px;
          border-radius: 9999px;
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
        }
        .file-explorer-sidebar.dark .file-badge-count,
        .workspace-container.dark .file-badge-count {
          background: rgba(255, 255, 255, 0.08);
          color: #cbd5e1;
          border-color: rgba(255, 255, 255, 0.05);
        }

        .explorer-header-actions {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .btn-icon-sm {
          background: transparent;
          border: none;
          color: #475569;
          cursor: pointer;
          padding: 5px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, color 0.15s;
        }
        .file-explorer-sidebar.dark .btn-icon-sm,
        .workspace-container.dark .btn-icon-sm {
          color: #94a3b8;
        }
        .file-explorer-sidebar.light .btn-icon-sm:hover:not(:disabled),
        .workspace-container.light .btn-icon-sm:hover:not(:disabled) {
          background: #f1f5f9;
          color: #4f46e5;
        }
        .file-explorer-sidebar.dark .btn-icon-sm:hover:not(:disabled),
        .workspace-container.dark .btn-icon-sm:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.1);
          color: #38bdf8;
        }
        .btn-icon-sm:disabled {
          opacity: 0.35;
          cursor: not-allowed;
        }

        .explorer-error-banner {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 8px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #b91c1c;
          font-size: 0.73rem;
          margin-bottom: 8px;
          line-height: 1.25;
        }
        .file-explorer-sidebar.dark .explorer-error-banner,
        .workspace-container.dark .explorer-error-banner {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.35);
          color: #fca5a5;
        }

        .folder-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 8px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.83rem;
          font-weight: 600;
          color: #1e293b;
          transition: background 0.15s, color 0.15s;
        }
        .file-explorer-sidebar.dark .folder-header,
        .workspace-container.dark .folder-header {
          color: #e2e8f0;
        }
        .file-explorer-sidebar.light .folder-header:hover,
        .workspace-container.light .folder-header:hover {
          background: #f1f5f9;
          color: #0f172a;
        }
        .file-explorer-sidebar.dark .folder-header:hover,
        .workspace-container.dark .folder-header:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
        }
        .folder-icon {
          color: #d97706;
        }
        .file-explorer-sidebar.dark .folder-icon,
        .workspace-container.dark .folder-icon {
          color: #f59e0b;
        }

        .file-list {
          display: flex;
          flex-direction: column;
          gap: 3px;
          padding-left: 10px;
          margin-top: 4px;
        }

        .file-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 6px 8px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.82rem;
          font-weight: 500;
          color: #334155;
          position: relative;
          transition: background 0.15s, color 0.15s;
        }
        .file-explorer-sidebar.dark .file-item,
        .workspace-container.dark .file-item {
          color: #94a3b8;
        }
        .file-item-left {
          display: flex;
          align-items: center;
          gap: 8px;
          overflow: hidden;
          min-width: 0;
        }
        .file-explorer-sidebar.light .file-item:hover:not(.active),
        .workspace-container.light .file-item:hover:not(.active) {
          background: #f1f5f9;
          color: #0f172a;
        }
        .file-explorer-sidebar.dark .file-item:hover:not(.active),
        .workspace-container.dark .file-item:hover:not(.active) {
          background: rgba(255, 255, 255, 0.05);
          color: #f8fafc;
        }

        /* Active File Item - Light Mode (High Contrast & Clean Indigo Theme) */
        .file-explorer-sidebar.light .file-item.active,
        .workspace-container.light .file-item.active {
          background: #ede9fe;
          color: #3730a3 !important;
          font-weight: 700;
          border-left: 3px solid #6366f1;
          box-shadow: 0 1px 2px rgba(99, 102, 241, 0.12);
        }
        .file-explorer-sidebar.light .file-item.active .file-name,
        .workspace-container.light .file-item.active .file-name {
          color: #3730a3 !important;
          font-weight: 700;
        }
        .file-explorer-sidebar.light .file-item.active .file-icon,
        .workspace-container.light .file-item.active .file-icon {
          color: #4f46e5 !important;
        }

        /* Active File Item - Dark Mode */
        .file-explorer-sidebar.dark .file-item.active,
        .workspace-container.dark .file-item.active {
          background: rgba(99, 102, 241, 0.22);
          color: #ffffff !important;
          font-weight: 600;
          border-left: 3px solid #818cf8;
        }
        .file-explorer-sidebar.dark .file-item.active .file-name,
        .workspace-container.dark .file-item.active .file-name {
          color: #ffffff !important;
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
        .file-item:hover .file-item-actions,
        .file-item.active .file-item-actions {
          opacity: 1;
        }

        .file-action-btn {
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 3px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.15s, background 0.15s;
        }
        .file-explorer-sidebar.dark .file-action-btn,
        .workspace-container.dark .file-action-btn {
          color: #94a3b8;
        }
        .file-explorer-sidebar.light .file-item.active .file-action-btn,
        .workspace-container.light .file-item.active .file-action-btn {
          color: #4338ca;
        }
        .file-explorer-sidebar.light .file-action-btn:hover,
        .workspace-container.light .file-action-btn:hover {
          color: #0f172a;
          background: #e2e8f0;
        }
        .file-explorer-sidebar.dark .file-action-btn:hover,
        .workspace-container.dark .file-action-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.12);
        }
        .file-action-btn.hover-danger:hover {
          color: #dc2626 !important;
          background: #fee2e2 !important;
        }
        .file-explorer-sidebar.dark .file-action-btn.hover-danger:hover,
        .workspace-container.dark .file-action-btn.hover-danger:hover {
          color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.2) !important;
        }

        .rename-inline-form {
          display: flex;
          align-items: center;
          gap: 4px;
          width: 100%;
        }
        .rename-input {
          background: #ffffff;
          border: 1.5px solid #6366f1;
          border-radius: 4px;
          color: #0f172a;
          font-size: 0.78rem;
          padding: 2px 6px;
          width: 100%;
          outline: none;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }
        .file-explorer-sidebar.dark .rename-input,
        .workspace-container.dark .rename-input {
          background: #111827;
          border-color: #818cf8;
          color: #ffffff;
          box-shadow: none;
        }

        .btn-icon-micro {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
        }
        .file-explorer-sidebar.dark .btn-icon-micro,
        .workspace-container.dark .btn-icon-micro {
          color: #94a3b8;
        }

        .new-file-form {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px 6px;
          background: #ffffff;
          border: 1.5px solid #6366f1;
          border-radius: 6px;
          margin-top: 3px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
        }
        .file-explorer-sidebar.dark .new-file-form,
        .workspace-container.dark .new-file-form {
          background: #111827;
          border-color: #818cf8;
          box-shadow: none;
        }

        .new-file-input {
          background: transparent;
          border: none;
          color: #0f172a;
          font-size: 0.78rem;
          width: 100%;
          outline: none;
        }
        .file-explorer-sidebar.dark .new-file-input,
        .workspace-container.dark .new-file-input {
          color: #f8fafc;
        }

        .delete-confirm-popover {
          position: absolute;
          top: 100%;
          right: 0;
          z-index: 50;
          background: #ffffff;
          border: 1px solid #fca5a5;
          padding: 8px 10px;
          border-radius: 6px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.15);
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 150px;
        }
        .file-explorer-sidebar.dark .delete-confirm-popover,
        .workspace-container.dark .delete-confirm-popover {
          background: #111827;
          border-color: rgba(239, 68, 68, 0.4);
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        }

        .delete-confirm-text {
          font-size: 0.73rem;
          font-weight: 600;
          color: #b91c1c;
        }
        .file-explorer-sidebar.dark .delete-confirm-text,
        .workspace-container.dark .delete-confirm-text {
          color: #fca5a5;
          font-weight: normal;
        }

        .delete-confirm-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          justify-content: flex-end;
        }
        .btn-delete-confirm {
          background: #dc2626;
          border: none;
          color: #ffffff;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 4px;
          cursor: pointer;
        }
        .btn-delete-cancel {
          background: transparent;
          border: 1px solid #cbd5e1;
          color: #475569;
          font-size: 0.7rem;
          padding: 2px 6px;
          border-radius: 4px;
          cursor: pointer;
        }
        .file-explorer-sidebar.dark .btn-delete-cancel,
        .workspace-container.dark .btn-delete-cancel {
          border-color: rgba(255, 255, 255, 0.1);
          color: #94a3b8;
        }

        .viewer-readonly-badge {
          margin-top: auto;
          padding: 6px 10px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          text-align: center;
          font-size: 0.72rem;
          color: #64748b;
          font-weight: 500;
        }
        .file-explorer-sidebar.dark .viewer-readonly-badge,
        .workspace-container.dark .viewer-readonly-badge {
          background: rgba(255, 255, 255, 0.03);
          border-color: rgba(255, 255, 255, 0.06);
          color: #94a3b8;
        }

        /* Language Syntax File Icons - High Contrast Colors */
        .text-indigo { color: #4f46e5; }
        .file-explorer-sidebar.dark .text-indigo,
        .workspace-container.dark .text-indigo { color: #818cf8; }

        .text-pink { color: #db2777; }
        .file-explorer-sidebar.dark .text-pink,
        .workspace-container.dark .text-pink { color: #f472b6; }

        .text-amber { color: #d97706; }
        .file-explorer-sidebar.dark .text-amber,
        .workspace-container.dark .text-amber { color: #f59e0b; }

        .text-cyan { color: #0284c7; }
        .file-explorer-sidebar.dark .text-cyan,
        .workspace-container.dark .text-cyan { color: #38bdf8; }

        .text-blue { color: #2563eb; }
        .file-explorer-sidebar.dark .text-blue,
        .workspace-container.dark .text-blue { color: #60a5fa; }

        .text-red { color: #dc2626; }
        .file-explorer-sidebar.dark .text-red,
        .workspace-container.dark .text-red { color: #f87171; }

        .text-emerald { color: #059669; }
        .file-explorer-sidebar.dark .text-emerald,
        .workspace-container.dark .text-emerald { color: #34d399; }

        .text-muted { color: #64748b; }
        .file-explorer-sidebar.dark .text-muted,
        .workspace-container.dark .text-muted { color: #94a3b8; }
      `}</style>
    </div>
  );
};
