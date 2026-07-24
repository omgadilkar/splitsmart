import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../AuthContext';

export default function Dashboard() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/groups');
      setGroups(data.groups);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Your groups</h1>
          <p className="page-sub">Signed in as {user?.name}</p>
        </div>
        <button className="btn btn-sage" onClick={() => setShowModal(true)}>+ New group</button>
      </div>

      {loading ? (
        <p className="loading-text">Loading groups…</p>
      ) : groups.length === 0 ? (
        <div className="empty-state">
          <p>No groups yet. Create one for a trip, flat, or friend circle to start splitting expenses.</p>
        </div>
      ) : (
        <div className="group-grid">
          {groups.map((g) => (
            <Link to={`/groups/${g._id}`} className="group-card" key={g._id}>
              <p className="group-card-name">{g.name}</p>
              <p className="group-card-meta">{g.members.length} member{g.members.length !== 1 ? 's' : ''}</p>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <CreateGroupModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            fetchGroups();
          }}
        />
      )}
    </div>
  );
}

function CreateGroupModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [members, setMembers] = useState([]); // { id, name, email }
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const addMember = async () => {
    setError('');
    if (!memberEmail.trim()) return;
    try {
      const { data } = await api.get(`/auth/search?email=${encodeURIComponent(memberEmail.trim())}`);
      if (members.some((m) => m.id === data.user._id)) {
        setError('That person is already added.');
        return;
      }
      setMembers([...members, { id: data.user._id, name: data.user.name, email: data.user.email }]);
      setMemberEmail('');
    } catch (err) {
      setError(err.response?.data?.message || 'User not found');
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
      setError(err.response?.data?.message || 'Could not create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">New group</h2>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Group name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Goa Trip 2026" required />
          </div>

          <div className="field">
            <label>Add members by email</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                placeholder="friend@example.com"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addMember();
                  }
                }}
              />
              <button type="button" className="btn btn-outline" onClick={addMember}>Add</button>
            </div>
          </div>

          {members.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              {members.map((m) => (
                <div key={m.id} className="split-row">
                  <span>{m.name} ({m.email})</span>
                  <button type="button" className="btn-danger-text" onClick={() => removeMember(m.id)}>Remove</button>
                </div>
              ))}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-sage" disabled={loading}>
              {loading ? 'Creating…' : 'Create group'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
