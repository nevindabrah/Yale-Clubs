import React from 'react';

export default function RsvpModal({ open, eventTitle, rsvps, onClose }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>RSVPs — {eventTitle}</h2>
          <button className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          {rsvps.length === 0 ? (
            <p className="subtle">No RSVPs yet.</p>
          ) : (
            <ul className="simple-list">
              {rsvps.map(r => (
                <li key={r.user_id} className="rsvp-row">
                  <div>
                    <strong>{r.name}</strong>
                    <div className="subtle">{r.email}</div>
                  </div>
                  <div className="subtle">{new Date(r.created_at).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

