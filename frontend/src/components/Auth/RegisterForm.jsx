import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, UserPlus, AlertCircle } from 'lucide-react';
import { SocialAuth } from './SocialAuth';

export const RegisterForm = () => {
  const { signUp, error, clearError } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  // Password strength calculation
  const getPasswordStrength = (pass) => {
    if (!pass) return { score: 0, label: '', color: 'transparent' };
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    if (score <= 2) return { score: 33, label: 'Weak', color: '#ef4444' };
    if (score <= 4) return { score: 66, label: 'Fair', color: '#f59e0b' };
    return { score: 100, label: 'Strong', color: '#10b981' };
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    if (!agreeTerms) {
      setLocalError('You must accept the CodeHive Terms of Service.');
      return;
    }

    setSubmitting(true);
    try {
      await signUp(email, password, displayName);
    } catch (err) {
      // AuthContext handles error formatting
    } finally {
      setSubmitting(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="register-form-container">
      {displayError && (
        <div className="auth-error-banner">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span>{displayError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form">
        {/* Full Name */}
        <div className="input-group">
          <label className="input-label">Full Name</label>
          <div className="input-wrapper">
            <input
              type="text"
              className="input-field"
              placeholder="Alex Dev"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="off"
              required
            />
            <User className="input-icon" size={18} />
          </div>
        </div>

        {/* Email Input */}
        <div className="input-group">
          <label className="input-label">Work Email</label>
          <div className="input-wrapper">
            <input
              type="email"
              className="input-field"
              placeholder="alex@codehive.dev"
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
          <label className="input-label">Create Password</label>
          <div className="input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-field"
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Lock className="input-icon" size={18} />
            <button
              type="button"
              className="input-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {password && (
            <div className="strength-meter-container">
              <div className="strength-bar-track">
                <div
                  className="strength-bar-fill"
                  style={{ width: `${strength.score}%`, backgroundColor: strength.color }}
                ></div>
              </div>
              <span className="strength-label" style={{ color: strength.color }}>
                {strength.label}
              </span>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="input-group">
          <label className="input-label">Confirm Password</label>
          <div className="input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-field"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <Lock className="input-icon" size={18} />
          </div>
        </div>

        {/* Terms Checkbox */}
        <div className="form-options-row">
          <label className="checkbox-label">
            <input
              type="checkbox"
              className="custom-checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
            />
            <span>I agree to CodeHive <a href="#terms" className="inline-link">Terms</a> &amp; <a href="#privacy" className="inline-link">Privacy Policy</a></span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="auth-submit-btn"
          disabled={submitting}
        >
          {submitting ? (
            <span>Creating Hive Account...</span>
          ) : (
            <>
              <span>Create Account</span>
              <UserPlus size={18} />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="divider-container">
        <span className="divider-line"></span>
        <span className="divider-text">OR REGISTER WITH</span>
        <span className="divider-line"></span>
      </div>

      <SocialAuth />

      <style>{`
        .register-form-container {
          display: flex;
          flex-direction: column;
        }
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
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
          font-size: 0.86rem;
          margin-bottom: 20px;
        }
        .flex-shrink-0 { flex-shrink: 0; }
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
        .strength-meter-container {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 6px;
        }
        .strength-bar-track {
          flex: 1;
          height: 4px;
          background: #f1f5f9;
          border-radius: 2px;
          overflow: hidden;
        }
        .strength-bar-fill {
          height: 100%;
          transition: width 0.3s ease, background-color 0.3s ease;
        }
        .strength-label {
          font-size: 0.75rem;
          font-weight: 600;
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
        .inline-link {
          color: #6366f1;
          text-decoration: none;
          font-weight: 500;
        }
        .inline-link:hover {
          color: #4f46e5;
          text-decoration: underline;
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
