import { Link, useParams } from 'react-router-dom';
import ClubDetail from '../components/ClubDetail';

export default function ClubDetailPage() {
  const { slug } = useParams();
  return (
    <div className="page" style={{ maxWidth: 780 }}>
      <Link className="btn btn-ghost btn-sm" to="/catalog" style={{ marginBottom: 10 }}>
        ← Back to the catalog
      </Link>
      <div className="card" style={{ overflow: 'hidden' }}>
        <ClubDetail slug={slug} />
      </div>
    </div>
  );
}
