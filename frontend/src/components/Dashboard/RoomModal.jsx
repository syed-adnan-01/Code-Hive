import React, { useState } from 'react';
import { SUPPORTED_LANGUAGES } from '../../config/languages';
import { Users2, Plus, LogIn, X, Shield, Lock, Globe, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export const RoomModal = ({ isOpen, onClose, onCreateRoom, onJoinRoom, loading }) => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'join'
  const [roomName, setRoomName] = useState('CodeHive Pair Session');
  const [selectedLanguageId, setSelectedLanguageId] = useState(63);
  const [linkAccess, setLinkAccess] = useState('editor'); // 'editor' | 'viewer'
  const [joinRoomId, setJoinRoomId] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await onCreateRoom({
        name: roomName,
        language_id: selectedLanguageId,
        linkAccess,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    setError('');
    let id = joinRoomId.trim();
    if (!id) {
      setError('Please provide a Room ID or link.');
      return;
    }
    // If user pasted a full URL with ?room= or /room/
    if (id.includes('room=')) {
      id = id.split('room=')[1].split('&')[0];
    } else if (id.includes('/')) {
      id = id.split('/').pop();
    }

    try {
      await onJoinRoom(id);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="room-modal-backdrop" onClick={onClose}>
      <div className={`room-modal-card ${isDark ? 'dark' : 'light'}`} onClick={(e) => e.stopPropagation()}>
        <div className="room-modal-header">
          <div className="header-icon-box">
            <Users2 size={20} />
          </div>
          <div className="header-title-box">
            <h3 className="room-modal-title">Collaboration Rooms</h3>
            <p className="room-modal-subtitle">Pair program in real time with synchronized Monaco editing</p>
          </div>
          <button className="btn-close-modal" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="modal-tab-switcher">
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => { setActiveTab('create'); setError(''); }}
          >
            <Plus size={14} />
            <span>Create New Room</span>
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => { setActiveTab('join'); setError(''); }}
          >
            <LogIn size={14} />
            <span>Join Existing Room</span>
          </button>
        </div>

        {error && (
          <div className="room-modal-error">
            <span>{error}</span>
          </div>
        )}

        {activeTab === 'create' ? (
          <form onSubmit={handleCreateSubmit} className="room-form">
            <div className="form-group">
              <label className="form-label">Room Title</label>
              <input
                type="text"
                className="form-input"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="e.g. Algorithm Pair Programming"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Primary Programming Language</label>
              <select
                className="form-select font-code"
                value={selectedLanguageId}
                onChange={(e) => setSelectedLanguageId(Number(e.target.value))}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.name} (Judge0 ID: {lang.id})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Link Access Permissions</label>
              <div className="access-options">
                <label className={`access-option ${linkAccess === 'editor' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="linkAccess"
                    value="editor"
                    checked={linkAccess === 'editor'}
                    onChange={() => setLinkAccess('editor')}
                  />
                  <Globe size={18} className="access-icon-editor" />
                  <div>
                    <div className="option-title">Editor (Collaborative)</div>
                    <div className="option-desc">Anyone with link can write and run code</div>
                  </div>
                </label>

                <label className={`access-option ${linkAccess === 'viewer' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="linkAccess"
                    value="viewer"
                    checked={linkAccess === 'viewer'}
                    onChange={() => setLinkAccess('viewer')}
                  />
                  <Lock size={18} className="access-icon-viewer" />
                  <div>
                    <div className="option-title">Viewer (Read-Only)</div>
                    <div className="option-desc">Anyone with link can watch live typing without edit access</div>
                  </div>
                </label>
              </div>
            </div>

            <button type="submit" className="btn-modal-primary" disabled={loading}>
              <Sparkles size={16} />
              <span>{loading ? 'Generating Room...' : 'Create & Enter Room'}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoinSubmit} className="room-form">
            <div className="form-group">
              <label className="form-label">Room ID or Invitation URL</label>
              <input
                type="text"
                className="form-input font-code"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                placeholder="e.g. hive-a1b2c3d4"
                required
              />
              <span className="form-hint">Enter the 8-character Hive ID or paste the link shared by your teammate.</span>
            </div>

            <button type="submit" className="btn-modal-primary" disabled={loading}>
              <LogIn size={16} />
              <span>{loading ? 'Joining Room...' : 'Connect to Live Room'}</span>
            </button>
          </form>
        )}
      </div>

      <style>{`
        .room-modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 20000 !important;
          animation: modalFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes modalFadeIn {
          from { opacity: 0; transform: scale(0.97); }
          to   { opacity: 1; transform: scale(1); }
        }
        .room-modal-card {
          width: 92%;
          max-width: 520px;
          max-height: 90vh;
          overflow-y: auto;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 24px;
          padding: clamp(16px, 3vw, 28px);
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.18), 0 0 0 1px rgba(0, 0, 0, 0.04);
        }
        .room-modal-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 22px;
          position: relative;
        }
        .header-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e0e7ff;
          color: #6366f1;
          flex-shrink: 0;
        }
        .header-title-box {
          flex: 1;
        }
        .room-modal-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.35rem;
          color: #111827;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0;
        }
        .room-modal-subtitle {
          font-size: 0.84rem;
          color: #64748b;
          margin-top: 2px;
        }
        .btn-close-modal {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #64748b;
          cursor: pointer;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s ease;
        }
        .btn-close-modal:hover {
          color: #111827;
          background: #f1f5f9;
          transform: rotate(90deg);
        }
        .modal-tab-switcher {
          display: flex;
          gap: 6px;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 50px;
          margin-bottom: 22px;
          border: 1px solid #e2e8f0;
        }
        .modal-tab-btn {
          flex: 1;
          background: transparent;
          border: none;
          color: #64748b;
          padding: 9px 16px;
          border-radius: 50px;
          font-size: 0.85rem;
          font-weight: 600;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.18s ease;
        }
        .modal-tab-btn.active {
          background: #ffffff;
          color: #111827;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          font-weight: 700;
        }
        .room-modal-error {
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 0.84rem;
          font-weight: 500;
          margin-bottom: 18px;
        }
        .room-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .form-label {
          font-size: 0.82rem;
          font-weight: 700;
          color: #374151;
          font-family: 'Outfit', sans-serif;
          letter-spacing: 0.02em;
        }
        .form-input, .form-select {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          color: #111827;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 0.9rem;
          outline: none;
          transition: all 0.18s ease;
          font-family: inherit;
        }
        .form-input:focus, .form-select:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
        }
        .form-hint {
          font-size: 0.74rem;
          color: #64748b;
          margin-top: 2px;
        }
        .access-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .access-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 14px;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .access-option:hover {
          border-color: #cbd5e1;
          background: #f1f5f9;
        }
        .access-option.selected {
          background: #eff6ff;
          border-color: #6366f1;
          box-shadow: 0 0 0 1px #6366f1;
        }
        .access-option input {
          display: none;
        }
        .access-icon-editor {
          color: #6366f1;
        }
        .access-icon-viewer {
          color: #f59e0b;
        }
        .option-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: #111827;
          font-family: 'Outfit', sans-serif;
        }
        .option-desc {
          font-size: 0.76rem;
          color: #64748b;
          margin-top: 2px;
        }
        .btn-modal-primary {
          background: #111827;
          border: none;
          color: #ffffff;
          padding: 13px;
          border-radius: 50px;
          font-size: 0.92rem;
          font-weight: 700;
          font-family: 'Outfit', sans-serif;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 4px 14px rgba(17, 24, 39, 0.18);
          transition: all 0.2s ease;
          margin-top: 8px;
        }
        .btn-modal-primary:hover:not(:disabled) {
          background: #6366f1;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3);
        }
        .btn-modal-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* ── Dark Mode Room Modal ── */
        .room-modal-card.dark {
          background: #0f172a;
          border-color: #1e293b;
          color: #f1f5f9;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05);
        }
        .room-modal-card.dark .room-modal-title {
          color: #f8fafc;
        }
        .room-modal-card.dark .room-modal-subtitle {
          color: #94a3b8;
        }
        .room-modal-card.dark .btn-close-modal {
          background: #1e293b;
          border-color: #334155;
          color: #94a3b8;
        }
        .room-modal-card.dark .btn-close-modal:hover {
          color: #ffffff;
          background: #334155;
        }
        .room-modal-card.dark .modal-tab-switcher {
          background: #1e293b;
          border-color: #334155;
        }
        .room-modal-card.dark .modal-tab-btn {
          color: #94a3b8;
        }
        .room-modal-card.dark .modal-tab-btn.active {
          background: #0f172a;
          color: #818cf8;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        .room-modal-card.dark .form-label {
          color: #cbd5e1;
        }
        .room-modal-card.dark .form-input,
        .room-modal-card.dark .form-select {
          background: #1e293b;
          border-color: #334155;
          color: #f8fafc;
        }
        .room-modal-card.dark .form-input:focus,
        .room-modal-card.dark .form-select:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
        }
        .room-modal-card.dark .form-hint {
          color: #94a3b8;
        }
        .room-modal-card.dark .access-option {
          background: #1e293b;
          border-color: #334155;
        }
        .room-modal-card.dark .access-option.selected {
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.15);
        }
        .room-modal-card.dark .option-title {
          color: #f8fafc;
        }
        .room-modal-card.dark .option-desc {
          color: #94a3b8;
        }
        .room-modal-card.dark .btn-modal-primary {
          background: #6366f1;
          color: #ffffff;
        }
        .room-modal-card.dark .btn-modal-primary:hover:not(:disabled) {
          background: #4f46e5;
        }
      `}</style>
    </div>
  );
};
