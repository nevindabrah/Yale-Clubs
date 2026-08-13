import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { get, qs } from '../api';
import ClubDetail from '../components/ClubDetail';
import { Chip, ClubLogo, Empty, Tag, band } from '../components/ui';

const SORTS = [
  ['name', 'Name'],
  ['rating', 'Rating'],
  ['size', 'Size'],
  ['commitment', 'Least time'],
  ['selectivity', 'Selectivity'],
  ['newest', 'Newest'],
];

export default function Catalog() {
  const [params, setParams] = useSearchParams();

  const [search, setSearch] = useState(params.get('q') || '');
  const [debounced, setDebounced] = useState(search);
  const [categories, setCategories] = useState(() => params.getAll('category'));
  const [application, setApplication] = useState(params.get('application') || 'any');
  const [maxHours, setMaxHours] = useState(Number(params.get('max_hours')) || 20);
  const [minRating, setMinRating] = useState(Number(params.get('min_rating')) || 0);
  const [acceptingOnly, setAcceptingOnly] = useState(params.get('accepting') === 'true');
  const [sort, setSort] = useState(params.get('sort') || 'name');

  const [facets, setFacets] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(params.get('club'));

  useEffect(() => {
    const id = setTimeout(() => setDebounced(search), 220);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    get('/clubs/facets').then(setFacets).catch(() => {});
  }, []);

  const query = useMemo(
    () => ({
      q: debounced,
      category: categories,
      application: application === 'any' ? '' : application,
      accepting: acceptingOnly ? 'true' : '',
      max_hours: maxHours < 20 ? maxHours : '',
      min_rating: minRating > 0 ? minRating : '',
      sort,
    }),
    [debounced, categories, application, acceptingOnly, maxHours, minRating, sort]
  );

  useEffect(() => {
    setLoading(true);
    get(`/clubs${qs(query)}`)
      .then((d) => {
        setClubs(d.clubs);
        setTotal(d.total);
      })
      .finally(() => setLoading(false));

    // Keep the URL shareable — filters and the open club both live in it.
    const next = { ...query };
    if (selected) next.club = selected;
    setParams(new URLSearchParams(qs(next).slice(1)), { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, selected]);

  const toggleCategory = (c) =>
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const clearAll = () => {
    setSearch('');
    setCategories([]);
    setApplication('any');
    setMaxHours(20);
    setMinRating(0);
    setAcceptingOnly(false);
    setSort('name');
  };

  const activeFilters =
    categories.length + (application !== 'any' ? 1 : 0) + (acceptingOnly ? 1 : 0) +
    (maxHours < 20 ? 1 : 0) + (minRating > 0 ? 1 : 0);

  return (
    <div className={`catalog${selected ? '' : ' no-detail'}`}>
      {/* ---------------------------------------------------- filters */}
      <aside className="filters">
        <div className="filter-group">
          <h4>Categories</h4>
          <div className="filter-list">
            {(facets?.categories || []).map((c) => (
              <label className="filter-row" key={c.category}>
                <input
                  type="checkbox"
                  checked={categories.includes(c.category)}
                  onChange={() => toggleCategory(c.category)}
                />
                <span>{c.category}</span>
                <span className="n">{c.count}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <h4>How you join</h4>
          <div className="segmented">
            <button className={application === 'any' ? 'on' : ''} onClick={() => setApplication('any')}>All</button>
            <button className={application === 'open' ? 'on' : ''} onClick={() => setApplication('open')}>Open</button>
            <button className={application === 'required' ? 'on' : ''} onClick={() => setApplication('required')}>Apply</button>
          </div>
        </div>

        <div className="filter-group">
          <h4>Max hours / week — {maxHours >= 20 ? 'any' : `${maxHours}h`}</h4>
          <input
            className="range"
            type="range"
            min="1"
            max="20"
            value={maxHours}
            onChange={(e) => setMaxHours(Number(e.target.value))}
          />
        </div>

        <div className="filter-group">
          <h4>Min rating — {minRating > 0 ? minRating.toFixed(1) : 'any'}</h4>
          <input
            className="range"
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
          />
        </div>

        <div className="filter-group">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={acceptingOnly}
              onChange={(e) => setAcceptingOnly(e.target.checked)}
            />
            Only clubs accepting members
          </label>
        </div>

        <button className="btn btn-sm btn-block" onClick={clearAll} disabled={!activeFilters && !search}>
          Clear filters{activeFilters ? ` (${activeFilters})` : ''}
        </button>

        <div className="tiny faint" style={{ marginTop: 16, lineHeight: 1.5 }}>
          Ratings and hours are illustrative demo figures, not survey data.
        </div>
      </aside>

      {/* ---------------------------------------------------- results */}
      <section className="results">
        <div className="results-bar">
          <input
            className="search-input"
            placeholder="Search clubs, categories, keywords…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="select" style={{ width: 'auto' }} value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map(([v, l]) => <option key={v} value={v}>Sort: {l}</option>)}
          </select>
        </div>

        <div className="row small muted" style={{ padding: '7px 14px' }}>
          {loading ? 'Searching…' : `${total} club${total === 1 ? '' : 's'}`}
          {selected && (
            <button className="btn btn-ghost btn-sm right" onClick={() => setSelected(null)}>
              Close detail
            </button>
          )}
        </div>

        {!loading && clubs.length === 0 && (
          <Empty title="Nothing matches those filters">
            Try removing a category or widening the hours-per-week range.
          </Empty>
        )}

        {clubs.map((club) => (
          <div
            key={club.id}
            className={`club-row${selected === club.slug ? ' selected' : ''}`}
            onClick={() => setSelected(club.slug)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setSelected(club.slug)}
          >
            <ClubLogo club={club} size="md" />
            <div className="main">
              <div className="name">
                {club.name}
                {club.acronym && club.acronym !== club.name && (
                  <span className="faint" style={{ fontWeight: 500 }}> · {club.acronym}</span>
                )}
              </div>
              <div className="sub">
                {club.category}
                {club.meeting_day ? ` · ${club.meeting_day}s ${club.meeting_time || ''}` : ''}
              </div>
            </div>
            <div className="row" style={{ gap: 5, flex: 'none' }}>
              {club.application_required ? (
                club.applications_open ? <Tag tone="tag-mid">Apply</Tag> : <Tag>Closed</Tag>
              ) : (
                <Tag tone="tag-good">Open</Tag>
              )}
            </div>
            <div className="chips">
              <Chip value={club.rating} label="rating" decimals={1} />
              <Chip
                value={club.commitment_hours}
                label="hrs/wk"
                decimals={1}
                tone={`chip-${band(Number(club.commitment_hours), { good: 8, mid: 5, invert: true })}`}
              />
              <Chip value={club.member_count} label="members" decimals={0} tone="chip-flat" />
            </div>
          </div>
        ))}
      </section>

      {/* ----------------------------------------------------- detail */}
      {selected && (
        <aside className="detail">
          <ClubDetail slug={selected} onClose={() => setSelected(null)} />
        </aside>
      )}
    </div>
  );
}
