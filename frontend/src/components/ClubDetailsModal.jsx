import React from 'react';

export default function ClubDetailsModal({ open, onClose, details }) {
  if (!open || !details) return null;

  const { club, events } = details;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{club.name}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="modal-section">
            <h3>Overview</h3>
            <p className="club-description">
              {club.description || 'No description provided yet.'}
            </p>
          </div>
          <div className="modal-grid">
            <div>
              <h4>Owner</h4>
              <p>{club.owner_name}</p>
              {club.owner_email && (
                <p className="subtle">{club.owner_email}</p>
              )}
            </div>
            <div>
              <h4>Meeting Time</h4>
              <p>{club.meeting_time || 'TBA'}</p>
            </div>
            <div>
              <h4>Location</h4>
              <p>{club.location || 'TBA'}</p>
            </div>
            <div>
              <h4>Join Type</h4>
              <p>{club.join_type}</p>
              {club.deadline && (
                <p className="subtle">Deadline: {club.deadline}</p>
              )}
            </div>
          </div>
          <div className="modal-section">
            <h3>Upcoming Events</h3>
            {events.length === 0 ? (
              <p className="subtle">No upcoming events listed.</p>
            ) : (
              <ul className="events-list">
                {events.map(ev => (
                  <li key={ev.id}>
                    <strong>{ev.title}</strong>
                    <span>
                      {new Date(ev.start_time).toLocaleString()} –{' '}
                      {new Date(ev.end_time).toLocaleString()}
                    </span>
                    <span>{ev.location}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
