import React, { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';

export default function LoginPage() {
  const { login, register, user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState('');

  // Redirect based on role once user is set
  useEffect(() => {
    if (!user) return;
    if (user.role === 'student') {
      navigate('/dashboard', { replace: true });
    } else if (user.role === 'owner') {
      navigate('/owner/applications', { replace: true });
    }
  }, [user, navigate]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setBanner('');
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
      // navigation happens in useEffect when user updates
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to authenticate');
    }
  };

  const showBanner = msg => {
    setBanner(msg);
    setTimeout(() => setBanner(''), 3200);
  };

  return (
    <div className="auth-shell">
      <div className="auth-layout">
        <div className="auth-left">
          <h1 className="auth-brand">Yale Clubs</h1>
          <h2 className="auth-heading">Discover Your Community</h2>
          <p className="auth-subtext">
            Connect with student organizations, explore opportunities, and build lasting
            relationships at Yale.
          </p>
          <div className="hero-icons">
            <div className="icon-row">
              <span className="icon-badge square">
                <Icon name="target" className="icon-inline" />
              </span>
              <div>
                <div className="icon-row-title">Find Your Passion</div>
                <div className="icon-row-sub">
                  Browse hundreds of clubs across all interests and categories.
                </div>
              </div>
            </div>
            <div className="icon-row">
              <span className="icon-badge square">
                <Icon name="clock" className="icon-inline" />
              </span>
              <div>
                <div className="icon-row-title">Manage Your Time</div>
                <div className="icon-row-sub">
                  Coordinate schedules and never miss an important meeting.
                </div>
              </div>
            </div>
            <div className="icon-row">
              <span className="icon-badge square">
                <Icon name="people" className="icon-inline" />
              </span>
              <div>
                <div className="icon-row-title">Build Community</div>
                <div className="icon-row-sub">
                  Connect with like-minded students and make lifelong friends.
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="auth-right">
          <div className="auth-card">
            {banner && <div className="flash-banner">{banner}</div>}
            <div className="auth-card-header">
              <h2>Welcome Back!</h2>
              <p>Sign in to access your club dashboard</p>
            </div>
            <form onSubmit={handleSubmit} className="auth-form">
              {mode === 'register' && (
                <div className="field">
                  <label>Name</label>
                  <input name="name" value={form.name} onChange={handleChange} required />
                </div>
              )}
              <div className="field">
                <label>Email or Username</label>
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="field">
                <label>Password</label>
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="auth-row">
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                  />
                  Remember Me
                </label>
                <button type="button" className="link-btn">
                  Forgot Password?
                </button>
              </div>
              {error && <div className="error">{error}</div>}
              <button className="primary-btn" type="submit">
                {mode === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
              <div className="divider">
                <span>Or Continue With</span>
              </div>
              <button
                type="button"
                className="secondary-btn"
                onClick={() =>
                  showBanner('We are working on adding Yale CAS. Please use email/password for now.')
                }
              >
                Log in with Yale CAS
              </button>
            </form>
            <div className="auth-footer">
              <div>
                Don&apos;t have an account?{' '}
                {mode === 'login' ? (
                  <button className="link-btn" onClick={() => setMode('register')}>
                    Sign up
                  </button>
                ) : (
                  <button className="link-btn" onClick={() => setMode('login')}>
                    Sign in
                  </button>
                )}
              </div>
              <button className="link-btn subtle-link" type="button">
                Club Owner Portal →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
