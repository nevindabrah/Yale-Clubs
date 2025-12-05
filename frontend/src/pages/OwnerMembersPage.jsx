import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function OwnerTabs({ current }) {
  return (
    <div className="owner-tabs">
      <Link to="/owner/dashboard" className={current === 'dashboard' ? 'active' : ''}>
        Dashboard
      </Link>
      <Link to="/owner/club" className={current === 'club' ? 'active' : ''}>
        Edit Club Details
      </Link>
      <Link to="/owner/applications" className={current === 'applications' ? 'active' : ''}>
        Manage Applications
      </Link>
      <Link to="/owner/events" className={current === 'events' ? 'active' : ''}>
        Meetings &amp; Events
      </Link>
      <Link to="/owner/members" className={current === 'members' ? 'active' : ''}>
        Members
      </Link>
    </div>
  );
}

export default function OwnerMembersPage() {
  const [clubs, setClubs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [club, setClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadClubs = () =>
    api.get('/owner/clubs').then(res => {
      setClubs(res.data);
      if (!selectedId && res.data.length > 0) {
        setSelectedId(res.data[0].id);
      }
    });

  const loadMembers = id => {
    setLoading(true);
    return api
      .get(`/owner/clubs/${id}/members`)
      .then(res => {
        setClub(res.data.club);
        setMembers(res.data.members);
      })
      .catch(() => setError('Failed to load members'))
      .finally(() => setLoading(false));
  };

  const removeMember = async memberId => {
    if (!selectedId) return;
    setError('');
    try {
      await api.delete(`/owner/clubs/${selectedId}/members/${memberId}`);
      await loadMembers(selectedId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove member');
    }
  };

  useEffect(() => {
    loadClubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadMembers(selectedId);
    }
  }, [selectedId]);

  return (
    <div className="page">
      <OwnerTabs current="members" />
      <h1>Members</h1>
      <div className="owner-layout">
        <aside className="owner-sidebar">
          <h3>Your Clubs</h3>
          <ul>
            {clubs.map(c => (
              <li key={c.id}>
                <button
                  className={selectedId === c.id ? 'selected' : ''}
                  onClick={() => setSelectedId(c.id)}
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <section className="owner-main">
          {!selectedId ? (
            <p>Select a club to view its members.</p>
          ) : (
            <>
              {error && <div className="error">{error}</div>}
              {club && (
                <div className="owner-card">
                  <div className="owner-card-header">
                    <h2>Members of {club.name}</h2>
                    <span className="subtle">{members.length} total</span>
                  </div>
                  {loading ? (
                    <p>Loading...</p>
                  ) : members.length === 0 ? (
                    <p>No members yet.</p>
                  ) : (
                    <table className="clubs-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Joined</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {members.map(m => (
                          <tr key={m.id}>
                            <td>{m.name}</td>
                            <td>{m.email}</td>
                            <td>{m.role || 'Member'}</td>
                            <td>{new Date(m.joined_at).toLocaleString()}</td>
                            <td className="status-actions">
                              <button
                                className="small-btn danger"
                                onClick={() => removeMember(m.id)}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
