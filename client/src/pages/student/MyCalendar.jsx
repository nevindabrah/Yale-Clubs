import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { get, post } from '../../api';
import { ClubLogo, Empty, Loading, Tag, formatTime, useToast } from '../../components/ui';

const TYPE_TONE = {
  deadline: 'tag-bad',
  performance: 'tag-cat',
  audition: 'tag-mid',
  social: 'tag-good',
};

export default function MyCalendar() {
  const toast = useToast();
  const [events, setEvents] = useState([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  const load = (d) => {
    setLoading(true);
    get(`/student/calendar?days=${d}`)
      .then((r) => setEvents(r.events))
      .finally(() => setLoading(false));
  };
  useEffect(() => load(days), [days]);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const e of events) {
      const key = new Date(e.starts_at).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(e);
    }
    return [...map.entries()];
  }, [events]);

  async function rsvp(id, status) {
    try {
      await post(`/student/events/${id}/rsvp`, { status });
      toast.good(status === 'going' ? 'Marked as going.' : 'RSVP updated.');
      load(days);
    } catch (err) {
      toast.bad(err.message);
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Calendar</h1>
          <p>Meetings and events from every club you belong to.</p>
        </div>
        <div className="segmented" style={{ width: 250 }}>
          {[7, 30, 90].map((d) => (
            <button key={d} className={days === d ? 'on' : ''} onClick={() => setDays(d)}>
              {d} days
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : grouped.length === 0 ? (
        <Empty title="Nothing scheduled" action={<Link className="btn btn-primary" to="/catalog">Join a club</Link>}>
          Once you join clubs, their meetings and events land here automatically.
        </Empty>
      ) : (
        grouped.map(([day, list]) => (
          <div className="day-group" key={day}>
            <div className="day-label">
              {new Date(day).toLocaleDateString(undefined, {
                weekday: 'long', month: 'long', day: 'numeric',
              })}
            </div>
            {list.map((e) => (
              <div className="event" key={e.id}>
                <div className="time">{formatTime(e.starts_at)}</div>
                <ClubLogo club={{ name: e.club_name, logo_hue: e.logo_hue }} size="sm" />
                <div className="main">
                  <div style={{ fontWeight: 600 }}>{e.title}</div>
                  <div className="tiny muted">
                    <Link to={`/club/${e.slug}`}>{e.club_name}</Link>
                    {e.location ? ` · ${e.location}` : ''}
                  </div>
                </div>
                <Tag tone={TYPE_TONE[e.event_type] || ''}>{e.event_type.replace('_', ' ')}</Tag>
                {e.my_rsvp === 'going' ? (
                  <button className="btn btn-sm" onClick={() => rsvp(e.id, 'not_going')}>✓ Going</button>
                ) : (
                  <button className="btn btn-sm" onClick={() => rsvp(e.id, 'going')}>RSVP</button>
                )}
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
