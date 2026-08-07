import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, UserPlus, AlertCircle, CheckCircle } from 'lucide-react';
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
          <AlertCircle size={18} />
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
              placeholder="Sarah Connor"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
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
              placeholder="sarah@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            <span>I agree to CodeHive <a href="#terms" className="inline-link">Terms</a> & <a href="#privacy" className="inline-link">Privacy Policy</a></span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="btn-vibrant submit-btn"
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
        .auth-error-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #fca5a5;
          padding: 12px 14px;
          border-radius: 12px;
          font-size: 0.86rem;
          margin-bottom: 20px;
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
          background: rgba(255, 255, 255, 0.1);
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
        .inline-link {
          color: var(--accent-indigo);
          text-decoration: none;
        }
        .inline-link:hover {
          text-decoration: underline;
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
