import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { get, post } from '../../api';
import { useAuth } from '../../context/AuthContext';
import {
  Chip, ClubLogo, Empty, Loading, StatusTag, Tag,
  formatDate, formatDateTime, formatTime, useToast,
} from '../../components/ui';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const OPEN_STATES = ['submitted', 'under_review', 'interview'];

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function daysUntil(date) {
  const ms = new Date(`${date}T23:59:59`) - Date.now();
  return Math.ceil(ms / 86400000);
}

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([get('/student/dashboard'), get('/student/calendar?days=14')])
      .then(([dash, cal]) => {
        setData(dash);
        setEvents(cal.events);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  // The next seven days, each with the events that fall on it.
  const week = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      days.push({
        date: d,
        isToday: i === 0,
        events: events.filter((e) => new Date(e.starts_at).toDateString() === d.toDateString()),
      });
    }
    return days;
  }, [events]);

  if (loading) return <Loading label="Loading your dashboard…" />;
  if (!data) return <Empty title="Could not load your dashboard" />;

  const { memberships, applications, bookmarks, announcements, deadlines, recommended, unread } = data;
  const pending = applications.filter((a) => OPEN_STATES.includes(a.status));
  const decided = applications.filter((a) => a.status === 'accepted' || a.status === 'rejected');
  const today = week[0].events;
  const nextEvent = events[0];

  const weeklyHours = memberships.reduce((sum, m) => sum + Number(m.commitment_hours || 0), 0);

  async function rsvp(id) {
    try {
      await post(`/student/events/${id}/rsvp`, { status: 'going' });
      toast.good('RSVP recorded.');
      load();
    } catch (err) {
      toast.bad(err.message);
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{greeting()}, {user.full_name.split(' ')[0]}.</h1>
          <p>
            {today.length > 0
              ? `You have ${today.length} thing${today.length === 1 ? '' : 's'} on today.`
              : nextEvent
                ? `Nothing today. Next up: ${nextEvent.title} on ${formatDate(nextEvent.starts_at)}.`
                : 'Nothing on your calendar yet — join a club and it will fill up.'}
          </p>
        </div>
        <Link className="btn btn-primary" to="/catalog">Browse clubs</Link>
      </div>

      {/* ------------------------------------------------------ counters */}
      <div className="grid grid-4 section">
        <Link to="/my/clubs" className="stat-tile link" style={{ color: 'inherit' }}>
          <div className="v">{memberships.length}</div>
          <div className="k">Clubs joined</div>
        </Link>
        <Link to="/my/applications" className="stat-tile link" style={{ color: 'inherit' }}>
          <div className="v">{pending.length}</div>
          <div className="k">Applications open</div>
        </Link>
        <Link to="/my/calendar" className="stat-tile link" style={{ color: 'inherit' }}>
          <div className="v">{events.length}</div>
          <div className="k">Events in 2 weeks</div>
        </Link>
        <Link to="/messages" className="stat-tile link" style={{ color: 'inherit' }}>
          <div className="v">{unread}</div>
          <div className="k">Unread messages</div>
        </Link>
      </div>

      {/* ------------------------------------------------------ calendar */}
      <div className="section">
        <div className="section-head">
          <h2>Your week</h2>
          <Link className="small" to="/my/calendar">Full calendar →</Link>
        </div>
        <div className="week-strip">
          {week.map((d) => (
            <div key={d.date.toISOString()} className={`week-day${d.isToday ? ' today' : ''}`}>
              <div className="dow">{d.isToday ? 'Today' : DOW[d.date.getDay()]}</div>
              <div className="dnum">{d.date.getDate()}</div>
              {d.events.slice(0, 4).map((e) => (
                <Link key={e.id} to={`/club/${e.slug}`} className="week-pill"
                      style={{ borderLeftColor: `hsl(${e.logo_hue} 55% 45%)` }}>
                  <span className="wt">{formatTime(e.starts_at)}</span>
                  <span className="wc">{e.club_name}</span>
                </Link>
              ))}
              {d.events.length > 4 && (
                <div className="tiny faint" style={{ paddingLeft: 7 }}>
                  +{d.events.length - 4} more
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-2 section">
        {/* --------------------------------------------------- today */}
        <div className="card">
          <div className="card-head">
            Next up
            <span className="small muted">{weeklyHours.toFixed(0)} hrs/week committed</span>
          </div>
          <div className="card-list">
            {events.length === 0 && (
              <div className="card-body muted small">
                Nothing scheduled. Club meetings show up here once you join.
              </div>
            )}
            {events.slice(0, 5).map((e) => (
              <div className="lrow" key={e.id}>
                <ClubLogo club={{ name: e.club_name, logo_hue: e.logo_hue }} size="sm" />
                <div className="main">
                  <div className="t">{e.title}</div>
                  <div className="s">
                    {e.club_name} · {formatDateTime(e.starts_at)}
                    {e.location ? ` · ${e.location}` : ''}
                  </div>
                </div>
                {e.my_rsvp === 'going'
                  ? <Tag tone="tag-good">Going</Tag>
                  : <button className="btn btn-sm" onClick={() => rsvp(e.id)}>RSVP</button>}
              </div>
            ))}
          </div>
        </div>

        {/* ---------------------------------------------- applications */}
        <div className="card">
          <div className="card-head">
            Applications
            <Link className="small" to="/my/applications">See all</Link>
          </div>
          <div className="card-list">
            {applications.length === 0 && (
              <div className="card-body muted small">
                No applications yet. Selective clubs show an Apply button on their listing.
              </div>
            )}
            {[...pending, ...decided].slice(0, 5).map((a) => (
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
      </div>

      {/* ----------------------------------------------------- deadlines */}
      {deadlines.length > 0 && (
        <div className="section">
          <div className="section-head"><h2>Deadlines coming up</h2></div>
          <div className="card card-list">
            {deadlines.map((d) => {
              const left = daysUntil(d.application_deadline);
              return (
                <div className="lrow" key={d.id}>
                  <ClubLogo club={d} size="sm" />
                  <div className="main">
                    <div className="t"><Link to={`/club/${d.slug}`}>{d.name}</Link></div>
                    <div className="s">
                      {d.category}
                      {d.is_saved ? ' · saved to your list' : ' · matches your interests'}
                    </div>
                  </div>
                  <Tag tone={left <= 7 ? 'tag-bad' : left <= 21 ? 'tag-mid' : ''}>
                    {left <= 0 ? 'closes today' : `${left} day${left === 1 ? '' : 's'} left`}
                  </Tag>
                  <span className="small muted nowrap">
                    {formatDate(d.application_deadline, { year: 'numeric' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* -------------------------------------------------- announcements */}
      {announcements.length > 0 && (
        <div className="section">
          <div className="section-head"><h2>From your clubs</h2></div>
          <div className="card card-list">
            {announcements.slice(0, 4).map((a) => (
              <div className="lrow" key={a.id} style={{ alignItems: 'flex-start' }}>
                <ClubLogo club={{ name: a.club_name, logo_hue: a.logo_hue }} size="sm" />
                <div className="main">
                  <div className="t">{a.title}</div>
                  <div className="s">{a.body}</div>
                  <div className="tiny faint" style={{ marginTop: 5 }}>
                    {a.club_name} · {formatDate(a.posted_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------------------------------------- recommended */}
      {recommended.length > 0 && (
        <div className="section">
          <div className="section-head">
            <h2>You might like</h2>
            <span className="small muted">Based on the categories you are already in</span>
          </div>
          <div className="grid grid-3">
            {recommended.map((c) => (
              <Link key={c.id} to={`/club/${c.slug}`} className="card card-pad" style={{ color: 'inherit' }}>
                <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
                  <ClubLogo club={c} size="md" />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontWeight: 650 }}>{c.name}</div>
                    <div className="small muted" style={{ marginTop: 3 }}>{c.category}</div>
                  </div>
                </div>
                {c.tagline && (
                  <div className="small muted" style={{ marginTop: 12 }}>{c.tagline}</div>
                )}
                <div className="row" style={{ gap: 7, marginTop: 14 }}>
                  <Chip value={c.rating} label="rating" decimals={1} />
                  <Chip value={c.commitment_hours} label="hrs/wk" decimals={1} tone="chip-flat" />
                  <Chip value={c.member_count} label="members" decimals={0} tone="chip-flat" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {bookmarks.length > 0 && (
        <div className="section">
          <div className="section-head"><h2>Saved for later</h2></div>
          <div className="row-wrap">
            {bookmarks.map((b) => (
              <Link key={b.id} to={`/club/${b.slug}`} className="tag tag-cat">{b.name}</Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
