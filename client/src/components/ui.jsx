import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/* ------------------------------------------------------------ helpers */

/** Initials for a club: prefer the acronym, else first letters of words. */
export function clubInitials(club) {
  if (club.acronym && club.acronym.length <= 5) return club.acronym.toUpperCase();
  return (club.name || '')
    .replace(/^(The|Yale)\s+/i, '')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

export const personInitials = (name = '') =>
  name.split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export const hueColor = (hue, s = 55, l = 42) => `hsl(${hue ?? 212} ${s}% ${l}%)`;

/** Score → color band, the CourseTable convention: high is green, low is red. */
export function band(value, { good = 4.3, mid = 3.6, invert = false } = {}) {
  if (value == null) return 'flat';
  const v = Number(value);
  if (invert) {
    if (v <= mid) return 'good';
    if (v <= good) return 'mid';
    return 'bad';
  }
  if (v >= good) return 'good';
  if (v >= mid) return 'mid';
  return 'bad';
}

export function formatDate(value, opts = {}) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...opts,
  });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const d = new Date(value);
  return `${d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · ${d.toLocaleTimeString(
    undefined,
    { hour: 'numeric', minute: '2-digit' }
  )}`;
}

export function formatTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function relativeTime(value) {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(value, { year: 'numeric' });
}

export const STATUS_LABELS = {
  submitted: 'Submitted',
  under_review: 'Under review',
  interview: 'Interview',
  accepted: 'Accepted',
  rejected: 'Not accepted',
  withdrawn: 'Withdrawn',
};

export const STATUS_TONE = {
  submitted: '',
  under_review: 'tag-mid',
  interview: 'tag-cat',
  accepted: 'tag-good',
  rejected: 'tag-bad',
  withdrawn: '',
};

/* --------------------------------------------------------- components */

/** Stable small hash — same club always gets the same crest. */
function hashString(str = '') {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/* Six background devices. Flat initials made 128 clubs look like 128 of the
   same tile; a deterministic device per club makes them tellable apart at a
   glance in a dense table without anyone having to read the monogram. */
const CRESTS = [
  (c) => <circle cx="32" cy="32" r="21" fill="none" stroke={c} strokeWidth="7" />,
  (c) => <path d="M0 44 L32 20 L64 44 V64 H0 Z" fill={c} />,
  (c) => <g fill={c}><circle cx="16" cy="16" r="9" /><circle cx="48" cy="48" r="9" /></g>,
  (c) => <path d="M32 2 L62 32 L32 62 L2 32 Z" fill="none" stroke={c} strokeWidth="8" />,
  (c) => <g fill={c}><rect x="0" y="34" width="64" height="10" /><rect x="0" y="50" width="64" height="10" /></g>,
  (c) => <path d="M-4 52 Q 16 26 32 46 T 68 40 V68 H-4 Z" fill={c} />,
];

/**
 * A club's mark.
 *
 * If the club has supplied a real `logo_url` — its own artwork, with its own
 * permission — that wins. Otherwise we draw a generated crest: a hue-derived
 * gradient, one of six geometric devices chosen by a stable hash of the slug,
 * and the monogram on top. See DECISIONS.md D-028 for why we do not go and
 * fetch the real ones.
 */
export function ClubLogo({ club, size = 'md' }) {
  const label = clubInitials(club);

  if (club.logo_url) {
    return (
      <img
        className={`logo logo-${size} logo-img`}
        src={club.logo_url}
        alt={`${club.name || 'Club'} logo`}
        loading="lazy"
      />
    );
  }

  const hue = club.logo_hue ?? 212;
  const seed = hashString(club.slug || club.name || '');
  const Crest = CRESTS[seed % CRESTS.length];
  const gid = `cl-${hue}-${seed % CRESTS.length}`;

  return (
    <div className={`logo logo-${size}`} title={club.name} aria-hidden="true">
      <svg viewBox="0 0 64 64" className="logo-svg" focusable="false">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={hueColor(hue, 58, 46)} />
            <stop offset="100%" stopColor={hueColor((hue + 26) % 360, 62, 34)} />
          </linearGradient>
        </defs>
        <rect width="64" height="64" fill={`url(#${gid})`} />
        <g opacity="0.26">{Crest('#ffffff')}</g>
      </svg>
      <span className="logo-text">{label}</span>
    </div>
  );
}

/**
 * The wide header image on a club's overview. Uses the club's own `banner_url`
 * when it has one; otherwise draws a generated field — a hue-derived wash with
 * a scatter of soft shapes seeded from the slug, so every club's page opens
 * with something of its own rather than a grey bar.
 */
export function ClubBanner({ club }) {
  if (club.banner_url) {
    return (
      <div className="detail-banner">
        <img src={club.banner_url} alt="" loading="lazy" />
      </div>
    );
  }

  const hue = club.logo_hue ?? 212;
  const seed = hashString(club.slug || club.name || '');
  const gid = `bn-${seed % 997}`;

  // Deterministic scatter — same club, same composition, every render.
  const shapes = Array.from({ length: 7 }, (_, i) => {
    const s = hashString(`${club.slug}-${i}`);
    return {
      cx: (s % 100) + i * 4,
      cy: (s >> 3) % 60,
      r: 12 + ((s >> 6) % 26),
      o: 0.08 + ((s >> 9) % 12) / 100,
    };
  });

  return (
    <div className="detail-banner">
      <svg viewBox="0 0 140 64" preserveAspectRatio="none" focusable="false" aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={hueColor(hue, 52, 52)} />
            <stop offset="100%" stopColor={hueColor((hue + 34) % 360, 58, 36)} />
          </linearGradient>
        </defs>
        <rect width="140" height="64" fill={`url(#${gid})`} />
        {shapes.map((s, i) => (
          <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill="#fff" opacity={s.o} />
        ))}
      </svg>
    </div>
  );
}

export function Avatar({ name, hue, large = false }) {
  return (
    <div
      className={`avatar${large ? ' avatar-lg' : ''}`}
      style={{ background: hueColor(hue, 50, 40) }}
      title={name}
    >
      {personInitials(name)}
    </div>
  );
}

/**
 * Numeric stat badge. `decimals` defaults to 1 for fractional values and 0 for
 * whole numbers — counts like member totals must never render as "59.0".
 */
export function Chip({ value, label, tone, decimals }) {
  const cls = tone || band(value);
  let shown = '—';
  if (value != null && value !== '') {
    const n = Number(value);
    if (Number.isFinite(n)) {
      const places = decimals ?? (Number.isInteger(n) ? 0 : 1);
      shown = n.toFixed(places);
    } else {
      shown = value;
    }
  }
  return (
    <div className={`chip chip-${cls}`} title={`${label}: ${shown}`}>
      <span className="n">{shown}</span>
      <span className="l">{label}</span>
    </div>
  );
}

export function Tag({ children, tone = '' }) {
  return <span className={`tag ${tone}`}>{children}</span>;
}

export function StatusTag({ status }) {
  return <Tag tone={STATUS_TONE[status]}>{STATUS_LABELS[status] || status}</Tag>;
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="empty">
      <div className="skeleton" style={{ height: 12, width: 180, margin: '0 auto 10px' }} />
      <div className="small muted">{label}</div>
    </div>
  );
}

