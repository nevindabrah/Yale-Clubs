import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const COLLEGES = [
  'Benjamin Franklin', 'Berkeley', 'Branford', 'Davenport', 'Ezra Stiles',
  'Grace Hopper', 'Jonathan Edwards', 'Morse', 'Pauli Murray', 'Pierson',
  'Saybrook', 'Silliman', 'Timothy Dwight', 'Trumbull',
];

export default function Register() {
  const [params] = useSearchParams();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    account_type: params.get('portal') === 'officer' ? 'officer' : 'student',
    full_name: '',
    email: '',
    password: '',
    class_year: '',
    residential_college: '',
    major: '',
    pronouns: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await register({
        ...form,
        class_year: form.class_year ? Number(form.class_year) : null,
      });
      navigate(user.account_type === 'officer' ? '/officer' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const isOfficer = form.account_type === 'officer';

  return (
    <div className="page auth-wrap">
      <h1 style={{ marginBottom: 6 }}>Create an account</h1>
      <p className="muted small" style={{ marginBottom: 18 }}>
        You can hold both a student and an officer account on the same email address.
      </p>

      <form className="card card-pad" onSubmit={onSubmit}>
        <a className="btn btn-cas btn-block" href={`/api/auth/cas/login?portal=${form.account_type}`}>
          <span className="mark">Y</span>
          Continue with Yale CAS
        </a>
        <div className="tiny faint center" style={{ marginTop: 8 }}>
          CAS creates your account automatically — no password to choose.
        </div>
        <div className="divider">or register with a password</div>

        <div className="field">
          <label>This account is for…</label>
          <div className="segmented">
            <button
              type="button"
              className={!isOfficer ? 'on' : ''}
              onClick={() => setForm((f) => ({ ...f, account_type: 'student' }))}
            >
              Joining clubs
            </button>
            <button
              type="button"
              className={isOfficer ? 'on' : ''}
              onClick={() => setForm((f) => ({ ...f, account_type: 'officer' }))}
            >
              Running a club
            </button>
          </div>
          <span className="hint">
            {isOfficer
              ? 'Officer accounts manage applications, rosters and events. To join clubs as a member, make a separate student account.'
              : 'Student accounts browse, join, apply and message clubs.'}
          </span>
        </div>

        <div className="field">
          <label htmlFor="name">Full name</label>
          <input id="name" className="input" value={form.full_name} onChange={set('full_name')} required />
        </div>

        <div className="field">
          <label htmlFor="email">Yale email</label>
          <input
            id="email"
            className="input"
            type="email"
            value={form.email}
            onChange={set('email')}
            placeholder="first.last@yale.edu"
            required
          />
          <span className="hint">Must end in @yale.edu.</span>
        </div>

        <div className="field">
          <label htmlFor="pw">Password</label>
          <input
            id="pw"
            className="input"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={set('password')}
            required
          />
          <span className="hint">At least 8 characters.</span>
        </div>

        <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="year">Class year</label>
            <select id="year" className="select" value={form.class_year} onChange={set('class_year')}>
              <option value="">—</option>
              {[2027, 2028, 2029, 2030].map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label htmlFor="pronouns">Pronouns</label>
            <input id="pronouns" className="input" value={form.pronouns} onChange={set('pronouns')} placeholder="optional" />
          </div>
        </div>

        <div className="field">
          <label htmlFor="college">Residential college</label>
          <select id="college" className="select" value={form.residential_college} onChange={set('residential_college')}>
            <option value="">—</option>
            {COLLEGES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="field">
          <label htmlFor="major">Major</label>
          <input id="major" className="input" value={form.major} onChange={set('major')} placeholder="optional" />
        </div>

        {error && <div className="alert alert-bad">{error}</div>}

        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Creating…' : `Create ${isOfficer ? 'officer' : 'student'} account`}
        </button>

        <div className="small muted center" style={{ marginTop: 12 }}>
          Already have one? <Link to={`/login?portal=${form.account_type}`}>Sign in</Link>
        </div>
      </form>

      {isOfficer && (
        <div className="demo-box">
          New officer accounts start with no clubs attached. In a production deployment, a club
          would be assigned to you by the Yale College Dean's Office or by an existing officer of
          that club. In this demo, sign in as <code>officer@yale.edu</code> to see a populated
          officer portal.
        </div>
      )}
    </div>
  );
}
