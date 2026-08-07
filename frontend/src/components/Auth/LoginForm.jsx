import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, Sparkles } from 'lucide-react';
import { SocialAuth } from './SocialAuth';

export const LoginForm = ({ onOpenResetModal }) => {
  const { signIn, error, clearError, isDemoMode, enableDemoMode } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!email || !password) {
      setLocalError('Please enter both email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      // Error handled via AuthContext error or local fallback
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemoFill = () => {
    setEmail('developer@codehive.dev');
    setPassword('HivePassword123!');
  };

  const displayError = localError || error;

  return (
    <div className="login-form-container">
      {displayError && (
        <div className="auth-error-banner-column">
          <div className="auth-error-banner">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>{displayError}</span>
          </div>
          {!isDemoMode && (
            <button
              type="button"
              className="btn-switch-demo"
              onClick={enableDemoMode}
            >
              <Sparkles size={14} />
              <span>Switch to Demo Auth Mode</span>
            </button>
          )}
        </div>
      )}

      {isDemoMode && (
        <div className="demo-hint-banner">
          <div className="demo-hint-text">
            <Sparkles size={16} className="text-amber" />
            <span>Demo Auth Active: Auto-fill test user</span>
          </div>
          <button type="button" className="btn-demo-fill" onClick={handleQuickDemoFill}>
            Auto Fill
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        {/* Email Input */}
        <div className="input-group">
          <label className="input-label">Work Email</label>
          <div className="input-wrapper">
            <input
              type="email"
              className="input-field"
              placeholder="name@codehive.dev"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Mail className="input-icon" size={18} />
          </div>
        </div>

        {/* Password Input */}
        <div className="input-group">
          <div className="label-row">
            <label className="input-label">Password</label>
            <button
              type="button"
              className="forgot-link"
              onClick={onOpenResetModal}
            >
              Forgot password?
            </button>
          </div>
          <div className="input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-field"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Lock className="input-icon" size={18} />
            <button
              type="button"
              className="input-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div className="form-options-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              className="custom-checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span>Remember session on this browser</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn-vibrant submit-btn"
          disabled={submitting}
        >
          {submitting ? (
            <span className="spinner-text">Signing in to Hive...</span>
          ) : (
            <>
              <span>Sign In to CodeHive</span>
              <LogIn size={18} />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="divider-container">
        <span className="divider-line"></span>
        <span className="divider-text">OR CONTINUE WITH</span>
        <span className="divider-line"></span>
      </div>

      {/* Social Google Auth */}
      <SocialAuth />

      <style>{`
        .login-form-container {
          display: flex;
          flex-direction: column;
        }
        .auth-error-banner-column {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }
        .auth-error-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #fca5a5;
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 0.84rem;
          line-height: 1.4;
        }
        .flex-shrink-0 { flex-shrink: 0; }
        .btn-switch-demo {
          background: rgba(99, 102, 241, 0.2);
          border: 1px solid rgba(99, 102, 241, 0.4);
          color: #ffffff;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
        }
        .btn-switch-demo:hover {
          background: rgba(99, 102, 241, 0.35);
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.3);
        }
        .demo-hint-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(245, 158, 11, 0.1);
          border: 1px dashed rgba(245, 158, 11, 0.35);
          padding: 10px 14px;
          border-radius: 12px;
          margin-bottom: 20px;
          font-size: 0.82rem;
          color: #fef08a;
        }
        .demo-hint-text {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .text-amber {
          color: var(--accent-amber);
        }
        .btn-demo-fill {
          background: rgba(245, 158, 11, 0.2);
          border: 1px solid rgba(245, 158, 11, 0.4);
          color: var(--accent-amber);
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-demo-fill:hover {
          background: rgba(245, 158, 11, 0.35);
          color: #ffffff;
        }
        .label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .forgot-link {
          background: none;
          border: none;
          color: var(--accent-indigo);
          font-size: 0.8rem;
          cursor: pointer;
          font-weight: 500;
          transition: color 0.2s ease;
        }
        .forgot-link:hover {
          color: var(--accent-purple);
          text-decoration: underline;
        }
        .form-options-row {
          display: flex;
          align-items: center;
          margin-bottom: 22px;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.84rem;
          color: var(--text-secondary);
          cursor: pointer;
          user-select: none;
        }
        .custom-checkbox {
          accent-color: var(--accent-indigo);
          width: 16px;
          height: 16px;
          border-radius: 4px;
          cursor: pointer;
        }
        .submit-btn {
          width: 100%;
          padding: 13px;
          font-size: 0.98rem;
          margin-top: 4px;
        }
        .divider-container {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 24px 0 8px 0;
        }
        .divider-line {
          flex: 1;
          height: 1px;
          background: rgba(255, 255, 255, 0.08);
        }
        .divider-text {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 600;
          letter-spacing: 0.06em;
        }
      `}</style>
    </div>
  );
};
