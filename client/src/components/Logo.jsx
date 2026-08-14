/**
 * The ClubTable brand.
 *
 * Two pieces that travel together:
 *
 *   <Mark>      a badge — three people seated evenly around a round table,
 *               which is the product name drawn literally. Rotationally
 *               symmetric, so it reads the same at 18px in a nav as it does
 *               at 512px in a tab icon.
 *   <wordmark>  "Club" in a serif, "Table" in blue — the same two-tone
 *               split CourseTable uses, which is the clearest possible
 *               signal that these are sister apps. See DECISIONS.md D-025.
 *
 * Inline SVG rather than an <img> so it stays crisp at any size, inherits
 * currentColor in the places that want it, and can animate with the nav.
 * The identical artwork ships as `public/favicon.svg`.
 */

// Three seats at 12, 4 and 8 o'clock — evenly spaced around the hub.
// Precomputed rather than derived so the SVG stays readable as source.
const SEATS = [
  { cx: 32, cy: 16.5, fill: '#ffffff' },
  { cx: 45.4, cy: 39.8, fill: '#cfe2f8' },
  { cx: 18.6, cy: 39.8, fill: '#a9cbf0' },
];

export function Mark({ size = 32, className = '' }) {
  // Unique per instance: two marks on one page must not share a gradient id.
  const id = `ct-mark-${size}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={`ct-mark ${className}`}
      role="img"
      aria-label="ClubTable"
      focusable="false"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#00356b" />
          <stop offset="55%" stopColor="#14508f" />
          <stop offset="100%" stopColor="#2d6cc0" />
        </linearGradient>
      </defs>

      <rect width="64" height="64" rx="15" fill={`url(#${id})`} />

      {/* The table: a ring, not a disc, so the seats read as *around* it. */}
      <circle cx="32" cy="32" r="9.5" fill="none" stroke="#ffffff" strokeWidth="3.2" opacity="0.55" />

      {/* Spokes from the table edge out to each seat. */}
      <g stroke="#ffffff" strokeWidth="3.4" strokeLinecap="round" opacity="0.9">
        <path d="M32 22.5 L32 20" />
        <path d="M40.2 36.8 L42.3 38" />
        <path d="M23.8 36.8 L21.7 38" />
      </g>

      {SEATS.map((s) => (
        <circle key={s.cx} cx={s.cx} cy={s.cy} r="6.2" fill={s.fill} />
      ))}
    </svg>
  );
}

/**
 * The full lockup. `size` drives the mark; the wordmark scales with the
 * surrounding font-size so it can sit in a nav or a hero unchanged.
 */
export default function Logo({ size = 30, withWordmark = true, className = '' }) {
  if (!withWordmark) return <Mark size={size} className={className} />;

  return (
    <span className={`logo-lockup ${className}`}>
      <Mark size={size} />
      <span className="logo-word">
        Club<span className="logo-word-accent">Table</span>
      </span>
    </span>
  );
}
