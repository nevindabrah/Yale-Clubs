import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { get } from '../api';

export default function Landing() {
  const [facets, setFacets] = useState(null);

  useEffect(() => {
    get('/clubs/facets').then(setFacets).catch(() => {});
  }, []);

  return (
    <div>
      <div className="hero">
        <h1>Every club at Yale, in one place.</h1>
        <p>
          Browse {facets?.totals?.total ?? '100+'} undergraduate organizations, compare time
          commitments, apply, and keep track of the whole thing — from the people who think
          picking a club should be as easy as picking a course.
        </p>

        <div className="portal-cards">
          <div className="card portal-card">
            <h3>Student portal</h3>
            <div className="small muted">For finding and joining clubs.</div>
            <ul>
              <li>Search and filter the full club catalog</li>
              <li>Join open clubs instantly, apply to selective ones</li>
              <li>Track every application and decision in one list</li>
              <li>See all your club meetings on one calendar</li>
              <li>Message club officers directly</li>
            </ul>
            <Link className="btn btn-primary btn-block" to="/register?portal=student">
              Create a student account
            </Link>
          </div>

          <div className="card portal-card officer">
            <h3>Officer portal</h3>
            <div className="small muted">For running a club.</div>
            <ul>
              <li>Read applications and record decisions</li>
              <li>See your roster, member details and turnout</li>
              <li>Post meetings, events and announcements</li>
              <li>Answer student questions from one inbox</li>
              <li>Edit your club's catalog listing</li>
            </ul>
            <Link className="btn btn-block" to="/register?portal=officer">
              Create an officer account
            </Link>
          </div>
        </div>

        <p className="small muted" style={{ marginTop: 22 }}>
          Officer accounts are separate from student accounts — even if you run a club, you join
          other clubs as a regular student. <Link to="/about">Why?</Link>
        </p>

        <div style={{ marginTop: 26 }}>
          <Link className="btn btn-lg" to="/catalog">Browse the catalog without an account →</Link>
        </div>
      </div>

      {facets && (
        <div className="page" style={{ paddingTop: 0 }}>
          <div className="section-head"><h2>Browse by category</h2></div>
          <div className="grid grid-3">
            {facets.categories.map((c) => (
              <Link
                key={c.category}
                to={`/catalog?category=${encodeURIComponent(c.category)}`}
                className="card card-pad"
                style={{ color: 'inherit' }}
              >
                <div style={{ fontWeight: 650 }}>{c.category}</div>
                <div className="small muted">{c.count} organizations</div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
