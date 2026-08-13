import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { get } from '../api';

/**
 * Landing page. Deliberately sparse: one idea per screen, plenty of air, and
 * only the three things a first-time visitor needs — what this is, which
 * portal they want, and a way in. The full category list lives in the catalog
 * where it belongs, not stacked on the front door. See DECISIONS.md D-020.
 */
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

        <span className="eyebrow">
          <span className="dot" />
          {total ? `${total} Yale organizations, one catalog` : 'A sister app to CourseTable'}
        </span>

        <h1>
          Find your people<br />
          <span className="accent">at Yale.</span>
        </h1>

        <p>
          Search every undergraduate organization, compare what they actually ask of you,
          and keep the whole thing — applications, meetings, messages — in one place.
        </p>

        <div className="hero-actions">
          <Link className="btn btn-primary btn-lg" to="/catalog">Browse the catalog</Link>
          <Link className="btn btn-lg" to="/register">Create an account</Link>
        </div>

        <div className="hero-meta">No account needed to look around.</div>
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
