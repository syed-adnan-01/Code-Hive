import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { X, Mail, CheckCircle2, AlertCircle, Send } from 'lucide-react';

export const ResetPasswordModal = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [modalError, setModalError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');
    setSuccessMsg('');

    if (!email) {
      setModalError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSuccessMsg(`Password reset instructions sent to ${email}`);
    } catch (err) {
      setModalError(err.message || 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal-card ${isDark ? 'dark' : 'light'}`} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div className="modal-header">
          <div className="modal-icon-badge">
            <Mail size={22} />
          </div>
          <h3 className="modal-title">Reset Password</h3>
          <p className="modal-description">
            Enter your registered email address and we'll send you link instructions to reset your password.
          </p>
        </div>

        {successMsg ? (
          <div className="modal-success-state">
            <CheckCircle2 size={36} className="text-emerald" />
            <p className="success-text">{successMsg}</p>
            <button className="modal-submit-btn" onClick={onClose} style={{ width: '100%', marginTop: '16px' }}>
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            {modalError && (
              <div className="modal-error-banner">
                <AlertCircle size={16} />
                <span>{modalError}</span>
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Account Email</label>
              <div className="input-wrapper">
                <input
                  type="email"
                  className="input-field"
                  placeholder="developer@codehive.dev"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="off"
                  required
                />
                <Mail className="input-icon" size={18} />
              </div>
            </div>

            <button type="submit" className="modal-submit-btn" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
              {loading ? (
                'Sending Link...'
              ) : (
                <>
                  <Send size={16} />
                  <span>Send Reset Link</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>

      <style>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(17, 24, 39, 0.4);
          backdrop-filter: blur(8px);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: modalFadeIn 0.2s ease-out;
        }
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .modal-card {
          width: 100%;
          max-width: 440px;
          padding: 36px 32px;
          position: relative;
          background: #ffffff;
          border: 1px solid #f1f5f9;
          border-radius: 24px;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.04);
          animation: modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes modalSlideUp {
          from { transform: translateY(20px) scale(0.96); opacity: 0; }
          to   { transform: translateY(0) scale(1); opacity: 1; }
        }
        .modal-close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: #f3f4f6;
          border: none;
          color: #6b7280;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .modal-close-btn:hover {
          color: #111827;
          background: #e5e7eb;
          transform: rotate(90deg);
        }
        .modal-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .modal-icon-badge {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: #e0e7ff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px auto;
          color: #6366f1;
        }
        .modal-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.5rem;
          font-weight: 800;
          color: #111827;
          margin: 0 0 8px 0;
          letter-spacing: -0.02em;
        }
        .modal-description {
          font-size: 0.88rem;
          color: #6b7280;
          line-height: 1.5;
          margin: 0;
        }
        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .modal-error-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 0.84rem;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .input-label {
          font-size: 0.84rem;
          font-weight: 600;
          color: #374151;
        }
        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-field {
          width: 100%;
          background: #f9fafb;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          padding: 11px 16px 11px 38px;
          color: #111827;
          font-size: 0.92rem;
          transition: all 0.18s ease;
          outline: none;
          font-family: inherit;
        }
        .input-field:focus {
          background: #ffffff;
          border-color: #6366f1;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.12);
        }
        .input-field::placeholder {
          color: #9ca3af;
        }
        .input-icon {
          position: absolute;
          left: 12px;
          color: #9ca3af;
          pointer-events: none;
        }
        .modal-submit-btn {
          background: #111827;
          color: #ffffff;
          border: none;
          border-radius: 50px;
          padding: 13px;
          font-size: 0.95rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.18s ease;
          font-family: inherit;
        }
        .modal-submit-btn:hover:not(:disabled) {
          background: #1f2937;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(17, 24, 39, 0.2);
        }
        .modal-submit-btn:active:not(:disabled) {
          transform: scale(0.98);
        }
        .modal-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .modal-success-state {
          text-align: center;
          padding: 12px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .text-emerald {
          color: #10b981;
          margin-bottom: 12px;
        }
        .success-text {
          font-size: 0.92rem;
          color: #374151;
          line-height: 1.5;
        }

        /* ── Dark Mode Modal Overrides ── */
        .modal-card.dark {
          background: #0f172a;
          border-color: #1e293b;
          color: #f1f5f9;
          box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.7);
        }
        .modal-card.dark .modal-title {
          color: #f8fafc;
        }
        .modal-card.dark .modal-description {
          color: #94a3b8;
        }
        .modal-card.dark .modal-close-btn {
          background: #1e293b;
          border-color: #334155;
          color: #94a3b8;
        }
        .modal-card.dark .modal-close-btn:hover {
          color: #f8fafc;
          background: #334155;
        }
        .modal-card.dark .input-label {
          color: #cbd5e1;
        }
        .modal-card.dark .input-field {
          background: #1e293b;
          border-color: #334155;
          color: #f8fafc;
        }
        .modal-card.dark .input-field:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25);
        }
        .modal-card.dark .modal-submit-btn {
          background: #6366f1;
        }
        .modal-card.dark .modal-submit-btn:hover:not(:disabled) {
          background: #4f46e5;
        }
        .modal-card.dark .success-text {
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
};
