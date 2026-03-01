import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw } from 'lucide-react';
import { issues } from '../../api/api';
import { StatusBadge, PriorityBadge, CategoryBadge } from '../../components/Badges';
import Pagination from '../../components/Pagination';

const CATEGORIES = ['', 'ROAD', 'WATER', 'ELECTRICITY', 'GARBAGE', 'DRAINAGE', 'STREETLIGHT', 'PARK', 'PUBLIC_TRANSPORT', 'SANITATION', 'NOISE', 'OTHER'];
const STATUSES = ['', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const PRIORITIES = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

function fmt(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { dateStyle: 'medium' });
}

export default function AdminIssueList() {
    const [data, setData] = useState({ items: [], total: 0, pages: 1 });
    const [filters, setFilters] = useState({ category: '', status: '', priority: '', search: '' });
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const setF = (k) => (e) => setFilters(f => ({ ...f, [k]: e.target.value }));

    async function load(pg = 1, f = filters) {
        setLoading(true);
        setError('');
        try {
            const res = await issues.list({ ...f, page: pg, page_size: 20 });
            setData(res.data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(1); setPage(1); }, [filters]);
    useEffect(() => { load(page); }, [page]);

    return (
        <div className="fade-in">
            <div className="page-header">
                <h2>Issue Manager</h2>
                <p>Full admin view of all reported issues</p>
            </div>

            <div className="filters-bar">
                <div style={{ position: 'relative', flex: '1 1 200px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" className="form-control" style={{ paddingLeft: '2rem' }}
                        placeholder="Search…" value={filters.search} onChange={setF('search')} />
                </div>
                <select className="form-control" value={filters.category} onChange={setF('category')}>
                    <option value="">Category</option>
                    {CATEGORIES.filter(Boolean).map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                </select>
                <select className="form-control" value={filters.status} onChange={setF('status')}>
                    <option value="">Status</option>
                    {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
                <select className="form-control" value={filters.priority} onChange={setF('priority')}>
                    <option value="">Priority</option>
                    {PRIORITIES.filter(Boolean).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <button className="btn btn-ghost btn-sm" onClick={() => load(page)}>
                    <RefreshCw size={14} />
                </button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : (
                <>
                    <div className="card">
                        <div className="card-header">
                            <span className="text-muted text-sm">{data.total} issues</span>
                        </div>
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Title</th>
                                        <th>Category</th>
                                        <th>Status</th>
                                        <th>Priority</th>
                                        <th>Reporter</th>
                                        <th>Ward</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.items.map(i => (
                                        <tr key={i.id}>
                                            <td>
                                                <Link to={`/issues/${i.id}`} style={{ color: 'var(--accent)', fontWeight: 500 }}>
                                                    {i.title.length > 50 ? i.title.slice(0, 50) + '…' : i.title}
                                                </Link>
                                            </td>
                                            <td><CategoryBadge category={i.category} /></td>
                                            <td><StatusBadge status={i.status} /></td>
                                            <td><PriorityBadge priority={i.priority} /></td>
                                            <td>{i.reporter?.full_name}</td>
                                            <td>{i.ward ?? '—'}</td>
                                            <td>{fmt(i.created_at)}</td>
                                        </tr>
                                    ))}
                                    {data.items.length === 0 && (
                                        <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No issues found</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <Pagination page={page} totalPages={data.pages} onPageChange={setPage} />
                </>
            )}
        </div>
    );
}
