import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { del, get } from '../../api';
import {
  ClubLogo, Empty, Loading, StatusTag, Tag,
  formatDate, formatDateTime, useToast,
} from '../../components/ui';

export default function MyClubs() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    get('/student/dashboard').then(setData).finally(() => setLoading(false));
  };
  useEffect(load, []);

  if (loading) return <Loading />;
  if (!data) return <Empty title="Could not load your dashboard" />;

  const { memberships, applications, upcoming, bookmarks, announcements } = data;
  const pending = applications.filter((a) =>
    ['submitted', 'under_review', 'interview'].includes(a.status)
  );

  async function leave(clubId, name) {
    if (!confirm(`Leave ${name}?`)) return;
    try {
      await del(`/student/clubs/${clubId}/join`);
      toast(`You left ${name}.`);
      load();
    } catch (err) {
      toast.bad(err.message);
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>My clubs</h1>
          <p>{memberships.length} active memberships · {pending.length} applications in progress</p>
        </div>
        <Link className="btn btn-primary" to="/catalog">Find more clubs</Link>
      </div>

      <div className="grid grid-4 section">
        <div className="stat-tile"><div className="v">{memberships.length}</div><div className="k">Clubs</div></div>
        <div className="stat-tile"><div className="v">{pending.length}</div><div className="k">Pending apps</div></div>
        <div className="stat-tile"><div className="v">{upcoming.length}</div><div className="k">Upcoming events</div></div>
        <div className="stat-tile"><div className="v">{bookmarks.length}</div><div className="k">Saved</div></div>
      </div>

      <div className="section">
        <div className="section-head"><h2>Memberships</h2></div>
        <div className="card card-list">
          {memberships.length === 0 && (
            <Empty title="You have not joined any clubs yet" action={<Link className="btn btn-primary" to="/catalog">Browse the catalog</Link>}>
              Open clubs let you join instantly — no application.
            </Empty>
          )}
          {memberships.map((m) => (
            <div className="lrow" key={m.id}>
              <ClubLogo club={m} size="md" />
              <div className="main">
                <div className="t">
                  <Link to={`/club/${m.slug}`}>{m.name}</Link>
                </div>
                <div className="s">
                  {m.role} · joined {formatDate(m.joined_at, { year: 'numeric' })}
                  {m.meeting_day ? ` · ${m.meeting_day}s ${m.meeting_time || ''}` : ''}
                </div>
              </div>
              <Tag tone="tag-cat">{m.category}</Tag>
              <button className="btn btn-sm btn-danger" onClick={() => leave(m.club_id, m.name)}>Leave</button>
            </div>
          ))}
        </div>
      </div>

      {upcoming.length > 0 && (
        <div className="section">
          <div className="section-head">
            <h2>Coming up</h2>
            <Link className="small" to="/my/calendar">Full calendar →</Link>
          </div>
          <div className="card card-list">
            {upcoming.slice(0, 6).map((e) => (
              <div className="lrow" key={e.id}>
                <ClubLogo club={{ name: e.club_name, logo_hue: e.logo_hue }} size="sm" />
                <div className="main">
                  <div className="t">{e.title}</div>
                  <div className="s">{e.club_name} · {formatDateTime(e.starts_at)}{e.location ? ` · ${e.location}` : ''}</div>
                </div>
                {e.my_rsvp === 'going' && <Tag tone="tag-good">Going</Tag>}
              </div>
            ))}
          </div>
        </div>
      )}

      {announcements.length > 0 && (
        <div className="section">
          <div className="section-head"><h2>From your clubs</h2></div>
          <div className="card card-list">
            {announcements.slice(0, 5).map((a) => (
              <div className="lrow" key={a.id} style={{ alignItems: 'flex-start' }}>
                <ClubLogo club={{ name: a.club_name, logo_hue: a.logo_hue }} size="sm" />
                <div className="main">
                  <div className="t">{a.title}</div>
                  <div className="s">{a.body}</div>
                  <div className="tiny faint" style={{ marginTop: 3 }}>
                    {a.club_name} · {formatDate(a.posted_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {bookmarks.length > 0 && (
        <div className="section">
          <div className="section-head"><h2>Saved for later</h2></div>
          <div className="card card-list">
            {bookmarks.map((b) => (
              <div className="lrow" key={b.id}>
                <ClubLogo club={b} size="sm" />
                <div className="main">
                  <div className="t"><Link to={`/club/${b.slug}`}>{b.name}</Link></div>
                  <div className="s">{b.category}</div>
                </div>
                {b.application_required && b.applications_open && (
                  <Tag tone="tag-mid">Apply by {formatDate(b.application_deadline)}</Tag>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length > 0 && (
        <div className="section">
          <div className="section-head">
            <h2>Applications in progress</h2>
            <Link className="small" to="/my/applications">All applications →</Link>
          </div>
          <div className="card card-list">
            {pending.map((a) => (
              <div className="lrow" key={a.id}>
                <ClubLogo club={a} size="sm" />
                <div className="main">
                  <div className="t">{a.name}</div>
                  <div className="s">Submitted {formatDate(a.submitted_at)}</div>
                </div>
                <StatusTag status={a.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
