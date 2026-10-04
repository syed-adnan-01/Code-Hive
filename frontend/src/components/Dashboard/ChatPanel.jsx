import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Users2,
  AlertCircle,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { fetchRoomMessages, postRoomMessage } from '../../services/chatService';
import { getAuthTokenForRoom, getUidForRoom } from '../../services/collabService';

export const ChatPanel = ({ roomId, userRole = 'editor', onOpenRoomModal }) => {
  const { currentUser } = useAuth();
  const { isDark } = useTheme();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const messagesEndRef = useRef(null);
  const pollTimerRef = useRef(null);

  const currentUid = getUidForRoom(roomId, currentUser);

  const getIdToken = async () => {
    return await getAuthTokenForRoom(roomId, currentUser);
  };

  // Scroll to bottom smoothly
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chat messages from backend
  const loadMessages = async () => {
    if (!roomId) return;
    try {
      const token = await getIdToken();
      const list = await fetchRoomMessages(roomId, token);
      setMessages((prev) => {
        // Merge & deduplicate by message.id
        const existingIds = new Set(prev.map((m) => m.id));
        const newItems = list.filter((m) => !existingIds.has(m.id));
        if (newItems.length > 0) {
          const combined = [...prev, ...newItems].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          return combined;
        }
        return prev.length === 0 ? list : prev;
      });
    } catch (err) {
      // Don't crash UI on polling errors
      console.warn('Chat load error:', err.message);
    }
  };

  // Initial load and periodic poll for live updates
  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      return;
    }

    setLoading(true);
    loadMessages().finally(() => {
      setLoading(false);
      scrollToBottom();
    });

    // Poll every 3 seconds for new messages across room peers
    pollTimerRef.current = setInterval(() => {
      loadMessages();
    }, 3000);

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [roomId]);

  // Auto scroll when message list changes
  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  // Send message
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const clean = inputText.trim();
    if (!clean || sending) return;

    if (clean.length > 500) {
      setError('Message exceeds the 500 character limit.');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const token = await getIdToken();
      const newMsg = await postRoomMessage(roomId, clean, token);
      
      // Optimistically append message if not present
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });

      setInputText('');
      setTimeout(scrollToBottom, 50);
    } catch (err) {
      setError(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  // Handle enter key press
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Format time (e.g. 10:42 PM)
  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // If not currently in a room
  if (!roomId) {
    return (
      <div className={`chat-empty-container ${isDark ? 'dark' : 'light'}`}>
        <div className="chat-empty-icon">
          <MessageSquare size={36} className="text-muted" />
        </div>
        <h4 className="chat-empty-title font-brand">Room Chat Offline</h4>
        <p className="chat-empty-desc">
          Live chat is active inside collaborative rooms. Join or create a room to chat in real time with your peers while programming.
        </p>
        {onOpenRoomModal && (
          <button className="btn-join-room font-brand" onClick={onOpenRoomModal}>
            <Users2 size={15} />
            <span>Create or Join Room</span>
          </button>
        )}

        <style>{`
          .chat-empty-container {
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 30px 20px;
            text-align: center;
          }
          .chat-empty-icon {
            width: 64px;
            height: 64px;
            border-radius: 16px;
            background: rgba(99, 102, 241, 0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 16px;
            color: #6366f1;
          }
          .chat-empty-title {
            font-size: 1.05rem;
            font-weight: 700;
            margin: 0 0 8px 0;
          }
          .chat-empty-desc {
            font-size: 0.82rem;
            color: #64748b;
            line-height: 1.5;
            max-width: 260px;
            margin-bottom: 20px;
          }
          .btn-join-room {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 9px 16px;
            border-radius: 8px;
            background: linear-gradient(135deg, #6366f1, #06b6d4);
            color: white;
            border: none;
            font-size: 0.85rem;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
            transition: all 0.15s;
          }
          .btn-join-room:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(99, 102, 241, 0.35);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`chat-panel-root ${isDark ? 'dark' : 'light'}`}>
      {/* Header */}
      <div className="chat-panel-header">
        <div className="chat-header-info">
          <div className="chat-status-dot pulse-online" />
          <span className="chat-title font-brand">Room Chat</span>
          <span className="chat-room-badge font-code">#{roomId}</span>
        </div>
        <span className="chat-count-pill font-code">{messages.length} msgs</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="chat-messages-area">
        {messages.length === 0 && !loading && (
          <div className="chat-no-messages">
            <Sparkles size={24} className="text-indigo" />
            <p className="no-msgs-text font-brand">No messages yet</p>
            <span className="no-msgs-sub">Say hello to everyone in the room!</span>
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.senderUid === currentUid || msg.senderUid === currentUser?.uid;
          const senderLetter = msg.senderName ? msg.senderName[0].toUpperCase() : 'U';

          return (
            <div
              key={msg.id}
              className={`chat-message-row ${isOwn ? 'row-own' : 'row-peer'}`}
            >
              {!isOwn && (
                <div className="peer-avatar font-brand" title={msg.senderName}>
                  {senderLetter}
                </div>
              )}

              <div className="message-bubble-wrapper">
                {!isOwn && (
                  <div className="sender-name-label font-brand">
                    {msg.senderName}
                  </div>
                )}

                <div className={`message-bubble ${isOwn ? 'bubble-own' : 'bubble-peer'}`}>
                  {/* Strict plain text rendering to guarantee prevention of XSS */}
                  <div className="message-plain-text">{msg.text}</div>
                </div>

                <div className={`message-time-label font-code ${isOwn ? 'time-own' : ''}`}>
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Banner */}
      {error && (
        <div className="chat-error-banner font-code">
          <AlertCircle size={13} />
          <span>{error}</span>
          <button className="btn-dismiss-err" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* Input Area */}
      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <div className="chat-input-wrapper">
          <textarea
            className="chat-textarea"
            placeholder="Type a message (Enter to send, max 500 chars)..."
            value={inputText}
            maxLength={500}
            rows={2}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="chat-input-footer">
            <span className={`char-counter font-code ${inputText.length > 450 ? 'char-warn' : ''}`}>
              {inputText.length} / 500
            </span>
            <button
              type="submit"
              className="btn-send-chat"
              disabled={!inputText.trim() || sending}
              title="Send Message (Enter)"
            >
              <Send size={14} className={sending ? 'animate-pulse' : ''} />
            </button>
          </div>
        </div>
      </form>

      <style>{`
        .chat-panel-root {
          height: 100%;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          overflow: hidden;
        }
        .chat-panel-root.dark {
          background: #0d1117;
          color: #f0f6fc;
        }
        .chat-panel-header {
          padding: 12px 16px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8fafc;
        }
        .chat-panel-root.dark .chat-panel-header {
          background: #090d16;
          border-bottom-color: rgba(255, 255, 255, 0.08);
        }
        .chat-header-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .chat-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
        }
        .pulse-online {
          box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.25);
        }
        .chat-title {
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        .chat-room-badge {
          font-size: 0.72rem;
          background: rgba(99, 102, 241, 0.12);
          color: #6366f1;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .chat-count-pill {
          font-size: 0.72rem;
          color: #64748b;
        }
        .chat-messages-area {
          flex: 1;
          overflow-y: auto;
          padding: 14px 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .chat-no-messages {
          margin: auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 30px 10px;
          color: #64748b;
        }
        .no-msgs-text {
          font-weight: 700;
          font-size: 0.95rem;
          margin: 8px 0 2px 0;
          color: inherit;
        }
        .no-msgs-sub {
          font-size: 0.78rem;
        }
        .chat-message-row {
          display: flex;
          gap: 8px;
          max-width: 88%;
        }
        .row-own {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        .row-peer {
          align-self: flex-start;
        }
        .peer-avatar {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: linear-gradient(135deg, #6366f1, #a855f7);
          color: white;
          font-size: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .message-bubble-wrapper {
          display: flex;
          flex-direction: column;
        }
        .sender-name-label {
          font-size: 0.72rem;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 2px;
          margin-left: 2px;
        }
        .message-bubble {
          padding: 8px 12px;
          border-radius: 12px;
          font-size: 0.85rem;
          line-height: 1.45;
          word-break: break-word;
          white-space: pre-wrap;
        }
        .bubble-own {
          background: linear-gradient(135deg, #6366f1, #4f46e5);
          color: #ffffff;
          border-bottom-right-radius: 3px;
        }
        .bubble-peer {
          background: #f1f5f9;
          color: #0f172a;
          border-bottom-left-radius: 3px;
        }
        .chat-panel-root.dark .bubble-peer {
          background: #1e293b;
          color: #f1f5f9;
        }
        .message-plain-text {
          user-select: text;
        }
        .message-time-label {
          font-size: 0.65rem;
          color: #94a3b8;
          margin-top: 2px;
          margin-left: 2px;
        }
        .time-own {
          text-align: right;
          margin-right: 2px;
        }
        .chat-error-banner {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
          padding: 6px 12px;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .btn-dismiss-err {
          margin-left: auto;
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
        }
        .chat-input-form {
          padding: 10px 14px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .chat-panel-root.dark .chat-input-form {
          background: #090d16;
          border-top-color: rgba(255, 255, 255, 0.08);
        }
        .chat-input-wrapper {
          border: 1px solid #cbd5e1;
          border-radius: 10px;
          background: #ffffff;
          overflow: hidden;
          transition: border-color 0.15s;
        }
        .chat-panel-root.dark .chat-input-wrapper {
          background: #161b22;
          border-color: rgba(255, 255, 255, 0.12);
        }
        .chat-input-wrapper:focus-within {
          border-color: #6366f1;
        }
        .chat-textarea {
          width: 100%;
          border: none;
          outline: none;
          resize: none;
          padding: 8px 10px;
          font-size: 0.83rem;
          font-family: inherit;
          background: transparent;
          color: inherit;
        }
        .chat-input-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 4px 8px 6px 10px;
        }
        .char-counter {
          font-size: 0.68rem;
          color: #94a3b8;
        }
        .char-warn {
          color: #f59e0b;
          font-weight: 700;
        }
        .btn-send-chat {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: none;
          background: #6366f1;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-send-chat:disabled {
          background: #94a3b8;
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-send-chat:not(:disabled):hover {
          background: #4f46e5;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};
