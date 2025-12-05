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
    </div>
  );
}

export default function OwnerApplicationsPage() {
  const [clubs, setClubs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [apps, setApps] = useState([]);
  const [error, setError] = useState('');

  const loadClubs = () =>
    api.get('/owner/clubs').then(res => {
      setClubs(res.data);
      if (!selectedId && res.data.length > 0) {
        setSelectedId(res.data[0].id);
      }
    });

  const loadApps = id =>
    api
      .get(`/owner/clubs/${id}/applications`)
      .then(res => {
        const order = { pending: 0, accepted: 1, rejected: 2 };
        const sorted = [...res.data].sort((a, b) => {
          return (order[a.status] ?? 3) - (order[b.status] ?? 3);
        });
        setApps(sorted);
      })
      .catch(() => setError('Failed to load applications'));

  useEffect(() => {
    loadClubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadApps(selectedId);
    }
  }, [selectedId]);

  const updateStatus = async (appId, status) => {
    setError('');
    try {
      await api.patch(`/owner/applications/${appId}`, { status });
      await loadApps(selectedId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update status');
    }
  };

  return (
    <div className="page">
      <OwnerTabs current="applications" />
      <h1>Manage Applications</h1>
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
            <p>Select a club to view its applications.</p>
          ) : (
            <>
              {error && <div className="error">{error}</div>}
              {apps.length === 0 ? (
                <p>No applications yet.</p>
              ) : (
                <table className="clubs-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Email</th>
                      <th>Submitted</th>
                      <th>Applied At</th>
                      <th>Status</th>
                      <th>Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apps.map(a => (
                      <tr key={a.id}>
                        <td>{a.student_name}</td>
                        <td>{a.student_email}</td>
                        <td>{new Date(a.created_at).toLocaleString()}</td>
                        <td>{new Date(a.created_at).toLocaleString()}</td>
                        <td>
                          <span className={`badge badge-${a.status}`}>
                            {a.status === 'pending'
                              ? 'Pending'
                              : a.status === 'accepted'
                              ? 'Accepted'
                              : 'Rejected'}
                          </span>
                        </td>
                        <td className="status-actions">
                          <button
                            className="small-btn success"
                            onClick={() => updateStatus(a.id, 'accepted')}
                          >
                            Accept
                          </button>
                          <button
                            className="small-btn warning"
                            onClick={() => updateStatus(a.id, 'pending')}
                          >
                            Pending
                          </button>
                          <button
                            className="small-btn danger"
                            onClick={() => updateStatus(a.id, 'rejected')}
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
