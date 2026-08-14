import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { del, get, post } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Chip, ClubBanner, ClubLogo, Empty, Loading, Modal, StatusTag, Tag,
  Avatar, band, formatDate, formatDateTime, useToast,
} from './ui';

/** Shared club detail view — used in the catalog's right pane and on /club/:slug. */
export default function ClubDetail({ slug, onClose }) {
  const { user, isStudent } = useAuth();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [applyOpen, setApplyOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    if (!slug) return;
    setLoading(true);
    get(`/clubs/${slug}`)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(load, [load]);

  if (loading) return <Loading label="Loading club…" />;
  if (!data) return <Empty title="Club not found" />;

  const { club, officers, events, announcements, questions, viewer, similar } = data;

  async function guard(fn) {
    if (!user) {
      toast.bad('Sign in with a student account first.');
      return;
    }
    if (!isStudent) {
      toast.bad('Officer accounts cannot join clubs — use your student account.');
      return;
    }
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      toast.bad(err.message);
    } finally {
      setBusy(false);
    }
  }

  const join = () =>
    guard(async () => {
      await post(`/student/clubs/${club.id}/join`);
      toast.good(`You joined ${club.name}.`);
      load();
    });

  const leave = () =>
    guard(async () => {
      await del(`/student/clubs/${club.id}/join`);
      toast(`You left ${club.name}.`);
      load();
    });

  const bookmark = () =>
    guard(async () => {
      const r = await post(`/student/clubs/${club.id}/bookmark`);
      toast(r.bookmarked ? 'Saved to your list.' : 'Removed from your list.');
      load();
    });

  const rsvp = (eventId) =>
    guard(async () => {
      await post(`/student/events/${eventId}/rsvp`, { status: 'going' });
      toast.good('RSVP recorded.');
      load();
    });

  const deadlineSoon =
    club.application_deadline &&
    new Date(club.application_deadline) - Date.now() < 14 * 86400000;

  return (
    <>
      <ClubBanner club={club} />
      <div className="detail-head">
        <div className="row" style={{ alignItems: 'flex-start', gap: 12 }}>
          <ClubLogo club={club} size="lg" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ lineHeight: 1.25 }}>{club.name}</h2>
            {club.tagline && <div className="small muted" style={{ marginTop: 3 }}>{club.tagline}</div>}
            <div className="row-wrap" style={{ marginTop: 8 }}>
              <Tag tone="tag-cat">{club.category}</Tag>
              {club.subcategory && <Tag>{club.subcategory}</Tag>}
              {club.founded_year && <Tag>est. {club.founded_year}</Tag>}
              {viewer.is_member && <Tag tone="tag-good">✓ Member</Tag>}
            </div>
          </div>
          {onClose && (
            <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">✕</button>
          )}
        </div>

        <div className="row" style={{ gap: 6, marginTop: 14 }}>
          <Chip value={club.rating} label="rating" decimals={1} />
          <Chip
            value={club.commitment_hours}
            label="hrs/wk"
            decimals={1}
            tone={`chip-${band(Number(club.commitment_hours), { good: 8, mid: 5, invert: true })}`}
          />
          <Chip value={club.member_count} label="members" decimals={0} tone="chip-flat" />
          <Chip
            value={club.selectivity}
            label="select."
            decimals={1}
            tone={`chip-${band(Number(club.selectivity), { good: 4.2, mid: 3, invert: true })}`}
          />
        </div>

        <div className="row" style={{ gap: 7, marginTop: 13, flexWrap: 'wrap' }}>
          {viewer.is_member ? (
            <button className="btn" onClick={leave} disabled={busy}>Leave club</button>
          ) : club.application_required ? (
            viewer.application ? (
              <span className="row" style={{ gap: 7 }}>
                <StatusTag status={viewer.application.status} />
                <span className="small muted">
                  applied {formatDate(viewer.application.submitted_at)}
                </span>
              </span>
            ) : (
              <button
                className="btn btn-primary"
                disabled={!club.applications_open || busy}
                onClick={() => (user && isStudent ? setApplyOpen(true) : toast.bad('Sign in with a student account to apply.'))}
              >
                {club.applications_open ? 'Apply' : 'Applications closed'}
              </button>
            )
          ) : (
            <button className="btn btn-primary" onClick={join} disabled={busy || !club.accepting_members}>
              {club.accepting_members ? 'Join club' : 'Not accepting members'}
            </button>
          )}

          <button className="btn" onClick={bookmark} disabled={busy}>
            {viewer.is_bookmarked ? '★ Saved' : '☆ Save'}
          </button>
          <button className="btn" onClick={() => (user && isStudent ? setMessageOpen(true) : toast.bad('Sign in with a student account to message officers.'))}>
            Message officers
          </button>
          <Link className="btn btn-ghost btn-sm" to={`/club/${club.slug}`}>Open full page ↗</Link>
        </div>

        {club.application_required && club.applications_open && club.application_deadline && (
          <div className={`alert ${deadlineSoon ? 'alert-bad' : 'alert-info'}`} style={{ marginTop: 12, marginBottom: 0 }}>
            Applications close <strong>{formatDate(club.application_deadline, { year: 'numeric' })}</strong>
            {deadlineSoon ? ' — that is soon.' : '.'}
          </div>
        )}
      </div>

      <div className="detail-body">
        <div className="detail-section">
          <h4>About</h4>
          <p style={{ margin: 0, lineHeight: 1.6 }}>{club.description}</p>
        </div>

        <div className="detail-section">
          <h4>The basics</h4>
          <dl className="kv">
            <dt>Meets</dt>
            <dd>
              {club.meeting_day
                ? `${club.meeting_day}s at ${club.meeting_time || 'TBD'}`
                : 'No standing meeting'}
            </dd>
            <dt>Where</dt>
            <dd>{club.meeting_location || '—'}</dd>
            <dt>Joining</dt>
            <dd>{club.application_required ? 'Application or audition required' : 'Open — just show up'}</dd>
            <dt>Contact</dt>
            <dd className="mono tiny">{club.contact_email}</dd>
            {club.instagram && (<><dt>Instagram</dt><dd>{club.instagram}</dd></>)}
          </dl>
          <div className="tiny faint" style={{ marginTop: 8 }}>
            Meeting times and contact details in this demo are sample data.
          </div>
        </div>

        {officers.length > 0 && (
          <div className="detail-section">
            <h4>Officers</h4>
            <div className="stack" style={{ gap: 7 }}>
              {officers.map((o, i) => (
                <div className="row" key={i} style={{ gap: 9 }}>
                  <Avatar name={o.full_name} hue={o.avatar_hue} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{o.full_name}</div>
                    <div className="tiny muted">
                      {o.title}{o.class_year ? ` · ’${String(o.class_year).slice(2)}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {events.length > 0 && (
          <div className="detail-section">
            <h4>Upcoming</h4>
            <div className="stack" style={{ gap: 6 }}>
              {events.slice(0, 6).map((e) => (
                <div className="event" key={e.id} style={{ marginBottom: 0 }}>
                  <div className="main">
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{e.title}</div>
                    <div className="tiny muted">
                      {formatDateTime(e.starts_at)}{e.location ? ` · ${e.location}` : ''}
                      {e.visibility === 'members_only' && ' · members only'}
                    </div>
                  </div>
                  {isStudent && (
                    <button className="btn btn-sm" onClick={() => rsvp(e.id)}>RSVP</button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {announcements.length > 0 && (
          <div className="detail-section">
            <h4>Announcements</h4>
            <div className="stack" style={{ gap: 9 }}>
              {announcements.slice(0, 4).map((a) => (
                <div key={a.id}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>
                    {a.pinned ? '📌 ' : ''}{a.title}
                  </div>
                  <div className="small muted">{a.body}</div>
                  <div className="tiny faint">{formatDate(a.posted_at)} · {a.posted_by_name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {similar.length > 0 && (
          <div className="detail-section">
            <h4>Similar clubs</h4>
            <div className="row-wrap">
              {similar.map((s) => (
                <Link key={s.slug} to={`/club/${s.slug}`} className="tag">{s.name}</Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {applyOpen && (
        <ApplyModal
          club={club}
          questions={questions}
          onClose={() => setApplyOpen(false)}
          onDone={() => { setApplyOpen(false); load(); }}
        />
      )}
      {messageOpen && (
        <MessageModal
          club={club}
          onClose={() => setMessageOpen(false)}
          onDone={() => { setMessageOpen(false); load(); }}
        />
      )}
    </>
  );
}

/* ------------------------------------------------------------- modals */

function ApplyModal({ club, questions, onClose, onDone }) {
  const toast = useToast();
  const [answers, setAnswers] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const wordCount = (t) => (t || '').trim().split(/\s+/).filter(Boolean).length;

  async function submit() {
    setBusy(true);
    setError('');
    try {
      await post(`/student/clubs/${club.id}/apply`, { answers });
      toast.good(`Application submitted to ${club.name}.`);
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={`Apply to ${club.name}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit} disabled={busy}>
            {busy ? 'Submitting…' : 'Submit application'}
          </button>
        </>
      }
    >
      {club.application_deadline && (
        <div className="alert alert-info">
          Deadline: {formatDate(club.application_deadline, { year: 'numeric' })}. You can withdraw
          any time before a decision is made.
        </div>
      )}
      {error && <div className="alert alert-bad">{error}</div>}

      {questions.length === 0 && (
        <p className="muted">This club has not published questions yet — submit to register interest.</p>
      )}

      {questions.map((q) => (
        <div className="field" key={q.id}>
          <label htmlFor={`q${q.id}`}>
            {q.prompt}{q.is_required ? '' : ' (optional)'}
          </label>
          {q.input_type === 'short_text' ? (
            <input
              id={`q${q.id}`}
              className="input"
              value={answers[q.id] || ''}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
            />
          ) : (
            <textarea
              id={`q${q.id}`}
              className="textarea"
              value={answers[q.id] || ''}
              onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
            />
          )}
          {q.max_words && (
            <span className="hint" style={{ color: wordCount(answers[q.id]) > q.max_words ? 'var(--bad)' : undefined }}>
              {wordCount(answers[q.id])} / {q.max_words} words
            </span>
          )}
        </div>
      ))}
    </Modal>
  );
}

function MessageModal({ club, onClose, onDone }) {
  const toast = useToast();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function send() {
    setBusy(true);
    setError('');
    try {
      await post('/messages/threads', { club_id: club.id, subject: subject || 'General question', body });
      toast.good('Message sent to the club officers.');
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={`Message ${club.name}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={send} disabled={busy || !body.trim()}>
            {busy ? 'Sending…' : 'Send'}
          </button>
        </>
      }
    >
      <p className="small muted" style={{ marginTop: 0 }}>
        This goes to every officer of {club.name}. Whoever replies is named on their reply.
      </p>
      {error && <div className="alert alert-bad">{error}</div>}
      <div className="field">
        <label htmlFor="subj">Subject</label>
        <input
          id="subj"
          className="input"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="General question"
        />
      </div>
      <div className="field">
        <label htmlFor="msg">Message</label>
        <textarea
          id="msg"
          className="textarea"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Hi! I'm a first-year interested in joining — is it too late to get involved this semester?"
        />
      </div>
    </Modal>
  );
}
