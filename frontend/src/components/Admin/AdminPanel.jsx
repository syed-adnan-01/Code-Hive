import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Globe,
  Users,
  BarChart3,
  ScrollText,
  Search,
  CheckCircle,
  XCircle,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  X,
  AlertTriangle,
  Lock,
  Unlock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  fetchAdminLanguages,
  updateLanguageStatus,
  fetchAdminUsers,
  disableUser,
  enableUser,
  setUserAdminRole,
  fetchAdminStats,
  fetchAdminLogs,
} from '../../services/adminService';

export const AdminPanel = ({ onClose }) => {
  const { currentUser } = useAuth();
  const { isDark } = useTheme();

  const [activeTab, setActiveTab] = useState('languages'); // 'languages' | 'users' | 'stats' | 'logs'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Data states
  const [languages, setLanguages] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);

  const getIdToken = async () => {
    if (!currentUser) return 'demo-admin-token';
    return currentUser.isDemo ? 'demo-admin-token' : await currentUser.getIdToken();
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // 1. Load Languages
  const loadLanguages = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getIdToken();
      const list = await fetchAdminLanguages(token);
      setLanguages(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Load Users
  const loadUsers = async (search = '') => {
    setLoading(true);
    setError(null);
    try {
      const token = await getIdToken();
      const list = await fetchAdminUsers(search, token);
      setUsers(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Load Stats
  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getIdToken();
      const s = await fetchAdminStats(token);
      setStats(s);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Load Logs
  const loadLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getIdToken();
      const l = await fetchAdminLogs(token);
      setLogs(l);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Switch tabs & fetch
  useEffect(() => {
    if (activeTab === 'languages') loadLanguages();
    else if (activeTab === 'users') loadUsers(userSearch);
    else if (activeTab === 'stats') loadStats();
    else if (activeTab === 'logs') loadLogs();
  }, [activeTab]);

  // Handle Toggle Language
  const handleToggleLanguage = async (lang) => {
    const nextStatus = !lang.enabled;
    try {
      const token = await getIdToken();
      const updated = await updateLanguageStatus(lang.id, nextStatus, token);
      setLanguages((prev) =>
        prev.map((l) => (l.id === lang.id ? { ...l, enabled: updated.enabled } : l))
      );
      showToast(`${lang.name} is now ${nextStatus ? 'ENABLED' : 'DISABLED'}`);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle Disable / Enable User
  const handleToggleUserDisabled = async (user) => {
    const targetStatus = !user.disabled;
    try {
      const token = await getIdToken();
      if (targetStatus) {
        await disableUser(user.uid, token);
        showToast(`User ${user.displayName || user.uid} disabled and tokens revoked.`);
      } else {
        await enableUser(user.uid, token);
        showToast(`User ${user.displayName || user.uid} re-enabled.`);
      }
      setUsers((prev) =>
        prev.map((u) => (u.uid === user.uid ? { ...u, disabled: targetStatus } : u))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle Toggle Admin Claim
  const handleToggleAdminRole = async (user) => {
    const nextAdmin = !user.admin;
    try {
      const token = await getIdToken();
      await setUserAdminRole(user.uid, nextAdmin, token);
      showToast(`Admin privileges ${nextAdmin ? 'granted to' : 'revoked from'} ${user.displayName || user.uid}`);
      setUsers((prev) =>
        prev.map((u) => (u.uid === user.uid ? { ...u, admin: nextAdmin } : u))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={`admin-modal-overlay ${isDark ? 'dark' : 'light'}`}>
      <div className="admin-modal-card">
        {/* Header */}
        <div className="admin-modal-header">
          <div className="admin-header-title">
            <div className="admin-icon-pill">
              <ShieldCheck size={20} className="text-indigo" />
            </div>
            <div>
              <div className="admin-title-row">
                <h2 className="admin-heading font-brand">CodeHive Administration Console</h2>
                <span className="admin-badge-live">ADMIN PRIVILEGES ENFORCED</span>
              </div>
              <p className="admin-subheading">Manage compilers, accounts, platform statistics, and audit security</p>
            </div>
          </div>

          <button className="btn-close-admin" onClick={onClose} title="Close Console">
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="admin-tabs-bar">
          <button
            className={`admin-tab-btn ${activeTab === 'languages' ? 'active' : ''}`}
            onClick={() => setActiveTab('languages')}
          >
            <Globe size={16} />
            <span>Languages & Compilers</span>
            <span className="tab-count-pill">{languages.length || 7}</span>
          </button>

          <button
            className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} />
            <span>User Accounts</span>
            <span className="tab-count-pill">{users.length || 3}</span>
          </button>

          <button
            className={`admin-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <BarChart3 size={16} />
            <span>Platform Stats</span>
          </button>

          <button
            className={`admin-tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <ScrollText size={16} />
            <span>Audit Trail</span>
            <span className="tab-count-pill">{logs.length}</span>
          </button>
        </div>

        {/* Feedback Alert Banners */}
        {error && (
          <div className="admin-alert-banner alert-error">
            <AlertTriangle size={16} />
            <span>{error}</span>
            <button className="btn-dismiss" onClick={() => setError(null)}>✕</button>
          </div>
        )}

        {toastMessage && (
          <div className="admin-alert-banner alert-success">
            <CheckCircle size={16} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab Contents */}
        <div className="admin-tab-content">
          {/* TAB 1: LANGUAGES */}
          {activeTab === 'languages' && (
            <div className="admin-section">
              <div className="admin-section-header">
                <div>
                  <h3 className="section-title">Supported Compilers & Runtimes</h3>
                  <p className="section-desc">
                    Toggling a language off hides it from the IDE dropdown and blocks <code>POST /api/run</code> execution attempts.
                  </p>
                </div>
                <button className="btn-admin-refresh" onClick={loadLanguages} disabled={loading}>
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Judge0 ID</th>
                      <th>Language / Runtime</th>
                      <th>File Extension</th>
                      <th>Availability Status</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {languages.map((lang) => (
                      <tr key={lang.id} className={lang.enabled === false ? 'row-disabled' : ''}>
                        <td className="font-code font-bold">#{lang.id}</td>
                        <td>
                          <div className="lang-name-cell">
                            <span className="lang-indicator-dot" style={{ backgroundColor: lang.badgeColor || '#6366f1' }} />
                            <span className="font-semibold">{lang.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="ext-badge font-code">.{lang.extension || 'txt'}</span>
                        </td>
                        <td>
                          {lang.enabled !== false ? (
                            <span className="badge-status-online">
                              <CheckCircle size={13} />
                              <span>Active / Enabled</span>
                            </span>
                          ) : (
                            <span className="badge-status-disabled">
                              <XCircle size={13} />
                              <span>Disabled by Admin</span>
                            </span>
                          )}
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            className={`btn-toggle-lang ${lang.enabled !== false ? 'btn-danger' : 'btn-success'}`}
                            onClick={() => handleToggleLanguage(lang)}
                          >
                            {lang.enabled !== false ? (
                              <>
                                <Lock size={13} />
                                <span>Disable</span>
                              </>
                            ) : (
                              <>
                                <Unlock size={13} />
                                <span>Enable</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: USERS */}
          {activeTab === 'users' && (
            <div className="admin-section">
              <div className="admin-section-header">
                <div>
                  <h3 className="section-title">User Account Governance</h3>
                  <p className="section-desc">
                    Disabling a user revokes their refresh tokens immediately, blocking room entry, code execution, and chat.
                  </p>
                </div>
                <div className="search-bar-wrapper">
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    className="admin-search-input"
                    placeholder="Search by name, email or UID..."
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      loadUsers(e.target.value);
                    }}
                  />
                </div>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Account Status</th>
                      <th className="text-right">Access Controls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.uid} className={u.disabled ? 'row-disabled' : ''}>
                        <td>
                          <div className="user-profile-cell">
                            <div className="user-avatar-small font-brand">
                              {u.displayName ? u.displayName[0].toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div className="font-semibold">{u.displayName || 'Developer'}</div>
                              <div className="user-uid-sub font-code">{u.uid}</div>
                            </div>
                          </div>
                        </td>
                        <td className="font-code text-sm">{u.email}</td>
                        <td>
                          {u.admin ? (
                            <span className="badge-role-admin">
                              <ShieldCheck size={12} />
                              <span>Administrator</span>
                            </span>
                          ) : (
                            <span className="badge-role-user">Developer</span>
                          )}
                        </td>
                        <td>
                          {u.disabled ? (
                            <span className="badge-status-disabled">
                              <Lock size={12} />
                              <span>Revoked / Disabled</span>
                            </span>
                          ) : (
                            <span className="badge-status-online">
                              <CheckCircle size={12} />
                              <span>Active</span>
                            </span>
                          )}
                        </td>
                        <td className="text-right">
                          <div className="user-actions-row">
                            <button
                              type="button"
                              className={`btn-action-small ${u.disabled ? 'btn-success' : 'btn-danger'}`}
                              onClick={() => handleToggleUserDisabled(u)}
                            >
                              {u.disabled ? 'Enable User' : 'Disable & Revoke'}
                            </button>

                            <button
                              type="button"
                              className="btn-action-small btn-secondary"
                              onClick={() => handleToggleAdminRole(u)}
                            >
                              {u.admin ? 'Revoke Admin' : 'Make Admin'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: PLATFORM STATS */}
          {activeTab === 'stats' && stats && (
            <div className="admin-section">
              <div className="stats-kpi-grid">
                <div className="stat-card">
                  <div className="stat-label">TOTAL REGISTERED USERS</div>
                  <div className="stat-value font-brand">{stats.totalUsers}</div>
                  <div className="stat-sub font-code">
                    <span className="text-emerald">{stats.activeUsers} Active</span> •{' '}
                    <span className="text-red">{stats.disabledUsers} Disabled</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">CODE RUNS TODAY</div>
                  <div className="stat-value font-brand text-indigo">{stats.runsToday}</div>
                  <div className="stat-sub font-code">{stats.runsThisWeek} executions this week</div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">ACTIVE COLLAB ROOMS</div>
                  <div className="stat-value font-brand text-cyan">{stats.activeRooms}</div>
                  <div className="stat-sub font-code">Live Hocuspocus WebSockets</div>
                </div>
              </div>

              <div className="admin-stats-breakdown">
                <h4 className="breakdown-title">Top Executed Languages</h4>
                <div className="languages-breakdown-list">
                  {stats.topLanguages?.map((item, idx) => (
                    <div key={idx} className="lang-bar-row">
                      <div className="lang-bar-info font-code">
                        <span>{item.name}</span>
                        <span>{item.percentage}% ({item.count} runs)</span>
                      </div>
                      <div className="lang-progress-track">
                        <div
                          className="lang-progress-fill"
                          style={{
                            width: `${item.percentage}%`,
                            background:
                              idx === 0
                                ? 'linear-gradient(90deg, #6366f1, #06b6d4)'
                                : idx === 1
                                ? 'linear-gradient(90deg, #f59e0b, #eab308)'
                                : idx === 2
                                ? 'linear-gradient(90deg, #3b82f6, #60a5fa)'
                                : 'linear-gradient(90deg, #ef4444, #f87171)',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AUDIT LOGS */}
          {activeTab === 'logs' && (
            <div className="admin-section">
              <div className="admin-section-header">
                <div>
                  <h3 className="section-title">Security & Governance Audit Trail</h3>
                  <p className="section-desc">
                    Immutable event log of administrator interventions, role changes, and language status updates.
                  </p>
                </div>
                <button className="btn-admin-refresh" onClick={loadLogs} disabled={loading}>
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  <span>Refresh Logs</span>
                </button>
              </div>

              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Timestamp</th>
                      <th>Action</th>
                      <th>Target</th>
                      <th>Admin UID</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length > 0 ? (
                      logs.map((log, idx) => (
                        <tr key={log.id || idx}>
                          <td className="font-code text-xs text-muted">
                            {new Date(log.timestamp || log.createdAt).toLocaleTimeString()}
                          </td>
                          <td>
                            <span className="log-action-pill font-code">{log.action}</span>
                          </td>
                          <td className="font-semibold">{log.target}</td>
                          <td className="font-code text-xs">{log.adminUid}</td>
                          <td className="text-sm">{log.details}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="empty-table-cell">No admin actions recorded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .admin-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }
        .admin-modal-card {
          width: 100%;
          max-width: 960px;
          max-height: 90vh;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        .admin-modal-overlay.dark .admin-modal-card {
          background: #0f172a;
          border-color: rgba(255, 255, 255, 0.1);
          color: #f8fafc;
        }
        .admin-modal-header {
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #e2e8f0;
        }
        .admin-modal-overlay.dark .admin-modal-header {
          border-bottom-color: rgba(255, 255, 255, 0.08);
        }
        .admin-header-title {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .admin-icon-pill {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: rgba(99, 102, 241, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .admin-title-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .admin-heading {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
          letter-spacing: -0.01em;
        }
        .admin-badge-live {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 9999px;
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          letter-spacing: 0.05em;
        }
        .admin-subheading {
          font-size: 0.85rem;
          color: #64748b;
          margin: 2px 0 0 0;
        }
        .btn-close-admin {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.15s;
        }
        .btn-close-admin:hover {
          background: rgba(0, 0, 0, 0.05);
          color: #0f172a;
        }
        .admin-modal-overlay.dark .btn-close-admin:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #f8fafc;
        }
        .admin-tabs-bar {
          display: flex;
          padding: 0 24px;
          border-bottom: 1px solid #e2e8f0;
          background: #f8fafc;
          gap: 8px;
        }
        .admin-modal-overlay.dark .admin-tabs-bar {
          background: #090d16;
          border-bottom-color: rgba(255, 255, 255, 0.08);
        }
        .admin-tab-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 16px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: #64748b;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .admin-tab-btn:hover {
          color: #6366f1;
        }
        .admin-tab-btn.active {
          color: #6366f1;
          border-bottom-color: #6366f1;
        }
        .tab-count-pill {
          font-size: 0.7rem;
          padding: 2px 6px;
          border-radius: 9999px;
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
        }
        .admin-alert-banner {
          margin: 16px 24px 0 24px;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .alert-error {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fecaca;
        }
        .admin-modal-overlay.dark .alert-error {
          background: rgba(220, 38, 38, 0.15);
          color: #f87171;
          border-color: rgba(220, 38, 38, 0.3);
        }
        .alert-success {
          background: #ecfdf5;
          color: #059669;
          border: 1px solid #a7f3d0;
        }
        .admin-modal-overlay.dark .alert-success {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          border-color: rgba(16, 185, 129, 0.3);
        }
        .admin-tab-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }
        .admin-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
        }
        .section-title {
          font-size: 1.05rem;
          font-weight: 700;
          margin: 0;
        }
        .section-desc {
          font-size: 0.83rem;
          color: #64748b;
          margin: 3px 0 0 0;
        }
        .btn-admin-refresh {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 12px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: transparent;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          color: inherit;
        }
        .admin-table-container {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
        }
        .admin-modal-overlay.dark .admin-table-container {
          border-color: rgba(255, 255, 255, 0.08);
        }
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.88rem;
          text-align: left;
        }
        .admin-table th {
          background: #f8fafc;
          padding: 12px 16px;
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          border-bottom: 1px solid #e2e8f0;
        }
        .admin-modal-overlay.dark .admin-table th {
          background: #0b1120;
          border-bottom-color: rgba(255, 255, 255, 0.08);
          color: #94a3b8;
        }
        .admin-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
        }
        .admin-modal-overlay.dark .admin-table td {
          border-bottom-color: rgba(255, 255, 255, 0.05);
        }
        .row-disabled {
          opacity: 0.6;
        }
        .lang-name-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .lang-indicator-dot {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }
        .ext-badge {
          background: rgba(99, 102, 241, 0.1);
          color: #6366f1;
          padding: 2px 7px;
          border-radius: 6px;
          font-size: 0.78rem;
        }
        .badge-status-online {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 9px;
          border-radius: 9999px;
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          font-size: 0.76rem;
          font-weight: 600;
        }
        .badge-status-disabled {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 3px 9px;
          border-radius: 9999px;
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          font-size: 0.76rem;
          font-weight: 600;
        }
        .btn-toggle-lang, .btn-action-small {
          padding: 5px 12px;
          border-radius: 6px;
          border: none;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          transition: all 0.15s;
        }
        .btn-danger {
          background: rgba(239, 68, 68, 0.12);
          color: #ef4444;
        }
        .btn-danger:hover {
          background: #ef4444;
          color: #ffffff;
        }
        .btn-success {
          background: rgba(16, 185, 129, 0.12);
          color: #10b981;
        }
        .btn-success:hover {
          background: #10b981;
          color: #ffffff;
        }
        .btn-secondary {
          background: rgba(99, 102, 241, 0.12);
          color: #6366f1;
        }
        .btn-secondary:hover {
          background: #6366f1;
          color: #ffffff;
        }
        .search-bar-wrapper {
          position: relative;
          width: 280px;
        }
        .search-icon {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }
        .admin-search-input {
          width: 100%;
          padding: 7px 10px 7px 32px;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: transparent;
          font-size: 0.82rem;
          color: inherit;
        }
        .user-profile-cell {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .user-avatar-small {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #6366f1, #3b82f6);
          color: white;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
        }
        .user-uid-sub {
          font-size: 0.7rem;
          color: #94a3b8;
        }
        .badge-role-admin {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(99, 102, 241, 0.15);
          color: #6366f1;
          font-size: 0.74rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 6px;
        }
        .badge-role-user {
          font-size: 0.78rem;
          color: #64748b;
        }
        .user-actions-row {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
        .stats-kpi-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        .stat-card {
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .admin-modal-overlay.dark .stat-card {
          background: #090d16;
          border-color: rgba(255, 255, 255, 0.08);
        }
        .stat-label {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #64748b;
          margin-bottom: 6px;
        }
        .stat-value {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 6px;
        }
        .stat-sub {
          font-size: 0.75rem;
          color: #64748b;
        }
        .admin-stats-breakdown {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
        }
        .admin-modal-overlay.dark .admin-stats-breakdown {
          border-color: rgba(255, 255, 255, 0.08);
        }
        .breakdown-title {
          font-size: 0.95rem;
          font-weight: 700;
          margin: 0 0 16px 0;
        }
        .languages-breakdown-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .lang-bar-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          margin-bottom: 6px;
        }
        .lang-progress-track {
          height: 8px;
          background: #e2e8f0;
          border-radius: 9999px;
          overflow: hidden;
        }
        .admin-modal-overlay.dark .lang-progress-track {
          background: rgba(255, 255, 255, 0.08);
        }
        .lang-progress-fill {
          height: 100%;
          border-radius: 9999px;
          transition: width 0.3s ease;
        }
        .log-action-pill {
          background: rgba(99, 102, 241, 0.12);
          color: #6366f1;
          padding: 2px 7px;
          border-radius: 5px;
          font-size: 0.72rem;
          font-weight: 700;
        }
        .empty-table-cell {
          text-align: center;
          padding: 30px;
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
};
