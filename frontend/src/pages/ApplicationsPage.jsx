import React, { useEffect, useState } from 'react';
import api from '../api';

export default function ApplicationsPage() {
  const [apps, setApps] = useState([]);
  const [error, setError] = useState('');

  const load = () =>
    api
      .get('/my/applications')
      .then(res => setApps(res.data))
      .catch(() => setError('Failed to load applications'));

  useEffect(() => {
    load();
  }, []);

  const handleWithdraw = async app => {
    setError('');
    try {
      await api.post(`/clubs/${app.club_id}/withdraw`);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to withdraw application');
    }
  };

  return (
    <div className="page">
      <h1>My Applications</h1>
      {error && <div className="error">{error}</div>}
      {apps.length === 0 ? (
        <p>You haven&apos;t applied to any clubs yet.</p>
      ) : (
        <div className="apps-list">
          {apps.map(app => (
            <div key={app.id} className="app-card">
              <h3>{app.club_name}</h3>
              <p>Submitted: {new Date(app.created_at).toLocaleString()}</p>
              <div className="app-card-footer">
                <span className={`badge badge-${app.status}`}>
                  {app.status === 'pending'
                    ? 'Pending'
                    : app.status === 'accepted'
                    ? 'Accepted'
                    : 'Rejected'}
                </span>
                {app.status === 'pending' && (
                  <button
                    className="small-btn danger"
                    onClick={() => handleWithdraw(app)}
                  >
                    Withdraw Application
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
