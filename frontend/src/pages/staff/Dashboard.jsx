import { useState, useEffect } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { issues } from '../../api/api';
import IssueCard from '../../components/IssueCard';
import Pagination from '../../components/Pagination';

const CATEGORIES = ['', 'ROAD', 'WATER', 'ELECTRICITY', 'GARBAGE', 'DRAINAGE',
    'STREETLIGHT', 'PARK', 'PUBLIC_TRANSPORT', 'SANITATION', 'NOISE', 'OTHER'];
const STATUSES = ['', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const PRIORITIES = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export default function StaffDashboard() {
    const [data, setData] = useState({ items: [], total: 0, pages: 1 });
    const [filters, setFilters] = useState({ category: '', status: '', priority: '', search: '', ward: '' });
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const setF = (k) => (e) => setFilters(f => ({ ...f, [k]: e.target.value }));

    async function load(pg = 1, f = filters) {
        setLoading(true);
        setError('');
        try {
            const res = await issues.list({ ...f, page: pg, page_size: 12, sort_order: 'desc' });
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
                <h2>All Issues</h2>
                <p>Manage and update city-wide reported issues</p>
            </div>

            {/* Filters */}
            <div className="filters-bar">
                <div style={{ position: 'relative', flex: '1 1 200px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input type="text" className="form-control" style={{ paddingLeft: '2rem' }}
                        placeholder="Search issues…" value={filters.search} onChange={setF('search')} />
                </div>
                <select className="form-control" value={filters.category} onChange={setF('category')}>
                    <option value="">All Categories</option>
                    {CATEGORIES.filter(Boolean).map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                </select>
                <select className="form-control" value={filters.status} onChange={setF('status')}>
                    <option value="">All Statuses</option>
                    {STATUSES.filter(Boolean).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
                <select className="form-control" value={filters.priority} onChange={setF('priority')}>
                    <option value="">All Priorities</option>
                    {PRIORITIES.filter(Boolean).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <input type="text" className="form-control" style={{ maxWidth: '120px' }}
                    placeholder="Ward" value={filters.ward} onChange={setF('ward')} />
                <button className="btn btn-ghost btn-sm" onClick={() => load(page)}>
                    <RefreshCw size={14} />
                </button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : data.items.length === 0 ? (
                <div className="empty-state card">
                    <div style={{ fontSize: '2.5rem' }}>🔍</div>
                    <h3>No issues found</h3>
                    <p>Try adjusting the filters.</p>
                </div>
            ) : (
                <>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.75rem' }}>
                        {data.total} issue{data.total !== 1 ? 's' : ''} found
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1rem' }}>
                        {data.items.map(i => <IssueCard key={i.id} issue={i} />)}
                    </div>
                    <Pagination page={page} totalPages={data.pages} onPageChange={setPage} />
                </>
            )}
        </div>
    );
}
