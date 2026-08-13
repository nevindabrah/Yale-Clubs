import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { get, post } from '../api';
import { Avatar, ClubLogo, Composer, Empty, Loading, relativeTime, useToast } from './ui';

/**
 * Shared inbox for both portals. `side` decides whose name headlines each
 * thread — students see the club, officers see the student.
 */
export default function MessageCenter({ side }) {
  const toast = useToast();
  const [threads, setThreads] = useState([]);
  const [active, setActive] = useState(null);
  const [thread, setThread] = useState(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadThreads = () =>
    get('/messages/threads').then((d) => {
      setThreads(d.threads);
      setActive((cur) => cur ?? d.threads[0]?.id ?? null);
    });

  useEffect(() => {
    loadThreads().finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!active) return;
    get(`/messages/threads/${active}`)
      .then(setThread)
      .catch((err) => toast.bad(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [thread]);

  async function send() {
    if (!draft.trim()) return;
    setSending(true);
    try {
      await post(`/messages/threads/${active}/reply`, { body: draft });
      setDraft('');
      setThread(await get(`/messages/threads/${active}`));
      loadThreads();
    } catch (err) {
      toast.bad(err.message);
    } finally {
      setSending(false);
    }
  }

  if (loading) return <Loading />;

  if (threads.length === 0) {
    return (
      <Empty
        title="No conversations yet"
        action={side === 'student' ? <Link className="btn btn-primary" to="/catalog">Browse clubs</Link> : null}
      >
        {side === 'student'
          ? 'Open any club and choose “Message officers” to start a conversation.'
          : 'When a student messages one of your clubs, the conversation shows up here.'}
      </Empty>
    );
  }

  return (
    <div className="msg-layout">
      <div className="thread-list">
        {threads.map((t) => (
          <div
            key={t.id}
            className={`thread-item${active === t.id ? ' on' : ''}`}
            onClick={() => setActive(t.id)}
          >
            <div className="row" style={{ gap: 8, marginBottom: 4 }}>
              {side === 'student' ? (
                <ClubLogo club={{ name: t.club_name, logo_hue: t.logo_hue }} size="sm" />
              ) : (
                <Avatar name={t.student_name} hue={t.student_hue} />
              )}
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 640, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {side === 'student' ? t.club_name : t.student_name}
                </div>
                <div className="tiny faint">
                  {side === 'student'
                    ? t.subject
                    : `${t.club_name}${t.student_class_year ? ` · ’${String(t.student_class_year).slice(2)}` : ''}`}
                </div>
              </div>
              {t.unread > 0 && <span className="nav-count" style={{ background: 'var(--primary)' }}>{t.unread}</span>}
            </div>
            <div className="preview">{t.preview}</div>
            <div className="tiny faint" style={{ marginTop: 3 }}>{relativeTime(t.last_message_at)}</div>
          </div>
        ))}
      </div>

      <div className="thread-pane">
        {!thread ? (
          <Loading />
        ) : (
          <>
            <div className="thread-head">
              <div className="row" style={{ gap: 10 }}>
                <ClubLogo club={{ name: thread.thread.club_name, logo_hue: thread.thread.logo_hue }} size="md" />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 650 }}>
                    {side === 'student' ? thread.thread.club_name : thread.thread.student_name}
                  </div>
                  <div className="tiny muted">
                    {thread.thread.subject}
                    {side === 'officer' && ` · ${thread.thread.club_name} · ${thread.thread.student_email}`}
                  </div>
                </div>
                <Link className="btn btn-sm" to={`/club/${thread.thread.club_slug}`}>Club page</Link>
              </div>
            </div>

            <div className="thread-msgs">
              {thread.messages.map((m) => {
                const mine = m.sender_side === side;
                return (
                  <div key={m.id} className={`bubble ${mine ? 'me' : 'them'}`}>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{m.body}</div>
                    <div className="meta">
                      {mine ? 'You' : m.sender_name}
                      {!mine && m.sender_side === 'officer' && ' (officer)'} · {relativeTime(m.sent_at)}
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <Composer
              value={draft}
              onChange={setDraft}
              onSend={send}
              disabled={sending}
              placeholder={side === 'officer' ? 'Reply as an officer…' : 'Write a message…'}
            />
          </>
        )}
      </div>
    </div>
  );
}
