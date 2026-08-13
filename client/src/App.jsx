import { Navigate, Route, Routes } from 'react-router-dom';
import TopNav from './components/TopNav';
import { useAuth } from './context/AuthContext';
import { Loading } from './components/ui';

import Landing from './pages/Landing';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import Catalog from './pages/Catalog';
import ClubDetailPage from './pages/ClubDetailPage';
import Profile from './pages/Profile';

import MyClubs from './pages/student/MyClubs';
import MyApplications from './pages/student/MyApplications';
import MyCalendar from './pages/student/MyCalendar';
import Messages from './pages/student/Messages';

import OfficerHome from './pages/officer/OfficerHome';
import OfficerClub from './pages/officer/OfficerClub';
import OfficerInbox from './pages/officer/OfficerInbox';

/** Route guard. `portal` is 'student' | 'officer' | undefined (any signed-in user). */
function Protected({ portal, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to={`/login${portal ? `?portal=${portal}` : ''}`} replace />;
  if (portal && user.account_type !== portal) {
    // Signed in, but to the wrong portal — these are separate accounts (D-002).
    return <Navigate to={`/login?portal=${portal}&switch=1`} replace />;
  }
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  return (
    <>
      <TopNav />
      <Routes>
        <Route
          path="/"
          element={
            loading ? <Loading /> :
            user ? <Navigate to={user.account_type === 'officer' ? '/officer' : '/catalog'} replace /> :
            <Landing />
          }
        />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/catalog" element={<Catalog />} />
        <Route path="/club/:slug" element={<ClubDetailPage />} />

        <Route path="/profile" element={<Protected><Profile /></Protected>} />

        <Route path="/my/clubs" element={<Protected portal="student"><MyClubs /></Protected>} />
        <Route path="/my/applications" element={<Protected portal="student"><MyApplications /></Protected>} />
        <Route path="/my/calendar" element={<Protected portal="student"><MyCalendar /></Protected>} />
        <Route path="/messages" element={<Protected portal="student"><Messages /></Protected>} />

        <Route path="/officer" element={<Protected portal="officer"><OfficerHome /></Protected>} />
        <Route path="/officer/clubs/:clubId" element={<Protected portal="officer"><OfficerClub /></Protected>} />
        <Route path="/officer/inbox" element={<Protected portal="officer"><OfficerInbox /></Protected>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
