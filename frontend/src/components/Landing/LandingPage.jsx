import React, { useState, useEffect } from 'react';

/* ─────────────────────────────────────────────
   Tiny SVG geometric shapes used as decorators
───────────────────────────────────────────── */
const ShapeCircle = ({ color, size = 80, style }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', background: color, ...style }} />
);

const ShapeCircleOutline = ({ color, size = 80, style }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', border: `3px solid ${color}`, ...style }} />
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

const ShapeHalf = ({ color, size = 80, style }) => (
  <div style={{
    width: size, height: size / 2,
    background: color,
    borderRadius: `0 0 ${size}px ${size}px`,
    ...style
  }} />
);

/* ─────────────────────────────────────────────
   Animated stat counter
───────────────────────────────────────────── */
const AnimatedCounter = ({ end, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(end / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration]);
  return <span>{count.toLocaleString()}{suffix}</span>;
};

/* ─────────────────────────────────────────────
   Language badge chips
───────────────────────────────────────────── */
const LANGS = [
  { name: 'JavaScript', color: '#f59e0b', bg: '#fef3c7' },
  { name: 'Python',     color: '#3b82f6', bg: '#dbeafe' },
  { name: 'C++',        color: '#ef4444', bg: '#fee2e2' },
  { name: 'Java',       color: '#f97316', bg: '#ffedd5' },
  { name: 'TypeScript', color: '#6366f1', bg: '#e0e7ff' },
  { name: 'Go',         color: '#06b6d4', bg: '#cffafe' },
  { name: 'Rust',       color: '#a855f7', bg: '#f3e8ff' },
];

/* ─────────────────────────────────────────────
   Feature cards data
───────────────────────────────────────────── */
const FEATURES = [
  {
    emoji: '⚡',
    title: 'Real-Time CRDT Sync',
    desc: 'Sub-10ms latency code synchronization powered by Yjs CRDTs and Hocuspocus WebSocket engine. Every keystroke is instantly mirrored across all collaborators.',
    color: '#f59e0b',
    bg: '#fef3c7',
  },
  {
    emoji: '🛡️',
    title: 'Role-Based Security',
    desc: 'Owner, Editor, and Viewer tiers enforced at the WebSocket layer. Single-use 60-second room tickets ensure no long-lived credentials.',
    color: '#6366f1',
    bg: '#e0e7ff',
  },
  {
    emoji: '🚀',
    title: 'Judge0 Execution Engine',
    desc: 'Sandboxed multi-language compilation with exponential backoff polling and 64 KB output capping. Run code directly inside collaborative rooms.',
    color: '#10b981',
    bg: '#d1fae5',
  },
];

/* ─────────────────────────────────────────────
   Main LandingPage Component
───────────────────────────────────────────── */
export const LandingPage = ({ onGetStarted, onLogin }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="lp-root">

      {/* ── NAVBAR ── */}
      <header className="lp-nav">
        <div className="lp-nav-inner">
          {/* Logo */}
          <a href="#" className="lp-logo">
            <div className="lp-logo-hex">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <polygon points="11,1 20,5.5 20,16.5 11,21 2,16.5 2,5.5" fill="#6366f1" stroke="#a855f7" strokeWidth="1.5" />
                <polygon points="11,5 16,8 16,14 11,17 6,14 6,8" fill="white" fillOpacity="0.25" />
              </svg>
            </div>
            <span className="lp-logo-name">Code<span className="lp-logo-accent">Hive</span></span>
          </a>

          {/* Desktop Nav Links */}
          <nav className="lp-nav-links">
            <a href="#features">Features</a>
            <a href="#languages">Languages</a>
            <a href="#security">Security</a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>
          </nav>

          {/* Nav Actions */}
          <div className="lp-nav-actions">
            <button className="lp-btn-ghost" onClick={onLogin}>Login</button>
            <button className="lp-btn-primary" onClick={onGetStarted}>Sign Up Free</button>
          </div>

          {/* Mobile hamburger */}
          <button className="lp-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>

        {/* Mobile drawer */}
        {mobileMenuOpen && (
          <div className="lp-mobile-menu">
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#languages" onClick={() => setMobileMenuOpen(false)}>Languages</a>
            <a href="#security" onClick={() => setMobileMenuOpen(false)}>Security</a>
            <button className="lp-btn-ghost" onClick={onLogin}>Login</button>
            <button className="lp-btn-primary" onClick={onGetStarted}>Sign Up Free</button>
          </div>
        )}
      </header>

      {/* ── HERO SECTION ── */}
      <section className="lp-hero">
        {/* Left column: copy */}
        <div className="lp-hero-copy">
          <div className="lp-eyebrow">
            <span className="lp-eyebrow-dot" />
            REAL-TIME COLLABORATIVE IDE
          </div>

          <h1 className="lp-hero-h1">
            Code together,
            <br />
            <span className="lp-h1-accent">ship faster.</span>
          </h1>

          <p className="lp-hero-sub">
            CodeHive connects developer teams with ultra-low latency pair-programming,
            live CRDT state sync, sandboxed multi-language execution, and enterprise-grade
            security — all in one hive.
          </p>

          <div className="lp-hero-ctas">
            <button className="lp-btn-primary lp-btn-lg" onClick={onGetStarted}>
              Start Coding Free
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button className="lp-btn-outline" onClick={onLogin}>
              See how it works
            </button>
          </div>

          {/* Trust logos */}
          <div className="lp-trust">
            <span className="lp-trust-label">Supports</span>
            {LANGS.map(l => (
              <span key={l.name} className="lp-lang-badge"
                style={{ background: l.bg, color: l.color }}>
                {l.name}
              </span>
            ))}
          </div>
        </div>

        {/* Right column: geometric illustration */}
        <div className="lp-hero-visual" aria-hidden="true">
          {/* Big background blob */}
          <div className="lp-hero-blob" />

          {/* Scattered shapes — inspired by Nunito/DSM/Rotation designs */}
          <ShapeCircle color="#f97316" size={90} style={{ position: 'absolute', top: '8%', left: '12%', opacity: 0.9 }} />
          <ShapeCircleOutline color="#6366f1" size={70} style={{ position: 'absolute', top: '5%', right: '20%' }} />
          <ShapeCircle color="#10b981" size={55} style={{ position: 'absolute', top: '20%', right: '8%' }} />
          <ShapeTriangle color="#f59e0b" size={64} style={{ position: 'absolute', top: '45%', left: '5%' }} />
          <ShapeTriangle color="#6366f1" size={48} style={{ position: 'absolute', bottom: '25%', right: '12%', transform: 'rotate(180deg)' }} />
          <ShapeRect color="#a855f7" w={110} h={52} radius={26} style={{ position: 'absolute', bottom: '35%', left: '18%' }} />
          <ShapeHalf color="#06b6d4" size={80} style={{ position: 'absolute', bottom: '15%', left: '38%' }} />
          <ShapeRect color="#ef4444" w={52} h={52} radius={8} style={{ position: 'absolute', top: '38%', right: '26%', transform: 'rotate(12deg)' }} />
          <ShapeCircle color="#fbbf24" size={40} style={{ position: 'absolute', bottom: '30%', right: '30%', opacity: 0.8 }} />

          {/* Floating code editor card */}
          <div className="lp-code-card">
            <div className="lp-code-card-dots">
              <span style={{background:'#ef4444'}} />
              <span style={{background:'#f59e0b'}} />
              <span style={{background:'#10b981'}} />
            </div>
            <pre className="lp-code-snippet">{`// CodeHive — Live Session
const room = await hive.joinRoom({
  id: "team-sprint-42",
  role: "editor"
});

room.onCollaborator((user) => {
  console.log(\`\${user.name} joined!\`);
});`}</pre>
          </div>

          {/* Live users pill */}
          <div className="lp-live-pill">
            <span className="lp-live-dot" />
            <span className="lp-live-avatars">
              {['#6366f1','#f97316','#10b981'].map((c, i) => (
                <span key={i} className="lp-avatar" style={{ background: c, marginLeft: i ? -8 : 0 }} />
              ))}
            </span>
            <span>3 devs coding now</span>
          </div>

          {/* Run result chip */}
          <div className="lp-run-chip">
            <span className="lp-run-icon">▶</span>
            <span>Executed in 142ms · Judge0</span>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div className="lp-stats-bar">
        <div className="lp-stat">
          <span className="lp-stat-num"><AnimatedCounter end={56} suffix="+" /></span>
          <span className="lp-stat-label">Automated Tests Passing</span>
        </div>
        <div className="lp-stat-divider" />
        <div className="lp-stat">
          <span className="lp-stat-num"><AnimatedCounter end={7} /></span>
          <span className="lp-stat-label">Supported Languages</span>
        </div>
        <div className="lp-stat-divider" />
        <div className="lp-stat">
          <span className="lp-stat-num">&lt;10ms</span>
          <span className="lp-stat-label">Sync Latency</span>
        </div>
        <div className="lp-stat-divider" />
        <div className="lp-stat">
          <span className="lp-stat-num">60s</span>
          <span className="lp-stat-label">Single-Use Room Tickets</span>
        </div>
      </div>

      {/* ── FEATURES SECTION ── */}
      <section id="features" className="lp-section lp-features">
        <div className="lp-section-header">
          <div className="lp-eyebrow lp-eyebrow-dark">
            <span className="lp-eyebrow-dot" style={{ background: '#6366f1' }} />
            CAPABILITIES
          </div>
          <h2 className="lp-section-h2">
            Everything your team needs
            <br />
            to <span className="lp-underline-accent">build together</span>.
          </h2>
          <p className="lp-section-sub">
            From real-time CRDT synchronization to sandboxed code execution, CodeHive
            packs enterprise-grade infrastructure into a frictionless developer experience.
          </p>
        </div>

        <div className="lp-feature-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="lp-feature-card">
              <div className="lp-feature-icon" style={{ background: f.bg, color: f.color }}>
                <span>{f.emoji}</span>
              </div>
              <h3 className="lp-feature-title">{f.title}</h3>
              <p className="lp-feature-desc">{f.desc}</p>
              <div className="lp-feature-corner" style={{ background: f.bg }} />
            </div>
          ))}

          {/* Extra wide feature card */}
          <div className="lp-feature-card lp-feature-card-wide">
            <div className="lp-feature-wide-left">
              <div className="lp-feature-icon" style={{ background: '#cffafe', color: '#06b6d4' }}>
                <span>🔗</span>
              </div>
              <h3 className="lp-feature-title">Shared Room Execution</h3>
              <p className="lp-feature-desc">
                In collaborative rooms, the server executes its own verified copy of the shared document
                (<code>Y.Text('code')</code>) and broadcasts formatted run results to all peers via{' '}
                <code>Y.Map('meta')</code>. Every participant sees live output simultaneously.
              </p>
              <button className="lp-btn-primary lp-btn-sm" onClick={onGetStarted}>
                Try it free →
              </button>
            </div>
            <div className="lp-feature-wide-right" aria-hidden="true">
              <ShapeCircle color="#06b6d4" size={64} style={{ position: 'absolute', top: 10, right: 40, opacity: 0.7 }} />
              <ShapeTriangle color="#6366f1" size={50} style={{ position: 'absolute', bottom: 20, right: 80, transform: 'rotate(30deg)' }} />
              <ShapeRect color="#f59e0b" w={80} h={36} radius={18} style={{ position: 'absolute', top: 60, right: 20 }} />
              <ShapeHalf color="#a855f7" size={60} style={{ position: 'absolute', bottom: 10, right: 150 }} />
              <div className="lp-mini-terminal">
                <div className="lp-mini-terminal-bar">
                  <span />
                  <span style={{background:'#f59e0b'}} />
                  <span style={{background:'#10b981'}} />
                </div>
                <p style={{ color: '#10b981', fontSize: '0.78rem', fontFamily: 'monospace', margin: 0 }}>
                  ✓ Compiled in 0.89s
                </p>
                <p style={{ color: '#94a3b8', fontSize: '0.78rem', fontFamily: 'monospace', margin: 0 }}>
                  Hello from CodeHive!
                </p>
                <p style={{ color: '#6366f1', fontSize: '0.78rem', fontFamily: 'monospace', margin: 0 }}>
                  Process exited with code 0
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LANGUAGES SECTION ── */}
      <section id="languages" className="lp-section lp-lang-section">
        <div className="lp-lang-inner">
          <div>
            <div className="lp-eyebrow">
              <span className="lp-eyebrow-dot" style={{ background: '#f97316' }} />
              LANGUAGES
            </div>
            <h2 className="lp-section-h2 lp-lang-h2">
              Code in any
              <br />
              <span className="lp-underline-accent">language you love</span>.
            </h2>
            <p className="lp-section-sub" style={{ maxWidth: 440 }}>
              CodeHive ships with first-class support for 7 languages, each with a starter
              template, stdin support, and sandboxed Judge0 execution.
            </p>
            <button className="lp-btn-primary lp-btn-lg" style={{ marginTop: 28 }} onClick={onGetStarted}>
              Open the editor →
            </button>
          </div>

          <div className="lp-lang-grid">
            {LANGS.map((l, i) => (
              <div key={l.name} className="lp-lang-card"
                style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="lp-lang-circle" style={{ background: l.bg, color: l.color }}>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>{l.name.slice(0, 2)}</span>
                </div>
                <span className="lp-lang-name">{l.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECURITY SECTION ── */}
      <section id="security" className="lp-section lp-security-section">
        {/* Geometric decorators */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <ShapeCircle color="#f97316" size={180} style={{ position: 'absolute', top: -60, right: -60, opacity: 0.12 }} />
          <ShapeTriangle color="#6366f1" size={120} style={{ position: 'absolute', bottom: -30, left: 60, opacity: 0.12 }} />
        </div>

        <div className="lp-section-header">
          <div className="lp-eyebrow lp-eyebrow-dark">
            <span className="lp-eyebrow-dot" style={{ background: '#10b981' }} />
            SECURITY
          </div>
          <h2 className="lp-section-h2">
            Built secure,
            <br />
            <span className="lp-underline-accent-green">from the ground up</span>.
          </h2>
        </div>

        <div className="lp-security-grid">
          {[
            { icon: '🔐', title: 'Viewer Read-Only Enforcement', desc: 'WebSocket connections are configured with readOnly=true. Monaco editor is locked. POST /api/run returns 403 for viewers.' },
            { icon: '🎫', title: 'Single-Use Room Tickets', desc: 'Cryptographically generated tickets expire after 60 seconds and are deleted immediately upon consumption. Zero replay attacks.' },
            { icon: '🌐', title: 'Origin Header Validation', desc: 'ALLOWED_ORIGINS guard on every WebSocket upgrade request prevents cross-site hijacking at the protocol layer.' },
            { icon: '📏', title: 'Size Caps & Rate Limiting', desc: 'Source code: 100 KB. Stdin: 10 KB. Judge0 output: 64 KB. Rate limits: 20 runs/min, 30 rooms/min, 60 tickets/min.' },
            { icon: '🛡️', title: 'XSS Protection', desc: 'Compiler output is rendered strictly as plain text — no HTML injection or unsafe DOM operations. Period.' },
            { icon: '🔑', title: 'Firebase Auth Token Chain', desc: 'Chain-of-trust tickets issued via Firebase Auth-verified REST endpoints keep long-lived credentials away from WebSocket channels.' },
          ].map((item, i) => (
            <div key={i} className="lp-security-card">
              <div className="lp-security-icon">{item.icon}</div>
              <h4 className="lp-security-title">{item.title}</h4>
              <p className="lp-security-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="lp-cta-banner">
        {/* Geometric shapes inside banner */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
          <ShapeCircle color="white" size={120} style={{ position: 'absolute', top: -30, left: '8%', opacity: 0.08 }} />
          <ShapeTriangle color="white" size={80} style={{ position: 'absolute', bottom: -10, right: '12%', opacity: 0.1, transform: 'rotate(20deg)' }} />
          <ShapeRect color="white" w={60} h={60} radius={8} style={{ position: 'absolute', top: 20, right: '35%', opacity: 0.06, transform: 'rotate(35deg)' }} />
        </div>

        <div className="lp-eyebrow" style={{ justifyContent: 'center', color: 'rgba(255,255,255,0.7)' }}>
          <span className="lp-eyebrow-dot" style={{ background: '#fbbf24' }} />
          GET STARTED TODAY
        </div>
        <h2 className="lp-cta-h2">
          Bring your dev team
          <br />
          into one hive.
        </h2>
        <p className="lp-cta-sub">
          CodeHive is free to get started. No credit card required.
          56 automated tests ensure everything just works.
        </p>
        <div className="lp-cta-btns">
          <button className="lp-btn-white lp-btn-lg" onClick={onGetStarted}>
            Create free account →
          </button>
          <button className="lp-btn-ghost-white" onClick={onLogin}>
            Sign in
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <div className="lp-logo">
              <div className="lp-logo-hex">
                <svg width="18" height="18" viewBox="0 0 22 22" fill="none">
                  <polygon points="11,1 20,5.5 20,16.5 11,21 2,16.5 2,5.5" fill="#6366f1" stroke="#a855f7" strokeWidth="1.5" />
                </svg>
              </div>
              <span className="lp-logo-name">Code<span className="lp-logo-accent">Hive</span></span>
            </div>
            <p className="lp-footer-tagline">
              A high-performance real-time collaborative workspace IDE.
            </p>
          </div>
          <div className="lp-footer-links">
            <span className="lp-footer-link-group-title">Product</span>
            <a href="#features">Features</a>
            <a href="#languages">Languages</a>
            <a href="#security">Security</a>
          </div>
          <div className="lp-footer-links">
            <span className="lp-footer-link-group-title">Developer</span>
            <a href="https://firebase.google.com/docs/auth" target="_blank" rel="noopener noreferrer">Firebase Auth Docs</a>
            <a href="https://judge0.com" target="_blank" rel="noopener noreferrer">Judge0 API</a>
            <a href="https://docs.yjs.dev" target="_blank" rel="noopener noreferrer">Yjs CRDTs</a>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span>© 2026 CodeHive. Built with ❤️ using React, Vite, Yjs &amp; Firebase.</span>
        </div>
      </footer>

      {/* ─── STYLES ─── */}
      <style>{`
        /* ── Root reset ── */
        .lp-root {
          font-family: 'Inter', system-ui, sans-serif;
          background: #ffffff;
          color: #111827;
          overflow-x: hidden;
          min-height: 100vh;
        }

        /* ── Navbar ── */
        .lp-nav {
          position: sticky;
          top: 0;
          z-index: 50;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid #f1f5f9;
        }
        .lp-nav-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          height: 68px;
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .lp-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          flex-shrink: 0;
        }
        .lp-logo-hex {
          width: 36px; height: 36px;
          background: linear-gradient(135deg, #e0e7ff, #f3e8ff);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .lp-logo-name {
          font-family: 'Outfit', sans-serif;
          font-size: 1.4rem;
          font-weight: 800;
          color: #111827;
          letter-spacing: -0.03em;
        }
        .lp-logo-accent { color: #6366f1; }

        .lp-nav-links {
          display: flex;
          gap: 28px;
          flex: 1;
          margin-left: 16px;
        }
        .lp-nav-links a {
          text-decoration: none;
          color: #6b7280;
          font-size: 0.9rem;
          font-weight: 500;
          transition: color 0.18s;
        }
        .lp-nav-links a:hover { color: #6366f1; }

        .lp-nav-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-left: auto;
        }

        /* Buttons */
        .lp-btn-primary {
          background: #111827;
          color: #ffffff;
          border: none;
          border-radius: 50px;
          padding: 10px 22px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: transform 0.18s, box-shadow 0.18s, background 0.18s;
        }
        .lp-btn-primary:hover {
          background: #1f2937;
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(17,24,39,0.25);
        }
        .lp-btn-lg {
          padding: 14px 30px;
          font-size: 1rem;
          border-radius: 50px;
        }
        .lp-btn-sm {
          padding: 8px 18px;
          font-size: 0.85rem;
        }

        .lp-btn-ghost {
          background: transparent;
          color: #374151;
          border: 1.5px solid #d1d5db;
          border-radius: 50px;
          padding: 9px 20px;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: border-color 0.18s, color 0.18s;
        }
        .lp-btn-ghost:hover { border-color: #6366f1; color: #6366f1; }

        .lp-btn-outline {
          background: transparent;
          color: #374151;
          border: none;
          padding: 10px 0;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 4px;
          transition: color 0.18s;
        }
        .lp-btn-outline:hover { color: #6366f1; }

        .lp-btn-white {
          background: #ffffff;
          color: #111827;
          border: none;
          border-radius: 50px;
          padding: 14px 30px;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.18s, box-shadow 0.18s;
        }
        .lp-btn-white:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        }
        .lp-btn-ghost-white {
          background: transparent;
          color: rgba(255,255,255,0.85);
          border: 1.5px solid rgba(255,255,255,0.4);
          border-radius: 50px;
          padding: 13px 26px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: border-color 0.18s;
        }
        .lp-btn-ghost-white:hover { border-color: white; color: white; }

        /* Hamburger */
        .lp-hamburger {
          display: none;
          flex-direction: column;
          gap: 5px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          margin-left: auto;
        }
        .lp-hamburger span {
          display: block;
          width: 22px;
          height: 2px;
          background: #374151;
          border-radius: 2px;
        }
        .lp-mobile-menu {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px 24px 20px;
          border-top: 1px solid #f1f5f9;
          background: white;
        }
        .lp-mobile-menu a {
          text-decoration: none;
          color: #374151;
          font-weight: 500;
          font-size: 1rem;
        }

        /* Eyebrow */
        .lp-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #6b7280;
          margin-bottom: 12px;
          font-family: 'Fira Code', monospace;
        }
        .lp-eyebrow-dark { color: #374151; }
        .lp-eyebrow-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #f97316;
          flex-shrink: 0;
        }

        /* ── HERO ── */
        .lp-hero {
          min-height: calc(100vh - 68px);
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 24px 60px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: center;
        }
        .lp-hero-copy {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        .lp-hero-h1 {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(3rem, 5.5vw, 5.2rem);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.04em;
          color: #111827;
          margin-bottom: 20px;
        }
        .lp-h1-accent {
          color: #6366f1;
        }
        .lp-hero-sub {
          font-size: 1.05rem;
          line-height: 1.65;
          color: #6b7280;
          max-width: 480px;
          margin-bottom: 32px;
        }
        .lp-hero-ctas {
          display: flex;
          gap: 16px;
          align-items: center;
          margin-bottom: 36px;
          flex-wrap: wrap;
        }
        .lp-trust {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        .lp-trust-label {
          font-size: 0.75rem;
          color: #9ca3af;
          font-weight: 500;
          margin-right: 4px;
        }
        .lp-lang-badge {
          padding: 3px 10px;
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 700;
        }

        /* Hero visual */
        .lp-hero-visual {
          position: relative;
          height: 520px;
        }
        .lp-hero-blob {
          position: absolute;
          width: 420px; height: 420px;
          border-radius: 50%;
          background: radial-gradient(circle, #e0e7ff 0%, #f3e8ff 60%, transparent 100%);
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
        }

        /* Floating code card */
        .lp-code-card {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          background: #111827;
          border-radius: 16px;
          padding: 20px;
          width: 300px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.25);
          z-index: 10;
        }
        .lp-code-card-dots {
          display: flex; gap: 6px; margin-bottom: 14px;
        }
        .lp-code-card-dots span {
          width: 10px; height: 10px; border-radius: 50%;
        }
        .lp-code-snippet {
          font-family: 'Fira Code', monospace;
          font-size: 0.72rem;
          line-height: 1.7;
          color: #a5b4fc;
          white-space: pre-wrap;
          margin: 0;
        }

        /* Live pill */
        .lp-live-pill {
          position: absolute;
          top: 12%; right: -12px;
          background: white;
          border-radius: 50px;
          padding: 8px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #374151;
          box-shadow: 0 4px 20px rgba(0,0,0,0.12);
          z-index: 20;
        }
        .lp-live-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #10b981;
          animation: lp-pulse-dot 1.5s infinite;
        }
        @keyframes lp-pulse-dot {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.5; transform:scale(1.4); }
        }
        .lp-live-avatars { display:flex; align-items:center; }
        .lp-avatar {
          width:22px; height:22px;
          border-radius:50%;
          border:2px solid white;
        }

        /* Run chip */
        .lp-run-chip {
          position: absolute;
          bottom: 20%; left: -12px;
          background: #111827;
          color: #10b981;
          border-radius: 50px;
          padding: 8px 14px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.78rem;
          font-weight: 600;
          box-shadow: 0 4px 20px rgba(0,0,0,0.2);
          z-index: 20;
        }
        .lp-run-icon { font-size: 0.7rem; }

        /* ── STATS BAR ── */
        .lp-stats-bar {
          background: #111827;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0;
          padding: 32px 24px;
          flex-wrap: wrap;
        }
        .lp-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 0 48px;
        }
        .lp-stat-num {
          font-family: 'Outfit', sans-serif;
          font-size: 2.2rem;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.03em;
        }
        .lp-stat-label {
          font-size: 0.75rem;
          color: #9ca3af;
          font-weight: 500;
          text-align: center;
        }
        .lp-stat-divider {
          width: 1px; height: 48px;
          background: rgba(255,255,255,0.1);
        }

        /* ── SECTIONS ── */
        .lp-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 100px 24px;
          position: relative;
        }
        .lp-section-header {
          text-align: center;
          margin-bottom: 64px;
        }
        .lp-section-h2 {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(2rem, 3.5vw, 3rem);
          font-weight: 800;
          line-height: 1.12;
          letter-spacing: -0.03em;
          color: #111827;
          margin-bottom: 16px;
        }
        .lp-lang-h2 { text-align: left; }
        .lp-section-sub {
          font-size: 1.05rem;
          color: #6b7280;
          line-height: 1.65;
          max-width: 540px;
          margin: 0 auto;
        }
        .lp-underline-accent {
          text-decoration: underline;
          text-decoration-color: #f97316;
          text-underline-offset: 6px;
          text-decoration-thickness: 3px;
        }
        .lp-underline-accent-green {
          text-decoration: underline;
          text-decoration-color: #10b981;
          text-underline-offset: 6px;
          text-decoration-thickness: 3px;
        }

        /* ── FEATURES ── */
        .lp-feature-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .lp-feature-card {
          background: #f9fafb;
          border: 1px solid #f1f5f9;
          border-radius: 20px;
          padding: 32px 28px;
          position: relative;
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
        }
        .lp-feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.1);
          border-color: #e0e7ff;
        }
        .lp-feature-card-wide {
          grid-column: span 3;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: center;
        }
        .lp-feature-icon {
          width: 52px; height: 52px;
          border-radius: 14px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem;
          margin-bottom: 18px;
        }
        .lp-feature-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 10px;
        }
        .lp-feature-desc {
          font-size: 0.9rem;
          line-height: 1.65;
          color: #6b7280;
        }
        .lp-feature-desc code {
          background: #f3f4f6;
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 0.82rem;
          color: #6366f1;
          font-family: 'Fira Code', monospace;
        }
        .lp-feature-corner {
          position: absolute;
          bottom: -20px; right: -20px;
          width: 80px; height: 80px;
          border-radius: 50%;
          opacity: 0.5;
        }
        .lp-feature-wide-right {
          position: relative;
          height: 180px;
        }
        .lp-mini-terminal {
          position: absolute;
          top: 50%; right: 0;
          transform: translateY(-50%);
          background: #111827;
          border-radius: 12px;
          padding: 14px 18px;
          width: 220px;
          display: flex;
          flex-direction: column;
          gap: 5px;
          z-index: 10;
        }
        .lp-mini-terminal-bar {
          display: flex; gap: 5px; margin-bottom: 8px;
        }
        .lp-mini-terminal-bar span {
          width:8px; height:8px; border-radius:50%; background:#ef4444;
        }

        /* ── LANGUAGES ── */
        .lp-lang-section { background: #f9fafb; border-radius: 32px; }
        .lp-lang-inner {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }
        .lp-lang-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .lp-lang-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 20px 12px;
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          cursor: pointer;
          transition: transform 0.18s, box-shadow 0.18s;
          animation: lp-fadeUp 0.5s ease both;
        }
        .lp-lang-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        }
        @keyframes lp-fadeUp {
          from { opacity:0; transform:translateY(20px); }
          to { opacity:1; transform:translateY(0); }
        }
        .lp-lang-circle {
          width: 52px; height: 52px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .lp-lang-name {
          font-size: 0.78rem;
          font-weight: 700;
          color: #374151;
          text-align: center;
        }

        /* ── SECURITY ── */
        .lp-security-section {
          background: #fafafa;
          border-radius: 32px;
          position: relative;
          overflow: hidden;
        }
        .lp-security-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        .lp-security-card {
          background: white;
          border: 1px solid #f1f5f9;
          border-radius: 16px;
          padding: 28px 24px;
          transition: transform 0.18s, box-shadow 0.18s;
        }
        .lp-security-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
        }
        .lp-security-icon {
          font-size: 1.8rem;
          margin-bottom: 12px;
        }
        .lp-security-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: #111827;
          margin-bottom: 8px;
        }
        .lp-security-desc {
          font-size: 0.86rem;
          line-height: 1.6;
          color: #6b7280;
        }

        /* ── CTA BANNER ── */
        .lp-cta-banner {
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
          padding: 100px 24px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .lp-cta-h2 {
          font-family: 'Outfit', sans-serif;
          font-size: clamp(2.5rem, 4.5vw, 4rem);
          font-weight: 800;
          letter-spacing: -0.04em;
          color: white;
          line-height: 1.1;
          margin-bottom: 16px;
        }
        .lp-cta-sub {
          font-size: 1rem;
          color: rgba(255,255,255,0.8);
          max-width: 480px;
          margin: 0 auto 36px;
          line-height: 1.65;
        }
        .lp-cta-btns {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }

        /* ── FOOTER ── */
        .lp-footer {
          background: #111827;
          color: #9ca3af;
          padding: 60px 24px 0;
        }
        .lp-footer-inner {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: 48px;
          padding-bottom: 48px;
          border-bottom: 1px solid rgba(255,255,255,0.07);
        }
        .lp-footer-brand .lp-logo-name { color: white; }
        .lp-footer-tagline {
          font-size: 0.88rem;
          line-height: 1.6;
          margin-top: 12px;
          max-width: 280px;
        }
        .lp-footer-links {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .lp-footer-link-group-title {
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: white;
          margin-bottom: 4px;
        }
        .lp-footer-links a {
          color: #9ca3af;
          text-decoration: none;
          font-size: 0.88rem;
          transition: color 0.18s;
        }
        .lp-footer-links a:hover { color: white; }
        .lp-footer-bottom {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px 0;
          font-size: 0.82rem;
          text-align: center;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .lp-hero { grid-template-columns: 1fr; min-height: auto; padding-top: 60px; }
          .lp-hero-visual { display: none; }
          .lp-feature-grid { grid-template-columns: 1fr; }
          .lp-feature-card-wide { grid-column: span 1; grid-template-columns: 1fr; }
          .lp-feature-wide-right { display: none; }
          .lp-lang-inner { grid-template-columns: 1fr; }
          .lp-lang-grid { grid-template-columns: repeat(3, 1fr); }
          .lp-security-grid { grid-template-columns: 1fr 1fr; }
          .lp-footer-inner { grid-template-columns: 1fr 1fr; }
          .lp-nav-links { display: none; }
          .lp-nav-actions { display: none; }
          .lp-hamburger { display: flex; }
          .lp-stat { padding: 0 24px; }
        }
        @media (max-width: 600px) {
          .lp-security-grid { grid-template-columns: 1fr; }
          .lp-footer-inner { grid-template-columns: 1fr; }
          .lp-lang-grid { grid-template-columns: repeat(2, 1fr); }
          .lp-stats-bar { gap: 16px; }
          .lp-stat-divider { display: none; }
          .lp-stat { padding: 8px 12px; }
        }
      `}</style>
    </div>
  );
};
