import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';
import { useToast } from '../ToastContext';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { addToast } = useToast();

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/groups/dashboard');
      setData(response.data);
    } catch (err) {
      console.error(err);
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="page">
        <div className="skeleton" style={{ height: '80px', marginBottom: '32px' }}></div>
        <div className="skeleton" style={{ height: '120px', marginBottom: '32px' }}></div>
        <div className="skeleton" style={{ height: '200px' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="error-banner">{error}</div>
        <button className="btn btn-primary" onClick={fetchDashboardData}>Try again</button>
      </div>
    );
  }

  const { summary, groups, recentActivity } = data;
  const netPosition = summary.youAreOwed - summary.youOwe;

  return (
    <div className="page">
      <div className="page-header" style={{ marginBottom: '2.5rem' }}>
        <div>
          <h1 className="page-title">Good morning, {user?.name.split(' ')[0]}</h1>
          <p className="page-sub">Here's your shared spending snapshot.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          New group
        </button>
      </div>

      <div className="stat-grid" style={{ marginBottom: '3rem' }}>
        <div className="stat-card">
          <div className="stat-label">You owe</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>₹{summary.youOwe.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">You're owed</div>
          <div className="stat-value" style={{ color: 'var(--positive)' }}>₹{summary.youAreOwed.toFixed(2)}</div>
        </div>
        <div className="stat-card" style={{ background: 'var(--bg-color)' }}>
          <div className="stat-label">Net position</div>
          <div className="stat-value">
            {netPosition > 0.01 ? '+' : ''}₹{netPosition.toFixed(2)}
          </div>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="empty-state">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.5rem', color: 'var(--text-primary)' }}>Your shared expenses start here</h3>
          <p style={{ margin: '0 0 1.5rem', color: 'var(--text-secondary)' }}>Create a group for trips, roommates, or dinners to split costs easily.</p>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create your first group</button>
        </div>
      ) : (
        <div className="dashboard-content" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem' }}>
          
          <div style={{ flex: '1 1 60%' }}>
            <h2 className="section-title" style={{ marginBottom: '1.25rem' }}>Your groups</h2>
            <div className="group-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
              {groups.map((g) => (
                <Link to={`/groups/${g._id}`} className="group-card" key={g._id} style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div>
                      <h3 className="group-card-name">{g.name}</h3>
                      <p className="group-card-meta">{g.members.length} members</p>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: 'auto', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {g.userBalance > 0.01 ? (
                      <div>
                        <span className="small-text" style={{ display: 'block', marginBottom: '2px' }}>You're owed</span>
                        <div className="financial-number" style={{ color: 'var(--positive)', fontSize: '1.125rem' }}>₹{g.userBalance.toFixed(2)}</div>
                      </div>
                    ) : g.userBalance < -0.01 ? (
                      <div>
                        <span className="small-text" style={{ display: 'block', marginBottom: '2px' }}>You owe</span>
                        <div className="financial-number" style={{ color: 'var(--danger)', fontSize: '1.125rem' }}>₹{Math.abs(g.userBalance).toFixed(2)}</div>
                      </div>
                    ) : (
                      <div>
                        <span className="small-text" style={{ display: 'block', marginBottom: '2px' }}>Settled</span>
                        <div className="financial-number" style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>₹0.00</div>
                      </div>
                    )}
                    <span style={{ fontSize: '0.875rem', color: 'var(--accent)', fontWeight: 500 }}>View →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {recentActivity && recentActivity.length > 0 && (
            <div style={{ flex: '1 1 30%', minWidth: '280px' }}>
              <h2 className="section-title" style={{ marginBottom: '1.25rem' }}>Recent activity</h2>
              <div className="expense-list">
                {recentActivity.map(act => (
                  <div className="expense-row" key={act._id} style={{ padding: '1rem' }}>
                    <div className="expense-main">
                      <span className="expense-desc">{act.description}</span>
                      <span className="expense-meta">
                        Paid by {act.paidBy} • <strong>{act.groupName}</strong>
                      </span>
                    </div>
                    <div className="expense-amount" style={{ fontSize: '0.875rem' }}>
                      ₹{act.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {showModal && (
        <CreateGroupModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            addToast('Group created successfully!');
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
}

function CreateGroupModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const addMember = async (e) => {
    if (e) e.preventDefault();
    setError('');
    const emailToSearch = memberEmail.trim();
    if (!emailToSearch) return;
    
    setSearching(true);
    try {
      const { data } = await api.get(`/auth/search?email=${encodeURIComponent(emailToSearch)}`);
      if (members.some((m) => m.id === data.user._id)) {
        setError('That person is already added.');
        return;
      }
      setMembers([...members, { id: data.user._id, name: data.user.name, email: data.user.email }]);
      setMemberEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'User not found');
    } finally {
      setSearching(false);
    }
  };

  const removeMember = (id) => setMembers(members.filter((m) => m.id !== id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Group name is required');
      return;
    }
    setLoading(true);
    try {
      await api.post('/groups', { name, memberIds: members.map((m) => m.id) });
      onCreated();
    } catch (err) {
      setError('Something went wrong.');
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="create-group-title">
        <h2 id="create-group-title" className="modal-title">New group</h2>

        {error && <div className="error-banner" role="alert">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="groupName">Group name</label>
            <input 
              id="groupName"
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g. Goa Trip 2026" 
              required 
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="field">
            <label htmlFor="addMember">Add members by email</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                id="addMember"
                type="email"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                placeholder="friend@example.com"
                disabled={loading || searching}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addMember();
                  }
                }}
              />
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => addMember()}
                disabled={loading || searching || !memberEmail.trim()}
              >
                {searching ? 'Finding...' : 'Add'}
              </button>
            </div>
          </div>

          {members.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Group members</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {members.map((m) => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-color)', padding: '0.25rem 0.5rem 0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.875rem', border: '1px solid var(--border-color)' }}>
                    <span>{m.name}</span>
                    <button 
                      type="button" 
                      onClick={() => removeMember(m.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', padding: '0.25rem', cursor: 'pointer', borderRadius: '50%' }}
                      aria-label={`Remove ${m.name}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !name.trim()}>
              {loading ? 'Creating…' : 'Create group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
