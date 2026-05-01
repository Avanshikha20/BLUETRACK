import React, { useEffect, useState } from 'react';
import api from '../../services/api';

/**
 * AdminUsersPage
 *
 * Calls GET /gateway/identity/users (Ocelot → IdentityService /users)
 * No AdminService proxy in the middle — simpler and more reliable.
 */
const AdminUsersPage = () => {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [filter, setFilter]   = useState('');

  useEffect(() => {
    api
      .get('/gateway/identity/users')
      .then((r) => { setUsers(r.data ?? []); setError(''); })
      .catch((err) => {
        const status = err?.response?.status;
        if (status === 404) {
          setError('Route not found. Restart the ApiGateway (dotnet run in src/backend/ApiGateway) to apply the updated ocelot.json.');
        } else if (status === 401 || status === 403) {
          setError('Access denied. Make sure you are logged in as Admin.');
        } else {
          setError(`Could not reach IdentityService (HTTP ${status ?? 'network error'}). Ensure all services are running.`);
        }
        setUsers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(
    (u) =>
      u.email?.toLowerCase().includes(filter.toLowerCase()) ||
      u.role?.toLowerCase().includes(filter.toLowerCase()) ||
      u.id?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <h2 style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#c7d2fe', marginBottom: '0.4rem', fontSize: '1.25rem' }}>
        User Management
      </h2>
      <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        All registered accounts from the Identity Service.
      </p>

      {/* Error banner */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.07)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 12,
          padding: '0.9rem 1.2rem',
          marginBottom: '1.4rem',
        }}>
          <div style={{ fontWeight: 700, color: '#f87171', marginBottom: '0.3rem', fontSize: '0.88rem' }}>
            ⚠️ {error}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <div>1. Stop all running backend services</div>
            <div>2. Restart them: <code style={{ color: '#818cf8' }}>dotnet run</code> in each of: <code style={{ color: '#818cf8' }}>ApiGateway</code>, <code style={{ color: '#818cf8' }}>IdentityService</code></div>
            <div>3. Refresh this page</div>
          </div>
        </div>
      )}

      <div className="adm-section">
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            className="adm-input"
            style={{ maxWidth: 300 }}
            placeholder="🔍  Search by email or role…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          {!loading && !error && (
            <span style={{ color: '#475569', fontSize: '0.82rem' }}>
              {filtered.length} user{filtered.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', color: '#64748b' }}>
            <div className="adm-spinner" /> Loading users…
          </div>
        ) : !error && filtered.length === 0 ? (
          <div className="adm-empty"><span>👤</span>No users found.</div>
        ) : !error ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="adm-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>User ID</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id}>
                    <td style={{ color: '#475569', fontSize: '0.78rem' }}>{i + 1}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#818cf8' }}>
                      {u.id?.slice(0, 14)}…
                    </td>
                    <td style={{ color: '#e2e8f0' }}>{u.email}</td>
                    <td>
                      <span
                        className="adm-status"
                        style={
                          u.role === 'Admin'
                            ? { background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }
                            : { background: 'rgba(148,163,184,0.1)', color: '#94a3b8' }
                        }
                      >
                        {u.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default AdminUsersPage;
