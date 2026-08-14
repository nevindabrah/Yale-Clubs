import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { get, qs } from '../api';
import ClubDetail from '../components/ClubDetail';
import { ClubLogo, Empty, Tag, band } from '../components/ui';

const SORTS = [
  ['name', 'Name'],
  ['rating', 'Rating'],
  ['size', 'Size'],
  ['commitment', 'Least time'],
  ['selectivity', 'Selectivity'],
  ['newest', 'Newest'],
];

/* CourseTable puts a straight face on a joke next to the result count
   ("faster than the Silliman elevator"). Ours is fixed rather than random so
   the page does not reshuffle its own copy on every keystroke. */
const QUIP = '(sorted faster than a suite meeting)';

/** A clickable column header. Sorting is server-side — the header just picks
 *  which `sort` key the query uses, so it reuses the existing API exactly. */
function SortHead({ col, sort, onSort, num = false, children }) {
  const active = sort === col;
  return (
    <th
      className={`sortable${num ? ' num' : ''}${active ? ' active' : ''}`}
      onClick={() => onSort(col)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSort(col)}
      aria-sort={active ? 'ascending' : 'none'}
    >
      {children}
      <span className="sort-arrow" aria-hidden="true">{active ? '↓' : '⇅'}</span>
    </th>
  );
}

/** A numeric cell tinted on the green→yellow→red scale — CourseTable's most
 *  recognisable signature, applied to the cell rather than a floating chip. */
function NumCell({ value, decimals, tone }) {
  const cls = tone || band(value);
  const n = Number(value);
  const shown = value == null || value === '' || !Number.isFinite(n)
    ? '—'
    : n.toFixed(decimals ?? (Number.isInteger(n) ? 0 : 1));
  return <td className={`num cell-${cls}`}>{shown}</td>;
}

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

        <div className="results-count">
          {loading ? 'Searching…' : `Showing ${total} club${total === 1 ? '' : 's'}`}
          <span className="faint"> {QUIP}</span>
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

        {clubs.length > 0 && (
          <div className="table-scroll">
            <table className="club-table">
              <thead>
                <tr>
                  <th className="c-logo" />
                  <SortHead col="name" sort={sort} onSort={setSort}>Club</SortHead>
                  <th className="c-cat">Category</th>
                  <SortHead col="rating" sort={sort} onSort={setSort} num>Rating</SortHead>
                  <SortHead col="commitment" sort={sort} onSort={setSort} num>Hrs/wk</SortHead>
                  <SortHead col="size" sort={sort} onSort={setSort} num>Members</SortHead>
                  <SortHead col="selectivity" sort={sort} onSort={setSort}>Join</SortHead>
                  <th className="c-meets">Meets</th>
                </tr>
              </thead>
              <tbody>
                {clubs.map((club) => (
                  <tr
                    key={club.id}
                    className={selected === club.slug ? 'selected' : ''}
                    onClick={() => setSelected(club.slug)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setSelected(club.slug)}
                  >
                    <td className="c-logo"><ClubLogo club={club} size="sm" /></td>
                    <td className="c-name">
                      <span className="n">{club.name}</span>
                      {club.acronym && club.acronym !== club.name && (
                        <span className="faint"> · {club.acronym}</span>
                      )}
                    </td>
                    <td className="c-cat">{club.category}</td>
                    <NumCell value={club.rating} decimals={1} />
                    <NumCell
                      value={club.commitment_hours}
                      decimals={1}
                      tone={band(Number(club.commitment_hours), { good: 8, mid: 5, invert: true })}
                    />
                    <NumCell value={club.member_count} decimals={0} tone="flat" />
                    <td>
                      {club.application_required ? (
                        club.applications_open ? <Tag tone="tag-mid">Apply</Tag> : <Tag>Closed</Tag>
                      ) : (
                        <Tag tone="tag-good">Open</Tag>
                      )}
                    </td>
                    <td className="c-meets faint">
                      {club.meeting_day ? `${club.meeting_day} ${club.meeting_time || ''}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
