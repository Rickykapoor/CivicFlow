import { useState, useEffect } from 'react';
import { admin } from '../../api/api';
import Pagination from '../../components/Pagination';

function fmt(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

const ACTION_COLORS = {
    POST: 'var(--success)',
    PUT: 'var(--warning)',
    DELETE: 'var(--danger)',
    PATCH: 'var(--info)',
};

export default function AdminAuditLogs() {
    const [data, setData] = useState({ items: [], total: 0, pages: 1 });
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    async function load(pg = page) {
        setLoading(true);
        setError('');
        try {
            const res = await admin.auditLogs({ page: pg, page_size: 30 });
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
                <h2>Audit Logs</h2>
                <p>Full trail of all write operations on the platform</p>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : (
                <>
                    <div className="card">
                        <div className="card-header">
                            <span className="text-muted text-sm">{data.total} log entries</span>
                        </div>
                        <div className="table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Time</th>
                                        <th>Action</th>
                                        <th>Entity</th>
                                        <th>Entity ID</th>
                                        <th>User ID</th>
                                        <th>IP Address</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.items.map(log => (
                                        <tr key={log.id}>
                                            <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                                                {fmt(log.created_at)}
                                            </td>
                                            <td>
                                                <span style={{
                                                    fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.04em',
                                                    color: ACTION_COLORS[log.action] ?? 'var(--text-muted)',
                                                }}>
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.82rem' }}>{log.entity_type ?? '—'}</td>
                                            <td style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                                {log.entity_id ? log.entity_id.slice(0, 12) + '…' : '—'}
                                            </td>
                                            <td style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                                {log.user_id ? log.user_id.slice(0, 12) + '…' : 'system'}
                                            </td>
                                            <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{log.ip_address ?? '—'}</td>
                                            <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                                {log.details ? JSON.stringify(log.details) : '—'}
                                            </td>
                                        </tr>
                                    ))}
                                    {data.items.length === 0 && (
                                        <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No audit logs yet</td></tr>
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
