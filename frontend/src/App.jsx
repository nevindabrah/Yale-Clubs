import React from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import LoginPage from './pages/LoginPage.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import ClubsPage from './pages/ClubsPage.jsx';
import SchedulePage from './pages/SchedulePage.jsx';
import ApplicationsPage from './pages/ApplicationsPage.jsx';
import OwnerApplicationsPage from './pages/OwnerApplicationsPage.jsx';
import OwnerDashboard from './pages/OwnerDashboard.jsx';
import OwnerClubDetailsPage from './pages/OwnerClubDetailsPage.jsx';
import OwnerEventsPage from './pages/OwnerEventsPage.jsx';
import OwnerMembersPage from './pages/OwnerMembersPage.jsx';
import Icon from './components/Icon.jsx';

function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return children;

  const homePath = user.role === 'owner' ? '/owner/dashboard' : '/dashboard';

  return (
    <div className="app-shell">
      <nav className="top-nav">
        <Link to={homePath} className="nav-left" aria-label="Yale Clubs home">
          <span className="logo">
            <img src="/logo-yale-clubs.svg" alt="Yale Clubs logo" className="logo-mark" />
          </span>
          <div>
            <span className="nav-title">Yale Clubs</span>
            <div className="nav-subtitle">Find your people. Build your club.</div>
          </div>
        </Link>
        <div className="nav-right">
          <div className="nav-links">
            {user.role === 'student' && (
              <>
              <Link to="/dashboard">
                <Icon name="home" className="icon-inline" /> Dashboard
              </Link>
              <Link to="/clubs">
                <Icon name="people" className="icon-inline" /> Clubs
              </Link>
              <Link to="/schedule">
                <Icon name="calendar" className="icon-inline" /> Schedule
              </Link>
              <Link to="/applications">
                <Icon name="mail" className="icon-inline" /> Applications
              </Link>
            </>
          )}
          {user.role === 'owner' && (
            <>
              <Link to="/owner/dashboard">
                <Icon name="home" className="icon-inline" /> Dashboard
              </Link>
              <Link to="/owner/club">
                <Icon name="edit" className="icon-inline" /> Edit Club
              </Link>
              <Link to="/owner/applications">
                <Icon name="mail" className="icon-inline" /> Applications
              </Link>
              <Link to="/owner/events">
                <Icon name="calendar" className="icon-inline" /> Events
              </Link>
              <Link to="/owner/members">
                <Icon name="people" className="icon-inline" /> Members
              </Link>
              </>
            )}
          </div>
          <div className="nav-actions">
            <span className="role-pill">{user.role === 'owner' ? 'Club Owner' : 'Student'}</span>
            <button
              className="logout-btn"
              onClick={() => {
                logout();
                navigate('/');
              }}
            >
              <Icon name="logout" className="icon-inline" /> Log Out
            </button>
          </div>
        </div>
      </nav>
      <main className="app-main">{children}</main>
    </div>
  );
}

function PrivateRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="centered">Loading...</div>;
  if (!user) return <Navigate to="/" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <LoginPage />
            </Layout>
          }
        />
        <Route
          path="/dashboard"
          element={
            <Layout>
              <PrivateRoute role="student">
                <DashboardPage />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/clubs"
          element={
            <Layout>
              <PrivateRoute role="student">
                <ClubsPage />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/schedule"
          element={
            <Layout>
              <PrivateRoute role="student">
                <SchedulePage />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/applications"
          element={
            <Layout>
              <PrivateRoute role="student">
                <ApplicationsPage />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/owner/dashboard"
          element={
            <Layout>
              <PrivateRoute role="owner">
                <OwnerDashboard />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/owner/club"
          element={
            <Layout>
              <PrivateRoute role="owner">
                <OwnerClubDetailsPage />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/owner/applications"
          element={
            <Layout>
              <PrivateRoute role="owner">
                <OwnerApplicationsPage />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/owner/events"
          element={
            <Layout>
              <PrivateRoute role="owner">
                <OwnerEventsPage />
              </PrivateRoute>
            </Layout>
          }
        />
        <Route
          path="/owner/members"
          element={
            <Layout>
              <PrivateRoute role="owner">
                <OwnerMembersPage />
              </PrivateRoute>
            </Layout>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
