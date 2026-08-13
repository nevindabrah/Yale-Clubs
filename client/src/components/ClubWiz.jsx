import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { get, post } from '../api';
import { useAuth } from '../context/AuthContext';
import { Composer } from './ui';

const STUDENT_PROMPTS = [
  'What should I join if I like writing?',
  'What deadlines are coming up?',
  "What's on my calendar this week?",
  'Show me low-commitment clubs',
];
const OFFICER_PROMPTS = [
  'How many applications am I sitting on?',
  'Summarize my clubs',
  'What events do I have coming up?',
];

/** Very small markdown renderer: **bold** and line breaks are all we emit. */
function renderText(text) {
  return text.split('\n').map((line, i) => (
    <span key={i}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={j}>{part.slice(2, -2)}</strong>
          : <span key={j}>{part}</span>
      )}
      {i < text.split('\n').length - 1 && <br />}
    </span>
  ));
}

export default function ClubWiz() {
  const { user, isOfficer } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!open || mode) return;
    get('/clubwiz/status').then((s) => setMode(s.mode)).catch(() => setMode('offline'));
  }, [open, mode]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages, busy]);

  // Not for signed-out visitors, and never on top of the messaging UI.
  if (!user) return null;
  if (location.pathname === '/messages' || location.pathname === '/officer/inbox') return null;

  async function send(textOverride) {
    const text = (textOverride ?? draft).trim();
    if (!text || busy) return;

    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setDraft('');
    setBusy(true);
    try {
      const r = await post('/clubwiz', {
        messages: next.map(({ role, content }) => ({ role, content })),
      });
      setMessages([
        ...next,
        { role: 'assistant', content: r.reply, tools: r.tools_used, note: r.note },
      ]);
      if (r.mode) setMode(r.mode);
    } catch (err) {
      setMessages([...next, { role: 'assistant', content: err.message, error: true }]);
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button className="wiz-fab" onClick={() => setOpen(true)} aria-label="Open ClubWiz">
        <span className="spark" aria-hidden="true">✦</span> ClubWiz
      </button>
    );
  }

  const suggestions = isOfficer ? OFFICER_PROMPTS : STUDENT_PROMPTS;

  return (
    <div className="wiz-panel" role="dialog" aria-label="ClubWiz assistant">
      <div className="wiz-head">
        <span className="spark" aria-hidden="true" style={{ fontSize: 20 }}>✦</span>
        <div>
          <div className="t">ClubWiz</div>
          <div className="s">
            {mode === 'live'
              ? 'Ask about clubs, deadlines or your schedule'
              : mode === 'offline'
                ? 'Catalog lookup mode — no AI key configured'
                : 'Starting up…'}
          </div>
        </div>
        <button className="nav-icon-btn" onClick={() => setOpen(false)} aria-label="Close ClubWiz">✕</button>
      </div>

      <div className="wiz-body">
        {messages.length === 0 && (
          <div className="wiz-msg wiz">
            Hi {user.full_name.split(' ')[0]} — I can search all 128 Yale clubs, check application
            deadlines, and look at your own clubs and calendar. What are you after?
            {mode === 'offline' && (
              <>
                {'\n\n'}
                <em style={{ opacity: 0.75 }}>
                  Running without an AI key, so I answer from direct catalog lookups. Set
                  ANTHROPIC_API_KEY on the server for full conversational answers.
                </em>
              </>
            )}
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i}>
            <div className={`wiz-msg ${m.error ? 'err' : m.role === 'user' ? 'user' : 'wiz'}`}>
              {renderText(m.content)}
            </div>
            {m.note && <div className="wiz-tools">{m.note}</div>}
            {m.tools?.length > 0 && (
              <div className="wiz-tools">
                {[...new Set(m.tools)].map((t) => (
                  <span key={t} className="tag tiny">{t.replace(/_/g, ' ')}</span>
                ))}
              </div>
            )}
          </div>
        ))}

        {busy && (
          <div className="wiz-msg wiz">
            <span className="wiz-dots"><span /><span /><span /></span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length === 0 && (
        <div className="wiz-suggestions">
          {suggestions.map((s) => (
            <button key={s} onClick={() => send(s)}>{s}</button>
          ))}
        </div>
      )}

      <div className="wiz-foot">
        <Composer
          value={draft}
          onChange={setDraft}
          onSend={() => send()}
          disabled={busy}
          placeholder="Ask ClubWiz…"
          hint={null}
          autoFocus
        />
      </div>
    </div>
  );
}
