import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, RefreshCw } from 'lucide-react';
import { issues } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import IssueCard from '../../components/IssueCard';
import Pagination from '../../components/Pagination';

const STATUS_TABS = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export default function CitizenDashboard() {
    const { user } = useAuth();
    const [data, setData] = useState({ items: [], total: 0, pages: 1 });
    const [status, setStatus] = useState('ALL');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    async function load(pg = page, st = status) {
        setLoading(true);
        setError('');
        try {
            const params = { page: pg, page_size: 12, sort_order: 'desc' };
            if (st !== 'ALL') params.status = st;
            const res = await issues.list(params);
            setData(res.data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(1, status); setPage(1); }, [status]);
    useEffect(() => { load(page, status); }, [page]);

    // Filter client-side to show only current user's issues if CITIZEN
    const myIssues = user?.role === 'CITIZEN'
        ? data.items.filter(i => i.reporter?.id === user.id)
        : data.items;

    return (
        <div className="fade-in">
            <div className="flex-between mb-3">
                <div className="page-header" style={{ marginBottom: 0 }}>
                    <h2>My Issues</h2>
                    <p>Issues you have reported to the city</p>
                </div>
                <Link to="/report" className="btn btn-primary">
                    <PlusCircle size={16} /> Report Issue
                </Link>
            </div>

            {/* Status tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                {STATUS_TABS.map(s => (
                    <button
                        key={s}
                        onClick={() => { setStatus(s); setPage(1); }}
                        className={`btn btn-sm ${status === s ? 'btn-primary' : 'btn-outline'}`}
                    >
                        {s.replace('_', ' ')}
                    </button>
                ))}
                <button className="btn btn-ghost btn-sm" onClick={() => load(page, status)} style={{ marginLeft: 'auto' }}>
                    <RefreshCw size={14} />
                </button>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : myIssues.length === 0 ? (
                <div className="empty-state card">
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🏙️</div>
                    <h3>No issues found</h3>
                    <p style={{ marginTop: '0.25rem' }}>
                        {status === 'ALL'
                            ? "You haven't reported any issues yet."
                            : `No ${status.replace('_', ' ')} issues.`}
                    </p>
                    <Link to="/report" className="btn btn-primary mt-2">Report your first issue</Link>
                </div>
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                        {myIssues.map(issue => <IssueCard key={issue.id} issue={issue} />)}
                    </div>
                    <Pagination
                        page={page}
                        totalPages={data.pages}
                        onPageChange={(p) => setPage(p)}
                    />
                </>
            )}
        </div>
    );
}
