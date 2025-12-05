import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import RsvpModal from '../components/RsvpModal.jsx';

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

export default function OwnerEventsPage() {
  const stopWheel = e => {
    e.preventDefault();
    e.stopPropagation();
  };
  const [clubs, setClubs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [club, setClub] = useState(null);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [rsvpModal, setRsvpModal] = useState({ open: false, eventTitle: '', list: [] });
  const [form, setForm] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    description: ''
  });
  const [editingId, setEditingId] = useState(null);
  const timeOptions = Array.from({ length: 48 }).map((_, idx) => {
    const hours = String(Math.floor(idx / 2)).padStart(2, '0');
    const minutes = idx % 2 === 0 ? '00' : '30';
    return `${hours}:${minutes}`;
  });

  const loadClubs = () =>
    api.get('/owner/clubs').then(res => {
      setClubs(res.data);
      if (!selectedId && res.data.length > 0) {
        setSelectedId(res.data[0].id);
      }
    });

 const loadEvents = id =>
  api
    .get(`/owner/clubs/${id}/events`)
    .then(res => {
      // axios puts the actual payload on res.data
      setClub(res.data.club);
      setEvents(res.data.events);
    })
    .catch(() => setError('Failed to load events'));


  useEffect(() => {
    loadClubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadEvents(selectedId);
    }
  }, [selectedId]);

  const handleFormChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      title: '',
      date: '',
      startTime: '',
      endTime: '',
      location: '',
      description: ''
    });
    setEditingId(null);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!selectedId) return;
    setError('');
    setSaving(true);
    try {
      const { title, date, startTime, endTime, location, description } = form;
      if (!date || !startTime || !endTime) {
        setError('Please select a date, start time, and end time.');
        setSaving(false);
        return;
      }
      const makeIso = (d, t) => `${d}T${t.length === 5 ? `${t}:00` : t}`;
      const payload = {
        title,
        start_time: makeIso(date, startTime),
        end_time: makeIso(date, endTime),
        location,
        description
      };
      if (editingId) {
        await api.put(`/owner/events/${editingId}`, payload);
      } else {
        await api.post(`/owner/clubs/${selectedId}/events`, payload);
      }
      resetForm();
      await loadEvents(selectedId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save event');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = ev => {
    setEditingId(ev.id);
    const [startDatePart, startTimePartRaw] = (ev.start_time || '').split('T');
    const [endDatePart, endTimePartRaw] = (ev.end_time || '').split('T');
    setForm({
      title: ev.title,
      date: startDatePart || '',
      startTime: (startTimePartRaw || '').slice(0, 5),
      endTime: (endTimePartRaw || '').slice(0, 5),
      location: ev.location || '',
      description: ev.description || ''
    });
  };

  const handleDelete = async ev => {
    setError('');
    try {
      await api.delete(`/owner/events/${ev.id}`);
      await loadEvents(selectedId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete event');
    }
  };

  return (
    <div className="page">
      <OwnerTabs current="events" />
      <h1>Meetings &amp; Events</h1>
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
            <p>Select a club to manage its events.</p>
          ) : (
            <>
              {error && <div className="error">{error}</div>}
              {club && (
                <p>
                  Editing events for <strong>{club.name}</strong>
                </p>
              )}

              <div className="owner-card">
                <div className="owner-card-header">
                  <h2>Upcoming Events</h2>
                  <span className="subtle">{events.length} total</span>
                </div>
                {events.length === 0 ? (
                  <p>No events yet.</p>
                ) : (
                  <table className="clubs-table">
                    <thead>
                      <tr>
                        <th>Title</th>
                        <th>Description</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Location</th>
                      <th>RSVPs</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map(ev => (
                      <tr key={ev.id}>
                          <td>{ev.title}</td>
                        <td>{ev.description || '—'}</td>
                        <td>{new Date(ev.start_time).toLocaleString()}</td>
                        <td>{new Date(ev.end_time).toLocaleString()}</td>
                        <td>{ev.location}</td>
                        <td>
                          <div className="actions-row">
                            <span className="badge badge-neutral">{ev.rsvp_count || 0}</span>
                            <button
                              className="small-btn secondary"
                              onClick={async () => {
                                try {
                                  const res = await api.get(`/owner/events/${ev.id}/rsvps`);
                                  setRsvpModal({
                                    open: true,
                                    eventTitle: ev.title,
                                    list: res.data
                                  });
                                } catch {
                                  setError('Failed to load RSVPs');
                                }
                              }}
                            >
                              View RSVPs
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className="actions-row">
                            <button className="small-btn" onClick={() => handleEdit(ev)}>
                              Edit
                            </button>
                              <button
                                className="small-btn danger"
                                onClick={() => handleDelete(ev)}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="owner-card" style={{ marginTop: 16 }}>
                <div className="owner-card-header">
                  <h2>{editingId ? 'Edit Event' : 'Add Event'}</h2>
                </div>
                <form className="owner-event-form" onSubmit={handleSubmit}>
                  <div className="field">
                    <label>Title</label>
                    <input
                      name="title"
                      value={form.title}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Date</label>
                    <input
                      type="date"
                      name="date"
                      value={form.date}
                      onChange={handleFormChange}
                      required
                    />
                  </div>
                  <div className="field time-row">
                    <div className="time-col">
                      <label>From</label>
                      <select
                        name="startTime"
                        value={form.startTime}
                        onChange={handleFormChange}
                        onWheel={stopWheel}
                        required
                      >
                        <option value="">Select time</option>
                        {timeOptions.map(t => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="time-col">
                      <label>To</label>
                      <select
                        name="endTime"
                        value={form.endTime}
                        onChange={handleFormChange}
                        onWheel={stopWheel}
                        required
                      >
                        <option value="">Select time</option>
                        {timeOptions.map(t => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="field">
                    <label>Location</label>
                    <input
                      name="location"
                      value={form.location}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="field">
                    <label>Brief Description</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleFormChange}
                      rows={3}
                      placeholder="e.g., Agenda or what attendees should prepare"
                    />
                  </div>
                  <div className="actions-row" style={{ marginTop: '10px', justifyContent: 'flex-start' }}>
                    <button className="primary-btn small" type="submit" disabled={saving}>
                      {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Add Event'}
                    </button>
                    {editingId && (
                      <button
                        type="button"
                        className="small-btn secondary"
                        onClick={resetForm}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </>
          )}
        </section>
      </div>
      <RsvpModal
        open={rsvpModal.open}
        eventTitle={rsvpModal.eventTitle}
        rsvps={rsvpModal.list}
        onClose={() => setRsvpModal({ open: false, eventTitle: '', list: [] })}
      />
    </div>
  );
}
