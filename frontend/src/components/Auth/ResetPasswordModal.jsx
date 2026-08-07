import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Mail, CheckCircle2, AlertCircle, Send } from 'lucide-react';

export const ResetPasswordModal = ({ isOpen, onClose }) => {
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
    <div className="modal-backdrop">
      <div className="modal-card glass-card">
        <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
          <X size={18} />
        </button>

        <div className="modal-header">
          <div className="modal-icon-badge">
            <Mail size={22} className="text-accent" />
          </div>
          <h3 className="modal-title font-brand">Reset Password</h3>
          <p className="modal-description">
            Enter your registered email address and we'll send you link instructions to reset your password.
          </p>
        </div>

        {successMsg ? (
          <div className="modal-success-state">
            <CheckCircle2 size={36} className="text-emerald" />
            <p className="success-text">{successMsg}</p>
            <button className="btn-vibrant" onClick={onClose} style={{ width: '100%', marginTop: '16px' }}>
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
                  placeholder="developer@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail className="input-icon" size={18} />
              </div>
            </div>

            <button type="submit" className="btn-vibrant" disabled={loading} style={{ width: '100%' }}>
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
          background: rgba(10, 12, 16, 0.85);
          backdrop-filter: blur(8px);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modal-card {
          width: 100%;
          max-width: 440px;
          padding: 32px;
          position: relative;
          background: #11141d;
          border: 1px solid rgba(99, 102, 241, 0.3);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(99, 102, 241, 0.2);
        }
        .modal-close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid var(--border-subtle);
          color: var(--text-muted);
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .modal-close-btn:hover {
          color: #ffffff;
          background: rgba(255, 255, 255, 0.15);
        }
        .modal-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .modal-icon-badge {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px auto;
          color: var(--accent-indigo);
        }
        .modal-title {
          font-size: 1.35rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 8px;
        }
        .modal-description {
          font-size: 0.88rem;
          color: var(--text-secondary);
        }
        .modal-error-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 0.85rem;
          margin-bottom: 16px;
        }
        .modal-success-state {
          text-align: center;
          padding: 12px 0;
        }
        .text-emerald {
          color: var(--accent-emerald);
          margin-bottom: 12px;
        }
        .success-text {
          font-size: 0.92rem;
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
};
