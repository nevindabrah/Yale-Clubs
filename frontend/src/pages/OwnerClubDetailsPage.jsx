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

export default function OwnerClubDetailsPage() {
  const [clubs, setClubs] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedClub, setSelectedClub] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');

  const loadClubs = () =>
    api.get('/owner/clubs').then(res => {
      setClubs(res.data);
      if (!selectedId && res.data.length > 0) {
        setSelectedId(res.data[0].id);
        setSelectedClub(res.data[0]);
      } else if (selectedId) {
        const updated = res.data.find(c => c.id === selectedId);
        if (updated) setSelectedClub(updated);
      }
    });

  useEffect(() => {
    loadClubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!savedMsg) return;
    const t = setTimeout(() => setSavedMsg(''), 5000);
    return () => clearTimeout(t);
  }, [savedMsg]);

  useEffect(() => {
    if (selectedId && clubs.length > 0) {
      const found = clubs.find(c => c.id === selectedId);
      if (found) setSelectedClub(found);
    }
  }, [selectedId, clubs]);

  const handleClubFieldChange = e => {
    const { name, value } = e.target;
    setSelectedClub(prev => ({ ...prev, [name]: value }));
  };

  const saveClubDetails = async () => {
    if (!selectedClub) return;
    setError('');
    setSavedMsg('');
    setSaving(true);
    try {
      const body = {
        name: selectedClub.name,
        meeting_time: selectedClub.meeting_time,
        location: selectedClub.location,
        join_type: selectedClub.join_type,
        deadline: selectedClub.deadline,
        description: selectedClub.description,
        owner_name: selectedClub.owner_name,
        owner_email: selectedClub.owner_email
      };
      const res = await api.put(`/owner/clubs/${selectedClub.id}`, body);
      setSelectedClub(res.data);
      await loadClubs();
      setSavedMsg('Club details saved successfully.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save club details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <OwnerTabs current="club" />
      <h1>Edit Club Details</h1>
      <div className="owner-layout">
        <aside className="owner-sidebar">
          <h3>Your Clubs</h3>
          <ul>
            {clubs.map(c => (
              <li key={c.id}>
                <button
                  className={selectedId === c.id ? 'selected' : ''}
                  onClick={() => {
                    setSelectedId(c.id);
                    setSelectedClub(c);
                  }}
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        </aside>
        <section className="owner-main">
          {!selectedId || !selectedClub ? (
            <p>Select a club to edit its details.</p>
          ) : (
            <>
              {error && <div className="error">{error}</div>}
              {savedMsg && <div className="success">{savedMsg}</div>}

              <div className="owner-club-edit">
                <h2>{selectedClub.name}</h2>
                <div className="owner-club-grid">
                  <div className="field">
                    <label>Club Name</label>
                    <input
                      name="name"
                      value={selectedClub.name || ''}
                      onChange={handleClubFieldChange}
                    />
                  </div>
                  <div className="field">
                    <label>Owner / Contact Name</label>
                    <input
                      name="owner_name"
                      value={selectedClub.owner_name || ''}
                      onChange={handleClubFieldChange}
                    />
                  </div>
                  <div className="field">
                    <label>Owner / Contact Email</label>
                    <input
                      name="owner_email"
                      value={selectedClub.owner_email || ''}
                      onChange={handleClubFieldChange}
                    />
                  </div>
                  <div className="field">
                    <label>Meeting Time</label>
                    <input
                      name="meeting_time"
                      value={selectedClub.meeting_time || ''}
                      onChange={handleClubFieldChange}
                    />
                  </div>
                  <div className="field">
                    <label>Location</label>
                    <input
                      name="location"
                      value={selectedClub.location || ''}
                      onChange={handleClubFieldChange}
                    />
                  </div>
                  <div className="field">
                    <label>Join Type</label>
                    <select
                      name="join_type"
                      value={selectedClub.join_type || 'open'}
                      onChange={handleClubFieldChange}
                    >
                      <option value="open">open</option>
                      <option value="application">application</option>
                      <option value="audition">audition</option>
                    </select>
                  </div>
                  <div className="field">
                    <label>Deadline (YYYY-MM-DD)</label>
                    <input
                      name="deadline"
                      value={selectedClub.deadline || ''}
                      onChange={handleClubFieldChange}
                    />
                  </div>
                </div>
                <div className="field">
                  <label>Description</label>
                  <textarea
                    name="description"
                    rows={4}
                    value={selectedClub.description || ''}
                    onChange={handleClubFieldChange}
                  />
                </div>
                <button
                  className="primary-btn small"
                  onClick={saveClubDetails}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Club Details'}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
