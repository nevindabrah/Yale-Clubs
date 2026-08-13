import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <div className="page-head">
        <div>
          <h1>About YaleClubs</h1>
          <p>A club catalog built in the spirit of CourseTable.</p>
        </div>
      </div>

      <div className="card card-pad section">
        <h3>Two portals, two accounts</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          Running a club and joining clubs are different jobs, so they use different accounts. If
          you are the treasurer of one organization and a new member of three others, you hold an
          officer account for the first and a student account for the rest — same email address,
          separate logins, separate sessions.
        </p>
        <p className="muted">
          It means you cannot accidentally act with officer privileges while browsing, and each
          club's decision history records exactly which officer account made the call.
        </p>
      </div>

      <div className="card card-pad section">
        <h3>About the data</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          Club names, categories, founding years and descriptions refer to real Yale undergraduate
          organizations. Everything else in this build — meeting times, room locations, contact
          addresses, application deadlines, member counts, ratings, and every person, application
          and message — is <strong>demo data</strong>. Contact addresses use a non-routable demo
          domain so nothing here can be mistaken for a real inbox.
        </p>
        <p className="muted">
          For real, current information about a Yale organization, go to Yale Connect or contact
          the group directly.
        </p>
      </div>

      <div className="card card-pad">
        <h3>Ratings and workload figures</h3>
        <p className="muted" style={{ marginTop: 8 }}>
          The satisfaction and hours-per-week numbers shown on each listing are illustrative
          planning figures for this demo, not survey results. In a production version they would
          come from member surveys the way CourseTable's ratings come from course evaluations.
        </p>
      </div>

      <div style={{ marginTop: 22 }}>
        <Link className="btn btn-primary" to="/catalog">Browse the catalog</Link>
      </div>
    </div>
  );
}
