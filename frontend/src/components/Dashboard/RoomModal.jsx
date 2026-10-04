import React, { useState } from 'react';
import { SUPPORTED_LANGUAGES } from '../../config/languages';
import { Users2, Plus, LogIn, X, Shield, Lock, Globe, Sparkles } from 'lucide-react';

export const RoomModal = ({ isOpen, onClose, onCreateRoom, onJoinRoom, loading }) => {
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
      <div className="room-modal-card glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="room-modal-header">
          <div className="header-icon-box purple-glow">
            <Users2 size={20} />
          </div>
          <div className="header-title-box">
            <h3 className="room-modal-title font-brand">Collaboration Rooms</h3>
            <p className="room-modal-subtitle">Pair program in real time with synchronized Monaco editing</p>
          </div>
          <button className="btn-close-modal" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="modal-tab-switcher font-brand">
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
                  <Globe size={16} className="text-cyan" />
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
                  <Lock size={16} className="text-amber" />
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
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.15s ease-out;
        }
        .room-modal-card {
          width: 90%;
          max-width: 500px;
          background: #11141d;
          border: 1px solid rgba(99, 102, 241, 0.35);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
        }
        .room-modal-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 18px;
          position: relative;
        }
        .header-icon-box {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(168, 85, 247, 0.15);
          border: 1px solid rgba(168, 85, 247, 0.3);
          color: var(--accent-purple);
        }
        .header-title-box {
          flex: 1;
        }
        .room-modal-title {
          font-size: 1.25rem;
          color: #ffffff;
          font-weight: 700;
        }
        .room-modal-subtitle {
          font-size: 0.82rem;
          color: var(--text-secondary);
        }
        .btn-close-modal {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          transition: all 0.15s;
        }
        .btn-close-modal:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.1);
        }
        .modal-tab-switcher {
          display: flex;
          gap: 8px;
          background: rgba(0, 0, 0, 0.4);
          padding: 4px;
          border-radius: 8px;
          margin-bottom: 20px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .modal-tab-btn {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 8px;
          border-radius: 6px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }
        .modal-tab-btn.active {
          background: rgba(99, 102, 241, 0.25);
          color: #ffffff;
          border: 1px solid rgba(99, 102, 241, 0.4);
        }
        .room-modal-error {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 0.82rem;
          margin-bottom: 16px;
        }
        .room-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .form-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .form-input, .form-select {
          background: rgba(10, 12, 16, 0.9);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          padding: 9px 12px;
          border-radius: 8px;
          font-size: 0.86rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .form-input:focus, .form-select:focus {
          border-color: var(--accent-indigo);
        }
        .form-hint {
          font-size: 0.72rem;
          color: var(--text-muted);
        }
        .access-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .access-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          cursor: pointer;
          transition: all 0.15s;
        }
        .access-option.selected {
          background: rgba(99, 102, 241, 0.12);
          border-color: rgba(99, 102, 241, 0.4);
        }
        .access-option input {
          display: none;
        }
        .option-title {
          font-size: 0.82rem;
          font-weight: 600;
          color: #ffffff;
        }
        .option-desc {
          font-size: 0.74rem;
          color: var(--text-muted);
        }
        .btn-modal-primary {
          background: linear-gradient(135deg, var(--accent-indigo), var(--accent-purple));
          border: none;
          color: #ffffff;
          padding: 11px;
          border-radius: 8px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          box-shadow: 0 0 20px rgba(99, 102, 241, 0.4);
          transition: all 0.2s;
          margin-top: 6px;
        }
        .btn-modal-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 0 25px rgba(99, 102, 241, 0.6);
        }
        .btn-modal-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};
