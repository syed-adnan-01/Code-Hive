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
              autoComplete="off"
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
          className="auth-submit-btn"
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
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
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
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #b91c1c;
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 0.84rem;
          line-height: 1.4;
        }
        .flex-shrink-0 { flex-shrink: 0; }
        .btn-switch-demo {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          color: #1d4ed8;
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
          background: #dbeafe;
          box-shadow: 0 2px 8px rgba(29, 78, 216, 0.15);
        }
        .demo-hint-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #fffbeb;
          border: 1px dashed #fde68a;
          padding: 10px 14px;
          border-radius: 12px;
          margin-bottom: 20px;
          font-size: 0.82rem;
          color: #92400e;
        }
        .demo-hint-text {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }
        .text-amber {
          color: #d97706;
        }
        .btn-demo-fill {
          background: #fef3c7;
          border: 1px solid #fde68a;
          color: #b45309;
          border-radius: 6px;
          padding: 4px 10px;
          font-size: 0.75rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-demo-fill:hover {
          background: #fde68a;
          color: #78350f;
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
        .label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
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
          padding: 11px 40px 11px 38px;
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
        .input-field:-webkit-autofill,
        .input-field:-webkit-autofill:hover,
        .input-field:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px #f9fafb inset !important;
          -webkit-text-fill-color: #111827 !important;
          transition: background-color 5000s ease-in-out 0s;
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
        .input-toggle-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 2px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.18s;
        }
        .input-toggle-btn:hover {
          color: #4b5563;
        }
        .forgot-link {
          background: none;
          border: none;
          color: #6366f1;
          font-size: 0.8rem;
          cursor: pointer;
          font-weight: 600;
          transition: color 0.18s ease;
          padding: 0;
        }
        .forgot-link:hover {
          color: #4f46e5;
          text-decoration: underline;
        }
        .form-options-row {
          display: flex;
          align-items: center;
          margin-top: 2px;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.84rem;
          color: #4b5563;
          cursor: pointer;
          user-select: none;
        }
        .custom-checkbox {
          accent-color: #6366f1;
          width: 16px;
          height: 16px;
          border-radius: 4px;
          cursor: pointer;
        }
        .auth-submit-btn {
          width: 100%;
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
          margin-top: 4px;
          font-family: inherit;
        }
        .auth-submit-btn:hover:not(:disabled) {
          background: #1f2937;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(17, 24, 39, 0.2);
        }
        .auth-submit-btn:active:not(:disabled) {
          transform: scale(0.98);
        }
        .auth-submit-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .divider-container {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 22px 0 8px 0;
        }
        .divider-line {
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }
        .divider-text {
          font-size: 0.72rem;
          color: #9ca3af;
          font-weight: 700;
          letter-spacing: 0.08em;
          font-family: 'Fira Code', monospace;
        }
      `}</style>
    </div>
  );
};
