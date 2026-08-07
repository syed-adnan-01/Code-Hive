import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ResetPasswordModal } from './ResetPasswordModal';
import { Hexagon, Code2, Users2, Zap, ShieldCheck } from 'lucide-react';

export const AuthContainer = () => {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  return (
    <div className="auth-page-wrapper">
      <div className="auth-content-grid">
        {/* Left Side: Brand Teaser & Value Props */}
        <div className="auth-hero-section">
          <div className="hero-badge font-code">
            <Zap size={14} className="text-cyan" />
            <span>REAL-TIME COLLABORATIVE ENGINE</span>
          </div>

          <h1 className="hero-title font-brand">
            Build code together, in <span className="gradient-text">Real-Time Hive</span>.
          </h1>

          <p className="hero-subtitle">
            CodeHive connects developer teams with ultra-low latency pair-programming, live state sync, integrated terminal, and instant deployment preview.
          </p>

          <div className="feature-list">
            <div className="feature-item">
              <div className="feature-icon-box cyan-glow">
                <Code2 size={20} />
              </div>
              <div>
                <h4 className="feature-title">Multi-cursor Code Editor</h4>
                <p className="feature-desc">Sub-10ms synchronization with Monaco editor kernel.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-box purple-glow">
                <Users2 size={20} />
              </div>
              <div>
                <h4 className="feature-title">Instant Workspace Rooms</h4>
                <p className="feature-desc">Share room links and instantly pair program with zero setup.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-box pink-glow">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h4 className="feature-title">Enterprise Security</h4>
                <p className="feature-desc">Powered by Firebase Auth token validation & encrypted channels.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Card Container */}
        <div className="auth-card-container">
          <div className="glass-card auth-card">
            {/* Header */}
            <div className="auth-card-header">
              <div className="auth-card-icon">
                <Hexagon size={24} />
              </div>
              <h2 className="auth-card-title font-brand">
                {activeTab === 'login' ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="auth-card-subtitle">
                {activeTab === 'login'
                  ? 'Sign in to access your CodeHive workspace rooms'
                  : 'Get started with collaborative coding in seconds'}
              </p>
            </div>

            {/* Tab Switcher */}
            <div className="tab-switcher">
              <button
                className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
                onClick={() => setActiveTab('login')}
              >
                Sign In
              </button>
              <button
                className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
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
          padding: 40px 24px 80px 24px;
        }
        .auth-content-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 48px;
          align-items: center;
        }
        @media (min-width: 960px) {
          .auth-content-grid {
            grid-template-columns: 1.1fr 0.9fr;
          }
        }
        .auth-hero-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.3);
          color: var(--accent-cyan);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          letter-spacing: 0.05em;
          width: fit-content;
        }
        .hero-title {
          font-size: 2.8rem;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.02em;
          color: #ffffff;
        }
        .hero-subtitle {
          font-size: 1.05rem;
          color: var(--text-secondary);
          line-height: 1.6;
          max-width: 520px;
        }
        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 18px;
          margin-top: 16px;
        }
        .feature-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
        }
        .feature-icon-box {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cyan-glow {
          background: rgba(6, 182, 212, 0.15);
          border: 1px solid rgba(6, 182, 212, 0.3);
          color: var(--accent-cyan);
          box-shadow: 0 0 15px rgba(6, 182, 212, 0.2);
        }
        .purple-glow {
          background: rgba(168, 85, 247, 0.15);
          border: 1px solid rgba(168, 85, 247, 0.3);
          color: var(--accent-purple);
          box-shadow: 0 0 15px rgba(168, 85, 247, 0.2);
        }
        .pink-glow {
          background: rgba(236, 72, 153, 0.15);
          border: 1px solid rgba(236, 72, 153, 0.3);
          color: var(--accent-pink);
          box-shadow: 0 0 15px rgba(236, 72, 153, 0.2);
        }
        .feature-title {
          font-size: 1.02rem;
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 2px;
        }
        .feature-desc {
          font-size: 0.86rem;
          color: var(--text-secondary);
        }
        .auth-card-container {
          display: flex;
          justify-content: center;
        }
        .auth-card {
          width: 100%;
          max-width: 460px;
          padding: 36px 32px;
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
          background: linear-gradient(135deg, var(--accent-indigo), var(--accent-purple));
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          margin: 0 auto 16px auto;
          box-shadow: 0 0 25px rgba(99, 102, 241, 0.4);
        }
        .auth-card-title {
          font-size: 1.6rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 6px;
        }
        .auth-card-subtitle {
          font-size: 0.88rem;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};
