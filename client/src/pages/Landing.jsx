import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { get } from '../api';

/**
 * Landing page. Deliberately sparse: one idea per screen, plenty of air, and
 * only the three things a first-time visitor needs — what this is, which
 * portal they want, and a way in. The full category list lives in the catalog
 * where it belongs, not stacked on the front door. See DECISIONS.md D-020.
 */
/**
 * Hero illustration: a club fair board, with people adding themselves to it.
 * Deliberately drawn from the same primitives as the logo — rounded cards,
 * pastel accent fills, a Yale-blue figure — so the page reads as one system
 * rather than a stock illustration dropped into a layout.
 */
function HeroArt() {
  return (
    <svg className="hero-art" viewBox="0 0 420 300" role="img" aria-label="Students choosing clubs from a board" focusable="false">
      {/* board */}
      <rect x="86" y="34" width="300" height="188" rx="14" fill="var(--surface)" stroke="var(--border-strong)" strokeWidth="2" />
      <g stroke="var(--border)" strokeWidth="2">
        <path d="M161 34 V222" /><path d="M236 34 V222" /><path d="M311 34 V222" />
        <path d="M86 74 H386" />
      </g>
      {/* column headers */}
      <g fill="var(--border-strong)">
        <rect x="104" y="50" width="40" height="8" rx="4" />
        <rect x="179" y="50" width="40" height="8" rx="4" />
        <rect x="254" y="50" width="40" height="8" rx="4" />
        <rect x="329" y="50" width="40" height="8" rx="4" />
      </g>
      {/* pinned club cards */}
      <g>
        <rect x="104" y="92" width="38" height="30" rx="7" fill="var(--primary)" />
        <rect x="179" y="92" width="38" height="30" rx="7" fill="var(--sky)" />
        <rect x="254" y="130" width="38" height="30" rx="7" fill="var(--primary)" />
        <rect x="329" y="92" width="38" height="30" rx="7" fill="var(--mint)" />
        <rect x="104" y="140" width="38" height="30" rx="7" fill="var(--lemon)" />
        <rect x="179" y="150" width="38" height="30" rx="7" fill="var(--primary)" />
        <rect x="329" y="150" width="38" height="30" rx="7" fill="var(--peach)" />
        <rect x="254" y="84" width="38" height="30" rx="7" fill="var(--lilac)" />
      </g>
      {/* two figures */}
      <g>
        <circle cx="46" cy="120" r="17" fill="var(--text)" />
        <path d="M24 232 V176 a22 22 0 0 1 44 0 v56 z" fill="var(--surface-3)" />
        <path d="M66 190 l26 -14" stroke="var(--surface-3)" strokeWidth="11" strokeLinecap="round" />
        <rect x="20" y="232" width="16" height="42" rx="6" fill="var(--text)" />
        <rect x="52" y="232" width="16" height="42" rx="6" fill="var(--text)" />
      </g>
      <g>
        <circle cx="396" cy="132" r="16" fill="var(--text)" />
        <path d="M375 240 V188 a21 21 0 0 1 42 0 v52 z" fill="var(--primary)" />
        <path d="M377 198 l-26 -12" stroke="var(--primary)" strokeWidth="11" strokeLinecap="round" />
        <rect x="373" y="240" width="15" height="40" rx="6" fill="var(--text)" />
        <rect x="403" y="240" width="15" height="40" rx="6" fill="var(--text)" />
      </g>
      <line x1="20" y1="282" x2="410" y2="282" stroke="var(--border-strong)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export default function Landing() {
  const [facets, setFacets] = useState(null);

  useEffect(() => {
    get('/clubs/facets').then(setFacets).catch(() => {});
  }, []);

  const total = facets?.totals?.total;
  const categories = facets?.categories ?? [];

  return (
    <div>
      {/* ------------------------------------------------------- hero */}
      <section className="hero">
        <div className="hero-blobs" aria-hidden="true">
          <span className="blob b1" />
          <span className="blob b2" />
          <span className="blob b3" />
        </div>

        <div className="hero-grid">
          <div className="hero-copy">
            <h1>
              The best place to find<br />
              your people at Yale.
            </h1>

            {/* The emoji-led feature list is CourseTable's landing pattern: four
                concrete capabilities, the number in each one carrying the weight. */}
            <ul className="hero-points">
              <li>
                <span aria-hidden="true">🔍</span>
                Browse all <b>{total ? `${total}` : '128'}</b> undergraduate organizations
              </li>
              <li>
                <span aria-hidden="true">⏱️</span>
                Compare <b>time commitment</b> before you commit
              </li>
              <li>
                <span aria-hidden="true">🔖</span>
                Track applications and <b>deadlines</b> in one place
              </li>
              <li>
                <span aria-hidden="true">💬</span>
                Message officers with <b>questions</b> first
              </li>
            </ul>

            <div className="hero-actions">
              <Link className="btn btn-cas btn-lg" to="/login">Login with CAS</Link>
              <Link className="btn btn-dark btn-lg" to="/about">About us</Link>
              <Link className="btn btn-guest btn-lg" to="/catalog">Guest</Link>
            </div>

            <div className="hero-meta">No account needed to look around.</div>
          </div>

          <HeroArt />
        </div>
      </section>

      {/* ----------------------------------------------------- portals */}
      <section className="page" style={{ paddingTop: 0, paddingBottom: 90 }}>
        <div className="portal-cards">
          <div className="card portal-card rise rise-1">
            <h3>For students</h3>
            <div className="small muted">Finding and joining clubs.</div>
            <ul>
              <li>Filter by time commitment, category and how you join</li>
              <li>Join open clubs instantly; apply to selective ones</li>
              <li>Every meeting on one calendar</li>
              <li>Message officers before you commit</li>
            </ul>
            <Link className="btn btn-primary btn-block" to="/register?portal=student">
              Get started
            </Link>
          </div>

          <div className="card portal-card officer rise rise-2">
            <h3>For club officers</h3>
            <div className="small muted">Running a club.</div>
            <ul>
              <li>Read applications and record decisions</li>
              <li>See your roster, turnout and member details</li>
              <li>Post events and announcements</li>
              <li>Answer students from one inbox</li>
            </ul>
            <Link className="btn btn-block" to="/register?portal=officer">
              Set up your club
            </Link>
          </div>
        </div>

        <p className="small muted center" style={{ maxWidth: 560, margin: '34px auto 0' }}>
          Officer accounts are separate from student accounts — even if you run a club, you join
          other clubs as a regular student. <Link to="/about">Why?</Link>
        </p>
      </section>

      {/* -------------------------------------------------- categories */}
      {categories.length > 0 && (
        <section className="page" style={{ paddingTop: 0, paddingBottom: 110 }}>
          <div className="center" style={{ marginBottom: 26 }}>
            <h2>Start somewhere</h2>
          </div>
          <div className="pill-cloud">
            {categories.map((c) => (
              <Link key={c.category} to={`/catalog?category=${encodeURIComponent(c.category)}`}>
                {c.category} <span className="faint">{c.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
