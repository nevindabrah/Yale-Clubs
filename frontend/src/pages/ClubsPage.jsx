import React, { useEffect, useState } from 'react';
import api from '../api';
import ClubDetailsModal from '../components/ClubDetailsModal';
import { useAuth } from '../AuthContext';

export default function ClubsPage() {
  const [clubs, setClubs] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name-asc');
  const [error, setError] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [details, setDetails] = useState(null);
  const { user } = useAuth();

  const load = () =>
    api
      .get('/clubs')
      .then(res => setClubs(res.data))
      .catch(() => setError('Failed to load clubs'));

  useEffect(() => {
    load();
  }, []);

  const handleJoin = async club => {
    setError('');
    try {
      await api.post(`/clubs/${club.id}/join`);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process action');
    }
  };

  const handleLeave = async club => {
    setError('');
    try {
      await api.post(`/clubs/${club.id}/leave`);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to leave club');
    }
  };

  const handleWithdraw = async club => {
    setError('');
    try {
      await api.post(`/clubs/${club.id}/withdraw`);
      await load();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to withdraw application');
    }
  };

  const handleViewDetails = async club => {
    setError('');
    try {
      const res = await api.get(`/clubs/${club.id}`);
      // API returns { club, events }
      setDetails(res.data);
      setDetailsOpen(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load club details');
    }
  };

  const filtered = clubs
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'name-asc') return a.name.localeCompare(b.name);
      if (sort === 'name-desc') return b.name.localeCompare(a.name);
      if (sort === 'join-open-first') {
        if (a.join_type === b.join_type) return a.name.localeCompare(b.name);
        return a.join_type === 'open' ? -1 : 1;
      }
      if (sort === 'deadline-soon') {
        const da = a.deadline ? new Date(a.deadline).getTime() : Infinity;
        const db = b.deadline ? new Date(b.deadline).getTime() : Infinity;
        return da - db;
      }
      return 0;
    });

  const joinLabel = club => {
    if (club.is_member) return 'Leave';
    if (
      (club.join_type === 'application' || club.join_type === 'audition') &&
      club.application_status === 'pending'
    ) {
      return 'Withdraw';
    }
    if (club.join_type === 'open') return 'Add';
    if (club.join_type === 'application') return 'Apply';
    if (club.join_type === 'audition') return 'Audition';
    return 'Apply';
  };

  const handlePrimaryAction = club => {
    if (club.is_member) {
      return handleLeave(club);
    }
    if (
      (club.join_type === 'application' || club.join_type === 'audition') &&
      club.application_status === 'pending'
    ) {
      return handleWithdraw(club);
    }
    return handleJoin(club);
  };

  const isDisabled = club => {
    // disable only when not member, non-open join, and status is non-empty and not pending
    return (
      !club.is_member &&
      (club.join_type === 'application' || club.join_type === 'audition') &&
      club.application_status &&
      club.application_status !== '' &&
      club.application_status !== 'pending'
    );
  };

  return (
    <div className="page">
      <h1>Clubs Directory</h1>
      <div className="filter-row">
        <input
          className="search-input"
          placeholder="Search clubs by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          className="filter-select"
          value={sort}
          onChange={e => setSort(e.target.value)}
          aria-label="Sort clubs"
        >
          <option value="name-asc">Name A → Z</option>
          <option value="name-desc">Name Z → A</option>
          <option value="join-open-first">Open Join First</option>
          <option value="deadline-soon">Earliest Deadline</option>
        </select>
      </div>
      {error && <div className="error">{error}</div>}
      <table className="clubs-table">
        <thead>
          <tr>
            <th>Club Name</th>
            <th>Owner / Liaison</th>
            <th>Meeting Time</th>
            <th>Location</th>
            <th>Join Type</th>
            <th>Deadline</th>
            <th>Details</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(club => (
            <tr key={club.id}>
              <td>{club.name}</td>
              <td>{club.owner_name}</td>
              <td>{club.meeting_time}</td>
              <td>{club.location}</td>
              <td>{club.join_type}</td>
              <td>{club.deadline || '—'}</td>
              <td>
                <button
                  className="table-btn secondary"
                  onClick={() => handleViewDetails(club)}
                >
                  View
                </button>
              </td>
              <td>
                {user?.role === 'student' && (
                  <button
                    className="table-btn"
                    disabled={isDisabled(club)}
                    onClick={() => handlePrimaryAction(club)}
                  >
                    {joinLabel(club)}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <ClubDetailsModal
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        details={details}
      />
    </div>
  );
}
