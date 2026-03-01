import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { admin } from '../../api/api';
import { StatusBadge, PriorityBadge } from '../../components/Badges';
import Pagination from '../../components/Pagination';

function fmt(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function overdueDiff(deadline) {
    const diff = Date.now() - new Date(deadline).getTime();
    const days = Math.floor(diff / 864e5);
    const hrs = Math.floor((diff % 864e5) / 36e5);
    return `${days}d ${hrs}h overdue`;
}

export default function AdminOverdue() {
    const [data, setData] = useState({ items: [], total: 0, pages: 1 });
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    async function load(pg = page) {
        setLoading(true);
        setError('');
        try {
            const res = await admin.overdue({ page: pg, page_size: 20 });
            setData(res.data);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { load(page); }, [page]);

    return (
        <div className="fade-in">
            <div className="page-header">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle size={22} color="var(--danger)" /> Overdue Issues
                </h2>
                <p>Issues that have breached their SLA deadline</p>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : (
                <>
                    {data.total === 0 ? (
                        <div className="card empty-state" style={{ padding: '3rem' }}>
                            <div style={{ fontSize: '2.5rem' }}>🎉</div>
                            <h3 style={{ marginTop: '0.5rem' }}>No overdue issues!</h3>
                            <p>All issues are within their SLA deadlines.</p>
                        </div>
                    ) : (
                        <>
                            <div className="alert alert-error mb-2">
                                ⚠ {data.total} issue{data.total !== 1 ? 's' : ''} have breached their SLA deadline
                            </div>
                            <div className="card">
                                <div className="table-wrap">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Title</th>
                                                <th>Status</th>
                                                <th>Priority</th>
                                                <th>SLA Deadline</th>
                                                <th>Overdue By</th>
                                                <th>Reporter</th>
                                                <th>Ward</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.items.map(i => (
                                                <tr key={i.id}>
                                                    <td>
                                                        <Link to={`/issues/${i.id}`} style={{ color: 'var(--accent)', fontWeight: 500 }}>
                                                            {i.title.length > 45 ? i.title.slice(0, 45) + '…' : i.title}
                                                        </Link>
                                                    </td>
                                                    <td><StatusBadge status={i.status} /></td>
                                                    <td><PriorityBadge priority={i.priority} /></td>
                                                    <td className="text-muted" style={{ fontSize: '0.82rem' }}>
                                                        {fmt(i.sla_deadline)}
                                                    </td>
                                                    <td>
                                                        <span style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '0.82rem' }}>
                                                            {overdueDiff(i.sla_deadline)}
                                                        </span>
                                                    </td>
                                                    <td>{i.reporter?.full_name}</td>
                                                    <td>{i.ward ?? '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <Pagination page={page} totalPages={data.pages} onPageChange={setPage} />
                        </>
                    )}
                </>
            )}
        </div>
    );
}
