import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { get } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { ClubLogo, Empty, Loading, Tag, formatDate } from '../../components/ui';

export default function OfficerHome() {
  const { user } = useAuth();
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    get('/officer/clubs')
      .then((d) => setClubs(d.clubs))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;

  const totals = clubs.reduce(
    (acc, c) => ({
      members: acc.members + Number(c.member_count),
      pending: acc.pending + Number(c.pending_applications),
      unread: acc.unread + Number(c.unread_messages),
      events: acc.events + Number(c.upcoming_events),
    }),
    { members: 0, pending: 0, unread: 0, events: 0 }
  );

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Officer portal</h1>
          <p>
            Signed in as {user.full_name} · managing {clubs.length} club{clubs.length === 1 ? '' : 's'}
          </p>
        </div>
        <Link className="btn" to="/officer/inbox">
          Inbox{totals.unread > 0 ? ` (${totals.unread})` : ''}
        </Link>
      </div>

      {clubs.length === 0 ? (
        <Empty title="No clubs attached to this account">
          Officer accounts start empty. In a production deployment, the Yale College Dean's Office
          or an existing officer attaches a club to your account. In this demo, sign in as
          officer@yale.edu to see a populated portal.
        </Empty>
      ) : (
        <>
          <div className="grid grid-4 section">
            <div className="stat-tile"><div className="v">{totals.members}</div><div className="k">Total members</div></div>
            <div className="stat-tile"><div className="v">{totals.pending}</div><div className="k">Applications to review</div></div>
            <div className="stat-tile"><div className="v">{totals.events}</div><div className="k">Upcoming events</div></div>
            <div className="stat-tile"><div className="v">{totals.unread}</div><div className="k">Unread messages</div></div>
          </div>

          <div className="section-head"><h2>Your clubs</h2></div>
          <div className="grid grid-2">
            {clubs.map((c) => (
              <Link key={c.id} to={`/officer/clubs/${c.id}`} className="card card-pad" style={{ color: 'inherit' }}>
                <div className="row" style={{ gap: 11, alignItems: 'flex-start' }}>
                  <ClubLogo club={c} size="lg" />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 660, fontSize: 15 }}>{c.name}</div>
                    <div className="small muted">{c.title}</div>
                    <div className="row-wrap" style={{ marginTop: 8 }}>
                      <Tag>{c.member_count} members</Tag>
                      {c.pending_applications > 0 && (
                        <Tag tone="tag-mid">{c.pending_applications} to review</Tag>
                      )}
                      {c.unread_messages > 0 && (
                        <Tag tone="tag-bad">{c.unread_messages} unread</Tag>
                      )}
                      <Tag tone="tag-cat">{c.upcoming_events} events</Tag>
                    </div>
                    {c.application_required && c.applications_open && c.application_deadline && (
                      <div className="tiny faint" style={{ marginTop: 7 }}>
                        Applications close {formatDate(c.application_deadline, { year: 'numeric' })}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
