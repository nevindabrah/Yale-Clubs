import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { get } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [params] = useSearchParams();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [cas, setCas] = useState(null);

  useEffect(() => {
    get('/auth/cas/status').then(setCas).catch(() => {});
  }, []);

  const [portal, setPortal] = useState(params.get('portal') === 'officer' ? 'officer' : 'student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const wasSwitch = params.get('switch') === '1';

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await login({ account_type: portal, email, password });
      navigate(user.account_type === 'officer' ? '/officer' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function useDemo(kind) {
    setPortal(kind === 'officer' ? 'officer' : 'student');
    setEmail(kind === 'officer' ? 'officer@yale.edu' : 'student@yale.edu');
    setPassword('yaleclubs123');
  }

  return (
    <div className="page auth-wrap">
      <h1 style={{ marginBottom: 6 }}>Sign in</h1>
      <p className="muted small" style={{ marginBottom: 18 }}>
        Student and officer accounts are separate. Pick the portal you want.
      </p>

      {wasSwitch && (
        <div className="alert alert-info">
          That page belongs to the {portal} portal. Sign in with your {portal} account to continue.
        </div>
      )}

      <form className="card card-pad" onSubmit={onSubmit}>
        <div className="field">
          <label>Portal</label>
          <div className="segmented">
            <button type="button" className={portal === 'student' ? 'on' : ''} onClick={() => setPortal('student')}>
              Student
            </button>
            <button type="button" className={portal === 'officer' ? 'on' : ''} onClick={() => setPortal('officer')}>
              Club officer
            </button>
          </div>
        </div>

        {/* Full-page redirect, not fetch — CAS drives the browser itself. */}
        <a className="btn btn-cas btn-block" href={`/api/auth/cas/login?portal=${portal}`}>
          <span className="mark">Y</span>
          Sign in with Yale CAS
        </a>
        {cas?.mode === 'mock' && (
          <div className="tiny faint center" style={{ marginTop: 8 }}>
            CAS is in development-stand-in mode — no real Yale login is contacted.
          </div>
        )}

        <div className="divider">or use a ClubTable password</div>

        <div className="field">
          <label htmlFor="email">Yale email</label>
          <input
            id="email"
            className="input"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="first.last@yale.edu"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            className="input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <div className="alert alert-bad">{error}</div>}

        <button className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Signing in…' : `Sign in to the ${portal} portal`}
        </button>

        <div className="small muted center" style={{ marginTop: 12 }}>
          No account? <Link to={`/register?portal=${portal}`}>Create one</Link>
        </div>
      </form>

      <div className="demo-box">
        <strong>Demo accounts</strong> — password <code>yaleclubs123</code>
        <div className="row" style={{ marginTop: 8, gap: 6 }}>
          <button className="btn btn-sm" type="button" onClick={() => useDemo('student')}>
            student@yale.edu
          </button>
          <button className="btn btn-sm" type="button" onClick={() => useDemo('officer')}>
            officer@yale.edu
          </button>
        </div>
        <div className="tiny muted" style={{ marginTop: 8 }}>
          <code>avery.chen@yale.edu</code> exists in <em>both</em> portals — the same person, two
          separate accounts.
        </div>
      </div>
    </div>
  );
}
