import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ResetPasswordModal } from './ResetPasswordModal';
import { Hexagon, Code2, Users2, Zap, ShieldCheck } from 'lucide-react';

/* Decorative geometric shapes matching the landing page theme */
const ShapeCircle = ({ color, size = 80, style }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', background: color, ...style }} />
);

const ShapeTriangle = ({ color, size = 60, style }) => (
  <div style={{
    width: 0, height: 0,
    borderLeft: `${size / 2}px solid transparent`,
    borderRight: `${size / 2}px solid transparent`,
    borderBottom: `${size}px solid ${color}`,
    ...style
  }} />
);

const ShapeRect = ({ color, w = 100, h = 50, radius = 8, style }) => (
  <div style={{ width: w, height: h, background: color, borderRadius: radius, ...style }} />
);

export const AuthContainer = () => {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  return (
    <div className="auth-page-wrapper">
      {/* Background ambient floating shapes */}
      <div className="auth-ambient-shapes" aria-hidden="true">
        <div className="auth-blob" />
        <ShapeCircle color="#f97316" size={70} style={{ position: 'absolute', top: '10%', left: '8%', opacity: 0.85, animation: 'auth-float-a 6s ease-in-out infinite' }} />
        <ShapeTriangle color="#6366f1" size={50} style={{ position: 'absolute', top: '25%', right: '12%', opacity: 0.9, animation: 'auth-float-b 5s ease-in-out infinite' }} />
        <ShapeRect color="#10b981" w={44} h={44} radius={10} style={{ position: 'absolute', bottom: '15%', left: '12%', opacity: 0.85, transform: 'rotate(15deg)', animation: 'auth-spin-slow 14s linear infinite' }} />
        <ShapeCircle color="#fbbf24" size={40} style={{ position: 'absolute', bottom: '25%', right: '8%', opacity: 0.8, animation: 'auth-float-a 4.5s ease-in-out infinite 1s' }} />
      </div>

      <div className="auth-content-grid">
        {/* Left Side: Brand Teaser & Value Props */}
        <div className="auth-hero-section">
          <div className="auth-eyebrow">
            <span className="auth-eyebrow-dot" />
            <Zap size={13} style={{ color: '#f59e0b' }} />
            <span>REAL-TIME COLLABORATIVE ENGINE</span>
          </div>

          <h1 className="auth-hero-h1">
            Build code together,
            <br />
            in <span className="auth-h1-accent">Real-Time Hive</span>.
          </h1>

          <p className="auth-hero-sub">
            CodeHive connects developer teams with ultra-low latency pair-programming,
            live state sync, integrated terminal, and instant deployment preview.
          </p>

          <div className="auth-feature-list">
            <div className="auth-feature-card">
              <div className="auth-feature-icon" style={{ background: '#cffafe', color: '#06b6d4' }}>
                <Code2 size={20} />
              </div>
              <div className="auth-feature-text">
                <h4 className="auth-feature-title">Multi-cursor Code Editor</h4>
                <p className="auth-feature-desc">Sub-10ms synchronization with Monaco editor kernel.</p>
              </div>
            </div>

            <div className="auth-feature-card">
              <div className="auth-feature-icon" style={{ background: '#e0e7ff', color: '#6366f1' }}>
                <Users2 size={20} />
              </div>
              <div className="auth-feature-text">
                <h4 className="auth-feature-title">Instant Workspace Rooms</h4>
                <p className="auth-feature-desc">Share room links and instantly pair program with zero setup.</p>
              </div>
            </div>

            <div className="auth-feature-card">
              <div className="auth-feature-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
                <ShieldCheck size={20} />
              </div>
              <div className="auth-feature-text">
                <h4 className="auth-feature-title">Enterprise Security</h4>
                <p className="auth-feature-desc">Powered by Firebase Auth token validation &amp; encrypted channels.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card Container */}
        <div className="auth-card-container">
          <div className="auth-card">
            {/* Header */}
            <div className="auth-card-header">
              <div className="auth-card-icon">
                <Hexagon size={24} />
              </div>
              <h2 className="auth-card-title">
                {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="auth-card-subtitle">
                {activeTab === 'login'
                  ? 'Sign in to access your CodeHive workspace rooms'
                  : 'Get started with collaborative coding in seconds'}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="auth-tab-switcher">
              <button
                type="button"
                className={`auth-tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => setActiveTab('login')}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${activeTab === 'register' ? 'active' : ''}`}
                onClick={() => setActiveTab('register')}
              >
                Register
              </button>
            </div>

            {/* Form Content */}
            {activeTab === 'login' ? (
              <LoginForm onOpenResetModal={() => setIsResetModalOpen(true)} />
            ) : (
              <RegisterForm />
            )}
          </div>
        </div>
      </div>

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
      />

      <style>{`
        .auth-page-wrapper {
          position: relative;
          z-index: 1;
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 24px 80px 24px;
          width: 100%;
        }
        .auth-ambient-shapes {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }
        .auth-blob {
          position: absolute;
          width: 480px;
          height: 480px;
          border-radius: 50%;
          background: radial-gradient(circle, #e0e7ff 0%, #e0f2fe 50%, transparent 80%);
          top: 15%;
          left: -100px;
          opacity: 0.7;
        }

        @keyframes auth-float-a {
          0%, 100% { transform: translateY(0px); }
          50%      { transform: translateY(-14px); }
        }
        @keyframes auth-float-b {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%      { transform: translateY(-12px) rotate(8deg); }
        }
        @keyframes auth-spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        .auth-content-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 56px;
          align-items: center;
          position: relative;
          z-index: 1;
        }
        @media (min-width: 960px) {
          .auth-content-grid {
            grid-template-columns: 1.15fr 0.85fr;
          }
        }

        /* Left Hero Section */
        .auth-hero-section {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }
        .auth-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: 'Fira Code', monospace;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #374151;
          background: #fef3c7;
          border: 1px solid #fde68a;
          padding: 5px 12px;
          border-radius: 20px;
          width: fit-content;
        }
        .auth-eyebrow-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #f97316;
        }
        .auth-hero-h1 {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(2.4rem, 4vw, 3.4rem);
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.03em;
          color: #111827;
          margin: 0;
        }
        .auth-h1-accent {
          color: #6366f1;
        }
        .auth-hero-sub {
          font-size: 1.05rem;
          color: #6b7280;
          line-height: 1.65;
          max-width: 500px;
          margin: 0 0 10px 0;
        }

        /* Feature Cards */
        .auth-feature-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-top: 8px;
        }
        .auth-feature-card {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          background: #ffffff;
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          padding: 16px 18px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .auth-feature-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
          border-color: #e0e7ff;
        }
        .auth-feature-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .auth-feature-text {
          flex: 1;
        }
        .auth-feature-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #111827;
          margin: 0 0 3px 0;
        }
        .auth-feature-desc {
          font-size: 0.86rem;
          color: #6b7280;
          line-height: 1.45;
          margin: 0;
        }

        /* Right Side: Auth Card */
        .auth-card-container {
          display: flex;
          justify-content: center;
          width: 100%;
        }
        .auth-card {
          width: 100%;
          max-width: 440px;
          background: #ffffff;
          border: 1px solid #f1f5f9;
          border-radius: 24px;
          padding: 36px 32px;
          box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.03);
          position: relative;
        }
        .auth-card-header {
          text-align: center;
          margin-bottom: 24px;
        }
        .auth-card-icon {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, #6366f1, #3b82f6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          margin: 0 auto 16px auto;
          box-shadow: 0 8px 20px rgba(99, 102, 241, 0.28);
        }
        .auth-card-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.65rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: #111827;
          margin: 0 0 6px 0;
        }
        .auth-card-subtitle {
          font-size: 0.88rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.5;
        }

        /* Segmented Tab Switcher */
        .auth-tab-switcher {
          display: flex;
          background: #f3f4f6;
          border: 1px solid #e5e7eb;
          border-radius: 50px;
          padding: 4px;
          gap: 4px;
          margin-bottom: 24px;
        }
        .auth-tab-btn {
          flex: 1;
          border: none;
          background: transparent;
          color: #6b7280;
          padding: 9px 16px;
          border-radius: 50px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.18s ease;
          font-family: inherit;
        }
        .auth-tab-btn:hover {
          color: #111827;
        }
        .auth-tab-btn.active {
          background: #ffffff;
          color: #111827;
          font-weight: 700;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
      `}</style>
    </div>
  );
};