export function Empty({ title, children, action }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {children && <p className="small" style={{ maxWidth: 420, margin: '0 auto' }}>{children}</p>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}

export function Modal({ title, onClose, children, footer, wide = false }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={wide ? { maxWidth: 880 } : undefined} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/**
 * Message composer. Enter sends, Shift+Enter adds a newline, and the send
 * control is a circular arrow inside the input rather than a labelled button.
 * The textarea grows with its content up to a cap. See DECISIONS.md D-016.
 */
export function Composer({
  value,
  onChange,
  onSend,
  placeholder = 'Write a message…',
  disabled = false,
  hint = 'Enter to send · Shift + Enter for a new line',
  autoFocus = false,
}) {
  const ref = useRef(null);

  // Grow to fit, then scroll — recomputed on every change so deletes shrink it.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const canSend = !disabled && value.trim().length > 0;

  function onKeyDown(e) {
    if (e.key !== 'Enter') return;
    // Shift/Alt+Enter inserts a newline; IME composition must not submit.
    if (e.shiftKey || e.altKey || e.nativeEvent?.isComposing) return;
    e.preventDefault();
    if (canSend) onSend();
  }

  return (
    <div className="composer">
      <div className="composer-box">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <button
          className="send-btn"
          onClick={() => canSend && onSend()}
          disabled={!canSend}
          aria-label="Send message"
          title="Send (Enter)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="19" x2="12" y2="5" />
            <polyline points="5 12 12 5 19 12" />
          </svg>
        </button>
      </div>
      {hint && <div className="composer-hint">{hint}</div>}
    </div>
  );
}

/* ------------------------------------------------------------- toasts */

const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((message, tone = '') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const value = useMemo(
    () => Object.assign(push, {
      good: (m) => push(m, 'good'),
      bad: (m) => push(m, 'bad'),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.tone}`}>{t.message}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
