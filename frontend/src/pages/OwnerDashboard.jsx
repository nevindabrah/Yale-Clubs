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

export default function OwnerDashboard() {
  const [clubs, setClubs] = useState([]);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({});
  const totals = clubs.reduce(
    (acc, club) => {
      const s = stats[club.id] || {};
      acc.pending += s.pending || 0;
      acc.accepted += s.accepted || 0;
      acc.rejected += s.rejected || 0;
      acc.events += s.events || 0;
      return acc;
    },
    { pending: 0, accepted: 0, rejected: 0, events: 0 }
  );

  useEffect(() => {
    api
      .get('/owner/clubs')
      .then(res => setClubs(res.data))
      .catch(() => setError('Failed to load your clubs'));
  }, []);

  useEffect(() => {
    const loadStats = async club => {
      try {
        const [appsRes, eventsRes] = await Promise.all([
          api.get(`/owner/clubs/${club.id}/applications`),
          api.get(`/owner/clubs/${club.id}/events`)
        ]);
        const counts = appsRes.data.reduce(
          (acc, app) => {
            if (app.status === 'pending') acc.pending += 1;
            else if (app.status === 'accepted') acc.accepted += 1;
            else if (app.status === 'rejected') acc.rejected += 1;
            return acc;
          },
          { pending: 0, accepted: 0, rejected: 0 }
        );
        setStats(prev => ({
          ...prev,
          [club.id]: {
            pending: counts.pending,
            accepted: counts.accepted,
            rejected: counts.rejected,
            events: eventsRes.data.events?.length || 0
          }
        }));
      } catch (err) {
        // swallow errors; main list already handled
      }
    };

    if (clubs.length > 0) {
      clubs.forEach(loadStats);
    }
  }, [clubs]);

  return (
    <div className="page">
      <OwnerTabs current="dashboard" />
      <h1>Owner Dashboard</h1>
      <div className="owner-stats-grid">
        <div className="owner-stat-card">
          <div className="stat-label">Your Clubs</div>
          <div className="stat-value">{clubs.length}</div>
          <div className="stat-sub">Active and ready for applications</div>
        </div>
        <div className="owner-stat-card">
          <div className="stat-label">Pending Applications</div>
          <div className="stat-value">{totals.pending}</div>
          <div className="stat-sub">Awaiting your decision</div>
        </div>
        <div className="owner-stat-card">
          <div className="stat-label">Accepted Members</div>
          <div className="stat-value">{totals.accepted}</div>
          <div className="stat-sub">Welcomed into your clubs</div>
        </div>
        <div className="owner-stat-card">
          <div className="stat-label">Upcoming Events</div>
          <div className="stat-value">{totals.events}</div>
          <div className="stat-sub">Meetings and events scheduled</div>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      {clubs.length === 0 ? (
        <p>You don&apos;t own any clubs yet.</p>
      ) : (
        <div className="owner-dashboard-grid">
          {clubs.map(c => (
            <div key={c.id} className="owner-summary-card">
              <h2>{c.name}</h2>
              <p>{c.description || 'No description yet.'}</p>
              <p>
                <strong>Meeting:</strong> {c.meeting_time || 'TBA'} @ {c.location || 'TBA'}
              </p>
              <p>
                <strong>Join Type:</strong> {c.join_type}
              </p>
              {stats[c.id] && (
                <div className="owner-stat-row">
                  <span className="badge badge-pending">Pending: {stats[c.id].pending}</span>
                  <span className="badge badge-accepted">Accepted: {stats[c.id].accepted}</span>
                  <span className="badge badge-rejected">Rejected: {stats[c.id].rejected}</span>
                  <span className="badge badge-neutral">Events: {stats[c.id].events}</span>
                </div>
              )}
              <div className="owner-summary-links">
                <Link className="chip-btn" to="/owner/club">
                  Edit Details
                </Link>
                <Link className="chip-btn" to="/owner/applications">
                  View Applications
                </Link>
                <Link className="chip-btn" to="/owner/events">
                  Manage Events
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
