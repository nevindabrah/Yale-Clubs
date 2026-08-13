import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { setToken } from '../api';
import { useAuth } from '../context/AuthContext';
import { Loading } from '../components/ui';

/**
 * Landing point after Yale CAS. The server has already validated the ticket
 * and minted a JWT; all this page does is store it, refresh the session and
 * move on. The token never appears in the URL beyond this hop — we replace
 * the history entry so it is not left in the back stack or copied from the
 * address bar.
 */
export default function CasCallback() {
  const [params] = useSearchParams();
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(params.get('error'));
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const token = params.get('token');
    const portal = params.get('portal') === 'officer' ? 'officer' : 'student';
    if (!token) {
      setError((e) => e || 'Yale CAS did not return a session.');
      return;
    }

    setToken(token);
    refresh()
      .then(() => {
        const isNew = params.get('new') === '1';
        const home = portal === 'officer' ? '/officer' : isNew ? '/catalog' : '/dashboard';
        navigate(home, { replace: true });
      })
      .catch(() => setError('Signed in, but the session could not be loaded. Try again.'));
  }, [params, refresh, navigate]);

  if (error) {
    return (
      <div className="page auth-wrap">
        <div className="card card-pad">
          <h2 style={{ marginBottom: 10 }}>Yale CAS sign-in failed</h2>
          <div className="alert alert-bad">{error}</div>
          <Link className="btn btn-primary btn-block" to="/login">Back to sign in</Link>
        </div>
      </div>
    );
  }

  return <Loading label="Completing Yale CAS sign-in…" />;
}
