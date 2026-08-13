import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

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

export function ClubLogo({ club, size = 'md' }) {
  return (
    <div
      className={`logo logo-${size}`}
      style={{ background: hueColor(club.logo_hue) }}
      aria-hidden="true"
    >
      {clubInitials(club)}
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

export function Chip({ value, label, tone }) {
  const cls = tone || band(value);
  const shown = value == null ? '—' : typeof value === 'number' ? value.toFixed(1) : value;
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
