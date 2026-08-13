import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { del, get, patch, post } from '../../api';
import {
  Avatar, ClubLogo, Empty, Loading, Modal, STATUS_LABELS, StatusTag, Tag,
  formatDate, formatDateTime, useToast,
} from '../../components/ui';

const TABS = [
  ['overview', 'Overview'],
  ['applications', 'Applications'],
  ['members', 'Members'],
  ['events', 'Events & announcements'],
  ['listing', 'Listing'],
];

export default function OfficerClub() {
  const { clubId } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'overview';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    get(`/officer/clubs/${clubId}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [clubId]);

  useEffect(load, [load]);

  if (loading) return <Loading />;
  if (!data) return <Empty title="You do not manage this club" action={<Link className="btn" to="/officer">Back to your clubs</Link>} />;

  const { club, stats } = data;

  return (
    <div className="page-wide">
      <div className="page-head">
        <div className="row" style={{ gap: 13 }}>
          <ClubLogo club={club} size="lg" />
          <div>
            <h1>{club.name}</h1>
            <p>
              You are {data.my_title} · <Link to={`/club/${club.slug}`}>view public listing ↗</Link>
            </p>
          </div>
        </div>
        <Link className="btn btn-ghost btn-sm" to="/officer">← All clubs</Link>
      </div>

      <div className="tabs">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            className={tab === key ? 'on' : ''}
            onClick={() => setParams({ tab: key }, { replace: true })}
          >
            {label}
            {key === 'applications' && stats.new_applications > 0 && (
              <span className="nav-count" style={{ background: 'var(--mid)' }}>{stats.new_applications}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview data={data} />}
      {tab === 'applications' && <Applications clubId={clubId} onChanged={load} />}
      {tab === 'members' && <Members clubId={clubId} />}
      {tab === 'events' && <EventsTab data={data} clubId={clubId} onChanged={load} />}
      {tab === 'listing' && <Listing club={club} clubId={clubId} onChanged={load} />}
    </div>
  );
}

/* ---------------------------------------------------------- overview */

function Overview({ data }) {
  const { stats, classBreakdown, officers, events } = data;
  const maxClass = Math.max(1, ...classBreakdown.map((c) => c.count));

  return (
    <>
      <div className="grid grid-4 section">
        <div className="stat-tile"><div className="v">{stats.members}</div><div className="k">Active members</div></div>
        <div className="stat-tile"><div className="v">{stats.new_applications}</div><div className="k">New applications</div></div>
        <div className="stat-tile"><div className="v">{stats.in_review + stats.interviewing}</div><div className="k">In review / interview</div></div>
        <div className="stat-tile"><div className="v">{stats.bookmarks}</div><div className="k">Students watching</div></div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-head">Members by class year</div>
          <div className="card-body">
            {classBreakdown.length === 0 && <div className="muted small">No class year data yet.</div>}
            {classBreakdown.map((c) => (
              <div key={c.class_year} className="row" style={{ gap: 10, marginBottom: 7 }}>
                <div className="small mono" style={{ width: 42 }}>{c.class_year}</div>
                <div style={{ flex: 1, height: 9, background: 'var(--surface-2)', borderRadius: 5 }}>
                  <div
                    style={{
                      width: `${(c.count / maxClass) * 100}%`,
                      height: '100%',
                      background: 'var(--primary)',
                      borderRadius: 5,
                    }}
                  />
                </div>
                <div className="small muted" style={{ width: 28, textAlign: 'right' }}>{c.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head">Decisions this cycle</div>
          <div className="card-body">
            <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
              <Tag tone="tag-good">{stats.accepted} accepted</Tag>
              <Tag tone="tag-bad">{stats.rejected} not accepted</Tag>
              <Tag tone="tag-mid">{stats.in_review} under review</Tag>
              <Tag tone="tag-cat">{stats.interviewing} at interview</Tag>
            </div>
            <div className="small muted" style={{ marginTop: 12 }}>
              {stats.accepted + stats.rejected > 0
                ? `Acceptance rate ${Math.round((stats.accepted / (stats.accepted + stats.rejected)) * 100)}% of decided applications.`
                : 'No final decisions recorded yet.'}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head">Officer team</div>
          <div className="card-list">
            {officers.map((o) => (
              <div className="lrow" key={o.id}>
                <Avatar name={o.full_name} hue={o.avatar_hue} />
                <div className="main">
                  <div className="t">{o.full_name}</div>
                  <div className="s">{o.title} · {o.email}</div>
                </div>
                {o.is_primary === 1 && <Tag tone="tag-cat">Primary</Tag>}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head">Next events</div>
          <div className="card-list">
            {events.length === 0 && <div className="card-body muted small">Nothing scheduled.</div>}
            {events.slice(0, 6).map((e) => (
              <div className="lrow" key={e.id}>
                <div className="main">
                  <div className="t">{e.title}</div>
                  <div className="s">{formatDateTime(e.starts_at)}</div>
                </div>
                <Tag>{e.going_count} going</Tag>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------ applications */

const FILTERS = [
  ['submitted', 'New'],
  ['under_review', 'Under review'],
  ['interview', 'Interview'],
  ['accepted', 'Accepted'],
  ['rejected', 'Not accepted'],
  ['all', 'All'],
];

function Applications({ clubId, onChanged }) {
  const toast = useToast();
  const [status, setStatus] = useState('submitted');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    get(`/officer/clubs/${clubId}/applications?status=${status}`)
      .then((d) => setRows(d.applications))
      .finally(() => setLoading(false));
  }, [clubId, status]);

  useEffect(load, [load]);

  return (
    <>
      <div className="row" style={{ gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {FILTERS.map(([key, label]) => (
          <button
            key={key}
            className={`btn btn-sm${status === key ? ' btn-primary' : ''}`}
            onClick={() => setStatus(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <Empty title="Nothing in this queue">
          {status === 'submitted'
            ? 'No new applications waiting. Nice work.'
            : 'Try another filter.'}
        </Empty>
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Year</th>
                <th>Major</th>
                <th>College</th>
                <th>Submitted</th>
                <th>Status</th>
                <th>Score</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div className="row" style={{ gap: 8 }}>
                      <Avatar name={a.full_name} hue={a.avatar_hue} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{a.full_name}</div>
                        <div className="tiny muted">{a.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{a.class_year || '—'}</td>
                  <td className="small">{a.major || '—'}</td>
                  <td className="small">{a.residential_college || '—'}</td>
                  <td className="small nowrap">{formatDate(a.submitted_at)}</td>
                  <td><StatusTag status={a.status} /></td>
                  <td className="mono">{a.rating ? `${a.rating}/5` : '—'}</td>
                  <td>
                    <button className="btn btn-sm btn-primary" onClick={() => setOpen(a.id)}>Review</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <ReviewModal
          applicationId={open}
          onClose={() => setOpen(null)}
          onSaved={() => {
            setOpen(null);
            load();
            onChanged();
            toast.good('Decision saved.');
          }}
        />
      )}
    </>
  );
}

function ReviewModal({ applicationId, onClose, onSaved }) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [note, setNote] = useState('');
  const [internal, setInternal] = useState('');
  const [rating, setRating] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    get(`/officer/applications/${applicationId}`).then((d) => {
      setData(d);
      setNote(d.application.decision_note || '');
      setInternal(d.application.internal_note || '');
      setRating(d.application.rating || '');
    });
  }, [applicationId]);

  async function decide(status) {
    setBusy(true);
    try {
      await patch(`/officer/applications/${applicationId}`, {
        status,
        decision_note: note || null,
        internal_note: internal || null,
        rating: rating ? Number(rating) : null,
      });
      onSaved();
    } catch (err) {
      toast.bad(err.message);
      setBusy(false);
    }
  }

  if (!data) {
    return <Modal title="Application" onClose={onClose}><Loading /></Modal>;
  }

  const a = data.application;

  return (
    <Modal
      title={`${a.full_name} — ${a.club_name}`}
      onClose={onClose}
      wide
      footer={
        <>
          <button className="btn" onClick={() => decide('under_review')} disabled={busy}>Mark under review</button>
          <button className="btn" onClick={() => decide('interview')} disabled={busy}>Move to interview</button>
          <button className="btn btn-danger" onClick={() => decide('rejected')} disabled={busy}>Reject</button>
          <button className="btn btn-good" onClick={() => decide('accepted')} disabled={busy}>Accept</button>
        </>
      }
    >
      <div className="row" style={{ gap: 12, marginBottom: 14 }}>
        <Avatar name={a.full_name} hue={a.avatar_hue} large />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 650 }}>
            {a.full_name}{a.pronouns ? ` (${a.pronouns})` : ''}
          </div>
          <div className="small muted">
            {a.class_year || '—'} · {a.major || 'Major undeclared'} · {a.residential_college || '—'}
          </div>
          <div className="tiny muted">{a.email}</div>
        </div>
        <StatusTag status={a.status} />
      </div>

      {a.bio && (
        <div className="small" style={{ marginBottom: 14, padding: 10, background: 'var(--surface-2)', borderRadius: 6 }}>
          {a.bio}
        </div>
      )}

      {data.other_memberships.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div className="tiny faint" style={{ marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
            Also a member of
          </div>
          <div className="row-wrap">
            {data.other_memberships.map((m) => <Tag key={m.slug}>{m.name}</Tag>)}
          </div>
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
        {data.answers.map((ans) => (
          <div key={ans.question_id} style={{ marginBottom: 17 }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{ans.prompt}</div>
            <div className="small" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {ans.answer || <span className="faint">— no answer —</span>}
            </div>
          </div>
        ))}
      </div>

      <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
        <div className="field">
          <label>Score (officers only)</label>
          <select className="select" value={rating} onChange={(e) => setRating(e.target.value)}>
            <option value="">Not scored</option>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} / 5</option>)}
          </select>
        </div>
        <div className="field">
          <label>Internal note</label>
          <textarea
            className="textarea"
            style={{ minHeight: 64 }}
            value={internal}
            onChange={(e) => setInternal(e.target.value)}
            placeholder="Only officers of this club can see this. The applicant never does."
          />
        </div>
        <div className="field">
          <label>Message to the applicant</label>
          <textarea
            className="textarea"
            style={{ minHeight: 74 }}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Shown to the applicant with your decision."
          />
          <span className="hint">Accepting also adds them to your roster automatically.</span>
        </div>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------ members */

function Members({ clubId }) {
  const toast = useToast();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    get(`/officer/clubs/${clubId}/members`)
      .then((d) => setMembers(d.members))
      .finally(() => setLoading(false));
  }, [clubId]);

  useEffect(load, [load]);

  async function update(id, body) {
    try {
      await patch(`/officer/members/${id}`, body);
      load();
    } catch (err) {
      toast.bad(err.message);
    }
  }

  async function remove(id, name) {
    if (!confirm(`Remove ${name} from the roster?`)) return;
    try {
      await del(`/officer/members/${id}`);
      toast('Member removed.');
      load();
    } catch (err) {
      toast.bad(err.message);
    }
  }

  if (loading) return <Loading />;

  const shown = members.filter((m) =>
    `${m.full_name} ${m.email} ${m.major || ''} ${m.residential_college || ''}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  const active = members.filter((m) => m.status === 'active').length;

  return (
    <>
      <div className="row" style={{ marginBottom: 13, gap: 10 }}>
        <input
          className="search-input"
          style={{ maxWidth: 320 }}
          placeholder="Search members…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="small muted">{active} active · {members.length} total on the roster</span>
        <button
          className="btn btn-sm right"
          onClick={() => {
            const csv = [
              ['Name', 'Email', 'Class', 'College', 'Major', 'Role', 'Status', 'Joined'].join(','),
              ...shown.map((m) =>
                [m.full_name, m.email, m.class_year, m.residential_college, m.major, m.role, m.status, m.joined_at]
                  .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`)
                  .join(',')
              ),
            ].join('\n');
            navigator.clipboard.writeText(csv);
            toast.good('Roster copied to your clipboard as CSV.');
          }}
        >
          Copy roster as CSV
        </button>
      </div>

      {shown.length === 0 ? (
        <Empty title="No members match" />
      ) : (
        <div className="card table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Year</th>
                <th>College</th>
                <th>Major</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Events</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {shown.map((m) => (
                <tr key={m.id}>
                  <td>
                    <div className="row" style={{ gap: 8 }}>
                      <Avatar name={m.full_name} hue={m.avatar_hue} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{m.full_name}</div>
                        <div className="tiny muted">{m.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>{m.class_year || '—'}</td>
                  <td className="small">{m.residential_college || '—'}</td>
                  <td className="small">{m.major || '—'}</td>
                  <td>
                    <input
                      className="input"
                      style={{ width: 130, padding: '3px 7px', fontSize: 12.5 }}
                      defaultValue={m.role}
                      onBlur={(e) => e.target.value !== m.role && update(m.id, { role: e.target.value })}
                    />
                  </td>
                  <td className="small nowrap">{formatDate(m.joined_at, { year: 'numeric' })}</td>
                  <td className="mono">{m.events_attended}</td>
                  <td>
                    <select
                      className="select"
                      style={{ width: 108, padding: '3px 6px', fontSize: 12.5 }}
                      value={m.status}
                      onChange={(e) => update(m.id, { status: e.target.value })}
                    >
                      {['active', 'inactive', 'alumni', 'removed'].map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => remove(m.id, m.full_name)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

/* -------------------------------------------------- events + notices */

function EventsTab({ data, clubId, onChanged }) {
  const toast = useToast();
  const [showEvent, setShowEvent] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);
  const [rsvps, setRsvps] = useState(null);

  async function removeEvent(id) {
    if (!confirm('Delete this event?')) return;
    await del(`/officer/events/${id}`);
    toast('Event deleted.');
    onChanged();
  }

  async function removeAnnouncement(id) {
    if (!confirm('Delete this announcement?')) return;
    await del(`/officer/announcements/${id}`);
    toast('Announcement deleted.');
    onChanged();
  }

  return (
    <div className="grid grid-2">
      <div className="card">
        <div className="card-head">
          Events
          <button className="btn btn-sm btn-primary" onClick={() => setShowEvent(true)}>+ New event</button>
        </div>
        <div className="card-list">
          {data.events.length === 0 && <div className="card-body muted small">No events scheduled.</div>}
          {data.events.map((e) => (
            <div className="lrow" key={e.id}>
              <div className="main">
                <div className="t">{e.title}</div>
                <div className="s">
                  {formatDateTime(e.starts_at)}{e.location ? ` · ${e.location}` : ''}
                </div>
                <div className="row-wrap" style={{ marginTop: 5 }}>
                  <Tag>{e.event_type.replace('_', ' ')}</Tag>
                  {e.visibility === 'members_only' && <Tag tone="tag-mid">members only</Tag>}
                  <Tag tone="tag-good">{e.going_count} going</Tag>
                </div>
              </div>
              <button
                className="btn btn-sm"
                onClick={async () => setRsvps({ event: e, list: (await get(`/officer/events/${e.id}/rsvps`)).rsvps })}
              >
                Who's coming
              </button>
              <button className="btn btn-sm btn-danger" onClick={() => removeEvent(e.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          Announcements
          <button className="btn btn-sm btn-primary" onClick={() => setShowAnnouncement(true)}>+ New post</button>
        </div>
        <div className="card-list">
          {data.announcements.length === 0 && <div className="card-body muted small">Nothing posted yet.</div>}
          {data.announcements.map((a) => (
            <div className="lrow" key={a.id} style={{ alignItems: 'flex-start' }}>
              <div className="main">
                <div className="t">{a.pinned ? '📌 ' : ''}{a.title}</div>
                <div className="s">{a.body}</div>
                <div className="tiny faint" style={{ marginTop: 4 }}>
                  {formatDate(a.posted_at)} · {a.posted_by_name}
                </div>
              </div>
              <button className="btn btn-sm btn-danger" onClick={() => removeAnnouncement(a.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>

      {showEvent && (
        <EventModal
          clubId={clubId}
          onClose={() => setShowEvent(false)}
          onSaved={() => { setShowEvent(false); onChanged(); toast.good('Event created.'); }}
        />
      )}
      {showAnnouncement && (
        <AnnouncementModal
          clubId={clubId}
          onClose={() => setShowAnnouncement(false)}
          onSaved={() => { setShowAnnouncement(false); onChanged(); toast.good('Announcement posted.'); }}
        />
      )}
      {rsvps && (
        <Modal title={`RSVPs — ${rsvps.event.title}`} onClose={() => setRsvps(null)}>
          {rsvps.list.length === 0 && <p className="muted">No RSVPs yet.</p>}
          {rsvps.list.map((r, i) => (
            <div className="lrow" key={i}>
              <Avatar name={r.full_name} hue={r.avatar_hue} />
              <div className="main">
                <div className="t">{r.full_name}</div>
                <div className="s">{r.email}{r.class_year ? ` · ’${String(r.class_year).slice(2)}` : ''}</div>
              </div>
              <Tag tone={r.status === 'going' ? 'tag-good' : ''}>{r.status.replace('_', ' ')}</Tag>
            </div>
          ))}
        </Modal>
      )}
    </div>
  );
}

function EventModal({ clubId, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    title: '', description: '', event_type: 'meeting',
    starts_at: '', ends_at: '', location: '', visibility: 'public',
  });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save() {
    setBusy(true);
    try {
      await post(`/officer/clubs/${clubId}/events`, form);
      onSaved();
    } catch (err) {
      toast.bad(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal
      title="New event"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={busy || !form.title || !form.starts_at}>
            Create event
          </button>
        </>
      }
    >
      <div className="field">
        <label>Title</label>
        <input className="input" value={form.title} onChange={set('title')} placeholder="Weekly meeting" />
      </div>
      <div className="field">
        <label>Description</label>
        <textarea className="textarea" style={{ minHeight: 70 }} value={form.description} onChange={set('description')} />
      </div>
      <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Starts</label>
          <input className="input" type="datetime-local" value={form.starts_at} onChange={set('starts_at')} />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Ends</label>
          <input className="input" type="datetime-local" value={form.ends_at} onChange={set('ends_at')} />
        </div>
      </div>
      <div className="field">
        <label>Location</label>
        <input className="input" value={form.location} onChange={set('location')} placeholder="WLH 208" />
      </div>
      <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
        <div className="field" style={{ flex: 1 }}>
          <label>Type</label>
          <select className="select" value={form.event_type} onChange={set('event_type')}>
            {['meeting', 'rehearsal', 'performance', 'info_session', 'audition', 'social', 'service', 'game', 'workshop', 'deadline'].map((t) => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Visibility</label>
          <select className="select" value={form.visibility} onChange={set('visibility')}>
            <option value="public">Public — anyone can see it</option>
            <option value="members_only">Members only</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}

function AnnouncementModal({ clubId, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({ title: '', body: '', pinned: false });
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await post(`/officer/clubs/${clubId}/announcements`, form);
      onSaved();
    } catch (err) {
      toast.bad(err.message);
      setBusy(false);
    }
  }

  return (
    <Modal
      title="New announcement"
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={busy || !form.title || !form.body}>Post</button>
        </>
      }
    >
      <div className="field">
        <label>Title</label>
        <input className="input" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
      </div>
      <div className="field">
        <label>Body</label>
        <textarea className="textarea" value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
      </div>
      <label className="checkbox">
        <input type="checkbox" checked={form.pinned} onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))} />
        Pin to the top of the club page
      </label>
    </Modal>
  );
}

/* ------------------------------------------------------------ listing */

function Listing({ club, clubId, onChanged }) {
  const toast = useToast();
  const [form, setForm] = useState({
    tagline: club.tagline || '',
    description: club.description || '',
    meeting_day: club.meeting_day || '',
    meeting_time: club.meeting_time || '',
    meeting_location: club.meeting_location || '',
    website: club.website || '',
    instagram: club.instagram || '',
    application_required: !!club.application_required,
    applications_open: !!club.applications_open,
    application_deadline: club.application_deadline || '',
    accepting_members: !!club.accepting_members,
  });
  const [busy, setBusy] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');

  const loadQuestions = useCallback(() => {
    get(`/officer/clubs/${clubId}/questions`).then((d) => setQuestions(d.questions));
  }, [clubId]);
  useEffect(loadQuestions, [loadQuestions]);

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await patch(`/officer/clubs/${clubId}`, form);
      toast.good('Listing updated.');
      onChanged();
    } catch (err) {
      toast.bad(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function addQuestion() {
    if (!newQuestion.trim()) return;
    await post(`/officer/clubs/${clubId}/questions`, { prompt: newQuestion.trim(), max_words: 250 });
    setNewQuestion('');
    loadQuestions();
    toast.good('Question added.');
  }

  return (
    <div className="grid grid-2">
      <form className="card card-pad" onSubmit={save}>
        <h3 style={{ marginBottom: 14 }}>Public listing</h3>
        <div className="field">
          <label>Tagline</label>
          <input className="input" value={form.tagline} onChange={set('tagline')} />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea className="textarea" style={{ minHeight: 130 }} value={form.description} onChange={set('description')} />
        </div>
        <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Meeting day</label>
            <select className="select" value={form.meeting_day} onChange={set('meeting_day')}>
              <option value="">None</option>
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Meeting time</label>
            <input className="input" value={form.meeting_time} onChange={set('meeting_time')} placeholder="7:00 PM" />
          </div>
        </div>
        <div className="field">
          <label>Meeting location</label>
          <input className="input" value={form.meeting_location} onChange={set('meeting_location')} />
        </div>
        <div className="row" style={{ gap: 10, alignItems: 'flex-start' }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Website</label>
            <input className="input" value={form.website} onChange={set('website')} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Instagram</label>
            <input className="input" value={form.instagram} onChange={set('instagram')} />
          </div>
        </div>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save listing'}</button>
      </form>

      <div>
        <div className="card card-pad section">
          <h3 style={{ marginBottom: 12 }}>Recruiting</h3>
          <label className="checkbox" style={{ marginBottom: 9 }}>
            <input type="checkbox" checked={form.accepting_members} onChange={set('accepting_members')} />
            Accepting new members
          </label>
          <label className="checkbox" style={{ marginBottom: 9 }}>
            <input type="checkbox" checked={form.application_required} onChange={set('application_required')} />
            Require an application (otherwise students join instantly)
          </label>
          <label className="checkbox" style={{ marginBottom: 12 }}>
            <input type="checkbox" checked={form.applications_open} onChange={set('applications_open')} />
            Applications are open right now
          </label>
          <div className="field">
            <label>Application deadline</label>
            <input className="input" type="date" value={form.application_deadline || ''} onChange={set('application_deadline')} />
          </div>
          <button className="btn btn-primary" onClick={save} disabled={busy}>Save recruiting settings</button>
        </div>

        <div className="card">
          <div className="card-head">Application questions</div>
          <div className="card-list">
            {questions.length === 0 && (
              <div className="card-body muted small">
                No questions yet. Applicants would submit an empty application.
              </div>
            )}
            {questions.map((q) => (
              <div className="lrow" key={q.id} style={{ alignItems: 'flex-start' }}>
                <div className="main">
                  <div className="t" style={{ fontWeight: 500 }}>{q.prompt}</div>
                  <div className="s">
                    {q.input_type.replace('_', ' ')}
                    {q.max_words ? ` · ${q.max_words} words max` : ''}
                    {q.is_required ? ' · required' : ' · optional'}
                  </div>
                </div>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={async () => {
                    await del(`/officer/questions/${q.id}`);
                    loadQuestions();
                    toast('Question removed.');
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="card-body row" style={{ gap: 8 }}>
            <input
              className="input"
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Add a question applicants must answer…"
            />
            <button className="btn btn-primary" onClick={addQuestion}>Add</button>
          </div>
        </div>
      </div>
    </div>
  );
}
