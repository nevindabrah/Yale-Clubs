import React, { useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from '../AuthContext';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [schedule, setSchedule] = useState({ meetings: [], events: [] });
  const [rsvpLoading, setRsvpLoading] = useState(null);

  useEffect(() => {
    api.get('/clubs').then(res => setClubs(res.data));
    api.get('/my/schedule').then(res => setSchedule(res.data));
  }, []);

  const myClubs = clubs.filter(c => c.is_member);

  const toggleRsvp = async ev => {
    setRsvpLoading(ev.id);
    try {
      const res = await api.post(`/events/${ev.id}/rsvp`, { rsvp: !ev.rsvped });
      setSchedule(prev => ({
        ...prev,
        events: prev.events.map(e => (e.id === ev.id ? { ...e, rsvped: res.data.rsvped } : e))
      }));
    } catch (err) {
      // optional: toast
    } finally {
      setRsvpLoading(null);
    }
  };

  return (
    <div className="page">
      <h1>Welcome back, {user.name}!</h1>
      <div className="cards-row">
        <div className="summary-card">
          <div className="label">Active Clubs</div>
          <div className="value">{myClubs.length}</div>
        </div>
        <div className="summary-card">
          <div className="label">Upcoming Events</div>
          <div className="value">{schedule.events.length}</div>
        </div>
        <div className="summary-card">
          <div className="label">Pending Applications</div>
          <div className="value">
            {clubs.filter(c => c.application_status === 'pending').length}
          </div>
        </div>
      </div>

      <section className="section">
        <div className="section-header">
          <h2>Your Clubs</h2>
          <Link to="/clubs" className="link">
            Browse All Clubs
          </Link>
        </div>
        {myClubs.length === 0 ? (
          <p>You haven&apos;t joined any clubs yet. Visit the Clubs tab to get started.</p>
        ) : (
          <div className="list">
            {myClubs.map(c => (
              <div key={c.id} className="club-card">
                <h3>{c.name}</h3>
                <p>{c.meeting_time}</p>
                <p>{c.location}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <h2>Upcoming Events</h2>
        {schedule.events.length === 0 ? (
          <p>No upcoming events yet.</p>
        ) : (
          <ul className="simple-list">
            {schedule.events.map(ev => (
              <li key={ev.id} className="event-row">
                <div>
                  <strong>{ev.title}</strong> ({ev.club_name}) — {new Date(ev.start_time).toLocaleString()} @ {ev.location}
                </div>
                <div className="actions-row">
                  <span className={`badge ${ev.rsvped ? 'badge-accepted' : 'badge-pending'}`}>
                    {ev.rsvped ? 'RSVPed' : 'Not RSVPed'}
                  </span>
                  <button
                    className={`small-btn ${ev.rsvped ? 'secondary' : ''}`}
                    onClick={() => toggleRsvp(ev)}
                    disabled={rsvpLoading === ev.id}
                  >
                    {rsvpLoading === ev.id ? 'Saving...' : ev.rsvped ? 'Cancel RSVP' : 'RSVP'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
