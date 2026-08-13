import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { get, patch } from '../api';
import { useAuth } from '../context/AuthContext';
import { Avatar, useToast } from '../components/ui';

const COLLEGES = [
  'Benjamin Franklin', 'Berkeley', 'Branford', 'Davenport', 'Ezra Stiles',
  'Grace Hopper', 'Jonathan Edwards', 'Morse', 'Pauli Murray', 'Pierson',
  'Saybrook', 'Silliman', 'Timothy Dwight', 'Trumbull',
];

export default function Profile() {
  const { user, refresh, isOfficer, managedClubs } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(() => ({ ...user }));
  const [busy, setBusy] = useState(false);
  const [counterpart, setCounterpart] = useState(null);

  useEffect(() => {
    get('/auth/counterpart').then(setCounterpart).catch(() => {});
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await patch('/auth/me', {
        full_name: form.full_name,
        class_year: form.class_year ? Number(form.class_year) : null,
        residential_college: form.residential_college || null,
        major: form.major || null,
        pronouns: form.pronouns || null,
        bio: form.bio || null,
      });
      await refresh();
      toast.good('Profile saved.');
    } catch (err) {
      toast.bad(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page" style={{ maxWidth: 620 }}>
      <div className="page-head">
        <div className="row" style={{ gap: 12 }}>
          <Avatar name={user.full_name} hue={user.avatar_hue} large />
          <div>
            <h1>{user.full_name}</h1>
            <p>
              {user.email} · <strong>{user.account_type}</strong> account
            </p>
          </div>
        </div>
      </div>

      <div className="alert alert-info">
        This is your <strong>{user.account_type}</strong> account.{' '}
        {counterpart?.exists
          ? `You also have a ${counterpart.other_portal} account on this email — sign in to that portal to use it.`
          : `You do not have a ${counterpart?.other_portal || 'second'} account on this email. Accounts in the two portals are separate.`}
        {!counterpart?.exists && (
          <>
            {' '}
            <Link to={`/register?portal=${counterpart?.other_portal || 'officer'}`}>Create one →</Link>
          </>
        )}
      </div>

      {isOfficer && (
        <div className="card card-pad section">
          <h3>Clubs you manage</h3>
          {managedClubs.length === 0 ? (
            <p className="muted small" style={{ marginTop: 8 }}>
              None yet. In production, an existing officer or the Dean's Office attaches a club to
              your account.
            </p>
          ) : (
            <ul className="small" style={{ margin: '8px 0 0', paddingLeft: 18 }}>
              {managedClubs.map((c) => (
                <li key={c.id}>
                  <Link to={`/officer/clubs/${c.id}`}>{c.name}</Link> — {c.title}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <form className="card card-pad" onSubmit={save}>
        <h3 style={{ marginBottom: 14 }}>Edit profile</h3>
        <div className="field">
          <label>Full name</label>
          <input className="input" value={form.full_name || ''} onChange={set('full_name')} />
        </div>
        <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Class year</label>
            <select className="select" value={form.class_year || ''} onChange={set('class_year')}>
              <option value="">—</option>
              {[2027, 2028, 2029, 2030].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Pronouns</label>
            <input className="input" value={form.pronouns || ''} onChange={set('pronouns')} />
          </div>
        </div>
        <div className="field">
          <label>Residential college</label>
          <select className="select" value={form.residential_college || ''} onChange={set('residential_college')}>
            <option value="">—</option>
            {COLLEGES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Major</label>
          <input className="input" value={form.major || ''} onChange={set('major')} />
        </div>
        <div className="field">
          <label>Bio</label>
          <textarea
            className="textarea"
            value={form.bio || ''}
            onChange={set('bio')}
            placeholder="Officers reviewing your applications can see this."
          />
        </div>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
      </form>
    </div>
  );
}
