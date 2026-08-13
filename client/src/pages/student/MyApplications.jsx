import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { get, post } from '../../api';
import {
  ClubLogo, Empty, Loading, Modal, STATUS_LABELS, StatusTag,
  formatDate, useToast,
} from '../../components/ui';

const OPEN_STATES = ['submitted', 'under_review', 'interview'];

export default function MyApplications() {
  const toast = useToast();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [detail, setDetail] = useState(null);

  const load = () => {
    setLoading(true);
    get('/student/dashboard')
      .then((d) => setApps(d.applications))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  async function withdraw(id, name) {
    if (!confirm(`Withdraw your application to ${name}? This cannot be undone.`)) return;
    try {
      await post(`/student/applications/${id}/withdraw`);
      toast('Application withdrawn.');
      setDetail(null);
      load();
    } catch (err) {
      toast.bad(err.message);
    }
  }

  async function openDetail(id) {
    try {
      setDetail(await get(`/student/applications/${id}`));
    } catch (err) {
      toast.bad(err.message);
    }
  }

  if (loading) return <Loading />;

  const shown =
    filter === 'all' ? apps :
    filter === 'open' ? apps.filter((a) => OPEN_STATES.includes(a.status)) :
    apps.filter((a) => a.status === filter);

  const counts = {
    all: apps.length,
    open: apps.filter((a) => OPEN_STATES.includes(a.status)).length,
    accepted: apps.filter((a) => a.status === 'accepted').length,
    rejected: apps.filter((a) => a.status === 'rejected').length,
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Applications</h1>
          <p>Every club you have applied to, and where each one stands.</p>
        </div>
        <Link className="btn" to="/catalog?application=required">Find clubs recruiting</Link>
      </div>

      <div className="tabs">
        {[['all', 'All'], ['open', 'In progress'], ['accepted', 'Accepted'], ['rejected', 'Not accepted']].map(
          ([key, label]) => (
            <button key={key} className={filter === key ? 'on' : ''} onClick={() => setFilter(key)}>
              {label} <span className="faint">{counts[key]}</span>
            </button>
          )
        )}
      </div>

      {shown.length === 0 ? (
        <Empty title="Nothing here yet" action={<Link className="btn btn-primary" to="/catalog?application=required">Browse clubs taking applications</Link>}>
          Clubs that require an application show an Apply button on their listing.
        </Empty>
      ) : (
        <div className="card card-list">
          {shown.map((a) => (
            <div className="lrow" key={a.id}>
              <ClubLogo club={a} size="md" />
              <div className="main">
                <div className="t"><Link to={`/club/${a.slug}`}>{a.name}</Link></div>
                <div className="s">
                  Submitted {formatDate(a.submitted_at, { year: 'numeric' })}
                  {a.decided_at && ` · decided ${formatDate(a.decided_at)}`}
                </div>
                {a.decision_note && (
                  <div className="small" style={{ marginTop: 5, padding: '7px 10px', background: 'var(--surface-2)', borderRadius: 6 }}>
                    “{a.decision_note}”
                  </div>
                )}
              </div>
              <StatusTag status={a.status} />
              <button className="btn btn-sm" onClick={() => openDetail(a.id)}>View</button>
              {OPEN_STATES.includes(a.status) && (
                <button className="btn btn-sm btn-danger" onClick={() => withdraw(a.id, a.name)}>Withdraw</button>
              )}
            </div>
          ))}
        </div>
      )}

      {detail && (
        <Modal title={`${detail.application.club_name} — your application`} onClose={() => setDetail(null)}>
          <div className="row" style={{ marginBottom: 14 }}>
            <StatusTag status={detail.application.status} />
            <span className="small muted">
              submitted {formatDate(detail.application.submitted_at, { year: 'numeric' })}
            </span>
          </div>
          {detail.application.decision_note && (
            <div className="alert alert-info">{detail.application.decision_note}</div>
          )}
          {detail.answers.length === 0 && <p className="muted">No written answers on this application.</p>}
          {detail.answers.map((a, i) => (
            <div key={i} style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{a.prompt}</div>
              <div className="small" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{a.answer}</div>
            </div>
          ))}
          <div className="tiny faint">
            Status meaning: {STATUS_LABELS[detail.application.status]}.
          </div>
        </Modal>
      )}
    </div>
  );
}
