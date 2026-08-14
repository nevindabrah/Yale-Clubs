import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { get } from '../api';
import { Avatar } from './ui';
import Logo from './Logo';

function useTheme() {
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || 'light'
  );
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ct-theme', theme);
  }, [theme]);
  return [theme, () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))];
}

export default function TopNav() {
  const { user, isStudent, isOfficer, logout } = useAuth();
  const [theme, toggleTheme] = useTheme();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Poll the unread badge; cheap enough at this cadence and keeps both
  // portals honest about new messages without a websocket.
  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    const load = () =>
      get('/messages/unread')
        .then((d) => alive && setUnread(d.unread))
        .catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [user]);

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <nav className="nav">
      <Link
        to={isOfficer ? '/officer' : isStudent ? '/dashboard' : '/catalog'}
        className="nav-brand"
        aria-label="ClubTable home"
      >
        <Logo size={30} />
      </Link>

      {isStudent && (
        <>
          <NavLink to="/dashboard" className="nav-link">Dashboard</NavLink>
          <NavLink to="/catalog" className="nav-link">Browse</NavLink>
          <NavLink to="/my/clubs" className="nav-link">My clubs</NavLink>
          <NavLink to="/my/applications" className="nav-link">Applications</NavLink>
          <NavLink to="/my/calendar" className="nav-link">Calendar</NavLink>
          <NavLink to="/messages" className="nav-link">
            Messages{unread > 0 && <span className="nav-count">{unread}</span>}
          </NavLink>
        </>
      )}

      {isOfficer && (
        <>
          <NavLink to="/officer" className="nav-link">My clubs</NavLink>
          <NavLink to="/officer/inbox" className="nav-link">
            Inbox{unread > 0 && <span className="nav-count">{unread}</span>}
          </NavLink>
          <NavLink to="/catalog" className="nav-link">Browse catalog</NavLink>
        </>
      )}

      {!user && (
        <>
          <NavLink to="/catalog" className="nav-link">Browse clubs</NavLink>
          <NavLink to="/about" className="nav-link">About</NavLink>
        </>
      )}

      <span className="nav-spacer" />

      <button
        className="nav-icon-btn"
        onClick={toggleTheme}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? '☀' : '☾'}
      </button>

      {user ? (
        <div className="usermenu" ref={menuRef}>
          <button className="usermenu-btn" onClick={() => setOpen((o) => !o)}>
            <Avatar name={user.full_name} hue={user.avatar_hue} />
            <span className="nowrap">{user.full_name.split(' ')[0]}</span>
            <span className={`nav-portal${isOfficer ? ' officer' : ''}`}>
              {isOfficer ? 'Officer' : 'Student'}
            </span>
          </button>

          {open && (
            <div className="usermenu-panel">
              <div className="usermenu-head">
                <div style={{ fontWeight: 650 }}>{user.full_name}</div>
                <div className="tiny muted">{user.email}</div>
                <div className="tiny muted" style={{ marginTop: 4 }}>
                  Signed in to the <strong>{user.account_type}</strong> portal
                </div>
              </div>
              <Link className="usermenu-item" to="/profile" onClick={() => setOpen(false)}>
                Profile & settings
              </Link>
              <button
                className="usermenu-item"
                onClick={() => {
                  setOpen(false);
                  navigate(`/login?portal=${isOfficer ? 'student' : 'officer'}`);
                }}
              >
                Switch to the {isOfficer ? 'student' : 'officer'} portal…
              </button>
              <button
                className="usermenu-item danger"
                onClick={() => {
                  logout();
                  setOpen(false);
                  navigate('/');
                }}
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <Link to="/login" className="nav-link">Sign in</Link>
          <Link to="/register" className="btn btn-sm" style={{ marginLeft: 6 }}>
            Create account
          </Link>
        </>
      )}
    </nav>
  );
}
