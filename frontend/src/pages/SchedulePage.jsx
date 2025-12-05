import React, { useEffect, useState } from 'react';
import api from '../api';

export default function SchedulePage() {
  const [data, setData] = useState({ meetings: [], events: [] });
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    api.get('/my/schedule').then(res => setData(res.data));
  }, []);

  const toggleRsvp = async ev => {
    setLoadingId(ev.id);
    try {
      const res = await api.post(`/events/${ev.id}/rsvp`, { rsvp: !ev.rsvped });
      setData(prev => ({
        ...prev,
        events: prev.events.map(e =>
          e.id === ev.id ? { ...e, rsvped: res.data.rsvped } : e
        )
      }));
    } catch (err) {
      // optional: surface error
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="page">
      <h1>Schedule</h1>
      <section className="section">
        <h2>Your Club Meetings</h2>
        {data.meetings.length === 0 ? (
          <p>No recurring meetings yet.</p>
        ) : (
          <ul className="simple-list">
            {data.meetings.map((m, idx) => (
              <li key={idx}>
                <strong>{m.club_name}</strong> — {m.meeting_time} @ {m.location}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="section">
        <h2>Upcoming Events</h2>
        {data.events.length === 0 ? (
          <p>No upcoming events.</p>
        ) : (
          <ul className="simple-list">
            {data.events.map(e => (
              <li key={e.id} className="event-row">
                <div>
                  <strong>{e.title}</strong> ({e.club_name}) — {new Date(e.start_time).toLocaleString()} @ {e.location}
                </div>
                <div className="actions-row">
                  <span className={`badge ${e.rsvped ? 'badge-accepted' : 'badge-pending'}`}>
                    {e.rsvped ? 'RSVPed' : 'Not RSVPed'}
                  </span>
                  <button
                    className={`small-btn ${e.rsvped ? 'secondary' : ''}`}
                    onClick={() => toggleRsvp(e)}
                    disabled={loadingId === e.id}
                  >
                    {loadingId === e.id ? 'Saving...' : e.rsvped ? 'Cancel RSVP' : 'RSVP'}
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
